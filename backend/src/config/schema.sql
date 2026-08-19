-- ============================================
-- Sistema de Control de Animales - UNAS
-- Esquema de Base de Datos PostgreSQL
-- ============================================

-- Tabla de usuarios (NUC-01)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('superadmin', 'admin', 'encargado', 'supervisor', 'auxiliar')),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de especies
CREATE TABLE especies (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT true
);

-- Tabla de granjas (NUC-04)
CREATE TABLE granjas (
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

-- Relación usuario-granja (NUC-05)
CREATE TABLE usuario_granjas (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    UNIQUE(id_usuario, id_granja)
);

-- Áreas de la granja (NUC-16)
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    nombre VARCHAR(100) NOT NULL,
    proposito VARCHAR(50) NOT NULL,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jaulas (NUC-13)
CREATE TABLE jaulas (
    id SERIAL PRIMARY KEY,
    id_area INTEGER NOT NULL REFERENCES areas(id),
    nombre VARCHAR(50) NOT NULL,
    capacidad_maxima INTEGER,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_area, nombre)
);

-- Catálogo de razas (CUY-01)
CREATE TABLE razas (
    id SERIAL PRIMARY KEY,
    id_especie INTEGER NOT NULL REFERENCES especies(id),
    nombre VARCHAR(100) NOT NULL,
    activa BOOLEAN DEFAULT true,
    UNIQUE(id_especie, nombre)
);

-- Categorías del animal (CUY-02)
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    id_especie INTEGER NOT NULL REFERENCES especies(id),
    nombre VARCHAR(100) NOT NULL,
    proposito_area VARCHAR(50),
    activa BOOLEAN DEFAULT true,
    UNIQUE(id_especie, nombre)
);

-- Animales (NUC-09)
CREATE TABLE animales (
    id SERIAL PRIMARY KEY,
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    codigo VARCHAR(50) NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'H')),
    id_raza INTEGER REFERENCES razas(id),
    id_categoria INTEGER REFERENCES categorias(id),
    id_jaula INTEGER REFERENCES jaulas(id),
    fecha_nacimiento DATE,
    particularidades TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'baja_muerte', 'baja_venta', 'descarte')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_granja, codigo)
);

