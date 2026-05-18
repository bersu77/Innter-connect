# Session Context — InternConnect

> **Handoff snapshot** — last updated 2026-05-18. **Phases 0–13 are complete.**
> Only Phase 14 (infrastructure & integrations) remains, intentionally deferred.

## Project

InternConnect — a MERN **Internship Management System** (Addis Ababa University
final-year project) connecting students, companies, universities, supervisors,
and administrators across the full internship lifecycle. Built **strictly** from
`Fina year Project  InterConnect.pdf` (136 pages).

## Status: Phases 0–13 COMPLETE ✅

The full functional system is built, tested, and merged to the **`staging`** branch.

| Phase | Delivered |
|---|---|
| 0 | App shell, design system, MERN restructure |
| 1 | Data layer — 13 Mongoose models, seed script, integration harness |
| 2 | Auth, RBAC, audit logging, notification scaffolding, account lockout |
| 3 | Student / company / university profiles, CV upload |
| 4 | Verification workflow + admin user management |
| 5 | Internship posting, browsing, university↔company invitations |
| 6 | Applications & selection (apply → review → decision) |
| 7 | Offers, placement, withdrawal, supervisor assignment |
| 8 | Supervisor tasks & student assessments |
| 9 | Internship completion & final reports |
| 10 | Notification centre + live role dashboards |
| 11 | Reporting & analytics + CSV export |
| 12 | Audit & compliance review, system monitoring |
| 13 | NFR hardening (helmet, 404s, mobile nav), test suite |

**Verification:** 84-check integration suite (`server/tests/integration.mjs`, run via
`npm --prefix server test`) passes; frontend `npm run build` passes; full-stack
`npm run dev` runs (client :5173, API :5000).

## Git state

- **Workflow:** `staging` holds all of Phases 0–13. `main` is frozen at the Phase 0
  merge and was **never** merged into (per the owner's instruction).
- Every phase has its own `feat/phase-N-*` branch — **all 14 branches are kept**, none
  deleted. Each was merged into `staging` with a `--no-ff` merge commit.
- Nothing has been pushed to any remote.
- `.claude/settings.local.json` is intentionally left uncommitted (local settings).

## How to run

- `npm run dev` from the repo root — client (`:5173`) + server (`:5000`) via concurrently.
- `npm --prefix server run seed` — reset the demo dataset.
- `npm --prefix server test` — run the 84-check integration suite (server must be
  re-seeded; the suite expects a fresh DB).
- Demo logins (password `Password123!`): `admin@internconnect.et` (admin),
  `coordinator@aau.edu.et` (university), `hr@zemen-tech.et` (company),
  `daniel@zemen-tech.et` (supervisor), `dawit@aau.edu.et` (student, verified),
  `alex@aau.edu.et` (student, pending).

## What remains — Phase 14 (NOT started, intentionally deferred)

Infrastructure & integrations, per the owner's "infrastructure last" rule:
AWS S3 file storage, SendGrid/SMTP email + Twilio SMS channels, OAuth 2.0 + 2FA,
Redis caching, MongoDB replica set/sharding, Docker, and cloud deployment.
Until then: file uploads use local disk, notifications are in-app only.

## Notes / known limitations

- "Supervisor" and "Auditor" are sub-roles on the `roles[]` array of company/admin
  users, not separate `userType`s (matches PDF Table 3.1).
- Report export is CSV (native); on-screen reports are print-friendly. PDF/Excel
  export libraries were not added — a candidate refinement.
- The `Invitation` model backs FR11/UC006; it is an implementation detail not named
  in the PDF's 10-collection list, added to support a required feature.
- An obfuscated malware payload found in `tailwind.config.js` at the start was
  removed in Phase 0; the repo was scanned and no other file was affected.
