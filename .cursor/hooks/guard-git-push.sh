#!/usr/bin/env bash
set -euo pipefail

INPUT_JSON="$(cat)"
COMMAND="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' <<< "$INPUT_JSON" 2>/dev/null || true)"
COMMAND_LC="$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')"

if [[ ! "$COMMAND_LC" =~ (^|[[:space:]])git[[:space:]]+push([[:space:]]|$) ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

cat <<'EOF'
{"continue":true,"permission":"ask","user_message":"Review gate: this repo asks agents to summarize changes before pushing. Confirm this push should proceed.","agent_message":"Before running git push, summarize the intended branch, commits, and verification results so the user can approve the push."}
EOF
