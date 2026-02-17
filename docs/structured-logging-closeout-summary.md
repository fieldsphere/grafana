---
title: Structured logging closeout summary
---

# Structured logging closeout summary

This summary documents the final closeout for the structured logging migration. It shows what changed, what remains out of scope, and the final gate status used for completion.

Use this summary in three ways:

- **Understand scope:** Review what changed and what stayed out of scope.
- **Re-run verification:** Use the command checklist and expected outcomes to validate current state.
- **Maintain guardrails:** Use the PR checklist and parity-test guidance for follow-up logging work.

Before you begin, ensure you have the following:

- **Repository access:** You can access the latest branch state for this migration.
- **Go tooling:** You can run `go test` commands used in the closeout verification.
- **Search tooling:** You can run ripgrep (`rg`) query gates used for final checks.

## What changed

The closeout finished the migration and guardrail work across runtime logging and trace event patterns. Key outcomes:

- **Structured key normalization:** Runtime structured logging keys and trace keys now follow canonical naming, including `ID` and `UID` casing.
- **Recover-path hardening:** Recover-derived payload logging now consistently uses `panicValue` instead of forbidden aliases such as `error`, `errorMessage`, `reason`, or `panic`.
- **Ruleguard parity expansion:** Panic/fatal parity and recover-pattern parity were expanded across direct calls, spread vectors, append vectors, context builders, and grouping vectors.
- **Runtime parity tests:** The parity suite now includes stronger runtime AST checks for recover-derived values, spread handling, constant-resolution behavior, and deterministic diagnostics.
- **Traversal robustness:** Runtime scan helpers now include stable root dedupe, deterministic ordering, cross-platform path normalization, case-insensitive runtime file filtering where required, and explicit regression coverage for edge path shapes.

For detailed implementation progress, refer to the project plan and execution notes.

## Intentionally out of scope

The closeout intentionally excludes areas that are not runtime structured logging migration targets:

- **JSON/API field contracts:** Payload schema compatibility fields, for example existing JSON key names.
- **Generated and fixture code:** Generated sources and test fixture content that are not runtime production paths.
- **Intentional user output channels:** Non-structured CLI or user-facing output streams outside runtime structured logger enforcement scope.

## Final gate results

The final closeout gates pass for in-scope runtime targets:

- **Print/log gate:** `fmt.Print*` and `log.Print*` matches resolve only to rule definitions.
- **Frontend console gate:** No direct `console.*` usage remains in production source paths.
- **Recover alias gate (`apps/**`):** No recover-window forbidden alias usage remains.
- **Structured key casing probes:** No remaining runtime key casing regressions in checked vectors.
- **Trace event naming probes:** No remaining runtime `AddEvent` naming-shape regressions in checked vectors.
- **Runtime test gates:** Targeted package tests and race runs for touched areas pass.

## Verification commands used at closeout

The closeout used repeatable command checks to validate the migration gates and runtime tests:

- **Run the full closeout script:** This command runs the full closeout verification sequence with strict assertions:

```sh
./scripts/verify-structured-logging-closeout.sh
```

You can run the same full verification through `make`:

```sh
make verify-structured-logging-closeout
```

You can also run dedicated `make` shortcuts for partial modes:

```sh
make verify-structured-logging-closeout-quick
make verify-structured-logging-closeout-probes
make verify-structured-logging-closeout-tests
make verify-structured-logging-closeout-tests-quick
make verify-structured-logging-closeout-matrix
make verify-structured-logging-closeout-modes
make verify-structured-logging-closeout-modes-json
```

Use `make verify-structured-logging-closeout-matrix` when you want one command that runs all supported closeout script modes.

To run the same all-modes sequence directly from the script, use:

```sh
./scripts/verify-structured-logging-closeout.sh --matrix
```

To print supported script modes without running checks, use:

```sh
./scripts/verify-structured-logging-closeout.sh --list-modes
```

To print supported script modes as JSON (for CI scripting), use:

```sh
./scripts/verify-structured-logging-closeout.sh --list-modes-json
```

The matrix run prints per-mode labels and pass durations so you can quickly identify which mode failed and how long each mode took.
At the end, it prints a matrix summary line with total modes executed and total elapsed time, using compact duration formatting (for example `42s` or `2m05s`).
If any mode fails, the script exits with a mode-specific failure line that names the failing mode.

For a faster local pass that skips race tests, run:

```sh
./scripts/verify-structured-logging-closeout.sh --quick
```

For probe-only triage without tests, run:

```sh
./scripts/verify-structured-logging-closeout.sh --probes-only
```

Use `--probes-only` by itself. It can't be combined with `--quick` or `--tests-only`.
This mode skips all `go test` commands.

For test-only execution without probes, run:

```sh
./scripts/verify-structured-logging-closeout.sh --tests-only
```

