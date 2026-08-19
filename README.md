# Sistema de Control de Animales

**Facultad de Zootecnia — UNAS**

Demo skeleton para aplicar las historias de usuario.

---

## Estructura

```
Cuy-system/
├── backend/                 # Node.js + Express
│   ├── src/
│   │   ├── config/          # Database, migraciones
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── middleware/       # Auth, validaciones
│   │   ├── models/          # Consultas SQL
│   │   ├── routes/          # Endpoints API
│   │   └── utils/           # Helpers
│   ├── package.json
│   └── .env.example
├── frontend/                # React
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── context/         # Estado global (Auth)
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Pantallas
│   │   └── services/        # Axios, API calls
│   └── package.json
├── database/
│   └── schema.sql           # Esquema PostgreSQL
└── docs/                    # Documentación
```

---

## Stack

- **Frontend:** React + React Router + Axios
- **Backend:** Node.js + Express + PostgreSQL
- **Auth:** JWT (pendiente de implementar)

---

## Estado de la Demo

| Archivo | Estado | HU |
|---------|--------|-----|
| `schema.sql` | ✅ Estructura completa | Todas |
| `auth.routes.js` | 🔲 Stub | NUC-01 |
| `usuarios.routes.js` | 🔲 Stub | NUC-06, NUC-07 |
| `granjas.routes.js` | 🔲 Stub | NUC-04 |
| `areas.routes.js` | 🔲 Stub | NUC-16 |
| `jaulas.routes.js` | 🔲 Stub | NUC-13 |
| `animales.routes.js` | 🔲 Stub | NUC-09, NUC-10, NUC-11, NUC-12 |
| `empadres.routes.js` | 🔲 Stub | CUY-07, CUY-13 |
| `partos.routes.js` | 🔲 Stub | CUY-08 |
| `destetes.routes.js` | 🔲 Stub | CUY-09 |
| `pesajes.routes.js` | 🔲 Stub | NUC-21, NUC-22, NUC-23 |
| `mortalidad.routes.js` | 🔲 Stub | NUC-26 |
| `ventas.routes.js` | 🔲 Stub | NUC-27 |
| `movimientos.routes.js` | 🔲 Stub | NUC-14, NUC-20 |
| `inventario.routes.js` | 🔲 Stub | NUC-28, NUC-29, NUC-30, NUC-31 |
| `reportes.routes.js` | 🔲 Stub | NUC-36, CUY-22, CUY-23, CUY-24 |
| `Login.js` | 🔲 Stub | NUC-01 |
| `Dashboard.js` | 🔲 Stub | NUC-03 |
| `Animales.js` | 🔲 Stub | NUC-09, NUC-10, NUC-11, NUC-12 |
| `Partos.js` | 🔲 Stub | CUY-07, CUY-08, CUY-09 |
| `Inventario.js` | 🔲 Stub | NUC-26, NUC-27, NUC-28, NUC-29 |

---

## Para Empezar

### 1. Backend

```bash
cd backend
cp .env.example .env    # Configurar credenciales de PostgreSQL
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

### 3. Base de Datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE cuy_system;"

# Ejecutar el esquema
psql -U postgres -d cuy_system -f database/schema.sql
```

---

## Cómo Usar esta Demo

1. Revisa `docs/historias-de-usuario.md` para ver las 65 HU
2. Empieza por la **Entrega 1** (ver `docs/backlog.md`)
3. Implementa cada HU siguiendo el orden del backlog
4. Cada archivo tiene un comentario `TODO` indicando qué implementar

---

## Documentación

Ver `docs/README.md` para la guía completa.
