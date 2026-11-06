# SISTEMA DE GESTIÓN Y TRAZABILIDAD DEL CICLO PRODUCTIVO DE CUYES

**Documento de Diseño Detallado de Software** · Diseño Detallado de Software · 2026-II

---

# Introducción

## Descripción del caso de negocio

### Contexto y problemática

El Laboratorio de Crianza de Cuyes de la Facultad de Zootecnia de la Universidad Nacional Agraria de la Selva (UNAS, Tingo María) cumple un doble rol: es centro de investigación y mejoramiento genético de líneas cárnicas y prolíficas, y unidad de producción que abastece a la comunidad universitaria y al mercado local.

El control de nacimientos, destetes, empadres, sanidad, pesajes y ventas se lleva en cuadernos de campo y hojas de Excel aisladas. La revisión de los registros históricos de la unidad evidencia cinco problemas:

| Problema | Evidencia en los registros | Consecuencia |
|-------------|---------------------------------------|---------------------------------|
| Registros duplicados y desarticulados | Cada evento se anota a mano y se transcribe a varias plantillas no vinculadas (partos, mortalidad, reproductoras, inventario). | Hasta 40 % del tiempo operativo en transcripción y errores recurrentes. |
| Datos sin validación | Fechas imposibles y un mismo animal con varias grafías (`UM24`, `UM 24`, `Uum24`); estados en texto libre. | Imposible consolidar automáticamente. |
| Pérdida de trazabilidad | La genealogía y los partos de cada hembra están dispersos en celdas. | No se controla el tope de 6 partos ni la gestación de ~67 días. |
| Inventario físico ≠ lógico | Movimientos, nacimientos, muertes y ventas se registran con retraso. | Diferencias sistemáticas entre el conteo en pozas y las existencias. |
| Ventas sin conciliar | El pago se hace en la caja externa de la UNAS y no se valida la serie y número del comprobante contra el inventario. | Riesgo de vender animales no disponibles o de no cuadrar ingresos y bajas. |

La solución es **Cuy-System**, una plataforma web que centraliza el ciclo productivo completo —nacimiento, destete, recría, engorde, reproducción y salidas por venta, descarte o mortalidad— y automatiza la venta: verifica disponibilidad, exige el comprobante de la caja externa y descuenta el inventario en la misma operación.

### Procesos de negocio AS-IS

La operación se modela en dos niveles BPMN: un macroproceso (Nivel 0) y tres subprocesos operativos (Nivel 1) con dos roles internos —**Encargada del criadero** (operación diaria) e **Ingeniera Zootecnista** (supervisión y planificación)— y un actor externo, el **Cliente**.

![Figura 1. Macroproceso AS-IS de producción y salidas (Nivel 0)](img/2feb6a6f0749.png){ width=6.2in }

Todo animal entra al nacer y pasa por lactancia (15 días), destete, recría y engorde. Al final se decide su destino: **reproducción** (sus crías vuelven a crianza), **venta** (engorde comercial o reproductoras descartadas) o **baja por mortalidad**.

| Subproceso | Objetivo | Reglas de negocio clave |
|------------------|--------------------------------|--------------------------------------|
| Crianza y control | Controlar crecimiento, sanidad, traslados y aforo de jaulas hasta el destino productivo. | Destete a los 15 días; traslado validando capacidad de la jaula; inventario físico y reporte mensual. |
| Reproducción y empadre | Planificar empadres, seguir la gestación, registrar partos y renovar el plantel. | Edad mínima 3 meses; 1 macho por 5–8 hembras; gestación de ~67 días; máximo 6 partos por hembra. |
| Comercialización y ventas | Respaldar cada salida comercial con stock verificado, pago en caja UNAS y baja inmediata del inventario. | El criadero no cobra; toda venta exige serie y número del comprobante oficial. |

![Figura 2. Subproceso AS-IS: crianza y control de cuyes (Nivel 1)](img/d1040538635f.png){ width=6.2in }

![Figura 3. Subproceso AS-IS: ciclo reproductivo y empadre (Nivel 1)](img/db9550de42ce.png){ width=6.2in }

![Figura 4. Subproceso AS-IS: comercialización y ventas (Nivel 1)](img/baa8bdc45773.png){ width=6.2in }

### Del proceso manual (AS-IS) a la solución (TO-BE)

| Aspecto | AS-IS (cuadernos y Excel) | TO-BE (Cuy-System) |
|-------------|----------------------------------|----------------------------------------|
| Identificación y genealogía | Códigos con grafías variables; genealogía reconstruida a mano. | Código normalizado y único por granja; pedigrí de tres generaciones en la ficha del animal. |
| Empadre y gestación | Fecha probable de parto calculada a mano. | Parto proyectado a 67 días y alertas en el panel. |
| Tope de 6 partos | Celda pintada de rojo "si se recuerda". | Conteo automático de partos: una hembra con 6 partos no puede volver a empadrarse y se marca para descarte. |
| Destete y aforo | Días contados a mano; sobrecupo inadvertido. | Alerta de destete pendiente (14 días, configurable) y validación de capacidad al reubicar animales, con confirmación explícita. |
| Sanidad | Fechas de desparasitación de memoria. | Historial clínico por animal, jaula o área y lista de tratamientos en curso con su fecha de término. |
| Ventas | Recibo revisado a ojo; inventario descontado a fin de mes. | Serie y número obligatorios, sin duplicados, y baja del inventario en la misma transacción. |
| Inventario y reportes | Informe mensual con hasta 5 días de demora; el conteo en pozas no se contrasta con los registros. | Inventario calculado al momento, conteo físico por jaula con la diferencia frente a lo registrado y exportación a Excel con las plantillas oficiales. |

## Objetivos del sistema

### Objetivo general

Implementar una plataforma web modular que gestione y dé trazabilidad al ciclo productivo de los cuyes del laboratorio de la UNAS —nacimiento, destete, recría, engorde, reproducción y salida— reduciendo el tiempo administrativo y entregando información oportuna para las decisiones técnicas.

### Objetivos específicos

1. **Trazabilidad individual:** código único por cuy con raza, sexo, camada de origen y genealogía.
2. **Ciclo reproductivo:** registrar empadres, proyectar el parto a 67 días y registrar partos con crías vivas, muertas y pesos.
3. **Desarrollo y pesaje:** registrar destetes y pesajes periódicos, con promedios y rangos por categoría.
4. **Jaulas y movimientos:** controlar capacidad y ocupación, registrar cada traslado y advertir el sobrecupo.
5. **Sanidad:** documentar tratamientos preventivos y curativos (producto, dosis, responsable y duración).
6. **Salidas:** registrar ventas vinculadas al comprobante de la caja externa, descartes y mortalidad.
7. **Inventario:** calcular la población por área, categoría y mes a partir de los eventos registrados, y conciliarla con el conteo físico de cada jaula.
8. **Indicadores y reportes:** panel con indicadores productivos y exportación a Excel en el formato de la unidad.

## Alcance y limitaciones

**Incluye:**

- Identificación y genealogía de animales; estructura granja → área → jaula con capacidad y ocupación.
- Empadres, partos, destetes, pesajes, sanidad, movimientos internos y traslados entre granjas.
- Ventas con comprobante externo, descartes y mortalidad, con anulación justificada.
- Inventario con conteo físico por jaula, alertas, ranking de reproductores, panel de indicadores y reportes `.xlsx`.
- Seguridad: autenticación JWT, cinco roles (superadmin, admin, encargado, supervisor y auxiliar), acceso por granja y bitácora de auditoría.

**No incluye:**

- Pasarela de pagos ni facturación electrónica (SUNAT): el cobro lo realiza la caja de la UNAS.
- Inventario de insumos (forraje, concentrado, botiquín) y contabilidad de costos.
- Aplicación móvil nativa: se usa la web adaptable a teléfono y tableta.
- Otras especies: la arquitectura las admite como módulos nuevos, pero solo se implementa el de cuyes.

# Modelo del dominio

## Modelo conceptual del dominio

El modelo conceptual describe **qué conceptos existen en la crianza de cuyes y cómo se relacionan**, sin detalles de implementación; su traducción a tablas se presenta en el Diseño de datos (sección 4). Se organiza en cuatro vistas.

![Figura 5. Modelo conceptual: alojamiento, razas e identificación](img/0a9aa0521d6f.png){ width=6.19in }

![Figura 6. Modelo conceptual: reproducción, camadas y genealogía](img/a1b1ba5f5055.png){ width=5.61in }

![Figura 7. Modelo conceptual: destete, crecimiento y sanidad](img/b3d07b110490.png){ width=6.2in }

![Figura 8. Modelo conceptual: salidas del criadero e inventario](img/c8d3d905e494.png){ width=6.2in }

Los atributos de cada concepto figuran en los diagramas; la tabla resume su significado en el negocio.

| Concepto | Significado en el negocio |
|----------------|----------------------------------------------------------|
| CUY | Animal individual: identidad, genealogía (madre y padre), ubicación y estado zootécnico. |
| RAZA | Línea genética del catálogo (Perú, Andina, Inti, Tipo 2–4, línea criolla negra). |
| JAULA | Poza de alojamiento con capacidad, etapa y conteo por sexo; base del control de sobrecupo. |
| MOVIMIENTO_JAULA | Traslado de un cuy entre jaulas con fecha y motivo. |
| EMPADRE / DETALLE_EMPADRE | Lote de apareamiento: un macho y sus hembras participantes. |
| PARTO | Fin de la gestación de una hembra, asociado al empadre que lo originó. |
| NACIMIENTO / CAMADA | Crías de un parto, con vivos, muertos y desglose por sexo. |
| SELECCION_REPRODUCTOR | Elección de un animal como reproductor de reemplazo. |
| DESTETE | Separación de la madre con edad, peso y jaula de recría. |
| PESO | Control biométrico individual o muestral. |
| SANIDAD | Atención preventiva o curativa con diagnóstico, medicamento, dosis y responsable. |
| VENTA | Salida comercial respaldada por la serie y número del comprobante de la caja UNAS. |
| DESCARTE | Retiro planificado de reproductores al fin de su vida útil. |
| MORTALIDAD | Baja por muerte con causa y circunstancias. |
| INVENTARIO | Conteo físico por jaula contrastado con las existencias del sistema. |

## Casos de uso principales

| Código | Caso de uso | Actor principal | Objetivo |
|--------|----------------------------------|---------------------|----------------------------------------|
| CU-01 | Registrar nacimiento y generar camada | Encargado | Registrar el parto y dar de alta a cada cría vinculada a sus progenitores. |
| CU-02 | Registrar empadre y seguimiento | Encargado | Formar el lote macho–hembras y proyectar el parto a 67 días. |
| CU-03 | Gestionar y registrar venta | Encargado / Cliente | Vender con stock verificado, comprobante externo y baja del inventario. |
| CU-04 | Registrar destete | Encargado | Pasar las crías a recría y a la jaula de su sexo. |
| CU-05 | Registrar atención sanitaria | Encargado / Zootecnista | Registrar tratamientos preventivos o curativos. |
| CU-06 | Conciliar inventario físico | Encargado / Supervisor | Contrastar el conteo en jaulas con las existencias del sistema. |
| CU-07 | Registrar descarte o mortalidad | Encargado | Dar de baja definitiva a un animal de la población activa. |

![Figura 9. Diagrama general de casos de uso y actores](img/f0d325dff93a.png){ width=3.54in }

![Figura 10. Casos de uso del ciclo productivo y reproductivo](img/c4e4aa11e037.png){ width=6.2in }

![Figura 11. Casos de uso de ventas y salidas definitivas](img/08e00dbf0cd3.png){ width=6.2in }

![Figura 12. Casos de uso de sanidad, jaulas, inventario y reportes](img/84c69c55410e.png){ width=6.2in }

Las especificaciones describen el comportamiento implementado y siguen un mismo formato: actor, condiciones previas y posteriores, flujo principal y flujos alternativos. Todas las operaciones exigen sesión iniciada, se limitan a la granja activa, se ejecutan en una transacción y quedan registradas en la bitácora de auditoría; por eso esas condiciones no se repiten en cada caso.

