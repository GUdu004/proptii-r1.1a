import { describe, it, expect, beforeEach } from 'vitest';
import {
  captureSignupCode,
  getStoredSignupCode,
  hasSentAttribution,
  markAttributionSent,
  normalizeSignupCode,
} from '../signupAttribution';

describe('signupAttribution', () => {
  beforeEach(() => localStorage.clear());

  it('normalizes and rejects bad codes', () => {
    expect(normalizeSignupCode(' Broker-ACME ')).toBe('broker-acme');
    expect(normalizeSignupCode('a@b.com')).toBeNull();
    expect(normalizeSignupCode('')).toBeNull();
  });

  it('keeps the first code (first touch wins)', () => {
    captureSignupCode('broker-acme');
    captureSignupCode('acct-other');
    expect(getStoredSignupCode()).toBe('broker-acme');
  });

  it('ignores invalid codes without overwriting', () => {
    expect(captureSignupCode('not valid!')).toBeNull();
    expect(getStoredSignupCode()).toBeNull();
  });

  it('expires codes after 30 days', () => {
    const start = Date.now();
    captureSignupCode('lg', start);
    expect(getStoredSignupCode(start + 29 * 86400000)).toBe('lg');
    expect(getStoredSignupCode(start + 31 * 86400000)).toBeNull();
  });

  it('marks sent per user and clears the stored code', () => {
    captureSignupCode('pn');
    expect(hasSentAttribution('uid1')).toBe(false);
    markAttributionSent('uid1');
    expect(hasSentAttribution('uid1')).toBe(true);
    expect(hasSentAttribution('uid2')).toBe(false);
    expect(getStoredSignupCode()).toBeNull();
  });
});
