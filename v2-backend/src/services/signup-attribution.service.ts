import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import {
  ChannelRecord,
  decideAttribution,
  normalizeSignupCode,
} from '../utils/signup-attribution';

export interface AttributionResult {
  recorded: boolean;
  signupSource: string;
  signupChannel: string;
}

/**
 * Writes a user's signup source once. Collections:
 *  - signup_channels/{code}: { code, channel, partner?, active } — the link registry
 *  - users/{uid}: signupSource, signupChannel, signupAttributedAt (write-once)
 *  - events/{auto}: { type: 'account_created', uid, signupSource, signupChannel, at }
 */
@Injectable()
export class SignupAttributionService {
  private readonly logger = new Logger(SignupAttributionService.name);

  async recordAttribution(uid: string, rawCode: unknown): Promise<AttributionResult | null> {
    if (!admin.apps.length || !uid) return null;
    const db = admin.firestore();
    const code = normalizeSignupCode(rawCode);

    let channelRecord: ChannelRecord | null = null;
    if (code) {
      const snap = await db.collection('signup_channels').doc(code).get();
      channelRecord = snap.exists ? (snap.data() as ChannelRecord) : null;
    }

    let accountCreatedAt: Date | null = null;
    try {
      const authUser = await admin.auth().getUser(uid);
      const t = authUser.metadata?.creationTime;
      accountCreatedAt = t ? new Date(t) : null;
    } catch (err: any) {
      this.logger.warn(`Could not read auth metadata for uid=${uid}: ${err?.message || err}`);
    }

    const decision = decideAttribution({ code, channelRecord, accountCreatedAt });
    const userRef = db.collection('users').doc(uid);

    const result = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const existing = userSnap.exists ? userSnap.data() : null;
      if (existing?.signupSource) {
        return {
          recorded: false,
          signupSource: existing.signupSource as string,
          signupChannel: (existing.signupChannel as string) || '',
        };
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      tx.set(
        userRef,
        {
          uid,
          signupSource: decision.signupSource,
          signupChannel: decision.signupChannel,
          signupAttributedAt: now,
        },
        { merge: true },
      );

      if (decision.isNewAccount) {
        tx.set(db.collection('events').doc(), {
          type: 'account_created',
          uid,
          signupSource: decision.signupSource,
          signupChannel: decision.signupChannel,
          at: now,
        });
      }

      return {
        recorded: true,
        signupSource: decision.signupSource,
        signupChannel: decision.signupChannel,
      };
    });

    if (result.recorded) {
      this.logger.log(
        `Signup attribution uid=${uid} source=${result.signupSource} channel=${result.signupChannel}`,
      );
    }
    return result;
  }
}
