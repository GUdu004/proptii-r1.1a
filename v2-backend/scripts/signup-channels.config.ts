/**
 * Sign-up link registry. One row per channel, plus one per partner you want to
 * measure separately. Codes: lower-case letters, numbers and hyphens, max 48.
 * Never put a person's name or email in a code; use a firm or group slug.
 *
 * After editing, run:  npm run seed:signup-channels
 * That upserts these rows into Firestore `signup_channels` and writes the
 * links sheet for the CEO to scripts/output/signup-links.csv.
 *
 * To retire a link, set active: false (sign-ups then record channel "unknown").
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

export const SIGNUP_CHANNEL_ROWS: SignupChannelRow[] = [
  // Channel-level codes: usable today
  { code: 'dp', channel: 'design_partner', partner: 'Design partners (general)' },
  { code: 'broker', channel: 'broker', partner: 'Brokers (general)' },
  { code: 'acct', channel: 'accountant', partner: 'Accountants (general)' },
  { code: 'lg', channel: 'landlord_group', partner: 'Landlord groups (general)' },
  { code: 'ref', channel: 'landlord_referral', partner: 'Landlord referrals (general)' },
  { code: 'pn', channel: 'personal_network', partner: 'Personal network' },
  { code: 'inbound', channel: 'inbound', partner: 'Inbound (website, search, social)' },

  // Per-partner codes: add one row each, e.g.
  // { code: 'dp-<partner-slug>', channel: 'design_partner', partner: '<Partner firm>' },
  // { code: 'broker-<firm-slug>', channel: 'broker', partner: '<Broker firm>' },
  // { code: 'acct-<firm-slug>', channel: 'accountant', partner: '<Accounting firm>' },
  // { code: 'lg-<group-slug>', channel: 'landlord_group', partner: '<Landlord group>' },
];