### CU-01. Registrar nacimiento y generar camada

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes (también admin y auxiliar) |
| Precondiciones | La madre es una hembra activa de la granja; opcionalmente pertenece a un empadre. |
| Postcondiciones | Parto registrado; si viene de un empadre, la hembra queda con resultado *preñez*; la madre pasa a la categoría reproductora; cada cría viva se da de alta como animal activo, categoría gazapo, con la raza y la jaula de la madre y vinculada al parto (genealogía); los pesos al nacer quedan como primer pesaje. |

**Flujo principal**

1. El encargado abre *Registrar parto* y elige la madre y, si corresponde, el empadre.
2. Ingresa la fecha, las crías vivas por sexo, las muertas y hasta tres pesos por sexo.
3. Guarda; el sistema genera el código de cada cría (código de la madre + número de parto + sexo y número, por ejemplo `U101-P35-M1`), registra todo en una sola transacción y muestra la camada con su peso promedio.

**Flujos alternativos**

- **FA-1.1** Fecha inválida o futura: se rechaza indicando el campo (400).
- **FA-1.2** No se indicó ninguna cría viva ni muerta: se rechaza.
- **FA-1.3** La madre no existe, no es hembra o no está activa: se rechaza.

### CU-02. Registrar empadre y seguimiento reproductivo

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes (también admin y auxiliar) |
| Precondiciones | Macho y hembras activos de la granja. |
| Postcondiciones | Empadre registrado con sus hembras en estado *abierto*. El panel muestra la alerta de parto próximo a los 67 días, la de preñez sin confirmar a los 30 días y la de hembra disponible para un nuevo empadre (plazos configurables). |

**Flujo principal**

1. Abre *Nuevo empadre* y elige la jaula, el macho reproductor y las hembras.
2. Indica la fecha de inicio y, al cierre, cuántas hembras quedaron preñadas.
3. Guarda; el sistema valida las reglas zootécnicas de cada hembra y registra el empadre.
4. Durante la gestación registra el resultado de cada hembra (preñez, vacía, aborto o muerte) y cierra el empadre indicando la jaula de retorno del macho.

**Flujos alternativos**

- **FA-2.1** Fecha inválida o futura: se rechaza (400).
- **FA-2.2** Hembra con menos de 3 meses de edad: se rechaza indicando la hembra.
- **FA-2.3** Hembra con 6 partos: se rechaza y se indica que debe descartarse.
- **FA-2.4** Fecha anterior al último parto de la hembra: se rechaza.
- **FA-2.5** Macho o hembra inexistente, de otro sexo o inactivo: se rechaza.

### CU-03. Gestionar y registrar venta de cuyes

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actores | Encargado del área de cuyes (principal); Cliente y Caja UNAS (externos) |
| Precondiciones | Solicitud del cliente; existen animales activos (o marcados como descarte) para vender. |
| Postcondiciones | Venta registrada con tipo, serie y número de comprobante; los animales vendidos quedan en estado `baja_venta` con fecha y motivo; el inventario los descuenta. |

**Flujo principal**

1. El cliente solicita cuyes; el encargado consulta la disponibilidad por categoría o elige el animal.
2. Acuerdan cantidad y precio; el cliente paga en la caja de la UNAS y vuelve con el comprobante.
3. El encargado verifica el comprobante (importe, sello y fecha).
4. Registra la venta individual o por lote —o la venta agrupada de descartes— con el tipo, la serie y el número del comprobante.
5. El sistema valida los datos, la población disponible, que el comprobante no se haya usado antes y que el animal siga activo; registra la venta y la baja en la misma transacción. Se entregan los cuyes.

**Flujos alternativos**

- **FA-3.1** La cantidad supera la población disponible de la categoría: se rechaza indicando cuántos hay.
- **FA-3.2** Falta el tipo, la serie o el número del comprobante: se rechaza indicando el dato (400).
- **FA-3.3** El comprobante ya se usó en otra venta no anulada (de cualquier granja): se rechaza (409) indicando la venta previa.
- **FA-3.4** El animal fue vendido, murió o se descartó mientras tanto: se rechaza (409) y se elige otro.
- **FA-3.5** En la venta de descartes, algún animal no está marcado como descarte: se rechaza toda la operación.
- **FA-3.6** Venta registrada por error: un admin, supervisor o encargado la anula con motivo; el comprobante vuelve a quedar disponible.

### CU-04. Registrar destete

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes (también admin y auxiliar) |
| Precondiciones | Existe el parto con crías vivas. |
| Postcondiciones | Destete registrado; las crías pasan a la categoría recría y a la jaula de recría de su sexo; los pesos quedan como pesaje; las crías muertas antes del destete se dan de baja. |

**Flujo principal**

1. Elige el parto (camada) a destetar; el panel lo sugiere con la alerta de destete pendiente (14 días, configurable).
2. Indica la fecha, los destetados por sexo, los muertos, los pesos y la jaula de recría de machos y de hembras.
3. Guarda; el sistema actualiza la categoría y la jaula de cada cría en una transacción.

**Flujos alternativos**

- **FA-4.1** Fecha inválida, futura o anterior al parto: se rechaza (400).
- **FA-4.2** Destetados más muertos superan las crías nacidas vivas: se rechaza.
- **FA-4.3** El parto no existe en la granja: se rechaza (404).

### CU-05. Registrar atención y tratamiento sanitario

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes, supervisor o zootecnista |
| Precondiciones | El destino del tratamiento existe: un animal, varios animales, una jaula o un área. |
| Postcondiciones | Tratamiento registrado *en curso* con su fecha de término (inicio + duración); al finalizar se cierra con una observación. Queda en el historial clínico de cada animal. |

**Flujo principal**

1. Elige el destino del tratamiento (animal, varios animales, jaula o área); el sistema obtiene los animales involucrados.
2. Indica tipo (preventivo o curativo), producto, dosis, vía, diagnóstico, responsable, fecha de inicio y duración en días.
3. Guarda; el sistema calcula la fecha de término y lo lista entre los tratamientos en curso.
4. Al terminar, registra el cierre con su motivo.

**Flujos alternativos**

- **FA-5.1** Falta producto, fecha de inicio o duración, o el tipo no es preventivo ni curativo: se rechaza.
- **FA-5.2** Fecha de inicio futura o duración menor o igual a cero: se rechaza (400).

### CU-06. Realizar toma y conciliación de inventario físico

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes o supervisor |
| Precondiciones | La jaula está activa en la granja. |
| Postcondiciones | Conteo registrado junto con lo que el sistema tenía en ese momento; la diferencia y el peso promedio de la muestra se calculan al consultar. |

**Flujo principal**

1. Elige la fecha y la jaula; el sistema muestra los machos y las hembras registrados en ella.
2. Ingresa los machos y las hembras contados y, opcionalmente, tres pesos de muestra; el sistema muestra la diferencia en el momento.
3. Guarda; el conteo aparece en el historial con la diferencia resaltada.

**Flujos alternativos**

- **FA-6.1** Faltan animales (diferencia negativa): las observaciones son obligatorias.
- **FA-6.2** Conteo no entero o negativo, o peso menor o igual a cero: se rechaza indicando el campo.
- **FA-6.3** Fecha futura o jaula de otra granja: se rechaza (400 / 404).

### CU-07. Registrar descarte zootécnico o mortalidad

| Elemento | Detalle |
|--------------|--------------------------------------------------------|
| Actor | Encargado del área de cuyes (mortalidad); admin, supervisor o encargado (descarte desde el ranking) |
| Precondiciones | El animal sigue en la población (activo o marcado como descarte). |
| Postcondiciones | Mortalidad: registro con causa y animal en `baja_muerte`. Descarte: animal en estado `descarte`, listo para la venta de descartes (CU-03). |

**Flujo principal (mortalidad)**

1. Registra la fecha, la causa y el animal, o la cantidad y categoría si es un lote.
2. El sistema registra la mortalidad y da de baja al animal en la misma transacción.

**Flujo principal (descarte)**

1. Desde el ranking de reproductores, marca un animal como *descarte* (fin de vida productiva, por ejemplo al llegar a 6 partos).
2. El sistema cambia su estado, deja una nota y lo muestra en la lista de descartes para la venta.

**Flujos alternativos**

- **FA-7.1** El animal ya fue vendido o murió: se rechaza (409) para evitar una doble baja.
- **FA-7.2** La cantidad de un lote supera la población de la categoría: se rechaza indicando cuántos hay.
- **FA-7.3** Mortalidad registrada por error: se anula con motivo.

## Glosario de términos del negocio

| Término | Definición |
|----------------|----------------------------------------------------------|
| Cuy (*Cavia porcellus*) | Roedor doméstico andino criado para investigación, mejora genética y carne; entidad central del sistema. |
| Código único | Identificador normalizado de cada animal dentro de su granja; se compara sin espacios ni diferencias de mayúsculas. |
| Jerarquía | Organización especie → granja → área → jaula → animal. |
| Granja | Unidad de crianza de una sola especie; cada usuario opera solo en las granjas asignadas. |
| Área | Agrupación de jaulas con un propósito (maternidad, recría, engorde, empadre). |
| Jaula / poza | Alojamiento con capacidad máxima; el exceso es **sobrecupo** y exige confirmación. |
| Raza | Línea genética: Perú (crecimiento), Andina (prolificidad), Inti, Tipo 2–4 y línea criolla negra. |
| Categoría / etapa | Fase productiva del animal: gazapo, recría, engorde, reproductor, reemplazo o venta. |
| Gazapo | Cría desde el nacimiento hasta el destete. |
| Destete | Separación de la madre a los 15 días con registro de peso y jaula de recría. |
| Recría / engorde | Desarrollo tras el destete y alimentación final hasta el peso comercial. |
| Empadre | Apareamiento de un macho con 5 a 8 hembras aptas en una jaula. |
| Gestación | Desarrollo embrionario; dura ~67 días. |
| Parto / camada | Alumbramiento de una hembra y conjunto de crías nacidas en él. |
| Reproductor / reemplazo | Animal del plantel de cría / animal seleccionado para sustituir a un reproductor descartado. |
| Pesaje | Peso en gramos, individual o por lote, comparado con el rango de su categoría. |
| Sanidad | Tratamiento preventivo (desparasitación, vitaminas) o curativo, con producto, dosis y duración. |
| Descarte | Salida planificada de un reproductor improductivo (6 partos, baja fertilidad, lesiones). |
| Mortalidad | Baja por muerte con fecha, jaula y causa. |
| Venta | Salida comercial respaldada por el comprobante de la caja UNAS (serie y número). |
| Inventario | Población activa calculada a partir de los eventos registrados. |
| Trazabilidad | Capacidad de reconstruir la vida completa de un cuy: genealogía, jaulas, pesajes, sanidad y salida. |
| Alerta | Aviso de un plazo próximo o vencido: parto próximo, destete pendiente, preñez sin confirmar o hembra disponible para empadre (plazos configurables). |

| Término técnico | Definición |
|----------------|----------------------------------------------------------|
| Monolito modular | Una sola aplicación desplegable dividida en módulos con fronteras explícitas. |
| Clean Architecture | Capas concéntricas donde el dominio no depende de frameworks ni de la base de datos. |
| Puerto / adaptador | Contrato abstracto del dominio / implementación concreta (repositorio, controlador REST). |
| Guard | Componente de NestJS que autoriza una petición (token, rol, granja, especie). |
| JWT | Token firmado que identifica al usuario en cada petición (`Authorization: Bearer`). |
| Borrado lógico | Marcar un registro como inactivo o anulado en lugar de eliminarlo. |
| Bitácora de auditoría | Registro de quién hizo qué y cuándo, con el valor anterior y el nuevo. |
| BPMN | Notación estándar para modelar procesos de negocio. |
| API REST | Interfaz HTTP con JSON bajo `/api/v1`; ORM: mapeo objeto-relacional (Prisma). |

# Diseño de aplicación

## Arquitectura de software

### Estilo elegido

**Monolito modular con Clean Architecture en cada módulo**, desplegado como **cliente-servidor de tres niveles**.

