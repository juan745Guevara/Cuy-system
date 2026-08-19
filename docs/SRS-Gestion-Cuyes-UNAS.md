# Sistema de Gestión Zootécnica de Cuyes – Especificación de Requisitos

**Versión:** 2.0 (Actualización Técnica)  
**Fecha:** 2026-08-18  
**Propósito:** Digitalizar los registros físicos (Excel) de la Unidad de Cuyes y Conejos de la Facultad de Zootecnia - UNAS.

---

## 1. INTRODUCCIÓN Y OBJETIVO
El sistema consiste en un software web para el registro y control integral de cuyes reproductores (hembras y machos), crías, empadres, partos, destetes e inventario de mortalidad/ventas. El objetivo es eliminar el uso de Excel, centralizar la información y permitir cálculos automáticos de promedios y poblaciones.

---

## 2. GLOSARIO DE TÉRMINOS (Dominio del Negocio)
Para evitar ambigüedades, definimos los siguientes términos extraídos directamente de los registros:

- **Reproductora (Hembra):** Código `U01` a `U121`. Animal destinado a la reproducción. Registra partos y crías.
- **Reproductor (Macho):** Código `UM01`...`UM05`. Macho utilizado para la cruza con varias hembras.
- **Empadre:** Proceso de cruza programado. Se asigna un Macho a un grupo de Hembras en una fecha específica.
- **Parto:** Evento de nacimiento de una camada.
- **Destete:** Separación de las crías de la madre (usualmente a los 21 días). Se registra el peso final de las crías.
- **Razas:** Perú, Andina, Inti, Tipo 2, Tipo 3, Tipo 4, Línea Criolla Negra, Mantaro.
- **Estados Especiales:** `VACIA` (hembra no preñada), `ABORTO` (pérdida de gestación), `MURIO` (muerte del animal).

---

## 3. ACTORES DEL SISTEMA
| Actor | Rol | Responsabilidad |
| :--- | :--- | :--- |
| **Administrador / Zootecnista** | Usuario principal | Registra todos los datos (partos, pesos, empadres). Gestiona el inventario. |
| **Técnico de Campo** | Usuario con permisos limitados | Solo puede registrar pesos y novedades (muertes) en jaulas específicas. |
| **Visualizador (Invitado)** | Solo lectura | Consulta reportes y dashboards sin modificar datos. |

---

## 4. HISTORIAS DE USUARIO (HU) POR MÓDULOS

### Módulo 1: Gestión de Reproductoras (Hembras)

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-01** | **Registro de Hembra:** Como administrador, quiero registrar una nueva hembra para llevar su historial productivo. | **Campos:** Código (Auto-generado U+ID), Raza (Lista desplegable), Jaula (Texto), Fecha de Nacimiento (Datepicker). <br> **Opcional:** Particularidades (textarea). |
| **HU-02** | **Editar Estado:** Como administrador, quiero actualizar el campo "Particularidades" o "Jaula" para reflejar cambios. | Al seleccionar "MURIO", el sistema debe preguntar: "¿Registrar este evento en la bitácora de Mortalidad?". |
| **HU-03** | **Listar Hembras:** Como usuario, quiero ver un listado paginado de todas las hembras para localizar una rápidamente. | Mostrar: Código, Raza, Jaula, Fecha Nacimiento, Estado (Activa/Muerta/Vendida). Buscador por Código y Raza. |

### Módulo 2: Gestión de Reproductores (Machos)

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-04** | **Registro de Macho:** Como administrador, quiero registrar un macho reproductor para usarlo en futuros empadres. | **Campos:** Código (Auto-generado UM+ID), Raza, Fecha de Nacimiento, Particularidades. |
| **HU-05** | **Pesos del Macho:** Como administrador, quiero registrar el "Peso antes" y "Peso después" del empadre. | Estos pesos se vinculan directamente al **evento de Empadre** (no son campos fijos del macho). |

