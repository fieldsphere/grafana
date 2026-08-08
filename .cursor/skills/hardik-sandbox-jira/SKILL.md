---
name: hardik-sandbox-jira
description: Uses Jira project hardik-sandbox (key HSS) on fe-anysphere-demo for issue triage, acceptance criteria, and verify-after-fix workflows in this Grafana repo. Mandates a new git branch before any HSS implementation edits. Use when the user mentions HSS, hardik-sandbox, fe-anysphere-demo, or Jira work tied to that project.
---

# hardik-sandbox (HSS) Jira workflow

## Team / project identity

| Item | Value |
|------|--------|
| Jira site | `https://fe-anysphere-demo.atlassian.net` |
| Project name | `hardik-sandbox` |
| Project key | `HSS` (issues look like `HSS-1`, `HSS-2`) |
| Browse URL pattern | `https://fe-anysphere-demo.atlassian.net/browse/HSS-<n>` |

Code and PRs for this repo still follow [github-fieldsphere-fork](../github-fieldsphere-fork/SKILL.md): target **`fieldsphere/grafana`**, not upstream, unless the user says otherwise.

## Resolving the Atlassian `cloudId`

Before calling Jira MCP tools (`searchJiraIssuesUsingJql`, `getVisibleJiraProjects`, `getJiraIssue`, etc.):

1. Call `getAccessibleAtlassianResources` (Atlassian MCP) and use the `id` for the site that matches `fe-anysphere-demo.atlassian.net`.
2. If you already have a working `cloudId` from a prior call in the session, you may reuse it for the same site.

Do not guess UUIDs; always resolve from accessible resources or tool docs if the site list changes.

## JQL patterns

- All open bugs: `project = HSS AND type = Bug AND statusCategory != Done ORDER BY priority DESC, updated DESC`
- One issue: `key = HSS-1` (or use `getJiraIssue` with the key)
- High-priority bugs: add `AND priority in (Highest, High)` if the user asks for priority-only

Confirm the project key with `getVisibleJiraProjects` and `searchString: "hardik"` if HSS is ever ambiguous (companion project **hardik-barkenciaga** uses key **BRK**).

## New branch before implementation (required)

- **Do not** change source, tests, or config in the working tree for an HSS ticket until you are on a **dedicated new branch** created for that work.
- From the default integration branch (usually `main` — confirm with `git remote show origin` or the repo’s convention), create and check out a branch. Example names: `HSS-1-refresh-fallback` or `hss-1-refresh-fallback` (issue key + short kebab slugs are ideal).
- Jira, read-only code search, and `git status` are fine on any ref; the **first edit** toward the fix (and every subsequent commit) must be on the new branch.

## Implementation workflow (issue → code → test)

1. **Read the issue** — summary, environment, steps to reproduce, expected vs actual. Pull full description via Jira when needed.
2. **New branch** — before modifying any project files, satisfy [New branch before implementation](#new-branch-before-implementation-required) and check out the branch; then continue.
3. **Locate the root cause** in this repository (semantic search, then narrow to files; read callers/tests).
4. **Fix** — minimal diff; match local patterns; prefer extending existing helpers over duplicating behavior.
5. **Test**
   - Run targeted Jest: the test file next to the change, or the smallest suite that covers the path (e.g. `TimeSrv` + util tests for URL/refresh work).
   - Re-run until green; add or extend a test that encodes the issue’s scenario (repro in test name or comment) when non-obvious.
6. **Report** — cite issue key, root cause, branch name, files touched, and test command(s) that passed.

## What not to assume

- **Blessed Databricks/usage tables** in workspace rules are unrelated to HSS ticket work; ignore them for Grafana bugfix tasks unless the user explicitly conflates them.
- Jira **Priority** (Highest/High/…) is separate from “this issue is a priority to the team” — use the `priority` field in JQL when the user asks for *priority* in the Jira sense.