| Nivel | Estilo | Decisión |
|------------|-------------------|--------------------------------------------------------|
| Sistema | Cliente-servidor | Frontend Next.js 15 ↔ API REST NestJS 12 (`/api/v1`, JSON) ↔ PostgreSQL. |
| Backend | Monolito modular | Una unidad de despliegue con los módulos `platform`, `cuyes` y `shared`. |
| Módulo | Clean Architecture | Capas `presentation` → `application` → `domain` ← `infrastructure`; las dependencias apuntan al dominio. |

| Módulo | Responsabilidad |
|------------|--------------------------------------------------------|
| `platform` | Núcleo común a cualquier especie: autenticación, usuarios, granjas, especies, áreas, jaulas, animales, pesajes, sanidad, mortalidad y auditoría. |
| `cuyes` | Reglas de la especie: catálogos, empadres, partos, destetes, movimientos, ventas, inventario, alertas, ranking y reportes Excel. |
| `shared` | Núcleo compartido: acceso a datos, guards, decoradores, auditoría y reglas de área por especie. |

Cada petición protegida lleva el token (`Authorization: Bearer`) y el contexto de trabajo (`x-farm-id`, `x-species-id`). Dentro de cada módulo, los controladores validan y delegan; los servicios aplican el caso de uso; el dominio define reglas y **puertos**; y la infraestructura implementa esos puertos con Prisma o SQL. La unión puerto–implementación se resuelve en un solo lugar (`*.providers.ts`) con la inyección de dependencias de NestJS.

### Justificación

- **Monolito y no microservicios:** el sistema atiende a una unidad universitaria con un equipo pequeño. Operaciones como parto con alta de crías, destete con traslado o venta con baja de inventario tocan varias tablas y se resuelven con una transacción ACID local, sin coordinación distribuida.
- **Clean Architecture por módulo:** aísla las reglas zootécnicas (67 días de gestación, capacidad de jaulas, comprobante único) de la base de datos y del framework, y permite probar los casos de uso con repositorios falsos.
- **Módulo por especie:** una nueva especie se añade como módulo que reutiliza `platform` sin modificarlo.

| Alternativa | Ventaja | Motivo de descarte |
|--------------------|------------------------------|--------------------------------------------|
| Monolito en capas | Rápido de iniciar. | Mezcla lo común con lo propio de la especie; difícil de extender y probar. |
| Microservicios | Escalado independiente. | Sobrecarga operativa y pérdida de consistencia inmediata en inventario y partos. |
| Hexagonal sin módulos | Desacopla infraestructura. | No organiza el código por áreas de negocio. |
| **Monolito modular + Clean Architecture** | Cohesión por módulo, transacciones locales, bajo costo. | **Seleccionada.** |

### Atributos de calidad (ISO/IEC 25010)

| Característica | Decisión de diseño | Evidencia en el sistema |
|------------------|--------------------------------------|--------------------------------------------|
| Mantenibilidad | Módulos `platform`, `cuyes`, `shared` con cuatro capas idénticas; casos de uso dependientes de puertos. | Un cambio en reproducción no afecta a usuarios ni granjas; cambiar SQL por Prisma solo tocó la infraestructura. |
| Seguridad | JWT, bcrypt, roles, aislamiento por granja, Helmet, CORS, límite de peticiones, SQL parametrizado y bitácora con valores anterior y nuevo. | Un usuario solo ve sus granjas; cada escritura deja autor, fecha y cambio. |
| Fiabilidad | Transacciones ACID en un solo proceso y borrado lógico con reactivación. | Partos, destetes, ventas y traslados se completan o se revierten por completo. |
| Adecuación funcional | Reglas en el dominio (`NormalizedCode`, `PastDate`, `NewAnimal`) y confirmaciones explícitas. | Se impiden fechas futuras y códigos duplicados; sobrecupo y animales fuera de área piden confirmación. |
| Eficiencia de desempeño | Llamadas en proceso, consultas con índices y un solo backend. | Operaciones resueltas en una petición; infraestructura apta para un servidor universitario. |
| Compatibilidad | API REST JSON documentada con OpenAPI; reportes `.xlsx`. | Otro cliente podría consumir la misma API; los reportes abren en Excel y LibreOffice. |
| Usabilidad | Formularios guiados, mensajes por campo e interfaz adaptable. | Uso en escritorio, tableta y teléfono. |
| Portabilidad | Configuración por variables de entorno y esquema SQL idempotente. | Instalación en cualquier servidor con Node.js y PostgreSQL sin cambiar código. |

### Compromisos aceptados

| Compromiso aceptado | Impacto | Mejora prevista |
|--------------------|------------------------------|--------------------------------------------|
| Un único despliegue para todo el backend | No se escala un módulo por separado. | Suficiente para la carga esperada; las fronteras permiten extraer un módulo si fuera necesario. |
| Puertos con firmas genéricas (`any`) | Menor verificación de tipos. | Tipar los puertos con los contratos del Anexo A. |
| Pocas entidades de dominio | Algunas reglas viven en los servicios. | Moverlas a entidades (por ejemplo, `Jaula.puedeRecibir(n)`). |
| Servicios que devuelven códigos HTTP | La capa de aplicación conoce la web. | Errores de dominio y un filtro de excepciones en presentación. |
| `cuyes` consulta tablas de `platform` | Acoplamiento a nivel de base de datos. | Consumir los servicios públicos de `platform`. |
| Sin pruebas automatizadas | No se aprovecha la capacidad de prueba del diseño. | Pruebas unitarias de casos de uso con puertos falsos. |

## Diagrama de paquetes

Las flechas indican "depende de".

![Figura 13. Paquetes del frontend y sus dependencias](img/02f61cd3c3ef.png){ width=6.2in }

![Figura 14. Paquetes del backend y dependencias entre módulos](img/91d142c290db.png){ width=5.69in }

![Figura 15. Estructura interna de un módulo del backend](img/e4fe7f805bf7.png){ width=5.38in }

| Paquete | Contenido |
|--------------------|--------------------------------------------------------|
| `frontend/app`, `views` | Rutas (login, selección de granja, páginas protegidas) y pantallas de cada módulo. |
| `frontend/components`, `context`, `lib` | `Layout`, `FormModal`, `RoleGate`; sesión y granja activa (`AuthContext`); cliente HTTP y tema visual. |
| `*/presentation/http` | Controladores REST: traducen HTTP y delegan. |
| `*/application` | Servicios con los casos de uso. |
| `*/domain` | Entidades (`NewAnimal`), objetos de valor (`NormalizedCode`, `PastDate`), errores y puertos. |
| `*/infrastructure/persistence` | Repositorios que implementan los puertos. |
| `shared` | Guards, decoradores, `PrismaService`, `SqlBridge`, `AuditLogService`, reglas de área. |

**Reglas de dependencia:** el dominio no importa NestJS ni Prisma; `application` depende de `domain`, nunca de `infrastructure`; `cuyes` puede depender de `platform`, nunca a la inversa; `shared` no depende de ningún módulo de negocio.

## Diagrama de componentes

![Figura 16. Componentes de presentación](img/0f4f0adaf548.png){ width=3.19in }

![Figura 17. Componentes del servidor de API y base de datos](img/2bafc9dd9e29.png){ width=2.27in }

| Componente | Responsabilidad | Interfaz que ofrece |
|------------------|--------------------------------------------|------------------------------|
| Aplicación Next.js | Pantallas, rutas, control de roles en el cliente y sesión. | Web en el puerto 3000 |
| Cliente HTTP (axios) | Llamadas a la API con token, granja y especie. | `api.get/post/patch/put` |
| Pipeline HTTP | Cabeceras de seguridad, CORS, límite de peticiones y validación de entrada. | — |
| Guards de seguridad | Token, granjas del usuario, acceso a la granja, especie y rol. | `@FarmScope()`, `@Roles()` |
| Módulo Platform | Funciones comunes a todas las especies. | `/auth`, `/users`, `/farms`, `/areas`, `/recintos`, `/animals`, … |
| Módulo Cuyes | Procesos productivos y reproductivos. | `/cuyes/*` |
| Shared Kernel | Acceso a datos, auditoría y reglas de área. | `PrismaService`, `SqlBridge`, `AuditLogService` |
| Generador Excel | Reportes `.xlsx` en formato de la unidad. | `GET /cuyes/reports/*` |
| PostgreSQL | Persistencia, transacciones e integridad. | Puerto 5432 |

