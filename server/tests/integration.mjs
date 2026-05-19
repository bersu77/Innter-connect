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

// ── Phase 4 — verification & admin management ──
async function phase4() {
  lines.push('');
  lines.push('Phase 4 — verification & admin management');

  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@internconnect.et', password: 'Password123!' },
  });
  ctx.adminToken = adminLogin.json?.token;
  check('admin can log in', adminLogin.status === 200 && adminLogin.json?.user?.userType === 'admin');

  const stats = await api('/api/admin/stats', { token: ctx.adminToken });
  check('admin stats endpoint works', stats.status === 200 && typeof stats.json?.stats?.users === 'number');

  const users = await api('/api/admin/users', { token: ctx.adminToken });
  check('admin can list users', users.status === 200 && Array.isArray(users.json?.users));

  const blocked = await api('/api/admin/users', { token: ctx.studentToken });
  check('non-admin is blocked from admin routes', blocked.status === 403);

  const orgs = await api('/api/admin/organizations', { token: ctx.adminToken });
  check('admin can list organizations', orgs.status === 200 && Array.isArray(orgs.json?.companies));

  const company = orgs.json?.companies?.[0];
  const verified = company
    ? await api(`/api/admin/organizations/company/${company._id}/verify`, {
        method: 'PATCH',
        token: ctx.adminToken,
        body: { decision: 'approved' },
      })
    : { status: 0, json: {} };
  check('admin can verify a company', verified.status === 200 && verified.json?.entity?.verified === true);

  const tmpReg = await api('/api/auth/register', {
    method: 'POST',
    body: { firstName: 'Tmp', lastName: 'User', email: `suspend.${Date.now()}@test.et`, password: 'Password123!', userType: 'student' },
  });
  const suspend = await api(`/api/admin/users/${tmpReg.json?.user?.id}/status`, {
    method: 'PATCH',
    token: ctx.adminToken,
    body: { status: 'suspended' },
  });
  check('admin can suspend a user', suspend.status === 200 && suspend.json?.user?.status === 'suspended');

  const students = await api('/api/universities/students', { token: ctx.universityToken });
  check('university can list its students', students.status === 200 && Array.isArray(students.json?.students));

  const pending = students.json?.students?.find((s) => s.verificationStatus !== 'verified');
  const verifyStudent = pending
    ? await api(`/api/universities/students/${pending._id}/verify`, {
        method: 'PATCH',
        token: ctx.universityToken,
        body: { decision: 'approved' },
      })
    : { status: 0, json: {} };
  check(
    'university can verify a student',
    pending
      ? verifyStudent.status === 200 && verifyStudent.json?.student?.verificationStatus === 'verified'
      : (students.json?.students?.length || 0) > 0,
  );
}

