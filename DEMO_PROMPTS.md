# Demo Prompts

Copy/paste these during the demo. Listed in order of use.

---

## Act 1: Ask Mode

### Prompt 1 — Broad codebase orientation

```
How is this codebase structured? What are the main architectural layers?

Constraints:
- Keep it to ~90 seconds of reading.
- Call out the 5–7 most important top-level folders.
- For each layer, give 1–2 concrete example paths (real file/folder paths).
```

### Prompt 2 — Deep trace

```
How does the dashboard API work for **reading a dashboard by UID**?

Please trace the request end-to-end for the legacy HTTP route:
- GET `/api/dashboards/uid/:uid`

Output format:
1) Frontend entrypoint (what code triggers the request, and which API wrapper is used). Include file paths.
2) Frontend HTTP client used (where is the request actually sent?). Include file path + method name.
3) Backend route + handler (exact handler function + file path).
4) Service layer (exact service method + file path).
5) Storage/DB layer (which store/database code does the read?). Include file path + function name.

Rules:
- Cite real file paths and function names you found in this repo.
- Don’t guess; if you can’t find something, say so and show the closest entrypoint you *did* find.

Then generate a simple Mermaid sequence diagram of the flow.
Keep the explanation short and diagram-heavy.
```

### Prompt 2b (fallback) — If the answer is too broad

```
Same question, but do NOT cover saving/updating dashboards. Only cover the read path for GET `/api/dashboards/uid/:uid`.
End with “Open these 3 files first” and list the 3 most useful files.
```

---

## Act 2: Skills & Subagents

### Prompt 3 — Trigger issue-tracker skill

```
Show me the open issues on our backlog
```

---

## Act 3: Plan Mode — Logging Issue (#12)

Switch to **Plan Mode** first.

### Prompt 4 — Logging plan

```
We have inconsistent logging across the codebase. Some places use structured logging with key-value pairs, which is what we want, but other places use fmt.Sprintf or format strings that Grafana's logging library doesn't interpret. Find all instances and fix them to use proper structured logging.
```

---

## Act 4: Plan Mode — Parallel Agents (#10)

Switch to **Plan Mode** first.

### Prompt 5 — Parallel agent plan

```
Fix issue #10: SQL sources missing error handling. The MySQL, PostgreSQL, and MSSQL datasource macro functions have TODO comments where error handling was never implemented — errors from regexp.Compile are silently ignored. Also, Elasticsearch responses return generic "unexpected status code" errors instead of extracting the actual error message. Create a plan that splits this into parallel work units — one per datasource package.
```

---

## Act 5: Council of Agents Review

### Prompt 6 — Council review of logging changes

```
Review the structured logging changes we just made. Spawn sub-agents to review from multiple angles: one checking correctness of the logging patterns, one looking for any instances we missed, one checking for edge cases or regressions. Use GPT 5.2 and GPT Codex 5.2 for the subagents. Synthesize the findings.
```
