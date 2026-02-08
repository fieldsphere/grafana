---
name: dev-environment
description: Run initial local development setup commands. Use when the user asks about local dev setup, initial setup, frontend build, backend build, or how to run locally.
---

# Development environment setup

## Instructions

When setting up the local development environment, run the commands below using the Shell tool. Start the frontend and backend in separate terminals.

### Git remotes configuration

First, configure git remotes to ensure consistency across the team:

```sh
./scripts/setup-git-remotes.sh
```

### Frontend setup and build

Run from the repo root:

```sh
corepack enable
corepack install
yarn install --immutable
```

### Backend build and run

Run from the repo root:

```sh
make run
```

### Frontend assets watcher

Run from the repo root in a separate terminal:

```sh
yarn start
```

## Notes

- Keep the response limited to these commands unless the user asks for dependencies or troubleshooting.
- Wait for readiness: backend should log `HTTP Server Listen`, frontend should log `Compiled successfully` (and finish type-checking) before opening the browser.
- After both are ready, run `curl -I http://localhost:3000/` as a quick check. If it doesn't return `HTTP/1.1 302` to `/login`, diagnose the backend and retry the check before moving on.
- `http://localhost:3000/` redirects to `/login`, so `http://localhost:3000/login` is a good smoke check.
- If the user asks for prerequisites, point to `contribute/developer-guide.md` and mention Go and Node.js LTS with Corepack enabled.
