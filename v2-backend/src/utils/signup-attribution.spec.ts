import { describe, it, expect } from 'vitest';
import {
  decideAttribution,
  normalizeSignupCode,
  NEW_ACCOUNT_WINDOW_MS,
} from './signup-attribution';

const now = new Date('2026-11-18T12:00:00Z');
const justCreated = new Date(now.getTime() - 60 * 1000);
const oldAccount = new Date(now.getTime() - NEW_ACCOUNT_WINDOW_MS - 1000);

describe('normalizeSignupCode', () => {
  it('lower-cases and trims valid codes', () => {
    expect(normalizeSignupCode('  Broker-Acme ')).toBe('broker-acme');
  });

  it('rejects empty, non-string and malformed codes', () => {
    expect(normalizeSignupCode('')).toBeNull();
    expect(normalizeSignupCode(undefined)).toBeNull();
    expect(normalizeSignupCode(42)).toBeNull();
    expect(normalizeSignupCode('has space')).toBeNull();
    expect(normalizeSignupCode('someone@example.com')).toBeNull();
    expect(normalizeSignupCode('-leading')).toBeNull();
    expect(normalizeSignupCode('a'.repeat(49))).toBeNull();
  });
});

describe('decideAttribution', () => {
  it('records inbound for a new account with no code', () => {
    expect(decideAttribution({ code: null, channelRecord: null, accountCreatedAt: justCreated, now })).toEqual({
      signupSource: 'inbound',
      signupChannel: 'inbound',
      isNewAccount: true,
    });
  });

  it('records the code and channel for a known active code', () => {
    const d = decideAttribution({
      code: 'broker-acme',
      channelRecord: { code: 'broker-acme', channel: 'broker', active: true },
      accountCreatedAt: justCreated,
      now,
    });
    expect(d).toEqual({ signupSource: 'broker-acme', signupChannel: 'broker', isNewAccount: true });
  });

  it('keeps an unknown code visible with channel unknown', () => {
    const d = decideAttribution({ code: 'typo-code', channelRecord: null, accountCreatedAt: justCreated, now });
    expect(d).toEqual({ signupSource: 'typo-code', signupChannel: 'unknown', isNewAccount: true });
  });

  it('treats an inactive code as unknown', () => {
    const d = decideAttribution({
      code: 'lg-old',
      channelRecord: { code: 'lg-old', channel: 'landlord_group', active: false },
      accountCreatedAt: justCreated,
      now,
    });
    expect(d.signupChannel).toBe('unknown');
  });

  it('tags accounts older than the window as legacy, with no event', () => {
    const d = decideAttribution({
      code: 'broker-acme',
      channelRecord: { code: 'broker-acme', channel: 'broker' },
      accountCreatedAt: oldAccount,
      now,
    });
    expect(d).toEqual({ signupSource: 'legacy', signupChannel: 'legacy', isNewAccount: false });
  });

  it('tags accounts with unknown creation time as legacy', () => {
    const d = decideAttribution({ code: null, channelRecord: null, accountCreatedAt: null, now });
    expect(d.isNewAccount).toBe(false);
  });
});
