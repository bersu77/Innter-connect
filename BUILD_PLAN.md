# InternConnect — Build Plan

> Implementation roadmap for the **InternConnect Internship Management System**, derived
> **strictly** from `Fina year Project  InterConnect.pdf` (136 pages). Every item below
> traces to a Functional Requirement (FR), Use Case (UC), or design section of that PDF.
> Nothing outside the PDF is added.

## Guiding rule (set by the project owner)

1. **Everything written in the PDF must be implemented.**
2. **Functional features come first** — get the website fully working for every role.
3. **Infrastructure & integrations come last** — only after all basic features work
   (see Phase 14). This covers: AWS S3, SendGrid/SMTP email, Twilio SMS, OAuth 2.0,
   2FA, Redis caching, MongoDB replica set/sharding, Docker, cloud deployment.

## Tech stack (PDF §1.5.3, §3.3)

| Layer | Technology |
|---|---|
| Frontend | React + Vite, React Router, Tailwind CSS, lucide-react |
| Backend | Node.js + Express (REST API) |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| Tooling | Git/GitHub, Postman, Figma |
| Later (Phase 14) | Docker, Vercel, AWS S3, Redis, SendGrid, Twilio |

## Decision: extend the existing backend

The current `server/` already has working JWT auth, bcrypt hashing, and a few models.
We **keep and extend** it rather than rebuild. Key refactor: the PDF models each entity
as its **own collection** referencing `User` by `userId` — the current code embeds
`studentProfile`/`companyProfile`/`universityProfile` inside `User`. Phase 1 migrates to
separate collections.

---

## Build strategy — module-by-module vertical slices

The project is built as **dependency-ordered vertical slices**, not "all frontend then
all backend" (or vice versa). Each phase below is one module and ships **both its
backend and frontend** before the next module starts. This matches the PDF's chosen
Agile/sprint methodology (§1.5.1) and keeps every phase independently demoable.

Two rules:

1. **Foundation first.** Phases 0–2 (app shell, data layer, auth + RBAC + audit) are
   the shared skeleton — build them before any feature module.
2. **Within a module, backend → frontend.** Build and Postman-test the endpoints first,
   then build the React UI that consumes them. Avoids rework from mismatched API shapes.

Phase order = dependency order (simple → hard): each module consumes what an earlier
one produced (e.g. applications need internships, which need company profiles, which
need auth).

---

## Module dependency map (bird's-eye view)

How modules connect. **Depends on** = must exist first. **Feeds** = later modules that
consume this one's output. Build strictly top-to-bottom.

| Phase / module | Depends on | Feeds |
|---|---|---|
| 0 App shell + design system | — | everything |
| 1 Data layer | 0 | every backend module |
| 2 Auth + RBAC + audit | 1 | every protected feature |
| 3 Profiles & registration | 2 (User) | 4, 5, 6 |
| 4 Verification & admin user mgmt | 3 (profiles) | 5, 6 |
| 5 Internship management | 3 (Company), 4 (verified) | 6 |
| 6 Applications & selection | 5 (Internship), 3 (Student) | 7 |
| 7 Offers, placement, withdrawal | 6 (Application) | 8, 9 |
| 8 Supervisor tasks & assessments | 7 (Placement) | 9 |
| 9 Internship completion & reports | 7, 8 | 11 |
| 10 Notifications & dashboards | 2 (scaffold) + events from 3–9 | UX of all roles |
| 11 Reporting & analytics | data from 5–9 | — |
| 12 Audit & compliance review | 2 (audit logs from all) | — |
| 13 NFR hardening & testing | all functional (0–12) | 14 |
| 14 Infrastructure & integrations | all | deployment |

**Cross-cutting (every module from Phase 2 on uses these):** Auth/RBAC, audit logging,
notifications, input validation. They are built once and consumed — never re-forked.

**Stable contracts between modules** — modules communicate only through these, so
changes *inside* a module don't ripple outward:
- REST API endpoints (`server/routes/`) + their request/response shapes
- Mongoose models (`server/models/`)
- The frontend `client/src/api/` client modules and `AuthContext`

## Regression control

The risk each new module breaks an earlier one is held down by:

