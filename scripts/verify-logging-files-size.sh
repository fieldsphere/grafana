#!/bin/bash
# Verify sizes of new logging files using du -h
# This script scopes the size of new directories and outputs the size of newly added files

set -e

echo "Verifying sizes of new logging files..."
echo ""

# Scope the size of new directories containing logging files
echo "Directory sizes:"
du -h .github/workflows/scripts/crowdin \
     packages/grafana-api-clients/src \
     packages/grafana-data/src \
     packages/grafana-i18n/src \
     packages/grafana-ui/src/utils \
     scripts 2>/dev/null | sort -h

echo ""
echo "Individual file sizes:"
# Output the size of newly added files
du -h .github/workflows/scripts/crowdin/logging.ts \
     packages/grafana-api-clients/src/logging.ts \
     packages/grafana-data/src/logging.ts \
     packages/grafana-i18n/src/logging.ts \
     packages/grafana-ui/src/utils/structuredLogging.ts \
     scripts/logging.js 2>/dev/null