**Despliegue:** frontend (Node.js, puerto 3000), API (Node.js, puerto 3001) y PostgreSQL (puerto 5432), en una o varias máquinas, configurados por variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`). La especificación completa de la API está en el Anexo A.

## Aplicación de principios SOLID

| Principio | Aplicación en Cuy-System |
|------------|--------------------------------------------------------|
| **S** — Responsabilidad única | Controladores solo traducen HTTP; servicios solo coordinan su caso de uso; repositorios solo acceden a datos; cada guard verifica una sola condición; `AuditLogService` solo registra auditoría. |
| **O** — Abierto/cerrado | Una especie nueva es un módulo que importa `PlatformModule` sin modificarlo; las reglas de área se extienden implementando `AreaRulesPort` (implementación neutra en `platform`, propia en `cuyes`). |
| **L** — Sustitución de Liskov | Cada repositorio extiende la clase abstracta de su puerto; una implementación con Prisma, con SQL o falsa para pruebas es intercambiable sin que el servicio lo note. |
| **I** — Segregación de interfaces | Un puerto por agregado (`AreasRepositoryPort`, `AnimalsRepositoryPort`, …) en lugar de un repositorio general; decoradores granulares (`@CurrentUser()`, `@FarmId()`, `@Roles()`); `platform` solo exporta `RECINTOS_SERVICE`. |
| **D** — Inversión de dependencias | Los servicios dependen de puertos; la unión con la implementación se hace en `*.providers.ts` y los controladores reciben servicios por token (`@Inject(AREAS_SERVICE)`). |

# Diseño de datos

## Estrategia de persistencia

### Tipo de almacenamiento elegido

Cuy-System guarda toda su información en una **base de datos relacional PostgreSQL**. Es el único almacén del sistema: no se usan archivos, servicios en la nube ni una segunda base de datos. Los reportes en Excel no se almacenan; se generan en el momento a partir de la base de datos y se entregan al usuario como descarga.

| Decisión | Elección | Motivo principal |
|------------------|----------------------|--------------------------------------------|
| Modelo de datos | Relacional (SQL) | Los datos del criadero están fuertemente relacionados: un parto depende de una madre y de un empadre; una venta da de baja a un animal que ocupa una jaula. |
| Motor | PostgreSQL | Transacciones ACID, restricciones de integridad (`FOREIGN KEY`, `CHECK`, `UNIQUE`), soporte de JSON (`JSONB`) y licencia libre. |
| Acceso desde la aplicación | Prisma ORM + SQL parametrizado (`pg`) | Prisma para operaciones simples con tipos verificados; SQL para consultas de agregación (inventario, reportes) y operaciones de varias tablas. |
| Instancias | Una base de datos para todas las granjas | El volumen es pequeño (ver *Dimensionamiento*) y el aislamiento se resuelve con la columna `id_granja`. |

### Organización lógica de los datos

Las 25 tablas se agrupan igual que los módulos del backend, de modo que cada módulo es dueño de sus datos:

- **Seguridad y estructura** (`platform`): usuarios, granjas, áreas, jaulas (`recintos`) y los catálogos de especies, razas y categorías.
- **Animal y reproducción** (`platform` y `cuyes`): la ficha del animal y los eventos reproductivos (empadres, partos y destetes).
- **Eventos y salidas**: pesajes, tratamientos, movimientos, mortalidad, ventas y conteos de inventario.
- **Configuración y auditoría**: plazos de alertas, rangos de peso, ponderaciones del ranking y la bitácora de auditoría.

Todas las tablas operativas llevan la columna `id_granja`. El backend filtra cada consulta por la granja activa del usuario (cabecera `x-farm-id`), así que varias granjas comparten la misma base sin ver los datos de las demás.

### Gestión del esquema

El esquema se define en un único archivo SQL (`backend/database/schema.sql`) escrito de forma **idempotente**: usa `CREATE TABLE IF NOT EXISTS` y `ADD COLUMN IF NOT EXISTS`, por lo que puede ejecutarse varias veces sin error. Así, instalar el sistema o actualizarlo a una versión nueva es el mismo comando (`npm run db:migrate`). El archivo `schema.prisma` refleja ese esquema para que el código acceda a las tablas con tipos verificados, y `npm run db:seed` carga los datos iniciales (usuarios base, la especie *cuyes*, sus razas y categorías). La aplicación no modifica el esquema mientras funciona: toda estructura (tablas, columnas, índices y claves foráneas) se declara únicamente en ese archivo.

### Ciclo de vida de los datos

#### Flujo general

Todo dato del sistema recorre el mismo camino: se captura en un formulario, se valida en tres capas, se guarda dentro de una transacción junto con su registro de auditoría, se consulta en pantallas y reportes y, si deja de ser válido, se anula o desactiva en lugar de borrarse.

![Figura 18. Ciclo de vida de un dato en Cuy-System](img/cfb978aab7dc.png){ width=4.84in }

#### Creación

Un registro se crea de dos formas:

- **Alta directa:** el usuario registra un dato independiente, por ejemplo una jaula, un área o un animal comprado.
- **Alta derivada:** un evento crea o cambia otros registros en la misma transacción. Al registrar un **parto** se crea el parto y, por cada cría, un animal nuevo con `id_parto_origen` apuntando a ese parto (así queda su genealogía). Un **destete** ubica a las crías en sus jaulas de recría. Una **venta** o una **mortalidad** cambian el estado del animal. Si cualquier paso falla, la transacción se revierte completa y no quedan datos a medias.

#### Lectura

Las consultas siempre se limitan a la granja activa. Los mismos datos alimentan el panel de indicadores, el inventario (por área, por categoría y resumen mensual), la ficha 360° del animal con su pedigrí, la búsqueda global y los reportes en Excel. Ninguna cifra se guarda precalculada: el inventario se obtiene contando los animales activos y sumando los eventos del periodo, por lo que todas las pantallas muestran siempre el mismo número.

#### Actualización

Las ediciones guardan en la bitácora el estado anterior y el nuevo del registro. El cambio más importante es el **estado del animal**, que sigue el ciclo mostrado en la figura: todo animal nace o ingresa como `activo` y sale de la población por una de tres vías, registrando `fecha_baja` y el motivo.

![Figura 19. Estados de un animal en la base de datos](img/83df877dfb25.png){ width=6.2in }

#### Eliminación

Ningún dato de negocio se borra físicamente; así se conserva la trazabilidad que pide el laboratorio.

- **Desactivación** (`activo` o `activa` = falso): usuarios, granjas, áreas, jaulas, razas y categorías. El registro deja de aparecer en las listas, pero su historial sigue intacto y puede reactivarse.
- **Anulación** (`anulado` = verdadero más `motivo_anulacion`): ventas y mortalidad. El registro deja de contar en el inventario, pero queda visible como anulado.
- **Única eliminación física:** la tabla puente `usuario_granjas`, que se reemplaza al reasignar las granjas de un usuario. Solo guarda permisos, y el cambio queda registrado en la auditoría.

#### Operaciones por entidad y rol

C = crear, R = leer, U = actualizar, D = desactivar o anular. Todos los roles con acceso a la granja pueden leer.

| Entidad | C | R | U | D | Quién escribe |
|--------------------|----|----|----|----------|----------------------------------------|
| usuarios | ✓ | ✓ | ✓ | lógico | superadmin, admin |
| granjas | ✓ | ✓ | ✓ | lógico | superadmin |
| áreas y jaulas | ✓ | ✓ | ✓ | lógico | superadmin, admin, encargado |
| razas y categorías | ✓ | ✓ | — | lógico | superadmin, admin |
| animales | ✓ | ✓ | ✓ | por estado | superadmin, admin, encargado, auxiliar |
| empadres, partos, destetes | ✓ | ✓ | ✓ | — | superadmin, admin, encargado, auxiliar |
| pesajes, tratamientos | ✓ | ✓ | ✓ | — | incluye al supervisor |
| movimientos | ✓ | ✓ | — | — | encargado y auxiliar reubican; admin y supervisor trasladan entre granjas |
| mortalidad, ventas | ✓ | ✓ | — | anulación | registran: encargado, auxiliar; anulan: admin, supervisor, encargado |
| conteos de inventario | ✓ | ✓ | — | — | todos los roles operativos |
| configuración (alertas, rangos, ranking) | ✓ | ✓ | ✓ | — | superadmin, admin, supervisor |
| audit_log | ✓ | ✓ | — | — | solo el sistema (ningún usuario) |

### Justificación de la elección

#### Comparativa SQL vs. NoSQL vs. híbrido

| Criterio | Relacional (PostgreSQL) | NoSQL documental (p. ej. MongoDB) | Híbrido (SQL + NoSQL) |
|----------------------|------------------------|------------------------|------------------------|
| Relaciones del dominio (madre–parto–crías, animal–jaula) | Claves foráneas nativas | Referencias manuales o datos duplicados | Repartidas entre dos motores |
| Operaciones que cambian varias tablas | Transacción ACID única | Limitada; más compleja entre colecciones | Requiere coordinar dos motores |
| Inventario y reportes (agregaciones) | SQL con `JOIN` y `GROUP BY` | Pipelines de agregación más complejos | Posible, con duplicación de datos |
| Datos de estructura variable | `JSONB` cuando se necesita | Natural | Natural |
| Volumen esperado (< 0,5 GB) | Holgado | Holgado | Sobredimensionado |
| Operación y respaldo | Un motor, una copia | Un motor, una copia | Dos motores, dos copias |
| Conocimiento del equipo | Alto (curso de Base de Datos) | Medio | Medio |

#### Decisión

Se elige el **modelo relacional en PostgreSQL**, usando `JSONB` solo para la bitácora de auditoría. El dominio es estructurado y muy relacionado, la exactitud del inventario depende de transacciones atómicas y el volumen es pequeño; un motor NoSQL no aporta ventajas aquí y un modelo híbrido duplicaría la operación y los respaldos sin necesidad. `JSONB` cubre el único caso de datos de estructura variable dentro del mismo motor.

#### Riesgos y mejoras previstas

| Riesgo | Mejora prevista |
|------------------------------|--------------------------------------------------|
| El respaldo depende de que se programe en el servidor | Incluir la tarea programada en la instalación (por ejemplo, en el empaquetado con Docker). |
| El esquema se actualiza con un único archivo | Pasar a migraciones versionadas para registrar cada cambio. |
| `alertas_descarte.id_referencia` no tiene clave foránea | Es intencional (apunta a empadres o partos); la aplicación valida el valor. |
| `audit_log` crece más que el resto | Archivar los años cerrados si supera el umbral definido. |

## Modelo entidad-relación

### Diagrama entidad-relación

El modelo físico tiene **25 tablas**. Para que sea legible se presenta en cuatro vistas que coinciden con la organización lógica descrita en la estrategia de persistencia. En cada vista, las tablas de otras vistas aparecen reducidas a su clave. Por claridad se omiten las columnas de control (`created_by`, `created_at`, `updated_at`) y la relación de cada tabla operativa con `granjas` mediante `id_granja`; todas figuran en el diccionario de datos. Notación: `||` uno, `o|` cero o uno, `o{` cero o muchos.

![Figura 20. MER — Seguridad y estructura](img/ab64c84949b3.png){ width=6.2in }

![Figura 21. MER — Animal y reproducción](img/cf0e6acb7eee.png){ width=4.45in }

![Figura 22. MER — Eventos y salidas](img/8a97df2ac1c7.png){ width=6.2in }

![Figura 23. MER — Configuración y auditoría](img/3c04353ad08a.png){ width=6.2in }

### Del modelo conceptual al modelo físico

El modelo conceptual del dominio (Entregable 1) describe el negocio; el físico lo implementa con algunos ajustes que evitan duplicar información:

| Concepto del dominio | Implementación física | Ajuste y motivo |
|--------------------|----------------------------|--------------------------------------------|
| CUY | `animales` | Se generaliza a cualquier especie; el código se normaliza en `codigo_norm` para evitar duplicados como `UM24` / `UM 24`. |
| RAZA, JAULA | `razas`, `recintos` (dentro de `areas`) | Se añade el nivel *área* para agrupar jaulas por propósito. |
| EMPADRE / DETALLE_EMPADRE | `empadres` / `empadre_hembras` | Igual al modelo; la hembra guarda su resultado (preñez, vacía, aborto). |
| PARTO, NACIMIENTO, CAMADA | `partos` + `animales.id_parto_origen` | Los tres conceptos describen el mismo evento: se fusionan en `partos`, y cada cría apunta a su parto (genealogía). |
| DESTETE | `destetes` | Se registra por camada (un destete por parto), no por cría. |
| MOVIMIENTO_JAULA | `movimientos` | Se amplía para traslados entre granjas (`tipo = transfer`). |
| PESO, SANIDAD | `pesajes`, `tratamientos` | Un pesaje por fila; el tratamiento puede aplicarse a un animal, una jaula o un área. |
| MORTALIDAD, VENTA | `mortalidad`, `ventas` | Admiten registro individual o por lote, y anulación con motivo. |
| DESCARTE | `animales.estado = 'descarte'` + `destino_descarte` | No necesita tabla propia: es un estado del animal con fecha y motivo. |
| SELECCION_REPRODUCTOR | ranking (`ranking_config`) + cambio de categoría a *reemplazo* | La selección se calcula con el ranking; el resultado se guarda en el animal y en la auditoría. |
| INVENTARIO | `conteos_inventario` | Guarda el conteo físico y lo registrado en ese momento; la diferencia se calcula al consultar. |

### Integridad referencial

La base de datos —no solo la aplicación— impide datos inconsistentes mediante tres tipos de restricciones:

| Mecanismo | Dónde se aplica | Efecto |
|----------------------|------------------------------|--------------------------------------------|
| Claves foráneas (`FOREIGN KEY`) | Toda relación entre tablas | No se puede registrar un parto de una hembra inexistente ni un pesaje de un animal que no existe. |
| `ON DELETE CASCADE` | Dependientes puros: `usuario_granjas`, `areas`, `recintos`, `empadre_hembras`, `destetes`, `animal_particularidades` y configuración | Si se eliminara el registro padre, sus dependientes no quedan huérfanos. En la práctica no se borra (borrado lógico). |
| `ON DELETE SET NULL` | `recintos.id_area` | Si un área desaparece, sus jaulas quedan sin área en lugar de borrarse. |
| `UNIQUE` | `email`; código de animal por granja; nombre de área por granja; código de jaula por área; raza y categoría por especie; hembra por empadre | Evita duplicados que en Excel eran frecuentes. |
| `CHECK` | Rol, sexo (M/H), estado del animal, resultado de empadre, tipo de tratamiento y de movimiento; cantidades y pesos mayores que cero | Solo se aceptan valores del dominio. |

Las claves foráneas que se agregaron después de crear el esquema (jaulas de recría del destete, animal de una alerta ocultada y granja de la bitácora) se declaran `NOT VALID` y luego se validan: así la actualización no falla si existieran datos antiguos inconsistentes, y los registros nuevos siempre se controlan. La única referencia sin clave foránea es `alertas_descarte.id_referencia`, de forma intencional, porque puede apuntar a un empadre o a un parto.

Dos reglas de negocio requieren más que una restricción declarativa y se garantizan dentro de la transacción:

- **Comprobante único:** antes de registrar una venta se bloquea el comprobante (`pg_advisory_xact_lock`) y se verifica que ninguna venta no anulada lo haya usado. No puede ser un índice `UNIQUE`, porque una venta de descartes guarda una fila por animal con el mismo comprobante.
- **Una sola baja por animal:** la venta y la mortalidad solo cambian el estado de un animal que sigue en la población; si otro usuario ya lo dio de baja, la operación se revierte.

### Normalización

#### Punto de partida: las planillas de Excel

La unidad registra cada reproductora en una hoja de Excel (planilla *Registro Individual de Cuyes*). El encabezado de la hoja tiene los datos de la hembra —**Código:** U01 · **Jaula:** "Jaula: 01" · **Raza:** Perú · **Particularidades:** "MURIO"— y debajo hay una fila por parto:

| Parto | Macho | Empadre | Nacimiento | Camada | Muertos | Pesos machos (g) | Pesos hembras (g) | Destete |
|-------|-------|---------|-----------|--------|--------|-----------|-----------|---------|
| 1 | M12 | 10/01/25 | 18/03/25 | 3 | 0 | 120, 115 | 110 | 02/04/25 |
| 2 | M12 | 05/04/25 | 11/06/25 | 2 | 1 | 125 | — | 26/06/25 |

Esta estructura tiene los problemas clásicos de una relación sin normalizar: celdas con varios valores ("120, 115"), texto mezclado con datos ("Jaula: 01"), una hoja distinta por hembra en lugar de una tabla común, y datos del macho y de la fecha de empadre que se repiten en las hojas de todas las hembras del mismo lote.

#### Primera forma normal (1FN)

*Regla: cada celda contiene un solo valor y no hay grupos repetidos.*

- Cada parto pasa a ser una fila de la tabla `partos`, en lugar de columnas repetidas en la hoja de la hembra.
- "Jaula: 01" se separa en una referencia a la jaula (`id_jaula`); las particularidades, que son varias notas fechadas, pasan a `animal_particularidades`.
- Las hembras de un empadre se registran una por fila en `empadre_hembras`.

#### Segunda forma normal (2FN)

*Regla: todo atributo depende de la clave completa.*

Si un parto se identificara por *(código de hembra, número de parto)*, la raza y la jaula dependerían solo de la hembra, no del parto. Por eso esos datos se trasladan a `animales`, y cada tabla usa una clave sustituta (`id`) con las referencias necesarias. En las tablas puente (`usuario_granjas`, `empadre_hembras`) los únicos atributos propios, como `resultado`, dependen de la pareja completa.

#### Tercera forma normal (3FN)

*Regla: ningún atributo depende de otro atributo que no sea la clave.*

- El macho y la fecha de empadre dependen del **empadre**, no del parto: se guardan en `empadres` y el parto solo referencia `id_empadre`.
- El nombre de la raza depende de la raza, y la especie de la raza depende de la raza: catálogos `razas`, `categorias` y `especies`.
- La edad, el total de la camada y la diferencia de un conteo se calculan a partir de otros campos, por lo que no se almacenan. Por ejemplo, la diferencia de `conteos_inventario` se obtiene restando lo registrado de lo contado.

#### Desnormalizaciones controladas

Algunos datos se guardan de forma redundante a propósito. Cada caso está justificado:

| Dato | Forma normal que relaja | Por qué se mantiene |
|--------------------|------------|----------------------------------------------|
| `peso_m1..m3`, `peso_h1..h3` en partos y destetes | 1FN (grupo repetido) | La plantilla oficial registra hasta tres crías por sexo; el seguimiento individual posterior se hace en `pesajes`. |
| `destetes.peso_promedio` | 3FN (dato derivado) | Se registra cuando no se pesan crías individuales. |
| `empadres.cantidad_hembras`, `cantidad_prenadas` | 3FN (derivable de `empadre_hembras`) | Copia al cierre del empadre que agiliza el ranking de machos. |
| `ventas` y `mortalidad`: `clasificacion`, `categoria` en texto | 3FN | Las bajas por lote no tienen un animal asociado y el texto conserva cómo se registró aunque el catálogo cambie. |
| `animales.codigo_norm` | 3FN (derivado de `codigo`) | Permite un índice único que impide duplicados con distinta escritura. |
| `tratamientos.fecha_termino` | 3FN (inicio + duración) | Permite consultar rápido los tratamientos en curso y sus alertas. |

`conteos_inventario.machos_sistema` y `hembras_sistema` no son redundancia: guardan lo que el sistema tenía **en ese momento**, un dato histórico que ya no podría recalcularse.

## Modelo NoSQL (si aplica)

### Aplicabilidad

No se utiliza una base de datos NoSQL. El núcleo del negocio exige relaciones obligatorias (madre–parto–crías, animal–jaula), transacciones que cambian varias tablas a la vez y reportes que cruzan datos. Un modelo de documentos tendría que duplicar esas relaciones dentro de cada documento y mantenerlas sincronizadas por código, justamente el problema que el sistema busca eliminar. La comparación completa está en *Justificación de la elección*.

### Componente semiestructurado: la bitácora de auditoría

La única información sin estructura fija es la **copia del registro antes y después de cada cambio**, porque cada tabla tiene columnas distintas. Para ese caso se usa el tipo `JSONB` de PostgreSQL en `audit_log.antes` y `audit_log.despues`: cada fila guarda un documento JSON, como lo haría una base documental, pero dentro de la misma base relacional y de la misma transacción. Ejemplo de un registro al cambiar un animal de jaula:

```json
{
  "accion": "editar",
  "entidad": "animal",
  "id_entidad": 157,
  "antes":   { "codigo": "U101", "id_jaula": 20, "estado": "activo" },
  "despues": { "codigo": "U101", "id_jaula": 23, "estado": "activo" },
  "detalle": "Reubicación a jaula 23"
}
```

Este enfoque aporta la flexibilidad documental donde se necesita sin perder las ventajas del modelo relacional en el resto del sistema.

## Diccionario de datos

### Convenciones

- Nombres de tablas y columnas en español, en minúsculas y separados por guion bajo (`fecha_parto`).
- Clave primaria `id` autoincremental (`SERIAL`) en todas las tablas; las claves foráneas empiezan con `id_`.
- Fechas de eventos en `DATE`; fechas de control en `TIMESTAMP`; pesos en gramos con `NUMERIC(10,2)`.
- Columnas de control: `created_by` (autor), `created_at` y `updated_at`.
- Borrado lógico con `activo`/`activa` (catálogos y estructura) o `anulado` (ventas y mortalidad).

### Tablas

<!-- diccionario:inicio -->

#### Seguridad y estructura

**`usuarios`** — Cuentas de acceso al sistema y su rol.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `nombre` | VARCHAR(100) | No | — | — | Nombre visible. |
| `email` | VARCHAR(150) | No | — | Único | Correo de inicio de sesión (único). |
| `password_hash` | VARCHAR(255) | No | — | — | Contraseña cifrada con bcrypt; nunca se guarda en texto plano. |
| `rol` | VARCHAR(20) | No | — | Valores: superadmin, admin, encargado, supervisor, auxiliar | Rol que determina los permisos. |
| `activo` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dado de baja (borrado lógico). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó la cuenta. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

**`usuario_granjas`** — Granjas en las que puede operar cada usuario (relación N:M).

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_usuario` | INTEGER | No | FK → usuarios | Borra en cascada | Usuario autorizado. |
| `id_granja` | INTEGER | No | FK → granjas | Borra en cascada | Granja a la que tiene acceso. |

Unicidad compuesta: (`id_usuario`, `id_granja`).

**`especies`** — Especies que maneja la plataforma (catálogo raíz).

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `nombre` | VARCHAR(50) | No | — | Único | Nombre visible. |
| `activo` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dado de baja (borrado lógico). |

**`granjas`** — Unidades de crianza; cada una pertenece a una especie.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `nombre` | VARCHAR(100) | No | — | Único | Nombre visible. |
| `id_especie` | INTEGER | No | FK → especies | — | Especie que se cría en la granja. |
| `ubicacion` | VARCHAR(200) | Sí | — | — | Ubicación física de la granja. |
| `activa` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dada de baja (borrado lógico). |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

**`areas`** — Agrupaciones de jaulas dentro de una granja según su propósito.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | Borra en cascada | Granja a la que pertenece el registro. |
| `nombre` | VARCHAR(100) | No | — | — | Nombre visible. |
| `proposito` | VARCHAR(50) | No | — | — | Uso del área (maternidad, recría, engorde, empadre…). |
| `activa` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dada de baja (borrado lógico). |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

Unicidad compuesta: (`id_granja`, `nombre`).

**`recintos`** — Jaulas o pozas donde se alojan los animales.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_area` | INTEGER | Sí | FK → areas | Queda nulo al borrar | Área a la que pertenece la jaula (opcional). |
| `codigo` | VARCHAR(50) | No | — | — | Código visible de la jaula, único dentro del área. |
| `capacidad_maxima` | INTEGER | Sí | — | — | Animales que admite; superarla exige confirmación. |
| `activa` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dada de baja (borrado lógico). |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |
| `id_granja` | INTEGER | No | FK → granjas | Borra en cascada | Granja a la que pertenece el registro. |

Unicidad compuesta: (`id_area`, `codigo`).

**`razas`** — Catálogo de razas o líneas genéticas por especie.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_especie` | INTEGER | No | FK → especies | — | Especie a la que pertenece. |
| `nombre` | VARCHAR(100) | No | — | — | Nombre visible. |
| `activa` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dada de baja (borrado lógico). |

Unicidad compuesta: (`id_especie`, `nombre`).

**`categorias`** — Catálogo de etapas o categorías productivas por especie.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_especie` | INTEGER | No | FK → especies | — | Especie a la que pertenece. |
| `nombre` | VARCHAR(100) | No | — | — | Nombre visible. |
| `proposito_area` | VARCHAR(50) | Sí | — | — | Propósito de área donde debe ubicarse esta categoría. |
| `activa` | BOOLEAN | Sí | — | Defecto: true | Falso si fue dada de baja (borrado lógico). |

Unicidad compuesta: (`id_especie`, `nombre`).

#### Animal y reproducción

**`animales`** — Ficha individual de cada animal: identidad, ubicación, estado y origen.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `codigo` | VARCHAR(50) | No | — | — | Código del animal tal como se escribió. |
| `codigo_norm` | VARCHAR(50) | No | — | — | Código normalizado (mayúsculas, sin espacios) para búsqueda y unicidad. |
| `sexo` | CHAR(1) | No | — | Valores: M, H | M = macho, H = hembra. |
| `id_raza` | INTEGER | Sí | FK → razas | — | Raza del animal. |
| `id_categoria` | INTEGER | Sí | FK → categorias | — | Categoría productiva actual. |
| `id_jaula` | INTEGER | Sí | FK → recintos | — | Jaula donde se encuentra. |
| `fecha_nacimiento` | DATE | Sí | — | — | Fecha de nacimiento. |
| `estado` | VARCHAR(20) | Sí | — | Valores: activo, baja_muerte, baja_venta, descarte; Defecto: 'activo' | Situación del animal en la población. |
| `fecha_baja` | DATE | Sí | — | — | Fecha en que salió de la población activa. |
| `motivo_baja` | TEXT | Sí | — | — | Causa de la baja. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |
| `id_parto_origen` | INTEGER | Sí | FK → partos | — | Parto en el que nació (genealogía: madre y empadre). |
| `destino_descarte` | VARCHAR(100) | Sí | — | — | Destino del animal descartado (venta, consumo…). |

Unicidad compuesta: (`id_granja`, `codigo_norm`).

**`animal_particularidades`** — Notas fechadas sobre un animal (rasgos, eventos, observaciones).

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_animal` | INTEGER | No | FK → animales | Borra en cascada | Animal involucrado. |
| `fecha` | DATE | No | — | Defecto: fecha actual | Fecha de la nota. |
| `texto` | TEXT | No | — | — | Contenido de la nota. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

**`empadres`** — Lote de apareamiento de un macho en una jaula.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_macho` | INTEGER | Sí | FK → animales | — | Macho reproductor del lote. |
| `id_jaula` | INTEGER | Sí | FK → recintos | — | Jaula del empadre. |
| `fecha_empadre` | DATE | No | — | — | Inicio del empadre; base para proyectar el parto (+67 días). |
| `peso_antes` | NUMERIC(10,2) | Sí | — | — | Peso del macho al iniciar (g). |
| `peso_despues` | NUMERIC(10,2) | Sí | — | — | Peso del macho al cerrar (g). |
| `cantidad_hembras` | INTEGER | Sí | — | — | Hembras del lote al cerrar (copia para el ranking). |
| `cantidad_prenadas` | INTEGER | Sí | — | — | Hembras preñadas al cerrar (copia para el ranking). |
| `notas` | TEXT | Sí | — | — | Comentarios del empadre. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

**`empadre_hembras`** — Hembras que participan en cada empadre y su resultado.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_empadre` | INTEGER | No | FK → empadres | Borra en cascada | Empadre al que pertenece. |
| `id_hembra` | INTEGER | No | FK → animales | — | Hembra participante. |
| `resultado` | VARCHAR(20) | Sí | — | Valores: abierto, prenez, vacia, aborto, murio; Defecto: 'abierto' | Resultado reproductivo de la hembra en el lote. |

Unicidad compuesta: (`id_empadre`, `id_hembra`).

**`partos`** — Parto de una hembra con la camada nacida.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_hembra` | INTEGER | No | FK → animales | — | Madre. |
| `id_empadre` | INTEGER | Sí | FK → empadres | — | Empadre que originó el parto (padre). |
| `fecha_parto` | DATE | No | — | — | Fecha del parto. |
| `vivos_m` | INTEGER | Sí | — | Defecto: 0 | Crías macho nacidas vivas. |
| `vivos_h` | INTEGER | Sí | — | Defecto: 0 | Crías hembra nacidas vivas. |
| `muertos` | INTEGER | Sí | — | Defecto: 0 | Crías nacidas muertas. |
| `peso_m1` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 1 (g). |
| `peso_m2` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 2 (g). |
| `peso_m3` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 3 (g). |
| `peso_h1` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 1 (g). |
| `peso_h2` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 2 (g). |
| `peso_h3` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 3 (g). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

**`destetes`** — Destete de la camada de un parto.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_parto` | INTEGER | No | FK → partos | Borra en cascada | Parto cuya camada se desteta. |
| `fecha_destete` | DATE | No | — | — | Fecha del destete. |
| `destetados_m` | INTEGER | Sí | — | Defecto: 0 | Machos destetados. |
| `destetados_h` | INTEGER | Sí | — | Defecto: 0 | Hembras destetadas. |
| `muertos` | INTEGER | Sí | — | Defecto: 0 | Crías muertas antes del destete. |
| `peso_m1` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 1 (g). |
| `peso_m2` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 2 (g). |
| `peso_m3` | NUMERIC(10,2) | Sí | — | — | Peso de la cría macho 3 (g). |
| `peso_h1` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 1 (g). |
| `peso_h2` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 2 (g). |
| `peso_h3` | NUMERIC(10,2) | Sí | — | — | Peso de la cría hembra 3 (g). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `peso_promedio` | NUMERIC(10,2) | Sí | — | — | Peso promedio de la camada (g). |
| `id_jaula_m` | INTEGER | Sí | FK → recintos | — | Jaula de recría de los machos. |
| `id_jaula_h` | INTEGER | Sí | FK → recintos | — | Jaula de recría de las hembras. |

#### Eventos y salidas

**`pesajes`** — Controles de peso individuales.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_animal` | INTEGER | No | FK → animales | — | Animal involucrado. |
| `fecha` | DATE | No | — | — | Fecha del evento. |
| `peso_gramos` | NUMERIC(10,2) | No | — | > 0 | Peso registrado en gramos. |
| `fuera_rango` | BOOLEAN | Sí | — | Defecto: false | Verdadero si quedó fuera del rango de su categoría (se confirmó). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

**`tratamientos`** — Tratamientos sanitarios a un animal, jaula o área.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_animal` | INTEGER | Sí | FK → animales | — | Animal tratado (si es individual). |
| `id_jaula` | INTEGER | Sí | FK → recintos | — | Jaula tratada (si es colectivo). |
| `id_area` | INTEGER | Sí | FK → areas | — | Área tratada (si es colectivo). |
| `tipo` | VARCHAR(20) | No | — | Valores: preventivo, curativo | Preventivo o curativo. |
| `producto` | VARCHAR(150) | No | — | — | Medicamento o producto aplicado. |
| `dosis` | VARCHAR(100) | Sí | — | — | Dosis aplicada. |
| `via` | VARCHAR(50) | Sí | — | — | Vía de administración. |
| `fecha_inicio` | DATE | No | — | — | Inicio del tratamiento. |
| `duracion_dias` | INTEGER | No | — | > 0 | Duración en días. |
| `fecha_termino` | DATE | No | — | — | Fin previsto (inicio + duración). |
| `diagnostico` | TEXT | Sí | — | — | Diagnóstico que motivó el tratamiento. |
| `responsable` | VARCHAR(100) | Sí | — | — | Persona que lo indicó o aplicó. |
| `estado` | VARCHAR(20) | Sí | — | Valores: en_curso, terminado; Defecto: 'en_curso' | En curso o terminado. |
| `motivo_cierre` | TEXT | Sí | — | — | Observación al finalizar. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

**`movimientos`** — Traslados de animales entre jaulas o entre granjas.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `tipo` | VARCHAR(20) | No | — | Valores: traslado, transferencia | relocate = dentro de la granja; transfer = a otra granja. |
| `id_animal` | INTEGER | No | FK → animales | — | Animal involucrado. |
| `id_granja_origen` | INTEGER | Sí | FK → granjas | — | Granja de origen. |
| `id_granja_destino` | INTEGER | Sí | FK → granjas | — | Granja de destino. |
| `id_jaula_origen` | INTEGER | Sí | FK → recintos | — | Jaula de origen. |
| `id_jaula_destino` | INTEGER | Sí | FK → recintos | — | Jaula de destino. |
| `fecha` | DATE | No | — | — | Fecha del evento. |
| `motivo` | TEXT | Sí | — | — | Motivo del traslado. |
| `excedio_capacidad` | BOOLEAN | Sí | — | Defecto: false | Verdadero si se confirmó un sobrecupo. |
| `aviso_area` | BOOLEAN | Sí | — | Defecto: false | Verdadero si el animal quedó fuera del área de su categoría. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

**`mortalidad`** — Bajas por muerte (individuales o por lote).

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_animal` | INTEGER | Sí | FK → animales | — | Animal fallecido (vacío si es un lote). |
| `fecha` | DATE | No | — | — | Fecha del evento. |
| `clasificacion` | VARCHAR(50) | Sí | — | — | Clasificación del lote (raza o grupo) tal como se registró. |
| `categoria` | VARCHAR(50) | Sí | — | — | Categoría productiva tal como se registró (texto histórico). |
| `cantidad` | INTEGER | No | — | > 0 | Número de animales del registro. |
| `causa` | TEXT | Sí | — | — | Causa probable de la muerte. |
| `id_jaula` | INTEGER | Sí | FK → recintos | — | Jaula donde ocurrió. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `tipo` | VARCHAR(20) | Sí | — | Defecto: 'general' | Tipo de baja (general, perinatal, destete…). |
| `observaciones` | TEXT | Sí | — | — | Comentarios libres. |
| `anulado` | BOOLEAN | Sí | — | Defecto: false | Verdadero si el registro fue anulado (no cuenta en los cálculos). |
| `motivo_anulacion` | TEXT | Sí | — | — | Justificación de la anulación. |

**`ventas`** — Salidas comerciales respaldadas por comprobante.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_animal` | INTEGER | Sí | FK → animales | — | Animal vendido (vacío si es un lote). |
| `fecha` | DATE | No | — | — | Fecha del evento. |
| `clasificacion` | VARCHAR(50) | Sí | — | — | Clasificación del lote (raza o grupo) tal como se registró. |
| `categoria` | VARCHAR(50) | Sí | — | — | Categoría productiva tal como se registró (texto histórico). |
| `cantidad` | INTEGER | No | — | > 0 | Número de animales del registro. |
| `comprador` | VARCHAR(100) | Sí | — | — | Nombre del comprador. |
| `precio` | NUMERIC(10,2) | Sí | — | — | Importe total (S/). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `tipo_comprobante` | VARCHAR(20) | Sí | — | — | Tipo de comprobante emitido por la caja UNAS. |
| `serie` | VARCHAR(10) | Sí | — | — | Serie del comprobante. |
| `numero` | VARCHAR(20) | Sí | — | — | Número del comprobante. |
| `observaciones` | TEXT | Sí | — | — | Comentarios libres. |
| `estado` | VARCHAR(20) | Sí | — | Defecto: 'registrada' | Estado de la venta. |
| `anulado` | BOOLEAN | Sí | — | Defecto: false | Verdadero si el registro fue anulado (no cuenta en los cálculos). |
| `motivo_anulacion` | TEXT | Sí | — | — | Justificación de la anulación. |

**`conteos_inventario`** — Conteos físicos de jaulas conciliados con lo registrado (CU-06).

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `id_jaula` | INTEGER | No | FK → recintos | — | Jaula contada. |
| `fecha` | DATE | No | — | — | Fecha del conteo. |
| `machos_contados` | INTEGER | No | — | ≥ 0 | Machos contados físicamente. |
| `hembras_contadas` | INTEGER | No | — | ≥ 0 | Hembras contadas físicamente. |
| `machos_sistema` | INTEGER | No | — | ≥ 0 | Machos registrados en el sistema al momento del conteo. |
| `hembras_sistema` | INTEGER | No | — | ≥ 0 | Hembras registradas en el sistema al momento del conteo. |
| `peso_muestra1` | NUMERIC(10,2) | Sí | — | > 0 | Peso de la muestra 1 (g). |
| `peso_muestra2` | NUMERIC(10,2) | Sí | — | > 0 | Peso de la muestra 2 (g). |
| `peso_muestra3` | NUMERIC(10,2) | Sí | — | > 0 | Peso de la muestra 3 (g). |
| `observaciones` | TEXT | Sí | — | — | Causa probable de la diferencia (obligatoria si faltan animales). |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

#### Configuración y auditoría

**`alerta_config`** — Plazos en días que disparan cada tipo de alerta, por granja.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | Borra en cascada | Granja a la que pertenece el registro. |
| `tipo` | VARCHAR(50) | No | — | — | Tipo de alerta (parto, destete, pesaje…). |
| `dias` | INTEGER | No | — | Defecto: 0 | Días que deben pasar para disparar la alerta. |
| `activo` | BOOLEAN | Sí | — | Defecto: true | Si la alerta está habilitada. |

Unicidad compuesta: (`id_granja`, `tipo`).

**`peso_rangos`** — Rango de peso esperado por categoría, por granja.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | Borra en cascada | Granja a la que pertenece el registro. |
| `categoria` | VARCHAR(50) | No | — | — | Categoría a la que aplica el rango. |
| `min` | INTEGER | No | — | — | Peso mínimo esperado (g). |
| `max` | INTEGER | No | — | — | Peso máximo esperado (g). |
| `updated_by` | INTEGER | Sí | FK → usuarios | — | Usuario que actualizó el rango. |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

Unicidad compuesta: (`id_granja`, `categoria`).

**`ranking_config`** — Ponderaciones del ranking de reproductores, por granja.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | Único; Borra en cascada | Granja a la que pertenece el registro. |
| `peso_partos` | NUMERIC(6,2) | Sí | — | Defecto: 20 | Ponderación del número de partos (%). |
| `peso_camada` | NUMERIC(6,2) | Sí | — | Defecto: 25 | Ponderación del tamaño de camada (%). |
| `peso_destete` | NUMERIC(6,2) | Sí | — | Defecto: 20 | Ponderación de crías destetadas (%). |
| `peso_mortalidad` | NUMERIC(6,2) | Sí | — | Defecto: 15 | Ponderación de la mortalidad de crías (%). |
| `peso_peso_nac` | NUMERIC(6,2) | Sí | — | Defecto: 10 | Ponderación del peso al nacer (%). |
| `peso_peso_dest` | NUMERIC(6,2) | Sí | — | Defecto: 10 | Ponderación del peso al destete (%). |
| `peso_prenez_macho` | NUMERIC(6,2) | Sí | — | Defecto: 30 | Ponderación de la tasa de preñez del macho (%). |
| `updated_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de la última modificación. |

**`alertas_descarte`** — Alertas que un usuario ocultó del panel (descartadas) y por qué.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_granja` | INTEGER | No | FK → granjas | — | Granja a la que pertenece el registro. |
| `tipo` | VARCHAR(50) | No | — | — | Tipo de alerta ocultada. |
| `id_animal` | INTEGER | Sí | FK → animales | — | Animal al que se refería la alerta. |
| `id_referencia` | INTEGER | Sí | — | — | Registro que originó la alerta (empadre, parto…). |
| `motivo` | TEXT | Sí | — | — | Por qué se ocultó. |
| `created_by` | INTEGER | Sí | FK → usuarios | — | Usuario que creó el registro. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |

**`audit_log`** — Bitácora de auditoría de todas las operaciones de escritura.

| Atributo | Tipo | Nulo | Clave | Restricción / defecto | Descripción |
|--------------------|---------------|------|-----------|-------------------|--------------------------|
| `id` | SERIAL | No | PK | — | Identificador interno autoincremental. |
| `id_usuario` | INTEGER | Sí | FK → usuarios | — | Usuario que realizó la acción. |
| `accion` | VARCHAR(100) | No | — | — | Acción (crear, editar, anular, login…). |
| `detalle` | TEXT | Sí | — | — | Resumen legible de la operación. |
| `created_at` | TIMESTAMP | Sí | — | Defecto: fecha y hora actual | Fecha y hora de creación. |
| `entidad` | VARCHAR(80) | Sí | — | — | Tipo de registro afectado. |
| `id_entidad` | INTEGER | Sí | — | — | Identificador del registro afectado. |
| `id_granja` | INTEGER | Sí | FK → granjas | — | Granja donde ocurrió. |
| `antes` | JSONB | Sí | — | — | Copia del registro antes del cambio (JSONB). |
| `despues` | JSONB | Sí | — | — | Copia del registro después del cambio (JSONB). |

<!-- diccionario:fin -->

## Dimensionamiento de almacenamiento

### Línea base: datos reales de la unidad

El dimensionamiento parte de los registros de la propia unidad (planillas de inventario e individuales):

| Indicador | 2025 | 2026 (enero–julio) |
|------------------------------|------------|--------------------|
| Nacimientos | 929 | 949 (≈ 1 630 proyectados al año) |
| Bajas por mortalidad | 352 | 238 |
| Ventas (animales) | 327 | 633 |
| Población al cierre | 494 | 572 (a julio) |
| Reproductoras / reproductores | ≈ 245 / ≈ 43 | — |
| Histórico en planillas | 396 fichas de hembras y 806 partos | — |

### Estimación por tabla (una granja, por año)

Supuestos: 1 630 nacimientos al año, camadas de 2,5 crías en promedio (≈ 650 partos), pesaje mensual de la población (≈ 500 animales), unos tres traslados por animal, conteo mensual de 95 jaulas y auditoría de cada operación de escritura. El tamaño por fila incluye la cabecera de PostgreSQL (≈ 24 bytes).

| Tabla | Registros / año | Tamaño por fila | Volumen / año |
|--------------------|------------|----------|----------|
| animales | 1 630 | 180 B | 0,29 MB |
| partos | 650 | 140 B | 0,09 MB |
| destetes | 650 | 140 B | 0,09 MB |
| empadres / empadre_hembras | 110 / 650 | 110 B / 50 B | 0,04 MB |
| pesajes | 6 000 | 70 B | 0,42 MB |
| movimientos | 5 000 | 110 B | 0,55 MB |
| tratamientos | 300 | 250 B | 0,08 MB |
| mortalidad | 350 | 180 B | 0,06 MB |
| ventas | 1 000 | 200 B | 0,20 MB |
| conteos_inventario | 1 140 | 110 B | 0,13 MB |
| animal_particularidades | 500 | 120 B | 0,06 MB |
| audit_log | ≈ 17 000 | 1 200 B (incluye JSON) | 20,40 MB |
| Catálogos y configuración | < 200 | — | < 0,05 MB |
| **Total de datos** | **≈ 35 000** | | **≈ 22,5 MB** |

### Crecimiento

| Escenario | Año 1 | Año 3 | Año 5 |
|--------------------------------------|----------|----------|----------|
| Base: 1 granja (datos + 30 % de índices) | 29 MB | 88 MB | 146 MB |
| Expansión: 3 granjas o especies | 88 MB | 263 MB | 440 MB |

La tabla `audit_log` concentra cerca del 90 % del volumen, porque guarda el antes y el después de cada cambio. Es la única que justificaría, a futuro, archivar los años cerrados.

### Conclusión

Incluso en el escenario de expansión, la base no supera los 0,5 GB en cinco años, un volumen pequeño para PostgreSQL. Cualquier servidor universitario con 2 GB de RAM y 10 GB libres en disco es suficiente; el respaldo diario completo ocupa pocos megabytes y tarda segundos. No se necesita particionado, réplicas ni almacenamiento externo.

## Estrategias de respaldo y seguridad

### Política de respaldo

El respaldo está implementado en el backend con el comando `npm run db:backup`, que usa la herramienta estándar de PostgreSQL. Cada ejecución genera una copia, la verifica y aplica la política de retención:

| Aspecto | Política implementada |
|--------------------|----------------------------------------------------------|
| Herramienta | `pg_dump` en formato comprimido (`-Fc`), que permite restaurar la base completa o tablas por separado. |
| Verificación | Tras cada copia se comprueba que el archivo no esté vacío y que `pg_restore` pueda leer su contenido; si falla, el comando termina con error. |
| Retención | Se conserva la copia más reciente de cada uno de los últimos 7 días, 4 semanas y 12 meses; las demás se eliminan. Configurable con `BACKUP_KEEP_DAILY`, `BACKUP_KEEP_WEEKLY` y `BACKUP_KEEP_MONTHLY`. |
| Ubicación | Carpeta definida en `BACKUP_DIR`; en producción debe apuntar fuera del servidor de la base de datos (unidad de red o almacenamiento institucional de la UNAS). |
| Seguridad | La contraseña de la base se pasa por variable de entorno, no en la línea de comandos; las copias no se suben al repositorio. |
| Frecuencia | Diaria a las 23:00, programada en el servidor (tabla siguiente), y manual antes de cada actualización del sistema. |
| Objetivos | Pérdida máxima de datos (RPO): 24 horas. Tiempo máximo de recuperación (RTO): 2 horas. |

| Sistema del servidor | Programación diaria |
|----------------------|----------------------------------------------------------|
| Windows | `schtasks /create /tn CuySystemRespaldo /sc daily /st 23:00 /tr "cmd /c cd /d <ruta>\backend && npm run db:backup"` |
| Linux | Línea de `crontab`: `0 23 * * * cd <ruta>/backend && npm run db:backup` |

La restauración se hace con `npm run db:restore -- <archivo> --yes`; sin `--yes` el comando se niega a ejecutar, porque reemplaza los datos actuales. El procedimiento completo se probó restaurando una copia en una base temporal (25 tablas recuperadas).

### Recuperación

- **Error de un usuario** (por ejemplo, una venta mal registrada): se anula con motivo o se reactiva el registro; no se restaura la base.
- **Consulta de un valor anterior:** la bitácora conserva el antes y el después de cada cambio.
- **Pérdida de la base o del servidor:** se instala PostgreSQL, se ejecuta `npm run db:migrate` para crear el esquema y se restaura la última copia con `npm run db:restore`.
- **Prueba periódica:** una vez al mes se restaura la última copia en una base aparte para confirmar que sirve.

### Protección de datos

| Amenaza | Medida implementada |
|----------------------------|--------------------------------------------------------|
| Robo de contraseñas | Se guardan cifradas con **bcrypt**; nunca en texto plano. |
| Acceso sin autorización | Sesión con token **JWT** que expira; cada petición se valida por rol y por granja (cadena de *guards*). |
| Ver datos de otra granja | Toda consulta se filtra por la granja activa y se verifica que el usuario tenga acceso a ella. |
| Inyección SQL | Todas las consultas usan parámetros (`$1`, `$2`…), nunca texto concatenado. |
| Fuerza bruta | Límite de 100 peticiones cada 15 minutos y 10 intentos de inicio de sesión. |
| Ataques web comunes | Cabeceras de seguridad (Helmet) y CORS restringido al frontend. |
| Exposición de credenciales | Contraseña de la base y clave JWT en variables de entorno, fuera del código. |

### Trazabilidad

La tabla `audit_log` registra cada inicio y cierre de sesión, cada creación, edición, anulación y desactivación, y los intentos de un usuario de darse más permisos de los que tiene. La aplicación no ofrece ninguna operación para editar o borrar la bitácora, de modo que siempre puede responderse quién cambió un dato, cuándo y qué valor tenía antes.

# Referencias bibliográficas {.unnumbered}

::: {custom-style="Bibliography"}
Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4th ed.). Addison-Wesley.

