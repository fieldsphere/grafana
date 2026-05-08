/**
 * Migrates repetitive console patterns to structuredLog / toLogContextPart from @grafana/data.
 * Run from repo root: node scripts/migrate-console-pass1.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const scanDirs = [
  path.join(ROOT, 'public/app'),
  path.join(ROOT, 'packages/grafana-prometheus'),
  path.join(ROOT, 'packages/grafana-sql'),
  path.join(ROOT, 'packages/grafana-flamegraph'),
  path.join(ROOT, 'packages/grafana-openapi'),
  path.join(ROOT, 'packages/grafana-ui/src'),
  path.join(ROOT, 'packages/grafana-i18n/src'),
];

const pathBlocks = ['/node_modules/', '/dist/', 'BrowseConsoleBackend.ts'];
const skipName = (n) =>
  /\.(test|spec|story)\.(t|j)sx?$/.test(n) ||
  /\.d\.ts$/.test(n);

function shouldSkipFile(fp) {
  if (pathBlocks.some((s) => fp.includes(s))) {
    return true;
  }
  return skipName(path.basename(fp));
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p, acc);
    } else if (/\.tsx?$/.test(e.name)) {
      if (!shouldSkipFile(p)) {
        acc.push(p);
      }
    }
  }
  return acc;
}

function ensureImport(original) {
  const needsStructured = /\bstructuredLog\s*\(/.test(original);
  const needsPart = /\btoLogContextPart\s*\(/.test(original);
  if (!needsStructured && !needsPart) {
    return original;
  }

  const dataImportRe = /^import\s*\{([\s\S]*?)\}\s*from\s*['"]@grafana\/data['"];/m;
  const m = original.match(dataImportRe);
  if (!m) {
    const line = `import { structuredLog, toLogContextPart } from '@grafana/data';\n`;
    const pos = original.search(/^import\s/m);
    return pos === -1 ? line + original : original.slice(0, pos) + line + original.slice(pos);
  }

  let inner = m[1].trim().replace(/,\s*$/, '');

  const ensureSym = (sym) => {
    if (!new RegExp(`(^|[,\\s])${sym}\\b`).test(inner)) {
      inner = inner.length ? `${inner},\n  ${sym}` : sym;
    }
  };

  if (needsStructured) {
    ensureSym('structuredLog');
  }
  if (needsPart) {
    ensureSym('toLogContextPart');
  }

  const replacement = `import {\n  ${inner.replace(/^,\s*/, '').replace(/,\s*$/, '')}\n} from '@grafana/data';`;
  return original.replace(dataImportRe, replacement);
}

const strOrTpl =
  '(?:`(?:\\\\`|[^`])*`|\'(?:\\\\\'|[^\'])*\'|"(?:\\\\"|[^"])*")';

function replaceConsole(content) {
  let s = content;

  s = s.replace(
    /console\.error\(\s*error\s*\)/g,
    `structuredLog('error', 'Error', { error: toLogContextPart(error) })`
  );
  s = s.replace(
    /console\.error\(\s*err\s*\)/g,
    `structuredLog('error', 'Error', { error: toLogContextPart(err) })`
  );
  s = s.replace(/console\.error\(\s*e\s*\)/g, `structuredLog('error', 'Error', { error: toLogContextPart(e) })`);

  s = s.replace(/console\.warn\(\s*warningMessage\s*\)/g, `structuredLog('warn', String(warningMessage))`);

  /** console.error(string|template, errVar) — errVar identifier only */
  s = s.replace(
    new RegExp(
      `console\\.error\\(\\s*(${strOrTpl})\\s*,\\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\)`,
      'g'
    ),
    `structuredLog('error', $1, { error: toLogContextPart($2) })`
  );

  /** console.warn(string|template, expr) */
  s = s.replace(
    new RegExp(`console\\.warn\\(\\s*(${strOrTpl})\\s*,\\s*((?:[^)]|\\([^)]*\\))+)\\s*\\)`, 'g'),
    `structuredLog('warn', $1, { details: $2 })`
  );

  /** console.error(string|template, expr) — non-identifier tails */
  s = s.replace(
    new RegExp(`console\\.error\\(\\s*(${strOrTpl})\\s*,\\s*((?:[^)]|\\([^)]*\\))+)\\s*\\)`, 'g'),
    `structuredLog('error', $1, { details: $2 })`
  );

  /** Single-arg string / template logs */
  s = s.replace(new RegExp(`console\\.log\\(\\s*(${strOrTpl})\\s*\\)`, 'g'), `structuredLog('info', $1)`);
  s = s.replace(
    new RegExp(`console\\.log\\(\\s*(${strOrTpl})\\s*,\\s*((?:[^)]|\\([^)]*\\))+)\\)`, 'g'),
    `structuredLog('info', $1, { details: $2 })`
  );
  s = s.replace(new RegExp(`console\\.debug\\(\\s*(${strOrTpl})\\s*\\)`, 'g'), `structuredLog('debug', $1)`);
  s = s.replace(new RegExp(`console\\.warn\\(\\s*(${strOrTpl})\\s*\\)`, 'g'), `structuredLog('warn', $1)`);

  /** console.error(ident, plain object literal) */
  s = s.replace(
    /console\.error\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*,\s*(\{[^}]*\})\s*\)/g,
    `structuredLog('error', 'Error', { error: toLogContextPart($1), context: $2 })`
  );

  /** console.info */
  s = s.replace(
    new RegExp(`console\\.info\\(\\s*(${strOrTpl})\\s*,\\s*((?:[^)]|\\([^)]*\\))+?)\\)`, 'g'),
    `structuredLog('info', $1, { details: $2 })`
  );
  s = s.replace(new RegExp(`console\\.info\\(\\s*(${strOrTpl})\\s*\\)`, 'g'), `structuredLog('info', $1)`);

  /** console.log(singleIdentifier); */
  s = s.replace(
    /console\.log\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)\s*;/g,
    `structuredLog('info', 'console.log', { value: toLogContextPart($1) });`
  );

  /** Single-arg console.error string */
  s = s.replace(new RegExp(`console\\.error\\(\\s*(${strOrTpl})\\s*\\)`, 'g'), `structuredLog('error', $1)`);

  /** console.warn(property chain) */
  s = s.replace(
    /console\.warn\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)+)\s*\)/g,
    `structuredLog('warn', String($1))`
  );

  return s;
}

let updated = 0;
for (const base of scanDirs) {
  for (const fp of walk(base)) {
    const txt = fs.readFileSync(fp, 'utf8');
    if (!/console\.(log|warn|error|debug|info)\(/.test(txt)) {
      continue;
    }
    let next = replaceConsole(txt);
    if (next === txt) {
      continue;
    }
    next = ensureImport(next);
    fs.writeFileSync(fp, next);
    updated++;
  }
}

// eslint-disable-next-line no-console -- migration utility
console.log(JSON.stringify({ updatedFiles: updated }));
