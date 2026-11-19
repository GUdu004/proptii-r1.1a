/**
 * Signup attribution (browser side).
 *
 * A visitor arriving via /join/<code> or any page with ?ref=<code> has the code
 * stored here. The FIRST code wins and is kept for 30 days. After the visitor's
 * first sign-in, SignupAttributionBridge sends it once to POST /auth/attribution,
 * which writes it to their account. No personal data is stored: codes only.
 */

const CODE_KEY = 'proptii_signup_ref';
const SENT_PREFIX = 'proptii_attribution_sent_';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

interface StoredCode {
  code: string;
  at: number;
}

export function normalizeSignupCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** Stores the code if none is stored yet (first touch wins). Returns the stored code. */
export function captureSignupCode(raw: string | null | undefined, now = Date.now()): string | null {
  const existing = getStoredSignupCode(now);
  if (existing) return existing;
  const code = normalizeSignupCode(raw);
  if (!code) return null;
  try {
    localStorage.setItem(CODE_KEY, JSON.stringify({ code, at: now } satisfies StoredCode));
  } catch {
    /* storage unavailable: attribution falls back to inbound */
  }
  return code;
}

export function getStoredSignupCode(now = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(CODE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCode;
    if (!parsed?.code || typeof parsed.at !== 'number' || now - parsed.at > MAX_AGE_MS) {
      localStorage.removeItem(CODE_KEY);
      return null;
    }
    return normalizeSignupCode(parsed.code);
  } catch {
    return null;
  }
}

export function hasSentAttribution(uid: string): boolean {
  try {
    return localStorage.getItem(SENT_PREFIX + uid) === '1';
  } catch {
    return false;
  }
}

export function markAttributionSent(uid: string): void {
  try {
    localStorage.setItem(SENT_PREFIX + uid, '1');
    localStorage.removeItem(CODE_KEY);
  } catch {
    /* ignore */
  }
}
