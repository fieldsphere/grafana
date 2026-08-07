#!/usr/bin/env bash
set -euo pipefail

INPUT_JSON="$(cat)"
COMMAND="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' <<< "$INPUT_JSON" 2>/dev/null || true)"
COMMAND_LC="$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')"

if [[ ! "$COMMAND_LC" =~ (^|[[:space:]])git[[:space:]]+(add|commit)([[:space:]]|$) ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

risky_pattern='(^|/)(\.env|\.env\.|.*secret.*|.*credential.*|manifest.*\.json$|\.aws-config\.json$|awsconfig$|\.npmrc$|\.yarnrc\.yml$)'

files_to_check=""
if [[ "$COMMAND_LC" =~ (^|[[:space:]])git[[:space:]]+commit([[:space:]]|$) ]]; then
  files_to_check="$(git diff --cached --name-only 2>/dev/null || true)"
else
  files_to_check="$(printf '%s\n' "$COMMAND" | tr ' ' '\n')"
  if [[ "$COMMAND_LC" =~ (^|[[:space:]])git[[:space:]]+add[[:space:]]+(-a|--all|\.)([[:space:]]|$) ]]; then
    files_to_check="$files_to_check"$'\n'"$(git status --porcelain 2>/dev/null | sed 's/^...//')"
  fi
fi

risky_files="$(printf '%s\n' "$files_to_check" | grep -E "$risky_pattern" || true)"

if [[ -z "$risky_files" ]]; then
  printf '%s\n' '{"continue":true,"permission":"allow"}'
  exit 0
fi

export RISKY_FILES="$risky_files"
python3 - <<'PY'
import json
import os

files = [line for line in os.environ.get("RISKY_FILES", "").splitlines() if line]
preview = ", ".join(files[:5])
if len(files) > 5:
    preview += f", and {len(files) - 5} more"

print(json.dumps({
    "continue": True,
    "permission": "ask",
    "user_message": f"Possible local or sensitive artifact detected before git staging/commit: {preview}. Confirm it belongs in this repo before continuing.",
    "agent_message": "Review the flagged file list and avoid committing local manifests, credentials, env files, or secrets unless the user explicitly confirms.",
}))
PY