// ── Phase 5 — internship management ──
async function phase5() {
  lines.push('');
  lines.push('Phase 5 — internship management');

  const created = await api('/api/internships', {
    method: 'POST',
    token: ctx.companyToken,
    body: {
      title: 'QA Engineer Intern',
      description: 'Help test our products end to end.',
      locations: ['Addis Ababa'],
      position: { type: 'onsite', duration: '3 months', paid: true, stipend: 7000 },
      tags: ['qa', 'testing'],
      status: 'active',
    },
  });
  check('company can post an internship', created.status === 201 && created.json?.internship?.status === 'active');
  ctx.internshipId = created.json?.internship?._id;

  const blocked = await api('/api/internships', {
    method: 'POST',
    token: ctx.studentToken,
    body: { title: 'X', description: 'Y' },
  });
  check('student is blocked from posting internships', blocked.status === 403);

  const mine = await api('/api/internships/mine', { token: ctx.companyToken });
  check('company can list own internships', mine.status === 200 && (mine.json?.internships?.length || 0) > 0);

  const browse = await api('/api/internships', { token: ctx.studentToken });
  check('student can browse active internships', browse.status === 200 && Array.isArray(browse.json?.internships));

  const detail = await api(`/api/internships/${ctx.internshipId}`, { token: ctx.studentToken });
  check('internship detail loads & counts a view', detail.status === 200 && detail.json?.internship?.viewCount >= 1);

  const statusChange = await api(`/api/internships/${ctx.internshipId}/status`, {
    method: 'PATCH',
    token: ctx.companyToken,
    body: { status: 'closed' },
  });
  check('company can change internship status', statusChange.status === 200 && statusChange.json?.internship?.status === 'closed');

  const companies = await api('/api/companies', { token: ctx.universityToken });
  check('companies are searchable', companies.status === 200 && Array.isArray(companies.json?.companies));

  const target = companies.json?.companies?.[0];
  const invite = target
    ? await api('/api/invitations', {
        method: 'POST',
        token: ctx.universityToken,
        body: { companyId: target._id, message: 'We would like to partner with you.' },
      })
    : { status: 0 };
  check('university can send an invitation', invite.status === 201);

  const compInvites = await api('/api/invitations', { token: ctx.companyToken });
  check('company sees received invitations', compInvites.status === 200 && Array.isArray(compInvites.json?.invitations));

  const pendingInvite = compInvites.json?.invitations?.find((i) => i.status === 'sent');
  const respond = pendingInvite
    ? await api(`/api/invitations/${pendingInvite._id}/respond`, {
        method: 'PATCH',
        token: ctx.companyToken,
        body: { decision: 'accepted' },
      })
    : { status: 0 };
  check(
    'company can respond to an invitation',
    pendingInvite ? respond.status === 200 : (compInvites.json?.invitations?.length || 0) >= 0,
  );
}

// ── Phase 6 — applications & selection ──
async function phase6() {
  lines.push('');
  lines.push('Phase 6 — applications & selection');

  const posted = await api('/api/internships', {
    method: 'POST',
    token: ctx.companyToken,
    body: { title: 'DevOps Intern', description: 'CI/CD and cloud infrastructure.', status: 'active', position: { type: 'remote' } },
  });
  const internshipId = posted.json?.internship?._id;

  const apply = await api('/api/applications', {
    method: 'POST',
    token: ctx.studentToken,
    body: { internshipId, coverLetter: 'I am keen on DevOps and automation.' },
  });
  check('student can apply to an internship', apply.status === 201 && apply.json?.application?.status === 'submitted');
  ctx.applicationId = apply.json?.application?._id;

  const dup = await api('/api/applications', {
    method: 'POST',
    token: ctx.studentToken,
    body: { internshipId, coverLetter: 'again' },
  });
  check('duplicate application is rejected', dup.status === 400);

  const mine = await api('/api/applications', { token: ctx.studentToken });
  check(
    'student can track their applications',
    mine.status === 200 && mine.json.applications.some((a) => a._id === ctx.applicationId),
  );

  const received = await api('/api/applications', { token: ctx.companyToken });
  check(
    'company sees received applications',
    received.status === 200 && received.json.applications.some((a) => a._id === ctx.applicationId),
  );

  const review = await api(`/api/applications/${ctx.applicationId}/status`, {
    method: 'PATCH',
    token: ctx.companyToken,
    body: { status: 'under_review' },
  });
  check('company can move an application to review', review.status === 200 && review.json?.application?.status === 'under_review');

  const shortlist = await api(`/api/applications/${ctx.applicationId}/status`, {
    method: 'PATCH',
    token: ctx.companyToken,
    body: { status: 'shortlisted' },
  });
  check('company can shortlist an application', shortlist.status === 200 && shortlist.json?.application?.status === 'shortlisted');

  const blocked = await api(`/api/applications/${ctx.applicationId}/status`, {
    method: 'PATCH',
    token: ctx.studentToken,
    body: { status: 'rejected' },
  });
  check('student cannot change application status (RBAC)', blocked.status === 403);

  const detail = await api(`/api/applications/${ctx.applicationId}`, { token: ctx.companyToken });
  check('application detail includes status history', detail.status === 200 && (detail.json?.application?.statusHistory?.length || 0) >= 1);
}

