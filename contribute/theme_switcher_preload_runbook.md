---
title: Theme switcher first-switch slowness runbook
---

# Theme switcher first-switch slowness runbook

Use this runbook to make the first theme switch (light ↔ dark) feel as fast as subsequent switches, without redesigning the theme system.

## Problem statement

When you switch themes for the first time after loading Grafana, the UI feels slow. Subsequent switches between already-used themes feel fast.

Your goal is to pay the one-time cost earlier (during idle time or on user intent) so the first theme switch does not block on it.

## Prerequisites

Before you begin, ensure you have the following:

- A local Grafana build that serves `public/build/*`.
- A way to reproduce the issue (local server, dev instance, or Playwright-managed server).
- Browser DevTools access (Console + Network/Performance panels).

## Key insight (what is actually slow)

In this repo, a theme switch across modes is primarily a **stylesheet swap**:

- The code inserts a new `<link rel="stylesheet">` pointing at a compiled mode-specific CSS bundle.
- The code waits for `onload` of that stylesheet before removing the old one to avoid flicker.

This means the first time you switch to the other mode, you pay the cold cost of:

- Downloading the other mode’s CSS
- Parsing/applying it

After that, subsequent switches are fast because the browser has the CSS in cache.

## Where to look in code

Start with the runtime theme swap implementation:

- `public/app/core/services/theme.ts`
  - `changeTheme(themeId, runtimeOnly?)` swaps CSS by inserting a `<link>` and waiting on `onload`.

Find where the Theme UI triggers it:

- `public/app/core/components/ThemeSelector/ThemeSelectorDrawer.tsx`
  - Calls `changeTheme(theme.id, false)` when selecting a theme.
- `public/app/core/components/SharedPreferences/SharedPreferences.tsx`
  - Calls `changeTheme(value.value, true)` for preview in preferences.

## How to prove the root cause quickly

Use DevTools during a cold start:

- **Network**: on the first switch to the other mode, you should see a request for `grafana.light.*.css` or `grafana.dark.*.css` that wasn’t previously loaded.
- **Performance/Timing**: the switch is delayed until the new stylesheet finishes loading.

You can also verify what URL is being loaded by evaluating the config:

- `config.bootData.assets.light`
- `config.bootData.assets.dark`

## Minimal fix strategy: warm the opposite theme CSS cache

You do not need to rebuild theme tokens or refactor theme application. You can make the first switch fast by ensuring the opposite mode CSS is already fetched (or in progress) before the user switches.

### Approach A: idle warmup after app mount (low risk)

After the app mounts, schedule a low-priority fetch for the opposite theme CSS using a `<link>` tag:

- Prefer `rel="prefetch"` to avoid competing with initial render.
- Fallback to `rel="preload"` if `prefetch` is not supported.
- Use `as="style"`.
- Add a stable marker attribute like `data-grafana-theme-warm="<mode>"` to avoid duplicates.

Implementation location:

- Create `warmThemeCssCache()` in `public/app/core/services/theme.ts`.
- Call it once from `public/app/AppWrapper.tsx` in `componentDidMount()`.

### Approach B: user-intent warmup when theme UI opens (higher reliability)

If a user opens the Theme Selector immediately after load, idle warmup may not have executed yet. When the Theme Selector drawer opens, preload the opposite CSS with higher priority:

- Call `warmThemeCssCache({ priority: 'preload' })` inside a `useEffect()` in `ThemeSelectorDrawer`.

This moves the warmup closer to the moment the user is likely to switch.

## What “done” looks like (success criteria)

You can consider the fix successful if:

- A warmup link exists before switching:
  - `document.querySelectorAll('link[data-grafana-theme-warm]')` returns at least one link.
  - The link has `as="style"` and `rel` is `prefetch` or `preload`.
- The first mode switch no longer has a visible delay.
- Resource timing for `grafana.light.*.css` / `grafana.dark.*.css` shows very small durations (typical of cached fetches) after warmup.

## How to test

### Manual UI test (fastest proof)

1. Start Grafana.
2. Open the Theme selector drawer (profile menu → **Change theme**).
3. In DevTools Console, run:
   - `document.querySelectorAll('link[data-grafana-theme-warm]')`
4. Switch to the opposite theme once.
5. In DevTools Console, run:
   - `performance.getEntriesByType('resource').filter(r => r.name.includes('grafana.light') || r.name.includes('grafana.dark')).slice(-3)`

### Unit test (fast feedback)

Add a Jest test that imports the warmup function and asserts:

- It injects exactly one warmup `<link>`.
- It does not inject duplicates.
- It supports an eager `preload` mode.

### Playwright test (integration signal)

Add a Playwright test that loads `/` and asserts a warmup link exists:

- `link[data-grafana-theme-warm]` exists with `as="style"` and `rel` in `preload|prefetch`.

## Common pitfalls

- **Do not remove the old stylesheet immediately**: the current swap uses `onload` to avoid a flash of unstyled content.
- **Avoid duplicating warmup links**: ensure you check existing `data-grafana-theme-warm` links and their `href`.
- **Avoid starving initial render**: prefer `prefetch` on boot; use `preload` only when user intent is clear (theme UI opened).
- **Test environment constraints**: Playwright runs may require `yarn build` so `assets-manifest.json` exists, and may require browser binaries installed (`yarn playwright install chromium`).

## Next steps

- If you need to further improve cold-start performance, measure the size and parse cost of `grafana.light.*.css` and `grafana.dark.*.css` and consider splitting or reducing critical CSS.
- If you introduce additional theme modes or theme-specific assets (fonts/images), preload them using the same intent-driven pattern.

