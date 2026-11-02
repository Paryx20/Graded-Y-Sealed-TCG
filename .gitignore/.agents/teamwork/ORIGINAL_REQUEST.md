# Original User Request

## Approved Task Prompt — 2026-11-02T11:31:13Z

Refactor and enhance the Pokémon TCG e-commerce web platform for production deployment, resolving UI defects, streamlining the product detail page, removing 3D viewer centering overlays, fixing search navigation and acquisition flow, establishing a realistic tracking view, and integrating production-ready Google authentication without hardcoded user data.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

## Reference Material
- Captura 1 (PDP con gráfico que debe eliminarse): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616311021_84ef79a9.jpg
- Captura 2 (Resultados de búsqueda y botones): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616320500_73fae749.jpg
- Captura 3 (Reverso con 50x50 que debe removerse): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616334600_2a319d6a.jpg
- Captura 4 (Múltiples vistos en botones PSA a corregir): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616353085_5ccd04f2.jpg
- Captura 5 (Perfil con datos predeterminados a corregir con login de Google): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793616426669_fd5f4cc2.png

## Verification Resources
- Existing automated test suite in the repository (`tests/`)
- Browser UI execution and console log verification

## Requirements

### R1. PDP PSA Condition Buttons Exclusive Checkmark
When selecting a card condition/grade (Raw, PSA 8, PSA 9, PSA 10) on the product detail page, only the currently active condition button must display a checkmark (✓). The checkmark must be immediately removed from any previously selected button so that multiple checkmarks never appear simultaneously.

### R2. PDP Statistics Box Removal and Price Clarity
Completely remove the market history statistics box ('Historial de Mercado Actual 12 meses', SVG trend curve, percentage indicators) from the product detail page. The card price must remain prominently displayed, clear, and accurately reflective of the selected card condition.

### R3. 3D Card Viewer Clean Reverse Side
On the reverse/back side of the 3D card viewer, eliminate the dashed centering grid overlay ('centering-grid-overlay') and centering coordinate labels ('EJE X: 50.0% / 50.0%', 'EJE Y: 50.0% • BORDES OK'). The reverse side must display solely the clean Pokémon card back artwork without any overlaid lines or text.

### R4. API Search Card Navigation and Purchase Flow
Ensure action buttons on cards returned from API search results (e.g. 'Solicitar Adquisición') properly navigate to the card's product detail view with accurate market pricing, allowing users to add the card to their cart or initiate purchase directly.

### R5. Preloaded Live Tracking Simulation
Eliminate manual simulation buttons from the tracking view (`#tracking`). Display an active, realistic simulated order tracking timeline upon loading the tracking section, seamlessly integrated with the purchase simulation.

### R6. Google OAuth 2.0 Integration and Dynamic User Profile
Remove all preloaded/hardcoded default user information (name, national ID, address, etc.) on initial page load. Implement a production-ready Google Sign-In button utilizing Google Identity Services / OAuth 2.0 structure (with an elegant fallback if client credentials are not configured), populating and displaying user profile data only upon successful authentication.

## Acceptance Criteria

### PDP Condition Buttons
- [ ] Clicking any condition button (Raw, PSA 8, PSA 9, PSA 10) displays the checkmark (✓) exclusively on the selected button.
- [ ] Previous checkmarks are removed when switching conditions; no two buttons ever show a checkmark simultaneously.

### PDP Price and Layout
- [ ] The 12-month market history chart box, SVG curve, and percentage labels are completely removed from the product detail page.
- [ ] The card price is prominently visible and dynamically updates when changing conditions.

### 3D Card Viewer
- [ ] The reverse side of the 3D card viewer contains no dotted grid overlay ('centering-grid-overlay').
- [ ] The reverse side contains no centering coordinate text ('EJE X', 'EJE Y', '50.0%').
- [ ] Only the clean Pokémon card back image is visible on the reverse side.

### API Search Navigation and Acquisition
- [ ] Action buttons on cards in the API search results open the respective card in the product detail view with its calculated price.
- [ ] Cards found through API search can be added to the cart and purchased through the store workflow.

### Order Tracking Simulation
- [ ] The tracking section contains no manual simulation control buttons.
- [ ] An active simulated order with realistic status timeline steps is displayed when viewing `#tracking`.

### Authentication and User Profile
- [ ] Profile fields (name, ID, address, etc.) are empty or show an unauthenticated guest state on initial load, with no hardcoded default user data.
- [ ] A Google Sign-In button is present and functional via Google Identity Services / OAuth 2.0 structure.
- [ ] User profile information is established and displayed in the session only after completing Google authentication.

### Quality and Stability
- [ ] No JavaScript console errors occur during navigation, search, condition switching, or tracking views.
- [ ] Automated tests in `tests/` pass.


## Approved Task Prompt — 2026-11-02T16:21:41Z

Optimización y evolución para producción de la plataforma e-commerce Graded & Sealed TCG: ajuste de simulación de despacho y tracking por tipo de entrega, integración de Google Sign-In, rediseño de slabs PSA según fotografía de referencia, corrección de búsqueda multicriterio por categoría, modernización visual del drawer de categorías y desarrollo de la FASE 8 con Supabase y catálogo de 10 cartas a precios normales de mercado.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

Referencias visuales provistas:
- Captura 1 (Tracking en Vivo): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634163224_5524a750.jpg
- Captura 2 (Portal de Autenticación sin Google visible): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634228982_2f8039b1.jpg
- Captura 3 (Foto real de Slab PSA Greninja): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634479327_23c1d67d.jpg
- Captura 4 (Catálogo con búsqueda): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634656938_1630c76b.jpg
- Captura 5 (Drawer de Categorías a mejorar): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634877558_f20d87f2.png