1. **Additive-first.** New modules add files, routes, and collections; they do not
   rewrite earlier ones. If a later module needs a new field on an existing model, add
   the field — never rename/remove what earlier modules rely on.
2. **Contract boundaries.** Modules touch each other only through the stable contracts
   above. Internal refactors stay invisible to other modules.
3. **Per-phase regression gate.** Every phase ends with: `npm run build` (frontend
   compiles), backend smoke check, and a manual run of **all earlier phases'** happy
   paths. A phase is not "done" until earlier phases still pass.
4. **Known-state seed data** (Phase 1) so any phase can be re-tested from a clean,
   reproducible dataset.
5. **Change log per phase.** Each phase records which earlier modules/contracts it
   touched. Touches nothing earlier → regression risk ≈ 0; touches a shared contract →
   re-run that contract's consumers.
6. **Growing test suite.** Smoke tests accumulate each phase; Phase 13 formalises the
   full predefined test-case suite (PDF specific objective).

## Commit discipline

- **Atomic commits.** Each commit is one coherent, self-contained change — a single
  feature, fix, or refactor — small and focused, never a grab-bag.
- **Commit working code only.** Never commit a broken feature, a failing build, or
  half-finished work. Every commit must leave the project runnable: `npm run build`
  passes and the backend starts.
- **Commit the moment something works.** As soon as a slice is working and verified,
  commit it immediately — don't let working work sit uncommitted. Expect several
  commits per phase as sub-tasks land.
- **Conventional messages.** `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:` —
  referencing the FR/UC/phase where relevant.

This pairs with the regression controls above: atomic, working commits make it trivial
to pinpoint and revert the exact change that introduced a regression.

---

## Target structure

Conventional full-stack MERN monorepo: the React **client** and the Express **server**
are separate packages side by side, with a thin root package for orchestration.

```
internconnect/
  package.json          root — orchestration only (concurrently dev script, shared tooling)
  BUILD_PLAN.md
  .gitignore
  client/               React + Vite frontend  (PKG_01)
    package.json
    index.html
    vite.config.js   tailwind.config.js   postcss.config.js
    public/
    src/
      api/            axios client + per-resource API modules
      assets/
      components/     shared UI — ui/ design-system primitives, layout pieces
      context/        AuthContext, …
      hooks/
      layouts/        DashboardLayout
      pages/          route pages — public + role-based (PDF §2.3.6.5)
      routes/         ProtectedRoute, route guards
      utils/
      App.jsx   main.jsx   index.css
  server/               Node + Express backend
    package.json
    config/         db connection, env
    models/         13 collections (PDF §3.3.5.2 + Task, Assessment, Report)
    routes/         one router per package
    controllers/    request handlers
    services/       business logic (PKG_02..PKG_11)
    middleware/     auth, rbac, audit, validation, errorHandler, rateLimit
    utils/          jwt, helpers
    seed/           seed scripts
    index.js        app entry
```

Run both tiers from the root with one command (`npm run dev` → `concurrently` runs the
client and server); each tier also installs and runs independently.

**Migration note:** the repo currently keeps the frontend at the root. Moving it into
`client/` is a dedicated low-risk refactor done **before Phase 1** backend work begins.

Modules map 1:1 to the PDF's 11 packages:

| Package | Lives in |
|---|---|
| PKG_01 UI | `client/src/` |
| PKG_02 Auth & User Mgmt | `server/services/auth`, `server/services/user` |
| PKG_03 Student Mgmt | `server/services/student` |
| PKG_04 Internship Mgmt | `server/services/internship` |
| PKG_05 Application & Selection | `server/services/application` |
| PKG_06 Organization Mgmt | `server/services/company`, `server/services/university` |
| PKG_07 Data Persistence | `server/models/`, `server/config/db` |
| PKG_08 Security & Compliance | `server/middleware/{auth,rbac}`, `server/services/audit` |
| PKG_09 Notification | `server/services/notification` |
| PKG_10 Reporting & Analytics | `server/services/report` |
| PKG_11 External Integration | Phase 14 |

---

## Data model — collections (PDF §3.3.5.2 + object/class model §2.3.6.3)

The PDF specifies **10 primary collections**; its object model and class diagram also
require **Task**, **Assessment**, and **Report**. All are built in Phase 1 with the exact
fields from the PDF schema figures.

