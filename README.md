# Pulse

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**Mobile-first dashboard for managing Claude Code agents on a VPS**

*Create, monitor, and interact with multiple Claude Code agents from your phone*

[Quick Start](#quick-start) •
[Features](#features) •
[Screenshots](#screenshots) •
[Architecture](#architecture) •
[API Reference](#api-reference)

</div>

---

## Overview

Pulse gives you a single self-hosted dashboard to manage multiple Claude Code agent instances running on a remote server. Open it on your phone, create agents pointed at different projects, start/stop them, chat with markdown rendering, or drop into a full terminal — all from a mobile-friendly PWA.

**What you get:**
- **Agents** — Spawn and manage multiple Claude Code processes with per-agent config
- **Chat** — Real-time messaging with markdown + syntax-highlighted code blocks
- **Terminal** — Full xterm.js TTY for direct agent interaction
- **Mobile PWA** — Installable, standalone app optimized for phone screens
- **Security** — JWT auth, bcrypt passwords, AES-256-GCM encrypted token storage
- **One container** — Docker deploy with SQLite, zero external dependencies

---

## Quick Start

### Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | 22+ |
| npm | 10+ |
| Claude Code | Latest |

### Install

```bash
git clone https://github.com/JohnPitter/pulse.git
cd pulse
bash install.sh      # Linux / macOS / Git Bash
# or
.\install.ps1        # Windows PowerShell
```

The install script checks prerequisites, installs dependencies, generates secure secrets, builds the project, and creates a `.env` file.

### Start

```bash
npm start            # http://localhost:3000
```

On first visit you'll be prompted to set an admin password.

### Docker

```bash
docker compose up -d
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Agent Management** | Create agents with custom model, thinking mode, and permission level |
| **Real-time Chat** | Markdown rendering with syntax highlighting via react-markdown |
| **Terminal View** | Full TTY via xterm.js with bidirectional I/O |
| **Live Status** | Socket.io push for agent status, messages, and questions |
| **PWA Support** | Installable standalone app with offline-capable manifest |
| **Encrypted Storage** | AES-256-GCM for stored Claude auth tokens |
| **OAuth PKCE** | Browser-based Claude authentication flow with QR code |
| **Rate Limiting** | Brute-force protection on auth endpoints |
| **Docker Deploy** | Multi-stage Dockerfile + compose with volume persistence |
| **CI Pipeline** | GitHub Actions with type-check, tests, and build |

---

## Screenshots

> *Screenshots coming soon — run the app locally to see it in action.*

### Login
<!-- ![Login](assets/login.png) -->

### Dashboard
<!-- ![Dashboard](assets/dashboard.png) -->

### Agent Chat
<!-- ![Agent Chat](assets/agent-chat.png) -->

### Terminal
<!-- ![Terminal](assets/terminal.png) -->

---

## Architecture

```
pulse/
├── packages/
│   ├── server/                # Express 5 + Socket.io 4 backend
│   │   └── src/
│   │       ├── db/            # Drizzle ORM schema + SQLite
│   │       ├── lib/           # Config, logger, encryption
│   │       ├── middleware/    # JWT cookie auth
│   │       ├── routes/        # REST API (auth, agents, settings)
│   │       ├── services/      # AgentManager, ChatParser, OAuth
│   │       └── socket/        # Real-time event handlers
│   └── web/                   # React 19 + Vite 6 + Tailwind CSS 4
│       └── src/
│           ├── components/    # agents, chat, terminal, layout
│           ├── pages/         # Login, Dashboard, AgentView, Settings
│           └── stores/        # Zustand + Socket.io client
├── tests/
│   ├── unit/                  # 71 unit tests
│   ├── integration/           # 49 integration tests
│   └── e2e/                   # 3 smoke tests
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Single-service deployment
├── install.sh                 # Linux/macOS installer
└── install.ps1                # Windows PowerShell installer
```

---

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
| Tests | Vitest + Supertest |
| CI | GitHub Actions |

---

## API Reference

### REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Login with admin password |
| POST | `/api/auth/logout` | No | Clear auth cookie |
| GET | `/api/auth/check` | Yes | Verify authentication |
| GET | `/api/agents` | Yes | List all agents |
| POST | `/api/agents` | Yes | Create agent |
| GET | `/api/agents/:id` | Yes | Get agent details |
| PATCH | `/api/agents/:id` | Yes | Update agent |
| DELETE | `/api/agents/:id` | Yes | Delete agent |
| POST | `/api/settings/claude-auth` | Yes | Save Claude auth token (encrypted) |
| GET | `/api/settings/claude-auth/status` | Yes | Get Claude auth status |
| POST | `/api/settings/password` | Yes | Change admin password |
| GET | `/api/settings/oauth-url` | Yes | Generate OAuth PKCE URL |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `agent:subscribe` | Client -> Server | Join agent room for events |
| `agent:start` | Client -> Server | Start agent process |
| `agent:stop` | Client -> Server | Stop agent process |
| `chat:send` | Client -> Server | Send message to agent |
| `terminal:input` | Client -> Server | Terminal keystroke |
| `agent:message` | Server -> Client | Agent response content |
| `agent:waiting` | Server -> Client | Agent asking a question |
| `agent:status` | Server -> Client | Agent status change |
| `terminal:output` | Server -> Client | Terminal output data |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `JWT_SECRET` | `pulse-dev-secret` | JWT signing secret (required in prod) |
| `ENCRYPTION_KEY` | *(empty)* | AES-256 encryption key (required in prod) |
| `DB_PATH` | `./data/pulse.db` | SQLite database path |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

### Agent Options

Each agent can be configured with:

| Field | Default | Values |
|-------|---------|--------|
| `model` | `sonnet` | `sonnet`, `opus`, `haiku` |
| `permissionMode` | `bypassPermissions` | `bypassPermissions`, `acceptEdits`, `plan`, `default` |
| `thinkingEnabled` | `false` | `true`, `false` |
| `customInstructions` | *(empty)* | Free-text system prompt |

---

## Development

```bash
npm run dev          # Starts server (3000) + web (5173) concurrently
npm run build        # Build both packages
npm run test:unit    # Run unit tests
npm run test:integration  # Run integration tests
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev servers with hot reload |
| `npm run build` | Production build (web + server) |
| `npm start` | Start production server |
| `npm run test:unit` | Run 71 unit tests |
| `npm run test:integration` | Run 49 integration tests |

---

## License

MIT — see [LICENSE](LICENSE) file.

---

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

## Support

- **Issues:** [GitHub Issues](https://github.com/JohnPitter/pulse/issues)
- **Discussions:** [GitHub Discussions](https://github.com/JohnPitter/pulse/discussions)
