/**
 * Replaces `console.log|info|debug|warn|error(` with `clientLog.*(` and adds
 * `createClientLog` + `const clientLog = createClientLog('<repo-relative-path>')`.
 * Run: node scripts/replace-console-with-structured-logs.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');

const RE = /\bconsole\.(log|info|debug|warn|error)\s*\(/g;

const SKIP = [
  '.test.',
  '.spec.',
  '/e2e/',
  '/e2e-playwright/',
  'public/test/',
  'devenv/',
  'node_modules',
  'jest.config',
  'clientStructuredLog.ts',
  'webpack',
  'replace-console-with-structured-logs.mjs',
  '/.storybook/',
  '.stories.',
  '.story.',
  'grafana-data/scripts',
  'grafana-openapi/src/scripts',
  'grafana-api-clients',
  'public/swagger',
];

const SKIP_DIR_PREFIX = ['scripts/'];

function skipPath(f) {
  const n = f.replaceAll('\\', '/');
  for (const s of SKIP) {
    if (n.includes(s)) {
      return true;
    }
  }
  for (const p of SKIP_DIR_PREFIX) {
    if (n.startsWith(p) && !n.startsWith('public/')) {
      return true;
    }
  }
  return false;
}

function mapMethod(m) {
  if (m === 'log' || m === 'info') {
    return 'info';
  }
  if (m === 'debug') {
    return 'debug';
  }
  if (m === 'warn') {
    return 'warn';
  }
  return 'error';
}

function toSourceId(pathRel) {
  return pathRel.split(sep).join('/').replace(/\.(tsx?)$/, '');
}

function grafanaDataImportPath(absFile) {
  const rel = relative(dirname(absFile), join(root, 'packages/grafana-data/src/utils/clientStructuredLog.ts'));
  let p = rel.replaceAll('\\', '/').replace(/\.ts$/, '');
  if (!p.startsWith('.')) {
    p = './' + p;
  }
  return p;
}

function hasCreateClientLogImport(s) {
  return /import\s*\{[^}]*\bcreateClientLog\b/.test(s);
}

function addImport(s, absPath, inGrafanaData) {
  if (hasCreateClientLogImport(s)) {
    return s;
  }
  const from = inGrafanaData ? grafanaDataImportPath(absPath) : '@grafana/data';
  return `import { createClientLog } from '${from}';\n` + s;
}

function addToExistingGrafanaDataImport(s) {
  return s.replace(
    /(import\s*\{)([^}]*)(}\s*from\s*['"][^'"]*clientStructuredLog['"]\s*;?)/m,
    (_, a, b, c) => (b.includes('createClientLog') ? _ : `${a}${b.trim() ? b.trim() + ', ' : ''}createClientLog${c}`)
  );
}

function addToGrafanaDataPackageImport(s) {
  if (!/from ['"]@grafana\/data['"]/.test(s) || s.includes("import { createClientLog }")) {
    return s;
  }
  s = s.replace(
    /(import\s*\{)([^}]*)(}\s*from\s*['"]@grafana\/data['"]\s*;?)/m,
    (full, a, b, c) => (b.includes('createClientLog') ? full : `${a}${b.trim() ? b.trim() + ', ' : ''}createClientLog${c}`)
  );
  return s;
}

function ensureConst(s, sourceId) {
  if (/const clientLog = createClientLog\(/m.test(s)) {
    return s;
  }
  const c = `const clientLog = createClientLog('${sourceId}');\n`;
  if (hasCreateClientLogImport(s)) {
    s = s.replace(
      /(import\s*\{[^}]*\bcreateClientLog\b[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?\n)/m,
      (h) => h + c
    );
  }
  if (!/const clientLog = createClientLog\(/m.test(s)) {
    s = c + s;
  }
  return s;
}

function processFile(absPath) {
  let s = readFileSync(absPath, 'utf8');
  if (!RE.test(s)) {
    return 0;
  }
  RE.lastIndex = 0;

  const f = relative(root, absPath);
  if (skipPath(f)) {
    return 0;
  }

  s = s.replace(RE, (_, m) => `clientLog.${mapMethod(m)}(`);

  const n = f.replaceAll('\\', '/');
  const inGrafanaData = n.startsWith('packages/grafana-data/src/') && n !== 'packages/grafana-data/src/utils/clientStructuredLog.ts';
  s = inGrafanaData ? addToExistingGrafanaDataImport(s) : addToGrafanaDataPackageImport(s);
  s = addImport(s, absPath, inGrafanaData);
  s = ensureConst(s, toSourceId(f));

  writeFileSync(absPath, s);
  return 1;
}

const files = execSync(`cd "${root}" && git ls-files "*.ts" "*.tsx"`, {
  encoding: 'utf8',
  maxBuffer: 200 * 1024 * 1024,
})
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

let count = 0;
for (const f of files) {
  const abs = join(root, f);
  if (existsSync(abs)) {
    count += processFile(abs) || 0;
  }
}
process.stdout.write(`replace-console-structured-logs: updated ${count} files\n`);