Elmasri, R., & Navathe, S. B. (2016). *Fundamentals of database systems* (7th ed.). Pearson.

International Organization for Standardization. (2023). *ISO/IEC 25010:2023. Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model*. ISO.

Larman, C. (2005). *Applying UML and patterns: An introduction to object-oriented analysis and design and iterative development* (3rd ed.). Prentice Hall.

Martin, R. C. (2018). *Clean architecture: A craftsman's guide to software structure and design*. Prentice Hall.

Object Management Group. (2014). *Business Process Model and Notation (BPMN), version 2.0.2*. OMG.

Pressman, R. S., & Maxim, B. R. (2021). *Ingeniería del software: Un enfoque práctico* (9.ª ed.). McGraw-Hill.

Sommerville, I. (2018). *Ingeniería del software* (10.ª ed.). Pearson.
:::

# Anexos {.unnumbered}

## Anexo A. Especificación de la API REST {.unnumbered}

Las tablas de este anexo se generan desde la especificación OpenAPI que publica el propio backend (`node tools/anexo-api.mjs`), por lo que coinciden con las rutas implementadas.

### Convenciones {.unnumbered}

| Aspecto | Valor |
|----------------|------------------------------------------|
| URL base | `http://<servidor>:3001/api/v1` |
| Formato | JSON (los reportes devuelven `.xlsx`) |
| Autenticación | `Authorization: Bearer <token JWT>` (todas las rutas salvo el inicio de sesión) |
| Granja activa | Cabecera `x-farm-id` (obligatoria en rutas de granja) |
| Especie | Cabecera `x-species-id` (obligatoria en rutas de granja) |
| Respuesta correcta | 200 o 201 con los datos |
| Respuesta con error | 400, 401, 403, 404 o 409 con `{ "error": "mensaje", "campo": "…" }`; `campo` indica qué dato corregir |
| Confirmaciones | Un 409 con `requiere_confirmacion` pide confirmar una situación de riesgo (por ejemplo, sobrecupo); se reenvía con `confirmar_*: true` |
| Documentación interactiva | Swagger en `/api-docs` (solo en desarrollo) |