### Módulo 3: Gestión de Empadres (Cruza)

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-06** | **Crear Empadre:** Como administrador, quiero seleccionar un Macho y varias Hembras para iniciar una cruza. | **Datos:** Fecha de Empadre. <br> **Selección:** Buscador de Macho (UMxx) y Check-list de Hembras disponibles. <br> **Cálculo:** El sistema cuenta automáticamente la "Cantidad de Hembras" asignadas. |
| **HU-07** | **Registrar Preñez:** Como administrador, quiero actualizar la "Cantidad preñadas" dentro del empadre. | El usuario ingresa el número (No puede ser mayor a las hembras asignadas). |

### Módulo 4: Gestión de Partos y Nacimientos (El Corazón)

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-08** | **Registrar Parto:** Como administrador, quiero registrar el parto de una hembra específica. | **Datos:** Fecha Nacimiento, Tamaño Camada Nac., Muertos Nac. <br> **Regla:** Si se escribe "VACIA" o "ABORTO", el sistema omite los campos de peso y lo guarda como evento no exitoso. |
| **HU-09** | **Pesos al Nacimiento (M/H):** Como administrador, quiero ingresar los pesos individuales de las crías al nacer, diferenciando Machos y Hembras. | **Interfaz:** 3 campos para pesos de Machos (M) y 3 para Hembras (H). <br> **Cálculo:** El sistema calcula el **"Peso Promedio Nac."** usando SOLO los campos que tienen valor (ej: promedio de 120, 111 y 106). |

### Módulo 5: Gestión de Destete

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-10** | **Registrar Destete:** Como administrador, quiero registrar el destete de una camada. | **Datos:** Fecha Destete, Tamaño Camada Destete, Muertos Destete. |
| **HU-11** | **Pesos al Destete (M/H):** Como administrador, quiero ingresar los pesos de las crías al destete. | Funciona idéntico a HU-09, pero con los campos de la sección "Peso en gramos al destete". Calcula el **"Peso Promedio Dest."**. |

### Módulo 6: Inventario y Dashboard (Población)

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-12** | **Dashboard de Población:** Como administrador, quiero ver el resumen de la población clasificada por raza. | **Tabla:** Clasificación (Perú, Andina...), Hembras, Machos, Gazapos, Total. <br> **Totales:** Suma al pie (Total Reproductoras Hembras, Machos, Gazapos). |
| **HU-13** | **Registrar Mortalidad/Ventas:** Como administrador, quiero registrar salidas de animales para llevar el flujo. | Seleccionar: Mes/Año, Tipo (Cuy/Conejo), Concepto (Mortalidad, Venta Recria, Descarte). El sistema resta automáticamente del inventario activo. |
| **HU-14** | **Reporte Mensual (2025/2026):** Como administrador, quiero consultar los balances mensuales de Nacimientos, Mortalidad y Ventas. | Filtrar por año. Mostrar columnas: Mes, Nacimientos (Cuyes), Mortalidad, Ventas. Mostrar totales acumulados. |

### Módulo 7: Reportes y Exportación

| ID | Historia de Usuario | Criterios de Aceptación |
| :--- | :--- | :--- |
| **HU-15** | **Ficha Individual (PDF):** Como usuario, quiero exportar a PDF la ficha de una hembra para imprimir el registro. | El PDF debe replicar el formato del Excel: Cabecera + Tabla de Partos con todas las columnas (desde Parto 1 hasta Peso Promedio Dest.). |
| **HU-16** | **Exportar Inventario:** Como administrador, quiero exportar el inventario actual a Excel. | Debe incluir el resumen poblacional y la lista detallada de animales activos. |

---

## 5. REGLAS DE NEGOCIO (Lógica de Cálculo)
Estas reglas son críticas para que el sistema se comporte como el Excel.

