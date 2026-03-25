#!/usr/bin/env bash
# Lists top memory-consuming processes per running Docker container.
# Requires Docker CLI; containers must allow exec and include ps (many images do).

set -euo pipefail

TOP_N="${TOP_N:-15}"
if [[ ! "${TOP_N}" =~ ^[0-9]+$ ]] || [[ "${TOP_N}" -eq 0 ]]; then
  echo "TOP_N must be a positive integer" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found in PATH" >&2
  exit 1
fi

if [[ -z "$(docker ps -q)" ]]; then
  echo "No running containers."
  exit 0
fi

while read -r id; do
  [[ -z "${id}" ]] && continue
  name="$(docker inspect --format '{{.Name}}' "${id}" | sed 's|^/||')"
  echo ""
  echo "=== ${name} (${id:0:12}) ==="
  out="$(docker exec "${id}" sh -c '
    if ! command -v ps >/dev/null 2>&1; then
      echo "(no ps in container)"
      exit 0
    fi
    # Header + processes sorted by %MEM (column 4 in ps aux)
    line1="$(ps aux 2>/dev/null | head -1)"
    rest="$(ps aux 2>/dev/null | tail -n +2 | sort -k4 -nr | head -n '"$TOP_N"')"
    if [ -z "${rest}" ]; then
      echo "(ps produced no rows)"
    else
      printf "%s\n%s\n" "${line1}" "${rest}"
    fi
  ' 2>&1)" || out="(docker exec failed: ${id})"
  echo "${out}"
done <<< "$(docker ps -q)"
