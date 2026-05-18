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

// ── Phase 2 — auth, RBAC, audit, notifications ──
async function phase2() {
  lines.push('');
  lines.push('Phase 2 — auth, RBAC & notifications');

  const email = `new.student.${Date.now()}@test.et`;
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: { firstName: 'New', lastName: 'Student', email, password: 'Password123!', userType: 'student' },
  });
  check('register a new student', reg.status === 201 && !!reg.json?.token);

  const dup = await api('/api/auth/register', {
    method: 'POST',
    body: { firstName: 'Dup', lastName: 'User', email, password: 'Password123!', userType: 'student' },
  });
  check('duplicate email is rejected', dup.status === 400);

  const adminReg = await api('/api/auth/register', {
    method: 'POST',
    body: { firstName: 'X', lastName: 'Y', email: `admin.${Date.now()}@test.et`, password: 'Password123!', userType: 'admin' },
  });
  check('admin self-registration is blocked', adminReg.status === 403);

  const noAuth = await api('/api/notifications');
  check('notifications require authentication', noAuth.status === 401);

  const notifs = await api('/api/notifications', { token: ctx.studentToken });
  check('notifications list returns for authed user', notifs.status === 200 && Array.isArray(notifs.json?.notifications));

  const forgot = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: { email: 'dawit@aau.edu.et' },
  });
  check('forgot-password responds generically', forgot.status === 200 && forgot.json?.success === true);

  // Account lockout after 5 failed logins.
  const lockEmail = `lock.test.${Date.now()}@test.et`;
  await api('/api/auth/register', {
    method: 'POST',
    body: { firstName: 'Lock', lastName: 'Test', email: lockEmail, password: 'Password123!', userType: 'student' },
  });
  for (let i = 0; i < 5; i += 1) {
    await api('/api/auth/login', { method: 'POST', body: { email: lockEmail, password: 'wrong' } });
  }
  const afterLock = await api('/api/auth/login', {
    method: 'POST',
    body: { email: lockEmail, password: 'Password123!' },
  });
  check('account locks after 5 failed logins', afterLock.status === 423);
}

// ── Phase 3 — profiles & registration ──
async function phase3() {
  lines.push('');
  lines.push('Phase 3 — profiles & registration');

  const studentUpdate = await api('/api/students/me', {
    method: 'PUT',
    token: ctx.studentToken,
    body: { major: 'Computer Science', studentId: 'UGR/4403/15', gpa: 3.8, skills: ['React', 'Node.js'] },
  });
  check(
    'student can update profile',
    studentUpdate.status === 200 && studentUpdate.json?.profile?.major === 'Computer Science',
  );

  const studentGet = await api('/api/students/me', { token: ctx.studentToken });
  check('student profile persists', studentGet.status === 200 && studentGet.json?.profile?.gpa === 3.8);

  const unis = await api('/api/universities', { token: ctx.studentToken });
  check(
    'universities list is available',
    unis.status === 200 && Array.isArray(unis.json?.universities) && unis.json.universities.length > 0,
  );

  const crossRole = await api('/api/companies/me', { token: ctx.studentToken });
  check('student is blocked from company routes (RBAC)', crossRole.status === 403);

  const compLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'hr@zemen-tech.et', password: 'Password123!' },
  });
  ctx.companyToken = compLogin.json?.token;
  const compUpdate = await api('/api/companies/me', {
    method: 'PUT',
    token: ctx.companyToken,
    body: { name: 'Zemen Technologies', industry: 'Software', city: 'Addis Ababa' },
  });
  check(
    'company can update profile (profileComplete flips)',
    compUpdate.status === 200 && compUpdate.json?.profileComplete === true,
  );

  const uniLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'coordinator@aau.edu.et', password: 'Password123!' },
  });
  ctx.universityToken = uniLogin.json?.token;
  const uniUpdate = await api('/api/universities/me', {
    method: 'PUT',
    token: ctx.universityToken,
    body: { name: 'Addis Ababa University', country: 'Ethiopia', city: 'Addis Ababa', departments: ['Computer Science'] },
  });
  check(
    'university can update profile (profileComplete flips)',
    uniUpdate.status === 200 && uniUpdate.json?.profileComplete === true,
  );
}

const phases = [phase1, phase2, phase3];

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
