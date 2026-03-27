# BUGBOT Review Rules — Grafana

General guidance for automated code reviewers across the Grafana monorepo.

## Architecture Boundaries

- **Backend (`pkg/`)**: Go services, HTTP API, plugins, infrastructure.
- **Frontend (`public/app/`)**: React/TypeScript features, Redux state, UI components.
- **Shared packages (`packages/`)**: `@grafana/data`, `@grafana/ui`, `@grafana/runtime`, `@grafana/schema`.
- **Backend apps (`apps/`)**: Standalone Go apps using Grafana App SDK.

Changes should respect these boundaries. A PR that mixes deep backend service changes with frontend feature work is a red flag — these deploy on different cadences.

## Cross-Cutting Concerns

### Security

- No secrets, credentials, or tokens in committed code.
- User-supplied input must be validated before use in SQL, URLs, file paths, or templates.
- RBAC checks are required on all new API endpoints — see `pkg/api/.cursor/BUGBOT.md` for details.
- Frontend must sanitize user content to prevent XSS (use Grafana's sanitize utilities, not raw `innerHTML`).

### Error Handling

- Backend: use `errutil`-based errors that map to safe HTTP responses. Never expose raw Go errors to clients.
- Frontend: use error boundaries and user-friendly messages. Avoid swallowing errors silently.

### Testing

- New features need tests. Backend: Go unit tests alongside the code. Frontend: React Testing Library tests.
- Bug fixes should include a regression test that fails without the fix.

### Code Generation

- Changes to Wire DI setup require `make gen-go`.
- Changes to CUE schemas (`kinds/`) require `make gen-cue`.
- Changes to feature flags require `make gen-feature-toggles`.
- PRs that modify generated files by hand (instead of re-running generators) should be flagged.

## Scoped BUGBOT Rules

Subdirectories may contain their own `BUGBOT.md` with package-specific rules. Check for and defer to those when reviewing changes in:

- `pkg/api/.cursor/BUGBOT.md` — HTTP API layer review rules