1.  **Regla del Promedio (AVERAGE):**
    - Los campos de peso (M y H) son opcionales. El sistema debe calcular el promedio **excluyendo celdas vacías**.
    - *Ejemplo:* Si ingresa M1=120, M2=111, H1=106. El promedio es `(120+111+106)/3 = 112.33`. Si solo tiene 1 valor, ese valor es el promedio.
2.  **Regla de Fechas:**
    - Si el usuario escribe "VACIA", "Aborto" o "cria muert" en el campo "Fecha Nacimiento", el sistema **NO** debe pedir pesos y debe marcar ese parto como "No Exitoso".
3.  **Regla de Inventario:**
    - Al registrar un **Nacimiento** exitoso: Los gazapos vivos se suman automáticamente al inventario (clasificados por raza y sexo).
    - Al registrar una **Muerte** (en hembras, machos o gazapos): Se resta automáticamente del inventario.
4.  **Regla de Empadre:**
    - Una hembra no puede estar asignada a dos empadres activos al mismo tiempo.

---

## 6. MODELO DE DATOS (Entidades Principales)
*Estructura base para la base de datos (DER).*

**1. Hembras (reproductoras)**
- id (PK), codigo (U01), raza, jaula, fecha_nacimiento, particularidades, estado (Activa/Muerta/Vendida).

**2. Machos (reproductores)**
- id (PK), codigo (UM01), raza, fecha_nacimiento, particularidades.

**3. Empadres**
- id (PK), id_macho (FK), fecha_empadre, cantidad_hembras, cantidad_preñadas, peso_antes (kg), peso_despues (kg).
- *Relación:* `empadre_hembras` (Tabla pivote: id_empadre, id_hembra).

**4. Partos**
- id (PK), id_hembra (FK), id_empadre (FK - opcional), fecha_parto (o texto "VACIA"), tamano_camada_nac, muertos_nac.
- *Pesos Nac:* peso_m1, peso_m2, peso_m3, peso_h1, peso_h2, peso_h3, peso_promedio_nac (calculado).

**5. Destetes**
- id (PK), id_parto (FK), fecha_destete, tamano_camada_dest, muertos_dest.
- *Pesos Dest:* peso_m1_d, peso_m2_d, peso_m3_d, peso_h1_d, peso_h2_d, peso_h3_d, peso_promedio_dest (calculado).

**6. Movimientos (Inventario)**
- id (PK), fecha, tipo (Nacimiento/Mortalidad/Venta), categoria (Raza), sexo (M/H/Gazapo), cantidad.

---

## 7. REQUISITOS NO FUNCIONALES (RNF)
- **RNF-01 (Tecnología):** Debe ser una aplicación web responsiva (funciona en tablet para tomar datos en campo).
- **RNF-02 (Rendimiento):** Los listados con más de 500 registros deben cargar en menos de 2 segundos.
- **RNF-03 (Seguridad):** Sistema de autenticación (Login). Roles: Admin (escritura total) y Viewer (solo lectura).
- **RNF-04 (Usabilidad):** Los campos de fecha deben tener calendario emergente (Datepicker). Los campos de peso deben aceptar decimales (ej: 120.5).
- **RNF-05 (Integridad):** No se puede eliminar una hembra si tiene partos registrados (solo se permite cambiar su estado a "Inactiva/Muerta").

---

## 8. PRIORIZACIÓN (MoSCoW) - ¿Por dónde empezamos?

- **MUST HAVE (Obligatorio - MVP):**
  - HU-01, HU-03, HU-04 (CRUD de animales).
  - HU-08, HU-09 (Registro de Partos y Pesos - ES EL CORE).
  - HU-12 (Dashboard visual de población).
  - HU-14 (Reporte mensual básico).

- **SHOULD HAVE (Importante pero secundario):**
  - HU-06, HU-07 (Gestión de Empadres).
  - HU-10, HU-11 (Gestión de Destete).
  - HU-13 (Registro de mortalidad/ventas).

