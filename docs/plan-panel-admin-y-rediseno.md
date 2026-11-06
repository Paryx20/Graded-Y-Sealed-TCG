# Plan: panel de administrador privado + rediseño sutil del frontend

## Contexto

Hay dos objetivos:

1. **Panel de administrador.** Hoy el inventario solo se cambia con SQL a mano en Supabase (`docs/guia-inventario.md`). Quieres un panel que solo tú puedas usar, para editar precios y stock y para ocultar o mostrar productos.
2. **Rediseño sutil.** Que la tienda se parezca más a un e-commerce real de coleccionables (TCGplayer, Card Kingdom, Troll and Toad) y menos a una plantilla hecha con IA. Se mantienen los colores navy/carmesí y la estructura, y **el footer no se toca**.

3. **Buscadores y filtros.** Separar el buscador de la tienda del buscador de la API (hoy se mezclan y dejan comprar cartas que no existen), quitar el filtro por letra y ocultar en los filtros lo que esté agotado, grado por grado (slab PSA o raw).

Además:
- Este plan se guardará como `docs/plan-panel-admin-y-rediseno.md` (primer paso al aprobarlo).
- **No habrá commit ni push** hasta que lo pidas.

## Datos del análisis que condicionan el diseño

- Desde el navegador, anon solo puede leer `v_catalogo`. Cualquier escritura tiene que pasar por una función RPC `SECURITY DEFINER`.
- `usuarios.rol` ya existe (por defecto `'CLIENTE_REGISTRADO'`), pero ningún código lo usa. El token de sesión no caduca.
- Cuando hay conexión, la tienda ya muestra precio y stock desde la BD (`Store.loadCatalogFromServer`, `js/state.js:287`). Un producto con `activo=false` desaparece de la tienda.
- El precio del carrito queda fijado al añadir el producto (`js/app.js:317`). Si cambias un precio en el panel, los carritos abiertos fallarían con `PRECIO_CAMBIO`.

## Parte A: panel de administrador (precios, stock y visibilidad)

### A1. SQL: nuevo archivo `js/db/admin_rpc.sql`

Se ejecuta después de `funciones_rpc.sql`.

**Rol de administrador**
- Añadir `check (rol in ('CLIENTE_REGISTRADO','ADMIN'))` a `usuarios`.
- El rol se asigna a mano en el SQL Editor con `update usuarios set rol='ADMIN' where email='<tu correo>'`. Tu correo **no** queda escrito en el repositorio.

**Función de control `_exigir_admin(p_token uuid)`** (privada, con `revoke` a anon)
- Busca al usuario por `token_sesion` y exige `rol='ADMIN'`.
- Exige además `ultimo_acceso > now() - interval '8 hours'`, así la sesión de admin caduca.
- Si alguna condición falla, lanza `NO_AUTORIZADO`.

**Funciones RPC de admin** (`security definer`, `grant execute` a anon; todas empiezan llamando a `_exigir_admin`)
- `admin_listar_productos(p_token)`: todos los productos, incluidos los inactivos, con `sku`, nombre, categoría, set, imagen, `activo`, y precio y stock por grado (de `certificaciones_psa`).
- `admin_actualizar_grado(p_token, p_sku, p_grado, p_precio numeric, p_stock int)`:
  - Valida que `precio > 0` y que `stock >= 0`.
  - Actualiza `certificaciones_psa`.
  - Hace upsert del mes actual en `historial_precios`, para que el gráfico de la ficha refleje el nuevo precio.
- `admin_cambiar_activo(p_token, p_sku, p_activo bool)`: oculta o muestra un producto.

El rol **no** se añade a `_usuario_json`: la tienda nunca recibe ninguna pista de que el panel existe.

### A2. Capa de datos: `js/db/supabase-api.js`

- Nuevos métodos `adminListProducts(token)`, `adminUpdateGrade(token, sku, grade, price, stock)` y `adminSetActive(token, sku, active)`. Reutilizan el `rpc()` existente.
- Nuevo mensaje en `ERRORS`: `NO_AUTORIZADO: 'Acceso no autorizado.'`

### A3. Página `pages/admin.html` y script `js/views/admin.js`

