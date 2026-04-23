/**
 * Replaces console.log/warn/error/debug/info with structLog from @grafana/data.
 * Run: node ./scripts/codemods/replace-console-with-structLog.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const levelMap = { log: 'log', info: 'info', warn: 'warn', error: 'error', debug: 'debug' };

function shouldProcessFile(relative) {
  if (relative.includes('node_modules') || relative.includes('dist/')) {
    return false;
  }
  if (relative.includes('public/test/') || relative.includes('e2e/') || relative.includes('e2e-playwright/')) {
    return false;
  }
  const base = path.basename(relative);
  if (
    /\.(test|spec|stories|story)\.tsx?$/.test(base) ||
    /jest\.config/.test(base) ||
    /webpack\./.test(relative) ||
    relative.startsWith('scripts/') // keep build scripts on console
  ) {
    return false;
  }
  if (base === 'replace-console-with-structLog.mjs') {
    return false;
  }
  if (relative.includes('structLog.ts') || relative.includes('packages/grafana-data/src/utils/structLog')) {
    return false;
  }
  return true;
}

function isEslintNoConsoleDisabled(text, pos) {
  for (const cr of ts.getLeadingCommentRanges(text, pos) ?? []) {
    const t = text.substring(cr.pos, cr.end);
    if (t.includes('eslint') && t.includes('no-console')) {
      return true;
    }
  }
  return false;
}

/**
 * @param {ts.SourceFile} sourceFile
 */
function addStructLogImport(sourceFile) {
  const newImport = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('structLog'))])
    ),
    ts.factory.createStringLiteral('@grafana/data'),
    undefined
  );
  return ts.factory.updateSourceFile(sourceFile, [newImport, ...sourceFile.statements]);
}

function hasStructLogImport(sourceFile) {
  for (const s of sourceFile.statements) {
    if (ts.isImportDeclaration(s) && s.moduleSpecifier && ts.isStringLiteral(s.moduleSpecifier)) {
      if (s.moduleSpecifier.text !== '@grafana/data') {
        continue;
      }
      const b = s.importClause?.namedBindings;
      if (b && ts.isNamedImports(b)) {
        for (const e of b.elements) {
          if (e.name.text === 'structLog' || (e.propertyName && e.propertyName.text === 'structLog')) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

let needsStructLog = false;
/**
 * @param {ts.TransformationContext} context
 * @param {ts.SourceFile} sourceFile
 */
function transformSourceFile(context, sourceFile) {
  needsStructLog = false;
  const fullText = sourceFile.getFullText();
  const visitor = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const expr = node.expression;
      if (expr.name && expr.expression && ts.isIdentifier(expr.expression) && expr.expression.text === 'console') {
        const method = expr.name.text;
        if (levelMap[method]) {
          if (isEslintNoConsoleDisabled(fullText, node.getFullStart())) {
            return ts.visitEachChild(node, visitor, context);
          }
          needsStructLog = true;
          return ts.factory.createCallExpression(
            ts.factory.createIdentifier('structLog'),
            undefined,
            [ts.factory.createStringLiteral(levelMap[method]), ...node.arguments]
          );
        }
      }
    }
    return ts.visitEachChild(node, visitor, context);
  };
  const result = ts.visitNode(sourceFile, visitor);
  if (needsStructLog && ts.isSourceFile(result) && !hasStructLogImport(result)) {
    return addStructLogImport(result);
  }
  return result;
}

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const patterns = [
  'public/app/**/*.{ts,tsx}',
  'packages/**/*.{ts,tsx}',
  'public/swagger/**/*.{ts,tsx}',
];

const files = patterns.flatMap((p) => glob.sync(p, { cwd: root, nodir: true, absolute: true }));

let count = 0;
for (const file of files) {
  const rel = path.relative(root, file);
  if (!shouldProcessFile(rel)) {
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  if (!/console\.(log|info|warn|error|debug)\s*\(/.test(text)) {
    continue;
  }
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const tr = (context) => (s) => transformSourceFile(context, s);
  const res = ts.transform(sf, [tr]);
  const out = res.transformed[0];
  if (!out) {
    continue;
  }
  if (out === sf) {
    res.dispose();
    continue;
  }
  const outText = printer.printFile(out) + (text.endsWith('\n') ? '' : '\n');
  fs.writeFileSync(file, outText);
  count += 1;
  res.dispose();
  console.log('updated', rel);
}
console.log('Files updated:', count);
