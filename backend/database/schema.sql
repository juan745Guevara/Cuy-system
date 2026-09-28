-- Delivery 1 — unified schema

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('superadmin','admin','encargado','supervisor','auxiliar')),
  activo BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS especies (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS granjas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  id_especie INTEGER NOT NULL REFERENCES especies(id),
  ubicacion VARCHAR(200),
  responsable VARCHAR(100),
  fecha_inicio DATE,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_granjas (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  id_granja INTEGER NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  UNIQUE(id_usuario, id_granja)
);

CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  proposito VARCHAR(50) NOT NULL,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_granja, nombre)
);

CREATE TABLE IF NOT EXISTS jaulas (
  id SERIAL PRIMARY KEY,
  id_area INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  capacidad_maxima INTEGER,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_area, codigo)
);

CREATE TABLE IF NOT EXISTS razas (
  id SERIAL PRIMARY KEY,
  id_especie INTEGER NOT NULL REFERENCES especies(id),
  nombre VARCHAR(100) NOT NULL,
  activa BOOLEAN DEFAULT true,
  UNIQUE(id_especie, nombre)
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  id_especie INTEGER NOT NULL REFERENCES especies(id),
  nombre VARCHAR(100) NOT NULL,
  proposito_area VARCHAR(50),
  activa BOOLEAN DEFAULT true,
  UNIQUE(id_especie, nombre)
);

CREATE TABLE IF NOT EXISTS animales (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  codigo VARCHAR(50) NOT NULL,
  codigo_norm VARCHAR(50) NOT NULL,
  sexo CHAR(1) NOT NULL CHECK (sexo IN ('M','H')),
  id_raza INTEGER REFERENCES razas(id),
  id_categoria INTEGER REFERENCES categorias(id),
  id_jaula INTEGER REFERENCES jaulas(id),
  fecha_nacimiento DATE,
  estado VARCHAR(20) DEFAULT 'activo'
    CHECK (estado IN ('activo','baja_muerte','baja_venta','descarte')),
  fecha_baja DATE,
  motivo_baja TEXT,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_granja, codigo_norm)
);