**Privacidad**
- No aparece en `app.PAGES`, ni en la navbar, ni en el footer, ni en ningún enlace.
- Lleva `<meta name="robots" content="noindex,nofollow">`.
- No se añade `robots.txt`, porque ese archivo mostraría la ruta.

**Scripts y aspecto**
- Carga solo lo necesario: Tailwind, Lucide, supabase-js, `supabase-config.js`, `supabase-api.js` y `admin.js`. **No** carga `app.js`, `data.js` ni las vistas de la tienda.
- Cabecera sobria propia: logo + "Panel de inventario" + "Cerrar sesión". Usa la misma CSP que las otras páginas.

**Flujo de acceso**
- Formulario de correo y contraseña. Llama a `SupabaseAPI.login` y después a `adminListProducts`.
- Si la respuesta es `NO_AUTORIZADO`, muestra solo "Acceso no autorizado" y descarta el token.
- El token de admin se guarda en `sessionStorage` (`gstcg_admin`), separado de la sesión de la tienda.
- Nota: entrar al panel rota tu token, así que en ese navegador se cerrará tu sesión de cliente.

**Tabla de inventario**
- Búsqueda por nombre/SKU, filtro por categoría (PSA, Raw, Sellado) y un filtro "solo stock bajo".
- Cada fila muestra miniatura, nombre, set, y los campos de precio y stock por grado.
- Botón "Guardar" por fila y un interruptor Activo/Oculto.
- En las cartas, botón "Recalcular PSA desde Raw", que aplica ×1.6, ×2.4 y ×4.5 (reutiliza `MULTIPLICADORES_PSA`, copiado como constante dentro de `admin.js`).
- Validación en el cliente: precio > 0 y stock entero ≥ 0.
- Mensajes de estado en `aria-live`, con `label` en cada campo y todo usable con teclado (WCAG AA, como el resto del sitio).

### A4. Reajuste de precios del carrito: `js/state.js`

- Después de `loadCatalogFromServer`, actualizar los items del carrito al precio vigente de la BD.
- Avisar con un toast: "El precio de X se actualizó".
- Así un cambio hecho en el panel no rompe el checkout con `PRECIO_CAMBIO`.

### A5. Aplicar en Supabase

- Ejecutar `admin_rpc.sql` y el `update` del rol. Lo haré con las herramientas de Supabase **solo si me das el OK en ese momento**, o lo ejecutas tú en el SQL Editor.
- Actualizar `docs/guia-inventario.md` y `CLAUDE.md`:
  - En línea, la BD es la fuente de verdad de precio y stock.
  - `data.js` es solo el respaldo offline.
  - `generar_seed.js` solo sirve para crear una BD desde cero.

## Parte B: rediseño sutil (sin tocar el footer ni la paleta)

Lo que más delata "hecho con IA", y su cambio:

1. **Textos.** Cambiar el tono de "bóveda/inversión/activos" por el de una tienda normal. Son unas 90 apariciones:
   - Hero (`js/views/home.js:50-70`).
   - Títulos de sección ("Tesoros Destacados de la Bóveda" pasa a "Destacados"; "¿Por qué invertir…?" pasa a "¿Por qué comprar con nosotros?").
   - Toast de bienvenida (`js/app.js:557`).
   - Lema del header "Bóveda TCG · PSA" y meta description, en los 11 HTML.
   - Textos de seguimiento (`js/views/tracking.js`, "Transporte blindado").
   - Descripciones de `js/data.js` ("Certificación Bóveda PSA").
   - Antes de cada cambio de texto, comprobar con grep si algún test en verde depende de él.
2. **Quitar** la barra de KPIs falsos (`+$280K Activos en Bóveda`, `home.js:91-108`) y las dos manchas `blur-3xl` (`home.js:34-35`).
3. **Degradados por fondos sólidos** en los banners de `home.js:15, 313, 528` y en `search-results.js:418`. Se mantiene el vídeo del hero.
4. **Esquinas menos redondeadas:**
   - `rounded-3xl`/`rounded-2xl` pasan a `rounded-lg` en tarjetas, secciones y modales.
   - `rounded-xl` pasa a `rounded-md` en botones, inputs y miniaturas.
   - El slab PSA no cambia.
