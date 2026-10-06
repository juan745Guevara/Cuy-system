# Requisitos no funcionales — Sistema de Control de Animales

**Facultad de Zootecnia — UNAS** · **29 requisitos** (RNF-01 a RNF-29) · Marco de referencia **ISO/IEC 25010**

Lista de requisitos no funcionales (calidad, restricciones y atributos de la solución) derivados de la documentación del proyecto: decisiones arquitectónicas de la Entrega 1, modelo de permisos, historias de usuario y las restricciones acordadas en la visión del producto.

---

## 1. Convención de identificadores

- **RNF-NN**: requisito no funcional, numerado de forma correlativa y agrupado por la característica de calidad ISO/IEC 25010 a la que aporta.
- **Fuente**: documento y sección del que se deriva cada requisito. Todo RNF está respaldado por la documentación existente; los que provienen del SRS histórico (v2.0) están señalados en §5.
- Cada requisito es **verificable**: o bien es medible (umbral numérico), o bien es comprobable por inspección (configuración, estructura, comportamiento).
- Los requisitos funcionales (qué hace el sistema) están en [requisitos-funcionales.md](requisitos-funcionales.md).

---

## 2. Requisitos por característica de calidad

### 2.1 Seguridad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-01** | **Autenticación.** El acceso debe requerir usuario y contraseña; las contraseñas se almacenan con hash **bcrypt** (nunca en texto plano) y la sesión usa tokens **JWT** con expiración configurable (`JWT_EXPIRES_IN`) y caducidad por inactividad. | `NUC-01` · [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/10.md](entrega_01/10.md) · README |
| **RNF-02** | **Autorización en capas.** El control de acceso se resuelve con tres capas (rol + alcance de granjas + acciones) y una cadena de guards en el servidor (`JwtAuthGuard → LoadUserFarmsGuard → FarmAccessGuard → SpeciesGuard → RolesGuard → SuperadminScopeGuard`), incluida la **regla de no escalada**: nadie asigna granjas que no tiene. | [actores.md](actores.md) §1, §4, §5 · `NUC-08` · [entrega_01/10.md](entrega_01/10.md) |
| **RNF-03** | **Aislamiento por granja y especie.** Toda lectura y escritura debe filtrarse por la granja activa (cabeceras `x-farm-id` y `x-species-id`) validadas en cada petición; un usuario nunca debe recibir datos de granjas fuera de su alcance, ni siquiera invocando la API directamente. | README · [entrega_01/08.md](entrega_01/08.md) §8.2.1 · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-04** | **Protección del canal y del pipeline.** El backend debe aplicar **Helmet** (cabeceras de seguridad), **CORS restringido**, **límite de 100 peticiones cada 15 minutos**, validación de entrada (`ValidationPipe`) y consultas SQL parametrizadas, sobre comunicación HTTP/HTTPS. | [entrega_01/10.md](entrega_01/10.md) §10.2–10.3 · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-05** | **Auditoría inmutable.** Toda operación de escritura debe registrar **autor, fecha, valor anterior y valor nuevo** en una bitácora que no puede editarse ni eliminarse desde la aplicación. | `NUC-41` · [actores.md](actores.md) §5 · [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/03.md](entrega_01/03.md) §3.1 |
| **RNF-06** | **Borrado lógico.** Ningún registro de negocio se elimina físicamente: se marca como inactivo o anulado (`activo = false`), se conserva el historial y el registro es recuperable (reactivación). Aplica a granjas, áreas, jaulas, usuarios y animales. | [actores.md](actores.md) §5 · `NUC-04`, `NUC-10`, `NUC-41` · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-07** | **Exposición de herramientas de API.** La documentación interactiva (Swagger/OpenAPI en `/api-docs`) solo debe estar disponible en desarrollo; en producción debe quedar deshabilitada. | [entrega_01/10.md](entrega_01/10.md) §10.2–10.3 · [entrega_01/11.md](entrega_01/11.md) |

