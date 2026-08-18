# Historias de Usuario — Digitalización del Registro del Criadero de Cuyes
**Unidad de Cuyes y Conejos — Facultad de Zootecnia — UNAS**

## Contexto

Actualmente el registro se hace primero a mano en hojas de papel y luego se transcribe a Excel, generando doble trabajo y errores de transcripción. El objetivo es reemplazar ese proceso completo por una herramienta web donde el encargado del criadero registre los datos directamente, en las fechas clave del ciclo productivo (empadre, parto, destete, venta, mortalidad).

**Usuario principal:** Encargado(a) del criadero.
**Frecuencia de uso:** No diaria — en fechas clave del ciclo productivo.
**Problema principal a resolver:** Eliminar el doble registro (papel → Excel).
**Requisito clave:** Exportación a Excel indispensable para reportes a la facultad.

---

## Épica 1: Gestión de Reproductoras (Hembras)

**HU-01**
Como encargado del criadero, quiero registrar una nueva hembra reproductora (código, jaula, raza, fecha de nacimiento, particularidades) para tener su ficha individual desde el inicio.

**HU-02**
Como encargado, quiero registrar un empadre de una hembra (macho asignado, fecha de empadre) para llevar el control de cruces.

**HU-03**
Como encargado, quiero registrar el parto de una hembra (fecha de nacimiento de crías, tamaño de camada, muertos al nacimiento, peso individual por cría separado por sexo M/H) para calcular indicadores reproductivos.

**HU-04**
Como encargado, quiero registrar el destete de una camada (fecha, tamaño de camada al destete, muertos al destete, peso individual por cría) para completar el ciclo del parto.

**HU-05**
Como encargado, quiero marcar una hembra como "vacía" (empadre sin preñez) o con una particularidad (ej. "murió") para mantener su historial actualizado sin perder los datos anteriores.

---

## Épica 2: Gestión de Reproductores (Machos)

**HU-06**
Como encargado, quiero registrar un nuevo macho reproductor (código, raza, fecha de nacimiento, particularidades) para su ficha individual.

**HU-07**
Como encargado, quiero registrar un evento de empadre de un macho (fecha, hembras empadradas, cantidad de hembras, cantidad preñadas, peso antes/después) para llevar su historial reproductivo.

---

## Épica 3: Mortalidad y Ventas (eventos independientes)

**HU-08**
Como encargado, quiero registrar una mortalidad (fecha, clasificación/raza, categoría: gazapo/recría/reproductor, cantidad) sin que esté ligada a un parto específico.

**HU-09**
Como encargado, quiero registrar una venta (fecha, clasificación/raza, categoría: recría/descarte/reproductor, cantidad, comprador opcional) de la misma forma independiente.

---

## Épica 4: Inventario y Población

**HU-10**
Como encargado, quiero ver la población actual por raza y categoría (reproductoras, reproductores, gazapos, recría) calculada automáticamente a partir de nacimientos, mortalidad y ventas.

**HU-11**
Como encargado, quiero ver un resumen mensual (nacimientos, mortalidad, ventas) igual al que antes armaba a mano en el Excel de inventario.

---

## Épica 5: Reportes y Exportación

**HU-12**
Como encargado, quiero exportar/descargar los datos a Excel (con el mismo formato que usa la facultad) para entregar reportes oficiales.

**HU-13**
Como encargado, quiero buscar el historial completo de una hembra o macho por su código para consultar su ficha sin buscar papeles.

---

## Épica 6: Confiabilidad de datos

**HU-14**
Como encargado, quiero que los datos queden guardados automáticamente al ingresarlos (sin "guardar" manual constante) para no perder información como pasaba con las hojas de papel.

**HU-15**
Como encargado, quiero que el sistema valide datos obligatorios (ej. no dejar un parto sin fecha) para evitar los registros incompletos que veía en los Excel actuales.