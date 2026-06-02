# Deployment & Decisions Log

A running record of major changes and decisions, so they can be referred to later.

---

## 2026-06-02 — Schema deploy to Railway MongoDB

### Goal
Deploy/push all Mongoose schemas and connect to the remote MongoDB defined by the
`MONGO_URIr` env variable (Railway-hosted).

### Important concept
MongoDB has **no SQL-style schema migrations**. The schemas live in code as Mongoose
models; the database is schemaless. The only things physically "deployed" to a remote
cluster are **collections** (created on first write / index sync) and **indexes**.
So "deploy the schema" here = create the collections and build all model indexes via
Mongoose `syncIndexes()`.

### Target database
- **Variable:** `MONGO_URIr` (Railway)
- **Host:** `zephyr.proxy.rlwy.net:45308`
- **Database:** `internconnect`  *(the raw URI had no db name; `/internconnect` was
  appended to match the local + Atlas URIs already in `.env`)*
- **Auth:** `authSource=admin` (root `mongo` user)
- *Password redacted here — see `server/.env`.*

### What was deployed (final verified state)
| Collection | Indexes |
|------------|---------|
| `users` | `_id_`, `email_1` **(UNIQUE)** |
| `applications` | `_id_`, `student_1_listing_1` **(UNIQUE compound)** |
| `internshiplistings` | `_id_` |
| `notifications` | `_id_` |
| `auditlogs` | `_id_` |

All 5 models (`User`, `Application`, `InternshipListing`, `Notification`, `AuditLog`)
are present. The two integrity-critical unique indexes enforce: no duplicate-email
users, and one application per student per listing.

### Key decision — disk-space workaround
The first deploy connected fine but **failed to build indexes**:
> `available disk space of 233684992 bytes is less than required minimum of 524288000`

MongoDB refuses any index build when free disk < **500 MB**
(`indexBuildMinAvailableDiskSpaceMB`). The Railway instance had only ~233 MB free.

**Decision (approved by user):** temporarily lower that server threshold to 100 MB,
build the two indexes (trivially small because the collections are empty), then
**restore the threshold to 500 MB**. This was a runtime setting change only — no data
touched — and the original value was confirmed restored after the build.

> ⚠️ This did **not** fix the underlying problem: the Railway MongoDB volume is nearly
> full (~233 MB free). Index builds on *non-empty* collections in the future will hit
> the same wall. **Recommend adding disk / upgrading the Railway plan.**

### Files added/changed in the repo
- `server/scripts/syncSchema.js` — connects + `syncIndexes()` on all 5 models. Run via
  `npm run db:sync`. Idempotent; safe to re-run.
- `server/scripts/buildIndexes.js` — one-off: lowers the disk threshold, builds the
  `User` + `Application` indexes, restores the threshold. Used for this deploy.
- `server/package.json` — added script: `"db:sync": "node scripts/syncSchema.js"`.
- `server/.env.example` — env template (no secrets).
- `server/.env` — real env values (gitignored, **not committed**).

### How to re-run the schema deploy
```powershell
# from the server/ directory
# (targets whatever MONGO_URI resolves to in .env)
npm run db:sync

# to target a specific remote (e.g. Railway) for one run:
$env:MONGO_URI = '<the MONGO_URIr value>'; node scripts/syncSchema.js
```

### Outstanding / security follow-ups
- [ ] **Rotate credentials** — the Railway DB password, the Atlas DB password, and the
      JWT secrets were pasted into a chat session. Rotate them and update `server/.env`.
- [ ] **Add disk to the Railway MongoDB** (or move to the Atlas cluster once its Network
      Access List entry is Active) — current free space is ~233 MB.
- [ ] **Decide the canonical `MONGO_URI`** — `server/.env` currently has a duplicate
      `MONGO_URI` key (local + Atlas) plus `MONGO_URIabel` and `MONGO_URIr`. Consolidate
      to one active value to avoid confusion about which DB the app actually uses.
- [ ] Nothing has been `git commit`/`git push`ed yet — pending user direction.
