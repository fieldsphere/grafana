#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "closeout verification failed: required command '$cmd' is not available" >&2
    exit 1
  fi
}

normalize_matches() {
  sed 's#^./##' | sort
}

assert_exact_matches() {
  local description="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$actual" != "$expected" ]]; then
    echo "closeout verification failed: $description" >&2
    echo "expected:" >&2
    printf '%s\n' "$expected" >&2
    echo "actual:" >&2
    printf '%s\n' "$actual" >&2
    exit 1
  fi
}

assert_no_matches() {
  local description="$1"
  local actual="$2"

  if [[ -n "$actual" ]]; then
    echo "closeout verification failed: $description" >&2
    echo "unexpected matches:" >&2
    printf '%s\n' "$actual" >&2
    exit 1
  fi
}

require_cmd git
require_cmd go
require_cmd rg
require_cmd sed
require_cmd sort

echo "Running parity and runtime tests..."
go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover'
go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/...
go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log

echo "Running query probes..."
print_matches="$(rg 'fmt\.Print(f|ln)?\(|\blog\.Print(f|ln)?\(' pkg apps --glob '*.go' --files-with-matches | normalize_matches || true)"
console_matches="$(rg 'console\.(log|warn|error|info|debug|time|timeEnd)\(' public/app packages --glob '*.{ts,tsx,js,mjs,html}' --files-with-matches | normalize_matches || true)"
apps_recover_matches="$(rg 'recover\(\)[\s\S]{0,260}"(error|errorMessage|reason|panic)"\s*,' apps --glob '*.go' -U --files-with-matches | normalize_matches || true)"
pkg_recover_matches="$(rg 'recover\(\)[\s\S]{0,260}"(error|errorMessage|reason|panic)"\s*,' pkg --glob '*.go' -U --files-with-matches | normalize_matches || true)"
id_key_matches="$(rg '\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\([^\n]*"[A-Za-z0-9]*Id"' pkg --glob '*.go' --files-with-matches | normalize_matches || true)"
uid_key_matches="$(rg '\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\([^\n]*"[A-Za-z0-9]*Uid"' pkg --glob '*.go' --files-with-matches | normalize_matches || true)"
add_event_pascal_matches="$(rg '\.AddEvent\(\s*"[A-Z][^"]*"' pkg --glob '*.go' --files-with-matches | normalize_matches || true)"
add_event_separator_matches="$(rg '\.AddEvent\(\s*"[^"]*[\s:_/\-][^"]*"' pkg --glob '*.go' --files-with-matches | normalize_matches || true)"

assert_exact_matches "print/log probe should match ruleguard rules only" "pkg/ruleguard.rules.go" "$print_matches"
assert_no_matches "frontend console probe should have no matches" "$console_matches"
assert_no_matches "apps recover alias probe should have no matches" "$apps_recover_matches"
assert_exact_matches "pkg recover alias probe should match ruleguard artifacts only" $'pkg/ruleguard_parity_test.go\npkg/ruleguard.rules.go' "$pkg_recover_matches"
assert_no_matches "structured key *Id probe should have no matches" "$id_key_matches"
assert_no_matches "structured key *Uid probe should have no matches" "$uid_key_matches"
assert_no_matches "AddEvent PascalCase probe should have no matches" "$add_event_pascal_matches"
assert_no_matches "AddEvent separator probe should have no matches" "$add_event_separator_matches"

echo "Structured logging closeout verification passed."
