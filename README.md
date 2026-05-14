# Pokaface — Planning Poker for Scrum Teams

Real-time Planning Poker application for Scrum teams. Create rooms, invite team members, and vote on story sizes using Fibonacci cards with live synchronization.

## Features

- **No Registration**: Users enter their name and go. Identity persisted in localStorage.
- **Real-Time Voting**: Live updates via WebSocket (Socket.IO).
- **Moderator Role**: One user per room controls voting flow without authentication.
- **Fibonacci Cards**: Standard 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕
- **Vote Results**: Average, mode (most frequent), dispersion (standard deviation), and consensus detection.
- **Responsive UI**: Works on desktop and mobile. Dark theme.
- **Auto-Reconnection**: Seamless reconnection if network drops.
- **Room Sharing**: Copy link to invite others.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Express, Socket.IO, Node.js
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Docker + docker-compose

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
git clone <repo>
cd pokaface

npm install
npm run dev
```

Frontend will be at `http://localhost:3000`
Backend will be at `http://localhost:3001`

## Development with Docker

```bash
docker-compose up --build
```

Access the app at `http://localhost:3000`

Logs:
```bash
docker-compose logs -f
```

Stop:
```bash
docker-compose down
```

## Production Deployment

### Option 1: Oracle Cloud Free Tier (Recommended)

#### Setup VM

1. Create an Always Free Compute Instance (ARM or AMD)
2. Install Docker and Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Deploy

1. Clone the repo:
```bash
git clone <repo>
cd pokaface
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your domain
BACKEND_URL=https://your-domain.com
FRONTEND_ORIGIN=https://your-domain.com
```

3. Create data directory:
```bash
mkdir -p data
sudo chown -R 1000:1000 data
```

4. Start containers (expose port 3000 and 3001 in VM firewall):
```bash
docker-compose up -d
```

5. Setup Nginx with TLS (on the host):
```bash
# Install Nginx
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/default

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Edit /etc/nginx/sites-available/default to add SSL:
# ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

6. Auto-renew certificate:
```bash
sudo certbot renew --dry-run
```

### Option 2: Google Cloud Run

#### Build and Push Image

```bash
# Create Artifact Registry repo
gcloud artifacts repositories create pokaface --repository-format=docker --location=us-central1

# Build backend
cd apps/backend
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/pokaface/backend .
docker push us-central1-docker.pkg.dev/PROJECT_ID/pokaface/backend

