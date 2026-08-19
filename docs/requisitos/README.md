# Ingeniería de requisitos — Cuy System

Sistema web de control de animales para la Facultad de Zootecnia (UNAS). Fase actual: **solo requisitos**, sin implementación.

## Por dónde empezar

1. **[01-vision.md](01-vision.md)** — Problema, alcance, estructura del sistema y criterios de éxito.
2. **[02-actores.md](02-actores.md)** — Roles, permisos y alcance por granja.
3. **[historias-de-usuario.md](historias-de-usuario.md)** — Las **65 historias** (NUC + CUY) en un solo documento.
4. **[06-backlog.md](06-backlog.md)** — Priorización en tres entregas (P1, P2, P3).

## Documentos

| Archivo | Contenido |
|---|---|
| [01-vision.md](01-vision.md) | Visión, jerarquía especie → granja → área → jaula, comparación con Quwi |
| [02-actores.md](02-actores.md) | Superadmin, Admin, Encargado, Supervisor, Auxiliar |
| [historias-de-usuario.md](historias-de-usuario.md) | **41 historias núcleo** (NUC-01 a NUC-41) + **24 cuyes** (CUY-01 a CUY-24) |
| [05-modulos-futuros.md](05-modulos-futuros.md) | Cómo agregar conejos, chanchos u otra especie |
| [06-backlog.md](06-backlog.md) | Backlog priorizado y dependencias |

## Insumos de elicitación

Plantillas Excel oficiales de la unidad en **[elicitacion/](elicitacion/)**:

- [INVENTARIO CUYES.xlsx](elicitacion/INVENTARIO%20CUYES.xlsx)
- [HEMBRAS REGISTRO INDIVIDUAL.xlsx](elicitacion/HEMBRAS%20REGISTRO%20INDIVIDUAL.xlsx)
- [MACHOS REGISTRO INDIVIDUAL.xlsx](elicitacion/MACHOS%20REGISTRO%20INDIVIDUAL.xlsx)

## Resumen de historias

Los IDs están **agrupados por épica**. El número indica la épica y el orden dentro de ella.

| Parte | Épica | IDs | Cantidad |
|---|---|---|---|
| Núcleo | N1 Acceso y contexto | NUC-01 a NUC-08 | 8 |
| Núcleo | N2 Ficha de animal | NUC-09 a NUC-12 | 4 |
| Núcleo | N3 Áreas, jaulas y movimientos | NUC-13 a NUC-20 | 8 |
| Núcleo | N4 Pesaje | NUC-21 a NUC-23 | 3 |
| Núcleo | N5 Sanidad | NUC-24 a NUC-25 | 2 |
| Núcleo | N6 Mortalidad y ventas | NUC-26 a NUC-27 | 2 |
| Núcleo | N7 Inventario | NUC-28 a NUC-32 | 5 |
| Núcleo | N8 Alertas | NUC-33 a NUC-35 | 3 |
| Núcleo | N9 Reportes | NUC-36 a NUC-37 | 2 |
| Núcleo | N10 Confiabilidad | NUC-38 a NUC-41 | 4 |
| Cuyes | C1 Configuración | CUY-01 a CUY-05 | 5 |
| Cuyes | C2 Reproductoras | CUY-06 a CUY-11 | 6 |
| Cuyes | C3 Reproductores | CUY-12 a CUY-15 | 4 |
| Cuyes | C4 Pesos y alertas | CUY-16 a CUY-18 | 3 |
| Cuyes | C5 Reproductores élite | CUY-19 a CUY-21 | 3 |
| Cuyes | C6 Exportación Excel | CUY-22 a CUY-24 | 3 |
| **Total** | | **NUC-01 a NUC-41 + CUY-01 a CUY-24** | **65** |
