# Documentation tech debt — Grafana repo analysis

**Analysis date:** 2026-05-11  
**Method:** Explore sub-agent (read-only) over `docs/`, root/contrib Markdown, CI workflows, and common staleness patterns. Spot-checks verified in workspace.

**Environment note:** This checkout is a Fieldsphere fork. Active CI is `.github/workflows/fieldsphere-ci.yml` only; documentation workflows under `.github/workflows-upstream-archive/` are not executed here unless restored.

---

## Executive summary

1. **No docs CI in active workflows** — Vale, `prettier:checkDocs`, and Hugo/docs-base jobs exist only in archived workflows; drift is easy to miss locally.
2. **Contributor docs drift** — `docs/README.md` lists Yarn >= 1.22.4 while the repo uses Yarn 4 via Corepack; references `.github/workflows/publish.yml` which is absent from active `.github/workflows/`; transformations path points at a non-existent tree (actual file: `docs/sources/visualizations/panels-visualizations/query-transform-data/transform-data/index.md`).
3. **Broken / risky links** — `CONTRIBUTING.md` has a malformed nested Markdown link for Grafana Champions; `docs/sources/alerting/set-up/configure-alertmanager/_index.md` reportedly has an empty `()` link; Grizzly doc uses raw `<GRAFANA_VERSION>` in a URL.
4. **Stale vendor / version text** — `pkg/build/wire/CONTRIBUTING.md` still says “Go 1.11” (upstream Wire); `docs/sources/as-code/observability-as-code/foundation-sdk/dashboard-automation.md` pins Go 1.24.6 vs `go.mod` / AGENTS guidance.
5. **Shipped docs placeholders** — HTML `<!-- TODO -->` / `<!-- FIXME -->` in whats-new and visualization pages; `devenv/docker/ha-test-unified-alerting/README.md` sections marked TBD.
6. **Editorial noise** — e.g. large HTML comments in `docs/sources/whatsnew/whats-new-in-v9-0.md`.
7. **Dual AGENTS** — Root `AGENTS.md` (engineering) vs `docs/AGENTS.md` (writers’ toolkit); same filename, different scope — risk of applying the wrong guide.
8. **Typography / typos** — e.g. `docs/README.md` “automatically build” → “built”; `contribute/developer-guide.md` “recommded”.
9. **docs tooling** — `docs/docs.mk` relref error level defaults to WARNING; broken relrefs may not fail local builds.
10. **Internal process lists** — e.g. `public/app/features/alerting/unified/TODO.md` (not end-user docs, but inventory debt).

---

## Findings by category

### P0 — Broken or misleading for contributors / readers

| Path | Issue |
|------|--------|
| `CONTRIBUTING.md` | Malformed link: nested `[text]([https://...](https://...))` on Champions line |
| `docs/README.md` | Wrong auto-generated transformations path; wrong/outdated publish workflow reference |
| `docs/sources/alerting/set-up/configure-alertmanager/_index.md` | Empty markdown link target `]()` (per scan) |
| `docs/sources/as-code/infrastructure-as-code/grizzly/_index.md` | Literal `<GRAFANA_VERSION>` in URL may not resolve as intended |

### P1 — Toolchain / automation mismatch

| Path | Issue |
|------|--------|
| `docs/README.md` | Yarn 1.x stated; repo uses Corepack + Yarn 4 |
| `pkg/build/wire/CONTRIBUTING.md` | “Go 1.11”, upstream Wire issue links — misleading |
| `docs/sources/as-code/observability-as-code/foundation-sdk/dashboard-automation.md` | Go 1.24.6 vs current `go.mod` |
| `.github/workflows/` vs `docs/README.md` | No `publish.yml`; archive has `publish-technical-documentation-*.yml` |

### P2 — Visible staleness in published content

Whats-new TODO/FIXME comments; gauge/dashboard-controls screenshot TODOs; HA devenv README TBDs; `docs/sources/whatsnew/whats-new-in-v9-0.md` editorial HTML comments.

### P3 — Niche / low traffic

Alerting unified `TODO.md` / `TESTING.md`; package-level CONTRIBUTING variance.

### CI / automation gap

| Evidence |
|----------|
| `fieldsphere-ci.yml` — no docs sources, Vale, or Hugo steps |
| `workflows-upstream-archive/documentation-ci.yml`, `lint-build-docs.yml` — docs checks present but archived |

### Style guide consistency (example)

`docs/AGENTS.md` requires `title` == h1; Grizzly page `title: Grizzly` vs `# Grizzly (deprecated)` — mismatch.

---

## Quick wins

- Fix `CONTRIBUTING.md` Champions link and verify root links.
- Correct `docs/README.md`: Yarn guidance, transformations path, publish workflow naming/paths, “built” typo.
- Fix empty `()` link and `<GRAFANA_VERSION>` handling in Grizzly doc.
- Remove or resolve obvious `<!-- TODO/FIXME -->` in shipped whats-new / viz pages.
- Typo: `contribute/developer-guide.md` “recommded”.

## Larger initiatives

- Restore or replace minimal docs CI (e.g. `prettier:checkDocs` and/or targeted Vale).
- Documentation map: when to use `AGENTS.md` vs `docs/AGENTS.md` vs `contribute/documentation/README.md`.
- Replace `pkg/build/wire/CONTRIBUTING.md` with a short Grafana-specific pointer.
- Optional CI guard: fail on `]()` in `docs/sources` or on `<!-- TODO:` in non-draft pages.

---

## Suggested Jira backlog (apply label: `tech-debt` or project equivalent)

Use your project’s keys; one possible breakdown:

1. **Docs CI** — Enable minimal docs lint/build in fork or document that validation is upstream-only.
2. **P0 link + README accuracy** — CONTRIBUTING + docs/README + configure-alertmanager + Grizzly version URL.
3. **Toolchain alignment** — Single pass: Go/Yarn versions across docs and `pkg/build/wire/CONTRIBUTING.md`.
4. **Placeholder sweep** — Whats-new and visualization TODO/FIXME HTML comments.
5. **AGENTS cross-link** — Clarify root vs `docs/AGENTS.md` at top of both files.

---

## Confluence upload note

If pasting into Confluence Cloud: use **Insert → Markup** or a Markdown macro if enabled; otherwise paste sections and convert headings/tables manually. Atlassian MCP was unavailable in this environment; this file is the canonical report body for manual publish.
