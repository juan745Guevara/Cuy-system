# Plan de Reestructuración del Sistema según el Flujo BPMN (AS-IS CUY)

> **Objetivo:** que el sistema siga el flujo de procesos modelado en Bizagi
> (`readme_bpmn_proceso_cuyes.md`), **sin alterar** la arquitectura entregada
> (Clean Architecture por módulos) ni el stack (NestJS + Next.js + Prisma/PostgreSQL).
>
> Este documento es el mapa maestro: qué existe hoy, qué falta y cómo se cierra la brecha.
> No sustituye al documento de procesos; lo operacionaliza.

---

## 1. Principios de la reestructuración

1. **No se renombra ni se mueve la arquitectura.** Se conservan `domain/`, `application/`,
   `infrastructure/`, `presentation/` por módulo (`platform`, `cuyes`).
2. **No se cambia el stack.** NestJS 12, Next.js 15 App Router, Prisma 6 + PostgreSQL, JWT.
3. **Las rutas existentes se conservan.** El flujo BPMN se expone como **vista nueva** y
   como agrupación lógica, sin romper enlaces (`/empadres`, `/partos`, `/ventas`, …).
4. **El proceso manda sobre la pantalla.** Cada actividad BPMN apunta a un caso de uso/endpoint
   concreto y a una pantalla concreta (o a la brecha que hay que cubrir).
5. **Trazabilidad BPMN.** Todo registro conserva autor y fecha (ya vigente vía `audit_log`).

---

## 2. Arquitectura del flujo BPMN (3 macro-procesos)

```
[Inicio] → ( 1. Crianza y control de cuyes ) → ( 2. Reproducción ) → ( 3. Ventas ) → [Fin]
                    │                                                      ▲
                    └──────────────────────────────────────────────────────┘
                       (derivación directa: cuyes de engorde sin pasar por reproducción)
```

| Fase | Sub-rutinas (BPMN) | Rol(es) |
|------|--------------------|---------|
| **1. Crianza y Control** | A. Nacimiento y registro inicial · B. Lactancia y destete · C. Desarrollo, recría y selección · D. Cierre del ciclo (reporte mensual) | Encargada del criadero · Ingeniera |
| **2. Reproducción** | Reproductoras seleccionadas · Planificar empadres · Revisión de hembras (≥3 meses, 6.º parto) · Empadre · Gestación/parto · Registro individual · Descarte | Ingeniera · Encargada |
| **3. Ventas** | Solicitud del cliente · Pago externo · Comprobante · Verificación de disponibilidad · Registrar venta (serie/número) · Entrega · Actualizar inventario | Cliente · Encargado del área |

---

## 3. Mapeo BPMN ↔ sistema actual (AS-IS técnico)

### Fase 1 · Crianza y control de cuyes

| Actividad BPMN | Backend (endpoint) | Frontend (vista/ruta) | Estado |
|---|---|---|---|
| Nacimiento del cuy / Registro individual | `POST /cuyes/births` | `/partos` | ✅ Cubierto (genera crías) |
| Decisión ¿nació vivo? → mortalidad neonatal | `POST /mortality` | `/mortalidad` | 🟡 Falta marcar `tipo=neonatal` y causa/observaciones |
| Registrar gazapo en jaula de la madre | `POST /cuyes/births` (hereda jaula) | `/partos` | ✅ |
| Sanidad inicial / historial | `POST /treatments` | `/sanidad` | ✅ |
| Transcribir/registrar destete y recría | `POST /cuyes/weanings` | `/destetes` | 🟡 No persiste jaula destino m/h |
| Actualizar aforo de jaulas | `POST /cuyes/movements/relocate` · `GET /recintos/occupancy` | `/movimientos`, `/jaulas` | ✅ |
| Desarrollo, recría y selección | `POST /animals`, `POST /weighings` | `/registro`, `/pesajes` | ✅ |
| Control sanitario / historial | `POST /treatments` | `/sanidad` | ✅ |
| Inventario de jaulas y cuyes / reporte mensual | `GET /cuyes/inventory/*`, `GET /cuyes/reports/*` | `/inventario` | ✅ |
| Marcar no selección → engorde/descarte | `POST /animals` (estado), `POST /cuyes/ranking/:id/mark` | `/ranking`, `/animales` | ✅ |

### Fase 2 · Reproducción

