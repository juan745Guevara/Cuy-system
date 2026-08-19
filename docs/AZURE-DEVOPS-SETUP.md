# Azure DevOps - Configuración del Proyecto Sistema-Gestion-Cuyes

**Fecha:** 2026-08-19
**Propósito:** Guía de referencia para la organización del trabajo en Azure DevOps

---

## 1. Estructura del Proyecto

```
📦 Sistema-Gestion-Cuyes (Proyecto)
│
├── 🎯 Epic 1: Gestión de Animales
│   ├── 📋 Feature F-01: CRUD de Hembras
│   │   ├── PBI-01: Registrar hembra
│   │   ├── PBI-02: Editar hembra
│   │   └── PBI-03: Listar hembras
│   └── 📋 Feature F-02: CRUD de Machos
│       ├── PBI-04: Registrar macho
│       └── PBI-05: Pesos de macho
│
├── 🎯 Epic 2: Gestión de Reproducción
│   ├── 📋 Feature F-03: Empadres
│   │   ├── PBI-06: Crear empadre
│   │   └── PBI-07: Registrar preñez
│   ├── 📋 Feature F-04: Partos
│   │   ├── PBI-08: Registrar parto
│   │   └── PBI-09: Pesos al nacimiento
│   └── 📋 Feature F-05: Destete
│       ├── PBI-10: Registrar destete
│       └── PBI-11: Pesos al destete
│
├── 🎯 Epic 3: Inventario y Reportes
│   ├── 📋 Feature F-06: Dashboard
│   │   └── PBI-12: Población por raza
│   ├── 📋 Feature F-07: Mortalidad/Ventas
│   │   └── PBI-13: Registrar movimientos
│   ├── 📋 Feature F-08: Reportes
│   │   └── PBI-14: Reporte mensual
│   └── 📋 Feature F-09: Exportación
│       ├── PBI-15: PDF ficha individual
│       └── PBI-16: Excel inventario
│
└── 🎯 Epic 4: Seguridad
    └── 📋 Feature F-10: Autenticación
        ├── PBI-17: Login/Logout
        ├── PBI-18: Roles (Admin/Técnico/Visualizador)
        └── PBI-19: Control de acceso por rol
```

---

## 2. Equivalencia con Jira

| Jira | Azure DevOps | Descripción |
|------|--------------|-------------|
| Project | **Project** | Contenedor principal |
| Epic | **Epic** | Funcionalidad grande (módulo) |
| Story / Task | **PBI** | Historia de Usuario |
| Sub-task | **Task** | Tarea técnica de implementación |
| Sprint | **Iteration** | Ciclo de trabajo (2 semanas) |
| Board | **Boards > Backlogs** | Vista de backlog |
| Kanban | **Board** | Tablero visual de estado |
| Backlog | **Backlog** | Lista priorizada de trabajo |
| Reports | **Dashboards** | Métricas y gráficos |

---

## 3. Flujo de Trabajo

### 3.1. Estados de un PBI

```
To Do → Doing → Done
```

### 3.2. Estados de una Task

```
To Do → In Progress → Code Review → Done
```

### 3.3. Flujo de una User Story

1. **Crear PBI** en el Backlog
2. **Desglosar en Tasks** (una o más por PBI)
3. **Asignar Tasks** a miembros del equipo
4. **Mover en el Tablero** según avance
5. **Crear PR** cuando la tarea está lista
6. **Merge** → PBI se mueve a "Done"

---

## 4. Desglose de PBIs en Tasks

### PBI-01: Registrar Hembra

| Task | Tipo | Descripción |
|------|------|-------------|
| T-01.1 | Backend | Crear migración PostgreSQL para tabla `hembras` |
| T-01.2 | Backend | Crear modelo y esquema de validación (Zod) |
| T-01.3 | Backend | Crear endpoint `POST /api/v1/hembras` |
| T-01.4 | Frontend | Crear componente `FormHembra` |
| T-01.5 | Frontend | Conectar formulario al endpoint con Axios |

### PBI-02: Editar Hembra