CREATE TABLE IF NOT EXISTS animal_particularidades (
  id SERIAL PRIMARY KEY,
  id_animal INTEGER NOT NULL REFERENCES animales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  texto TEXT NOT NULL,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS empadres (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_macho INTEGER REFERENCES animales(id),
  id_jaula INTEGER REFERENCES jaulas(id),
  fecha_empadre DATE NOT NULL,
  peso_antes NUMERIC(10,2),
  peso_despues NUMERIC(10,2),
  cantidad_hembras INTEGER,
  cantidad_prenadas INTEGER,
  notas TEXT,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS empadre_hembras (
  id SERIAL PRIMARY KEY,
  id_empadre INTEGER NOT NULL REFERENCES empadres(id) ON DELETE CASCADE,
  id_hembra INTEGER NOT NULL REFERENCES animales(id),
  resultado VARCHAR(20) DEFAULT 'abierto'
    CHECK (resultado IN ('abierto','prenez','vacia','aborto','murio')),
  UNIQUE(id_empadre, id_hembra)
);

CREATE TABLE IF NOT EXISTS partos (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_hembra INTEGER NOT NULL REFERENCES animales(id),
  id_empadre INTEGER REFERENCES empadres(id),
  fecha_parto DATE NOT NULL,
  vivos_m INTEGER DEFAULT 0,
  vivos_h INTEGER DEFAULT 0,
  muertos INTEGER DEFAULT 0,
  peso_m1 NUMERIC(10,2), peso_m2 NUMERIC(10,2), peso_m3 NUMERIC(10,2),
  peso_h1 NUMERIC(10,2), peso_h2 NUMERIC(10,2), peso_h3 NUMERIC(10,2),
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destetes (
  id SERIAL PRIMARY KEY,
  id_parto INTEGER NOT NULL REFERENCES partos(id) ON DELETE CASCADE,
  fecha_destete DATE NOT NULL,
  destetados_m INTEGER DEFAULT 0,
  destetados_h INTEGER DEFAULT 0,
  muertos INTEGER DEFAULT 0,
  peso_m1 NUMERIC(10,2), peso_m2 NUMERIC(10,2), peso_m3 NUMERIC(10,2),
  peso_h1 NUMERIC(10,2), peso_h2 NUMERIC(10,2), peso_h3 NUMERIC(10,2),
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mortalidad (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_animal INTEGER REFERENCES animales(id),
  fecha DATE NOT NULL,
  clasificacion VARCHAR(50),
  categoria VARCHAR(50),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  causa TEXT,
  id_jaula INTEGER REFERENCES jaulas(id),
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_animal INTEGER REFERENCES animales(id),
  fecha DATE NOT NULL,
  clasificacion VARCHAR(50),
  categoria VARCHAR(50),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  comprador VARCHAR(100),
  precio NUMERIC(10,2),
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id),
  accion VARCHAR(100) NOT NULL,
  detalle TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery 2/3: movements, weighings, health, alerts, ranking
CREATE TABLE IF NOT EXISTS movimientos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('relocate','transfer')),
  id_animal INTEGER NOT NULL REFERENCES animales(id),
  id_granja_origen INTEGER REFERENCES granjas(id),
  id_granja_destino INTEGER REFERENCES granjas(id),
  id_jaula_origen INTEGER REFERENCES jaulas(id),
  id_jaula_destino INTEGER REFERENCES jaulas(id),
  fecha DATE NOT NULL,
  motivo TEXT,
  excedio_capacidad BOOLEAN DEFAULT false,
  aviso_area BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pesajes (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_animal INTEGER NOT NULL REFERENCES animales(id),
  fecha DATE NOT NULL,
  peso_gramos NUMERIC(10,2) NOT NULL CHECK (peso_gramos > 0),
  fuera_rango BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tratamientos (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  id_animal INTEGER REFERENCES animales(id),
  id_jaula INTEGER REFERENCES jaulas(id),
  id_area INTEGER REFERENCES areas(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('preventivo','curativo')),
  producto VARCHAR(150) NOT NULL,
  dosis VARCHAR(100),
  via VARCHAR(50),
  fecha_inicio DATE NOT NULL,
  duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
  fecha_termino DATE NOT NULL,
  diagnostico TEXT,
  responsable VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'en_curso' CHECK (estado IN ('en_curso','terminado')),
  motivo_cierre TEXT,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerta_config (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  dias INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  UNIQUE(id_granja, tipo)
);

-- Weight ranges per category, configurable and persisted per farm
CREATE TABLE IF NOT EXISTS peso_rangos (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL,
  min INTEGER NOT NULL,
  max INTEGER NOT NULL,
  updated_by INTEGER REFERENCES usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_granja, categoria)
);

CREATE TABLE IF NOT EXISTS alertas_descarte (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL REFERENCES granjas(id),
  tipo VARCHAR(50) NOT NULL,
  id_animal INTEGER,
  id_referencia INTEGER,
  motivo TEXT,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ranking_config (
  id SERIAL PRIMARY KEY,
  id_granja INTEGER NOT NULL UNIQUE REFERENCES granjas(id) ON DELETE CASCADE,
  peso_partos NUMERIC(6,2) DEFAULT 20,
  peso_camada NUMERIC(6,2) DEFAULT 25,
  peso_destete NUMERIC(6,2) DEFAULT 20,
  peso_mortalidad NUMERIC(6,2) DEFAULT 15,
  peso_peso_nac NUMERIC(6,2) DEFAULT 10,
  peso_peso_dest NUMERIC(6,2) DEFAULT 10,
  peso_prenez_macho NUMERIC(6,2) DEFAULT 30,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animales_codigo_norm ON animales(codigo_norm);
CREATE INDEX IF NOT EXISTS idx_animales_granja_estado ON animales(id_granja, estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_animal ON movimientos(id_animal);
CREATE INDEX IF NOT EXISTS idx_pesajes_animal ON pesajes(id_animal);
CREATE INDEX IF NOT EXISTS idx_tratamientos_granja ON tratamientos(id_granja, estado);

-- Idempotent columns / FKs for existing DBs
DO $$ BEGIN
  ALTER TABLE animales ADD COLUMN IF NOT EXISTS id_parto_origen INTEGER REFERENCES partos(id);
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE empadres ADD COLUMN IF NOT EXISTS cantidad_hembras INTEGER;
  ALTER TABLE empadres ADD COLUMN IF NOT EXISTS cantidad_prenadas INTEGER;
EXCEPTION WHEN others THEN NULL;
END $$;
