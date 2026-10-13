# Documentación Completa del Modelo de Procesos BPMN: Sistema de Crianza, Reproducción y Ventas de Cuyes (AS-IS)

Este documento contiene la especificación, transcripción textual y estructuración detallada del modelo de procesos de la granja de cuyes (**AS-IS CUY**), elaborado en la herramienta Bizagi Modeler. 

La arquitectura sigue estrictamente la secuencia definida en el **Diagrama General Macro**:
1. **Crianza y Control de Cuyes**
2. **Reproducción**
3. **Ventas**

---

## 📑 Tabla de Contenidos

1. [Visión General del Proceso Macro (`AS-IS CUY`)](#1-visión-general-del-proceso-macro-as-is-cuy)
2. [Fase 1: Crianza y Control de Cuyes (`AS-IS_crianza-control-cuyes.jpg`)](#2-fase-1-crianza-y-control-de-cuyes-as-is_crianza-control-cuyesjpg)
   - [A. Sub-rutina: Nacimiento y Registro Inicial](#a-sub-rutina-nacimiento-y-registro-inicial)
   - [B. Sub-rutina: Cuidado de Lactancia y Destete](#b-sub-rutina-cuidado-de-lactancia-y-destete)
   - [C. Sub-rutina: Desarrollo, Recría y Selección](#c-sub-rutina-desarrollo-recría-y-selección)
   - [D. Cierre del Ciclo de Crianza (Ingeniera)](#d-cierre-del-ciclo-de-crianza-ingeniera)
3. [Fase 2: Reproducción (`AS-IS_reproduccion.jpg`)](#3-fase-2-reproducción-as-is_reproduccionjpg)
   - [A. Carril: Ingeniera](#a-carril-ingeniera)
   - [B. Carril: Encargada](#b-carril-encargada)
4. [Fase 3: Ventas (`AS-IS_ventas_2.png`)](#4-fase-3-ventas-as-is_ventas_2png)
   - [A. Carril: Cliente](#a-carril-cliente)
   - [B. Carril: Encargado del área de cuyes](#b-carril-encargado-del-área-de-cuyes)
5. [Estructura Técnica y Metadatos del Modelo Bizagi (`cuyeyos.bpm`)](#5-estructura-técnica-y-metadatos-del-modelo-bizagi-cuyeyosbpm)

---

## 🗺️ 1. Visión General del Proceso Macro (`AS-IS CUY`)

El diagrama general define la arquitectura general de alto nivel del ciclo operativo:

```
[Inicio] ---> ( Crianza y control de cuyes ) ---> ( Reproducción ) ---> ( Ventas ) ---> [Fin]
                      |                                                     ^
                      +-----------------------------------------------------+
```

* **Evento de Inicio:** Círculo verde.
* **Actividad Macro 1:** `Crianza y control de cuyes`
* **Actividad Macro 2:** `Reproducción`
* **Actividad Macro 3:** `Ventas`
* **Evento de Fin:** Círculo rojo.
* **Flujo Alternativo / Derivación:** Existe una línea de secuencia directa desde **`Crianza y control de cuyes`** hacia **`Ventas`** para comercializar cuyes de engorde directamente sin pasar por el área de reproducción.

---

## 🪺 2. Fase 1: Crianza y Control de Cuyes (`AS-IS_crianza-control-cuyes.jpg`)

**Proceso:** `Crianza y control de cuyes`  
**Participantes / Roles:**
* `Encargada del criadero`
* `Ingeniera`

---

### A. Sub-rutina: Nacimiento y Registro Inicial
* **Rol:** Encargada del criadero

1. **\[Inicio\]** (Círculo verde)
2. **Actividad:** `Nacimiento del cuy`
3. **Decisión (Gateway):** `¿Vio la luz?` (¿Nació vivo?)

   * **\[NO\]:**
     1. `Registrar mortalidad en cuaderno`
        * 📋 **Campos de Datos (Registro de Mortalidad Neonatal):**
          * Código del cuy
          * Fecha de muerte
          * Etapa
          * Jaula
          * Sexo
          * Raza
          * Causa de muerte
          * Observaciones
     2. `Actualizar cantidad de cuyes en su jaula`
     3. `Transcribir mortalidad e inventario a Excel`
     4. **\[Fin de Sub-rutina\]** (Círculo rojo)

   * **\[SÍ\]:**
     1. `Registrar el cuy`
        * 📋 **Campos de Datos (Registro de Nacimiento Individual):**
          * Código del cuy
          * Sexo
          * Raza
          * Fecha de nacimiento
          * Código de la madre
          * Código del padre
          * Jaula actual
          * Etapa actual
          * Estado actual
     2. `Registrar al gazapo en la jaula de su madre`
     3. `Realizar sanidad inicial y abrir historial`
        * 📋 **Campos de Datos (Ficha de Sanidad e Historial Médico):**
          * Código del cuy
          * Jaula
          * Fecha
          * Tipo de control
          * Diagnóstico/observación
          * Tratamiento
          * Medicamento
          * Dosis
          * Responsable
          * Próximo control
     4. `Transcribir nacimiento, ubicación y sanidad en el cuaderno`
     5. `Mantener gazapo con su madre`

---

### B. Sub-rutina: Cuidado de Lactancia y Destete
* **Rol:** Encargada del criadero

1. **Decisión (Gateway):** `¿Se cumplieron los 15 días?`
   * **\[NO\]:** `Continuar cuidado del gazapo` $\rightarrow$ *(Regresa a "Mantener gazapo con su madre")*
   * **\[SÍ\]:**
     1. `Descartar y definir jaula de recría`
     2. `Trasladar a la jaula de recría`
     3. `Registrar etapa de destete`
        * 📋 **Campos de Datos (Ficha de Destete):**
          * Código del cuy
          * Fecha de destete
          * Edad al destete
          * Jaula destino
          * Sexo
          * Raza
          * Peso al destete
          * Observaciones
     4. `Actualizar aforo de jaulas`
     5. `Transcribir destete y recría a Excel`

---

### C. Sub-rutina: Desarrollo, Recría y Selección
* **Rol:** Encargada del criadero

1. **Decisión (Gateway):** `¿Pasó a etapa recría?`
   * **\[SÍ\]:** `Continuar cuidado en recría`
2. **Actividad:** `Registrar peso o engorde`
3. **Decisión (Gateway):** `¿Pasa a otra jaula?`
   * **\[NO\]:** `Mantener la jaula`
   * **\[SÍ\]:**
     1. `Definir jaula y trasladar al cuy`
     2. `Anotar traslado y actualizar aforo de la jaula`
     3. `Transcribir etapa y ubicación a Excel`
4. **Actividad:** `Evaluar salud y antecedentes productivos`
5. **Decisión (Gateway):** `¿Se selecciona para reproducción?`
   * **\[SÍ\]:**
     1. `Registrar etapa de reproducción`
     2. *(Pasa al flujo de la Fase 2: Reproducción)*
   * **\[NO\]:**
     1. `Registrar permanencia en engorde o descarte`
     2. `Anotar cambios en el cuaderno`
6. **Decisión (Gateway):** `¿Pasa a área de recría/engorde?`
   * **\[SÍ\]:**
     1. `Definir jaula según la selección`
     2. `Trasladar y anotar fecha, origen, destino y motivo`
     3. `Actualizar ocupación de ambas jaulas`
     4. `Transcribir información al cuaderno`
     5. `Realizar control sanitario`
     6. `Anotar fecha, atención y observaciones en historial`
     7. `Revisar inventario de jaulas`
        * 📋 **Campos de Datos (Registro e Inventario de Jaula):**
          * Número/código de jaula
          * Tipo
          * Estado
          * Capacidad
          * Cantidad actual
          * Sexo
          * Raza
          * Etapa
          * Observaciones
     8. `Registrar información de jaulas`
     9. `Realizar inventario de cuyes`
        * 📋 **Campos de Datos (Inventario General de Cuyes):**
          * Fecha
          * Jaula
          * Cantidad de machos
          * Cantidad de hembras
          * Raza
          * Etapa
          * Peso muestra 1
          * Peso muestra 2
          * Peso muestra 3
          * Peso promedio
          * Observaciones
     10. `Transcribir inventarios de jaulas y cuyes a Excel`
     11. `Elaborar reporte cada mes`
   * **\[NO\]:** `Mantener jaulas`

---

### D. Cierre del Ciclo de Crianza (Ingeniera)
* **Rol:** Ingeniera

1. **Actividad:** `Revisar reporte mensual`
2. **\[Fin de Crianza\]** (Círculo rojo / verde de fin de etapa)

---

## 🔄 3. Fase 2: Reproducción (`AS-IS_reproduccion.jpg`)

**Proceso:** `Reproducción`  
**Participantes / Roles:**
* `Ingeniera`
* `Encargada`

---

### A. Carril: Ingeniera
1. **\[Inicio\]** `Reproductoras seleccionadas` (Círculo verde)
2. **Actividad:** `Revisar reporte mensual`
3. **Actividad:** `Planificar empadres`

---

### B. Carril: Encargada
1. **Actividad:** `Revisar el registro de hembras en cuaderno y excel`
   * 📋 **Campos de Datos:**
     * Código de la hembra
     * Raza
     * Jaula actual
     * Fecha de nacimiento
     * Número de partos

2. **Decisión (Gateway):** `¿Las hembras tienen 3 meses o más?`
   * **\[NO\]:** `Mantener en su jaula de crianza` $\rightarrow$ **\[Fin\]** (Círculo rojo)
   * **\[SÍ\]:** Avanza a la siguiente evaluación.

3. **Decisión (Gateway):** `¿Ya tuvo su sexto parto?`
   * **\[SÍ\]:** `Marcar con rojo en el excel` *(Pasa directamente al flujo de descarte)*
   * **\[NO\]:** `Agrupar en una jaula`

4. **Actividad:** `Asignar un macho reproductor`
5. **Actividad:** `Definir jaula para el empadre`
6. **Actividad:** `Trasladar a las hembras y al macho`
7. **Actividad:** `Registrar traslado`
   * 📋 **Campos de Datos (Ficha de Traslado):**
     * Código del cuy
     * Fecha
     * Jaula de origen
     * Jaula de destino
     * Motivo
8. **Actividad:** `Actualizar estado y aforo de las jaulas`
9. **Actividad:** `Transcribir empadre a Excel`
10. **Actividad:** `Esperar gestación`
11. **Decisión (Gateway):** `¿La gestación llegó a parto?`
    * **\[NO\]:** `Registrar aborto en el registro de mortalidad` $\rightarrow$ *(Conecta con "Marcar con rojo en el excel")*
    * **\[SÍ\]:** `Registrar nacimiento en el cuaderno`
      * 📋 **Campos de Datos (Registro de Parto / Camada):**
        * Código de la madre
        * Jaula
        * Fecha
        * Número de nacidos en total
        * Número de machos
        * Número de hembras
        * Raza
        * Número de nacidos vivos
        * Número de nacidos muertos
        * Observaciones
        * Peso promedio

12. **Decisión (Gateway):** `¿Nacieron crías muertas?`
    * **\[SÍ\]:** `Registrar los nacidos muertos en el registro de mortalidad`
    * **\[NO\]:** Avanza al registro individual.

13. **Actividad:** `Realizar el registro individual de nacimiento`
    * 📋 **Campos de Datos (Ficha Nacimiento Individual):**
      * Código individual
      * Sexo
      * Raza
      * Madre
      * Fecha nacimiento
      * Jaula

14. **Actividad:** `Pasar los registros al excel`
15. **Actividad:** `Actualizar el registro individual de la reproductora`
16. **Actividad:** `Evaluar la salud y desempeño de la reproductora`
17. **Decisión (Gateway):** `¿Se descarta a la reproductora?`
    * **\[NO\]:** Retorna al inicio del carril: `Revisar el registro de hembras en cuaderno y excel`.
    * **\[SÍ\]:**
      1. `Marcar con rojo en el excel`
      2. `Registrar descarte`
         * 📋 **Campos de Datos (Ficha de Descarte):**
           * Código
           * Edad
           * Tiempo como reproductora
           * Número de partos
           * Motivo
           * Destino
      3. `Decidir su destino`
      4. **\[Fin de Reproducción\]** (Círculo rojo)

---

## 💰 4. Fase 3: Ventas (`AS-IS_ventas_2.png`)

**Proceso:** `Ventas`  
**Participantes / Roles:**
* `Cliente`
* `Encargado del área de cuyes`

---

### A. Carril: Cliente
1. **\[Inicio\]** (Círculo verde)
2. **Actividad:** `Solicitar compra de cuyes`
3. **Actividad:** `Realizar el pago en el sector externo`
4. **Actividad:** `Obtener el comprobante de pago`

---

### B. Carril: Encargado del área de cuyes
1. **Actividad:** `Recepcionar la solicitud del cliente`
2. **Actividad:** `Verificar la disponibilidad de cuyes`
3. **Decisión (Gateway):** `¿Hay cuyes disponibles?`
   * **\[NO\]:** `Informar al cliente que no hay disponibilidad` $\rightarrow$ **\[FIN\]** (Círculo rojo)
   * **\[SÍ\]:** `Acordar la cantidad y precio de venta`
4. **Actividad:** `Verificar comprobante de pago`
5. **Actividad:** `Registrar la venta con la serie y número del comprobante`
   * 📄 **Objeto de Datos / Documento:** `Registro de ventas`
6. **Actividad:** `Entregar los cuyes`
7. **Actividad:** `Actualizar el inventario`
   * 📄 **Objeto de Datos / Documento:** `Registro de inventario`
8. **\[FIN de Ventas\]** (Círculo rojo)

---

## 🛠️ 5. Estructura Técnica y Metadatos del Modelo Bizagi (`cuyeyos.bpm`)

El archivo fuente comprimido del modelo de Bizagi contiene la siguiente arquitectura interna:

* **Identificador Único de Diagrama:** `4f9963f6-1504-4ed5-8149-73f08f349af2.diag`
* **Archivos Estructurados XML / BPP:**
  * `ModelInfo.xml`: Estructura técnica de nodos, conectores y jerarquía de procesos.
  * `Participants.xml`: Configuración de roles, pools y swimlanes.
  * `Preferences.bpp`: Estilos gráficos, colores de elementos y fuentes del modelo.
* **Perfiles y Usuarios Configurados:**
  * `Users/Default/`: Plantillas base de documentación y preferencias de impresión.
  * `Users/desktop-u2okdf3_admin/`: Perfil técnico del equipo/entorno local.
  * `Users/pecita_geral/`: Autor y diseñador asignado al modelado del proceso.