| Task | Tipo | Descripción |
|------|------|-------------|
| T-02.1 | Backend | Crear endpoint `PUT /api/v1/hembras/:id` |
| T-02.2 | Frontend | Crear componente `EditHembra` |
| T-02.3 | Frontend | Implementar lógica de cambio de estado (MURIO → confirmación mortalidad) |

### PBI-03: Listar Hembras

| Task | Tipo | Descripción |
|------|------|-------------|
| T-03.1 | Backend | Crear endpoint `GET /api/v1/hembras` con paginación |
| T-03.2 | Backend | Implementar filtros por código y raza |
| T-03.3 | Frontend | Crear componente `TablaHembras` con paginación |
| T-03.4 | Frontend | Agregar barra de búsqueda |

### PBI-04: Registrar Macho

| Task | Tipo | Descripción |
|------|------|-------------|
| T-04.1 | Backend | Crear migración PostgreSQL para tabla `machos` |
| T-04.2 | Backend | Crear endpoint `POST /api/v1/machos` |
| T-04.3 | Frontend | Crear componente `FormMacho` |

### PBI-05: Pesos de Macho

| Task | Tipo | Descripción |
|------|------|-------------|
| T-05.1 | Backend | Crear endpoints para pesos vinculados a empadres |
| T-05.2 | Frontend | Crear interfaz de registro de pesos |

### PBI-06: Crear Empadre

| Task | Tipo | Descripción |
|------|------|-------------|
| T-06.1 | Backend | Crear migración PostgreSQL para tabla `empadres` y `empadre_hembras` |
| T-06.2 | Backend | Crear endpoint `POST /api/v1/empadres` |
| T-06.3 | Frontend | Crear componente `FormEmpadre` con selección múltiple de hembras |

### PBI-07: Registrar Preñez

| Task | Tipo | Descripción |
|------|------|-------------|
| T-07.1 | Backend | Crear endpoint `PUT /api/v1/empadres/:id/preñez` |
| T-07.2 | Frontend | Agregar campo de cantidad preñadas al formulario |

### PBI-08: Registrar Parto

| Task | Tipo | Descripción |
|------|------|-------------|
| T-08.1 | Backend | Crear migración PostgreSQL para tabla `partos` |
| T-08.2 | Backend | Crear endpoint `POST /api/v1/partos` |
| T-08.3 | Backend | Implementar lógica: si fecha = "VACIA"/"ABORTO" → omitir pesos |
| T-08.4 | Frontend | Crear componente `FormParto` |

### PBI-09: Pesos al Nacimiento

| Task | Tipo | Descripción |
|------|------|-------------|
| T-09.1 | Backend | Implementar cálculo de promedio (excluir vacíos) |
| T-09.2 | Frontend | Crear interfaz de 6 campos de peso (M1-M3, H1-H3) |

### PBI-10: Registrar Destete

| Task | Tipo | Descripción |
|------|------|-------------|
| T-10.1 | Backend | Crear migración PostgreSQL para tabla `destetes` |
| T-10.2 | Backend | Crear endpoint `POST /api/v1/destetes` |
| T-10.3 | Frontend | Crear componente `FormDestete` |

### PBI-11: Pesos al Destete

| Task | Tipo | Descripción |
|------|------|-------------|
| T-11.1 | Backend | Implementar cálculo de promedio al destete |
| T-11.2 | Frontend | Crear interfaz de 6 campos de peso al destete |

### PBI-12: Población por Raza

| Task | Tipo | Descripción |
|------|------|-------------|
| T-12.1 | Backend | Crear endpoint `GET /api/v1/dashboard/poblacion` |
| T-12.2 | Frontend | Crear componente `DashboardPoblacion` con tabla resumen |

### PBI-13: Registrar Movimientos

| Task | Tipo | Descripción |
|------|------|-------------|
| T-13.1 | Backend | Crear migración PostgreSQL para tabla `movimientos` |
| T-13.2 | Backend | Crear endpoint `POST /api/v1/movimientos` |
| T-13.3 | Backend | Implementar lógica de resta automática del inventario |
| T-13.4 | Frontend | Crear componente `FormMovimiento` |

