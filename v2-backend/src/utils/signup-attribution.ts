/**
 * Signup attribution: which channel or partner a new account came from.
 *
 * Links look like https://proptii.co/join/<code>. The frontend stores the first
 * code a visitor arrives with and sends it once after their first sign-in
 * (POST /auth/attribution). The code is checked against the `signup_channels`
 * Firestore collection and written once to `users/{uid}`; first touch wins.
 *
 * Codes and channel names are identifiers only. Never put names, emails or
 * addresses in a code, a log line or an event.
 */

export const SIGNUP_CHANNELS = [
  'design_partner',
  'broker',
  'accountant',
  'landlord_group',
  'landlord_referral',
  'personal_network',
  'inbound',
] as const;

export type SignupChannel = (typeof SIGNUP_CHANNELS)[number];

/** Sources recorded when there is no valid channel code. */
export const INBOUND_SOURCE = 'inbound';
export const UNKNOWN_CHANNEL = 'unknown';
/** Accounts created before tracking started are tagged once and never get an event. */
export const LEGACY_SOURCE = 'legacy';

/** An account counts as new for attribution if it was created within this window. */
export const NEW_ACCOUNT_WINDOW_MS = 24 * 60 * 60 * 1000;

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

/** Lower-cases and trims a code; returns null if it is empty or not a valid code shape. */
export function normalizeSignupCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export interface ChannelRecord {
  code: string;
  channel: string;
  active?: boolean;
}

export interface AttributionDecision {
  signupSource: string;
  signupChannel: string;
  /** True when this is a genuinely new account and an account_created event should be written. */
  isNewAccount: boolean;
}

/**
 * Decides what to record for a user who has no attribution yet.
 *
 * - Old account (created before the window): tagged `legacy`, no event.
 * - New account, no code: `inbound`.
 * - New account, code matches an active channel: that code and its channel.
 * - New account, code unknown or inactive: the code with channel `unknown`,
 *   so a mistyped or retired link shows up instead of disappearing into inbound.
 */
export function decideAttribution(input: {
  code: string | null;
  channelRecord: ChannelRecord | null;
  accountCreatedAt: Date | null;
  now?: Date;
}): AttributionDecision {
  const now = input.now ?? new Date();
  const created = input.accountCreatedAt;
  const isNewAccount = !!created && now.getTime() - created.getTime() <= NEW_ACCOUNT_WINDOW_MS;

  if (!isNewAccount) {
    return { signupSource: LEGACY_SOURCE, signupChannel: LEGACY_SOURCE, isNewAccount: false };
  }

  if (!input.code) {
    return { signupSource: INBOUND_SOURCE, signupChannel: 'inbound', isNewAccount: true };
  }

  const rec = input.channelRecord;
  if (rec && rec.active !== false && rec.channel) {
    return { signupSource: input.code, signupChannel: rec.channel, isNewAccount: true };
  }

  return { signupSource: input.code, signupChannel: UNKNOWN_CHANNEL, isNewAccount: true };
}
