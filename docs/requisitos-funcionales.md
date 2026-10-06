# Requisitos funcionales — Sistema de Control de Animales

**Facultad de Zootecnia — UNAS** · **65 requisitos** (RF-01 a RF-65) derivados de las 65 historias de usuario

Documento consolidado que traduce cada historia de usuario en un requisito funcional identificado, con su trazabilidad a la historia, la épica y la entrega del backlog. Los criterios de aceptación completos permanecen en [historias-de-usuario.md](historias-de-usuario.md); este documento no los duplica.

---

## 1. Convención de identificadores

- **RF-NN**: requisito funcional, numerado de forma correlativa.
- La numeración sigue el orden del documento de historias: **RF-01 a RF-41** corresponden a `NUC-01` a `NUC-41` (núcleo) y **RF-42 a RF-65** a `CUY-01` a `CUY-24` (módulo cuyes). La correspondencia es **1:1**.
- **Entrega**: prioridad según [backlog.md](backlog.md) — **E1** (P1 imprescindible), **E2** (P2 importante), **E3** (P3 deseable).
- Regla de resolución de conflictos: si un RF y su historia divergen, prevalece la historia hasta que se actualice este documento.
- Los requisitos no funcionales (rendimiento, seguridad, usabilidad, etc.) están en [requisitos-no-funcionales.md](requisitos-no-funcionales.md).

---

## 2. Requisitos por épica

### Épica N1 — Acceso y contexto de trabajo (RF-01 a RF-08)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-01** | El sistema debe permitir iniciar sesión con usuario y contraseña, mostrar un mensaje claro cuando las credenciales sean incorrectas, permitir cerrar la sesión y caducar la sesión tras un periodo de inactividad. | `NUC-01` | E1 |
| **RF-02** | El sistema debe pedir elegir primero la especie y luego la granja entre las del alcance del usuario, actualizar la lista de granjas al cambiar de especie, asociar todo registro a la granja activa, filtrar áreas/jaulas/animales por ella y autoseleccionar especie y granja cuando solo haya una de cada una. | `NUC-02` | E1 |
| **RF-03** | El sistema debe mostrar un panel con la situación de la granja: población total y por categoría, ocupación por área y jaulas sobre capacidad, movimientos del mes, alertas pendientes y accesos directos a los registros frecuentes, con cifras coincidentes con el inventario. | `NUC-03` | E2 |
| **RF-04** | El sistema debe permitir al superadmin crear granjas con especie obligatoria e inmutable, nombre único en la institución y ubicación opcional; desactivarlas (sin eliminarlas) cuando tengan registros; y limitar a los admins la consulta de sus granjas de alcance. | `NUC-04` | E1 |
| **RF-05** | El sistema debe permitir asignar a un usuario una o varias granjas deduciendo automáticamente la especie de cada una, mostrar solo las granjas del asignador, permitir quitar acceso sin borrar los registros creados por esa persona. | `NUC-05` | E1 |
| **RF-06** | El sistema debe permitir al superadmin crear cuentas de Admin con nombre, usuario, contraseña inicial y granjas de alcance, editar ese alcance y desactivarlas, sin que se eliminen de la base de datos. | `NUC-06` | E1 |
| **RF-07** | El sistema debe permitir al admin crear y administrar cuentas operativas (encargado, supervisor y otros roles) asignándoles solo granjas de su alcance, sin poder crear cuentas Admin ni Superadmin ni editar cuentas de otro admin o del superadmin. | `NUC-07` | E1 |
| **RF-08** | El sistema debe validar que las granjas asignadas al crear o editar un usuario sean subconjunto de las del creador, rechazar con mensaje claro cualquier intento de escalada, impedir que un admin amplíe su propio alcance y registrar el intento en la auditoría. | `NUC-08` | E1 |

---

