---
name: ux-mockup-builder
description: "Usar cuando llega un proyecto nuevo de UI/UX y hay que crear un mockup en HTML para que lo usen otros diseñadores UX/UI."
---

# Constructor de mockups HTML para diseñadores UX/UI

Esta skill define el flujo completo para convertir el contexto de un proyecto nuevo en un mockup HTML navegable, bien aterrizado y listo para que otros diseñadores UX/UI lo revisen, iteren o lo usen como referencia (no es un handoff a desarrollo).

## 0. Regla de oro

Nunca empezar a maquetar sin haber cerrado el paso 1 (intake de contexto). Un mockup construido con información incompleta genera retrabajo. Si falta algo crítico, preguntar antes de producir HTML.

## 1. Mensaje de apertura obligatorio

Cada vez que esta skill se invoca, ANTES de hacer la primera pregunta, mandar un mensaje corto (2-4 líneas) que explique en simple:

- Que vas a hacerle unas preguntas sobre el proyecto, **una por una** (no todas juntas de golpe), para entender bien el contexto antes de maquetar.
- Que puede responder con la info que tenga a mano, y que si algo no lo sabe, lo puede decir y vos avanzás con un supuesto razonable (que quedará anotado luego en el propio mockup).
- Qué va a recibir al final: un mockup HTML navegable (o piezas sueltas, según lo que se defina en el intake), persistido como artifact para que otros diseñadores puedan reabrirlo, iterarlo y comentarlo — no es un entregable para desarrollo salvo que se pida explícitamente.

Recién después de este mensaje, arrancar con la primera pregunta del checklist (punto 1 de la sección 2).

## 2. Intake de contexto — checklist, una pregunta a la vez

Este es el checklist interno (11 puntos, mismo orden y numeración siempre) que hay que cubrir antes de maquetar. **Nunca mostrar la lista completa de una ni pedirle al usuario que la responda toda junta.** Se pregunta de a una, en lenguaje natural y breve (sin necesidad de citarle el número al usuario — el número es para uso interno, para llevar la cuenta de qué falta), se espera su respuesta, y recién ahí se pasa a la siguiente pregunta pendiente.

Si el usuario ya dio algo de esta info antes de invocar la skill (por ejemplo, la mencionó en su pedido inicial), dar ese punto por respondido, no volver a preguntarlo, y saltar directo al siguiente punto pendiente del checklist.

Si en cualquier respuesta el usuario cuenta varias cosas de un saque (aunque se le haya preguntado solo una), aprovechar esa info para dar por cubiertos todos los puntos que haya tocado, y seguir preguntando solo lo que quede pendiente — nunca repreguntar algo ya respondido.

**Negocio y problema**
1. Contexto del proyecto: qué es, para quién, por qué existe ahora.
2. Problemática: qué dolor/fricción se está resolviendo, con evidencia si existe (research, tickets de soporte, métricas).
3. Solución esperada: qué se espera que el mockup resuelva o valide; alcance (¿una feature puntual, un flujo completo, un producto nuevo?).

**Usuarios**
4. Perfil(es) de usuario / personas.
5. Nivel de expertise, dispositivo principal (mobile/desktop/ambos), contexto de uso.

**Documentación y referencias**
6. PRD, brief, research, wireframes previos, links de Figma, competidores de referencia.
7. Design system o guía de marca existente: colores, tipografías, componentes, tokens. Si no hay uno formal, referencias visuales (screenshots, sitios, paleta) o usar una paleta neutra de placeholder y decirlo explícitamente.

**Alcance técnico del mockup**
8. Plataforma: web responsive, solo desktop, solo mobile, app.
9. Fidelidad esperada: low-fi (wireframe funcional) vs high-fi (visual pulido, casi producción).
10. Pantallas/flujos a cubrir y sus estados (vacío, carga, error, éxito, edge cases).
11. ¿El mockup debe tener navegación clickeable entre pantallas o son piezas sueltas?

Si una respuesta viene ambigua o incompleta para el punto que se está preguntando, repreguntar puntualmente ese mismo ítem antes de avanzar al siguiente. Si el usuario no provee algo imprescindible para arrancar (ej. usuarios, alcance, o si existe design system) y no lo aclara al repreguntar, usar AskUserQuestion antes de construir. Si es un detalle menor (ej. un estado de error específico), se puede asumir razonablemente y dejarlo anotado como supuesto en el propio mockup, sin trabar por eso el flujo de preguntas.

Una vez cubiertos los 11 puntos (por respuesta directa, por info ya dada antes, o por supuesto razonable en los casos menores), confirmar brevemente que ya se tiene lo necesario y pasar a construir.

