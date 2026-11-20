/**
 * C1 — landlord account verification + ready-to-publish client helpers.
 * Gate enforcement lives on the backend; these calls are for UI messaging only.
 */
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';

const API_BASE = () => getResolvedApiBaseUrl();

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessTokenForApiRequest().catch(() => null);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type VerificationKind = 'photo_id' | 'proof_of_address';

export async function getAccountVerification() {
  const res = await fetch(`${API_BASE()}/users/me/verification`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load verification (${res.status})`);
  return res.json();
}

export async function upsertAccountVerification(
  kind: VerificationKind,
  meta: { storagePath: string; fileName: string; contentType?: string },
) {
  const res = await fetch(`${API_BASE()}/users/me/verification/${kind}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(meta),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to save verification (${res.status})`);
  }
  return res.json();
}

/** Upload ID / PoA into documents/{uid}/verification/… then persist users.verification */
export async function uploadAccountVerificationFile(
  kind: VerificationKind,
  file: File,
): Promise<void> {
  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('folder', `documents/verification/${kind}`);
  const token = await getAccessTokenForApiRequest().catch(() => null);
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const uploadRes = await fetch(`${API_BASE()}/storage/upload`, { method: 'POST', headers, body: fd });
  if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);
  const uploaded = await uploadRes.json();
  const storagePath = uploaded.storagePath || uploaded.fullPath;
  if (!storagePath) throw new Error('Upload did not return storagePath');
  await upsertAccountVerification(kind, {
    storagePath,
    fileName: file.name,
    contentType: file.type || uploaded.contentType,
  });
}

export async function getReadyToPublish(propertyId: string): Promise<{
  ok: boolean;
  missing: string[];
  gateEnabled: boolean;
}> {
  const res = await fetch(`${API_BASE()}/native-properties/${encodeURIComponent(propertyId)}/ready-to-publish`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    // Soft-fail so publish path still hits server enforcement
    return { ok: true, missing: [], gateEnabled: false };
  }
  return res.json();
}

export function formatMissingVerification(missing: string[]): string {
  const labels: Record<string, string> = {
    photo_id: 'Photo ID',
    proof_of_address: 'Proof of address',
    'gas-cert': 'Gas Safety Certificate',
    eicr: 'EICR',
    epc: 'EPC (with rating)',
    'deposit-protection': 'Deposit commitment (amount + protection confirmation)',
  };
  return missing.map((m) => labels[m] || m).join(', ');
}

export const C1_REQUIRED_LABELS = [
  'Photo ID',
  'Proof of address',
  'Gas Safety Certificate',
  'EICR',
  'EPC (with rating)',
  'Deposit commitment (amount + protection confirmation)',
] as const;

/**
 * Client-side readiness for wizard UI (disable Publish). Server still enforces.
 * Wizard uploads are untyped File[] — property compliance types are treated as
 * missing unless typed docs are passed in (e.g. edit flow).
 *
 * Deposit protection at listing time is a Yes/No commitment (+ amount), not a
 * document upload — pass depositSatisfied from the wizard commitment form.
 */
export async function getPublishGateStatus(opts?: {
  propertyDocs?: Array<{ type?: string; epcRating?: string; rating?: string }>;
  /** True when landlord answered No, or Yes with amount + protection confirmation */
  depositSatisfied?: boolean;
}): Promise<{ gateEnabled: boolean; canPublish: boolean; missing: string[] }> {
  let gateEnabled = false;
  try {
    const flagsRes = await fetch(`${API_BASE()}/flags`);
    if (flagsRes.ok) {
      const flags = await flagsRes.json();
      gateEnabled = Boolean(flags?.c1_verification_gate);
    }
  } catch {
    gateEnabled = false;
  }

  if (!gateEnabled) {
    return { gateEnabled: false, canPublish: true, missing: [] };
  }

  const missing: string[] = [];
  const verification = await getAccountVerification().catch(() => null);
  if (!verification?.photoId?.storagePath && !verification?.photoId?.submittedAt) {
    missing.push('photo_id');
  }
  if (!verification?.proofOfAddress?.storagePath && !verification?.proofOfAddress?.submittedAt) {
    missing.push('proof_of_address');
  }

  const docs = Array.isArray(opts?.propertyDocs) ? opts!.propertyDocs! : [];
  const hasType = (t: string) =>
    docs.some((d) => String(d?.type || '').toLowerCase() === t.toLowerCase());
  const hasEpc = docs.some((d) => {
    if (String(d?.type || '').toLowerCase() !== 'epc') return false;
    const rating = d?.epcRating ?? d?.rating;
    return typeof rating === 'string' && rating.trim().length > 0;
  });

  if (!hasType('gas-cert')) missing.push('gas-cert');
  if (!hasType('eicr')) missing.push('eicr');
  if (!hasEpc) missing.push('epc');
  // Prefer listing-time commitment; fall back to legacy deposit-protection document
  if (!opts?.depositSatisfied && !hasType('deposit-protection')) {
    missing.push('deposit-protection');
  }

  return { gateEnabled: true, canPublish: missing.length === 0, missing };
}
