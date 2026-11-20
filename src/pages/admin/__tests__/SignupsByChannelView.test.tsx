import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { AdminSignupReport } from '../../../services/adminDashboardService';

const report: AdminSignupReport = {
  generatedAt: '2026-11-20T09:00:00.000Z',
  weeks: 12,
  totals: { allTime: 5, last7Days: 4, previous7Days: 2, excluded: 1 },
  channels: [
    { channel: 'design_partner', label: 'Design partners', count: 0, pct: 0, last7Days: 0, roles: { landlord: 0, tenant: 0, agent: 0, other: 0 } },
    { channel: 'broker', label: 'Brokers', count: 3, pct: 60, last7Days: 2, roles: { landlord: 2, tenant: 0, agent: 1, other: 0 } },
    { channel: 'personal_network', label: 'Personal network', count: 1, pct: 20, last7Days: 1, roles: { landlord: 1, tenant: 0, agent: 0, other: 0 } },
    { channel: 'unknown', label: 'Unknown code', count: 1, pct: 20, last7Days: 1, roles: { landlord: 0, tenant: 1, agent: 0, other: 0 } },
  ],
  codes: [
    { code: 'broker-acme', channel: 'broker', channelLabel: 'Brokers', partner: 'Acme Brokers', known: true, count: 3, last7Days: 2, lastSignupAt: '2026-11-19T10:00:00.000Z' },
    { code: 'typo', channel: 'unknown', channelLabel: 'Unknown code', partner: null, known: false, count: 1, last7Days: 1, lastSignupAt: '2026-11-18T10:00:00.000Z' },
  ],
  weekly: [
    { weekStart: '2026-11-09', total: 1, byChannel: { broker: 1 } },
    { weekStart: '2026-11-16', total: 4, byChannel: { broker: 2, personal_network: 1, unknown: 1 } },
  ],
};

const signupsByChannel = vi.fn();
vi.mock('../../../services/adminDashboardService', () => ({
  default: { signupsByChannel: (...args: unknown[]) => signupsByChannel(...args) },
}));

import { SignupsByChannelView } from '../SignupsByChannelView';

describe('SignupsByChannelView', () => {
  beforeEach(() => {
    signupsByChannel.mockReset();
  });

  it('shows totals, channels, weeks and codes from the report', async () => {
    signupsByChannel.mockResolvedValue(report);
    render(<SignupsByChannelView />);

    expect(await screen.findByText('By channel')).toBeInTheDocument();
    expect(signupsByChannel).toHaveBeenCalledWith(12);
    expect(screen.getByText('+2 (+100%) vs prior 7 days')).toBeInTheDocument();

    const byChannel = screen.getByText('By channel').closest('.pa-card') as HTMLElement;
    const brokerRow = within(byChannel).getByText('Brokers').closest('tr') as HTMLElement;
    expect(within(brokerRow).getAllByText('3').length).toBeGreaterThan(0);
    expect(within(brokerRow).getByText('60%')).toBeInTheDocument();

    const byWeek = screen.getByText('By week').closest('.pa-card') as HTMLElement;
    // Only channels with sign-ups in the window get a column.
    expect(within(byWeek).queryByText('Design partners')).toBeNull();
    expect(within(byWeek).getByText('Brokers')).toBeInTheDocument();

    const byCode = screen.getByText('By link code').closest('.pa-card') as HTMLElement;
    expect(within(byCode).getByText('Acme Brokers')).toBeInTheDocument();
    expect(within(byCode).getByText('not in link list')).toBeInTheDocument();
  });

  it('shows an error when the report fails to load', async () => {
    signupsByChannel.mockRejectedValue(new Error('Forbidden'));
    render(<SignupsByChannelView />);
    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });
});
