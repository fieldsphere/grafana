#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/verify-structured-logging-closeout.sh [--mode <MODE>] [--quick] [--probes-only] [--tests-only] [--matrix] [--list-modes] [--list-modes-json] [--dry-run] [--help]

Options:
  --mode <MODE> Select a predefined mode.
  --quick        Skip race tests for a faster local pass.
  --probes-only  Skip all tests and run query probes only.
  --tests-only   Skip query probes and run tests only.
  --matrix       Run all supported mode combinations in sequence.
  --list-modes   Print supported execution modes and exit.
  --list-modes-json  Print supported execution modes as JSON and exit.
  --dry-run      Print commands for the selected mode without executing.
  --help         Show this help message.

Notes:
  --mode cannot be combined with other mode flags.
  --quick cannot be combined with --probes-only.
  --probes-only and --tests-only are mutually exclusive.
  --matrix runs as a standalone mode and cannot be combined with other flags.
  --list-modes runs as a standalone mode and cannot be combined with other flags.
  --list-modes-json runs as a standalone mode and cannot be combined with other flags.
  --dry-run cannot be combined with --list-modes or --list-modes-json.
EOF
  printf '\nAvailable modes: %s\n' "$(modes_for_display)"
}

ALL_MODES=(full quick probes-only tests-only tests-only-quick matrix)
MATRIX_MODES=(full quick probes-only tests-only tests-only-quick)

modes_for_display() {
  local mode_name
  local display=""
  for mode_name in "${ALL_MODES[@]}"; do
    if [[ -n "$display" ]]; then
      display="${display}, "
    fi
    display="${display}${mode_name}"
  done
  echo "$display"
}

print_modes_error_list() {
  local mode_name
  echo "supported modes:" >&2
  for mode_name in "${ALL_MODES[@]}"; do
    echo "  - $mode_name" >&2
  done
}

quick_mode=false
probes_only=false
tests_only=false
matrix_mode=false
list_modes=false
list_modes_json=false
dry_run=false
selected_mode=""
while (($# > 0)); do
  case "$1" in
    --mode)
      if (($# < 2)); then
        echo "closeout verification failed: --mode requires an argument" >&2
        usage >&2
        exit 1
      fi
      selected_mode="$2"
      shift 2
      ;;
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
    --list-modes)
      list_modes=true
      shift
      ;;
    --list-modes-json)
      list_modes_json=true
      shift
      ;;
    --dry-run)
      dry_run=true
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

if [[ -n "$selected_mode" && ( "$quick_mode" == "true" || "$probes_only" == "true" || "$tests_only" == "true" || "$matrix_mode" == "true" || "$list_modes" == "true" || "$list_modes_json" == "true" ) ]]; then
  echo "closeout verification failed: --mode cannot be combined with other mode flags" >&2
  exit 1
fi

if [[ -n "$selected_mode" ]]; then
  case "$selected_mode" in
    full)
      ;;
    quick)
      quick_mode=true
      ;;
    probes-only)
      probes_only=true
      ;;
    tests-only)
      tests_only=true
      ;;
    tests-only-quick)
      tests_only=true
      quick_mode=true
      ;;
    matrix)
      matrix_mode=true
      ;;
    *)
      echo "closeout verification failed: unknown mode '$selected_mode'" >&2
      print_modes_error_list
      echo "hint: run --list-modes" >&2
      exit 1
      ;;
  esac
fi

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

if [[ "$list_modes" == "true" && ( "$quick_mode" == "true" || "$probes_only" == "true" || "$tests_only" == "true" || "$matrix_mode" == "true" ) ]]; then
  echo "closeout verification failed: --list-modes cannot be combined with other mode flags" >&2
  exit 1
fi

if [[ "$list_modes_json" == "true" && ( "$quick_mode" == "true" || "$probes_only" == "true" || "$tests_only" == "true" || "$matrix_mode" == "true" || "$list_modes" == "true" ) ]]; then
  echo "closeout verification failed: --list-modes-json cannot be combined with other mode flags" >&2
  exit 1
fi

if [[ "$dry_run" == "true" && ( "$list_modes" == "true" || "$list_modes_json" == "true" ) ]]; then
  echo "closeout verification failed: --dry-run cannot be combined with --list-modes or --list-modes-json" >&2
  exit 1
fi

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"
SCRIPT_PATH="$ROOT_DIR/scripts/verify-structured-logging-closeout.sh"

print_modes_plain() {
  local mode_name
  for mode_name in "${ALL_MODES[@]}"; do
    printf '%s\n' "$mode_name"
  done
}

print_modes_json() {
  local mode_name
  local first_mode=true

  printf '['
  for mode_name in "${ALL_MODES[@]}"; do
    if [[ "$first_mode" == "true" ]]; then
      first_mode=false
    else
      printf ','
    fi
    printf '"%s"' "$mode_name"
  done
  printf ']\n'
}

