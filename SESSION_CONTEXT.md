# Session Context — InternConnect

> **Handoff snapshot** — last updated 2026-05-19.
> Phases 0–13 are complete. **Eight** post-phase feature rounds are merged to
> `staging`, including **report charts** (most recent). There is no
> work in progress — a new session can start a fresh feature off `staging`.

## Project

InternConnect — a MERN **Internship Management System** (Addis Ababa University
final-year project) connecting students, companies, universities, supervisors, and
administrators across the full internship lifecycle. Built **strictly** from
`Fina year Project  InterConnect.pdf` (136 pages). Repo root: `/home/abel/bersu/Innter-connect`.
Structure: `client/` (React+Vite) + `server/` (Express) + `BUILD_PLAN.md`.

## Completed & merged to `staging`

**Phases 0–13** — full functional system: app shell/design system; 13 Mongoose models +
seed; auth/RBAC/audit/lockout; profiles + CV upload; verification + admin user mgmt;
internship posting/browsing/invitations; applications & selection; offers/placement/
withdrawal; supervisor tasks & assessments; completion & final reports; notifications +
dashboards; reporting & analytics; audit & compliance review; NFR hardening + tests.

**Post-phase feature rounds (also merged to `staging`):**
1. **Supervisor workspace** (`b818929`) — Company **Manager** vs **Supervisor** as two
   workspaces with their own dashboards/nav (supervisor = company user with
   `roles:['supervisor']`); manager creates supervisor accounts (username + temp
   password); login by **email *or* username**; `PATCH /auth/credentials` to change
   own username/password; supervisor↔student **chat** (Message model, thread per
   placement); task **grading** (score + feedback); **verification appeals UI**;
   **PDF/Excel/CSV** report export (`pdfkit` + `exceljs`).
2. **Task deliverables** (`4d97493`) — supervisor marks which deliverables
   (document / link / note) a task **requires**; student submission form enforces them
   client- *and* server-side (`POST /tasks/:id/submit`, file upload); submitted work
   shown to both roles.
3. **Supervisor reassignment** (branch `feat/supervisor-reassignment`) — a company
   **manager** can **change** a placement's supervisor, picking a **mode**:
   `continue` (the new supervisor inherits the existing chat conversation) or `fresh`
   (a new conversation starts; the prior thread is hidden from the active view).
   `Placement.engagementStartedAt` is the chat-thread boundary (`fresh` moves it to
   "now", `continue` leaves it); `Placement.supervisorHistory[]` is the audit trail.
   `assignSupervisor` handles initial assignment **and** reassignment, validates the
   supervisor belongs to the company, notifies new + previous supervisor + student, and
   audits `SUPERVISOR_ASSIGN`/`SUPERVISOR_REASSIGN`. Tasks are now **placement-scoped**
   for supervisors (`listTasks`/`gradeTask` key off `placement.supervisorId`, not
   `task.assignedBy`), so a newly-assigned supervisor sees and can grade the
   placement's existing tasks. PlacementsPage has a **"Change supervisor"** control.
4. **Task grading rules** (branch `feat/task-grading-rules`) — three task additions:
   **(a) Auto-zero on a missed deadline** — a task not completed before its deadline
   is automatically scored 0. Lazy enforcement (`applyOverdue` runs on every task
   read/write — no background job, infrastructure is deferred); once overdue the task
   is locked, so `submitTask`/`updateProgress` reject it. **(b) Grade appeals** — a
   student can appeal a graded task (`POST /tasks/:id/appeal`, including an auto-zero);
   the placement **supervisor** resolves it (`PATCH /tasks/:id/appeal`), upholding the
   grade or adjusting the score. `Task.gradeAppeal` holds the appeal thread. **(c)
   Unique task tag** — every task gets a server-set sequential `taskNumber`, surfaced
   as a `TSK-0042` tag (Mongoose virtual); never editable. TasksPage shows the tag and
   the appeal UI for both roles.

5. **Task counting & workspace polish** (branch `feat/task-counting-and-workspace`) —
   six related changes. **(a) Per-student task numbering** — `Task.taskNumber` now
   counts from 1 *per student* (compound unique index `{studentId, taskNumber}`), so
   the same task is one student's 3rd and another's 10th; the `TSK-0042` tag is
   unchanged in format. **(b) Bulk assign** — `createTask` accepts `assignToAll` to
   assign one task to every active intern at once (one Task doc per student, each
   numbered in its own sequence); returns `{ task, tasks }`. **(c) Task search** —
   client-side filter on the Tasks page (tag/title/status/name), per role. **(d)
   Student email rule** — registration requires an `@aau.edu.et` address for
   `userType:'student'` (server + RegisterPage). **(e) Assigner shown** — `listTasks`
   populates `assignedBy`; the student's task card shows "Assigned by {name}" and the
   notification names the supervisor. **(f) Org name in header** — auth responses
   (login/register/getMe) include `organizationName`; DashboardLayout shows it above
   the "… workspace" label.
