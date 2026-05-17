// InternConnect integration test — exercises the live API end-to-end.
// Grows one section per phase; verifies modules work together, not just alone.
// Usage: node server/tests/integration.mjs   (server must be running, DB seeded)

const BASE = process.env.BASE_URL || 'http://localhost:5000';
let passed = 0;
let failed = 0;
const lines = [];

function check(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    lines.push(`  ✓ ${name}`);
  } else {
    failed += 1;
    lines.push(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json };
}

// Shared state across phase sections.
const ctx = {};

// ── Phase 1 — data layer + auth smoke ──
async function phase1() {
  lines.push('Phase 1 — data layer & auth');

  const health = await api('/api/health');
  check('health endpoint responds', health.status === 200 && health.json?.success === true);

  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'dawit@aau.edu.et', password: 'Password123!' },
  });
  check('seeded student can log in', login.status === 200 && !!login.json?.token);
  check('login returns userType', login.json?.user?.userType === 'student');
  ctx.studentToken = login.json?.token;

  const me = await api('/api/auth/me', { token: ctx.studentToken });
  check('GET /auth/me returns the user', me.status === 200 && me.json?.user?.email === 'dawit@aau.edu.et');

  const badLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'dawit@aau.edu.et', password: 'wrong-password' },
  });
  check('wrong password is rejected', badLogin.status === 401);

  const noToken = await api('/api/auth/me');
  check('protected route blocks missing token', noToken.status === 401);
}

const phases = [phase1];

async function main() {
  for (const phase of phases) {
    try {
      await phase();
    } catch (err) {
      failed += 1;
      lines.push(`  ✗ phase threw — ${err.message}`);
    }
  }
  console.log(`\n${lines.join('\n')}`);
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
