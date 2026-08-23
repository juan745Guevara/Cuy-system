-- Entrega 1 — esquema unificado

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

CREATE INDEX IF NOT EXISTS idx_animales_codigo_norm ON animales(codigo_norm);
CREATE INDEX IF NOT EXISTS idx_animales_granja_estado ON animales(id_granja, estado);