// ── Phase 7 — offers, placement & withdrawal ──
async function phase7() {
  lines.push('');
  lines.push('Phase 7 — offers, placement & withdrawal');

  const offer = await api(`/api/applications/${ctx.applicationId}/status`, {
    method: 'PATCH',
    token: ctx.companyToken,
    body: { status: 'offered' },
  });
  check('company can send an offer', offer.status === 200 && offer.json?.application?.status === 'offered');

  const accept = await api(`/api/applications/${ctx.applicationId}/respond-offer`, {
    method: 'PATCH',
    token: ctx.studentToken,
    body: { decision: 'accept' },
  });
  check(
    'student can accept an offer (placement created)',
    accept.status === 200 && accept.json?.application?.status === 'accepted' && !!accept.json?.placement,
  );
  ctx.placementId = accept.json?.placement?._id;

  const posted = await api('/api/internships', {
    method: 'POST',
    token: ctx.companyToken,
    body: { title: 'Mobile Dev Intern', description: 'Build mobile apps.', status: 'active' },
  });
  const apply = await api('/api/applications', {
    method: 'POST',
    token: ctx.studentToken,
    body: { internshipId: posted.json?.internship?._id, coverLetter: 'Interested in mobile.' },
  });
  const withdraw = await api(`/api/applications/${apply.json?.application?._id}/withdraw`, {
    method: 'PATCH',
    token: ctx.studentToken,
  });
  check('student can withdraw a submitted application', withdraw.status === 200 && withdraw.json?.application?.status === 'withdrawn');

  const lateWithdraw = await api(`/api/applications/${ctx.applicationId}/withdraw`, {
    method: 'PATCH',
    token: ctx.studentToken,
  });
  check('withdrawal is blocked after review (business rule)', lateWithdraw.status === 400);

  const placements = await api('/api/placements', { token: ctx.companyToken });
  check(
    'company can list placements',
    placements.status === 200 && placements.json.placements.some((p) => p._id === ctx.placementId),
  );

  const supers = await api('/api/companies/supervisors', { token: ctx.companyToken });
  check('supervisors are listable', supers.status === 200 && Array.isArray(supers.json?.supervisors));

  // Pick the Zemen supervisor specifically so Phase 8 (logs in as Daniel) can manage it.
  const supervisor =
    supers.json?.supervisors?.find((s) => s.email === 'daniel@zemen-tech.et') ||
    supers.json?.supervisors?.[0];
  const assign = supervisor
    ? await api(`/api/placements/${ctx.placementId}/supervisor`, {
        method: 'PATCH',
        token: ctx.companyToken,
        body: { supervisorId: supervisor._id },
      })
    : { status: 0, json: {} };
  check(
    'company can assign a supervisor',
    assign.status === 200 && String(assign.json?.placement?.supervisorId) === String(supervisor?._id),
  );
}

