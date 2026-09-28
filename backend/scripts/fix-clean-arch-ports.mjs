import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nest = path.join(__dirname, '../src/nest');

function methodNamesFromRepo(content) {
  const names = new Set();
  for (const m of content.matchAll(/^  async ([a-z][a-zA-Z0-9]*)/gm)) {
    names.add(m[1]);
  }
  for (const m of content.matchAll(/^  ([a-z][a-zA-Z0-9]*)\([^)]*\)\s*\{/gm)) {
    if (m[1] === 'constructor') continue;
    names.add(m[1]);
  }
  return [...names].sort();
}

function writePort(portsDir, base, names) {
  const pascal = base.charAt(0).toUpperCase() + base.slice(1);
  const portName = `${pascal}RepositoryPort`;
  const lines = names.map(
    (n) => `  abstract ${n}(...args: any[]): Promise<any> | any;`,
  );
  fs.writeFileSync(
    path.join(portsDir, `${base}.repository.port.ts`),
    `/** Domain port (repository abstraction). */\nexport abstract class ${portName} {\n  protected constructor() {}\n${lines.join('\n')}\n}\n`,
  );
}

// Export constants from weighings repo if they were in same file
const weighRepo = path.join(
  nest,
  'cuyes/infrastructure/persistence/weighings.repository.ts',
);
let wr = fs.readFileSync(weighRepo, 'utf8');
if (!wr.includes('export const RANGOS_DEFAULT')) {
  wr = wr.replace(
    'const RANGOS_DEFAULT',
    'export const RANGOS_DEFAULT',
  );
  wr = wr.replace('const CATEGORIAS_RANGO', 'export const CATEGORIAS_RANGO');
  wr = wr.replace('const ESPECIE_ABS', 'export const ESPECIE_ABS');
  fs.writeFileSync(weighRepo, wr);
}

for (const mod of ['cuyes', 'platform']) {
  const root = path.join(nest, mod);
  const infra = path.join(root, 'infrastructure/persistence');
  const portsDir = path.join(root, 'domain/ports');
  for (const f of fs.readdirSync(infra)) {
    if (!f.endsWith('.repository.ts')) continue;
    const base = f.replace('.repository.ts', '');
    writePort(portsDir, base, methodNamesFromRepo(fs.readFileSync(path.join(infra, f), 'utf8')));
  }
}

console.log('Ports regenerated (strict).');