# Build frontend
cd ../frontend
docker build -t us-central1-docker.pkg.dev/PROJECT_ID/pokaface/frontend .
docker push us-central1-docker.pkg.dev/PROJECT_ID/pokaface/frontend
```

#### Deploy

Since Cloud Run expects a single container, you have two options:

**Option A**: Deploy as two separate services
- Backend Cloud Run service on port 3001
- Frontend Cloud Run service on port 3000 with env var pointing to backend

**Option B**: Use Cloud Run on GKE (managed Kubernetes)
- Deploy docker-compose as a Helm chart

### Option 3: Simple Linux VM (Linode, DigitalOcean, etc.)

Same as Oracle Cloud:
1. Install Docker
2. Clone repo
3. `docker-compose up -d`
4. Install Nginx + Let's Encrypt on host
5. Point domain to VM IP
6. Setup Nginx reverse proxy

## Environment Variables

### Root `./env`
```
BACKEND_URL=http://backend:3001
FRONTEND_ORIGIN=http://localhost:3000
```

### Backend `./apps/backend/.env`
```
PORT=3001
DB_PATH=./data/pokaface.db
FRONTEND_ORIGIN=http://localhost:3000
BCRYPT_ROUNDS=10
ROOM_TTL_DAYS=7
NODE_ENV=production
```

### Frontend `./apps/frontend/.env.local`
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Architecture

### Monorepo Structure
```
pokaface/
├── packages/shared/       # Shared types + Socket.IO events
├── apps/
│   ├── frontend/          # Next.js app (port 3000)
│   ├── backend/           # Express + Socket.IO (port 3001)
├── docker-compose.yml
└── nginx.conf
```

### Room State Machine
```
idle → voting → revealed → voting (next story)
```

### Identity Model

- **Participant Token**: UUID generated once per browser, stored in localStorage. Persists across tabs/sessions.
- **Moderator**: First user to create a room. Identified by `is_moderator` flag in DB.
- **No Login**: All identity via token + name in localStorage.

### Real-Time Protocol (Socket.IO)

**Client → Server**:
- `room:create` — Create new room
- `room:join` — Join existing room
- `vote:submit` — Cast/change vote
- `vote:start` — Start voting round (moderator)
- `vote:reveal` — Reveal all cards (moderator)
- `vote:reset` — Reset voting (moderator)
- `story:change` — Update story title (moderator)
- `participant:kick` — Remove participant (moderator)

**Server → Client**:
- `room:state` — Full state snapshot
- `room:updated` — Broadcast state changes
- `vote:revealed` — Cards + statistics
- `room:kicked` — You were removed
- `error` — Action failed

### Database Schema

**rooms** table:
- `room_id` (TEXT, PRIMARY KEY)
- `moderator_token` (TEXT, hashed)
- `story_title` (TEXT)
- `phase` (TEXT: 'idle'|'voting'|'revealed')
- `round_id` (TEXT, UUID for each voting round)
- `created_at`, `last_activity_at` (TEXT, ISO8601)

**participants** table:
- `participant_id` (TEXT)
- `room_id` (TEXT, FK)
- `name` (TEXT)
- `socket_id` (TEXT, nullable)
- `card` (TEXT, the voted card value)
- `is_connected` (INTEGER: 0|1)
- `is_moderator` (INTEGER: 0|1)
- `joined_at` (TEXT, ISO8601)

Old rooms (inactive > 7 days) are cleaned up on boot and daily via cron.

## API Endpoints

### GET /api/health
Health check.

### GET /api/rooms/:roomId
Get room state (used for SSR fallback on join).

## Scripts

### Development

```bash
npm run dev
```

Runs Next.js dev server (3000) and backend watch (3001) concurrently.

### Build

```bash
npm run build
```

Builds shared package, backend, and frontend.

### Production Start

```bash
npm start
```

Starts both apps in production mode.

### Backend Only

```bash
cd apps/backend
npm run dev    # Watch mode
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

### Frontend Only

```bash
cd apps/frontend
npm run dev    # Next.js dev server
npm run build  # Build for production
npm start      # Start Next.js server
```

## Security Notes

- **HTTPS**: In production, always use TLS. Configure Nginx with Let's Encrypt.
- **CORS**: Backend validates `Origin` header. Set `FRONTEND_ORIGIN` env var.
- **Token Hashing**: Moderator token is bcrypt-hashed on creation. Not used for runtime auth (DB flag is used instead).
- **No Login**: This is intentional. For sensitive environments, add auth layer (OAuth2, etc.) in front of Nginx.

## Troubleshooting

### Backend fails to start
- Check `DB_PATH` directory exists: `mkdir -p ./data`
- Check port 3001 is not in use: `lsof -i :3001`

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_BACKEND_URL` matches `FRONTEND_ORIGIN` in backend
- In Docker: use `http://backend:3001` (service name)
- Locally: use `http://localhost:3001`

### Rooms not persisting across restarts
- Verify `./data/pokaface.db` exists and is writable
- Check Docker volume mount: `volumes: - ./data:/app/data`

### WebSocket connection drops
- Normal: auto-reconnection kicks in after 1-3 seconds
- Check firewall allows port 3001 or proxies WebSocket properly

## Future Improvements

- Voting timer with configurable duration
- Sound effects on reveal
- Export results to CSV
- Room history / past rounds
- Authentication layer (OAuth2)
- Horizontal scaling with Redis pub/sub
- Mobile app (React Native)

## License

MIT
