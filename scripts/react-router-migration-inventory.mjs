#!/usr/bin/env node
/**
 * Inventory script for the React Router v5 → v6 migration.
 * Run: node scripts/react-router-migration-inventory.mjs
 */
import { execSync } from 'node:child_process';

function count(pattern, glob = '**/*.{ts,tsx}') {
  try {
    const out = execSync(`rg -l "${pattern}" --glob '${glob}' public packages/grafana-ui 2>/dev/null | wc -l`, {
      encoding: 'utf8',
    });
    return Number.parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

const checks = [
  ['react-router-dom-v5-compat imports', "from 'react-router-dom-v5-compat'|from \"react-router-dom-v5-compat\""],
  ['Direct react-router-dom v5 shell imports', "from 'react-router-dom'|from \"react-router-dom\""],
  ['history.block usage', 'history\\.block\\('],
  ['CompatRouter usage', 'CompatRouter'],
  ['useBlocker usage', 'useBlocker'],
  ['HistoryRouter usage', 'HistoryRouter|unstable_HistoryRouter'],
];

console.log('React Router migration inventory\n');
for (const [label, pattern] of checks) {
  console.log(`${label}: ${count(pattern)}`);
}

console.log('\nRoute smoke matrix (manual/E2E):');
const routes = [
  'Auth redirects and login flow',
  'appSubUrl subpath installs',
  'Dashboard view/edit + unsaved changes (FormPrompt)',
  'Explore URL sync',
  'Alerting rule viewer/editor with encoded rule IDs',
  'Provisioning splat routes (/:name/file/*)',
  'Plugin app pages (AppRootPage)',
  'Public dashboard routes',
];
routes.forEach((r) => console.log(`  - ${r}`));