5. **Tarjetas de producto** (`catalog.js:440-512`, `home.js:262-305`, `search-results.js`):
   - Un solo badge por tarjeta; se quita el chip verde de tendencia (sigue en la ficha).
   - La sombra al pasar el cursor baja de `shadow-xl` a `shadow-md`, con borde fino.
   - La foto y el precio quedan en primer plano, como en TCGplayer y Card Kingdom.
6. **Menos mayúsculas.** Los badges pasan de "GRADO INVERSIÓN • PSA 10" a "PSA 10" y se quitan las etiquetas pequeñas de encima de cada título. Se mantienen en etiquetas muy cortas (código del set).
7. **Sin animaciones decorativas:**
   - Se quitan `animate-ping`/`animate-pulse` de "Simulación en vivo" (`tracking.js`, `search-results.js`); los skeletons de carga se mantienen.
   - Se quitan el brillo dorado al pasar el cursor (`styles.css:405`) y el `backdrop-blur` de la tarjeta del hero.
8. **Sin tocar:** footer, colores, estructura de la navbar (salvo el lema), visor 3D, slab PSA, ids y clases que usan los tests.

## Parte C: dos buscadores claramente distintos

Hoy pulsar Enter en la navbar abre `pages/busqueda.html`. Esa página mezcla cartas de la API (pokemontcg.io → tcgdex.net) con un precio inventado (`calculateRealisticPrice`) y deja comprarlas, aunque no estén en el inventario. Además, `guardar_orden` acepta esos SKU desconocidos y usa el precio que manda el cliente. Así quedan los dos buscadores:

### Buscador de la tienda (navbar)
- Busca **solo en nuestro inventario**.
- **Enter** lleva a `pages/catalogo.html?q=…`; ya no lleva a `busqueda.html`.
- El desplegable en vivo:
  - Excluye lo agotado.
  - Muestra el precio del grado con stock.
  - Lleva el pie "Ver todos los resultados en la tienda →" y un enlace secundario "Buscar en la base de cartas Pokémon (API) →".
- Cambios en `app.executeGlobalSearch` y `app.renderLiveSearchDropdown` (`js/app.js:710-794`).

### "Explorar cartas" (búsqueda API, misma ruta `search-results` / `pages/busqueda.html`)
- Página de **referencia**, con aspecto propio de base de datos y no de tienda:
  - Lista o tabla compacta con imagen, nombre, set, número, rareza y fuente (pokemontcg.io / TCGdex).
  - Un aviso arriba: "Estas cartas vienen de una base de datos pública y no forman parte de nuestro inventario."
- **Sin precio ni botón de comprar.** Al hacer clic en una carta se abre un diálogo con la imagen grande y sus datos.
- Si la carta coincide con un producto en stock de la tienda, aparece el badge "Disponible en la tienda" y un enlace a su ficha.
- Si fallan las dos APIs: estado de error "No se pudo conectar con la base de cartas", con un enlace al buscador de la tienda (sin mezclar resultados locales).
- Fuera los textos "3-Tier Cascade", "API Gateway Activo" y los pulsos.
- Enlace "Explorar cartas" en la barra de categorías de la navbar, en los 11 HTML. Es el único cambio de estructura de la navbar.
- `js/services/pokemon-api.js` (failover entre APIs) **no cambia**: lo cubre `test_search_failover`, que está en verde.
- Se quita el camino que abría la ficha de una carta API con precio (`apiCardsCache` en `pdp.js`/`app.js`).

### Servidor
- En `guardar_orden` (`funciones_rpc.sql`), rechazar los SKU que no existan o estén inactivos con el nuevo error `PRODUCTO_NO_DISPONIBLE`, en vez de crearlos como `API_TCG`.
- Va en el mismo paso SQL que A1.

## Parte D: filtros solo con lo que hay en stock, y fuera el filtro por letra

### Quitar el filtro por letra
- Se elimina el bloque de botones A-Z, `setLetter`, `letterButtonState`, `initialOf`/`availableLetters`, `catalogFilters.letter` y el parámetro `?letra=`, en `js/views/catalog.js`, `js/app.js:132`, `js/state.js:27` y `.letter-btn` en `css/styles.css`.
- **Se borra `tests/test_filtro_letra.test.mjs`**: solo prueba ese filtro. Antes, comprobar con grep que nada más lo use.