| Actividad BPMN | Backend | Frontend | Estado |
|---|---|---|---|
| Registrar hembra/macho reproductor | `POST /cuyes/breedings/breeding-females` \| `breeding-males` | `/reproductoras`, `/reproductores` | ✅ |
| Revisar reporte mensual / planificar empadres | `GET /cuyes/inventory/monthly-summary` | `/dashboard` | ✅ |
| ¿Hembras ≥ 3 meses? | `POST /cuyes/breedings` | `/empadres` | 🟡 Falta validación de edad mínima |
| ¿Ya tuvo su 6.º parto? | `POST /cuyes/breedings` | `/empadres` | 🟡 Falta regla de 6.º parto |
| Asignar macho / definir jaula / trasladar | `POST /cuyes/breedings`, `/movements/relocate` | `/empadres` | ✅ |
| Registrar traslado (origen/destino/motivo) | `POST /cuyes/movements/relocate` | `/movimientos` | ✅ |
| Transcribir empadre a Excel | `GET /cuyes/reports/*` | `/inventario` | ✅ |
| Esperar gestación / ¿llegó a parto? | `POST /cuyes/births`, `PATCH /cuyes/breedings/:id/females/:fid` (`aborto`) | `/partos`, `/reproductoras` | ✅ |
| Nacidos muertos → registro de mortalidad | `POST /cuyes/births` (muertos) + `POST /mortality` | `/partos`, `/mortalidad` | 🟡 |
| Registro individual / actualizar reproductora | `POST /cuyes/births` (crías), perfil | `/reproductoras` | ✅ |
| Evaluar y descartar (motivo + destino) | `POST /cuyes/ranking/:id/mark`, `PATCH /animals/:id` | `/ranking` | 🟡 Falta `destino_descarte` |

### Fase 3 · Ventas

| Actividad BPMN | Backend | Frontend | Estado |
|---|---|---|---|
| Solicitar compra (cliente) | — | — | 🔴 Sin pantalla propia |
| Verificar disponibilidad | `GET /cuyes/inventory/population` | `/inventario` | ✅ (implícito en `POST /cuyes/sales`) |
| Acordar cantidad y precio | `POST /cuyes/sales` | `/ventas` | ✅ |
| Verificar comprobante de pago | — | — | 🔴 Falta campo comprobante |
| Registrar venta (serie y número) | `POST /cuyes/sales` | `/ventas` | 🔴 Faltan `serie`/`numero` |
| Entregar los cuyes / actualizar inventario | `POST /cuyes/sales` (da de baja) | `/ventas` | ✅ |

Leyenda: ✅ cubierto · 🟡 parcial · 🔴 faltante.

---

## 4. Cambios a implementar

### 4.1 Modelo de datos (Prisma + SQL)

Se añaden columnas idempotentes (migración en caliente al arranque, patrón ya usado por
`audit_log`), además de reflejarlas en `prisma/schema.prisma` y `database/schema.sql`.

| Tabla | Columna nueva | Para qué (BPMN) |
|---|---|---|
| `ventas` | `tipo_comprobante`, `serie`, `numero`, `observaciones`, `estado` | Fase 3: registrar venta con serie/número y estado de entrega |
| `destetes` | `id_jaula_m`, `id_jaula_h`, `peso_promedio` | Fase 1: jaula destino por sexo y peso al destete |
| `mortalidad` | `tipo`, `observaciones` | Fase 1: distinguir mortalidad neonatal y registrar observaciones |
| `animales` | `destino_descarte` | Fase 2: ficha de descarte (destino) |

### 4.2 Backend (casos de uso / endpoints)

- **Ventas:** `SalesService.create` y repositorio aceptan comprobante (`tipo`, `serie`,
  `numero`) y `observaciones`; auditoría enriquecida.
- **Destetes:** `WeaningsRepository` persiste `id_jaula_m`, `id_jaula_h` y `peso_promedio`.
- **Empadres (reglas BPMN):** `BreedingsService.createBreeding` valida **edad ≥ 3 meses** y
  bloquea hembras con **6 o más partos** (deben descartarse).
- **Nuevo endpoint de fase:** `GET /cuyes/procesos/resumen` devuelve un resumen por fase
  (contadores reales) para alimentar la vista de flujo.

### 4.3 Frontend

- **Nueva vista de flujo BPMN** (`/flujo`): renderiza las 3 fases, sus sub-rutinas, pasos y
  campos de datos, con enlaces a las pantallas operativas existentes.
- **Menú:** se **conserva** el menú actual y se **agrega** el acceso «Flujo de procesos».
- **Ventas:** se agregan los campos de comprobante (tipo, serie, número).

---

## 5. Roadmap por incrementos

| # | Incremento | Entrega |
|---|---|---|
| 1 | Documento maestro + modelo de datos BPMN | Plan + columnas |
| 2 | Endpoint `GET /cuyes/procesos/resumen` + reglas de empadre | Backend |
| 3 | Vista `/flujo` + entrada de menú | Frontend |
| 4 | Ventas con comprobante + destetes con jaula destino | Backend + Frontend |
| 5 | Pantallas guiadas por sub-rutina (wizards) siguiendo el BPMN | Futuro |

---

## 6. Fuera de alcance (explícito)

- No se reconfigura la arquitectura ni el stack.
- No se eliminan rutas ni pantallas actuales.
- No se automatiza el pago externo del cliente (sigue siendo externo; el sistema solo
  verifica y registra el comprobante).