### Épica N2 — Ficha de animal (RF-09 a RF-12)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-09** | El sistema debe registrar un animal con código único dentro de la granja, sexo, raza/línea elegida de lista, fecha de nacimiento, jaula (área deducida) y particularidades, haciéndolo aparecer en el listado y en el inventario de la granja activa. | `NUC-09` | E1 |
| **RF-10** | El sistema debe permitir cambiar el estado de un animal desde una lista cerrada, pidiendo fecha y motivo en la baja, dejándolo fuera de la población activa, conservando visibles todos sus eventos anteriores y permitiendo agregar notas de particularidad sin sobrescribir las anteriores. | `NUC-10` | E1 |
| **RF-11** | El sistema debe buscar un animal por código normalizando espacios y mayúsculas/minúsculas, mostrar su ficha con línea de tiempo de eventos ordenada por fecha y ofrecer registrar el animal cuando no haya coincidencia. | `NUC-11` | E1 |
| **RF-12** | El sistema debe listar los animales con filtros combinables por sexo, categoría, raza, área, jaula y estado (con conteo de resultados y filtro en cascada área → jaula), ordenamiento por código, nacimiento o ubicación, acceso a la ficha y exportación del resultado. | `NUC-12` | E1 |

---

### Épica N3 — Áreas, jaulas y movimientos (RF-13 a RF-20)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-13** | El sistema debe permitir crear, editar y desactivar jaulas dentro de la granja, con nombre único por granja normalizado (sin variantes por espacios o mayúsculas), pertenencia obligatoria a un área, no asignables cuando están desactivadas y conservadas en el historial; dos granjas pueden usar el mismo nombre de jaula. | `NUC-13` | E1 |
| **RF-14** | El sistema debe registrar traslados internos con fecha entre el nacimiento y hoy, jaula de origen actual, destino navegando por áreas y motivo opcional, permitiendo trasladar un animal, una selección o una jaula completa, y actualizando ficha y listados. | `NUC-14` | E2 |
| **RF-15** | El sistema debe mostrar el historial de movimientos de un animal (incluidas transferencias entre granjas), los animales actuales de una jaula, quiénes estuvieron en ella en una fecha dada y el recorrido completo del animal. | `NUC-15` | E2 |
| **RF-16** | El sistema debe permitir definir áreas con nombre, propósito elegido de la lista del módulo y especie si corresponde; asignar y mover jaulas entre áreas sin perder su historial; y desactivar un área solo después de reubicar sus jaulas. | `NUC-16` | E1 |
| **RF-17** | El sistema debe mostrar la granja organizada por áreas con su propósito, número de jaulas y animales; al abrir un área, sus jaulas con cantidad de animales distinguiendo vacías de ocupadas; y desde cada jaula, su lista de animales. | `NUC-17` | E1 |
| **RF-18** | El sistema debe llevar el control de capacidad máxima por jaula, mostrar la ocupación actual al asignar o trasladar y avisar (sin bloquear, con confirmación explícita que queda registrada) cuando se supera, además de listar las jaulas sobre capacidad y la ocupación por área y granja. | `NUC-18` | E2 |
| **RF-19** | El sistema debe avisar, antes de guardar y sin bloquear, cuando el sexo o la categoría del animal no corresponde al propósito del área, pidiendo motivo en la confirmación, y debe listar los animales que hoy están fuera de su área. | `NUC-19` | E2 |
| **RF-20** | El sistema debe transferir animales entre granjas de la misma especie (nunca entre especies distintas) registrando fecha, granja y jaula de destino, animales y motivo; conservando código e historial; ajustando la población de origen y destino en la misma fecha sin pérdidas ni duplicidades; registrando entrada/salida separadas de las ventas; advirtiendo colisiones de código; y exigiendo autorización de un supervisor o admin con alcance en ambas granjas. | `NUC-20` | E2 |

---

### Épica N4 — Pesaje (RF-21 a RF-23)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-21** | El sistema debe registrar el peso de un animal con fecha obligatoria no futura y valor en gramos, rechazando pesos negativos o fuera del rango válido de la especie y avisando valores que parezcan error de tipeo, dejando el registro en la ficha y el historial. | `NUC-21` | E2 |
| **RF-22** | El sistema debe registrar pesajes por lote en una sola pantalla eligiendo fecha y jaula, área o grupo, permitiendo guardar sin recarga, omitir animales sin peso e informar cuántos pesos se registraron. | `NUC-22` | E2 |
| **RF-23** | El sistema debe mostrar la evolución del peso con lista y gráfico, la ganancia entre pesajes consecutivos y el peso promedio por fecha de un grupo. | `NUC-23` | E2 |

