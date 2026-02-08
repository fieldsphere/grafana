---
name: issue-tracker
description: List and view GitHub issues using the gh CLI. Use when the user wants to pull, fetch, list, or view GitHub issues from a repository.
---

# Issue tracker

## Overview

Standard workflow for tracking and viewing issues. Uses the GitHub CLI (`gh`) following our repository conventions.

## List issues

```sh
gh issue list --repo fieldsphere/grafana [options]
```

Common options:
- `--state all` – include closed issues (default: open only)
- `--limit N` – max issues to fetch (default: 30)
- `--assignee @me` – issues assigned to you
- `--author USER` – issues by author
- `--label "label"` – filter by label (repeat for multiple)
- `--search "query"` – GitHub search syntax (e.g. `error no:assignee sort:created-asc`)

## View a single issue

```sh
gh issue view <NUMBER> --repo fieldsphere/grafana [options]
```

Options:
- `--comments` – include comments
- `--json fields` – output JSON (fields: number, title, body, state, labels, assignees, author, createdAt, updatedAt, url)

## Structured output

For parsing and summarization:

```sh
gh issue list --repo fieldsphere/grafana --json number,title,state,labels,assignees,createdAt --limit 50
```

```sh
gh issue view 123 --repo fieldsphere/grafana --json number,title,body,state,labels,assignees,comments
```

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
