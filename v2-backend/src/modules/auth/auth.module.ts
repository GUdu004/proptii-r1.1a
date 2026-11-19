import { Module } from '@nestjs/common';
import { AuthController } from '../../controllers/auth.controller';
import { UserProfileController } from '../../controllers/user-profile.controller';
import { UserProfileService } from '../../services/user-profile.service';
import { SignupAttributionService } from '../../services/signup-attribution.service';

@Module({
  controllers: [AuthController, UserProfileController],
  providers: [UserProfileService, SignupAttributionService],
  exports: [UserProfileService],
})
export class AuthModule {}