---

### Épica N5 — Sanidad (RF-24 a RF-25)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-24** | El sistema debe registrar tratamientos con tipo (preventivo/curativo), producto, dosis, vía, fecha de inicio y duración (calculando la fecha de término), diagnóstico o motivo y responsable, aplicables a un animal, una jaula, un área o un grupo seleccionado. | `NUC-24` | E2 |
| **RF-25** | El sistema debe mostrar en la ficha todos los tratamientos de un animal con fecha y estado (en curso o terminado), la lista de tratamientos en curso de la granja filtrable por área, y el cierre anticipado de un tratamiento indicando el motivo. | `NUC-25` | E2 |

---

### Épica N6 — Mortalidad y ventas (RF-26 a RF-27)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-26** | El sistema debe registrar una mortalidad con fecha, clasificación/raza, categoría, cantidad mayor que cero y sin superar la población de esa categoría, causa y área/jaula opcional, distinguir el animal identificado (que se da de baja) de la cantidad sin identificar, y reflejarla de inmediato en población actual y resumen mensual. | `NUC-26` | E1 |
| **RF-27** | El sistema debe registrar una venta con fecha, clasificación/raza, categoría, cantidad sin superar la población disponible, comprador y precio opcionales, distinguiéndola expresamente de la transferencia entre granjas, dando de baja los animales identificados y reflejándola en población y resumen mensual. | `NUC-27` | E1 |

---

### Épica N7 — Inventario y población (RF-28 a RF-32)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-28** | El sistema debe calcular la población actual por raza y categoría desde la población inicial aplicando nacimientos, mortalidad, ventas, transferencias y cambios de categoría, permitir consultar la población a una fecha determinada y abrir el detalle de los registros que componen cada cifra. | `NUC-28` | E1 |
| **RF-29** | El sistema debe mostrar el resumen mensual (población inicial, nacimientos, mortalidad, ventas, transferencias y población final) respetando las categorías del Excel actual, garantizando que la población final de un mes es igual a la inicial del siguiente, y permitir exportarlo. | `NUC-29` | E1 |
| **RF-30** | El sistema debe consolidar por especie la suma de todas sus granjas (población, nacimientos, mortalidad y ventas) sin duplicar animales transferidos entre ellas, limitando la vista a las especies con al menos una granja asignada al usuario. | `NUC-30` | E2 |
| **RF-31** | El sistema debe desglosar la población por área y, dentro de cada área, por jaula, distinguiendo por sexo y categoría, abriendo la lista de animales de cada jaula y coincidiendo la suma de áreas con la población total de la granja. | `NUC-31` | E2 |
| **RF-32** | El sistema debe comparar granjas en una tabla por granja con especie, población, nacimientos, mortalidad y ventas del periodo; mostrar totales por especie y total institucional; filtrar por especie; navegar al inventario de cada granja; y respetar el alcance del rol (admin: sus granjas; superadmin: todas). | `NUC-32` | E2 |

---

### Épica N8 — Alertas (RF-33 a RF-35)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-33** | El sistema debe mostrar las alertas de la granja activa ordenadas por fecha y distinguiendo próximas de vencidas, cada una con animal o grupo, jaula, tipo de tarea y fecha prevista, con acceso directo a la pantalla de registro del evento y cálculo automático a partir de los eventos registrados. | `NUC-33` | E3 |
| **RF-34** | El sistema debe cerrar automáticamente una alerta al registrar el evento correspondiente, permitir descartarla indicando el motivo y mantener las alertas cerradas o descartadas fuera de la lista de pendientes pero visibles en el historial. | `NUC-34` | E3 |
| **RF-35** | El sistema debe permitir al admin configurar los días de anticipación de cada tipo de alerta por especie y por granja, desactivar tipos que la granja no use y aplicar los cambios solo a las alertas futuras. | `NUC-35` | E3 |

---