if [[ "$list_modes" == "true" ]]; then
  print_modes_plain
  exit 0
fi

if [[ "$list_modes_json" == "true" ]]; then
  print_modes_json
  exit 0
fi

if [[ "$matrix_mode" == "true" ]]; then
  matrix_start_time="$(date +%s)"
  modes_run=0

  now_epoch_seconds() {
    date +%s
  }

  format_duration_seconds() {
    local total_seconds="$1"
    local minutes
    local seconds

    minutes="$((total_seconds / 60))"
    seconds="$((total_seconds % 60))"

    if [[ "$minutes" -gt 0 ]]; then
      printf '%dm%02ds' "$minutes" "$seconds"
      return
    fi

    printf '%ds' "$seconds"
  }

  run_matrix_mode() {
    local mode_label="$1"
    shift
    local mode_args=("$@")
    local mode_start
    local mode_end
    local mode_duration

    if [[ "$dry_run" == "true" ]]; then
      mode_args+=(--dry-run)
    fi

    mode_start="$(now_epoch_seconds)"
    echo "==> Matrix mode: $mode_label"
    if ! "$SCRIPT_PATH" "${mode_args[@]}"; then
      echo "closeout verification matrix failed in mode: $mode_label" >&2
      exit 1
    fi
    mode_end="$(now_epoch_seconds)"
    mode_duration="$((mode_end - mode_start))"
    echo "<== Matrix mode passed: $mode_label ($(format_duration_seconds "$mode_duration"))"
    modes_run="$((modes_run + 1))"
  }

  echo "Running closeout verification matrix..."
  for mode_name in "${MATRIX_MODES[@]}"; do
    run_matrix_mode "$mode_name" --mode "$mode_name"
  done
  matrix_end_time="$(date +%s)"
  matrix_duration="$((matrix_end_time - matrix_start_time))"
  if [[ "$dry_run" == "true" ]]; then
    echo "Structured logging closeout verification matrix dry-run completed (${modes_run} modes, $(format_duration_seconds "$matrix_duration"))."
  else
    echo "Structured logging closeout verification matrix passed (${modes_run} modes, $(format_duration_seconds "$matrix_duration"))."
  fi
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
  if [[ "$dry_run" == "true" ]]; then
    echo "Dry-run parity and runtime tests:"
    echo "go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover'"
    echo "go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/..."
    if [[ "$quick_mode" != "true" ]]; then
      echo "go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log"
    fi
  else
    echo "Running parity and runtime tests..."
    go test ./pkg -run 'TestRuntimeRecover|TestRuleguardRecover'
    go test ./pkg/services/authn/clients/... ./pkg/services/authz/zanzana/logger ./pkg/infra/log/...
    if [[ "$quick_mode" != "true" ]]; then
      go test -race ./pkg ./pkg/services/authn/clients ./pkg/services/authz/zanzana/logger ./pkg/infra/log
    fi
  fi
fi

if [[ "$tests_only" != "true" ]]; then
  if [[ "$dry_run" == "true" ]]; then
    echo "Dry-run query probes:"
    echo "rg 'fmt\\.Print(f|ln)?\\(|\\blog\\.Print(f|ln)?\\(' pkg apps --glob '*.go' --files-with-matches"
    echo "rg 'console\\.(log|warn|error|info|debug|time|timeEnd)\\(' public/app packages --glob '*.{ts,tsx,js,mjs,html}' --files-with-matches"
    echo "rg 'recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*,' apps --glob '*.go' -U --files-with-matches"
    echo "rg 'recover\\(\\)[\\s\\S]{0,260}\"(error|errorMessage|reason|panic)\"\\s*,' pkg --glob '*.go' -U --files-with-matches"
    echo "rg '\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Id\"' pkg --glob '*.go' --files-with-matches"
    echo "rg '\\.(Debug|Info|Warn|Error|Panic|Fatal|InfoCtx|WarnCtx|ErrorCtx|DebugCtx|With|New)\\([^\\n]*\"[A-Za-z0-9]*Uid\"' pkg --glob '*.go' --files-with-matches"
    echo "rg '\\.AddEvent\\(\\s*\"[A-Z][^\"]*\"' pkg --glob '*.go' --files-with-matches"
    echo "rg '\\.AddEvent\\(\\s*\"[^\"]*[\\s:_/\\-][^\"]*\"' pkg --glob '*.go' --files-with-matches"
  else
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
fi

if [[ "$dry_run" == "true" ]]; then
  echo "Structured logging closeout verification dry-run completed."
else
  echo "Structured logging closeout verification passed."
fi
