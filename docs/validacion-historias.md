# Validación de historias de usuario contra la implementación

**Facultad de Zootecnia — UNAS** · Revisión estática del código (backend Express en `backend/src/`, frontend React en `frontend/src/`).

Fecha: 15/09/2026 · Documento fuente: [historias-de-usuario.md](historias-de-usuario.md)

## Resultado general

**49 de 65 historias cumplen sus criterios de aceptación (`✅`)** · **16 son parciales (`⚠️`)** · **0 sin implementar (`❌`)**.

Todas las historias tienen al menos una implementación básica (ruta API + pantalla). Las parciales incumplen uno o más criterios de aceptación.

| Parte | Total | ✅ | ⚠️ | ❌ |
|---|---|---|---|---|
| Núcleo (NUC-01 a NUC-41) | 41 | 34 | 7 | 0 |
| Módulo cuyes (CUY-01 a CUY-24) | 24 | 15 | 9 | 0 |
| **Total** | **65** | **49** | **16** | **0** |

---

## Parte 1 — Núcleo (41)

### Épica N1 — Acceso y contexto de trabajo (NUC-01 a NUC-08)

| Hist | Estado | Sustento en el código | Notas |
|---|---|---|---|
| NUC-01 | ✅ | `auth.routes.js` login/logout, JWT 8 h, idle 30 min en `AuthContext.js` | Credenciales incorrectas con mensaje genérico; alcance de granjas por usuario. |
| NUC-02 | ✅ | `SeleccionGranja.js` (especie → granja), `Layout.js` "Cambiar granja", auto-selección con 1 granja | Todo registro asocia la granja activa vía header `x-granja-id`. |
| NUC-03 | ✅ | `Dashboard.js` (población, categorías, ocupación por área, movimientos del mes, alertas, accesos) | Números salen de los mismos endpoints del inventario. |
| NUC-04 | ✅ | `granjas.routes.js` POST + desactivar (solo superadmin); `requireFarmAccess` bloquea escritura en granja desactivada | Especie inmutable por diseño (no hay endpoint que la cambie). |
| NUC-05 | ✅ | `PUT /granjas/:id/usuarios` y `PATCH /usuarios/:id` | Quitar acceso no borra registros (join `usuario_granjas`). |
| NUC-06 | ✅ | `usuarios.routes.js` POST (rol admin solo superadmin), PATCH | Edita alcance y desactiva. |
| NUC-07 | ✅ | `usuarios.routes.js` (admin crea encargado/supervisor/auxiliar) | No puede crear admin ni superadmin. |
| NUC-08 | ✅ | Validación de subconjunto de granjas + `audit_log 'escalada_bloqueada'`; front limita roles | Un admin no puede ampliarse su propio alcance (403). |

### Épica N2 — Ficha de animal (NUC-09 a NUC-12)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-09 | ✅ | `animales.routes.js` POST | Código/sexo obligatorios; raza de catálogo; jaula obligatoria; especie de la granja. |
| NUC-10 | ✅ | `PATCH /animales/:id` + ficha con historial | Baja con fecha/motivo; particularidades se agregan sin sobrescribir. |
| NUC-11 | ✅ | `GET /animales/buscar/:codigo` | Normaliza código; historial completo (eventos unificados); sugiere registrar. |
| NUC-12 | ✅ | `GET /animales` con filtros combinados + orden + export | `Animales.js`: cascada área → jaula, cuenta resultados. |

### Épica N3 — Áreas, jaulas y movimientos (NUC-13 a NUC-20)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-13 | ✅ | `jaulas.routes.js` | Nombre único normalizado (`UPPER(REPLACE)`), área obligatoria, desactivación soft. |
| NUC-14 | ✅ | `POST /movimientos/traslado` | Multi-animal, jaula completa, validación fecha ≥ nacimiento, motivo opcional. |
| NUC-15 | ✅ | `GET /movimientos/animal/:id`, `/jaula/:id?fecha` | Recorrido con transferencias; ocupación por fecha. |
| NUC-16 | ✅ | `areas.routes.js` | Propósito de lista; desactivar exige reubicar jaulas; jaula sin área no existe. |
| NUC-17 | ✅ | `GET /areas/resumen` + `Areas.js` | Distingue jaulas vacías/ocupadas. |
| NUC-18 | ✅ | `GET /jaulas/ocupacion`, `/movimientos/sobrecupo` + confirmación 409 no bloqueante |   |
| NUC-19 | ✅ | `movimientos.routes.js` (aviso `area` con motivo obligatorio), `/movimientos/fuera-de-area` | Reglas en `utils/propositoArea.js`. |
| NUC-20 | ✅ | `POST /movimientos/transferencia` (misma especie, colisión de código, `canTransfer`) | Autorización supervisor/admin en backend; motivo obligatorio. |