1. **Users** — email, password (bcrypt), firstName, lastName, userType `{student,
   university, company, admin}`, roles[], permissions[], status `{active, suspended,
   deleted}`, verificationStatus, profileComplete, lastLogin, loginAttempts,
   accountLockedUntil, createdAt, updatedAt, deletedAt (soft delete).
2. **Student** — userId→User, universityId→University, studentId, enrollmentYear,
   graduationYear, major, gpa, academicStanding `{good, warning, probation}`, skills[],
   interests[], languages[], cv{filename,path,uploadedAt,version}, certifications[],
   availableSince, desiredLocations[], workAuthorization, verificationStatus, verifiedBy.
3. **University** — name, email, domain, country, city, phone, address, website,
   verified, verificationDate, verifiedBy, departments[], admins[], studentCount,
   interns[], verificationRules{minGPA,gradYears,majors}, status.
4. **Company** — name, email, industry, country, city, employees, founded, website,
   description, logo, verified, verifiedBy, recruiters[], status, totalInternsHired,
   averageRating.
5. **Internship** — companyId, title, description, locations[], requirements{minGPA,
   skills[],majors[],yearsOfStudy[],workAuth}, position{type,duration,dates,paid,
   stipend}, applicationDeadline, postedDate, closedDate, totalPositions,
   filledPositions, tags[], status `{draft, pending, active, closed, archived}`,
   applications[], viewCount, createdBy, updatedBy.
6. **Application** — studentId, internshipId, companyId, universityId, coverLetter,
   attachments[], applicationScore, status `{submitted, under_review, shortlisted,
   accepted, rejected, offered, withdrawn}`, rejectionReason, submittedAt, reviewedAt,
   reviewedBy, shortlistedAt, notes[], statusHistory[] (immutable audit trail).
7. **Placement** — applicationId, studentId, internshipId, companyId, startDate,
   expectedEndDate, endDate, status, confirmedAt, confirmedBy.
8. **Verification** — entityType, entityId, requestedBy, reviewedBy, status, remarks,
   rejectionReason, documents[], requestedAt, reviewedAt — plus **VerificationAppeal**.
9. **AuditLog** — timestamp, userId, userType, action, entityType, entityId,
   changes{before,after}, ipAddress, userAgent, status `{success, failure}`,
   errorMessage, metadata. **Append-only / immutable.**
10. **Notification** — userId, type, title, message, relatedEntity, read, readAt,
    channel `{email, in_app, sms}`, status `{pending, sent, failed}`, retryCount,
    expiresAt (TTL — 90-day auto-expire).
11. **Task** (class model) — title, description, deadline, status `{assigned,
    in_progress, completed, overdue}`, placementId, assignedBy, studentId.
12. **Assessment** (class model) — placementId, studentId, supervisorId, score,
    remarks, submittedDate; immutable after submission.
13. **Report** (object model) — type `{university, company, audit}`, generatedBy,
    generatedAt, filters, payload.

## Roles & RBAC (PDF Table 3.1)

`userType` is one of `{student, university, company, admin}`. **Supervisor** and
**Auditor** are not separate userTypes — they are represented through `roles[]` /
`permissions[]`: Supervisor = a company-side role, Auditor = an admin-side role. The
RBAC middleware (Phase 2) enforces the exact permission lists from Table 3.1.

---

## UI / design system (frontend design language)

**PDF compatibility — confirmed, no contradiction.** PDF §2.4.3.1 requires "simplicity
and ease of use, clear labels, organized layouts, consistent navigation"; §3.2.2 requires
a "user-friendly interface… responsive, mobile-first design… consistent visual elements";
the §2.3.6.5 mockups are clean white/light-gray cards with a single blue accent. The
design language below refines that direction — it does not replace or contradict it.

**Design language — modern, clean, minimalist, inspired by Apple's Human Interface
Guidelines:**

- **Layout** — minimalist; generous whitespace; clear visual hierarchy; one consistent
  spacing scale; no clutter.
