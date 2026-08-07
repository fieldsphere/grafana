#!/usr/bin/env bash
set -euo pipefail

INPUT_JSON="$(cat)"
COMMAND="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' <<< "$INPUT_JSON" 2>/dev/null || true)"
COMMAND_LC="$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')"

if [[ ! "$COMMAND_LC" =~ (^|[[:space:]])(yarn|npm|pnpm|npx)([[:space:]]|$) ]] || [[ ! "$COMMAND_LC" =~ (jest|test) ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

if [[ "$COMMAND_LC" =~ --no-watch ]] || [[ "$COMMAND_LC" =~ --watchall=false ]] || [[ "$COMMAND_LC" =~ --runinband ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

cat <<'EOF'
{"continue":true,"permission":"allow","user_message":"Heads up: Grafana frontend tests can enter watch mode. Prefer `yarn jest --no-watch <path>` or add `--watchAll=false` for one-shot agent runs.","agent_message":"If this frontend test hangs in watch mode, rerun it with `yarn jest --no-watch` or `--watchAll=false`."}
EOF
