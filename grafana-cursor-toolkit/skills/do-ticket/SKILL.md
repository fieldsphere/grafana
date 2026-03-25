---
name: do-ticket
description: Implement a Jira ticket end to end: read the ticket, explore the codebase, ask clarifying questions, draft an implementation plan, create a feature branch, make targeted code changes, validate with lint and tests, and prepare commits and a pull request. Use when the user provides a Jira ticket ID such as GRAF-123 and wants the work implemented.
---

# Do Ticket

Implement a Jira ticket from start to finish: read, plan, clarify, branch, implement, validate, commit, and open a pull request.

## Quick start

When using this skill:

1. Read the Jira ticket and extract the requested behavior, constraints, and acceptance criteria.
2. Explore the codebase to find the smallest safe implementation.
3. Ask clarifying questions if the ticket leaves material ambiguity.
4. Write an implementation plan in Markdown. Publish it to Confluence only if the user wants that or the workflow requires it.
5. Create a feature branch named `av-<ticket-id>-<short-description>`.
6. Implement targeted changes incrementally and validate with lint and the smallest relevant test scope.
7. Commit only when the user explicitly asks for a commit. Use conventional commit messages.
8. Create a pull request only when the user explicitly asks for it.

## Tooling rules

- Before calling any MCP tool, read its descriptor/schema first.
- If an MCP server exposes `mcp_auth`, run it before using the server.
- For GitHub work in this repo, read and follow `../github-fieldsphere-fork/SKILL.md`.
- Prefer the smallest relevant test command. For frontend unit tests, start with root Jest. For backend tests, start with targeted `go test` in the affected package.
- Never start a new dev server unless the user explicitly asks for it. Check for an existing server first.

## Phase 1: Understand

### 1. Read the Jira ticket

Use the Atlassian MCP to retrieve the ticket when available. Capture:

- Ticket key and summary.
- Problem statement and expected behavior.
- Acceptance criteria.
- Linked issues, design docs, or related tickets.
- Constraints, rollout notes, and testing expectations.

If Jira is unavailable, ask the user to paste the ticket details.

### 2. Explore the codebase

Use code search, file reads, and explore subagents as needed to identify:

- The files and modules that likely need changes.
- Existing patterns to follow.
- Adjacent tests to update.
- Risks, edge cases, and integration points.

Favor minimal changes over broad refactors unless the ticket requires more.

### 3. Clarify ambiguity

Ask concise questions when the ticket is unclear about:

- Scope boundaries.
- User-visible behavior.
- Data shape or API behavior.
- Migration or compatibility requirements.
- Whether a Confluence implementation plan is required.

## Phase 2: Plan

### 4. Draft the implementation plan

Use this template:

```markdown
# Implementation plan: <TICKET-ID> <Summary>

## Scope
- In scope: ...
- Out of scope: ...

## Approach
Brief rationale for the chosen implementation.

## File changes
- `path/to/file.ts`: Describe the change.
- `path/to/test.ts`: Describe the test coverage.

## Steps
1. ...
2. ...

## Edge cases
- ...

## Test plan
- [ ] Unit tests for ...
- [ ] Integration test for ...
- [ ] Manual verification for ...

## Risks
- Risk and mitigation.
```

### 5. Publish the plan when needed

If the user asks for a Confluence page or the workflow requires a published plan:

- Use the Atlassian MCP to create the page.
- Use a title like `<TICKET-ID> implementation plan`.
- Return the Confluence URL to the user.

If publishing fails, keep the plan locally in the conversation and ask how to proceed.

## Phase 3: Implement

### 6. Create the branch

Create a local branch with this format:

```text
av-<ticket-id>-<short-description>
```

Before creating it:

- Check whether the branch already exists locally or remotely.
- If it exists, ask the user whether to reuse it or create a variant.

### 7. Make the changes

Implement the work incrementally:

- Update the smallest set of files needed.
- Follow existing project patterns.
- Add or update tests alongside the code.
- Run `ReadLints` after substantive edits.
- Run the smallest relevant test scope after each meaningful step.

If you hit a blocker or discover conflicting existing changes, stop and ask the user how to proceed.

### 8. Organize commits

Only commit when the user explicitly requests it.

When committing:

- Group related changes logically.
- Keep each commit buildable.
- Use conventional commits, for example `fix(alerting): handle empty contact point list`.
- Avoid mixing unrelated refactors into ticket work.

## Phase 4: Ship

### 9. Push and create the pull request

Only do this when the user explicitly asks.

Before creating the pull request:

- Ensure the branch is pushed.
- Summarize the change clearly.
- Link the Jira ticket.
- Link the Confluence plan if one was created.
- Include a focused test plan.

Use this pull request body template:

```markdown
## Summary
- Brief description of the change.

## Jira ticket
- [<TICKET-ID>](https://fe-cursor-demos.atlassian.net/browse/<TICKET-ID>)

## Implementation plan
- <Confluence URL or "Not created">

## Test plan
- [ ] Relevant unit tests pass.
- [ ] Relevant integration tests pass.
- [ ] Manual verification completed.
```

### 10. Report back to the user

Provide:

- The branch name.
- The Confluence URL if applicable.
- The pull request URL if applicable.
- A short summary of the implementation.
- The tests and validation that were run.

## Failure handling

- **Jira unavailable**: Ask the user for the ticket details manually.
- **Confluence publish fails**: Keep the plan in Markdown and ask whether to retry later.
- **Branch already exists**: Ask whether to reuse it or create a new branch name.
- **Tests fail**: Investigate and fix if clearly caused by the change. Otherwise report the failure and likely cause.
- **Push or PR creation fails**: Return the error context and provide the next manual step.

## Completion checklist

- [ ] The Jira ticket was read and understood.
- [ ] Ambiguities were resolved or explicitly called out.
- [ ] An implementation plan was drafted.
- [ ] A branch with the `av-` prefix was created when needed.
- [ ] The code changes were implemented with minimal scope.
- [ ] Relevant lint and tests were run.
- [ ] Commits were created only if the user requested them.
- [ ] A pull request was opened only if the user requested it.
- [ ] The user received links and a concise summary.