<!-- api:inicio -->

### Módulo Platform {.unnumbered}

**Autenticación**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| POST | `/auth/login` | body: `email`\*, `password`\* | Iniciar sesión (devuelve token JWT, usuario y granjas) |
| POST | `/auth/logout` | — | Cerrar sesión |
| GET | `/auth/me` | — | Usuario autenticado y sus granjas |

**Usuarios**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/users` | — | Listar usuarios visibles para el rol actual |
| POST | `/users` | body: `nombre`\*, `email`\*, `password`\*, `rol`\*, `especie_ids`, `granja_ids` | Crear usuario |
| PATCH | `/users/:id` | ruta: `id`; body: `nombre`, `password`, `activo`, `granja_ids` | Editar usuario |

**Granjas**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/farms` | — | Granjas accesibles para el usuario |
| POST | `/farms` | body: `nombre`\*, `id_especie`\*, `ubicacion` | Crear granja |
| PATCH | `/farms/:id` | ruta: `id`; body: `nombre`\*, `ubicacion` | Editar granja |
| PATCH | `/farms/:id/deactivate` | ruta: `id` | Eliminar granja (borrado lógico: queda inactiva) |
| PUT | `/farms/:id/users` | ruta: `id`; body: `usuario_ids`\* | Reemplazar los usuarios asignados a la granja |

