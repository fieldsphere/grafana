#!/bin/bash
# Verify sizes of new logging files using du -h
# This script scopes the size of new directories and outputs the size of newly added files

set -e

echo "Verifying sizes of new logging files..."
echo ""

# Scope the size of new directories containing logging files
echo "Directory sizes:"
du -h .github/actions/changelog \
     .github/workflows/scripts/crowdin \
     devenv/docker \
     e2e-playwright/utils \
     e2e/cypress/plugins \
     e2e \
     packages/grafana-api-clients/src \
     packages/grafana-data/scripts \
     packages/grafana-data/src \
     packages/grafana-i18n/src \
     packages/grafana-ui/src/utils \
     public/test/core \
     public/test \
     scripts/codeowners-manifest \
     scripts/webpack \
     scripts 2>/dev/null | sort -h

echo ""
echo "Individual file sizes:"
# Output the size of newly added files
du -h .github/actions/changelog/logging.js \
     .github/workflows/scripts/crowdin/logging.ts \
     devenv/docker/logging.js \
     e2e-playwright/utils/logging.ts \
     e2e/cypress/plugins/logging.js \
     e2e/logging.js \
     packages/grafana-api-clients/src/logging.ts \
     packages/grafana-data/scripts/logging.ts \
     packages/grafana-data/src/logging.ts \
     packages/grafana-i18n/src/logging.ts \
     packages/grafana-ui/src/utils/structuredLogging.ts \
     public/test/core/logging.ts \
     public/test/logging.js \
     scripts/codeowners-manifest/logging.js \
     scripts/logging.js \
     scripts/logging.ts \
     scripts/webpack/logging.js 2>/dev/null
