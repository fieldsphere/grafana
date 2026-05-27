#!/usr/bin/env node
/** Console.* → Grafana structured helpers. */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const SKIP_SUB = [
  'structuredBrowserLog.ts',
  `${path.sep}utils${path.sep}logging.ts`,
  '.test.',
  '.spec.',
  '.story.',
  '/scripts/',
];

function hasRuntime(pkgRoot) {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'));
    const d = { ...(j.dependencies ?? {}), ...(j.peerDependencies ?? {}) };
    return d['@grafana/runtime'] !== undefined;
  } catch {
    return false;
  }
}

function findPkgRoot(fp) {
  let d = path.dirname(fp);
  while (d.startsWith(ROOT)) {
    if (fs.existsSync(path.join(d, 'package.json'))) {
      return d;
    }
    const u = path.dirname(d);
    if (u === d) {
      break;
    }
    d = u;
  }
  return null;
}

function structuredRel(fromFile) {
  let rel = path
    .relative(path.dirname(fromFile), path.join(ROOT, 'packages/grafana-data/src/utils/structuredBrowserLog'))
    .replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  return rel.replace(/\.tsx?$/, '');
}

function consumeClosingParen(openParen, src) {
  let depth = 0;
  for (let idx = openParen; idx < src.length; idx++) {
    const c = src[idx];
    if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        return { inner: src.slice(openParen + 1, idx), closeIdx: idx };
      }
    }
  }
  return null;
}

function normErr(expr) {
  const t = expr.trim();
  if (t.startsWith('`') || t.startsWith("'") || t.startsWith('"')) {
    return `new Error(${t})`;
  }
  return `${t} instanceof Error ? ${t} : new Error(String(${t}))`;
}

function trailingNewlines(full, posAfterStmt) {
  let out = '';
  for (let i = posAfterStmt; i < full.length && (full[i] === '\n' || full[i] === '\r'); i++) {
    out += full[i];
  }
  return out;
}

function ensureImport(full, importSnippet) {
  const line = importSnippet.trim();
  if (full.includes(line)) {
    return full;
  }

  const sf = ts.createSourceFile('_f.tsx', full, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let importEnd = 0;
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) || ts.isImportEqualsDeclaration(st)) {
      importEnd = st.end;
    } else {
      break;
    }
  }
  const lb = trailingNewlines(full, importEnd);
  const cut = importEnd + lb.length;
  return `${full.slice(0, importEnd)}${lb || '\n'}${importSnippet}\n${full.slice(cut)}`;
}

function replacementsFor(full, mode, logRef) {
  const methods = ['error', 'warn', 'log', 'info', 'debug'];
  const marks = [];
  const src = full;

  for (const m of methods) {
    const pre = `console.${m}`;
    let p = 0;
    while (p < src.length) {
      const ix = src.indexOf(pre + '(', p);
      if (ix === -1) {
        break;
      }
      if (ix > 0 && /\w/.test(src[ix - 1])) {
        p = ix + 2;
        continue;
      }
      marks.push({ ix, m, open: ix + pre.length });
      p = ix + pre.length + 2;
    }
  }

  marks.sort((a, b) => a.ix - b.ix);

  /** @type { { start:number,end:number,str:string }[] } */
  const picked = [];
  let maxRight = -1;

  for (const h of marks) {
    const ext = consumeClosingParen(h.open, src);
    if (!ext) {
      continue;
    }
    const start = h.ix;
    const end = ext.closeIdx + 1;
    if (start < maxRight) {
      continue;
    }

    const lineStart = src.lastIndexOf('\n', start);
    const prefix = src.slice(lineStart + 1, start).trimStart();
    if (prefix.startsWith('//') || prefix.startsWith('*')) {
      continue;
    }

    const args = ext.inner.trim();
    let str = '';

    if (mode === 'runtime') {
      if (h.m === 'error') {
        if (!args) {
          continue;
        }
        str = !args.includes(',')
          ? `${logRef}.logError(${normErr(args)})`
          : (() => {
              const lc = args.lastIndexOf(',');
              return `${logRef}.logError(${normErr(args.slice(lc + 1).trim())}, { message: String(${args.slice(0, lc).trim()}) })`;
            })();
      } else {
        const cap = h.m === 'log' || h.m === 'info' ? 'Info' : h.m === 'debug' ? 'Debug' : 'Warning';
        if (!args) {
          continue;
        }
        str = !args.includes(',')
          ? `${logRef}.log${cap}(String(${args}))`
          : (() => {
              const fc = args.indexOf(',');
              return `${logRef}.log${cap}(String(${args.slice(0, fc).trim()}), { args: ${args.slice(fc + 1).trim()} })`;
            })();
      }
    } else {
      if (h.m === 'error') {
        if (!args) {
          continue;
        }
        str = !args.includes(',')
          ? `emitStructuredBrowserError(${normErr(args)})`
          : (() => {
              const lc = args.lastIndexOf(',');
              return `emitStructuredBrowserError(${normErr(args.slice(lc + 1).trim())}, { message: String(${args.slice(0, lc).trim()}) })`;
            })();
      } else {
        const lvl = h.m === 'log' || h.m === 'info' ? 'info' : h.m === 'debug' ? 'debug' : 'warn';
        if (!args) {
          continue;
        }
        str = !args.includes(',')
          ? `emitStructuredBrowserLog('${lvl}', String(${args}))`
          : (() => {
              const fc = args.indexOf(',');
              return `emitStructuredBrowserLog('${lvl}', String(${args.slice(0, fc).trim()}), { args: ${args.slice(fc + 1).trim()} })`;
            })();
      }
    }

    picked.push({ start, end, str });
    maxRight = Math.max(maxRight, end);
  }

  return picked.sort((a, b) => b.start - a.start);
}