**Especies**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/species` | — | Especies (módulos) disponibles para el usuario |

**Áreas**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/areas` | — | Listar áreas de la granja |
| POST | `/areas` | body: `nombre`\*, `proposito`, `jaula_ids` | Crear área |
| PATCH | `/areas/:id` | ruta: `id`; body: `nombre`\*, `proposito`, `jaula_ids` | Editar área |
| PATCH | `/areas/:id/deactivate` | ruta: `id` | Eliminar área (borrado lógico; sus jaulas quedan sin área) |
| GET | `/areas/summary` | — | Resumen de ocupación por área |

**Recintos (jaulas)**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/recintos` | — | Listar jaulas de la granja |
| POST | `/recintos` | body: `codigo`\*, `id_area`, `capacidad_maxima` | Crear jaula |
| PATCH | `/recintos/:id` | ruta: `id`; body: `codigo`, `id_area`, `capacidad_maxima` | Editar jaula |
| GET | `/recintos/:id/animals` | ruta: `id` | Animales en una jaula |
| PATCH | `/recintos/:id/deactivate` | ruta: `id` | Eliminar jaula (borrado lógico; debe estar vacía) |
| GET | `/recintos/occupancy` | — | Ocupación de jaulas |

**Animales**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/animals` | — | Listar animales (filtros por query string) |
| POST | `/animals` | body: `codigo`\*, `sexo`\*, `id_jaula`\*, `id_raza`, `id_categoria`, `fecha_nacimiento`, `particularidad`, `confirmar_capacidad`, `confirmar_reuso` | Registrar animal |
| PATCH | `/animals/:id` | ruta: `id`; body: `estado`, `motivo_baja`, `fecha_baja`, `id_categoria`, `id_jaula`, `particularidad` | Editar o dar de baja un animal |
| GET | `/animals/search/:codigo` | ruta: `codigo` | Buscar animal por código |

