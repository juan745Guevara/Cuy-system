/*
 * Respaldo de la base de datos (política de respaldo del Diseño de datos, sección 4.6).
 *
 *   npm run db:backup                       copia comprimida + verificación + retención
 *   npm run db:restore -- <archivo> --yes   restaura una copia sobre la base configurada
 *
 * Variables de entorno (opcionales):
 *   BACKUP_DIR            carpeta destino (por defecto backend/backups; usar una unidad externa)
 *   BACKUP_KEEP_DAILY     copias diarias que se conservan (7)
 *   BACKUP_KEEP_WEEKLY    copias semanales (4)
 *   BACKUP_KEEP_MONTHLY   copias mensuales (12)
 *   PG_BIN                carpeta de pg_dump/pg_restore si no están en el PATH
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { resolveDatabaseUrl } from './pg-pool';

const PREFIJO = 'cuy_system_';
const EXT = '.dump';

/** Busca un ejecutable de PostgreSQL (PG_BIN, PATH o instalación estándar de Windows). */
function pgTool(nombre: 'pg_dump' | 'pg_restore'): string {
  const exe = process.platform === 'win32' ? `${nombre}.exe` : nombre;
  if (process.env.PG_BIN) return path.join(process.env.PG_BIN, exe);
  try {
    execFileSync(exe, ['--version'], { stdio: 'ignore' });
    return exe;
  } catch {
    const base = 'C:\\Program Files\\PostgreSQL';
    if (process.platform === 'win32' && fs.existsSync(base)) {
      const versiones = fs
        .readdirSync(base)
        .filter((v) => fs.existsSync(path.join(base, v, 'bin', exe)))
        .sort((a, b) => Number(b) - Number(a));
      if (versiones.length) return path.join(base, versiones[0], 'bin', exe);
    }
    throw new Error(`No se encontró ${nombre}. Configure PG_BIN con la carpeta bin de PostgreSQL.`);
  }
}

/** Variables PG* a partir de la URL: la contraseña no aparece en la línea de comandos. */
function entornoPg(): NodeJS.ProcessEnv {
  const url = new URL(resolveDatabaseUrl());
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: url.pathname.replace(/^\//, ''),
  };
}

const carpeta = () => path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
const marca = (d: Date) => d.toISOString().slice(0, 16).replace('T', '_').replace(':', '');

function semanaIso(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${Math.ceil(((+t - +inicio) / 86400000 + 1) / 7)}`;
}

/** Conserva la copia más reciente de cada día, semana y mes dentro de los límites; borra el resto. */
function aplicarRetencion(dir: string) {
  const keep = {
    dia: Number(process.env.BACKUP_KEEP_DAILY || 7),
    semana: Number(process.env.BACKUP_KEEP_WEEKLY || 4),
    mes: Number(process.env.BACKUP_KEEP_MONTHLY || 12),
  };
  const copias = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(PREFIJO) && f.endsWith(EXT))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtime }))
    .sort((a, b) => +b.t - +a.t);

  const conservar = new Set<string>();
  const elegir = (clave: (d: Date) => string, limite: number) => {
    const vistos = new Set<string>();
    for (const c of copias) {
      const k = clave(c.t);
      if (vistos.has(k)) continue;
      if (vistos.size >= limite) break;
      vistos.add(k);
      conservar.add(c.f);
    }
  };
  elegir((d) => d.toISOString().slice(0, 10), keep.dia);
  elegir(semanaIso, keep.semana);
  elegir((d) => d.toISOString().slice(0, 7), keep.mes);

  const borradas = copias.filter((c) => !conservar.has(c.f));
  for (const c of borradas) fs.unlinkSync(path.join(dir, c.f));
  return { conservadas: conservar.size, borradas: borradas.length };
}

function respaldar() {
  const dir = carpeta();
  fs.mkdirSync(dir, { recursive: true });
  const archivo = path.join(dir, `${PREFIJO}${marca(new Date())}${EXT}`);
  const env = entornoPg();

  execFileSync(pgTool('pg_dump'), ['-Fc', '--no-owner', '-f', archivo], { env, stdio: 'inherit' });

  // Verificación: el archivo existe, no está vacío y pg_restore puede leer su índice.
  const tam = fs.statSync(archivo).size;
  if (!tam) throw new Error('La copia quedó vacía');
  const indice = execFileSync(pgTool('pg_restore'), ['--list', archivo], { env }).toString();
  const tablas = (indice.match(/ TABLE DATA /g) || []).length;

  const { conservadas, borradas } = aplicarRetencion(dir);
  console.log(
    `Respaldo OK: ${archivo} (${(tam / 1024).toFixed(1)} KB, ${tablas} tablas). ` +
      `Copias conservadas: ${conservadas}; eliminadas por retención: ${borradas}.`,
  );
}

function restaurar(archivo: string | undefined, confirmado: boolean) {
  if (!archivo || !fs.existsSync(archivo)) throw new Error('Indique un archivo .dump existente.');
  const env = entornoPg();
  if (!confirmado) {
    throw new Error(
      `La restauración reemplaza los datos de la base "${env.PGDATABASE}". ` +
        'Repita el comando agregando --yes para confirmar.',
    );
  }
  execFileSync(pgTool('pg_restore'), ['--clean', '--if-exists', '--no-owner', '-d', String(env.PGDATABASE), archivo], {
    env,
    stdio: 'inherit',
  });
  console.log(`Restauración OK desde ${archivo} en "${env.PGDATABASE}".`);
}

try {
  const [modo, ...resto] = process.argv.slice(2);
  if (modo === 'restore') restaurar(resto.find((a) => !a.startsWith('--')), resto.includes('--yes'));
  else respaldar();
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exit(1);
}
