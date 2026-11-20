/**
 * Copy index.html to deep client-route paths so Stripe return URLs, passport
 * links, and hard refreshes work on static hosts that only serve real files.
 *
 * Render serves public/404.html for any path that is not a file, and it does
 * not apply _redirects. Ensuring dist/landlord/index.html is the SPA shell
 * allows hard refreshes on /landlord to boot the unified React SPA with full
 * AuthProvider context instead of a broken standalone bundle.
 */
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const INDEX = path.join(DIST, 'index.html');
const SIGNUP_CHANNELS = path.resolve(__dirname, '..', 'v2-backend', 'scripts', 'signup-channels.json');
const SIGNUP_CODE_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;

/**
 * One join/<code> path per sign-up channel code, so /join/<code> links return
 * HTTP 200 (link previews and email scanners treat a 404 as a broken link).
 * Codes not in the list still work through 404.html, just with a 404 status.
 */
function joinRouteDirs() {
  try {
    const rows = JSON.parse(fs.readFileSync(SIGNUP_CHANNELS, 'utf8'));
    return rows
      .map((r) => r && r.code)
      .filter((code) => typeof code === 'string' && SIGNUP_CODE_PATTERN.test(code))
      .map((code) => `join/${code}`);
  } catch (err) {
    console.warn(`copy-spa-fallbacks: could not read sign-up channels (${err.message}); skipping /join pages`);
    return [];
  }
}

/** Paths that must load the SPA shell (no leading/trailing slashes). */
const SPA_ROUTE_DIRS = [
  'billing/confirmed',
  'billing/activate',
  'signup',
  'signup/pay-now',
  'signup/welcome',
  'signup/create-account',
  'pricing',
  'pricing/confirmed',
  'select-role',
  'login',
  'dashboard',
  'dashboard/settings',
  'dashboard/tenant-referencing',
  'admin',
  'admin/leads',
  'ProptiiAdmin',
  'view-passport',
  'claim-referencing',
  'referencing',
  'referencing/invite',
  'landlord',
  'landlord-demo',
  'landlord/dashboard',
  'landlord/properties',
  'landlord/documents',
  'landlord/contracts',
  'landlord/clients',
  'landlord/viewings',
  'landlord/insights',
  'landlord/inbox',
  'landlord/messages',
  'landlord/settings',
  'landlord/referencing',
  'agent',
];

function main() {
  if (!fs.existsSync(INDEX)) {
    console.error('copy-spa-fallbacks: dist/index.html not found — run vite build first');
    process.exit(1);
  }

  const indexHtml = fs.readFileSync(INDEX, 'utf8');
  let created = 0;
  const routeDirs = [...SPA_ROUTE_DIRS, ...joinRouteDirs()];

  for (const routeDir of routeDirs) {
    const dir = path.join(DIST, routeDir);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, 'index.html');
    fs.writeFileSync(target, indexHtml);
    created += 1;
  }

  // Also write 200.html fallback for hosts supporting standard SPA rewrites
  fs.writeFileSync(path.join(DIST, '200.html'), indexHtml);
  // Unknown paths, including /referencing/view/<token> from emails already sent,
  // must boot the app. Render serves this file with a 404 status; the document
  // is still the SPA, so client routes render instead of the static 404 page.
  fs.writeFileSync(path.join(DIST, '404.html'), indexHtml);

  console.log(
    `copy-spa-fallbacks: ensured ${routeDirs.length} SPA shell paths (${created} written)`,
  );
}

main();
