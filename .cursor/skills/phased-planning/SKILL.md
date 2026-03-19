---
name: phased-planning
description: Create phased implementation plans with clear sequencing, exit criteria, and a follow-up sub-plan prompt for each phase. Use in Plan mode when the user asks for a phased plan, staged rollout, multi-step roadmap, migration plan, or wants work broken into phases with separate sub-plans per phase.
---

# Phased Planning

## Quick Start

Use this skill when the user wants a plan split into phases rather than one flat task list.

Default to:

1. `2-5` phases unless the user asks for more detail
2. Clear boundaries between phases
3. A short sub-plan prompt for each phase so the user can expand that phase later
4. Explicit assumptions, dependencies, and risks

Do not turn the top-level plan into a full task breakdown unless the user asks for that depth.

## Planning Rules

1. Start by identifying the natural sequence of work
2. Group work by outcome, not by file or team
3. Make each phase independently understandable
4. Include what is intentionally deferred to later phases
5. Add exit criteria so the user knows when a phase is done
6. End each phase with a `Sub-plan next` prompt the user can reuse

## Workflow

### 1. Frame the plan

Before drafting phases, quickly determine:

- What outcome the user wants
- What constraints matter
- Which unknowns could change the sequencing

Ask follow-up questions only if missing information would materially change the phase order.

### 2. Define the phases

Pick phase boundaries using one or more of these patterns:

- Foundation -> implementation -> rollout
- Discovery -> migration -> cleanup
- Backend -> frontend -> validation
- Minimum viable path -> hardening -> expansion

### 3. Write each phase

Each phase should include:

- `Goal`: the intended outcome
- `Why this phase now`: why it comes before later phases
- `In scope`: what gets done here
- `Out of scope`: what is deferred
- `Dependencies`: blockers or prerequisites
- `Exit criteria`: how to know the phase is complete
- `Sub-plan next`: a prompt for expanding that phase into a detailed plan

### 4. Close the plan

After the phases, include:

- `Cross-phase risks`
- `Open questions`
- `Recommended starting phase`

## Response Template

Use this structure by default:

```markdown
## Phased Plan

### Phase 1: [Name]
Goal: [Outcome]
Why this phase now: [Reason]
In scope:
- [Item]
- [Item]
Out of scope:
- [Deferred item]
Dependencies:
- [Dependency]
Exit criteria:
- [Check]
- [Check]
Sub-plan next: Create a detailed execution plan for Phase 1 covering implementation steps, validation, risks, and handoff.

### Phase 2: [Name]
Goal: [Outcome]
Why this phase now: [Reason]
In scope:
- [Item]
- [Item]
Out of scope:
- [Deferred item]
Dependencies:
- [Dependency]
Exit criteria:
- [Check]
- [Check]
Sub-plan next: Create a detailed execution plan for Phase 2 covering implementation steps, validation, risks, and handoff.

## Cross-phase risks
- [Risk]

## Open questions
- [Question]

## Recommended starting phase
[Phase name] because [reason].
```

## Depth Control

Use these defaults:

- If the request is broad or ambiguous, keep each phase concise
- If the request is implementation-focused, make `In scope` and `Exit criteria` more concrete
- If the user explicitly wants detailed planning, add suggested milestones inside each phase

Do not add sub-steps under `Sub-plan next`. That section is a handoff prompt, not the sub-plan itself.

## Good Outcomes

A strong phased plan should make it obvious:

- Why the phases are ordered that way
- What can happen in parallel versus what must wait
- What the user should plan next
- What success looks like for each phase

## Example Use Cases

- Large refactors
- Feature rollouts behind flags
- API migrations
- Backend/frontend split work
- Database or infrastructure changes
- Multi-team initiatives that need staged delivery
