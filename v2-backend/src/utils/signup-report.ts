/**
 * Aggregates `account_created` events into the admin "Sign-ups by channel" report.
 * Pure function: no Firestore access, so it is unit-tested directly.
 *
 * Identifiers only: the report carries codes, channels, counts and roles,
 * never names or emails.
 */

export const CHANNEL_LABELS: Record<string, string> = {
  design_partner: 'Design partners',
  broker: 'Brokers',
  accountant: 'Accountants',
  landlord_group: 'Landlord groups',
  landlord_referral: 'Landlord referrals',
  personal_network: 'Personal network',
  inbound: 'Inbound',
  unknown: 'Unknown code',
};

/** Channels always shown, even at zero, in this order. */
export const REPORT_CHANNELS = [
  'design_partner',
  'broker',
  'accountant',
  'landlord_group',
  'landlord_referral',
  'personal_network',
  'inbound',
];

export type RoleBucket = 'landlord' | 'tenant' | 'agent' | 'other';

export interface SignupEventInput {
  uid: string;
  at: string | null;
  signupSource: string;
  signupChannel: string;
  excluded?: boolean;
}

export interface ChannelCodeInput {
  code: string;
  channel: string;
  partner?: string | null;
  active?: boolean;
}

export interface SignupReport {
  generatedAt: string;
  weeks: number;
  totals: { allTime: number; last7Days: number; previous7Days: number; excluded: number };
  channels: Array<{
    channel: string;
    label: string;
    count: number;
    pct: number;
    last7Days: number;
    roles: Record<RoleBucket, number>;
  }>;
  codes: Array<{
    code: string;
    channel: string;
    channelLabel: string;
    partner: string | null;
    known: boolean;
    count: number;
    last7Days: number;
    lastSignupAt: string | null;
  }>;
  weekly: Array<{ weekStart: string; total: number; byChannel: Record<string, number> }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function roleBucket(role: string | null | undefined): RoleBucket {
  const r = (role || '').toLowerCase();
  return r === 'landlord' || r === 'tenant' || r === 'agent' ? r : 'other';
}

/** Monday 00:00 UTC of the week containing `d`, as YYYY-MM-DD. */
export function weekStartUtc(d: Date): string {
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return monday.toISOString().slice(0, 10);
}

function emptyRoles(): Record<RoleBucket, number> {
  return { landlord: 0, tenant: 0, agent: 0, other: 0 };
}

export function aggregateSignupsByChannel(input: {
  events: SignupEventInput[];
  channels: ChannelCodeInput[];
  roles: Map<string, string | null | undefined>;
  now?: Date;
  weeks?: number;
}): SignupReport {
  const now = input.now ?? new Date();
  const weeks = Math.min(Math.max(input.weeks ?? 12, 1), 52);
  const nowMs = now.getTime();
  const channelByCode = new Map(input.channels.map((c) => [c.code, c]));

  // One event per account: keep the earliest if duplicates ever exist.
  const byUid = new Map<string, SignupEventInput>();
  let excluded = 0;
  for (const e of input.events) {
    if (!e.uid) continue;
    if (e.excluded) {
      excluded += 1;
      continue;
    }
    const prev = byUid.get(e.uid);
    if (!prev || (e.at && (!prev.at || e.at < prev.at))) byUid.set(e.uid, e);
  }
  const events = [...byUid.values()];

  const channelRows = new Map<string, SignupReport['channels'][number]>();
  const ensureChannel = (channel: string) => {
    let row = channelRows.get(channel);
    if (!row) {
      row = { channel, label: CHANNEL_LABELS[channel] || channel, count: 0, pct: 0, last7Days: 0, roles: emptyRoles() };
      channelRows.set(channel, row);
    }
    return row;
  };
  REPORT_CHANNELS.forEach(ensureChannel);

  const codeRows = new Map<string, SignupReport['codes'][number]>();
  const weekKeys: string[] = [];
  const currentWeek = new Date(`${weekStartUtc(now)}T00:00:00Z`);
  for (let i = weeks - 1; i >= 0; i -= 1) {
    weekKeys.push(new Date(currentWeek.getTime() - i * 7 * DAY_MS).toISOString().slice(0, 10));
  }
  const weekly = new Map(weekKeys.map((k) => [k, { weekStart: k, total: 0, byChannel: {} as Record<string, number> }]));

  let last7Days = 0;
  let previous7Days = 0;

  for (const e of events) {
    const channel = e.signupChannel || 'unknown';
    const atMs = e.at ? new Date(e.at).getTime() : NaN;
    const age = Number.isFinite(atMs) ? nowMs - atMs : Infinity;
    const inLast7 = age >= 0 && age < 7 * DAY_MS;
    const inPrev7 = age >= 7 * DAY_MS && age < 14 * DAY_MS;
    if (inLast7) last7Days += 1;
    if (inPrev7) previous7Days += 1;

    const ch = ensureChannel(channel);
    ch.count += 1;
    if (inLast7) ch.last7Days += 1;
    ch.roles[roleBucket(input.roles.get(e.uid))] += 1;

    const code = e.signupSource || channel;
    let cr = codeRows.get(code);
    if (!cr) {
      const known = channelByCode.get(code);
      cr = {
        code,
        channel,
        channelLabel: CHANNEL_LABELS[channel] || channel,
        partner: known?.partner ?? null,
        known: !!known,
        count: 0,
        last7Days: 0,
        lastSignupAt: null,
      };
      codeRows.set(code, cr);
    }
    cr.count += 1;
    if (inLast7) cr.last7Days += 1;
    if (e.at && (!cr.lastSignupAt || e.at > cr.lastSignupAt)) cr.lastSignupAt = e.at;

    if (Number.isFinite(atMs)) {
      const w = weekly.get(weekStartUtc(new Date(atMs)));
      if (w) {
        w.total += 1;
        w.byChannel[channel] = (w.byChannel[channel] || 0) + 1;
      }
    }
  }

  const allTime = events.length;
  const channels = [...channelRows.values()]
    .map((r) => ({ ...r, pct: allTime ? Math.round((r.count / allTime) * 100) : 0 }))
    .sort((a, b) => {
      // Known channels keep their fixed order; extra ones (e.g. unknown) go last.
      const ia = REPORT_CHANNELS.indexOf(a.channel);
      const ib = REPORT_CHANNELS.indexOf(b.channel);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  const codes = [...codeRows.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return {
    generatedAt: now.toISOString(),
    weeks,
    totals: { allTime, last7Days, previous7Days, excluded },
    channels,
    codes,
    weekly: weekKeys.map((k) => weekly.get(k)!),
  };
}
