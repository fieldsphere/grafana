/**
 * Place `const clientLog = createClientLog('...');` right after the last
 * `import` line (all static import forms).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const STRIP_RE = /const clientLog = createClientLog\([^;]*\);\n?/m;

/**
 * @param {string} line
 */
function closesImportLine(t) {
  t = t.trim();
  if (!t.endsWith(';') || t.startsWith('//')) {
    return false;
  }
  if (/^import\s*\(/.test(t) || t.startsWith('import(') || t.startsWith('import (')) {
    return false;
  }
  if (t.match(/^import ['"]/)) {
    return true;
  }
  if (t.match(/} from [\"']| from [\"']/)) {
    return true;
  }
  return false;
}

/**
 * @param {string[]} lines
 * @returns {number}
 */
function lineIndexOfLastImportEnd(lines) {
  let last = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*import\s+/.test(lines[i])) {
      continue;
    }
    if (/^\s*import\s*\(/.test(lines[i].trim()) || /^\s*import\s*\.meta/.test(lines[i].trim())) {
      continue;
    }
    for (let j = i; j < lines.length; j++) {
      if (closesImportLine(lines[j])) {
        if (i <= j) {
          last = j;
        }
        i = j;
        break;
      }
    }
  }
  return last;
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function processText(text) {
  if (!/const clientLog = createClientLog\(/m.test(text)) {
    return null;
  }
  if (!STRIP_RE.test(text)) {
    return null;
  }
  const m = text.match(STRIP_RE);
  if (!m) {
    return null;
  }
  const constBlock = m[0];
  const noConst = text.replace(STRIP_RE, '');
  const lines = noConst.split('\n');
  const li = lineIndexOfLastImportEnd(lines);
  if (li < 0) {
    return constBlock + (constBlock.endsWith('\n') ? '' : '\n') + noConst;
  }
  return [...lines.slice(0, li + 1), constBlock, ...lines.slice(li + 1)].join('\n');
}

const fileList = execSync(`cd "${root}" && git ls-files "*.ts" "*.tsx"`, { encoding: 'utf8' })
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean);

let count = 0;
for (const f of fileList) {
  const p = join(root, f);
  if (!existsSync(p)) {
    continue;
  }
  const t0 = readFileSync(p, 'utf8');
  if (!/const clientLog = createClientLog/.test(t0)) {
    continue;
  }
  const t1 = processText(t0);
  if (t1 != null && t1 !== t0) {
    writeFileSync(p, t1);
    count++;
  }
}
process.stdout.write(`fix-clientlog-import: ${count} files\n`);