### 2.2 Rendimiento y eficiencia

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-08** | **Tiempo de respuesta de listados.** Los listados con más de **500 registros** deben cargarse en **menos de 2 segundos**. | SRS v2.0 §7 (RNF-02), mantenido |
| **RNF-09** | **Eficiencia de consultas.** Las operaciones típicas deben resolverse en una sola petición a la API (sin saltos de red entre módulos), con índices en las columnas de filtrado y ordenamiento habituales. | [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/08.md](entrega_01/08.md) §8.2.2 |
| **RNF-10** | **Uso de recursos.** El sistema debe operar con un solo proceso de backend y una sola base de datos, con consumo apto para el servidor universitario disponible y la carga esperada de la unidad. | [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/08.md](entrega_01/08.md) §8.3.1 |

### 2.3 Usabilidad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-11** | **Interfaz responsiva.** La aplicación web debe usarse cómodamente en **tablet y teléfono** (toma de datos en campo) además de escritorio, sin aplicación nativa. | SRS v2.0 §7 (RNF-01), mantenido · [entrega_01/03.md](entrega_01/03.md) §3.2 |
| **RNF-12** | **Control de entrada en los campos.** Las fechas se ingresan con **selector de calendario** que rechaza fechas imposibles; pesos y cantidades aceptan solo números positivos con **decimales** (gramos, ej. `120.5`); estados y categorías se eligen de **listas cerradas**. | SRS v2.0 §7 (RNF-04), mantenido y ampliado · `NUC-39` |
| **RNF-13** | **Mensajes y confirmaciones.** Cada error debe indicar **qué campo corregir**; cada guardado muestra confirmación visible; las situaciones de riesgo (sobrecupo, animal fuera de área, eliminación) exigen **confirmación explícita** del usuario. | `NUC-39`, `NUC-18`, `NUC-19` · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-14** | **Operabilidad para uso esporádico.** El sistema debe mantener el contexto de **granja activa** durante toda la sesión (sin re-elegirlo en cada registro) y ofrecer **accesos directos** a los registros frecuentes desde el panel, porque el usuario entra en fechas clave del ciclo, no a diario. | [vision.md](vision.md) §4 · `NUC-02`, `NUC-03` |

### 2.4 Fiabilidad e integridad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-15** | **Transaccionalidad ACID.** Las operaciones multi-tabla (parto con camada y alta de crías, destete con traslado, venta con baja de inventario, transferencia entre granjas) deben completarse **o revertirse por completo**, sin estados intermedios. | [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/08.md](entrega_01/08.md) §8.3.1 · CU-01 |
| **RNF-16** | **Tolerancia a fallos en el registro.** El sistema debe conservar el borrador de un formulario ante cierre de pantalla o corte de conexión y ofrecer retomarlo; si el guardado falla, debe decirlo y **no dar el dato por registrado**. | `NUC-38` |
| **RNF-17** | **Consistencia de cifras.** Panel, inventario, resumen mensual y reportes deben derivarse de los mismos cálculos: la suma de áreas coincide con el total de la granja y la población final de un mes es igual a la inicial del siguiente. | `NUC-03`, `NUC-29`, `NUC-31` |
| **RNF-18** | **Recuperabilidad.** La restauración debe lograrse con la reactivación de registros borrados lógicamente y con un esquema de base de datos **idempotente** (`npm run db:migrate`), aplicable en cualquier servidor sin editar código. | [entrega_01/12.md](entrega_01/12.md) §1 |