// ── Phase 8 — supervisor tasks & assessments ──
async function phase8() {
  lines.push('');
  lines.push('Phase 8 — supervisor tasks & assessments');

  const supLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'daniel@zemen-tech.et', password: 'Password123!' },
  });
  ctx.supervisorToken = supLogin.json?.token;
  check('supervisor can log in', supLogin.status === 200);

  const task = await api('/api/tasks', {
    method: 'POST',
    token: ctx.supervisorToken,
    body: { placementId: ctx.placementId, title: 'Set up the dev environment', description: 'Install required tools.' },
  });
  check('supervisor can assign a task', task.status === 201 && !!task.json?.task?.title);
  ctx.taskId = task.json?.task?._id;

  const studentTasks = await api('/api/tasks', { token: ctx.studentToken });
  check(
    'student sees assigned tasks',
    studentTasks.status === 200 && studentTasks.json.tasks.some((t) => t._id === ctx.taskId),
  );

  const progress = await api(`/api/tasks/${ctx.taskId}/progress`, {
    method: 'PATCH',
    token: ctx.studentToken,
    body: { status: 'in_progress', progressNote: 'Started working on it.' },
  });
  check('student can update task progress', progress.status === 200 && progress.json?.task?.status === 'in_progress');

  // Required-deliverable enforcement
  const deliverableTask = await api('/api/tasks', {
    method: 'POST',
    token: ctx.supervisorToken,
    body: { placementId: ctx.placementId, title: 'Submit your design link', requireLink: true },
  });
  const dtId = deliverableTask.json?.task?._id;
  check(
    'task can require a deliverable',
    deliverableTask.json?.task?.requiredDeliverables?.link === true,
  );

  const missingSubmit = await api(`/api/tasks/${dtId}/submit`, {
    method: 'POST',
    token: ctx.studentToken,
    body: { note: 'no link provided' },
  });
  check('submission without a required deliverable is rejected', missingSubmit.status === 400);

  const okSubmit = await api(`/api/tasks/${dtId}/submit`, {
    method: 'POST',
    token: ctx.studentToken,
    body: { link: 'https://github.com/intern/project' },
  });
  check(
    'submission with the required deliverable completes the task',
    okSubmit.status === 200 && okSubmit.json?.task?.status === 'completed',
  );

  const reqAssessment = await api('/api/assessments', {
    method: 'POST',
    token: ctx.studentToken,
    body: { placementId: ctx.placementId },
  });
  check('student can request an assessment', reqAssessment.status === 201);
  ctx.assessmentId = reqAssessment.json?.assessment?._id;

  const supAssessments = await api('/api/assessments', { token: ctx.supervisorToken });
  check(
    'supervisor sees assessment requests',
    supAssessments.status === 200 && supAssessments.json.assessments.some((a) => a._id === ctx.assessmentId),
  );

  const submit = await api(`/api/assessments/${ctx.assessmentId}`, {
    method: 'PATCH',
    token: ctx.supervisorToken,
    body: { score: 88, remarks: 'Strong performance throughout the internship.' },
  });
  check('supervisor can submit an assessment', submit.status === 200 && submit.json?.assessment?.submitted === true);

  const resubmit = await api(`/api/assessments/${ctx.assessmentId}`, {
    method: 'PATCH',
    token: ctx.supervisorToken,
    body: { score: 50 },
  });
  check('a submitted assessment is immutable', resubmit.status === 400);
}

