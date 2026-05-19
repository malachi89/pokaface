# Pokaface — AGENTS.md

## Monorepo (npm workspaces)
- `packages/shared/` — zero-dep TypeScript types, Socket.IO event constants (`EVENTS`), card values. **Must build first.**
- `apps/backend/` — Express + Socket.IO + sqlite3 (port 3001), CommonJS (`module: "commonjs"`)
- `apps/frontend/` — Next.js 14 App Router + TailwindCSS (port 3000), `@/` path alias maps to `./src/*`

## Commands
| Command | What |
|---|---|
| `npm run dev` | Starts both apps in parallel via `concurrently` |
| `npm run build` | Runs `shared → backend → frontend` in order (order matters) |
| `npm run dev --workspace=apps/backend` | Backend only via `tsx watch src/index.ts` |
| `npm run dev --workspace=apps/frontend` | Frontend only via `next dev -p 3000` |
| `docker-compose up --build` | Full stack in containers |

No test runner, no linter, no typecheck configured. `npm run build` is the only verification step.

## Stack quirks
- **DB**: `sqlite3` callbacks wrapped in Promises (`runAsync`, `getAsync`, `allAsync` in `client.ts`). No ORM, no migration tooling — `runMigrations()` at startup runs `CREATE TABLE IF NOT EXISTS`, with one `ALTER TABLE ADD COLUMN` migration attempted and silently ignored on failure.
- **Socket.IO**: Event names/typed payloads live in `packages/shared/src/events.ts` as the `EVENTS` const + TypeScript interfaces. Import from `@pokaface/shared`, never write raw string event names.
- **Room state**: `buildRoomState()` in `apps/backend/src/db/queries.ts` is the single source of truth. Queries `rooms` + `participants`, computes `VoteResults` only when `phase === 'revealed'`. Called after every mutating operation.
- **Socket-room membership**: In-memory `Map<string, Set<string>>` in `apps/backend/src/socket/rooms.ts` tracks active connections; SQLite is authoritative source.
- **Config**: Backend env vars read in `apps/backend/src/config.ts` with defaults: `PORT=3001`, `DB_PATH=./data/pokaface.db`, `FRONTEND_ORIGIN=http://localhost:3000`, `BCRYPT_ROUNDS=10`, `ROOM_TTL_DAYS=7`.
- **Frontend build**: `next.config.js` sets `output: 'standalone'` and `transpilePackages: ['@pokaface/shared']`.
- **Card values**: Union type `0 | 1 | 2 | 3 | 5 | 8 | '?' | '☕'` defined in `packages/shared/src/cards.ts`. Moderators cannot vote.
- **Data directory**: `./data/pokaface.db` (gitignored). Docker bind-mounts `./data:/app/data`.

## Architecture: data flow
- **Room create**: frontend redirects to `/room/new` → emits `room:create` → backend generates adjective-animal room ID, bcrypt-hashes `participantToken`, creates room + participant with `is_moderator=1` → emits `room:created`
- **Room join/reconnect**: `useRoom` hook emits `room:join` with stored `participantToken` on mount/reconnect. `upsertParticipant` preserves existing votes. Backend broadcasts `room:updated` to others.
- **Voting phases**: `idle → voting → revealed → idle`. Moderator-only: `vote:start`, `vote:reveal`, `vote:reset`. Any non-moderator: `vote:submit`.
- **Moderator auth**: Checks `getParticipantBySocket(socket.id)` and `is_moderator === 1`. No token re-verification after initial join.
- **Room cleanup**: Rooms inactive > `ROOM_TTL_DAYS` deleted at startup and every 24 h via `setInterval`.

## Events table
- `events` table logs `room_created`, `participant_joined`, `participant_disconnected` via `logEvent()` in `apps/backend/src/db/events.ts`. Fire-and-forget from socket handlers, never awaited.
- Old events are deleted after 30 days via `cleanupOldEvents()` (runs in the 24h cleanup interval).
- `getAdminStats()` queries this table + `rooms` + `participants` for usage stats (rooms created, participants joined, active rooms, connected participants).

## HTTP endpoints (Express)
- `GET /api/health` — health check
- `GET /api/rooms/:roomId` — room state snapshot (SSR fallback), calls `buildRoomState()`
- `GET /api/admin/stats` — usage stats for the `/admin` dashboard

## Production
- 2 Docker containers: frontend (host port 3000) + backend (internal network only, host port 3001)
- Nginx on host: `/` → frontend:3000, `/socket.io/` and `/api` → backend:3001
- Deploy: `git pull && docker-compose up -d --build` on the server
