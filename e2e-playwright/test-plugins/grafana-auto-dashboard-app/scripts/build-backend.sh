#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "${ROOT}/dist"
export GOWORK=off
cd "${ROOT}"
go build -o dist/gpx_grafana_auto_dashboard_app ./pkg/plugin
