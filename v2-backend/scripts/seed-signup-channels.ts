/**
 * Upserts scripts/signup-channels.config.ts into Firestore `signup_channels`
 * and writes the links sheet (scripts/output/signup-links.csv).
 *
 *   npm run seed:signup-channels            # write to Firestore + CSV
 *   npm run seed:signup-channels -- --dry   # CSV only, no Firestore writes
 *
 * Link base defaults to https://proptii.co; override with SIGNUP_LINK_BASE.
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SIGNUP_CHANNEL_ROWS } from './signup-channels.config';
import { normalizeSignupCode } from '../src/utils/signup-attribution';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dryRun = process.argv.includes('--dry');
const linkBase = (process.env.SIGNUP_LINK_BASE || 'https://proptii.co').replace(/\/+$/, '');

function validate() {
  const seen = new Set<string>();
  for (const row of SIGNUP_CHANNEL_ROWS) {
    const code = normalizeSignupCode(row.code);
    if (!code || code !== row.code) throw new Error(`Invalid code "${row.code}": use lower-case letters, numbers, hyphens`);
    if (seen.has(code)) throw new Error(`Duplicate code "${code}"`);
    seen.add(code);
  }
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function writeCsv() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const lines = [['channel', 'partner', 'code', 'link', 'active'].join(',')];
  for (const r of SIGNUP_CHANNEL_ROWS) {
    lines.push(
      [r.channel, r.partner || '', r.code, `${linkBase}/join/${r.code}`, String(r.active !== false)]
        .map(csvCell)
        .join(','),
    );
  }
  const file = path.join(outDir, 'signup-links.csv');
  fs.writeFileSync(file, lines.join('\n') + '\n');
  console.log(`Links sheet: ${file}`);
}

async function upsertFirestore() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json)),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  const db = admin.firestore();
  const batch = db.batch();
  for (const r of SIGNUP_CHANNEL_ROWS) {
    batch.set(
      db.collection('signup_channels').doc(r.code),
      {
        code: r.code,
        channel: r.channel,
        partner: r.partner || null,
        active: r.active !== false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  await batch.commit();
  console.log(`Upserted ${SIGNUP_CHANNEL_ROWS.length} rows into signup_channels`);
}

async function main() {
  validate();
  if (!dryRun) await upsertFirestore();
  else console.log('Dry run: Firestore not touched');
  writeCsv();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
