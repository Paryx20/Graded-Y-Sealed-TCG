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
node tools/generar_seed.js --solo id1,id2 --salida js/db/seed-x.sql   # solo esos productos, con on conflict do nothing
node tools/generar_cajas.js                     # regenera los SVG de las cajas en assets/img/sealed/<id>/
node tools/generar_sobres.js                    # SVG provisionales de los sobres con fotoProvisional: true
python tools/optimizar_sobres.py assets/img/packs/_originales   # fotos de Gemini -> WebP 800x1200 en assets/img/packs/
```

No hay build, bundler ni linter: Tailwind, Lucide y `@supabase/supabase-js` se cargan por CDN.

Base de datos desde cero (editor SQL de Supabase), en este orden:
`js/db/schema.sql` → `js/db/funciones_rpc.sql` → `js/db/admin_rpc.sql` → `js/db/seed_catalogo.sql`.
Sobre la BD que ya existía (v23) se aplicaron el 2026-11-06 `js/db/migracion-v24.sql` (cancelaciones, contraseñas,
seguimiento) y `js/db/seed-sobres-v24.sql` (8 sobres + 5 cartas). Los sobres tienen 5 unidades de stock.

## Estado de los tests

Hoy pasan 399 de 539. Los 140 fallos están en suites heredadas que prueban funciones ya descartadas
(Google Sign-In/GIS, `decodeJwtResponse`, rutas hash `#tracking`, persistencia Dexie, sesión simulada,
y la compra de cartas de la API con precio estimado):
`challenger_*`, `e2e_requirements_*`, `test_production_*`, `test_reviewer_*`, `test_adversarial_*`, entre otras.
Un cambio no debe aumentar el número de fallos ni romper las suites que hoy están en verde
(`test_pdp_3d_drag`, `test_keyboard_nav`, `test_catalog_stock`, `test_admin`, `test_catalogo_ampliado`,
`test_card_images`, `test_sealed_packs`, `test_condition_pricing`, `test_validations`, `test_cart_toast`,
`test_e2e_suite`, …).
Antes de borrar o reescribir una suite heredada, consultar al usuario.

`tests/test_harness.mjs` no usa navegador: `createMockEnvironment()` simula DOM/localStorage y
`loadProjectFile()` ejecuta los scripts de `js/` dentro de un `vm` sandbox. Por eso los scripts son
globales clásicos (no módulos ES) y los tests dependen de ids, clases y atributos concretos del HTML generado:
mantener esos selectores.

## Arquitectura

**Multipágina con renderizado por JS.** Cada sección es un HTML propio (`index.html` en la raíz y el resto
en `pages/`), pero todos tienen la misma estructura: navbar y footer estáticos, `<body data-page="…">` y un
`<main id="app-view">` vacío. Al cargar, `app.handleRoute()` (`js/app.js`) lee `data-page` y los parámetros
de la URL (`?id=`, `?cat=`, `?era=`, `?set=`, `?page=`, `?q=`, `?order=`, `?tab=`), los vuelca en `Store.data` y
`app.renderCurrentView()` inyecta el HTML de la vista (`HomeView.render()`, `CatalogView.render()`,
`PDPView.render()`…) y luego llama a su `afterRender()`. Cada interacción que cambia el estado vuelve a
renderizar la vista (se guarda y restaura el foco con `getFocusKey/restoreFocus`).

- Para navegar entre páginas usar `app.url(route, params)` / `app.go(route, params)`; el mapa ruta → archivo
  está en `app.PAGES`. Los nombres de ruta internos (`home`, `catalog`, `pdp`, `cart`, `checkout`,
  `confirmation`, `error`, `auth`, `profile`, `tracking`, `search-results`, `guide`) son los valores de `data-page`.
- **Todos los HTML de `pages/` tienen `<base href="../">`**: las rutas se escriben siempre relativas a la raíz
  (`js/app.js`, `pages/catalogo.html`, `assets/…`), nunca con `../`.
- Hoy cada HTML carga el mismo conjunto completo de scripts (porque `renderCurrentView` referencia todas las
  vistas). El orden importa: config Supabase → `supabase-api.js` → `data.js` → `state.js` → `validators.js` →
  `services/pokemon-api.js` → `views/*.js` → `app.js` (último).
- Cada HTML tiene una meta `Content-Security-Policy`: un dominio externo nuevo (CDN, API, imágenes) debe
  añadirse en los 12 HTML (11 de la tienda + `pages/guia.html`; `admin.html` aparte).

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

**Catálogo y precios.** `js/data.js` define `POKEMON_CARDS_CATALOG_10` + `POKEMON_CARDS_EXTRA` (40 cartas),
`SEALED_PRODUCTS` y el array final `PRODUCTS` (nombres, fotos, descripciones). Con conexión, precio y stock
vienen de Supabase (`v_catalogo`, fusionado en `Store.loadCatalogFromServer`): **la BD es la fuente de verdad**
y los precios de `data.js` (Raw real de TCGplayer a `PRECIOS_FECHA`, PSA = Raw × 1.6 / 2.4 / 4.5 según
`MULTIPLICADORES_PSA`) son solo el respaldo sin conexión y la base del seed. `guardar_orden` revalida el precio
contra `certificaciones_psa` y rechaza SKU que no estén activos en el inventario (`PRODUCTO_NO_DISPONIBLE`);
`Store.repriceCart()` ajusta la bolsa al precio vigente al cargar. `node tools/generar_seed.js` solo sirve para
crear la BD desde cero: aplicarlo sobre una BD con datos pisaría los cambios hechos en el panel de inventario.