6. **Academic student email** (branch `feat/academic-student-email`) — broadened the
   round-5 (d) student email rule: registration now accepts **any academic
   institutional email** — domains ending in `.edu`, `.edu.<cc>` (e.g. `aau.edu.et`)
   or `.ac.<cc>` (e.g. `ox.ac.uk`) — and rejects personal/consumer providers and
   ordinary domains, instead of only `@aau.edu.et`. Regex `ACADEMIC_EMAIL` in
   `authController` (mirrored in RegisterPage). Enforced for `userType:'student'`.

7. **Invitation message** (branch `feat/invitation-message`) — the university's
   PartnersPage "Invite" action now expands to an optional message `<Textarea>`;
   on send it passes the note through `invitationApi.send(companyId, message)`. The
   `Invitation.message` field, the controller and the company-side display already
   existed — this round wires up the send form and shows the note in the university's
   "Sent invitations" table.

8. **Report charts** (branch `feat/report-charts`) — every generated report now
   shows interactive analytical charts (`recharts`): a bar chart of the report's
   summary metrics, plus a status-breakdown pie when the rows carry a `status`
   field. `components/ReportCharts.jsx`, lazy-loaded in ReportsPage so `recharts`
   ships as its own on-demand JS chunk and the main bundle stays unchanged.

**Verification baseline:** integration suite `server/tests/integration.mjs` is at
**115/115 passing**; the seed runs `Task.syncIndexes()` to drop the old
global-unique `taskNumber` index; `npm run build` passes (charts are a separate
lazy chunk).
Note: the auth limiter is 50 requests / 15 min — enough for one suite run; restart the
server (clears the in-memory counter) before re-running, or logins start returning 429.

## Git state & workflow

- Current branch: **`staging`** — all eight feature rounds are merged; nothing in progress.
- `staging` holds Phases 0–13 + the supervisor-workspace, task-deliverables,
  supervisor-reassignment, task-grading-rules, task-counting-and-workspace,
  academic-student-email, invitation-message and report-charts rounds.
- `main` is frozen at the Phase 0 merge — **never merge into `main`**.
- **Every feature has its own branch; none are ever deleted.** Feature branches merge
  into `staging` with `--no-ff`.
- `main` and `staging` are **pushed** to GitHub (`git@github-bersu:bersu77/Innter-connect.git`
  — note the `github-bersu` SSH host alias; plain `github.com` uses the wrong account).
  Branches after the push are local-only.
- `.claude/settings.local.json` is intentionally left uncommitted.
- Commit style: atomic, conventional messages, end with
  `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

## How to run / test

- `npm run dev` (repo root) — client `:5173` + server `:5000`.
- `npm --prefix server run seed` — reset the demo dataset (run before the test suite).
- `node server/tests/integration.mjs` — the integration suite (server must be running + freshly seeded).
- `npm run build` — frontend regression gate.
- Demo logins, password `Password123!`: `admin@internconnect.et`,
  `coordinator@aau.edu.et` (university), `hr@zemen-tech.et` (company manager),
  `daniel` (supervisor — **username, not email**), `dawit@aau.edu.et` (student, verified),
  `alex@aau.edu.et` (student, pending). Other supervisor usernames: `sara`, `liya`, `eden`, `helen`.

## Phase 14 — deferred (not started)

Infrastructure & integrations, per the owner's "infrastructure last" rule: AWS S3,
SendGrid/SMTP email + Twilio SMS, OAuth 2.0 + 2FA, Redis, MongoDB replica set/sharding,
Docker, cloud deployment. Until then: local-disk file uploads, in-app-only notifications.

## Notes

- "Supervisor"/"Auditor" are `roles[]` sub-roles, not separate `userType`s (PDF Table 3.1).
- `Invitation` and `Message` models are implementation details beyond the PDF's named
  10 collections, added to support required features (FR11/UC006; supervisor chat).
- An obfuscated malware payload found in `tailwind.config.js` at the start was removed
  in Phase 0; the repo was scanned — no other file was affected.
