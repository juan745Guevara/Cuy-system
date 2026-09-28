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
main.ts, app.module.ts   Entrada NestJS (plataforma en TypeScript)
nest/                    Guards, PrismaModule, controllers plataforma
shared/                  Kernel técnico (Prisma JS, middleware, ServiceResult)
platform/                Servicios JS de auth, usuarios, granjas, especies, audit
modules/cuyes/           Dominio y servicios JS (repos + application)
nest/cuyes/              Controllers Nest                              →  /api/v1/cuyes/*
```

Cada feature sigue capas **routes → service → repository**. Los repositorios usan **Prisma ORM**; consultas complejas (reportes, historial) usan SQL raw vía puente Prisma.

### Frontend (`frontend/src/`)

Next.js App Router (`app/`). Vistas en `src/views/`; hubs para granjas, eventos y configuración. API: prefijo `/cuyes/` para operaciones; plataforma sin prefijo (`/auth`, `/farms`, `/species`). Variable `NEXT_PUBLIC_API_URL`.

### API (resumen)

| Prefijo | Contenido |
|---------|-----------|
| `GET /api/v1/auth`, `/users`, `/farms`, `/species`, `/audit` | Plataforma |
| `GET/POST /api/v1/cuyes/animals`, `/cages`, `/breedings`, … | Módulo cuyes |

Headers requeridos en operaciones de granja: `Authorization`, `x-species-id`, `x-farm-id`.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (React 18), axios |
| Backend | NestJS 12 (TypeScript); lógica de dominio aún en JS |
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
# Opcional: frontend/.env con NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Producción

```bash
cd backend && npm run build && npm start
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
│       ├── nest/                 Controllers y guards Nest (plataforma)
│       ├── platform/             Servicios plataforma (JS)
│       ├── modules/cuyes/        Módulo cuyes (Express)
│       └── shared/               DB, middleware, kernel
├── frontend/                     Next.js App Router (React)
└── docs/                         Requisitos, backlog, guías
```

## Scripts útiles (backend)

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar Nest (`dist/`) |
| `npm run dev` | API Nest en watch |
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
