---
name: my-specs
description: Finds the Technical Specifications hub in Grafana Confluence, lists child specification pages and the Template, and optionally fetches page bodies in markdown. Use when the user asks for their technical specifications in Confluence, where tech specs live, to list spec pages under Technical Specifications, or to load the canonical spec template for reading (not authoring).
---

# Get Confluence technical specifications

## When this applies

The user wants to **locate, list, or read** technical specifications stored under Confluence—not create a new spec (for that, use the **new-spec** skill).

## Prerequisites

- Atlassian MCP: `plugin-atlassian-atlassian`
- Confluence scopes: **read** pages (write not required)

## Defaults

Follow workspace/project rules for Confluence:

- **Space key**: `GRAFANA` unless the user gives another space key or page URL.
- **Hub page title**: **Technical Specifications** (parent for spec pages and **Template**).

## Workflow

### 1. Resolve `cloudId` and `spaceId`

1. `getAccessibleAtlassianResources` → use returned `id` as **`cloudId`**.
2. `getConfluenceSpaces` with `cloudId` and `keys: ["GRAFANA"]` (or user’s key) → **`spaceId`**.

### 2. Find the **Technical Specifications** parent

Prefer structure over title-only search:

1. `getPagesInConfluenceSpace` with `cloudId`, `spaceId`, `title: "Template"`, `limit: 25`.
2. If several pages are titled **Template**, pick the one whose parent is **Technical Specifications**: call `getConfluencePage` on each candidate’s `parentId` until `title` is **Technical Specifications** (or use the user’s URL if they provided one).
3. That parent page’s id is the **spec hub** `pageId`.

**CQL caveat:** `searchConfluenceUsingCql` with `title ~ "Technical Specification"` (or plural) may return **no results** even when the hub exists. Do not rely on that alone; use the Template → parent chain above.

**Fallback:** `searchAtlassian` with a query like `Technical Specifications Template Grafana Confluence` and confirm space/key from hit URLs.

### 3. List specification pages

1. `getConfluencePageDescendants` with `cloudId` and the hub **`pageId`** (from step 2).
2. Present each child: **title**, **page id**, and full **web** URL (from `getConfluencePage` `_links.webui` / `webUrl` or site base + web path).
3. Call out **Template** explicitly as the canonical empty structure (same page used by **new-spec**).

### 4. Optional: fetch bodies

When the user wants content, not just links:

- `getConfluencePage` with `cloudId`, `pageId`, `contentFormat: "markdown"` for each requested page.

Keep responses proportional: summarize long pages or offer a single page in full.

## Relationship to other skills

- **new-spec**: Creates a new page from **Technical Specifications** → **Template**; requires write access and user-provided title.
- **plan-spec**: Builds an implementation plan from an existing spec page the user points to.

## Output shape

When listing, prefer a short table:

| Title | Page ID | URL |
| --- | --- | --- |
| … | … | … |

Mention the hub page URL once at the top.
