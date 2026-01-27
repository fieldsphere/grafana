# Theme Switcher Preload Demo Prompt

Use this prompt to demo an AI agent solving the theme switch performance issue.

## Prompt

> Grafana's Theme Switcher is slow on the first switch between dark/light, but fast on subsequent switches. Something expensive happens once and is then cached. Find out what it is, and make the first switch feel as fast as later ones—without redesigning the theme system. Use DevTools to identify the bottleneck. Prefer standard browser primitives. Deliver a minimal fix with tests.

## Why it works

- **"slow first, fast after"** — points to caching without naming it
- **"something expensive happens once"** — prompts root-cause investigation
- **"make the first switch feel as fast"** — implies preloading the cached resource
- **"without redesigning"** — prevents overengineering
- **"standard browser primitives"** — nudges toward `<link rel="prefetch/preload">`
- **"DevTools"** — ensures runtime evidence, not just code reading
- **"minimal fix with tests"** — sets clear deliverable scope
