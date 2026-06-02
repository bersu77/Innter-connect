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

---

## 2026-06-02 — Render single-Web-Service deploy (fix on `staging`)

### Goal
Deploy the whole app to **Render as one Web Service**: Express serves the built React
frontend (`client/dist`) so the entire app runs on one URL.

### Context
A "WIP: deploying to render" commit (`d2f1a64`) landed on `origin/staging` with broken
deployment code. This entry records the fix, pushed to `staging`.

### Two bugs fixed in `server/index.js`
1. **Duplicate `import express`** (declared on two separate lines) → `SyntaxError:
   Identifier 'express' has already been declared`. The server could not start at all.
   Removed the duplicate; consolidated the `path` / `url` / `express` imports at the top.
2. **Static + catch-all registered *after* `notFound`/`errorHandler`** → `notFound`
   returned a 404 for every non-API route before the catch-all could run, so the React
   app / deep links were never served. Moved the static-serving and `app.get('*')`
   catch-all to run **after the API routes but before** `notFound`/`errorHandler`.

### Final working order in `server/index.js`
1. `__dirname` recreated via `fileURLToPath(import.meta.url)`.
2. All `/api/*` routes.
3. `express.static(../client/dist)` + `app.get('*')` → `index.html`, with a guard that
   lets unmatched `/api/*` fall through (so unknown API routes still return JSON 404,
   not the HTML shell).
4. `notFound` + `errorHandler` last.
5. Listens on `process.env.PORT`.
   *(Note: static-serving is intentionally NOT gated behind `NODE_ENV` — it always
   serves `client/dist` if present, matching the team's WIP approach.)*

### Root `package.json`
`build` → `npm run install:all && npm run build --prefix client` (installs root + client
+ server deps, then builds the frontend). `start` → `npm --prefix server start`.

### Render service settings
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Env vars:** `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`. Don't set `PORT` (Render injects it).

### Frontend API pathing — no change needed
Frontend already uses relative `/api` paths (`client/src/api/client.js` `baseURL: '/api'`).
The only `localhost:5000` is the Vite dev proxy (dev-only). Same-origin in prod → works.
