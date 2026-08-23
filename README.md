# Sistema de Control de Animales

Sistema web para la **Facultad de Zootecnia (UNAS)**, diseñado para reemplazar el registro en papel y automatizar el reporte en Excel de las unidades de crianza.

El proyecto está planteado como un sistema **modular por especie**:
- **Núcleo común** (acceso, granjas, áreas, jaulas, inventario, trazabilidad, reportes)
- **Módulos por especie** (primero: **cuyes**; luego: conejos, chanchos, etc.)

## Estado actual

Esta etapa está centrada en **ingeniería de requisitos**.  
La base funcional son **65 historias de usuario**:

- **41 historias NUC** (núcleo)
- **24 historias CUY** (módulo cuyes)

Documento fuente: `docs/historias-de-usuario.md`.

## Modelo funcional acordado

- Jerarquía operativa: **especie → granja → área → jaula → animal**
- Cada granja maneja **una sola especie**
- Flujo de trabajo al ingresar: **especie → granja**
- Soporte **multigranja** con alcance por granja para cada usuario
- Transferencias permitidas solo entre granjas de la misma especie

## Significado de prefijos

- `NUC-xx`: historia del **núcleo**, reutilizable para cualquier especie
- `CUY-xx`: historia **específica de cuyes**

La numeración está organizada por épicas para facilitar lectura y trazabilidad.

## Resumen de historias por épica

### Núcleo (41)
- **N1 Acceso y contexto:** `NUC-01` a `NUC-08`
- **N2 Ficha de animal:** `NUC-09` a `NUC-12`
- **N3 Áreas, jaulas y movimientos:** `NUC-13` a `NUC-20`
- **N4 Pesaje:** `NUC-21` a `NUC-23`
- **N5 Sanidad:** `NUC-24` a `NUC-25`
- **N6 Mortalidad y ventas:** `NUC-26` a `NUC-27`
- **N7 Inventario:** `NUC-28` a `NUC-32`
- **N8 Alertas:** `NUC-33` a `NUC-35`
- **N9 Reportes:** `NUC-36` a `NUC-37`
- **N10 Confiabilidad:** `NUC-38` a `NUC-41`

### Módulo Cuyes (24)
- **C1 Configuración:** `CUY-01` a `CUY-05`
- **C2 Reproductoras:** `CUY-06` a `CUY-11`
- **C3 Reproductores:** `CUY-12` a `CUY-15`
- **C4 Pesos y alertas:** `CUY-16` a `CUY-18`
- **C5 Reproductores élite:** `CUY-19` a `CUY-21`
- **C6 Exportación Excel:** `CUY-22` a `CUY-24`

## Orden recomendado de implementación

1. **Entrega 1 (P1):** reemplazar el registro en papel y generar Excel oficial
2. **Entrega 2 (P2):** control operativo diario (movimientos, pesos, sanidad, consolidados)
3. **Entrega 3 (P3):** alertas avanzadas y apoyo a decisiones de mejoramiento

Detalle: `docs/backlog.md`.

## Estructura del repositorio

```
Cuy-system/
├── backend/         # Node.js + Express (API)
├── frontend/        # React (interfaz web)
├── database/        # Esquema PostgreSQL
└── docs/            # Requisitos y documentos funcionales
```

## Stack objetivo

- **Frontend:** React
- **Backend:** Node.js
- **Base de datos:** PostgreSQL
- **Despliegue:** Docker

## Documentación clave

- `docs/vision.md` — visión, alcance y criterios de éxito
- `docs/actores.md` — roles, permisos y alcance por granja
- `docs/historias-de-usuario.md` — las 65 historias completas
- `docs/backlog.md` — priorización por entregas
- `docs/modulos-futuros.md` — guía para agregar nuevas especies

También existe una versión equivalente en `docs/requisitos/` como respaldo de organización.
