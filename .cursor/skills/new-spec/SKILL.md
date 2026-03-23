---
name: new-spec
description: Starts a new Confluence technical specification from the Technical Specifications → Template page, creates a titled page, and co-edits content with the user. Use when the user wants a new tech spec, /new-spec, or to fill out the technical specification template in Confluence.
---

# New technical specification (Confluence)

## When this applies

The user wants to author a **new technical specification** using the canonical template under **Technical Specifications** (parent) → **Template** (child) in Confluence.

## Prerequisites

- Atlassian MCP available (`plugin-atlassian-atlassian`).
- Confluence scopes: read + write pages.

## Defaults (project rules)

- **Space**: Grafana Confluence space from workspace rules. Resolve the **numeric `spaceId`** with `getConfluenceSpaces` — the Confluence **space key** is often `GRAFANA` (uppercase) even when the space is named “Grafana”. If the user names another space or URL, follow that instead.
- **Template location**: Page titled **Template** whose parent is **Technical Specifications** (same space).

## Workflow

### 1. Resolve site and space

1. Call `getAccessibleAtlassianResources` → use returned `id` as **`cloudId`** (or the site hostname if that works).
2. Call `getConfluenceSpaces` with `cloudId` and `keys: ["GRAFANA"]` (or the user’s space key) → **`spaceId`**.

### 2. Load the template body

Prefer a live fetch (template changes stay authoritative):

1. List pages in the space: `getPagesInConfluenceSpace` with `cloudId`, `spaceId`, `title: "Template"`, `limit: 25` (or paginate).
2. If multiple pages match **Template**, pick the one under **Technical Specifications** (check `parentId` via `getConfluencePage` on the parent, or match parent title).
3. Call `getConfluencePage` with `cloudId`, that page’s `pageId`, `contentFormat: "markdown"` → **`templateBody`**.

If listing/search fails, try CQL `searchConfluenceUsingCql`, or ask the user for the **Template** page URL or ID. As a last resort, use the snapshot in [reference.md](reference.md).

### 3. Ask for the spec title

**Stop and ask the user:** *What should the new specification be titled?* (Confluence page title.)

Do not create the page until they answer.

### 4. Create the new page

After the user provides the title:

1. **`parentId`**: Use the **Technical Specifications** page ID (parent of **Template**), unless the user wants a different parent.
2. **`createConfluencePage`**:
   - `cloudId`, `spaceId`, `contentType: "page"`, `contentFormat: "markdown"`
   - `title`: user’s title
   - `parentId`: as above
   - `body`: copy of **`templateBody`** with:
     - First heading replaced with `# {user title}` (remove placeholder `# [Feature or system name]` style line if present).
     - In the metadata table, set **Created** and **Last updated** to today’s date (`YYYY-MM-DD`) when those rows exist.
3. Record the returned **`pageId`** and **`webUrl`** and share the link with the user.

### 5. Co-fill the spec with the user

Work **section by section** (or small groups of sections) to avoid overwhelming prompts:

1. Briefly list the next **1–3 sections** to fill (e.g. Summary, Problem statement, Goals).
2. Ask targeted questions or offer to draft from bullets the user provides.
3. Merge answers into the markdown body and call **`updateConfluencePage`** with `cloudId`, `pageId`, `body`, `contentFormat: "markdown"`, and a short **`versionMessage`** (e.g. “Fill summary and problem statement”).
4. Repeat until the user is done or all sections are addressed.

Preserve template structure (headings, tables, horizontal rules) unless the user explicitly wants edits.

## Tips

- After each `updateConfluencePage`, confirm what changed and link `webUrl` again if helpful.
- For large sections, the user can paste rough notes; the agent polishes into spec tone and updates the page.
- If `createConfluencePage` fails on `spaceId`, re-fetch space metadata with `getConfluenceSpaces`.

## Optional reference

- Offline template copy and parent/title hints: [reference.md](reference.md)
