import { describe, it, expect } from 'vitest';
import { aggregateSignupsByChannel, weekStartUtc } from './signup-report';

// Friday 20 Nov 2026, 12:00 UTC. Week starts Monday 16 Nov.
const now = new Date('2026-11-20T12:00:00Z');
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

const channels = [
  { code: 'pn', channel: 'personal_network', partner: 'Personal network' },
  { code: 'broker-acme', channel: 'broker', partner: 'Acme Brokers' },
];

describe('weekStartUtc', () => {
  it('returns the Monday of the week', () => {
    expect(weekStartUtc(new Date('2026-11-20T12:00:00Z'))).toBe('2026-11-16');
    expect(weekStartUtc(new Date('2026-11-16T00:00:00Z'))).toBe('2026-11-16');
    expect(weekStartUtc(new Date('2026-11-22T23:59:59Z'))).toBe('2026-11-16');
  });
});

describe('aggregateSignupsByChannel', () => {
  const events = [
    { uid: 'a', at: daysAgo(1), signupSource: 'pn', signupChannel: 'personal_network' },
    { uid: 'b', at: daysAgo(2), signupSource: 'broker-acme', signupChannel: 'broker' },
    { uid: 'c', at: daysAgo(9), signupSource: 'broker-acme', signupChannel: 'broker' },
    { uid: 'd', at: daysAgo(3), signupSource: 'typo', signupChannel: 'unknown' },
    { uid: 'e', at: daysAgo(1), signupSource: 'inbound', signupChannel: 'inbound' },
    { uid: 't', at: daysAgo(1), signupSource: 'pn', signupChannel: 'personal_network', excluded: true },
  ];
  const roles = new Map<string, string>([['a', 'landlord'], ['b', 'landlord'], ['c', 'agent'], ['d', 'tenant']]);
  const report = aggregateSignupsByChannel({ events, channels, roles, now, weeks: 4 });

  it('counts totals and leaves excluded accounts out', () => {
    expect(report.totals).toEqual({ allTime: 5, last7Days: 4, previous7Days: 1, excluded: 1 });
  });

  it('lists every channel in fixed order, with unknown last', () => {
    expect(report.channels.map((c) => c.channel)).toEqual([
      'design_partner', 'broker', 'accountant', 'landlord_group',
      'landlord_referral', 'personal_network', 'inbound', 'unknown',
    ]);
    const broker = report.channels.find((c) => c.channel === 'broker')!;
    expect(broker).toMatchObject({ label: 'Brokers', count: 2, pct: 40, last7Days: 1 });
    expect(broker.roles).toEqual({ landlord: 1, tenant: 0, agent: 1, other: 0 });
    expect(report.channels.find((c) => c.channel === 'design_partner')!.count).toBe(0);
  });

  it('breaks down by code with partner names and flags unknown codes', () => {
    const acme = report.codes.find((c) => c.code === 'broker-acme')!;
    expect(acme).toMatchObject({ partner: 'Acme Brokers', known: true, count: 2, last7Days: 1 });
    expect(report.codes.find((c) => c.code === 'typo')).toMatchObject({ known: false, channel: 'unknown' });
    expect(report.codes[0].code).toBe('broker-acme'); // highest count first
  });

  it('builds a weekly series oldest to newest with zero weeks', () => {
    expect(report.weekly.map((w) => w.weekStart)).toEqual(['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']);
    expect(report.weekly[3].total).toBe(4);
    expect(report.weekly[2]).toMatchObject({ total: 1, byChannel: { broker: 1 } });
    expect(report.weekly[0].total).toBe(0);
  });

  it('counts an account once if it has duplicate events', () => {
    const dup = aggregateSignupsByChannel({
      events: [
        { uid: 'x', at: daysAgo(1), signupSource: 'pn', signupChannel: 'personal_network' },
        { uid: 'x', at: daysAgo(5), signupSource: 'pn', signupChannel: 'personal_network' },
      ],
      channels,
      roles: new Map(),
      now,
    });
    expect(dup.totals.allTime).toBe(1);
  });

  it('clamps weeks to 1-52 and handles no events', () => {
    const empty = aggregateSignupsByChannel({ events: [], channels: [], roles: new Map(), now, weeks: 500 });
    expect(empty.weekly).toHaveLength(52);
    expect(empty.totals.allTime).toBe(0);
    expect(empty.channels.every((c) => c.pct === 0)).toBe(true);
  });
});
