---
name: document
description: Takes the current chat conversation and publishes it to Confluence. Use when the user asks to document the chat, add the conversation to Confluence, save the discussion to Confluence, or create a Confluence page from this chat.
---

# Document Chat to Confluence

## Instructions

When the user wants to document the current chat in Confluence:

1. **Synthesize the conversation** from the chat context. Include:
   - A brief summary of the topic or task
   - Key user questions and requests
   - Main assistant responses, decisions, and outcomes
   - Code snippets, file paths, or commands if relevant

2. **Format the content** as Markdown for Confluence. Use headings, lists, and code blocks. Structure:
   - Title/summary at top
   - Sections for major discussion points
   - Preserve important technical details

3. **Resolve Atlassian connection**:
   - If the user provides a Confluence URL or space, use it
   - Otherwise use `Grafana-Demo` space (project default)
   - Call `getAccessibleAtlassianResources` to get `cloudId` if needed
   - Call `getConfluenceSpaces` with `keys: ["Grafana-Demo"]` to resolve `spaceId` if the create call fails

4. **Create the page** via `createConfluencePage`:
   - `cloudId`: from accessible resources or user's Atlassian site hostname
   - `spaceId`: resolved space ID for Grafana-Demo (or user-specified space)
   - `title`: derive from conversation topic (e.g. "Chat: [topic] - [date]") or ask the user
   - `body`: the formatted conversation content
   - `contentFormat`: `"markdown"` for simplicity

5. **Confirm** the page URL or ID to the user.

## Page Title

Default pattern: `Chat: [brief topic] - [YYYY-MM-DD]`

Examples:
- "Chat: Document skill creation - 2025-03-17"
- "Chat: BookmarksPage refactor discussion - 2025-03-17"

Ask the user for a custom title if they prefer.

## Content Template

```markdown
## Summary
[1-2 sentence overview of what was discussed]

## Discussion

### [Topic 1]
[Key points, decisions, or outcomes]

### [Topic 2]
...

## Key Outcomes
- [Action item or decision 1]
- [Action item or decision 2]

## Technical Details
[Code, commands, file paths if relevant]
```

## Notes

- The agent has the conversation in context; synthesize it rather than requesting export
- If `createConfluencePage` fails on `spaceId`, use `getConfluenceSpaces` with `cloudId` and `keys` to get the numeric space ID
- Parent page: omit `parentId` to create at space root, or use it if the user wants the page under a specific parent