### PBI-14: Reporte Mensual

| Task | Tipo | Descripción |
|------|------|-------------|
| T-14.1 | Backend | Crear endpoint `GET /api/v1/reportes/mensual` |
| T-14.2 | Frontend | Crear componente `ReporteMensual` con filtros por año |

### PBI-15: PDF Ficha Individual

| Task | Tipo | Descripción |
|------|------|-------------|
| T-15.1 | Backend | Instalar librería PDF (pdfkit o similar) |
| T-15.2 | Backend | Crear endpoint `GET /api/v1/hembras/:id/pdf` |
| T-15.3 | Frontend | Agregar botón de exportación PDF |

### PBI-16: Excel Inventario

| Task | Tipo | Descripción |
|------|------|-------------|
| T-16.1 | Backend | Instalar librería Excel (exceljs) |
| T-16.2 | Backend | Crear endpoint `GET /api/v1/inventario/excel` |
| T-16.3 | Frontend | Agregar botón de exportación Excel |

### PBI-17: Login/Logout

| Task | Tipo | Descripción |
|------|------|-------------|
| T-17.1 | Backend | Crear migración PostgreSQL para tabla `usuarios` |
| T-17.2 | Backend | Crear endpoints `POST /api/v1/auth/login` y `/logout` |
| T-17.3 | Backend | Implementar JWT (generación y validación) |
| T-17.4 | Frontend | Crear componente `LoginForm` |
| T-17.5 | Frontend | Implementar contexto de autenticación |

### PBI-18: Roles

| Task | Tipo | Descripción |
|------|------|-------------|
| T-18.1 | Backend | Crear migración con campo `rol` en tabla `usuarios` |
| T-18.2 | Backend | Crear middleware de autorización por rol |

### PBI-19: Control de Acceso

| Task | Tipo | Descripción |
|------|------|-------------|
| T-19.1 | Backend | Aplicar middleware de roles a cada endpoint |
| T-19.2 | Frontend | Ocultar/mostrar elementos según rol del usuario |

---

## 5. Planificación de Sprints

| Sprint | Objetivo | PBIs | Entregable |
|--------|----------|------|------------|
| **Sprint 1** | Fundación y Animales | PBI-01, PBI-02, PBI-03, PBI-04, PBI-05, PBI-17, PBI-18, PBI-19 | Login + CRUD Hembras y Machos |
| **Sprint 2** | El Corazón del Negocio | PBI-08, PBI-09, PBI-10, PBI-11 | Partos y Destetes con promedios |
| **Sprint 3** | Cruzas e Inventario | PBI-06, PBI-07, PBI-12, PBI-13 | Empadres + Dashboard |
| **Sprint 4** | Cierre y Reportes | PBI-14, PBI-15, PBI-16 | Reportes y Exportación |

---

## 6. Comandos Útiles en Azure DevOps

| Acción | Cómo |
|--------|------|
| Crear PBI | Boards > Backlogs > "+" |
| Ver tablero Kanban | Boards > Board |
| Filtrar por persona | Click en avatar del tablero |
| Agregar columna al tablero | Board > Configure (tuerca) > Columns |
| Vincular PR a PBI | Al crear PR, escribir "AB#123" (ID del PBI) |
| Ver gráficos | Dashboards > New Dashboard |
| Crear Wiki | Reutilizar archivos .md del repositorio |

---

## 7. Convenciones de Nomenclatura

| Elemento | Formato | Ejemplo |
|----------|---------|---------|
| Epic | Epic + número + nombre | Epic 1: Gestión de Animales |
| Feature | F-XX + nombre | F-01: CRUD de Hembras |
| PBI | PBI-XX + descripción | PBI-01: Registrar hembra |
| Task | T-XX.X + descripción | T-01.1: Crear migración PostgreSQL |
| Rama feature | feature/PBI-XX-nombre-corto | feature/PBI-01-registrar-hembra |
| PR | AB#XX | AB#01 |

---

**Fin del Documento.**
