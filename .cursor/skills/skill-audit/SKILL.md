---
name: skill-audit
description: Audit project skills for overlapping functionality, trigger collisions, and unclear boundaries. Use when creating a new skill, reviewing existing skills, deduplicating agent capabilities, or when the user asks which skills overlap or should be consolidated.
---

# Skill Audit

## Quick Start

Use this skill to review the current project's skills and flag overlap with actionable suggestions.

Default scope:

1. Scan project skills under `.cursor/skills/*/SKILL.md`
2. Read each skill's frontmatter and main instructions
3. Compare purpose, trigger language, scope, and output shape
4. Report only meaningful overlap, not loose thematic similarity

## What To Capture Per Skill

For each skill, extract:

- `Name`
- `Description`
- `Primary job`: the main task the skill helps with
- `Trigger terms`: phrases that cause the skill to be applied
- `Scope limits`: project-only, mode-specific, tool-specific, or domain-specific boundaries
- `Expected output`: plan, implementation, review, documentation, setup steps, and so on

Prefer concise notes over full summaries.

## Overlap Rules

Classify overlap using these buckets:

- `High overlap`: same primary job and very similar trigger terms
- `Medium overlap`: same job but one skill is a narrower or slightly specialized version
- `Low overlap`: similar area but different output, audience, or execution stage
- `No meaningful overlap`: adjacent or sequential skills that support different steps

Treat these as boundary differences, not overlap, unless the instructions still collide:

- One skill plans and another implements
- One skill creates content and another reviews it
- One skill is a specialized sub-workflow inside a broader skill
- One skill is tied to a specific tool, server, mode, or directory

## Review Workflow

### 1. Inventory skills

List all project skills under `.cursor/skills/`.

If the project also contains directory-specific agent guidance that changes how a skill should be used, note that separately but do not count it as a skill.

### 2. Normalize each skill

Rewrite each skill into a one-line summary:

`[skill-name]: helps with [primary job] when [trigger] and produces [output]`

This makes pairwise comparisons faster and less noisy.

### 3. Compare for collisions

Look for:

- Duplicate trigger phrases such as "use when the user asks for..."
- Multiple skills claiming the same top-level workflow
- A broad skill whose description swallows a narrower one
- Two skills that would both reasonably auto-trigger on the same request

### 4. Filter false positives

Before flagging an overlap, check whether the skills differ by:

- Required mode
- Required external system
- Different artifact produced
- Different phase of work
- Different source material

If the distinction is strong enough that both skills can coexist cleanly, classify it as `Low overlap` or `No meaningful overlap`.

### 5. Suggest fixes

For `High overlap` and `Medium overlap`, suggest one of:

- Clarify the description with narrower trigger terms
- Add an explicit "use this instead of X when..." boundary
- Merge one skill into the other
- Keep both but redefine one around a tighter output or workflow stage

Prefer the smallest change that makes auto-selection clearer.

## Response Format

Use this structure by default:

```markdown
## Skill Overlap Report

### High overlap
- `skill-a` vs `skill-b`
  Reason: [why they collide]
  Recommendation: [smallest fix]

### Medium overlap
- `skill-c` vs `skill-d`
  Reason: [shared area with meaningful distinction]
  Recommendation: [clarify boundary]

### Low overlap or adjacent
- `skill-e` vs `skill-f`
  Reason: [why they seem similar but should remain separate]

### Consolidation suggestions
- [Suggestion]

### Coverage notes
- [Any missing or ambiguous areas discovered during review]
```

Keep the report short. Do not dump every pairwise comparison; only include findings worth action.

## Naming Guidance

When overlap is caused by vague naming, prefer names that encode the workflow or artifact:

- `plan-spec` over `spec-helper`
- `commit-message-format` over `git-helper`
- `run-tests` over `verification-tools`

If a skill name is broad but the description is clear, only recommend renaming if discoverability is actually harmed.

## Good Outcomes

A strong overlap audit should make it obvious:

- Which skills compete for the same request
- Which skills are merely adjacent
- Which descriptions should be tightened
- Whether consolidation is worth the churn
