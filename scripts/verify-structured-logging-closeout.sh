#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/verify-structured-logging-closeout.sh [--quick] [--probes-only] [--tests-only] [--matrix] [--help]

Options:
  --quick        Skip race tests for a faster local pass.
  --probes-only  Skip all tests and run query probes only.
  --tests-only   Skip query probes and run tests only.
  --matrix       Run all supported mode combinations in sequence.
  --help         Show this help message.

Notes:
  --quick cannot be combined with --probes-only.
  --probes-only and --tests-only are mutually exclusive.
  --matrix runs as a standalone mode and cannot be combined with other flags.
EOF
}

quick_mode=false
probes_only=false
tests_only=false
matrix_mode=false
while (($# > 0)); do
  case "$1" in
    --quick)
      quick_mode=true
      shift
      ;;
    --probes-only)
      probes_only=true
      shift
      ;;
    --tests-only)
      tests_only=true
      shift
      ;;
    --matrix)
      matrix_mode=true
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$probes_only" == "true" && "$tests_only" == "true" ]]; then
  echo "closeout verification failed: --probes-only and --tests-only cannot be used together" >&2
  exit 1
fi

if [[ "$quick_mode" == "true" && "$probes_only" == "true" ]]; then
  echo "closeout verification failed: --quick cannot be used with --probes-only" >&2
  exit 1
fi

if [[ "$matrix_mode" == "true" && ( "$quick_mode" == "true" || "$probes_only" == "true" || "$tests_only" == "true" ) ]]; then
  echo "closeout verification failed: --matrix cannot be combined with other mode flags" >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"
SCRIPT_PATH="$ROOT_DIR/scripts/verify-structured-logging-closeout.sh"

if [[ "$matrix_mode" == "true" ]]; then
  matrix_start_time="$(date +%s)"
  modes_run=0

  now_epoch_seconds() {
    date +%s
  }

  run_matrix_mode() {
    local mode_label="$1"
    shift
    local mode_start
    local mode_end
    local mode_duration

    mode_start="$(now_epoch_seconds)"
    echo "==> Matrix mode: $mode_label"
    if ! "$SCRIPT_PATH" "$@"; then
      echo "closeout verification matrix failed in mode: $mode_label" >&2
      exit 1
    fi
    mode_end="$(now_epoch_seconds)"
    mode_duration="$((mode_end - mode_start))"
    echo "<== Matrix mode passed: $mode_label (${mode_duration}s)"
    modes_run="$((modes_run + 1))"
  }

  echo "Running closeout verification matrix..."
  run_matrix_mode "full"
  run_matrix_mode "quick" --quick
  run_matrix_mode "probes-only" --probes-only
  run_matrix_mode "tests-only" --tests-only
  run_matrix_mode "tests-only-quick" --tests-only --quick
  matrix_end_time="$(date +%s)"
  matrix_duration="$((matrix_end_time - matrix_start_time))"
  echo "Structured logging closeout verification matrix passed (${modes_run} modes, ${matrix_duration}s)."
  exit 0
fi

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
if [[ "$probes_only" != "true" ]]; then
  require_cmd go
fi
if [[ "$tests_only" != "true" ]]; then
  require_cmd rg
  require_cmd sed
  require_cmd sort
fi

if [[ "$probes_only" != "true" ]]; then
  echo "Running parity and runtime tests..."
  go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover'
  go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/...
  if [[ "$quick_mode" != "true" ]]; then
    go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log
  fi
fi

if [[ "$tests_only" != "true" ]]; then
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
fi

echo "Structured logging closeout verification passed."
