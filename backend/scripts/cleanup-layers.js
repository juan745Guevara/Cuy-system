const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const LAYERS = ['presentation', 'application', 'infrastructure', 'domain'];

const FEATURES = [
  ...['auth','usuarios','granjas','areas','jaulas','animales','catalogos','movimientos',
      'mortalidad','ventas','inventario','pesajes','tratamientos','auditoria','reportes']
    .map((f) => path.join(SRC, 'core', f)),
  ...['empadres','partos','destetes','alertas','ranking']
    .map((f) => path.join(SRC, 'modules', 'cuyes', f)),
];

for (const featurePath of FEATURES) {
  for (const layer of LAYERS) {
    const dir = path.join(featurePath, layer);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('Removed', dir);
    }
  }
}

console.log('Cleanup done.');