### Épica N9 — Reportes y exportación (RF-36 a RF-37)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-36** | El sistema debe exportar a Excel con el formato oficial de la facultad (encabezados, orden de columnas y títulos de la plantilla), descargando el archivo listo para entregar, acotado a la granja, especie y periodo seleccionados, con aviso previo cuando no haya datos. | `NUC-36` | E1 |
| **RF-37** | El sistema debe permitir elegir el alcance de la exportación: tipo de reporte disponible para la granja activa, rango de fechas o mes cerrado, y resultado de una lista filtrada; el archivo debe indicar institución, granja, especie y periodo. | `NUC-37` | E2 |

---

### Épica N10 — Confiabilidad de los datos (RF-38 a RF-41)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-38** | El sistema debe conservar lo escrito en un formulario aunque se cierre la pantalla o se corte la conexión, ofreciendo retomarlo; mostrar confirmación visible en cada guardado; e indicar explícitamente cuando el guardado falla, sin dar el dato por registrado. | `NUC-38` | E1 |
| **RF-39** | El sistema debe validar los datos de todo evento: campos obligatorios, fechas ingresadas con selector y rechazo de fechas imposibles o futuras cuando no correspondan, cantidades y pesos numéricos positivos dentro de un rango razonable, estados y categorías de listas cerradas, y mensajes de error que indican qué campo corregir. | `NUC-39` | E1 |
| **RF-40** | El sistema debe garantizar códigos únicos por granja normalizando espacios y mayúsculas antes de comparar, bloquear la repetición mostrando el animal que ya usa el código y permitir reutilizar el código de un animal dado de baja solo con confirmación expresa. | `NUC-40` | E1 |
| **RF-41** | El sistema debe guardar en cada registro autor y fecha de creación; al editar o anular, autor, fecha y valor anterior; mantener los registros anulados visibles pero fuera de los cálculos; y permitir consultar el historial de cambios de un registro. | `NUC-41` | E2 |

---

### Épica C1 — Configuración del módulo cuyes (RF-42 a RF-46)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-42** | El sistema debe mantener el catálogo de razas y líneas del cuy con la lista inicial de la unidad (Perú, Andina, Mantaro, Inti, Tipo 2, Tipo 3, Tipo 4 y Línea criolla negra), permitiendo agregar o desactivar razas sin afectar registros anteriores y exigiendo la selección de la lista al registrar animales o eventos. | `CUY-01` | E1 |
| **RF-43** | El sistema debe definir las categorías del cuy (gazapo, recría/reemplazo hembra y macho, reproductora, reproductor y descarte), proponer el cambio de categoría según edad y evento para que el encargado lo confirme, usarlas en mortalidad, ventas e inventario y mantener configurables los plazos de cada transición. | `CUY-02` | E1 |
| **RF-44** | El sistema debe usar la **jaula** como ubicación del módulo, con esa denominación en todas las pantallas, numeración uniforme, pertenencia a un área, contenido visible al abrirla y sin admisión de nombres equivalentes con distinto espaciado. | `CUY-03` | E1 |
| **RF-45** | El sistema debe ofrecer al crear un área los propósitos propios del criadero de cuyes (empadre, gestación y maternidad, recría de hembras, recría de machos, reproductores machos, engorde y descarte, cuarentena o enfermería), admitir propósitos propios, no obligar a usar todos y permitir indicar las jaulas que componen cada área. | `CUY-04` | E1 |
| **RF-46** | El sistema debe conocer la correspondencia entre categoría de cuy y propósito de área (reproductoras en empadre/gestación/maternidad, recría en sus áreas, reproductores en área de machos, descarte en engorde), aplicando el aviso de RF-19 sin bloquear, permitiendo el macho en el área de empadre sin aviso y listando los cuyes fuera de su área. | `CUY-05` | E2 |

---