-- Empadres (CUY-07, CUY-13)
CREATE TABLE empadres (
    id SERIAL PRIMARY KEY,
    id_macho INTEGER REFERENCES animales(id),
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    fecha_empadre DATE NOT NULL,
    cantidad_hembras INTEGER,
    cantidad_preñadas INTEGER,
    peso_antes DECIMAL(10,2),
    peso_despues DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hembras en empadre (relación many-to-many)
CREATE TABLE empadre_hembras (
    id SERIAL PRIMARY KEY,
    id_empadre INTEGER NOT NULL REFERENCES empadres(id),
    id_hembra INTEGER NOT NULL REFERENCES animales(id),
    UNIQUE(id_empadre, id_hembra)
);

-- Partos (CUY-08)
CREATE TABLE partos (
    id SERIAL PRIMARY KEY,
    id_hembra INTEGER NOT NULL REFERENCES animales(id),
    id_empadre INTEGER REFERENCES empadres(id),
    fecha_parto DATE NOT NULL,
    tamano_camada_nac INTEGER NOT NULL,
    muertos_nac INTEGER DEFAULT 0,
    peso_m1 DECIMAL(10,2),
    peso_m2 DECIMAL(10,2),
    peso_m3 DECIMAL(10,2),
    peso_h1 DECIMAL(10,2),
    peso_h2 DECIMAL(10,2),
    peso_h3 DECIMAL(10,2),
    peso_promedio_nac DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destetes (CUY-09)
CREATE TABLE destetes (
    id SERIAL PRIMARY KEY,
    id_parto INTEGER NOT NULL REFERENCES partos(id),
    fecha_destete DATE NOT NULL,
    tamano_camada_dest INTEGER NOT NULL,
    muertos_dest INTEGER DEFAULT 0,
    peso_m1_d DECIMAL(10,2),
    peso_m2_d DECIMAL(10,2),
    peso_m3_d DECIMAL(10,2),
    peso_h1_d DECIMAL(10,2),
    peso_h2_d DECIMAL(10,2),
    peso_h3_d DECIMAL(10,2),
    peso_promedio_dest DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pesajes (NUC-21, NUC-22)
CREATE TABLE pesajes (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER NOT NULL REFERENCES animales(id),
    fecha DATE NOT NULL,
    peso DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'individual' CHECK (tipo IN ('individual', 'lote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sanidad (NUC-24)
CREATE TABLE tratamientos (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER REFERENCES animales(id),
    id_jaula INTEGER REFERENCES jaulas(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('preventivo', 'curativo')),
    producto VARCHAR(100) NOT NULL,
    dosis VARCHAR(50),
    via_aplicacion VARCHAR(50),
    diagnostico TEXT,
    responsable VARCHAR(100),
    fecha_inicio DATE NOT NULL,
    duracion_dias INTEGER,
    fecha_fin DATE,
    estado VARCHAR(20) DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'terminado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mortalidad (NUC-26)
CREATE TABLE mortalidad (
    id SERIAL PRIMARY KEY,
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    id_animal INTEGER REFERENCES animales(id),
    fecha DATE NOT NULL,
    clasificacion VARCHAR(50),
    categoria VARCHAR(50),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    causa TEXT,
    id_jaula INTEGER REFERENCES jaulas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ventas (NUC-27)
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    id_animal INTEGER REFERENCES animales(id),
    fecha DATE NOT NULL,
    clasificacion VARCHAR(50),
    categoria VARCHAR(50),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    comprador VARCHAR(100),
    precio DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traslados dentro de la granja (NUC-14)
CREATE TABLE traslados (
    id SERIAL PRIMARY KEY,
    id_animal INTEGER NOT NULL REFERENCES animales(id),
    fecha DATE NOT NULL,
    jaula_origen INTEGER NOT NULL REFERENCES jaulas(id),
    jaula_destino INTEGER NOT NULL REFERENCES jaulas(id),
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transferencias entre granjas (NUC-20)
CREATE TABLE transferencias (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    id_granja_origen INTEGER NOT NULL REFERENCES granjas(id),
    id_granja_destino INTEGER NOT NULL REFERENCES granjas(id),
    motivo TEXT,
    autorizado_por INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Animales en transferencia
CREATE TABLE transferencia_animales (
    id SERIAL PRIMARY KEY,
    id_transferencia INTEGER NOT NULL REFERENCES transferencias(id),
    id_animal INTEGER NOT NULL REFERENCES animales(id),
    UNIQUE(id_transferencia, id_animal)
);

-- Inventario mensual (calculado, no tabla)
-- Se calcula a partir de: nacimientos, mortalidad, ventas, transferencias

-- Alertas (NUC-33)
CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    id_granja INTEGER NOT NULL REFERENCES granjas(id),
    id_animal INTEGER REFERENCES animales(id),
    tipo VARCHAR(50) NOT NULL,
    fecha_prevista DATE NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida', 'descartada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_animales_codigo ON animales(codigo);
CREATE INDEX idx_animales_raza ON animales(id_raza);
CREATE INDEX idx_animales_jaula ON animales(id_jaula);
CREATE INDEX idx_animales_estado ON animales(estado);
CREATE INDEX idx_partos_hembra ON partos(id_hembra);
CREATE INDEX idx_partos_fecha ON partos(fecha_parto);
CREATE INDEX idx_pesajes_animal ON pesajes(id_animal);
CREATE INDEX idx_pesajes_fecha ON pesajes(fecha);
CREATE INDEX idx_mortalidad_granja ON mortalidad(id_granja);
CREATE INDEX idx_ventas_granja ON ventas(id_granja);
CREATE INDEX idx_alertas_estado ON alertas(estado);