## 3. Skills a cargar y cuándo

Durante este flujo, invocar (con la herramienta Skill) lo que aplique, en este orden aproximado:

1. **`design:user-research` / `design:research-synthesis`** — si el usuario aportó transcripciones, encuestas o notas de research crudas que hay que sintetizar antes de diseñar.
2. **`artifact-design`** — SIEMPRE antes de escribir el archivo HTML del mockup (obligatorio según las reglas de Artifacts). Calibra cuánta inversión de diseño amerita esta pieza.
3. **`artifact-diagramming`** — si el mockup necesita un diagrama de flujo de usuario o mapa de navegación como parte de la entrega.
4. **`design:ux-copy`** — para redactar microcopy real (botones, mensajes de error, estados vacíos) en vez de dejar lorem ipsum.
5. **`impeccable`** — para pulir jerarquía visual, espaciado, tipografía, estados de interacción antes de dar por terminado el mockup.
6. **`design:design-system`** — si el proyecto ya tiene un design system, para chequear consistencia de naming, tokens y componentes reutilizados.
7. **`design:accessibility-review`** — auditoría WCAG 2.1 AA antes de entregar (contraste, foco, tamaños táctiles).
8. **`design:design-critique`** — autocrítica estructurada del mockup ya armado, antes de mandarlo.
9. **`design:design-handoff`** — solo si además de otros diseñadores, el mockup también va a pasar a desarrollo; genera la spec de implementación.

No es necesario invocarlas todas en cada proyecto — usar criterio según el alcance definido en el paso 2.

## 4. Proceso de construcción

1. **Resumir el contexto recibido** en 3-5 líneas al usuario, confirmando problemática, usuarios y alcance antes de maquetar (evita construir sobre un malentendido).
2. **Definir la arquitectura de información / flujo**: listar las pantallas necesarias y el flujo entre ellas. Si el flujo es complejo, esbozarlo primero como diagrama (ver `artifact-diagramming`).
3. **Elegir fidelidad y tokens visuales**: si hay design system, usar sus colores/tipografías/espaciados reales. Si no hay, definir una paleta y tipografía coherente y dejarlo declarado al inicio del mockup como "sistema visual usado en esta propuesta".
4. **Construir el HTML** como una sola página autocontenida (CSS y JS inline, sin dependencias externas salvo Google Fonts si aplica) que incluya:
   - Una sección de **contexto** al inicio (o un panel lateral) con: problema, usuarios, alcance y supuestos tomados — así cualquier diseñador que abra el mockup entiende el porqué sin preguntar.
   - Las **pantallas/flujos** solicitados, navegables entre sí si se pidió interacción (tabs, clicks que cambian de vista, o anclas).
   - Los **estados relevantes** de cada pantalla (vacío, error, carga, éxito) cuando aplique al alcance.
   - Anotaciones visuales discretas (tooltips, notas al margen) señalando decisiones de diseño no obvias, sin que estorben la lectura visual.
5. **Pulir** con `impeccable` (jerarquía, spacing, estados hover/focus) y correr `design:accessibility-review`.
6. **Autocrítica** con `design:design-critique` antes de entregar; ajustar lo que aplique.
7. **Entregar**: dado que es una pieza que otros diseñadores van a revisar, iterar y probablemente reabrir después, se persiste según `<persisted_artifacts>` — no se manda solo como archivo suelto salvo que el usuario pida explícitamente "algo rápido, de un solo uso". Preferir el tipo de artifact **Design** o **Whiteboard** si el flujo tiene varias pantallas/artboards y el usuario u otros diseñadores necesitan editar visualmente; usar una página HTML publicada con el Artifact tool cuando el pedido es específicamente "un mockup en HTML" navegable.

## 5. Checklist final antes de entregar

- ¿El mockup deja claro, sin contexto externo, qué problema resuelve y para quién?
- ¿Cubre todas las pantallas/estados acordados en el alcance?
- ¿Los textos son copy real (no lorem ipsum) en los puntos clave (CTAs, errores, vacíos)?
- ¿Pasó accesibilidad básica (contraste, foco, tamaños táctiles)?
- ¿Es coherente con el design system o paleta declarada, sin colores/tipografías sueltas?
- ¿Quedan anotados los supuestos que se tomaron por falta de información?
- ¿Se entregó de forma persistente (artifact) para que otros diseñadores puedan volver a abrirlo?

## 6. Si llega un proyecto nuevo sin usar la palabra "mockup"

Aplicar igual este flujo (mensaje de apertura + preguntas de a una) si el pedido es equivalente: "maquetá esta pantalla", "necesito un wireframe navegable", "armá una propuesta visual para que el equipo de diseño la revise", etc.