# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tienda online de cartas Pokémon "Graded & Sealed TCG" (singles Raw, slabs PSA, producto sellado y sets).
Proyecto académico de IHC (PUCE): solo lo verán el profesor y compañeros, no se lanzará al mercado,
pero debe verse y funcionar como un e-commerce profesional real. Textos de la interfaz en español.

## Comandos

```bash
python -m http.server 5500                      # servidor local (config "web" en .claude/launch.json); file:// no funciona
node --test tests/*.test.mjs                    # todos los tests (Node 18+)
node --test tests/test_pdp.test.mjs             # un solo archivo
node --test --test-name-pattern="PSA" tests/test_pdp.test.mjs   # tests por nombre
node tools/generar_seed.js                      # regenera js/db/seed_catalogo.sql desde js/data.js
node tools/generar_cajas.js                     # regenera los SVG de las cajas en assets/img/sealed/<id>/
python tools/optimizar_sobres.py                # fotos de Gemini -> WebP 800x1200 en assets/img/packs/
```

No hay build, bundler ni linter: Tailwind, Lucide y `@supabase/supabase-js` se cargan por CDN.

Base de datos desde cero (editor SQL de Supabase), en este orden:
`js/db/schema.sql` → `js/db/funciones_rpc.sql` → `js/db/seed_catalogo.sql`.

## Estado de los tests

Hoy pasan 393 de 528. Los ~135 fallos están en suites heredadas que prueban funciones ya descartadas
(Google Sign-In/GIS, `decodeJwtResponse`, rutas hash `#tracking`, persistencia Dexie, sesión simulada):
`challenger_*`, `e2e_requirements_*`, `test_production_*`, `test_reviewer_*`, `test_adversarial_*`, entre otras.
Un cambio no debe aumentar el número de fallos ni romper las suites que hoy están en verde
(`test_pdp_3d_drag`, `test_keyboard_nav`, `test_filtro_letra`, `test_catalogo_ampliado`, `test_card_images`,
`test_sealed_packs`, `test_condition_pricing`, `test_validations`, `test_cart_toast`, `test_e2e_suite`, …).
Antes de borrar o reescribir una suite heredada, consultar al usuario.

`tests/test_harness.mjs` no usa navegador: `createMockEnvironment()` simula DOM/localStorage y
`loadProjectFile()` ejecuta los scripts de `js/` dentro de un `vm` sandbox. Por eso los scripts son
globales clásicos (no módulos ES) y los tests dependen de ids, clases y atributos concretos del HTML generado:
mantener esos selectores.

## Arquitectura

**Multipágina con renderizado por JS.** Cada sección es un HTML propio (`index.html` en la raíz y el resto
en `pages/`), pero todos tienen la misma estructura: navbar y footer estáticos, `<body data-page="…">` y un
`<main id="app-view">` vacío. Al cargar, `app.handleRoute()` (`js/app.js`) lee `data-page` y los parámetros
de la URL (`?id=`, `?cat=`, `?era=`, `?letra=`, `?q=`, `?order=`, `?tab=`), los vuelca en `Store.data` y
`app.renderCurrentView()` inyecta el HTML de la vista (`HomeView.render()`, `CatalogView.render()`,
`PDPView.render()`…) y luego llama a su `afterRender()`. Cada interacción que cambia el estado vuelve a
renderizar la vista (se guarda y restaura el foco con `getFocusKey/restoreFocus`).

- Para navegar entre páginas usar `app.url(route, params)` / `app.go(route, params)`; el mapa ruta → archivo
  está en `app.PAGES`. Los nombres de ruta internos (`home`, `catalog`, `pdp`, `cart`, `checkout`,
  `confirmation`, `error`, `auth`, `profile`, `tracking`, `search-results`) son los valores de `data-page`.
- **Todos los HTML de `pages/` tienen `<base href="../">`**: las rutas se escriben siempre relativas a la raíz
  (`js/app.js`, `pages/catalogo.html`, `assets/…`), nunca con `../`.
- Hoy cada HTML carga el mismo conjunto completo de scripts (porque `renderCurrentView` referencia todas las
  vistas). El orden importa: config Supabase → `supabase-api.js` → `data.js` → `state.js` → `validators.js` →
  `services/pokemon-api.js` → `views/*.js` → `app.js` (último).
- Cada HTML tiene una meta `Content-Security-Policy`: un dominio externo nuevo (CDN, API, imágenes) debe
  añadirse en los 11 HTML.

**Estado.** `js/state.js` define `Store` (`Store.data.currentUser`, `cart`, `catalogFilters`, `favorites`,
`orders`…). La sesión se guarda en localStorage (`gstcg_user`) y una sesión sin `token` se descarta.