**Pesajes**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| POST | `/weighings` | body: `id_animal`\*, `fecha`\*, `peso_gramos`\*, `confirmar_fuera_rango` | Registrar pesaje individual |
| GET | `/weighings/animal/:id_animal` | ruta: `id_animal` | Evolución de peso de un animal |
| GET | `/weighings/average` | — | Peso promedio |
| POST | `/weighings/batch` | body: `fecha`\*, `pesajes`\*, `confirmar_fuera_rango` | Registrar pesajes por lote |
| GET | `/weighings/ranges` | — | Rangos de peso esperados por categoría |
| PUT | `/weighings/ranges` | — | Actualizar rangos de peso |

**Tratamientos**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/treatments` | — | Historial de tratamientos |
| POST | `/treatments` | body: `tipo`, `producto`\*, `dosis`, `via`, `fecha_inicio`\*, `duracion_dias`\*, `diagnostico`, `responsable`, `id_animal`, `ids_animales`, `id_jaula`, `id_area` | Registrar tratamiento |
| PATCH | `/treatments/:id/complete` | ruta: `id`; body: `motivo_cierre` | Finalizar tratamiento |
| GET | `/treatments/in-progress` | — | Tratamientos en curso |

**Mortalidad**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/mortality` | — | Listar registros de mortalidad |
| POST | `/mortality` | body: `fecha`\*, `cantidad`\*, `id_animal`, `clasificacion`, `categoria`, `causa`, `id_jaula` | Registrar mortalidad (individual o por lote) |

**Auditoría**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/audit` | — | Bitácora de auditoría de la granja |
| POST | `/audit/void/mortality/:id` | ruta: `id`; body: `motivo`\* | Anular un registro de mortalidad |
| POST | `/audit/void/sale/:id` | ruta: `id`; body: `motivo`\* | Anular una venta |

### Módulo Cuyes {.unnumbered}

**Catálogos**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/catalogs/breeds` | — | Listar razas |
| POST | `/cuyes/catalogs/breeds` | body: `nombre`\* | Crear raza |
| PATCH | `/cuyes/catalogs/breeds/:id/deactivate` | ruta: `id` | Desactivar raza |
| GET | `/cuyes/catalogs/categories` | — | Listar categorías |
| POST | `/cuyes/catalogs/categories` | body: `nombre`\*, `proposito_area` | Crear categoría |
| PATCH | `/cuyes/catalogs/categories/:id/deactivate` | ruta: `id` | Desactivar categoría |
| GET | `/cuyes/catalogs/transitions` | — | Transiciones de categoría permitidas |

**Empadres**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/breedings` | — | Listar empadres |
| POST | `/cuyes/breedings` | body: `id_macho`, `hembras`\*, `id_jaula`, `fecha_empadre`\*, `peso_antes`, `peso_despues`, `cantidad_prenadas`, `notas` | Crear empadre |
| POST | `/cuyes/breedings/:id/close` | ruta: `id`; body: `id_jaula_retorno`\* | Cerrar empadre y devolver el macho a una jaula |
| PATCH | `/cuyes/breedings/:id/females/:femaleId` | ruta: `id`, `femaleId`; body: `resultado`\*, `fecha` | Registrar resultado de una hembra en el empadre |
| POST | `/cuyes/breedings/breeding-females` | body: `codigo`\*, `id_jaula`\*, `id_raza`, `id_categoria`, `fecha_nacimiento`, `particularidad` | Registrar hembra reproductora |
| GET | `/cuyes/breedings/breeding-females/:id` | ruta: `id` | Perfil reproductivo de una hembra |
| POST | `/cuyes/breedings/breeding-males` | body: `codigo`\*, `id_jaula`\*, `id_raza`, `id_categoria`, `fecha_nacimiento`, `particularidad` | Registrar macho reproductor |
| GET | `/cuyes/breedings/breeding-males/:id` | ruta: `id` | Perfil reproductivo de un macho |
| GET | `/cuyes/breedings/cage/:id/females` | ruta: `id` | Hembras disponibles en una jaula |

**Partos**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/births` | — | Listar partos |
| POST | `/cuyes/births` | body: `id_hembra`\*, `id_empadre`, `fecha_parto`\*, `vivos_m`, `vivos_h`, `muertos`, `peso_m1`, `peso_m2`, `peso_m3`, `peso_h1`, `peso_h2`, `peso_h3` | Registrar parto |

**Destetes**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/weanings` | — | Listar destetes |
| POST | `/cuyes/weanings` | body: `id_parto`\*, `fecha_destete`\*, `destetados_m`, `destetados_h`, `muertos`, `peso_m1`, `peso_m2`, `peso_m3`, `peso_h1`, `peso_h2`, `peso_h3`, `id_jaula_m`, `id_jaula_h` | Registrar destete de un parto |

**Movimientos**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/movements` | — | Listar movimientos |
| GET | `/cuyes/movements/animal/:id_animal` | ruta: `id_animal` | Historial de movimientos de un animal |
| GET | `/cuyes/movements/cage/:cage_id` | ruta: `cage_id` | Historial de movimientos de una jaula |
| GET | `/cuyes/movements/destination-cages/:farm_id` | ruta: `farm_id` | Jaulas disponibles en otra granja (para traslados) |
| GET | `/cuyes/movements/out-of-area` | — | Animales fuera del área que corresponde a su categoría |
| GET | `/cuyes/movements/overcapacity` | — | Jaulas sobre su capacidad |
| POST | `/cuyes/movements/relocate` | body: `fecha`\*, `id_jaula_destino`\*, `ids_animales`, `id_jaula_origen_completa`, `motivo`, `confirmar_capacidad`, `confirmar_area` | Reubicar animales dentro de la granja |
| POST | `/cuyes/movements/transfer` | body: `fecha`\*, `id_granja_destino`\*, `id_jaula_destino`\*, `ids_animales`\*, `motivo`\*, `confirmar_capacidad` | Trasladar animales a otra granja de la misma especie |

**Ventas**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/sales` | — | Listar ventas |
| POST | `/cuyes/sales` | body: `fecha`\*, `cantidad`\*, `id_animal`, `clasificacion`, `categoria`, `comprador`, `precio`, `tipo_comprobante`\*, `serie`\*, `numero`\*, `observaciones` | Registrar venta (individual o por lote) con comprobante de la caja UNAS |
| GET | `/cuyes/sales/discards` | — | Animales marcados para descarte (vendibles) |
| POST | `/cuyes/sales/discards` | body: `fecha`\*, `id_animales`\*, `comprador`, `precio`, `tipo_comprobante`\*, `serie`\*, `numero`\* | Vender animales de descarte con un comprobante de la caja UNAS |

**Inventario**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/inventory/by-area` | — | Inventario por área |
| GET | `/cuyes/inventory/by-category-area` | — | Inventario por categoría y área |
| GET | `/cuyes/inventory/consolidated` | — | Inventario consolidado de todas las granjas del usuario |
| GET | `/cuyes/inventory/counts` | — | Conteos físicos de jaulas (filtros: desde, hasta, id_jaula) |
| POST | `/cuyes/inventory/counts` | body: `fecha`\*, `id_jaula`\*, `machos_contados`\*, `hembras_contadas`\*, `peso_muestra1`, `peso_muestra2`, `peso_muestra3`, `observaciones` | Registrar conteo físico de una jaula y conciliarlo con el sistema |
| GET | `/cuyes/inventory/monthly-summary` | — | Resumen mensual de inventario |
| GET | `/cuyes/inventory/population` | — | Población actual |

**Alertas**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/alerts` | — | Alertas activas de la granja |
| GET | `/cuyes/alerts/config` | — | Configuración de plazos de alertas |
| PUT | `/cuyes/alerts/config` | body: `items`\* | Guardar configuración de alertas |
| POST | `/cuyes/alerts/discard` | body: `tipo`\*, `id_animal`, `id_referencia`, `motivo` | Descartar una alerta |

**Ranking**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/ranking` | — | Ranking de reproductores |
| POST | `/cuyes/ranking/:id_animal/mark` | ruta: `id_animal`; body: `accion`\* | Marcar un reproductor para descarte o reemplazo |
| GET | `/cuyes/ranking/config` | — | Pesos de los criterios del ranking |
| PUT | `/cuyes/ranking/config` | body: `peso_partos`, `peso_camada`, `peso_destete`, `peso_mortalidad`, `peso_peso_nac`, `peso_peso_dest`, `peso_prenez_macho` | Actualizar pesos de los criterios del ranking |

**Reportes**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/reports/animals` | — | Exportar animales (Excel) |
| GET | `/cuyes/reports/consolidated` | — | Exportar consolidado multigranja (Excel) |
| GET | `/cuyes/reports/females` | — | Exportar hembras reproductoras (Excel) |
| GET | `/cuyes/reports/males` | — | Exportar machos reproductores (Excel) |
| GET | `/cuyes/reports/monthly-inventory` | — | Exportar inventario mensual (Excel) |

**Procesos BPMN**

| Método | Ruta | Parámetros (\* obligatorio) | Descripción |
|----------|--------------------------|--------------------------|----------------------|
| GET | `/cuyes/procesos/resumen` | — | Resumen por fase del flujo BPMN (Crianza → Reproducción → Ventas) |

<!-- api:fin -->

## Anexo B. Puertos de repositorio e implementaciones {.unnumbered}

| Puerto | Implementación | Tecnología |
|------------------------------------------|--------------------------|------------|
| `AuthRepositoryPort`, `UsersRepositoryPort`, `FarmsRepositoryPort`, `SpeciesRepositoryPort`, `AuditRepositoryPort` | `*Repository` en `platform/infrastructure` | Prisma |
| `AreasRepositoryPort`, `RecintosRepositoryPort`, `AnimalsRepositoryPort`, `WeighingsRepositoryPort`, `TreatmentsRepositoryPort`, `MortalityRepositoryPort` | `*Repository` en `platform/infrastructure` | SQL parametrizado |
| `CatalogsRepositoryPort` | `CatalogsRepository` en `cuyes/infrastructure` | Prisma |
| `BreedingsRepositoryPort`, `BirthsRepositoryPort`, `WeaningsRepositoryPort`, `MovementsRepositoryPort`, `SalesRepositoryPort`, `InventoryRepositoryPort`, `AlertsRepositoryPort`, `RankingRepositoryPort`, `ReportsRepositoryPort` | `*Repository` en `cuyes/infrastructure` | SQL parametrizado |