### Épica C2 — Reproductoras / hembras (RF-47 a RF-52)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-47** | El sistema debe registrar una hembra reproductora con código único en la granja (formato `U01`, `U102`, `U490`), jaula, raza, fecha de nacimiento y particularidades, dejándola en categoría reproductora, sumándola a la población y lista para recibir empadres y partos. | `CUY-06` | E1 |
| **RF-48** | El sistema debe registrar el empadre de una hembra con el macho elegido entre los reproductores activos y una fecha que no sea futura ni anterior al último parto, abriendo un ciclo en la ficha de la hembra y generando la alerta de parto próximo. | `CUY-07` | E1 |
| **RF-49** | El sistema debe registrar el parto con fecha de nacimiento, tamaño de camada, muertos al nacimiento (que no pueden superar la camada) y peso en gramos de cada cría separado por sexo, calculando automáticamente el peso promedio al nacimiento, asociándolo al empadre abierto, sumando nacimientos al resumen mensual y dando de alta las crías vivas como gazapos. | `CUY-08` | E1 |
| **RF-50** | El sistema debe registrar el destete con fecha posterior al parto, tamaño de camada (que no supera las crías vivas al nacimiento), muertos al destete y peso de cada cría con promedio calculado, pasando las crías de gazapo a recría/reemplazo y permitiendo trasladarlas a las jaulas de recría de su sexo desde el mismo registro. | `CUY-09` | E1 |
| **RF-51** | El sistema debe registrar el resultado del ciclo de una hembra desde una lista cerrada (vacía, aborto, murió u otra particularidad) con su fecha, cerrar el ciclo de empadre dejándola lista para un nuevo empadre, conservar íntegros los datos anteriores, dar de baja y registrar mortalidad cuando el resultado sea "murió", y unificar los estados que hoy conviven en el Excel. | `CUY-10` | E1 |
| **RF-52** | El sistema debe mostrar la ficha completa de una reproductora con sus datos generales, todos sus partos (macho de empadre, fechas de empadre y nacimiento, camada, muertos, pesos y promedios, datos de destete) y los indicadores acumulados (número de partos, promedio de camada, crías destetadas), con enlace a la exportación individual. | `CUY-11` | E1 |

---

### Épica C3 — Reproductores / machos (RF-53 a RF-56)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-53** | El sistema debe registrar un macho reproductor con código único (formato `UM01`, `UM24`, `UM47`), raza, fecha de nacimiento y particularidades, dejándolo en categoría reproductor y disponible para asignarlo a empadres. | `CUY-12` | E1 |
| **RF-54** | El sistema debe registrar un evento de empadre del macho con fecha, códigos de hembras, cantidad de hembras (calculada y corregible), cantidad de preñadas (que no supera las hembras) y peso antes y después, reflejando el empadre en la ficha del macho y en la de cada hembra sin doble digitación. | `CUY-13` | E1 |
| **RF-55** | El sistema debe mostrar en la ficha del macho sus empadres con el tamaño de camada y crías macho/hembra de cada uno (tomados de los partos ya registrados, sin redigitación), el porcentaje de preñez y el promedio de camada de su descendencia. | `CUY-14` | E2 |
| **RF-56** | El sistema debe permitir registrar el empadre eligiendo la jaula de empadre, proponiendo las hembras presentes en ella con posibilidad de agregar o quitar, calculando la cantidad de hembras, dejando registro en las fichas de macho y hembras y devolviendo el macho a su área en un solo paso al cerrar. | `CUY-15` | E2 |

---

### Épica C4 — Pesos y alertas propios del cuy (RF-57 a RF-59)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-57** | El sistema debe conocer los rangos de peso normales del cuy por categoría (nacimiento, destete, recría, reproductor) en gramos, avisar los valores fuera de rango dejando confirmarlos, integrar los pesos de parto, destete y empadre en el historial de pesos y permitir que la unidad configure los rangos. | `CUY-16` | E2 |
| **RF-58** | El sistema debe permitir configurar los plazos del ciclo del cuy (duración de gestación, días hasta el destete, edad de paso a recría y edad mínima de empadre) con valores iniciales propuestos según el manejo habitual (gestación cercana a 67 días, destete alrededor de 14 días) a confirmar con la unidad, recalculando las alertas futuras sin alterar eventos ya registrados. | `CUY-17` | E3 |
| **RF-59** | El sistema debe generar alertas del ciclo del cuy: parto próximo según empadre y gestación, destete pendiente, empadre disponible tras el destete y revisión de hembra sin preñez confirmada; cada una con su hembra y jaula, enlace a la pantalla de registro y cierre automático al registrar el evento. | `CUY-18` | E3 |

