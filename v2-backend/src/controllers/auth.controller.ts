import { Controller, Post, Get, Req, Body, UseGuards, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';
import { SignupAttributionService } from '../services/signup-attribution.service';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['tenant', 'landlord', 'agent'], description: 'Desired user role' })
  @IsString()
  @IsIn(['tenant', 'landlord', 'agent'])
  role: string;

  @ApiProperty({ required: false, description: 'Source trigger for role selection', default: 'manual_select' })
  @IsOptional()
  @IsString()
  source?: string;
}

export class SignupAttributionDto {
  @ApiProperty({ required: false, description: 'Channel or partner code from a /join/<code> link' })
  @IsOptional()
  @IsString()
  code?: string;
}

@ApiTags('Auth')
@ApiBearerAuth('bearer')
@Controller('auth')
export class AuthController {
  constructor(private readonly signupAttribution: SignupAttributionService) {}

  @Post('attribution')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Record where a new account came from (write-once, first touch wins)' })
  @ApiBody({ type: SignupAttributionDto })
  @ApiResponse({ status: 200, description: 'Attribution recorded, or the existing one returned' })
  async recordAttribution(@Req() req: any, @Body() body: SignupAttributionDto) {
    const uid = req.user?.uid;
    try {
      const result = await this.signupAttribution.recordAttribution(uid, body?.code);
      return { success: true, ...(result || {}) };
    } catch (error: any) {
      console.error(`[AuthController] Signup attribution failed for uid=${uid}:`, error?.message || error);
      return { success: false };
    }
  }

  @Get('me')
  @Post('me')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user identity and role' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile details' })
  @ApiResponse({ status: 401, description: 'Missing or invalid authentication token' })
  async getMe(@Req() req: any) {
    const user = req.user;
    let role = user.role;
    if (!role && admin.apps.length) {
      try {
        const db = admin.firestore();
        const uDoc = await db.collection('users').doc(user.uid).get();
        if (uDoc.exists) {
          const u = uDoc.data();
          role = u?.role || u?.primaryRole || (Array.isArray(u?.roles) && u.roles.length > 0 ? u.roles[0] : null);
        }
        if (!role) {
          const tSnap = await db.collection('tenants').where('authUid', '==', user.uid).limit(1).get();
          if (!tSnap.empty) {
            role = 'tenant';
          } else {
            const tSnap2 = await db.collection('tenants').where('tenantUserId', '==', user.uid).limit(1).get();
            if (!tSnap2.empty) role = 'tenant';
          }
        }
      } catch {}
    }
    return {
      uid: user.uid,
      email: user.email,
      role: role || null,
    };
  }

  @Post('role')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Assign or update authenticated user role' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role provided' })
  @ApiResponse({ status: 403, description: 'Tenants cannot switch to Landlord or Agent' })
  async updateRole(@Req() req: any, @Body() body: UpdateRoleDto) {
    const uid = req.user?.uid;
    const email = req.user?.email || '';
    const { role, source = 'manual_select' } = body;

    if (!role || !['tenant', 'landlord', 'agent'].includes(role)) {
      throw new BadRequestException('Invalid role. Must be tenant, landlord, or agent.');
    }

    // Enforce Rule: Tenants CANNOT upgrade/switch to Landlord or Agent.
    const currentRole = req.user?.role;
    if (currentRole === 'tenant' && (role === 'landlord' || role === 'agent')) {
      throw new ForbiddenException('Tenants cannot switch to a Landlord profile.');
    }

    try {
      if (admin.apps.length) {
        await admin.firestore().collection('users').doc(uid).set({
          uid,
          email: email.toLowerCase().trim(),
          role,
          roleAssignedAt: new Date().toISOString(),
          roleSource: source,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      return {
        success: true,
        role,
      };
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[AuthController] Error updating user role:', error);
      return {
        success: false,
        error: error?.message || 'Failed to update user role',
      };
    }
  }
}
