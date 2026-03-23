---
name: plan-spec
description: Fetches a Confluence specification page and produces a structured implementation plan. Use when the user wants to plan work from a Confluence doc, /plan-spec, or turn a tech spec into an engineering plan. Always requires a plan item to update that Confluence page with implementation status.
---

# Plan implementation from a Confluence spec

## When this applies

The user provides (or points to) a **Confluence page** that describes a feature, system change, or technical specification, and wants an **implementation plan** derived from it.

## Prerequisites

- Atlassian MCP available (`plugin-atlassian-atlassian`).
- Confluence scopes: **read** for the source page; **write** if the user later executes the “update Confluence” follow-up.

## Defaults

- **Space**: Default to the Confluence space key **`GRAFANA`**. Resolve **`spaceId`** with `getConfluenceSpaces`. If the user’s URL or instructions name another space, follow that.
- **Location**: Treat specs as living under the **Technical Specifications** folder in that space. When the user does not give a full page URL or `pageId`, **always** discover pages there first: find the **Technical Specifications** parent page (folder) in the **`GRAFANA`** space, then list or search **only** under that ancestor (e.g. child pages, or CQL with an `ancestor` / parent constraint matching that page). Do not browse the whole **`GRAFANA`** space for a spec title unless the user says the page lives elsewhere.
- **`cloudId`**: From `getAccessibleAtlassianResources`.

## Workflow

### 1. Resolve the page

1. Call `getAccessibleAtlassianResources` → **`cloudId`**.
2. Obtain **`pageId`**:
   - From a Confluence URL: numeric segment after `/pages/` or in `pageId=` query params.
   - If missing: resolve the **Technical Specifications** parent in the **`GRAFANA`** space, then search or list **within that subtree** (title match, CQL scoped to that ancestor, or equivalent MCP tools). Only widen the search outside **Technical Specifications** if the user explicitly points elsewhere or confirms the spec is not under that folder.

### 2. Load the spec body

1. `getConfluencePage` with `cloudId`, `pageId`, `contentFormat: "markdown"` (use `adf` only if markdown loses critical structure).
2. If the body is empty or truncated, retry ADF or ask the user to paste the relevant sections.

### 3. Produce the implementation plan

From the spec, derive a plan that includes:

- **Summary**: what is being built or changed (1 short paragraph).
- **Scope / out of scope**: explicit boundaries if the spec allows inferring them.
- **Assumptions and dependencies**: teams, APIs, flags, migrations, external systems.
- **Work breakdown**: ordered tasks or phases (granularity matching spec depth — ask one clarifying question only if sequencing would be wrong without an answer).
- **Testing and validation**: what to verify (unit, integration, manual, rollout checks) as implied by the spec.
- **Risks and open questions**: gaps in the spec that affect implementation.

Use the repo’s stack and patterns (e.g. separate FE/BE PRs when relevant) when the work is in this codebase.

### 4. Mandatory Confluence follow-up (non-optional)

The plan **must** include a dedicated checklist item (and, when using execution tracking, a **todo**) for **updating the same Confluence page** with implementation status.

**Label it clearly**, for example:

- `[ ] **Update Confluence spec with implementation status** — Edit the source page (same `pageId` / link): add or refresh an **Implementation status** (or equivalent) section with current phase, done vs in progress, key PRs/links, blockers, and dates. Use `updateConfluencePage` with `contentFormat: "markdown"`, a concise `versionMessage`, and preserve unrelated spec structure where possible.

This item is **not** optional boilerplate: it must appear in the written plan and remain until the page is actually updated (or the user defers it explicitly).

## Plan template

Use this shape by default (keep the Confluence line verbatim in concept; adjust wording only if the user’s template already names a status section):

```markdown
## Implementation plan: [title from spec or page]

### Summary
...

### Scope
- **In scope:** ...
- **Out of scope:** ...

### Assumptions & dependencies
- ...

### Work breakdown
1. ...
2. ...

### Testing & validation
- ...

### Risks & open questions
- ...

### Follow-up
- [ ] **Update Confluence spec with implementation status** — [page title](webUrl): add/refresh **Implementation status** (phase, progress, PRs, blockers, dates); `updateConfluencePage` + short `versionMessage`.
```

After creating the plan, give the user the **Confluence `webUrl`** again if known.

## Executing the plan later

When moving from plan to execution:

1. Use the editor todo list (or task tracker) and **include** the Confluence status update item until done.
2. On milestones (e.g. phase complete, release), perform the page update so the spec stays the source of truth for **delivery state**, not only intent.

## Tips

- If you need the **Technical Specifications** container’s `pageId` for CQL or child listing, resolve it once in the **`GRAFANA`** space before searching for the spec by title.
- If the spec is a template with empty sections, call out missing decisions instead of inventing requirements.
- Prefer linking Jira epics/issues only when the user asks or when IDs already appear in the spec.
- Large specs: summarize dependencies first, then the work breakdown, to keep the plan readable.