---

### Épica C5 — Reproductores élite (RF-60 a RF-62)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-60** | El sistema debe calcular un ranking de reproductoras y reproductores con datos ya registrados (número de partos, promedio de camada, crías destetadas, mortalidad de la camada, pesos promedio al nacimiento y al destete y, en machos, porcentaje de preñez), filtrable por raza y categoría, mostrando los indicadores de cada fila y marcando como "datos insuficientes" a los animales con muy pocos eventos. | `CUY-19` | E3 |
| **RF-61** | El sistema debe permitir al jefe de unidad definir y guardar la ponderación de cada indicador del ranking, recalcularlo con la nueva configuración e indicar qué ponderación se aplicó al generarlo. | `CUY-20` | E3 |
| **RF-62** | El sistema debe permitir marcar desde el ranking los animales a descartar o a promover como reemplazo, actualizando su categoría con fecha y responsable y agrupando los marcados como descarte para la próxima venta. | `CUY-21` | E3 |

---

### Épica C6 — Exportación a Excel de la unidad (RF-63 a RF-65)

| ID | Requisito funcional | Historia | Entrega |
|---|---|---|---|
| **RF-63** | El sistema debe exportar el Registro Individual de Hembras con el encabezado oficial de la unidad, los datos de cada hembra (código, jaula, raza, nacimiento, particularidades) y todas las columnas de cada parto (macho de empadre, fechas, camada, muertos, pesos por cría M/H, promedios, destete), con promedios calculados como valores correctos y exportación de una hembra o todas. | `CUY-22` | E1 |
| **RF-64** | El sistema debe exportar el Registro Individual de Machos con los datos del reproductor, el bloque de empadres (fecha, códigos de hembras, cantidades, preñadas, peso antes y después) y el bloque de nacimientos (tamaño de camada y crías M/H), de un macho o de todos. | `CUY-23` | E1 |
| **RF-65** | El sistema debe exportar el Inventario mensual con el encabezado "REGISTRO DE MORTALIDAD Y VENTA MENSUAL" (unidad y año), los meses con nacimientos, mortalidad y ventas, las filas de población inicial, mortalidad y población final, la clasificación por raza y las categorías actuales, la separación por especie con sus totales y la elección del año a exportar. | `CUY-24` | E1 |

---

### Resumen por épica

| Épica | Requisitos | Historias | Total | Entrega dominante |
|---|---|---|---|---|
| N1 Acceso y contexto de trabajo | RF-01 a RF-08 | `NUC-01` a `NUC-08` | 8 | E1 (7) / E2 (1) |
| N2 Ficha de animal | RF-09 a RF-12 | `NUC-09` a `NUC-12` | 4 | E1 |
| N3 Áreas, jaulas y movimientos | RF-13 a RF-20 | `NUC-13` a `NUC-20` | 8 | E1 (3) / E2 (5) |
| N4 Pesaje | RF-21 a RF-23 | `NUC-21` a `NUC-23` | 3 | E2 |
| N5 Sanidad | RF-24 a RF-25 | `NUC-24` a `NUC-25` | 2 | E2 |
| N6 Mortalidad y ventas | RF-26 a RF-27 | `NUC-26` a `NUC-27` | 2 | E1 |
| N7 Inventario y población | RF-28 a RF-32 | `NUC-28` a `NUC-32` | 5 | E1 (2) / E2 (3) |
| N8 Alertas | RF-33 a RF-35 | `NUC-33` a `NUC-35` | 3 | E3 |
| N9 Reportes y exportación | RF-36 a RF-37 | `NUC-36` a `NUC-37` | 2 | E1 (1) / E2 (1) |
| N10 Confiabilidad de los datos | RF-38 a RF-41 | `NUC-38` a `NUC-41` | 4 | E1 (3) / E2 (1) |
| C1 Configuración del módulo | RF-42 a RF-46 | `CUY-01` a `CUY-05` | 5 | E1 (4) / E2 (1) |
| C2 Reproductoras | RF-47 a RF-52 | `CUY-06` a `CUY-11` | 6 | E1 |
| C3 Reproductores | RF-53 a RF-56 | `CUY-12` a `CUY-15` | 4 | E1 (2) / E2 (2) |
| C4 Pesos y alertas del cuy | RF-57 a RF-59 | `CUY-16` a `CUY-18` | 3 | E2 (1) / E3 (2) |
| C5 Reproductores élite | RF-60 a RF-62 | `CUY-19` a `CUY-21` | 3 | E3 |
| C6 Exportación a Excel | RF-63 a RF-65 | `CUY-22` a `CUY-24` | 3 | E1 |
| **Total** | **RF-01 a RF-65** | **65 historias** | **65** | E1: 37 · E2: 20 · E3: 8 |

