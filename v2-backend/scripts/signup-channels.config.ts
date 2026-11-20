/**
 * Sign-up link registry. The rows live in signup-channels.json (next to this
 * file) so the frontend build can read them too: it writes a real page for
 * each /join/<code> link so the link returns HTTP 200 instead of 404.
 *
 * One row per channel, plus one per partner you want to measure separately:
 *   { "code": "broker-<firm-slug>", "channel": "broker", "partner": "<Broker firm>" }
 * Codes: lower-case letters, numbers and hyphens, max 48. Never put a person's
 * name or email in a code; use a firm or group slug.
 *
 * After editing the JSON:
 *  1. npm run seed:signup-channels  (in v2-backend) upserts the rows into
 *     Firestore `signup_channels` and writes scripts/output/signup-links.csv.
 *  2. Deploy the frontend so the new /join/<code> pages exist.
 *
 * To retire a link, set "active": false (sign-ups then record channel "unknown").
 */
export interface SignupChannelRow {
  code: string;
  channel:
    | 'design_partner'
    | 'broker'
    | 'accountant'
    | 'landlord_group'
    | 'landlord_referral'
    | 'personal_network'
    | 'inbound';
  /** Firm, group or partner label for the sheet. Not a person's name. */
  partner?: string;
  active?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const SIGNUP_CHANNEL_ROWS: SignupChannelRow[] = require('./signup-channels.json');