- **Responsive — mobile-first.** Design and build every screen for small screens first,
  then progressively enhance up to tablet and desktop using min-width breakpoints, fluid
  layouts, and touch-friendly targets. The PDF requires this (§3.2.2 "responsive,
  mobile-first design"; §2.4.3.4 — desktop, laptop, tablet, smartphone).
- **Surfaces** — flat design base with subtle glassmorphism: blurred translucent panels
  (`backdrop-blur`), soft layered backgrounds.
- **Color** — neutral palette (white, light grays) + exactly **one accent color** = the
  existing InternConnect blue from the PDF mockups. No other bright colors. Existing
  colour scheme is kept.
- **Typography** — clean, modern system-font stack (Inter / `-apple-system` / SF-style),
  medium weight, well-spaced; restrained size steps for hierarchy.
- **Shape & depth** — soft rounded corners (8–16px), subtle shadows; no heavy borders.
- **Motion** — smooth hover and transition animations; respects `prefers-reduced-motion`.
- **Tokens** — colours, radius, shadow, and spacing defined once as Tailwind theme tokens
  and reused across every component for consistency.

Implemented in **Phase 0** (Tailwind theme + shared base components), then applied to
every screen in later phases. ⚠️ `tailwind.config.js` currently contains injected
malicious code — Phase 0 replaces it with a clean config carrying these design tokens.

---

## Phased roadmap

Each phase delivers a working vertical slice (backend + frontend) and is independently
demoable. Phases 0–13 are functional. Phase 14 is infrastructure (built last).

### Phase 0 — Setup & foundations
- `.env` files, scripts, ESLint/Prettier, folder structure above.
- `axios` API client, `AuthContext`, `ProtectedRoute`, `DashboardLayout` shell.
- Tailwind theme to match mockups (PDF §2.3.6.5): blue primary, InternConnect logo.
- **Done:** app shell renders; routing + protected-route guard work.

### Phase 1 — Data layer (PKG_07)
- Create all 13 Mongoose models with exact PDF fields, enums, indexes, FK refs.
- Migrate `User` to slim auth record; move profile data to `Student`/`Company`/
  `University` collections. Rename `InternshipListing` → `Internship`; expand
  `Application`, `Notification`, `AuditLog` to full PDF schemas.
- Seed script: sample users of each role, universities, companies, internships.
- **Done:** all collections exist; seed populates a demo dataset.

### Phase 2 — Auth, RBAC, audit & notification scaffolding (UC001, FR1, FR2)
- Register/login/logout, JWT access+refresh, bcrypt, account lockout after failed
  attempts, session timeout (PDF §2.4.3.7, UC001 business rules).
- RBAC middleware enforcing Table 3.1 permissions.
- **Audit service** (PKG_08) — cross-cutting middleware that writes an immutable
  `AuditLog` entry for every significant action; used by all later phases.
- **Notification service** (PKG_09) — in-app create/read; woven into later phases.
- Frontend: Register (Student/University/Company tabs), Login, Forgot-password pages
  per mockups; auth wiring.
- **Done:** any role can register, log in, hit a role-specific empty dashboard;
  actions are audit-logged.

### Phase 3 — Profiles & registration (UC002, FR1; PKG_03, PKG_06)
- Student profile: academic details, skills, interests, CV upload (local disk for now —
  S3 in Phase 14), save-as-draft, "one active profile per student" rule.
- Company & University profile creation/edit.
- Frontend: StudentProfileForm, CompanyProfileForm, UniversityForm; profile pages.
- **Done:** each role completes and edits its profile; `profileComplete` flips true.

### Phase 4 — Verification & admin user management (UC012, UC equivalents, FR13)
- University verifies students; admin verifies companies & universities (Verification
  collection + appeals workflow).
- Admin: activate/deactivate/manage accounts; user list.
- Frontend: AdminDashboard user table; verification queues.
- **Done:** verification workflow end-to-end; admin can manage accounts.

### Phase 5 — Internship management (UC005, UC015, FR3; PKG_04)
- Company posts/edits/closes internships (status lifecycle, deadline, requirements).
- Students browse internship listings with search + filters (location, duration,
  field); view details; viewCount tracking.
- University: search organizations; send invitations + track status (UC005-search,
  UC006, FR11).
- Frontend: Post Internship form, Internship Listings (student + recruiter views),
  internship detail page — per mockups #2/#3/#4.
- **Done:** companies post internships; students find them; universities invite orgs.

### Phase 6 — Applications & selection (UC003, UC004, UC007, UC008, FR3, FR4, FR9, FR10)
- Student applies (cover letter, attachments, "one application per internship" rule);
  application stored with statusHistory.
- Student tracks application status (read-only).
- Company views internship requests, reviews applications, shortlists, approves/rejects.
- Frontend: Apply flow, Application Status tracker, recruiter Applications dashboard.
- **Done:** full apply → review → decision loop works; status visible to student.

### Phase 7 — Offers, placement & withdrawal (UC016, UC017, UC009, FR8)
- Company assigns supervisor to accepted students (UC009).
- Student accepts/rejects offers (UC017); student withdraws application before review
  (UC016).
- On acceptance → create **Placement** record.
- **Done:** offers flow to placement; withdrawal respects business rules.

### Phase 8 — Supervisor: tasks & assessments (UC010, UC011, FR5, FR6, FR7)
- Supervisor assigns tasks; student updates task progress; supervisor monitors.
- Student requests assessment; supervisor fills & submits (immutable after submit).
- Frontend: task board, assessment forms, student task view.
- **Done:** task assignment + progress + assessment cycle works.

### Phase 9 — Internship completion & reports (UC018, FR5)
- Student submits final internship report; supervisor confirms; university validates;
  internship marked completed & archived.
- Frontend: report submission + completion approval screens.
- **Done:** an internship can be carried fully to "completed".

### Phase 10 — Notifications & dashboards (UC019, FR all)
- Complete in-app Notification Center; triggers on every status change, approval,
  task assignment, verification result (PDF §3.3.4.7).
- Build out all role dashboards with live stats/cards per mockup #1.
- **Done:** every role has a populated dashboard; notifications fire on events.

### Phase 11 — Reporting & analytics (UC013, FR12; PKG_10)
- University placement/completion reports; company & admin analytics.
- Report generation with filters; on-screen viewing + export (PDF/Excel/CSV — local
  generation; cloud delivery deferred).
- **Done:** reports generate and export.

### Phase 12 — Audit & compliance review (UC014, FR14)
- Auditor reviews audit logs; defines audit scope; records findings; generates audit
  reports. Admin system-monitoring view (FR14).
- **Done:** auditor workflow + system monitoring view work.

### Phase 13 — NFR hardening & testing (PDF §2.4.3, §3.2; specific objective "test & evaluate")
- Input validation + meaningful error messages everywhere; global error handling.
- Responsive layouts (desktop/laptop/tablet/mobile); accessibility & usability pass.
- Performance pass against PDF targets (pages <2s, API <500ms).
- Test suite of predefined test cases (the PDF's stated specific objective).
- **Done:** all FRs verified by test cases; NFRs met.

### Phase 14 — Infrastructure & integrations (LAST — per owner's rule)
Only started once Phases 0–13 are complete and the site is fully functional:
- File storage → AWS S3 (replace local disk).
- Email (SendGrid/SMTP) + SMS (Twilio) notification channels.
- OAuth 2.0 (Google/GitHub sign-in — mockups) and 2FA for admin accounts.
- Redis caching / session layer.
- MongoDB replica set / sharded cluster (PDF §3.3.5.1).
- Docker + docker-compose; deployment to Vercel/cloud; load balancer; CDN.
- **Done:** production-grade deployment matching PDF Chapter 3.

---

## Cross-cutting (applied in every phase from Phase 2 on)
- **Audit logging** of every significant action (immutable).
- **RBAC** check on every protected endpoint.
- **Input validation** + consistent error responses.
- **Notifications** emitted on every state change.
- **Traceability** — each PR references the FR/UC it implements.

## Traceability summary
- FR1–FR2 → Phase 2 · FR3 → Phases 5–6 · FR4 → Phase 6 · FR5–FR8 → Phases 7–9
- FR9–FR10 → Phase 6 · FR11–FR12 → Phases 5, 11 · FR13 → Phase 4 · FR14 → Phase 12
- UC001 → P2 · UC002 → P3 · UC003/004 → P6 · UC005/006/015 → P5 · UC007/008 → P6
- UC009/016/017 → P7 · UC010/011 → P8 · UC012 → P4 · UC013 → P11 · UC014 → P12
- UC018 → P9 · UC019 → P10