### 2.5 Mantenibilidad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-19** | **Modularidad.** El backend debe organizarse en los módulos `platform` (núcleo común), `cuyes` (especie) y `shared` (kernel compartido) con fronteras explícitas: `cuyes` depende de `platform` **nunca a la inversa**, y ambos dependen solo de `shared`. | [entrega_01/12.md](entrega_01/12.md) §1 · [entrega_01/08.md](entrega_01/08.md) §8.2.2 |
| **RNF-20** | **Estructura uniforme y principios SOLID.** Cada módulo debe respetar las capas `presentation`, `application`, `domain`, `infrastructure` con dependencias hacia el dominio, y los principios SRP, OCP, LSP, ISP y DIP documentados en la Entrega 1. | [entrega_01/08.md](entrega_01/08.md) §8.2.3 · [entrega_01/12.md](entrega_01/12.md) §2 |
| **RNF-21** | **Testabilidad.** Los casos de uso deben depender de **puertos** (abstracciones) e inyección de dependencias, de modo que puedan probarse con repositorios falsos sin base de datos activa; el compromiso asumido es incorporar pruebas unitarias de los casos de uso. | [entrega_01/12.md](entrega_01/12.md) §2 y §4 |

### 2.6 Compatibilidad e interoperabilidad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-22** | **API REST versionada.** Todas las operaciones deben exponerse como API REST con JSON bajo el prefijo `/api/v1`, autenticación `Authorization: Bearer <jwt>` y documentación OpenAPI, de modo que otro cliente (por ejemplo una app móvil futura) pueda consumirla. | [entrega_01/11.md](entrega_01/11.md) · [entrega_01/08.md](entrega_01/08.md) §8.2.1 · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-23** | **Intercambio con la facultad.** Los reportes deben generarse en formato **`.xlsx`** estándar, legible por Excel y LibreOffice, respetando encabezados y orden de las plantillas oficiales de la unidad. | [vision.md](vision.md) §4 · `NUC-36`, `CUY-22` a `CUY-24` · [entrega_01/12.md](entrega_01/12.md) §1 |
| **RNF-24** | **Navegadores soportados.** La interfaz debe funcionar en las versiones actuales de **Chrome, Edge y Firefox**. | [entrega_01/10.md](entrega_01/10.md) §10.1 |

