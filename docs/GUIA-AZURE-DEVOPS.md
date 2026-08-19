# Guía Práctica de Azure DevOps

**Fecha:** 2026-08-19
**Propósito:** Aprender a usar Azure DevOps desde cero

---

## 1. ¿Qué es Azure DevOps?

Azure DevOps es una plataforma de Microsoft para gestionar todo el ciclo de vida del desarrollo de software:

- **Boards** → Gestionar tareas (como Jira/Trello)
- **Repos** → Almacenar código (como GitHub)
- **Pipelines** → Automatizar deploy (CI/CD)
- **Test Plans** → Probar el software
- **Artifacts** → Gestionar paquetes

**Tu usarás principalmente:** Boards + Repos

---

## 2. Crear tu Primer Proyecto

### Paso 1: Ir a Azure DevOps
1. Ve a [https://dev.azure.com](https://dev.azure.com)
2. Inicia sesión con tu cuenta de Microsoft (Hotmail, Outlook, etc.)
3. Si es tu primera vez, te pedirá crear una **Organización** (ej: `mi-organizacion`)

### Paso 2: Crear el Proyecto
1. Click en **"New Project"** (esquina superior derecha)
2. Completa:
   - **Name:** `Sistema-Gestion-Cuyes`
   - **Description:** Sistema de gestión zootécnica de cuyes - UNAS
   - **Visibility:** Private (privado)
   - **Work Item Process:** Scrum (recomendado) o Agile
3. Click en **"Create"**

---

## 3. Configurar el Backlog (Jerarquía)

### Paso 1: Habilitar jerarquía completa
1. Ve a **Boards** > **Backlogs**
2. Click en el ícono de tuerca (⚙️) junto a "Backlogs"
3. Asegúrate de que estén habilitados:
   - ✅ Epic
   - ✅ Feature
   - ✅ Product Backlog Item (PBI)
   - ✅ Task

### Paso 2: Ver la jerarquía
1. Ve a **Boards** > **Backlogs**
2. En el dropdown superior selecciona **"Epics"**
3. Verás la vista jerárquica

---

## 4. Crear Epics

1. Ve a **Boards** > **Backlogs**
2. Selecciona **"Epics"** en el dropdown
3. Click en **"+"** (esquina superior derecha)
4. Escribe el nombre: `Epic 1: Gestión de Animales`
5. Presiona **Enter**
6. Repite para los demás Epics:
   - `Epic 2: Gestión de Reproducción`
   - `Epic 3: Inventario y Reportes`
   - `Epic 4: Seguridad`

---

## 5. Crear Features (dentro de un Epic)

1. En la vista de Epics, haz click en la flecha **▶** al lado del Epic
2. Se expandirán las Features
3. Click en **"+"** para agregar una Feature
4. Escribe: `F-01: CRUD de Hembras`
5. Presiona **Enter**
6. Repite para las demás Features

---

## 6. Crear PBIs (dentro de una Feature)

1. Expande la Feature haciendo click en la flecha **▶**
2. Click en **"+"** para agregar un PBI
3. Escribe: `PBI-01: Registrar hembra`
4. Presiona **Enter**
5. Repite para los demás PBIs

---

## 7. Crear Tasks (dentro de un PBI)

### Opción 1: Desde el Backlog
1. Expande el PBI haciendo click en la flecha **▶**
2. Click en **"+"** para agregar una Task
3. Escribe: `T-01.1: Crear migración PostgreSQL para tabla hembras`
4. Presiona **Enter**

### Opción 2: Desde la vista detallada
1. Haz doble click en el PBI
2. Se abre una ventana emergente
3. En la sección **"Tasks"** (parte inferior)
4. Click en **"Add Task"**
5. Escribe el nombre y presiona Enter

---

## 8. El Tablero Kanban (Boards)

### Ver el Tablero
1. Ve a **Boards** > **Board**
2. Verás columnas: **To Do** | **Doing** | **Done**

### Mover un elemento
1. Arrastra un PBI o Task de una columna a otra
2. Ejemplo: De "To Do" a "Doing" cuando empieces a trabajar

### Configurar columnas adicionales
1. Click en el ícono de tuerca ⚙️ (esquina superior derecha del tablero)
2. **Columns** > **Add Column**
3. Agrega columnas como:
   - `In Review`
   - `Testing`
   - `Blocked`

---

## 9. Asignar Trabajo

### Asignar un PBI o Task
1. En el tablero o backlog, haz click en el elemento
2. En el campo **"Assigned To"** selecciona tu nombre
3. Guarda

### Ver trabajo asignado a mí
1. En el tablero, click en el filtro **"Assigned To"**
2. Selecciona tu nombre
3. Solo verás tus elementos

---

## 10. Editar Detalles de un PBI/Task

1. Haz doble click en el elemento
2. Se abre una ventana con:
   - **Title:** Título del elemento
   - **Description:** Descripción detallada
   - **Acceptance Criteria:** Criterios de aceptación
   - **Priority:** 1 (Alta), 2 (Media), 3 (Baja)
   - **Story Points:** Estimación de esfuerzo
   - **Tags:** Etiquetas para filtrar
   - **Attachments:** Archivos adjuntos
   - **Links:** Vincular a otros elementos

---

## 11. Vincular código con Work Items

### Desde Git (recomendado)
1. Cuando creas una **Pull Request (PR)**, escribe en el título o descripción:
   ```
   AB#01
   ```
   (AB# seguido del número del PBI)
2. Azure DevOps vincula automáticamente el PR al PBI

### Desde commits
1. En tu commit message, incluye:
   ```
   AB#01 Crear migración para tabla hembras
   ```
2. El commit se vincula al PBI

---

## 12. Repos (Almacenar Código)

### Paso 1: Clonar el repositorio
1. Ve a **Repos** > **Files**
2. Click en **"Clone"**
3. Copia la URL
4. En tu terminal:
   ```bash
   git clone https://tu-organizacion@dev.azure.com/tu-organizacion/Sistema-Gestion-Cuyes/_git/Sistema-Gestion-Cuyes
   ```

### Paso 2: Estructura de carpetas recomendada
```
Sistema-Gestion-Cuyes/
├── frontend/          # React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/  # Axios
│   │   └── context/
│   └── package.json
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── config/
│   └── package.json
├── docs/              # Documentación
└── README.md
```

---

## 13. Pull Requests (PR)

### Crear una PR
1. Ve a **Repos** > **Pull Requests**
2. Click en **"New Pull Request"**
3. Selecciona:
   - **Source branch:** `feature/PBI-01-registrar-hembra`
   - **Target branch:** `main` o `develop`
4. Escribe un título claro: `PBI-01: Registrar hembra reproductora`
5. En la descripción escribe: `AB#01`
6. Click en **"Create"**

### Revisar y Merge
1. Los revisores ven los cambios
2. Si está bien, click en **"Complete"**
3. El PBI se mueve automáticamente a "Done" (si configuraste reglas)

---

## 14. Configurar el Tablero (Personalización)

### Agregar campos personalizados
1. Ve a **Boards** > **Board**
2. Click en ⚙️ > **Card layout**
3. Agrega campos como:
   - Priority
   - Story Points
   - Tags

### Cambiar colores de tarjetas
1. ⚙️ > **Card styles**
2. Define reglas:
   - Si Priority = 1 → Color rojo
   - Si está asignado a mí → Borde azul

---

## 15. Dashboards (Métricas)

### Crear un Dashboard
1. Ve a **Dashboards** > **New Dashboard**
2. Nombre: `Dashboard del Proyecto`
3. Selecciona team: `Sistema-Gestion-Cuyes Team`
4. Click en **"Create"**

### Agregar widgets
1. En el dashboard, click en **"Add Widget"**
2. Widgets útiles:
   - **Sprint Burndown** → Progreso del sprint
   - **Velocity** → Velocidad del equipo
   - **Query Tile** → Resultados de consultas
   - **Git Calculator** → Commits por persona

---

## 16. Sprint Planning

### Crear un Sprint
1. Ve a **Boards** > **Sprints**
2. Click en **"New Sprint"**
3. Nombre: `Sprint 1 - Fundación`
4. Selecciona fechas (2 semanas)
5. Click en **"Create"**

### Asignar PBIs al Sprint
1. En la vista de Sprints, arrastra PBIs desde el backlog
2. O haz click en **"Add existing"** y selecciona los PBIs

### Estimar con Story Points
1. Haz click en un PBI
2. En **"Story Points"** escribe un número (1, 2, 3, 5, 8, 13)
3. Guarda

---

## 17. Reportes Útiles

| Reporte | Dónde | Para qué |
|---------|-------|----------|
| **Sprint Burndown** | Dashboards | Ver progreso del sprint |
| **Velocity** | Dashboards | Velocidad promedio del equipo |
| **Cumulative Flow** | Dashboards | Flujo de trabajo |
| **Query Results** | Boards > Queries | Consultas personalizadas |

---

## 18. Consejos para Empezar

1. **No sobre-complices:** Empieza simple, ajusta después
2. **Usa el tablero a diario:** Mueve tarjetas cuando avances
3. **Vincula todo:** Commits y PRs a los PBIs
4. **Estimá con Story Points:** 1 = fácil, 13 = difícil
5. **Revisa el Dashboard:** Cada lunes para ver progreso

---

## 19. Comandos Rápidos (Atajos)

| Acción | Atajo |
|--------|-------|
| Crear nuevo elemento | `g` luego `n` |
| Buscar | `g` luego `f` |
| Ir al tablero | `g` luego `b` |
| Ir al backlog | `g` luego `k` |

---

## 20. Recursos

- **Documentación oficial:** [https://learn.microsoft.com/en-us/azure/devops/](https://learn.microsoft.com/en-us/azure/devops/)
- **Videos:** Busca "Azure DevOps Tutorial for Beginners" en YouTube
- **Certificación:** AZ-400 (DevOps Engineer Expert)

---

**Fin del Documento.**