---

## 3. Trazabilidad con los casos de uso de la Entrega 1

Los 7 casos de uso y sus 19 flujos de falla (`FA`) de [entrega_01/06.md](entrega_01/06.md) quedan cubiertos por los siguientes requisitos:

| Caso de uso | Requisitos que lo cubren | Flujos de falla y requisito que los resuelve |
|---|---|---|
| **CU-01** Registrar nacimiento y generar camada | RF-49, RF-40, RF-18, RF-29 | FA-1.1 → RF-49 · FA-1.2 → RF-39, RF-49 · FA-1.3 → RF-40 · FA-1.4 → RF-18 |
| **CU-02** Registrar empadre y seguimiento reproductivo | RF-48, RF-54, RF-56, RF-18, RF-59 | FA-2.1 → RF-54 · FA-2.2 → RF-54 · FA-2.3 → RF-18 |
| **CU-03** Gestionar y registrar venta de cuyes | RF-27, RF-10, RF-28 | FA-3.1 → RF-27 · FA-3.2 → regla de negocio externa (caja de la UNAS) · FA-3.3 → **sin cobertura** (ver §5) · FA-3.4 → RF-27 |
| **CU-04** Registrar destete y movimiento entre jaulas | RF-50, RF-14, RF-18, RF-57 | FA-4.1 → RF-18 · FA-4.2 → RF-57 |
| **CU-05** Registrar atención y tratamiento sanitario | RF-24, RF-25 | FA-5.1 → **sin cobertura explícita** (ver §5) · FA-5.2 → RF-39 |
| **CU-06** Realizar toma y conciliación de inventario físico | **Sin requisito asociado** (ver §5) | FA-6.1 y FA-6.2 → **sin cobertura** |
| **CU-07** Registrar descarte zootécnico o mortalidad | RF-26, RF-10, RF-62, RF-51 | FA-7.1 → RF-10 · FA-7.2 → RF-48, RF-54 |

---

## 4. Reglas de negocio transversales

Reglas que se aplican a más de un requisito y no viven en una sola historia:

| Regla | Descripción | Requisitos |
|---|---|---|
| **Granja monoespecie** | Cada granja tiene una sola especie y esta es inmutable; la especie no se elige aparte de la granja. | RF-04, RF-02, RF-20 |
| **Ecuación de población** | Población inicial + nacimientos − mortalidad − ventas ± transferencias ± cambios de categoría = población final. | RF-28, RF-29, RF-31 |
| **Continuidad mensual** | La población final de un mes es igual a la población inicial del mes siguiente. | RF-29 |
| **Código único por granja** | Normalización de espacios y mayúsculas antes de comparar; dos granjas pueden reutilizar el mismo código. | RF-40, RF-09, RF-20 |
| **Regla de no escalada** | Nadie puede otorgar granjas (y por tanto especies) que no tiene; los intentos quedan auditados. | RF-08, RF-05, RF-07 |
| **Traslado ≠ transferencia** | Dentro de la granja es traslado; a otra granja de la misma especie es transferencia con autorización. Nunca entre especies. | RF-14, RF-20 |
| **Borrado lógico** | Nada se elimina en silencio: desactivación/anulación con autor, fecha y conservación del historial. | RF-04, RF-10, RF-41, RF-06 |
| **Empadre exclusivo** | Un macho o una hembra no participan en dos empadres activos a la vez; la fecha de empadre no es anterior al último parto. | RF-48, RF-54 |
| **Consistencia de camadas** | Muertos al nacimiento ≤ tamaño de camada; destetados ≤ crías vivas al nacimiento. | RF-49, RF-50 |
| **Tope de población** | Mortalidad y ventas no pueden superar la población disponible de la categoría en la granja. | RF-26, RF-27 |
| **Avisos no bloqueantes** | Sobrecupo y animal fuera de área avisan y piden confirmación con motivo, pero no impiden el registro. | RF-18, RF-19, RF-46 |
| **Listas cerradas** | Estados, categorías, razas, propósitos y resultados de ciclo se eligen de catálogo, nunca texto libre. | RF-39, RF-42, RF-43, RF-45, RF-51 |