### Stock por grado
- Nuevo helper `CatalogView.hasStock(card, grades)`, basado en `Store.getStock` (`js/state.js:336`). Si no hay conexión (stock desconocido), el producto se considera disponible, para no vaciar el catálogo.
- `matchesCategory` (`catalog.js:4`):
  - **Slabs PSA**: cartas con stock en psa8, psa9 o psa10.
  - **Raw**: cartas con stock raw.
  - **Sellados**: productos con stock sealed.
  - **Todo**: con stock en algún grado.
- Precio de referencia (filtro de precio y orden): el del grado en stock que corresponde a la categoría (en "Todo", el más barato con stock). La tarjeta muestra ese grado y ese precio.
- El desplegable de energía solo lista tipos que tengan productos con stock.
- Mismo criterio en los destacados del inicio (`home.js`) y en el desplegable del buscador.
- **Ficha** (`pdp.js`):
  - Los grados sin stock aparecen desactivados con la etiqueta "Agotado".
  - Si no queda ningún grado, la ficha muestra "Agotado" y desactiva "Añadir a la bolsa".
  - Se reutiliza la comprobación de stock que ya existe en `pdp.js:480, 551, 980`.

## Archivos principales

- **Nuevos:** `js/db/admin_rpc.sql`, `pages/admin.html`, `js/views/admin.js`, `tests/test_admin.test.mjs`, `tests/test_catalog_stock.test.mjs`, `docs/plan-panel-admin-y-rediseno.md`.
- **Borrado:** `tests/test_filtro_letra.test.mjs`.
- **Cambios en servidor:** `js/db/funciones_rpc.sql` (`guardar_orden` rechaza SKU desconocidos).
- **Modificados:**
  - `js/db/supabase-api.js` y `js/state.js` (reajuste de precios del carrito).
  - `js/views/home.js`, `catalog.js`, `search-results.js`, `tracking.js`, `pdp.js`, `checkout.js` y `profile.js` (radios y textos).
  - `js/app.js` (toast) y `js/data.js` (descripciones).
  - `css/styles.css`.
  - Lema y meta description en `index.html` y en los `pages/*.html`.
  - `docs/guia-inventario.md`, `CLAUDE.md` y `README.md` (orden de los SQL).

## Verificación

1. `node --test tests/*.test.mjs`: hoy hay 393 tests en verde y 135 fallos heredados. Los fallos no pueden aumentar, y las suites que hoy están en verde deben seguir en verde.
   Algunas suites heredadas prueban el filtro por letra o la compra de cartas API. Si un test en verde se rompe por un cambio pedido, lo reportaré antes de tocarlo.
2. Nuevo `tests/test_catalog_stock.test.mjs`:
   - Una carta sin stock PSA no aparece en Slabs PSA, pero sí en Raw si tiene stock raw.
   - Lo agotado no aparece en "Todo".
   - Sin conexión no se oculta nada.
   - La página Explorar no renderiza precio ni botón de comprar.
   - Enter en la navbar navega al catálogo con `?q=`.
3. Nuevo `tests/test_admin.test.mjs`, con un cliente Supabase simulado. Comprueba:
   - Que los métodos llaman a la RPC correcta con los argumentos correctos.
   - Que `admin.js` valida precio y stock, renderiza las filas y muestra "Acceso no autorizado" cuando recibe `NO_AUTORIZADO`.
   - Que el carrito se reajusta al nuevo precio.
4. Navegador: `preview_start web` y recorrido de inicio, catálogo, ficha, carrito y seguimiento, en escritorio y móvil. Cero errores en consola, foco visible y capturas antes/después.
5. Panel: abrir `pages/admin.html`.
   - **Tú inicias sesión** en el panel del navegador; no escribiré tu contraseña.
   - Cambiar un precio y un stock, ocultar un producto y comprobar en el catálogo que el cambio aparece (y luego revertirlo).
   - Probar con una cuenta de cliente que se recibe "Acceso no autorizado".
6. Sin commit ni push hasta tu indicación.