- **COULD HAVE (Opcional / Mejora futura):**
  - HU-15, HU-16 (Exportación a PDF/Excel).
  - Gráficos estadísticos de productividad (promedio de crías por parto).

---

## 9. GLOSARIO DE CAMPOS TÉCNICOS (Mapeo Excel - Software)
Para que el desarrollador sepa exactamente a qué columna del Excel corresponde cada campo del código:

| Nombre en Excel | Nombre en Software | Tipo de Dato |
| :--- | :--- | :--- |
| Código Reproductora | `codigo_hembra` | String (U01) |
| Fecha de Nacimiento (Hembra) | `fecha_nacimiento` | Date |
| Parto (1,2,3...) | `numero_parto` | Integer (Auto) |
| Fecha Nacimiento (Crías) | `fecha_parto` | Date / Texto ("VACIA") |
| Tamaño Camada Nacimiento | `tamano_camada_nac` | Integer |
| Muertos al Nacimiento | `muertos_nac` | Integer |
| Peso al nacimiento por cría (M1...H3) | `peso_m1`, `peso_h1`... | Decimal (gramos) |
| Peso Promedio Nac. | `peso_promedio_nac` | **Calculado** |
| Fecha Destete | `fecha_destete` | Date |
| Peso en gramos al destete (M1...H3) | `peso_dest_m1`... | Decimal (gramos) |
| Peso Promedio Dest. | `peso_promedio_dest` | **Calculado** |
| Código Macho Empadre | `codigo_macho` (UM01) | String |
| Fecha Empadre | `fecha_empadre` | Date |
| Peso antes del empadre | `peso_antes_emp` | Decimal (kg) |
| Peso despues del empadre | `peso_despues_emp` | Decimal (kg) |

---

## 10. ARQUITECTURA TÉCNICA (React + Node.js + PostgreSQL)

### 10.1. Backend (Node.js + Express)
- **Estructura de API (RESTful):** 
  - `GET /api/v1/hembras` → Listar (HU-03)
  - `POST /api/v1/hembras` → Crear (HU-01)
  - `PUT /api/v1/hembras/:id` → Editar (HU-02)
  - `POST /api/v1/partos` → Registrar Parto con sus pesos (HU-08, HU-09)
  - `GET /api/v1/reportes/mensual?year=2025` → Datos para HU-14
- **Lógica de Negocio:** Los promedios (Regla 1) deben calcularse en el backend antes de guardar en PostgreSQL para asegurar que el dato sea consistente.
- **Autenticación:** JWT (JSON Web Tokens) para manejar los roles (Admin/Técnico/Visualizador).

### 10.2. Frontend (React)
- **Estado Global:** Recomiendo **React Context API** o **Redux Toolkit** para manejar la sesión del usuario y el listado de animales (evita recargar la página al editar).
- **Componentes Clave:**
  - `TableComponent` (Reutilizable para listar hembras y machos).
  - `FormParto` (Componente complejo que maneja los campos dinámicos de pesos M/H).
  - `Dashboard` (Tarjetas y gráficos simples con la población actual).
- **Conexión:** Usar **Axios** para interceptar las peticiones y añadir el token de autenticación.

### 10.3. Base de Datos (PostgreSQL)
- **Indexación:** Crear índices en `codigo` (U01, UM01) y `raza` para que las búsquedas (HU-03) sean ultrarrápidas.
- **Triggers (Opcional pero recomendado):** Podrías usar un Trigger en la tabla `partos` para que, al insertar un parto exitoso, se inserte automáticamente un registro en `movimientos` (Inventario) sumando los gazapos vivos. Esto asegura la integridad de datos (Regla 3).

---

## 11. IMPLEMENTACIÓN EN AZURE DEVOPS (GUÍA PRÁCTICA)