**Datos y backend.** Todo acceso a Supabase pasa por `SupabaseAPI` (`js/db/supabase-api.js`); las vistas no
llaman a Supabase directamente. Las tablas no son legibles desde el navegador: todo va por funciones RPC
definidas en `js/db/funciones_rpc.sql` (registro/login con bcrypt en el servidor, órdenes, tracking, catálogo).
Es decir, el login **no** usa Supabase Auth sino RPC propias que devuelven un token. Los errores de la BD llegan
como códigos (`EMAIL_EXISTE`, `SIN_STOCK`, `PRECIO_CAMBIO`…) que `SupabaseAPI.ERRORS` traduce a español.
Si no hay conexión, `app.showOfflineNotice()` avisa y la web sigue con el catálogo local. No existe
`db-client.js` ni Dexie (aunque `docs/PROJECT.md` y el harness los mencionen).
Solo la publishable/anon key va en `js/db/supabase-config.js`; nunca la service_role.

**Catálogo y precios.** `js/data.js` define `POKEMON_CARDS_CATALOG_10` + `POKEMON_CARDS_EXTRA` (35 cartas),
`SEALED_PRODUCTS` y el array final `PRODUCTS`. El precio Raw es el real de TCGplayer a `PRECIOS_FECHA`;
los grados PSA salen de `MULTIPLICADORES_PSA` (8/9/10 = Raw × 1.6 / 2.4 / 4.5). La función RPC de la orden
revalida precios contra `certificaciones_psa`, así que **al tocar productos o precios en `data.js` hay que
ejecutar `node tools/generar_seed.js` y aplicar el seed en Supabase**, o el checkout falla con `PRECIO_CAMBIO`.

**Imágenes.** Cartas en `assets/img/cards/` (con URL externa de `images.pokemontcg.io` como fallback),
sellados en `assets/img/sealed/<id>/` (vistas frontal/lateral/superior/perspectiva para el visor 3D),
sobres generados con IA (Gemini, fuera de Claude) en `assets/img/packs/` como WebP.

**Documentación.** `docs/PROJECT.md` (histórico, desactualizado en Google Sign-In y router hash),
`docs/PLAN_DE_TRABAJO.md`, `docs/tarjetas-de-prueba.md` (tarjetas para el checkout),
`docs/guia-inventario.md` (reponer stock), capturas en `docs/capturas/`.

## Decisiones vigentes

- **Google Sign-In / GIS está DESCARTADO.** No añadir ni mantener código de Google. Si aparece código GIS,
  consultar antes de eliminarlo.
- **El router por hash está DESCARTADO.** La navegación es multipágina con enlaces normales; JS solo aporta
  la lógica de cada página. Si queda código del router hash, proponer eliminarlo.
- **El proyecto debe seguir siendo multipágina** (requisito académico): no fusionar los HTML en uno.
  Navbar y footer iguales en todas las páginas.
- Archivos en `kebab-case`, sin espacios ni sufijos tipo `-v2`, `-final`, `-copia`; cada archivo nuevo en su
  carpeta (`pages/`, `js/views/`, `js/db/`, `assets/img/…`, `tests/`, `docs/`, `tools/`).
- Cero errores en consola.

## Requisitos de calidad que hay que mantener

- Logo oficial de Pokémon en `assets/img/logo/`. Footer con el aviso: "Pokémon y sus marcas pertenecen a
  Nintendo, Creatures Inc. y GAME FREAK. Proyecto académico sin fines comerciales."
- Iconos Lucide coherentes (mismo tamaño y grosor); decorativos con `aria-hidden="true"`, botones solo-icono
  con `aria-label`.
- Imágenes con `alt` descriptivo, `loading="lazy"`, tamaño definido y fallback si fallan.
- WCAG 2.2 AA: HTML semántico (`button` real, no `div` clicables), contraste ≥ 4.5:1, foco visible y no tapado
  por elementos fijos, objetivos táctiles ≥ 24×24 px, formularios con `label` y errores en `aria-live`,
  sin pedir datos repetidos, alternativa sin arrastre para el visor 3D, respetar `prefers-reduced-motion`.
- Teclado: todo usable con Tab/Shift+Tab/Enter/Espacio/Esc; enlace "Saltar al contenido"; diálogos y drawer
  atrapan el foco (`app.openDialog/closeDialog`), cierran con Esc y devuelven el foco; visor 3D girable con
  flechas; al cargar una página el foco va al encabezado de la vista.

## Forma de trabajar

- Para cambios grandes, proponer un plan antes de editar.
- Nunca borrar archivos sin aprobación explícita del usuario; antes, verificar con grep que no estén
  referenciados en HTML, JS, tests ni tools.
- Ejecutar los tests después de cada cambio relevante.