### Épica N4 — Pesaje (NUC-21 a NUC-23)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-21 | ✅ | `pesajes.routes.js` POST | Rechazo duro fuera de rango de especie (20–3000 g); no fecha futura. |
| NUC-22 | ✅ | `POST /pesajes/lote` | Omite animales sin peso, informa cuántos registró. |
| NUC-23 | ✅ | `GET /pesajes/animal/:id` (ganancia), `/pesajes/promedio` + gráfico en `Pesajes.js` |   |

### Épica N5 — Sanidad (NUC-24 a NUC-25)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-24 | ✅ | `tratamientos.routes.js` POST | Fecha de término calculada; alcance animal/jaula/área/grupo. |
| NUC-25 | ✅ | `GET /tratamientos`, `/en-curso`, `PATCH /:id/terminar` + tratamientos en ficha |   |

### Épica N6 — Mortalidad y ventas (NUC-26 a NUC-27)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-26 | ✅ | `mortalidad.routes.js` POST | Identificado (da de baja) o por cantidad (tope de población por categoría); jaula opcional. |
| NUC-27 | ✅ | `ventas.routes.js` POST | Comprador/precio opcionales; tope de población; transferencias por separado. |

### Épica N7 — Inventario y población (NUC-28 a NUC-32)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-28 | ✅ | `GET /inventario/poblacion` | Por raza/categoría/sexo, población a una fecha, detalle. |
| NUC-29 | ⚠️ | `GET /inventario/resumen-mensual` | `continuidad_ok: true` está **hardcodeado** (`inventario.routes.js:173`); no valida que población final = inicial del mes siguiente. |
| NUC-30 | ✅ | `GET /inventario/consolidado` | Solo especies con granjas asignadas; evita duplicados de transferencias. |
| NUC-31 | ✅ | `GET /inventario/por-area`, `/por-categoria-area` | Suma por área = población total. |
| NUC-32 | ✅ | `GET /inventario/consolidado` (por granja + totales por especie + total institucional) | Alcance respetado. |

### Épica N8 — Alertas (NUC-33 a NUC-35)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-33 | ⚠️ | `alertas.routes.js` GET | Solo se calculan `parto_proximo` y `destete_pendiente`. `empadre_disponible` y `sin_prenez` están en la config pero **no se generan**. |
| NUC-34 | ✅ | `POST /alertas/descartar` + cierre automático al registrar |   |
| NUC-35 | ✅ | `GET/PUT /alertas/config` | Por granja; desactivable; afecta solo alertas futuras. |

### Épica N9 — Reportes y exportación (NUC-36 a NUC-37)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-36 | ⚠️ | `reportes.routes.js` (ExcelJS, encabezado oficial, aviso sin datos) | El **consolidado multi-granja solo existe como JSON** (`/inventario/consolidado`), no como Excel. |
| NUC-37 | ⚠️ | `GET /reportes/animales` | Solo permite filtrar por `id_area`; no exporta el resultado de una lista filtrada combinada de NUC-12 (sexo/raza/categoría/jaula/q). |

### Épica N10 — Confiabilidad de los datos (NUC-38 a NUC-41)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| NUC-38 | ⚠️ | `utils/draftForm.js` (sessionStorage) | Borrador **solo en Animales, Partos y Destetes**; faltan Movimientos, Empadres, Sanidad, Pesaje por lote. |
| NUC-39 | ⚠️ | Validaciones puntuales en varios endpoints | Fecha futura validada solo en empadres, movimientos y pesajes; `isValidDateStr` no se aplica a partos, mortalidad, ventas ni tratamientos. |
| NUC-40 | ✅ | `normalizeCodigo` + `UNIQUE(id_granja, codigo_norm)` + reuso con confirmación | Mensaje de duplicado muestra el animal. |
| NUC-41 | ⚠️ | `utils/audit.js` (`writeAudit`), `auditoria.routes.js` (anular) | `audit_log` solo recibe login, logout, `escalada_bloqueada` y anulaciones de mortalidad/venta. El resto del CRUD guarda `created_by` pero **sin historial antes/después** por registro. |

---

## Parte 2 — Módulo Cuyes (24)

### Épica C1 — Configuración del módulo (CUY-01 a CUY-05)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-01 | ✅ | Seed con las 8 razas + `catalogos.routes.js` (agregar/desactivar) | Desactivada no aparece en nuevos, sí en históricos. |
| CUY-02 | ⚠️ | `categorias` con `proposito_area`; destete pasa gazapo→recría | La **propuesta de cambio por edad** y el ajuste por plazos configurables (CUY-17) no están implementados. |
| CUY-03 | ✅ | Terminología "Jaula"; `jaulas.routes.js` con normalización |   |
| CUY-04 | ✅ | `utils/propositoArea.js` (8 propósitos + "otro") | Alias legacy normalizados. |
| CUY-05 | ✅ | `utils/propositoArea.js` + aviso de NUC-19 + `/movimientos/fuera-de-area` | Empadre admite macho sin aviso. |