// ── Phase 9 — internship completion & reports ──
async function phase9() {
  lines.push('');
  lines.push('Phase 9 — internship completion & reports');

  const fd = new FormData();
  fd.append(
    'report',
    new Blob(['Final internship report content.'], { type: 'application/pdf' }),
    'final-report.pdf',
  );
  const reportRes = await fetch(`${BASE}/api/placements/${ctx.placementId}/report`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ctx.studentToken}` },
    body: fd,
  });
  check('student can submit a final report', reportRes.status === 200);

  const confirm = await api(`/api/placements/${ctx.placementId}/confirm-completion`, {
    method: 'PATCH',
    token: ctx.supervisorToken,
  });
  check(
    'supervisor can confirm completion',
    confirm.status === 200 && confirm.json?.placement?.completionApprovedBySupervisor === true,
  );

  const validate = await api(`/api/placements/${ctx.placementId}/validate-completion`, {
    method: 'PATCH',
    token: ctx.universityToken,
  });
  check(
    'university validates completion (internship completed)',
    validate.status === 200 && validate.json?.placement?.status === 'completed',
  );
}

// ── Phase 10 — notifications & dashboards ──
async function phase10() {
  lines.push('');
  lines.push('Phase 10 — notifications & dashboards');

  const studentDash = await api('/api/dashboard', { token: ctx.studentToken });
  check('student dashboard returns stats', studentDash.status === 200 && !!studentDash.json?.stats);

  const companyDash = await api('/api/dashboard', { token: ctx.companyToken });
  check(
    'company dashboard returns stats',
    companyDash.status === 200 && typeof companyDash.json?.stats?.internships === 'number',
  );

  const adminDash = await api('/api/dashboard', { token: ctx.adminToken });
  check(
    'admin dashboard returns stats',
    adminDash.status === 200 && typeof adminDash.json?.stats?.users === 'number',
  );

  const notifs = await api('/api/notifications', { token: ctx.studentToken });
  check(
    'student has notifications from prior events',
    notifs.status === 200 && notifs.json.notifications.length > 0,
  );

  const markAll = await api('/api/notifications/read-all', {
    method: 'PATCH',
    token: ctx.studentToken,
  });
  check('mark-all-read succeeds', markAll.status === 200);

  const after = await api('/api/notifications', { token: ctx.studentToken });
  check('unread count is zero after mark-all-read', after.status === 200 && after.json.unread === 0);
}

// ── Phase 11 — reporting & analytics ──
async function phase11() {
  lines.push('');
  lines.push('Phase 11 — reporting & analytics');

  const uniReport = await api('/api/reports', { method: 'POST', token: ctx.universityToken });
  check(
    'university can generate a report',
    uniReport.status === 201 && !!uniReport.json?.report?.payload?.summary,
  );
  ctx.reportId = uniReport.json?.report?._id;

  const companyReport = await api('/api/reports', { method: 'POST', token: ctx.companyToken });
  check('company can generate a report', companyReport.status === 201);

  const adminReport = await api('/api/reports', { method: 'POST', token: ctx.adminToken });
  check('admin can generate a report', adminReport.status === 201);

  const blocked = await api('/api/reports', { method: 'POST', token: ctx.studentToken });
  check('student cannot generate reports (RBAC)', blocked.status === 403);

  const list = await api('/api/reports', { token: ctx.universityToken });
  check('reports are listed', list.status === 200 && list.json.reports.length > 0);

  const detail = await api(`/api/reports/${ctx.reportId}`, { token: ctx.universityToken });
  check('report detail includes payload', detail.status === 200 && !!detail.json?.report?.payload);

  const exp = await fetch(`${BASE}/api/reports/${ctx.reportId}/export`, {
    headers: { Authorization: `Bearer ${ctx.universityToken}` },
  });
  check(
    'report exports as CSV',
    exp.status === 200 && (exp.headers.get('content-type') || '').includes('csv'),
  );
}

// ── Phase 12 — audit & compliance review ──
async function phase12() {
  lines.push('');
  lines.push('Phase 12 — audit & compliance review');

  const logs = await api('/api/audit/logs', { token: ctx.adminToken });
  check('admin can review audit logs', logs.status === 200 && logs.json.logs.length > 0);

  const stats = await api('/api/audit/stats', { token: ctx.adminToken });
  check('audit stats are available', stats.status === 200 && stats.json?.stats?.total > 0);

  const filtered = await api('/api/audit/logs?action=LOGIN', { token: ctx.adminToken });
  check(
    'audit logs filter by action',
    filtered.status === 200 && filtered.json.logs.every((l) => /LOGIN/i.test(l.action)),
  );

  const blocked = await api('/api/audit/logs', { token: ctx.studentToken });
  check('non-admin is blocked from audit logs', blocked.status === 403);
}

// ── Phase 13 — NFR hardening ──
async function phase13() {
  lines.push('');
  lines.push('Phase 13 — NFR hardening');

  const notFound = await api('/api/this-route-does-not-exist');
  check(
    'unknown API routes return a JSON 404',
    notFound.status === 404 && notFound.json?.success === false,
  );

  const health = await fetch(`${BASE}/api/health`);
  check('security headers are set (helmet)', !!health.headers.get('x-content-type-options'));

  const badId = await api('/api/internships/not-a-valid-id', { token: ctx.studentToken });
  check('invalid identifiers produce a clean 400', badId.status === 400);
}

// ── Supervisor workspace, appeals & multi-format export ──
async function supervisorWorkspace() {
  lines.push('');
  lines.push('Supervisor workspace, appeals & export');

  const supLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'daniel', password: 'Password123!' },
  });
  check(
    'supervisor logs in by username',
    supLogin.status === 200 && (supLogin.json?.user?.roles || []).includes('supervisor'),
  );
  const supToken = supLogin.json?.token;

  const uname = `sup.${Date.now()}`;
  const created = await api('/api/companies/supervisors', {
    method: 'POST',
    token: ctx.companyToken,
    body: { firstName: 'New', lastName: 'Supervisor', username: uname, password: 'Password123!' },
  });
  check('manager can create a supervisor', created.status === 201 && created.json?.supervisor?.username === uname);

  const newSupLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: uname, password: 'Password123!' },
  });
  check('created supervisor can log in', newSupLogin.status === 200);

  const supList = await api('/api/companies/supervisors', { token: ctx.companyToken });
  check(
    'manager lists company supervisors',
    supList.status === 200 && supList.json.supervisors.some((s) => s.username === uname),
  );

  const supTasks = await api('/api/tasks', { token: supToken });
  const gradable = supTasks.json?.tasks?.[0];
  const graded = gradable
    ? await api(`/api/tasks/${gradable._id}/grade`, {
        method: 'PATCH',
        token: supToken,
        body: { score: 90, feedback: 'Excellent work.' },
      })
    : { status: 0, json: {} };
  check('supervisor can grade a task', graded.status === 200 && graded.json?.task?.score === 90);

  const supPlacements = await api('/api/placements', { token: supToken });
  const thread = supPlacements.json?.placements?.[0];
  const msgs = thread
    ? await api(`/api/placements/${thread._id}/messages`, { token: supToken })
    : { status: 0, json: {} };
  check('supervisor can read a message thread', msgs.status === 200 && Array.isArray(msgs.json?.messages));
  const sent = thread
    ? await api(`/api/placements/${thread._id}/messages`, {
        method: 'POST',
        token: supToken,
        body: { body: 'How is the task going?' },
      })
    : { status: 0 };
  check('supervisor can send a message', sent.status === 201);

  const cred = await api('/api/auth/credentials', {
    method: 'PATCH',
    token: ctx.studentToken,
    body: { username: `dawit.${Date.now()}` },
  });
  check('user can change own credentials', cred.status === 200);

  const appeals = await api('/api/verifications/appeals', { token: ctx.adminToken });
  check('admin can list verification appeals', appeals.status === 200 && appeals.json.appeals.length > 0);

  const uniReport = await api('/api/reports', { method: 'POST', token: ctx.universityToken });
  const rid = uniReport.json?.report?._id;
  const xlsx = await fetch(`${BASE}/api/reports/${rid}/export?format=xlsx`, {
    headers: { Authorization: `Bearer ${ctx.universityToken}` },
  });
  check('report exports as xlsx', xlsx.status === 200);
  const pdf = await fetch(`${BASE}/api/reports/${rid}/export?format=pdf`, {
    headers: { Authorization: `Bearer ${ctx.universityToken}` },
  });
  check('report exports as pdf', pdf.status === 200);

  // ── Supervisor reassignment ──
  // The placement currently has Daniel; the manager hands it to the new
  // supervisor with a 'fresh' mode, starting a clean conversation.
  const newSupId = created.json?.supervisor?.id;
  const newSupToken = newSupLogin.json?.token;
  const reassign = newSupId
    ? await api(`/api/placements/${ctx.placementId}/supervisor`, {
        method: 'PATCH',
        token: ctx.companyToken,
        body: { supervisorId: newSupId, mode: 'fresh' },
      })
    : { status: 0, json: {} };
  check(
    'manager can reassign a placement supervisor',
    reassign.status === 200 &&
      String(reassign.json?.placement?.supervisorId) === String(newSupId),
  );

  // Tasks are placement-scoped: the reassigned supervisor sees the placement's
  // existing tasks even though a previous supervisor assigned them.
  const newSupTasks = await api('/api/tasks', { token: newSupToken });
  check(
    'a reassigned supervisor sees the placement tasks',
    newSupTasks.status === 200 &&
      newSupTasks.json.tasks.some(
        (t) => String(t.placementId?._id || t.placementId) === String(ctx.placementId),
      ),
  );

  // A 'fresh' reassignment hides the previous supervisor's conversation.
  const freshThread = await api(`/api/placements/${ctx.placementId}/messages`, {
    token: newSupToken,
  });
  check(
    'a fresh reassignment starts an empty conversation',
    freshThread.status === 200 && freshThread.json?.messages?.length === 0,
  );
}

const phases = [
  phase1,
  phase2,
  phase3,
  phase4,
  phase5,
  phase6,
  phase7,
  phase8,
  phase9,
  phase10,
  phase11,
  phase12,
  phase13,
  supervisorWorkspace,
];

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