For test-only execution that also skips race tests, run:

```sh
./scripts/verify-structured-logging-closeout.sh --tests-only --quick
```

- **Run recover and parity tests:** This command validates recover parity and runtime guardrail tests:

```sh
go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover'
```

- **Run touched package tests:** This command validates touched runtime packages:

```sh
go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/...
```

- **Run race validation:** This command validates the same runtime paths with race detection:

```sh
go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log
```

- **Run print/log gate probe:** This command validates there are no runtime `fmt.Print*` or `log.Print*` regressions:

```sh
rg "fmt\\.Print(f|ln)?\\(|\\blog\\.Print(f|ln)?\\(" pkg apps --glob "*.go" --files-with-matches
```

- **Run frontend console gate probe:** This command validates there are no production `console.*` regressions:

```sh
rg "console\\.(log|warn|error|info|debug|time|timeEnd)\\(" public/app packages --glob "*.{ts,tsx,js,mjs,html}" --files-with-matches
```

- **Run recover alias probe in `apps/**`:** This command validates recover-window forbidden alias usage is absent in application runtime paths:

```sh
rg "recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*," apps --glob "*.go" -U --files-with-matches
```

- **Run recover alias probe in `pkg/**`:** This command validates recover-window forbidden alias usage does not exist in runtime package code:

```sh
rg "recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*," pkg --glob "*.go" -U --files-with-matches
```

- **Run structured key casing probes:** These commands validate there are no runtime `*Id` or `*Uid` structured key regressions in logging and context vectors:

```sh
rg "\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Id\"" pkg --glob "*.go" --files-with-matches
rg "\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Uid\"" pkg --glob "*.go" --files-with-matches
```

- **Run trace event naming probes:** These commands validate there are no remaining PascalCase or separator-shaped `AddEvent` names in runtime paths:

```sh
rg "\\.AddEvent\\(\\s*\"[A-Z][^\"]*\"" pkg --glob "*.go" --files-with-matches
rg "\\.AddEvent\\(\\s*\"[^\"]*[\\s:_/\\-][^\"]*\"" pkg --glob "*.go" --files-with-matches
```

## Quick verification checklist

Use this checklist when you want a fast pass over closeout health:

- **Run tests:** Run parity, package, and race commands.
- **Run probe commands:** Run all query probes listed in this document.
- **Compare outputs:** Confirm outputs match the expected outcomes and known exceptions.

To run a single terminal pass for the core checks, use this command bundle:

```sh
go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover' && \
go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/... && \
go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log && \
rg "fmt\\.Print(f|ln)?\\(|\\blog\\.Print(f|ln)?\\(" pkg apps --glob "*.go" --files-with-matches && \
! rg "console\\.(log|warn|error|info|debug|time|timeEnd)\\(" public/app packages --glob "*.{ts,tsx,js,mjs,html}" --files-with-matches && \
! rg "recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*," apps --glob "*.go" -U --files-with-matches && \
! rg "\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Id\"" pkg --glob "*.go" --files-with-matches && \
! rg "\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Uid\"" pkg --glob "*.go" --files-with-matches && \
! rg "\\.AddEvent\\(\\s*\"[A-Z][^\"]*\"" pkg --glob "*.go" --files-with-matches && \
! rg "\\.AddEvent\\(\\s*\"[^\"]*[\\s:_/\\-][^\"]*\"" pkg --glob "*.go" --files-with-matches && \
rg "recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*," pkg --glob "*.go" -U --files-with-matches
```

In this bundle, `! rg ...` means the probe must return no matches for the command to pass.
The final `pkg/**` recover probe in the bundle is expected to return rule/test files only.

For a full all-modes pass with clearer mode-by-mode start and pass markers, run:

```sh
./scripts/verify-structured-logging-closeout.sh --matrix
```

## Expected command outcomes

When closeout gates are healthy, you should see the following outcomes:

- **Parity and runtime test commands:** Return `ok` for the targeted packages.
- **Race validation command:** Returns `ok` for the same targeted packages under `-race`.
- **Print/log probe:** Returns only rule definitions, not runtime production callsites.
- **Frontend console probe:** Returns no matches in production source paths.
- **Recover alias probe in `apps/**`:** Returns no matches.
- **Recover alias probe in `pkg/**`:** Returns only rule definitions and parity-test assertions, not runtime production callsites.
- **Key-casing probes:** Return no matches for `*Id` and `*Uid` patterns.
- **Trace event naming probes:** Return no matches for PascalCase and separator-shaped event names.

## Known expected probe exceptions

Some probes can return known non-runtime matches that are expected:

- **Print/log probe:** `pkg/ruleguard.rules.go` contains rule pattern literals for `fmt.Print*` and `log.Print*`.
- **Recover alias probe in `pkg/**`:** `pkg/ruleguard.rules.go` and `pkg/ruleguard_parity_test.go` can match because they contain rule/test literals used to enforce policy.
- **Other probes:** Any additional hit in runtime production code should be treated as a regression candidate and investigated.