### Épica C2 — Reproductoras (CUY-06 a CUY-11)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-06 | ⚠️ | `POST /empadres/reproductoras` | No fuerza categoría reproductora en el backend; el front la preselecciona ("reproductora" en el nombre). |
| CUY-07 | ✅ | `POST /empadres` | Macho de reproductores activos; fecha no futura ni anterior al último parto; abre ciclo y alerta. |
| CUY-08 | ✅ | `POST /partos` | Muertos ≤ camada; promedio calculado; crías entran como gazapos con código generado; pesos al nacer en historial. |
| CUY-09 | ✅ | `POST /destetes` | Destetados ≤ vivos; fecha > parto; gazapo→recría; traslado a jaulas de recría por sexo en el mismo paso; pesos al destete en historial. |
| CUY-10 | ✅ | `PATCH /empadres/:id/hembras/:id` (resultado cerrado) | `murio` → baja + mortalidad automática. |
| CUY-11 | ✅ | `GET /empadres/reproductoras/:id` | Partos con promedios, indicadores acumulados, export CUY-22. |

### Épica C3 — Reproductores (CUY-12 a CUY-15)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-12 | ⚠️ | `POST /empadres/reproductores` | Igual que CUY-06: categoría reproductor no forzada en backend. |
| CUY-13 | ✅ | `POST /empadres` | Cantidad de hembras calculada; preñadas ≤ hembras; reflejado en ficha de macho y hembras. |
| CUY-14 | ✅ | `GET /empadres/reproductores/:id` | % preñez y promedio de camada desde partos registrados. |
| CUY-15 | ✅ | `GET /empadres/jaula/:id/hembras` + `POST /empadres/:id/cerrar` | Propuesta de hembras, quitar/agregar, retorno del macho en un paso. |

### Épica C4 — Pesos y alertas del cuy (CUY-16 a CUY-18)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-16 | ⚠️ | `pesajes.routes.js` | Rangos por categoría configurables pero **solo en memoria** (`let RANGOS`, se pierden al reiniciar). |
| CUY-17 | ⚠️ | `alertas.routes.js` (gestación 67 d, destete 14 d) | Faltan configurables: **edad de paso a recría** y **edad mínima de empadre** (necesarios para CUY-02). |
| CUY-18 | ⚠️ | `alertas.routes.js` | Faltan alertas de "empadre disponible tras el destete" y "revisión de hembra sin preñez confirmada". |

### Épica C5 — Reproductores élite (CUY-19 a CUY-21)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-19 | ⚠️ | `ranking.routes.js` | **Sin filtros por raza ni categoría** (solo sexo); `peso_peso_dest` se guarda en config pero **no se aplica** en el puntaje. |
| CUY-20 | ✅ | `GET/PUT /ranking/config` | Persistido en `ranking_config`; muestra la ponderación aplicada. |
| CUY-21 | ⚠️ | `POST /ranking/:id/marcar` | Marca descarte/reemplazo con fecha y responsable, pero los descartes **no se agrupan** para la próxima venta. |

### Épica C6 — Exportación a Excel de la unidad (CUY-22 a CUY-24)

| Hist | Estado | Sustento | Notas |
|---|---|---|---|
| CUY-22 | ✅ | `GET /reportes/hembras` | Encabezado oficial, columnas completas, promedios calculados, una o todas. |
| CUY-23 | ✅ | `GET /reportes/machos` | Datos del reproductor + empadres + nacimientos; uno o todos. |
| CUY-24 | ⚠️ | `GET /reportes/inventario-mensual` | Exporta **un mes** (`anio`+`mes`); la historia pide el **año completo** (`elijo el año`) con filas de población inicial/mortalidad/población final por mes. |

---

## Brechas transversales (orden de prioridad)

1. **NUC-41 — Auditoría incompleta.** El criterio "saber quién registró o modificó cada dato y cuándo (con valor anterior)" no se cumple para la mayoría de ediciones. Solo login/logout, `escalada_bloqueada` y anulaciones de mortalidad/venta escriben en `audit_log`.
2. **Alertas del cuy (CUY-18 / CUY-17 / NUC-33).** La mitad del ciclo no genera avisos ni plazos configurables.
3. **CUY-16 — Rangos de peso no persistentes.** Configuración volátil; riesgo de pérdida al reiniciar.
4. **NUC-39 — Validación de fechas no sistemática.** Partos, mortalidad, ventas y tratamientos no rechazan fechas futuras ni imposibles; riesgo de reintroducir los datos corruptos de los Excel actuales (el problema original de NUC-39).
5. **CUY-24 — Inventario anual.** El export solo cubre un mes.
6. **NUC-36/NUC-37 — Alcance de exportación.** Falta consolidado multi-granja a Excel y export de listas filtradas combinadas.
7. **CUY-19 — Ranking.** Faltan filtros por raza/categoría y el peso de peso al destete.
8. **CUY-02 — Transiciones de categoría.** Solo existe la de gazapo→recría al destete.
9. **SUPERFICIE de acceso por rol en frontend.** Las rutas `/usuarios`, `/granjas`, `/auditoria` no tienen guard por rol; cualquier autenticado puede abrirlas por URL.