Azure DevOps organiza el trabajo en jerarquías. Si vienes de Jira, esta es la equivalencia:
- **Epic** = Épica (Proyecto grande) → *Ej: Sistema de Cuyes.*
- **Feature** = Módulo funcional → *Ej: Gestión de Hembras.*
- **PBI (Product Backlog Item) / User Story** = Historia de Usuario (HU) → *Ej: HU-01.*
- **Task** = Tarea técnica (código) → *Ej: Crear tabla PostgreSQL para Hembras.*

### 11.1. Configuración Inicial en Azure DevOps
1. Crear un nuevo proyecto llamado `Sistema-Gestion-Cuyes` (visibilidad privada).
2. Ir a **Boards** > **Backlogs**. Verás la jerarquía.
3. Crear los siguientes **Epics** (Nivel 1):
   - **Epic 1:** Gestión de Animales (Hembras y Machos).
   - **Epic 2:** Gestión de Reproducción (Empadres, Partos, Destetes).
   - **Epic 3:** Inventario y Reportes (Dashboards, Mortalidad, Ventas).
4. Crear **Features** dentro de los Epics:
   - En Epic 1: Feature "CRUD Hembras", Feature "CRUD Machos".
   - En Epic 2: Feature "Registro de Partos", Feature "Registro de Destetes".

### 11.2. Creación de PBIs (User Stories) y Tareas
Toma las HU de la Sección 4 y conviértelas en **PBIs**. Luego, divídelas en **Tasks** técnicas.

*Ejemplo práctico para **HU-01 (Registro de Hembra)**:*
- **PBI:** Registrar nueva hembra reproductora.
- **Tasks asociadas:**
  1. *(Backend)* Crear modelo y migración en PostgreSQL para tabla `Hembras`.
  2. *(Backend)* Crear endpoint POST `/api/hembras` con validaciones (Joi/Zod).
  3. *(Frontend)* Crear componente de formulario en React con Datepicker y Select de Razas.
  4. *(Frontend)* Conectar formulario al endpoint usando Axios y manejar mensajes de éxito/error.

### 11.3. Planificación de Sprints (Iteraciones)
Te sugiero 4 Sprints de **2 semanas** cada uno. Así aprendes a manejar el tablero de Azure DevOps.

| Sprint | Objetivo | PBIs a incluir | Entregable Principal |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | *Fundación y Animales* | HU-01, HU-03, HU-04, RNF-03 (Login) | Login funcional + CRUD de Hembras y Machos listos. |
| **Sprint 2** | *El Corazón del Negocio* | HU-08, HU-09, HU-10, HU-11 | Registro completo de Partos y Destetes con cálculo automático de promedios. |
| **Sprint 3** | *Cruzas e Inventario* | HU-06, HU-07, HU-12, HU-13 | Gestión de Empadres y Dashboard de Población en tiempo real. |
| **Sprint 4** | *Cierre y Reportes* | HU-14, HU-15, HU-16 | Reporte mensual y generación de PDFs/Excels. Mejoras de UI/UX. |

### 11.4. Gestión del Código (Repos)
- Ve a **Repos** en Azure DevOps.
- Crea dos repositorios (o uno mono-repo con carpetas `/frontend` y `/backend`).
- Conecta tus PBIs a las **Pull Requests (PR)**. Cuando termines una tarea, crea una PR vinculada al PBI. Al hacer merge, la tarea se moverá automáticamente a "Done" si configuras las reglas de rama.

### 11.5. Consejos para aprender Azure DevOps
1. **Usa el Tablero (Boards) a diario:** Mueve las tareas de *To Do* → *Doing* → *Done* para visualizar el flujo (Kanban).
2. **Wiki integrada:** Utiliza la sección "Wiki" del proyecto para pegar este mismo archivo `.md`. Así todo el equipo tiene acceso a la documentación sin buscar archivos locales.
3. **Pipelines (Opcional):** Cuando tengas el código listo, Azure Pipelines te permite desplegar automáticamente en la nube. ¡Pero eso lo aprendemos en la siguiente fase!

---

**Fin del Documento.**