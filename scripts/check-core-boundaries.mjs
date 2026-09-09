import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreRoot = resolve(repoRoot, 'src/app/core');

const normalizePath = value => normalize(value).split(sep).join('/');
const corePrefix = `${normalizePath(coreRoot)}/`;

const allowedLegacyEscapes = new Map([
  [
    'src/app/core/data-grid/data-grid.component.ts',
    new Set([
      '../../interface/app.interface',
      '../../widgets/ui-dialogs',
      '../../services/anagrafica.service',
      '../../services/overlay.service',
    ]),
  ],
  [
    'src/app/core/data-grid/td-item/td-item.component.ts',
    new Set([
      '../../../interface/app.interface',
      '../../../widgets/ui-dialogs',
      '../../../services/anagrafica.service',
      '../../../services/overlay.service',
    ]),
  ],
]);

const forbiddenPackages = ['@angular/fire', 'firebase'];
const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

function listTypeScriptFiles(directory) {
  return readdirSync(directory).flatMap(name => {
    const entry = join(directory, name);
    const stats = statSync(entry);
    if (stats.isDirectory()) return listTypeScriptFiles(entry);
    if (entry.endsWith('.spec.ts')) return [];
    return extname(entry) === '.ts' ? [entry] : [];
  });
}

const violations = [];
const legacyEscapesSeen = [];

for (const file of listTypeScriptFiles(coreRoot)) {
  const source = readFileSync(file, 'utf8');
  const sourcePath = normalizePath(relative(repoRoot, file));

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;

    if (forbiddenPackages.some(prefix => specifier === prefix || specifier.startsWith(`${prefix}/`))) {
      violations.push(`${sourcePath} -> ${specifier} (forbidden package)`);
      continue;
    }

    if (specifier.includes('environments/')) {
      violations.push(`${sourcePath} -> ${specifier} (environment import)`);
      continue;
    }

    if (!specifier.startsWith('.')) continue;

    const target = normalizePath(resolve(dirname(file), specifier));
    if (target === normalizePath(coreRoot) || target.startsWith(corePrefix)) continue;

    const allowedForFile = allowedLegacyEscapes.get(sourcePath);
    if (allowedForFile?.has(specifier)) {
      legacyEscapesSeen.push(`${sourcePath} -> ${specifier}`);
      continue;
    }

    violations.push(`${sourcePath} -> ${specifier} (escapes src/app/core)`);
  }
}

if (violations.length > 0) {
  console.error('Starter Kit Core boundary violations found:');
  violations.forEach(violation => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('Starter Kit Core boundary check passed.');
if (legacyEscapesSeen.length > 0) {
  console.log('Characterized legacy DataGrid escapes preserved for V1 compatibility:');
  legacyEscapesSeen.forEach(entry => console.log(`- ${entry}`));
}
