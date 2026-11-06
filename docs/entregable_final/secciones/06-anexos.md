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