---

## 5. Cobertura y brechas detectadas

### 5.1 Cobertura de historias

| Verificación | Resultado |
|---|---|
| Historias totales | 65 |
| Historias con requisito asignado | **65 (100 %)** |
| Requisitos sin historia asociada | 0 |
| Entrega 1 (E1) | 37 requisitos |
| Entrega 2 (E2) | 20 requisitos |
| Entrega 3 (E3) | 8 requisitos |

### 5.2 Brechas entre la documentación

Funcionalidades presentes en la Entrega 1 (casos de uso) que **no tienen historia de usuario** y por lo tanto no generan requisito:

| Funcionalidad | Documento donde aparece | Efecto |
|---|---|---|
| Serie y número de comprobante de pago en la venta | [entrega_01/06.md](entrega_01/06.md) (CU-03), [entrega_01/03.md](entrega_01/03.md) | FA-3.3 (duplicidad de comprobante) queda sin requisito que lo resuelva. |
| Conciliación de inventario físico (conteo por jaula y diferencia contra sistema) | [entrega_01/06.md](entrega_01/06.md) (CU-06) | El CU-06 completo y sus FA-6.1/FA-6.2 no tienen historia ni requisito. |
| Bloqueo de tratamientos sobre animales dados de baja | [entrega_01/06.md](entrega_01/06.md) (CU-05), FA-5.1 | Queda implícito en RF-10/RF-24, pero no está expresado como criterio de aceptación. |

> Decisión requerida: si estas funcionalidades corresponden, deben agregarse como historias nuevas (y este documento se actualiza con sus RF); si no, deben retirarse de los casos de uso de la Entrega 1 para que la documentación sea consistente.

---

## 6. Fuera de alcance

Listado consolidado de [vision.md](vision.md) §5, [modulos-futuros.md](modulos-futuros.md) §5 y [entrega_01/03.md](entrega_01/03.md) §3.2. **Ningún requisito funcional de este documento los cubre.**

- Beneficio, faena y rendimiento de carcasa.
- Reportes en PDF (el entregable oficial es Excel).
- Aplicación móvil nativa y notificaciones push (se usa web responsiva).
- Módulos detallados de chanchos y conejos (solo plan de extensión).
- Módulo económico: costos, alimentación, rentabilidad, contabilidad.
- Pasarela de pagos, facturación electrónica (SUNAT) e inventario de insumos.
- Offline y trabajo sin conexión.
- Genealogía multigeneracional.
- Importación del historial histórico de los Excel (decisión pendiente, ver [backlog.md](backlog.md)).

---

## 7. Documentos relacionados

- [historias-de-usuario.md](historias-de-usuario.md) — fuente canónica de las 65 HU y sus criterios de aceptación
- [backlog.md](backlog.md) — priorización en tres entregas
- [actores.md](actores.md) — roles, alcance y matriz de permisos
- [requisitos-no-funcionales.md](requisitos-no-funcionales.md) — requisitos RNF-01 a RNF-29
- [entrega_01/06.md](entrega_01/06.md) — casos de uso y flujos de falla
- [validacion-historias.md](validacion-historias.md) — estado de implementación de cada HU
