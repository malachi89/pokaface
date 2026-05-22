# Pokaface — AGENTS.md

## Monorepo (npm workspaces)
- `packages/shared/` — zero-dep TypeScript types, `EVENTS` const, card values. **Build first**.
- `apps/backend/` — Express + Socket.IO + better-sqlite3 (port 3001), CommonJS (`"module": "commonjs"`)
- `apps/frontend/` — Next.js 14 App Router + TailwindCSS (port 3000), `@/` → `./src/*`

## Commands
| Command | What |
|---|---|
| `npm run dev` | Both apps in parallel via `concurrently` |
| `npm run build` | `shared → backend → frontend` (order matters) |
| `npm run start` | Both apps in parallel (production) |
| `npm run dev --workspace=apps/backend` | Backend via `tsx watch src/index.ts` |
| `npm run dev --workspace=apps/frontend` | Frontend via `next dev -p 3000` |
| `docker-compose up --build` | Full stack in containers |
| `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build` | Local Docker profile: frontend → `localhost:3001`, backend allows `localhost:3000` |

No test runner, linter, formatter, or typecheck configured. `npm run build` is the only verification step.

## Stack quirks
- **Backend URL resolution** (`apps/frontend/src/app/room/[roomId]/page.tsx:25`): `process.env.NEXT_PUBLIC_BACKEND_URL ?? (NODE_ENV === 'production' ? 'https://api.pokaface.win' : 'http://localhost:3001')`. Same in `admin/page.tsx:12`. Production frontend is `https://www.pokaface.win` and talks to backend at `https://api.pokaface.win`. Local dev should use `http://localhost:3001`. `NEXT_PUBLIC_*` vars are **inlined at build time** by Next.js — rebuild the frontend image when switching prod/local envs.
- **DB**: `better-sqlite3` is the SQLite client. `db/client.ts` keeps Promise-returning `runAsync`/`getAsync`/`allAsync` wrappers around its synchronous prepared-statement API. No ORM. `runMigrations()` runs `CREATE TABLE IF NOT EXISTS` at startup + one `ALTER TABLE` silently ignored on failure.
- **Socket.IO**: Event names/typed payloads in `packages/shared/src/events.ts` as `EVENTS` const + TypeScript interfaces. Import from `@pokaface/shared`, never raw strings.
- **Socket singleton**: `lib/socket.ts` creates one `io()` connection per app lifetime (module-level `let socket`). `closeSocket()` disconnects and resets it to `null` for re-creation.
- **Room state**: `buildRoomState()` in `db/queries.ts` is the single source of truth. Queries `rooms` + `participants`, computes `VoteResults` only when `phase === 'revealed'`. Called after every mutating operation.
- **Socket-room membership**: In-memory `Map<string, Set<string>>` in `socket/rooms.ts` tracks active connections; SQLite is authoritative source.
- **Config** (`apps/backend/src/config.ts`): `PORT=3001`, `DB_PATH=./data/pokaface.db`, `FRONTEND_ORIGIN=http://localhost:3000`, `BCRYPT_ROUNDS=10`, `ROOM_TTL_DAYS=7`. `isDev` is `NODE_ENV !== 'production'`.
- **Card values** (`packages/shared/src/cards.ts`): union `0 | 1 | 2 | 3 | 5 | 8 | '?' | '☕'`. Moderators cannot vote (checked server-side in `voting.ts:58`).
- **Moderator auth**: Checks `getParticipantBySocket(socket.id)` and `is_moderator === 1`. No token re-verification after initial join.
- **Voting phases**: `idle → voting → revealed → idle`. Moderator-only: `vote:start`, `vote:reveal`, `vote:reset`. Any non-moderator: `vote:submit`.
- **Voting card UI**: `apps/frontend/src/app/room/[roomId]/page.tsx` keeps `selectedCard` local for immediate click feedback. It clears on `idle` and when `room.roundId` changes, not merely when `hasVoted` is false; clearing on `hasVoted=false` races the optimistic click and makes users click twice.
- **Events table**: Logs `room_created`, `participant_joined`, `participant_disconnected` via `logEvent()` — fire-and-forget from socket handlers, never awaited. Old events deleted after 30 days in the 24h cleanup interval. `getAdminStats()` queries this table.

## HTTP endpoints (Express)
- `GET /api/health` — health check
- `GET /api/rooms/:roomId` — room state snapshot (SSR fallback), calls `buildRoomState()`
- `GET /api/admin/stats` — usage stats for `/admin` dashboard

## Docker & production
- Frontend Dockerfile: multi-stage, `output: 'standalone'`, runs `node apps/frontend/server.js`. Backend Dockerfile: single-stage, runs `node dist/index.js` (needs `python3 make g++` for the `better-sqlite3` native addon).
- `docker-compose.yml`: Production profile. Both containers on `internal` bridge network. Backend exposes `3001:3001`, data volume `./data:/app/data`, `FRONTEND_ORIGIN=https://www.pokaface.win`, and `ALLOWED_ORIGINS` includes `https://pokaface.win`, `https://www.pokaface.win`, `http://158.101.1.222:3000`, and `http://localhost:3000`. Frontend has `NEXT_PUBLIC_BACKEND_URL=https://api.pokaface.win`.
- `docker-compose.local.yml`: Local Docker override. Backend uses `FRONTEND_ORIGIN=http://localhost:3000` and `ALLOWED_ORIGINS=http://localhost:3000`; frontend uses `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001`. Run with `docker compose -f docker-compose.yml -f docker-compose.local.yml up --build`.
- **Nginx on host** (not in Docker): production domain routing is `https://www.pokaface.win` → frontend:3000 and `https://api.pokaface.win` → backend:3001 for `/socket.io/` and `/api`. Direct `localhost:3001` from browser is only for local development.
- Deploy: `git pull && docker-compose up -d --build`
- Room cleanup: inactive > `ROOM_TTL_DAYS` deleted at startup and every 24 h.