### 2.7 Portabilidad y despliegue

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-25** | **Configuración por variables de entorno.** Toda configuración variable (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`) debe resolverse por entorno, sin cambiar código entre desarrollo y producción. | [entrega_01/10.md](entrega_01/10.md) §10.4 |
| **RNF-26** | **Instalación.** El sistema debe desplegarse en un servidor con **Node.js y PostgreSQL** (frontend en puerto 3000, API en 3001, base de datos en 5432, en una o varias máquinas), con esquema SQL idempotente; el empaquetado con **Docker (Docker Compose)** se aplica al cierre del proyecto. | [entrega_01/10.md](entrega_01/10.md) §10.4 · [entrega_01/12.md](entrega_01/12.md) §1 · [vision.md](vision.md) §7 |

### 2.8 Extensibilidad

| ID | Requisito no funcional | Fuente |
|---|---|---|
| **RNF-27** | **Extensión por módulos de especie.** Agregar una especie nueva debe ser un módulo nuevo que reutiliza `platform` **sin modificar el núcleo existente**; agregar una granja nueva debe ser configuración (granja + áreas + jaulas), no desarrollo. | [vision.md](vision.md) §2 y §8 · [modulos-futuros.md](modulos-futuros.md) · [entrega_01/08.md](entrega_01/08.md) §8.2.2 |
| **RNF-28** | **Configurabilidad por la unidad.** Deben ser configurables y persistentes en base de datos: plazos de alertas, transiciones de categoría, rangos de peso por categoría y ponderación del ranking. | `NUC-35`, `CUY-16`, `CUY-17`, `CUY-20` |
| **RNF-29** | **Reglas de especie sustituibles.** Las reglas propias de cada especie (correspondencia categoría ↔ propósito de área) deben implementarse detrás de un puerto (`AreaRulesPort`) con una implementación neutra por defecto, intercambiable sin tocar el núcleo. | [entrega_01/12.md](entrega_01/12.md) §2 (OCP, LSP) |

---

## 3. Resumen y cobertura

| Característica ISO/IEC 25010 | Requisitos | Cantidad |
|---|---|---|
| Seguridad | RNF-01 a RNF-07 | 7 |
| Eficiencia de desempeño | RNF-08 a RNF-10 | 3 |
| Usabilidad | RNF-11 a RNF-14 | 4 |
| Fiabilidad | RNF-15 a RNF-18 | 4 |
| Mantenibilidad | RNF-19 a RNF-21 | 3 |
| Compatibilidad | RNF-22 a RNF-24 | 3 |
| Portabilidad | RNF-25 a RNF-26 | 2 |
| Extensibilidad (adecuación funcional a futuro) | RNF-27 a RNF-29 | 3 |
| **Total** | | **29** |

---

## 4. Correspondencia con los requisitos del SRS histórico (v2.0)

El SRS histórico `docs/SRS-Gestion-Cuyes-UNAS.md` (versión 2.0, sección 7; eliminado en el commit `62783f1b` y recuperable con `git show ec4db4c9:docs/SRS-Gestion-Cuyes-UNAS.md`) contenía 5 RNF. Este documento los recoge, los actualiza y los amplía:

| SRS v2.0 | Estado | Dónde queda hoy |
|---|---|---|
| **RNF-01** — Aplicación web responsiva (tablet para datos en campo) | **Se mantiene** | RNF-11 |
| **RNF-02** — Listados > 500 registros en menos de 2 segundos | **Se mantiene igual** | RNF-08 |
| **RNF-03** — Autenticación; roles Admin (escritura) y Viewer (lectura) | **Actualizado** | RNF-01 (autenticación) y RNF-02 (autorización); los roles Admin/Viewer fueron reemplazados por los 5 roles vigentes de [actores.md](actores.md): Superadmin, Admin, Encargado, Supervisor y Auxiliar |
| **RNF-04** — Datepicker en fechas y decimales en pesos | **Se mantiene y amplía** | RNF-12 (se agrega el rechazo de fechas imposibles y las listas cerradas) |
| **RNF-05** — No eliminar una hembra con partos; solo cambiar su estado | **Migrado a requisito funcional** | RF-10 y RF-51 (baja por cambio de estado conservando historial), respaldado por RNF-06 (borrado lógico) |

El SRS histórico también usaba los identificadores `HU-01` a `HU-16`, hoy reemplazados por `NUC-xx`/`CUY-xx` y sus RF correspondientes.

---

## 5. Puntos pendientes de definir

Requisitos de calidad que **no están definidos en la documentación actual** y deben acordarse con la unidad antes de la puesta en producción:

1. **Copias de seguridad y recuperación:** no hay definidos frecuencia de respaldo, retención ni objetivo de tiempo de recuperación (RTO/RPO).
2. **Disponibilidad del servicio:** no se ha fijado un porcentaje mínimo de tiempo activo ni el horario de mantenimiento.
3. **Tiempos de respuesta de exportación:** RNF-08 cubre listados, pero no se ha fijado un umbral para la generación de archivos Excel.
4. **Capacidad y carga:** no se ha definido el número de usuarios simultáneos soportados ni se han previsto pruebas de carga.
5. **Accesibilidad:** no se ha definido un nivel de conformidad (por ejemplo WCAG 2.1 AA) para usuarios con discapacidad.

---

## 6. Documentos relacionados

- [requisitos-funcionales.md](requisitos-funcionales.md) — RF-01 a RF-65 con trazabilidad a las 65 historias
- [actores.md](actores.md) — modelo de permisos (base de RNF-02, RNF-03)
- [entrega_01/12.md](entrega_01/12.md) — justificación ISO/IEC 25010 y SOLID (base de §2.5)
- [entrega_01/08.md](entrega_01/08.md) — estilo arquitectónico (base de §2.5, §2.7)
- [entrega_01/10.md](entrega_01/10.md) y [entrega_01/11.md](entrega_01/11.md) — componentes, seguridad y API (base de §2.1, §2.6)
- [vision.md](vision.md) — restricciones técnicas y criterios de éxito (base de §2.7, §2.8)
