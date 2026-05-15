# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Pokaface — Planning Poker for Scrum Teams

## Project Layout (npm workspaces monorepo)
- `apps/frontend/` — Next.js 14 + TypeScript + TailwindCSS (port 3000)
- `apps/backend/` — Express + Socket.IO + sqlite3 (port 3001)
- `packages/shared/` — shared TypeScript types, Socket.IO event constants, and card values (zero runtime deps)

## Dev commands
- `npm run dev` — starts both apps in parallel from root
- `npm run dev --workspace=apps/backend` / `npm run dev --workspace=apps/frontend` — start one app individually
- `npm run build` — builds shared → backend → frontend (order matters: shared must compile first)
- `docker-compose up --build` — full stack in containers

No test runner is configured. No linter is configured.

## Stack decisions (locked)
- Real-time: Socket.IO (not raw WS, not tRPC)
- DB: `sqlite3` async callbacks wrapped in Promises — no ORM, no Prisma, no migrations tooling; schema applied via `runMigrations()` at startup
- No Redis — in-memory `Map` in `apps/backend/src/socket/rooms.ts` tracks active socket-to-room membership; SQLite is source of truth
- No auth — identity via `participantToken` UUID stored in localStorage; moderator status is the `is_moderator` flag in the `participants` table (set only at room creation, never re-verified via bcrypt per operation)
- SQLite DB at `./data/pokaface.db` (bind-mounted in Docker, persists across restarts)

## Architecture: data flow

### Room creation
`/room/new` route → frontend emits `room:create` → backend hashes `participantToken` with bcrypt (stored as `moderator_token` in `rooms` table for future use), creates room + participant with `is_moderator=1` → emits `room:created` → frontend redirects to `/room/:roomId`.

### Room join / reconnect
On mount or reconnect, `useRoom` emits `room:join` with stored `participantToken`. `upsertParticipant` updates socket ID and marks connected; existing votes are preserved. Backend broadcasts `room:updated` to all other participants.

### Voting lifecycle (phases: `idle` → `voting` → `revealed` → `idle`)
Moderator-only: `vote:start` (clears votes, new `round_id`), `vote:reveal`, `vote:reset`. Any participant: `vote:submit`. On every state change, backend calls `buildRoomState()` which assembles `RoomState` from DB and broadcasts `room:updated` to the whole room.

### Moderator authorization
All moderator actions check `getParticipantBySocket(socket.id)` and verify `is_moderator === 1`. No token re-verification after initial join.

### `buildRoomState`
The single source of truth for what clients see. Queries `rooms` + `participants`, computes `VoteResults` (average, mode, dispersion, consensus) only when `phase === 'revealed'`, and returns a `RoomState` object. Called after every mutating operation.

## Environment variables (backend)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP / Socket.IO port |
| `DB_PATH` | `./data/pokaface.db` | SQLite file path |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `BCRYPT_ROUNDS` | `10` | bcrypt work factor |
| `ROOM_TTL_DAYS` | `7` | Inactive room cleanup threshold |

Frontend build arg: `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:3001`).

## Architecture notes
- 2 Docker containers: frontend (host-exposed) + backend (internal network only)
- Production TLS: Nginx on host proxies `/` → frontend:3000, `/socket.io/` → backend:3001
- Room cleanup: rooms inactive > `ROOM_TTL_DAYS` deleted at startup and every 24 h
- Card values are `0, 1, 2, 3, 5, 8, ?, ☕`, defined as a union type in `packages/shared/src/cards.ts`

## Deploy (Oracle Cloud)
- Server: `ubuntu@158.101.1.222`, key at `~/Downloads/ssh-key-2026-05-14.key`
- **Deploy command** (run on server after `git pull`):
  ```bash
  cd ~/pokaface && git pull && docker-compose down && docker-compose up -d --build
  ```
  > `down` is required first — docker-compose 1.29.2 throws `KeyError: 'ContainerConfig'` if old containers are still present.
- Check logs: `docker-compose logs -f`
- Full deploy guide: `deploy.md` (not committed — lives only locally)

## v1 scope
- Included extras: copy link, auto-reconnect, auto-consensus detection
- Out of scope for v1: voting timer, reveal sound (add later without debt)