**Stock por grado.** `CatalogView.inStock / availableGrades / matchesCategory / getDisplayOption`
(`js/views/catalog.js`) deciden qué se muestra: Slabs PSA = stock en psa8/9/10, Raw = stock raw,
Sellados = stock sealed, Todo = stock en algún grado. Stock desconocido (sin conexión) cuenta como disponible.
Inicio, buscador de la navbar y ficha (grados "Agotado") usan los mismos helpers. Ya no hay filtro por letra.
En "Slabs PSA" la tarjeta se dibuja como estuche (`.catalog-slab`).

**Expansiones y paginación.** `EXPANSIONES` (`js/data.js`) agrupa los `set` en expansiones con `slug`; cada
producto recibe `expansion`. El menú "Expansiones" de la navbar lo pinta `app.renderExpansionsMenu()` en
`#expansions-menu` (fuera del contenedor con scroll) y lleva a `catalogo.html?set=<slug>`. El catálogo muestra
`CatalogView.PAGE_SIZE` (12) productos por página con `?page=`; `getFilteredProducts()` sigue devolviendo la
lista completa (los tests lo usan) y `paginate()` corta solo al renderizar.

**Dos buscadores.** El de la navbar (`app.renderLiveSearchDropdown` / `executeGlobalSearch`) busca solo en el
inventario y lleva a `pages/catalogo.html?q=`. "Explorar cartas" (`pages/busqueda.html`, `SearchResultsView`)
consulta la API pública vía `PokemonAPI` (pokemontcg.io → TCGdex) solo como referencia, sin compra. Muestra el
precio de mercado real de la API (`precioMercado`, TCGplayer/Cardmarket; con TCGdex se pide al abrir el detalle
con `PokemonAPI.fetchMarketPrice`), nunca el `precioEstimado` calculado;
enlaza a la ficha si la carta coincide (nombre + número o set) con un producto en stock.

**Pedidos y seguimiento.** `pages/seguimiento.html` (`TrackingView`) muestra "Mis pedidos" con sesión y el
detalle con `?order=`. El avance es simulado por tiempo desde `fecha_creacion` (`MILESTONES_MIN`: 2/5/10 min)
y se guarda con `actualizar_estado_orden` (nunca retrocede). Paso 0 = cancelado (`cancelar_orden`, solo en
preparación, devuelve stock). Ya no se pide la cédula al entregar: la cédula solo sirve para la factura y para
buscar un pedido sin sesión. Efectivo + retiro muestra "Pago pendiente". El pago con tarjeta se puede
cancelar desde el diálogo (`CheckoutView.cancelPayment`) y la tarjeta `4000 0000 0000 0226` simula una
cancelación del banco. Contraseñas: `cambiar_password` (perfil) y `restablecer_password` (login `?tab=recover`,
verifica correo + cédula, sin correo electrónico).

**Panel de inventario.** `pages/admin.html` + `js/views/admin.js` (no enlazado desde la tienda, `noindex`,
no carga `app.js`). Usa las RPC de `js/db/admin_rpc.sql`, que exigen `usuarios.rol = 'ADMIN'` en el servidor
(`_exigir_admin`, sesión de 8 h). El rol solo se asigna a mano en el SQL Editor; nunca escribir correos reales
en el repositorio.

**Imágenes.** Cartas en `assets/img/cards/` (con URL externa de `images.pokemontcg.io` como fallback),
sellados en `assets/img/sealed/<id>/` (vistas frontal/lateral/superior/perspectiva para el visor 3D),
sobres generados con IA (Gemini, fuera de Claude) en `assets/img/packs/` como WebP; los sobres con
`fotoProvisional: true` usan un SVG de `tools/generar_sobres.js` hasta tener foto (`docs/prompts-sobres.md`).
La carta 3D explicativa (`js/views/card-explainer.js`, home y guía) usa `assets/img/cards/blastoise-ex-151.webp`.

**Home y guía.** El home es corto: hero, ventajas, "¿Qué son las cartas Pokémon?" (lenguaje para público
general), la carta 3D con puntos explicativos, destacados, sobres y expansiones; las secciones `.reveal` aparecen
al hacer scroll (sin animación con reduced-motion). `#app-loader` (solo `index.html`) es la pantalla de carga de
la primera visita de la sesión; la retira `app.hideLoader()`. `pages/guia.html` (`GuideView`) explica productos,
partes de una carta, estados, notas PSA, cómo comprar y preguntas frecuentes.

**Documentación.** `docs/PROJECT.md` (histórico, desactualizado en Google Sign-In y router hash),
`docs/PLAN_DE_TRABAJO.md`, `docs/tarjetas-de-prueba.md` (tarjetas para el checkout),
`docs/guia-inventario.md` (panel de inventario y SQL de stock), `docs/plan-panel-admin-y-rediseno.md`,
capturas en `docs/capturas/`.

**Estilo visual.** Paleta navy/carmesí sin degradados ni brillos decorativos, esquinas `rounded-lg` (tarjetas)
y `rounded-md` (botones/inputs), sombras suaves, textos de tienda (sin "bóveda/inversión"). El footer no se toca.

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