---

## Registro de correcciones

Brechas corregidas después de esta revisión (validación estática; pendiente re-validación con datos reales).

| # | Fecha | Historia | Corrección aplicada |
|---|---|---|---|
| 1 | 15/09/2026 | NUC-39 | Helpers `esFechaFutura`/`errorFecha` en `utils/helpers.js` y rechazo de fecha futura en partos, mortalidad, ventas, destetes, tratamientos (fecha_inicio + duración), animales (fecha_nacimiento y fecha_baja). Empadre y pesaje ya lo tenían. |
| 2 | 15/09/2026 | NUC-41 | `writeAudit` con `antes`/`despues` en 16 rutas de mutación: animales, jaulas, áreas, granjas, usuarios, empadres, partos, destetes, mortalidad, ventas, movimientos, tratamientos, pesajes (incl. lote y rangos), ranking, catálogos y alertas. |
| 3 | 15/09/2026 | CUY-16 | Rangos de peso persistentes por granja: tabla `peso_rangos` en `schema.sql`, `getRangos`/`saveRangos` en `pesajes.routes.js`, PUT `/rangos` persiste en BD y GET `/rangos` los lee. Corregida precedencia de `rangoPara` (recría salía como gazapo por `includes('cria')`). |
| 4 | 15/09/2026 | CUY-18 / NUC-33 | En `alertas.routes.js` ahora se generan los 4 tipos: `parto_proximo`, `destete_pendiente`, `empadre_disponible` (reproductora sin ciclo abierto) y `sin_prenez` (empadre abierto sin parto). |
| 5 | 15/09/2026 | CUY-17 / CUY-02 | Plazos `edad_recria` y `edad_empadre` configurables en `alerta_config` + endpoint `GET /catalogos/transiciones` que propone cambios de categoría por edad (gazapo→recría y recría→reproductora/reproductor). |
| 6 | 15/09/2026 | CUY-06 / CUY-12 | Forzar categoría: parto asigna `reproductora` a la madre; alta de empadre asigna `reproductor` al macho (si las categorías existen). |
| 7 | 15/09/2026 | CUY-19 | Ranking filtra por `id_raza`/`id_categoria` y usa `peso_peso_dest` (promedio de peso al destete desde `destetes.peso_*`). |
| 8 | 15/09/2026 | NUC-29 | `continuidad_ok` ya no es fijo: se concilia `población inicial + nacimientos − mortalidad − ventas + transferencias(in−out) === población final`; se exponen `continuidad_esperada` y `continuidad_detalle`. |
| 9 | 15/09/2026 | NUC-36 | Nuevo `GET /reportes/consolidado` (Excel) con inventario (H/M/gazapos/total) y movimiento (nacimientos/mortalidad/ventas) por granja + fila TOTAL; filtra por mes opcional. |
| 10 | 15/09/2026 | NUC-37 | `GET /reportes/animales` acepta `estado`, `id_area`, `id_raza`, `id_categoria` (listado filtrado combinado). |
| 11 | 15/09/2026 | CUY-24 | `GET /reportes/inventario-mensual` sin `mes` exporta el año completo (12 hojas). El endpoint mensual se refactorizó en `hojaMensual`. |
| 12 | 15/09/2026 | CUY-21 | `GET /ventas/descartes` agrupa animales `descarte` por categoría (con `id_animales`) y `POST /ventas/descartes` registra la venta agrupada marcándolos `baja_venta`; UI de selección/venta en `Ventas.js`. |
| 13 | 15/09/2026 | NUC-38 | Borradores (sessionStorage, patrón `draftForm.js`) en Empadres, Mortalidad, Movimientos, Pesajes, Sanidad y Ventas (se suman a Animales, Partos y Destetes). |
| 14 | 15/09/2026 | NUC-05 (front) | Guard por rol: `RoleRoute.js` protege `/usuarios`, `/granjas` y `/auditoria` (solo superadmin/admin) y el menú en `Layout.js` oculta esas secciones para el resto. |
| 15 | 15/09/2026 | Entrega | `node --check` OK en todo `backend/src`; `npm run build` OK en frontend. Pendiente: migrar BD (tabla `peso_rangos`) y re-validación funcional con datos. |