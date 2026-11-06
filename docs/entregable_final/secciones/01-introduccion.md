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

```plantuml {caption="Macroproceso AS-IS de producción y salidas (Nivel 0)"}
@startuml
skinparam dpi 150
skinparam shadowing false
skinparam defaultFontSize 11
skinparam ActivityBackgroundColor White
skinparam ActivityBorderColor Black
skinparam ArrowColor Black

start
:Ingreso / Nacimiento en poza;
:1. Crianza y control de cuyes\n(Lactancia 15d, recría, engorde);
if (¿Destino zootécnico del cuy?) then (Selección reproductores)
  :2. Reproducción y empadre\n(Lotes, gestación ~67d, parto);
  split
    :Nuevas crías viables\n(Retornan a crianza);
    detach
  split again
    :Hembras con 6 partos / Descarte;
    :3. Ventas y comercialización\n(Comprobante de pago UNAS);
    :Baja de inventario activo;
    stop
  end split
else (Engorde cárnico / Saca)
  :3. Ventas y comercialización\n(Pago en caja externa UNAS);
  :Entrega y baja de inventario;
  stop
endif
@enduml
```

Todo animal entra al nacer y pasa por lactancia (15 días), destete, recría y engorde. Al final se decide su destino: **reproducción** (sus crías vuelven a crianza), **venta** (engorde comercial o reproductoras descartadas) o **baja por mortalidad**.

| Subproceso | Objetivo | Reglas de negocio clave |
|------------------|--------------------------------|--------------------------------------|
| Crianza y control | Controlar crecimiento, sanidad, traslados y aforo de jaulas hasta el destino productivo. | Destete a los 15 días; traslado validando capacidad de la jaula; inventario físico y reporte mensual. |
| Reproducción y empadre | Planificar empadres, seguir la gestación, registrar partos y renovar el plantel. | Edad mínima 3 meses; 1 macho por 5–8 hembras; gestación de ~67 días; máximo 6 partos por hembra. |
| Comercialización y ventas | Respaldar cada salida comercial con stock verificado, pago en caja UNAS y baja inmediata del inventario. | El criadero no cobra; toda venta exige serie y número del comprobante oficial. |

```plantuml {caption="Subproceso AS-IS: crianza y control de cuyes (Nivel 1)"}
@startuml
skinparam dpi 150
skinparam shadowing false
skinparam defaultFontSize 10
skinparam ActivityBackgroundColor White
skinparam ActivityBorderColor Black
skinparam ArrowColor Black

|Encargada del criadero|
start
:Nacimiento del cuy en poza;
if (¿Está vivo?) then (no)
  :Registrar mortalidad en cuaderno;
  :Actualizar cantidad en jaula y Excel;
  stop
else (sí)
  :Registrar gazapo en jaula materna;
  :Sanidad inicial y abrir historial clínico;
  :Lactancia materna (15 días);
  :Destetar y definir jaula de recría;
  :Trasladar a recría y actualizar aforo;
  :Pase a etapa de engorde;
  if (¿Apto para reproducción?) then (sí)
    :Registrar etapa de reproductor;
  else (no)
    :Registrar permanencia en engorde o descarte;
  endif
  :Control sanitario preventivo/curativo;
  :Toma de inventario físico de jaulas y cuyes;
  :Transcribir a Excel y elaborar reporte mensual;
endif

|Ingeniera Zootecnista|
:Revisar reporte mensual consolidado;
:Evaluar curvas de crecimiento, mortalidad y población;
stop
@enduml
```

```plantuml {caption="Subproceso AS-IS: ciclo reproductivo y empadre (Nivel 1)"}
@startuml
skinparam dpi 150
skinparam shadowing false
skinparam defaultFontSize 10
skinparam ActivityBackgroundColor White
skinparam ActivityBorderColor Black
skinparam ArrowColor Black

|Ingeniera Zootecnista|
start
:Revisar reporte mensual (crecimiento y población);
:Planificar lotes de empadre;

|Encargada del criadero|
:Revisar registro de hembras (código, raza, edad, partos);
if (¿Edad ≥ 3 meses?) then (no)
  :Mantener en jaula de crianza;
  stop
else (sí)
endif
if (¿Ya tuvo su 6.° parto?) then (sí)
  :Marcar hembra en rojo en Excel;
  :Registrar motivo de descarte y derivar a venta;
  stop
else (no)
  :Agrupar 5 a 8 hembras por 1 macho reproductor;
  :Definir jaula de empadre, trasladar y registrar;
  :Período de gestación (~67 días);
  if (¿Gestación llegó a parto?) then (no: aborto)
    :Registrar aborto en historial sanitario;
    if (¿Se descarta?) then (sí)
      :Marcar en rojo y derivar a venta;
      stop
    else (no)
      :Descanso para nuevo empadre;
      stop
    endif
  else (sí: parto)
    :Registrar parto y pesos de crías en cuaderno;
    if (¿Hubo mortinatos?) then (sí)
      :Registrar en mortalidad;
    endif
    if (¿Hembra élite?) then (sí)
      :Aretar cría hembra con código único;
    endif
    :Actualizar Ficha Individual de reproductora en Excel;
    split
      :Crías pasan a Crianza y Control;
      detach
    split again
      :Evaluar salud de la madre;
      if (¿Se descarta?) then (sí)
        :Marcar en rojo y derivar a venta;
      else (no)
        :Habilitar para nuevo empadre;
      endif
      stop
    end split
  endif
endif
@enduml
```

```plantuml {caption="Subproceso AS-IS: comercialización y ventas (Nivel 1)"}
@startuml
skinparam dpi 150
skinparam shadowing false
skinparam defaultFontSize 10
skinparam ActivityBackgroundColor White
skinparam ActivityBorderColor Black
skinparam ArrowColor Black

|Cliente|
start
:Solicitar compra de cuyes;

|Encargado del área de cuyes|
:Recepcionar solicitud del cliente;
:Verificar disponibilidad en jaulas e inventario;
if (¿Hay disponibilidad?) then (no)
  :Informar al cliente falta de stock;
  stop
else (sí)
  :Acordar cantidad, peso y precio oficial;
endif

|Cliente|
:Realizar pago en Caja Central UNAS;
:Obtener comprobante de pago oficial físico;
:Presentar comprobante en criadero;

|Encargado del área de cuyes|
:Verificar autenticidad, fecha e importe del comprobante;
:Registrar venta con serie y número de comprobante;
:Entregar físicamente los cuyes al cliente;
:Actualizar inventario activo y aforo de jaula;
stop
@enduml
```

### Del proceso manual (AS-IS) a la solución (TO-BE)

| Aspecto | AS-IS (cuadernos y Excel) | TO-BE (Cuy-System) |
|-------------|----------------------------------|----------------------------------------|
| Identificación y genealogía | Códigos con grafías variables; genealogía reconstruida a mano. | Código normalizado y único por granja; pedigrí de tres generaciones en la ficha del animal. |
| Empadre y gestación | Fecha probable de parto calculada a mano. | Parto proyectado a 67 días y alertas en el panel. |
| Tope de 6 partos | Celda pintada de rojo "si se recuerda". | Conteo automático de partos y descarte sugerido. |
| Destete y aforo | Días contados a mano; sobrecupo inadvertido. | Alerta a los 15 días y validación de capacidad con confirmación explícita. |
| Sanidad | Fechas de desparasitación de memoria. | Historial clínico por animal, jaula o área y alertas de tratamientos. |
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