## Requirements

### R1. Simulación y Flujo Diferenciado de Tracking (#tracking)
Acelerar la progresión temporal de la simulación de despacho para que el hito de preparación se complete rápidamente con su indicador de check y continúe fluido hacia la siguiente etapa. Diferenciar de forma clara e inequívoca el tracking según la modalidad elegida en la compra: para "Envío a Domicilio", mostrar el avance del transporte blindado/camión; para "Retiro en Local / Bóveda Quito", suprimir la animación del camión en tránsito y mostrar el estado de preparación y disponibilidad para retiro presencial, detallando horarios y requisitos de retiro.

### R2. Integración de Google Sign-In / OAuth
Implementar el botón de Google Sign-In visible y completamente funcional en la pestaña "Iniciar Sesión" y en la pestaña "Crear Cuenta / Registrarse" del portal de autenticación (#auth), así como en el flujo de Checkout. Utilizar el SDK oficial de Google Identity Services con soporte interactivo que incluya simulación o fallback funcional que permita autenticar y registrar la sesión del usuario si no hay un Client ID de Google configurado en el entorno.

### R3. Rediseño Visual del Slab PSA Basado en Referencia Real
Rediseñar el slab PSA en CSS para replicar fielmente la fotografía de referencia de la certificación real (Greninja PSA 10, Captura 3): marco acrílico biselado transparente con muescas estructurales, etiqueta superior oficial con borde rojo característico de PSA, código de barras nítido, logotipo oficial de PSA, tipografía reglamentaria, alineación precisa y grado GEM MT 10.

### R4. Búsqueda y Filtrado Multicriterio por Categoría
Corregir la lógica de búsqueda en el catálogo (#catalog) para que permita buscar términos dentro de la categoría seleccionada (búsqueda multicriterio) y garantizar que la consulta por nombre de carta (por ejemplo, "charizard") no restrinja indebidamente ni bloquee la visualización de los resultados.

### R5. Estilización y Microinteracciones del Drawer de Categorías
Modernizar la apariencia visual de los botones del menú lateral desplegable de categorías (Captura 5), aplicando estilos refinados en bordes, gradientes sutiles, microinteracciones hover claras, tipografía jerárquica y badges identificativos acordes al diseño de la plataforma.

### R6. FASE 8: Arquitectura Supabase y Catálogo de 10 Cartas con Precios Normales
Ejecutar la FASE 8 de PLAN_DE_TRABAJO.md creando `js/db/schema.sql` compatible con PostgreSQL, la configuración e inicialización del cliente en `js/db/supabase-config.js` y adaptando el cliente de base de datos con un esquema híbrido que asegure fallback automático a IndexedDB/Dexie si no hay conexión a la nube. Poblar el catálogo con 10 cartas Pokémon con precios normales y reales de mercado ($5 a $80 USD), reemplazando cotizaciones exorbitantes. Actualizar `PLAN_DE_TRABAJO.md` marcando la FASE 8 con `[X]`.

## Acceptance Criteria

### Tracking y Despacho
- [ ] La simulación en `#tracking` progresa con tiempos breves entre etapas, completando la preparación rápidamente y mostrando el check correspondiente.
- [ ] En pedidos con "Retiro en Local / Bóveda Quito", el tracking no muestra camión ni despacho vial; muestra "Listo para retiro presencial en Bóveda", indicando dirección, horario de atención y requisitos de cédula.
- [ ] En pedidos con "Envío a Domicilio", el tracking muestra el estado y la animación de transporte blindado en ruta.

### Autenticación Google
- [ ] El botón de Google Sign-In está presente y estilizado tanto en la pestaña "Iniciar Sesión" como en "Crear Cuenta / Registrarse" dentro de `#auth` y en el Checkout.
- [ ] Al interactuar con el botón de Google Sign-In, el usuario puede iniciar sesión o registrarse, actualizando el estado de sesión global y el navbar sin errores en consola.

### Slab PSA
- [ ] El inspector de cartas en modo Slab PSA presenta el marco acrílico transparente biselado con muescas, la etiqueta oficial con marco rojo PSA, código de barras, número de certificación, tipografía y logo oficiales alineados según la Captura 3.

### Búsqueda y Navegación
- [ ] La búsqueda textual permite filtrar dentro de la categoría activa seleccionada sin bloquear los resultados.
- [ ] Los botones del menú drawer de categorías cuentan con estilos modernos (bordes, gradientes, badges) y retroalimentación hover visible.

### Base de Datos y Catálogo
- [ ] Existe el archivo `js/db/schema.sql` con las sentencias DDL correspondientes para PostgreSQL/Supabase.
- [ ] Existe `js/db/supabase-config.js` y el cliente Supabase está integrado en `index.html` y `js/db/db-client.js` con fallback transparente a IndexedDB/Dexie.
- [ ] El catálogo contiene 10 cartas de Pokémon con precios de mercado razonables (entre $5 y $80 USD).
- [ ] El archivo `PLAN_DE_TRABAJO.md` tiene marcada la FASE 8 con `[X]`.

## Verification Resources
- Pruebas automatizadas existentes en `tests/` ejecutadas sin fallos.
- Validación funcional e interactiva en navegador de cada una de las 6 áreas (Tracking con ambos métodos de entrega, Google Sign-In en login/registro/checkout, visor de Slab PSA, búsqueda por categoría, drawer y catálogo de 10 cartas con persistencia).