function patchOne(file) {
  if (SKIP_SUB.some((s) => file.includes(s))) {
    return false;
  }

  let text = fs.readFileSync(file, 'utf8');
  if (!/console\.(log|warn|error|info|debug)\s*\(/.test(text)) {
    return false;
  }

  const orig = text;
  const norm = file.replace(/\\/g, '/');
  const isRuntimeConfig = norm.endsWith('packages/grafana-runtime/src/config.ts');
  const inGrafanaData = norm.includes('packages/grafana-data/');
  const pkg = findPkgRoot(file);
  const runtimeMode = !isRuntimeConfig && !inGrafanaData && pkg && hasRuntime(pkg);

  const importLine = runtimeMode
    ? `import { grafanaStructuredLogger } from '@grafana/runtime';`
    : `import { emitStructuredBrowserError, emitStructuredBrowserLog } from '${
        inGrafanaData ? structuredRel(file) : '@grafana/data'
      }';`;

  text = text.replace(
    /\.catch\(\s*console\.error\s*\)/g,
    runtimeMode
      ? '.catch((err: unknown) => grafanaStructuredLogger.logError(err instanceof Error ? err : new Error(String(err))))'
      : '.catch((err: unknown) => emitStructuredBrowserError(err instanceof Error ? err : new Error(String(err))))'
  );

  const reps = replacementsFor(text, runtimeMode ? 'runtime' : 'emit', 'grafanaStructuredLogger');
  for (const r of reps) {
    text = text.slice(0, r.start) + r.str + text.slice(r.end);
  }

  /** throw console.error — convert to log + throw */
  {
    const pre = 'throw console.error(';
    let search = 0;
    while (true) {
      const i = text.indexOf(pre, search);
      if (i < 0) {
        break;
      }
      const openParenIdx = i + 'throw console.error('.length - 1;
      const ext = consumeClosingParen(openParenIdx, text);
      if (!ext) {
        search = i + pre.length;
        continue;
      }
      const args = ext.inner.trim();
      const errExpr = !args.includes(',') ? normErr(args) : normErr(args.slice(args.lastIndexOf(',') + 1).trim());
      const rep = `{ const _err = ${errExpr}; ${
        runtimeMode ? 'grafanaStructuredLogger.logError(_err)' : 'emitStructuredBrowserError(_err)'
      }; throw _err; }`;
      text = text.slice(0, i) + rep + text.slice(ext.closeIdx + 1);
      search = i + rep.length;
    }
  }

  if (text === orig) {
    return false;
  }

  text = ensureImport(text, importLine);

  fs.writeFileSync(file, text);
  return true;
}

function listTargets() {
  const out = execSync(
    `grep -rl "console\\\\.\\\\(log\\\\|warn\\\\|error\\\\|info\\\\|debug\\\\)" --exclude-dir=node_modules --exclude-dir=.yarn --include='*.ts' --include='*.tsx' public/app packages 2>/dev/null || true`,
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  return out
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((p) => path.join(ROOT, p));
}

let n = 0;
for (const f of listTargets()) {
  try {
    if (patchOne(f)) {
      n++;
      console.log('patched', path.relative(ROOT, f));
    }
  } catch (e) {
    console.error('failed', f, e);
  }
}
console.log('done, files:', n);