To assert the `pkg/**` recover-alias probe matches only the two expected files, use this strict check:

```sh
EXPECTED="$(printf '%s\n' 'pkg/ruleguard_parity_test.go' 'pkg/ruleguard.rules.go')"
ACTUAL="$(rg \"recover\\(\\)[\\s\\S]{0,260}\\\"(error|errorMessage|reason|panic)\\\"\\s*,\" pkg --glob \"*.go\" -U --files-with-matches | sort)"
[ "$ACTUAL" = "$EXPECTED" ]
```

If this comparison fails, treat the output as a potential runtime regression and investigate before merging.

## Example gate output snapshot

The following output patterns show what successful closeout execution looks like:

The targeted parity and runtime tests return `ok`:

```text
ok  	github.com/grafana/grafana/pkg	1.2s
ok  	github.com/grafana/grafana/pkg/services/authn/clients	(cached)
ok  	github.com/grafana/grafana/pkg/services/authz/zanzana/logger	(cached)
ok  	github.com/grafana/grafana/pkg/infra/log	(cached)
```

The print/log gate returns only ruleguard rule definitions:

```text
pkg/ruleguard.rules.go
```

The frontend console and `apps/**` recover-alias probes return no matches:

```text
No files with matches found
```

The `pkg/**` recover-alias probe returns only expected rule and parity files:

```text
pkg/ruleguard_parity_test.go
pkg/ruleguard.rules.go
```

For a strict one-pass variant that asserts the exact expected `pkg/**` recover-probe file set, use:

```sh
EXPECTED="$(printf '%s\n' 'pkg/ruleguard_parity_test.go' 'pkg/ruleguard.rules.go')"
ACTUAL="$(rg \"recover\\(\\)[\\s\\S]{0,260}\\\"(error|errorMessage|reason|panic)\\\"\\s*,\" pkg --glob \"*.go\" -U --files-with-matches | sed 's#^./##' | sort)"
[ "$ACTUAL" = "$EXPECTED" ]
```

## Related resources

- **Ruleguard parity tests:** The [ruleguard parity test suite](../pkg/ruleguard_parity_test.go) contains the regression checks that enforce these guarantees.
- **Ruleguard definitions:** The [ruleguard definitions](../pkg/ruleguard.rules.go) contain the static-analysis rules enforced during closeout.
- **Repository context:** The [project README](../README.md) contains repository-level development context for follow-up work.

## Next steps

After closeout, you can continue with these follow-up activities:

- **Monitor regressions:** Keep running the verification commands in CI and during local review for logging-related changes.
- **Extend guardrails as needed:** Add targeted parity tests when new structured logging vectors or wrappers are introduced.
- **Use the closeout baseline:** Refer to this summary when triaging future logging policy changes or migration exceptions.

For implementation and style constraints in this repository, refer to [AGENTS.md](../AGENTS.md).

## Use this checklist in pull requests

Use this checklist when you review pull requests that touch runtime logging:

- **Run the parity tests:** Run the parity and recover-focused test commands first to confirm guardrails still hold.
- **Run scoped package tests:** Run tests for touched logging packages and rerun with `-race` when runtime paths changed.
- **Run query gates:** Run print/log, console, recover-alias, key-casing, and trace-event probes from this document.
- **Compare outcomes:** Confirm output matches the expected closeout outcomes described in this summary.
- **Add targeted tests:** If a new logging vector appears, add a parity regression before merging.

## Troubleshoot failing closeout gates

If a closeout command fails, use this workflow to isolate and fix the regression:

- **Start with the first failing command:** Fix one failing gate at a time to avoid mixing unrelated changes.
- **Confirm runtime scope:** Ensure matches are in runtime production code and not in rule definitions or parity test fixtures.
- **Apply minimal fixes:** Update only the affected log callsites, key names, or event names needed to satisfy the gate.
- **Re-run targeted tests first:** Re-run parity and touched package tests before re-running the full gate checklist.
- **Re-run all closeout probes:** After the fix passes locally, run the full verification command list to confirm no secondary regressions.

Use this process for each failing gate independently. Avoid combining multiple unrelated fixes in one change.

## When to add or update parity tests

Add or update parity tests when you change logging behavior that can bypass existing guardrails:

- **New logging vectors:** Add parity coverage when introducing new wrappers, helper paths, or argument composition patterns.
- **New recover patterns:** Add recover-focused parity checks when adding new recover branches or payload propagation shapes.
- **New key semantics:** Add targeted tests when you introduce or rename canonical keys enforced by ruleguard rules.
- **New normalization helpers:** Add direct helper tests when path, key, or payload normalization logic changes.
