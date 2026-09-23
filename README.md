# Sistema de Control de Animales

Sistema web para la **Facultad de Zootecnia (UNAS)**. Reemplaza el registro en papel y automatiza inventarios, trazabilidad y exportación Excel de las unidades de crianza.

Diseñado como plataforma **multigranja y modular por especie**: un núcleo compartido (acceso, granjas, usuarios) y módulos operativos por animal (hoy **cuyes**; mañana conejos, cerdos, etc.).

## Conceptos clave

| Concepto | Descripción |
|----------|-------------|
| **Especie** | Módulo funcional (cuyes, conejos…). Define catálogos, ciclo reproductivo y reglas propias. |
| **Granja** | Unidad de crianza; pertenece a **una sola especie**. |
| **Jerarquía** | especie → granja → área → jaula → animal |
| **Contexto de sesión** | Tras login: elegir especie → elegir granja → operar |
| **Multitenancy** | Cada request lleva `x-species-id` y `x-farm-id`; el backend valida alcance por rol y granja. |

## Arquitectura

### Backend (`backend/src/`)

```
shared/              Kernel técnico (Prisma, middleware, ServiceResult, contratos)
platform/            Auth, usuarios, granjas, especies, auditoría  →  /api/v1/*
modules/cuyes/       Operaciones del módulo cuyes                  →  /api/v1/cuyes/*
server.js            Composition root
```

Cada feature sigue capas **routes → service → repository**. Los repositorios usan **Prisma ORM**; consultas complejas (reportes, historial) usan SQL raw vía puente Prisma.

### Frontend (`frontend/src/`)

React + React Router. Páginas agrupadas en hubs (granjas, eventos, configuración). Las llamadas al módulo cuyes usan prefijo `/cuyes/`; la plataforma usa rutas directas (`/auth`, `/farms`, `/species`).

### API (resumen)

| Prefijo | Contenido |
|---------|-----------|
| `GET /api/v1/auth`, `/users`, `/farms`, `/species`, `/audit` | Plataforma |
| `GET/POST /api/v1/cuyes/animals`, `/cages`, `/breedings`, … | Módulo cuyes |

Headers requeridos en operaciones de granja: `Authorization`, `x-species-id`, `x-farm-id`.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, axios, React Router |
| Backend | Node.js, Express |
| ORM | Prisma 6 + PostgreSQL |
| Auth | JWT, bcrypt |
| Despliegue | Docker (objetivo) |

## Inicio rápido

### Requisitos

- Node.js 18+
- PostgreSQL
- Copiar variables de entorno: `backend/.env.example` → `backend/.env` (obligatorio `JWT_SECRET`)

### Base de datos

```bash
cd backend
npm install
npm run db:migrate    # crea tablas (schema.sql)
npm run db:seed       # datos iniciales
npm run db:generate   # cliente Prisma
```

### Desarrollo

```bash
# Terminal 1 — API (puerto 3001)
cd backend && npm run dev

# Terminal 2 — UI (puerto 3000)
cd frontend && npm install && npm run dev
```

### Producción

```bash
cd backend && npm start
cd frontend && npm run build && npm start
```

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Superadmin | superadmin@unas.edu.pe | Admin123! |
| Admin | admin@unas.edu.pe | Admin123! |
| Encargado | encargado@unas.edu.pe | Admin123! |

## Estructura del repositorio

```
Cuy-system/
├── backend/
│   ├── prisma/schema.prisma      Esquema ORM
│   └── src/
│       ├── platform/             Núcleo compartido
│       ├── modules/cuyes/        Módulo cuyes
│       └── shared/               DB, middleware, kernel
├── frontend/                     SPA React
└── docs/                         Requisitos, backlog, guías
```

## Scripts útiles (backend)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | API con nodemon |
| `npm run db:migrate` | Migración SQL inicial |
| `npm run db:seed` | Seed de datos |
| `npm run db:generate` | Generar cliente Prisma |
| `npm run db:studio` | Explorar DB con Prisma Studio |

## Documentación

Los requisitos funcionales (65 historias de usuario, backlog por entregas, actores) están en `docs/`:

- [Visión y alcance](docs/vision.md)
- [Actores y permisos](docs/actores.md)
- [Historias de usuario](docs/historias-de-usuario.md)
- [Backlog por entregas](docs/backlog.md)
- [Agregar nuevas especies](docs/modulos-futuros.md)

## Roadmap (alto nivel)

1. **Entrega 1** — Registro digital + Excel oficial (cuyes)
2. **Entrega 2** — Operación diaria (movimientos, pesajes, sanidad, inventario)
3. **Entrega 3** — Alertas avanzadas y ranking reproductivo
4. **Futuro** — Módulos conejos, cerdos y demás especies sobre la misma plataforma
