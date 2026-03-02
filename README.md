# Pulse

> Mobile-first dashboard for managing multiple Claude Code agents on a VPS.

## Features

- **Agent Management** -- Create, configure, start/stop Claude Code agents
- **Real-time Chat** -- Send messages and receive responses with markdown rendering
- **Terminal Access** -- Full TTY terminal view for each agent via xterm.js
- **Mobile-First** -- PWA-ready, optimized for phone screens with safe-area support
- **Secure** -- JWT auth, bcrypt passwords, AES-256-GCM encryption for stored tokens
- **Self-Hosted** -- Single Docker container, SQLite database, no external dependencies

## Quick Start

### Prerequisites

- Node.js >= 22
- npm

### Install

```bash
# Clone and install
git clone <repo-url> pulse
cd pulse
bash install.sh    # Linux/macOS/Git Bash
# or
.\install.ps1      # Windows PowerShell
```

### Development

```bash
npm run dev        # Starts server (port 3000) and web (port 5173) concurrently
```

### Production

```bash
npm run build
npm start          # Serves on http://localhost:3000
```

### Docker

```bash
docker compose up -d
```

## Architecture

```
pulse/
├── packages/
│   ├── server/          # Express 5 + Socket.io 4 backend
│   │   ├── src/
│   │   │   ├── db/          # Drizzle ORM schema + SQLite connection
│   │   │   ├── lib/         # Config, logger, encryption utilities
│   │   │   ├── middleware/   # Auth middleware (JWT cookie validation)
│   │   │   ├── routes/      # REST API endpoints
│   │   │   ├── services/    # Business logic (AgentManager, ChatParser, etc.)
│   │   │   └── socket/      # Socket.io event handlers
│   │   └── ...
│   └── web/             # React 19 + Vite 6 + Tailwind CSS 4 frontend
│       ├── src/
│       │   ├── components/  # UI components (agents, chat, terminal, layout)
│       │   ├── pages/       # Route pages (Login, Dashboard, AgentView, Settings)
│       │   └── stores/      # Zustand stores + Socket.io client
│       └── ...
├── tests/
│   ├── unit/            # Vitest unit tests
│   ├── integration/     # Vitest integration tests
│   └── e2e/             # End-to-end smoke tests
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # Single-service deployment
├── install.sh           # Linux/macOS install script
└── install.ps1          # Windows PowerShell install script
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 |
| Backend | Express 5, Socket.io 4 |
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| Database | SQLite (better-sqlite3) + Drizzle ORM |
| Terminal | node-pty + xterm.js |
| Auth | JWT + bcryptjs |
| Encryption | AES-256-GCM |
| State | Zustand |
| Icons | Lucide React |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/login | No | Login with admin password |
| POST | /api/auth/logout | No | Clear auth cookie |
| GET | /api/auth/check | Yes | Verify authentication |
| GET | /api/agents | Yes | List all agents |
| POST | /api/agents | Yes | Create agent |
| GET | /api/agents/:id | Yes | Get agent details |
| PATCH | /api/agents/:id | Yes | Update agent |
| DELETE | /api/agents/:id | Yes | Delete agent |
| POST | /api/settings/claude-auth | Yes | Save Claude auth token (encrypted) |
| GET | /api/settings/claude-auth/status | Yes | Get Claude auth status |
| POST | /api/settings/password | Yes | Change admin password |
| GET | /api/settings/oauth-url | Yes | Generate OAuth PKCE URL |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| agent:subscribe | Client -> Server | Join agent room for events |
| agent:start | Client -> Server | Start agent process |
| agent:stop | Client -> Server | Stop agent process |
| chat:send | Client -> Server | Send message to agent |
| terminal:input | Client -> Server | Terminal keystroke |
| agent:message | Server -> Client | Agent response content |
| agent:waiting | Server -> Client | Agent asking a question |
| agent:status | Server -> Client | Agent status change |
| terminal:output | Server -> Client | Terminal output data |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| JWT_SECRET | pulse-dev-secret | JWT signing secret (required in prod) |
| ENCRYPTION_KEY | (empty) | AES-256 encryption key (required in prod) |
| DB_PATH | ./data/pulse.db | SQLite database path |
| CORS_ORIGIN | http://localhost:5173 | Allowed CORS origin |

## License

MIT
