# Pokaface — Planning Poker for Scrum Teams

## Project Layout (npm workspaces monorepo)
- `apps/frontend/` — Next.js 14 + TypeScript + TailwindCSS (port 3000)
- `apps/backend/` — Express + Socket.IO + better-sqlite3 (port 3001)
- `packages/shared/` — shared TypeScript types and Socket.IO event constants (zero runtime deps)

## Stack decisions (locked)
- Real-time: Socket.IO (not raw WS, not tRPC)
- DB: better-sqlite3 synchronous — no ORM, no Prisma, no migrations tooling
- No Redis — in-memory Map for socket state, SQLite is source of truth
- No auth — identity via `participantToken` UUID in localStorage
- Moderator gated by `is_moderator` DB flag, not token re-verification per request

## Dev commands (once scaffolded)
- `npm run dev` from root — starts both apps in parallel via workspaces
- `docker-compose up --build` — full stack in containers
- SQLite DB at `./data/pokaface.db` (bind-mounted, persists across restarts)

## Architecture notes
- 2 Docker containers: frontend (host-exposed) + backend (internal network only)
- Production TLS: Nginx on host proxies `/` → frontend:3000, `/socket.io/` → backend:3001
- Room cleanup: rooms inactive > 7 days deleted (configurable via `ROOM_TTL_DAYS`)
- Reconnection: client emits `room:join` on reconnect with stored `participantToken`

## v1 scope
- Included extras: copy link, auto-reconnect, auto-consensus detection
- Out of scope for v1: voting timer, reveal sound (add later without debt)
