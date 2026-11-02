# Handoff Report: Codebase Architecture Survey (Phases 4-7 Readiness)

## 1. Observation

Direct observations from examining the codebase at `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\`:

### 1.1 Directory & File Layout
- **Root**: `index.html`, `PLAN_DE_TRABAJO.md`.
- **CSS**: `css/styles.css` (313 lines).
- **Images**:
  - `img/logo.png` (4,504 bytes), `img/booster-team-rocket.png` (6,508,080 bytes).
  - `img/cards/` (empty directory).
  - `img/sealed/` (empty directory).
  - Missing local card image files referenced in `js/data.js` (`img/charizard-base.png`, `img/umbreon-vmax.png`, etc.) which currently trigger `onerror` fallback URLs.
- **JavaScript**:
  - `js/app.js` (531 lines) — Global controller `window.app`, hash router, modals, search spotlight, toast notifications.
  - `js/data.js` (286 lines) — `APP_CONFIG` (tax 15%, shipping $5.00/$0.00) and `PRODUCTS` mock database (12 items).
  - `js/state.js` (153 lines) — `Store` in-memory state, localStorage sync, `isValidEcuadorianId()` (cédula 10-digit module 10).
  - `js/db/schema.js` (174 lines) — `GradedSealedSchema` defining 12 relational stores for Dexie.js.
  - `js/db/db-client.js` (1,050 lines) — `GradedSealedDB` Dexie wrapper with `LocalStorageFallbackDB`, `procesarOrdenTransaccional()`, and `seedDatabase()`.
  - `js/views/home.js` (522 lines) — `HomeView` (hero, vault guarantee bar, featured items, testimonials).
  - `js/views/catalog.js` (409 lines) — `CatalogView` (multi-criteria filtering, sorting, grid rendering).
  - `js/views/pdp.js` (554 lines) — `PDPView` (3D scene, holo sheen, centering grid, acrylic slab, condition selector, 12-month SVG trend chart, quantity selector).
  - `js/views/cart.js` (145 lines) — `CartView` (item list, quantity +/- controls, totals breakdown, checkout CTA).
  - `js/views/checkout.js` (610 lines) — `CheckoutView` (checkout form, confirmation view, error `#DECLINED-SEC-054` view, auth view).
  - `js/views/profile.js` (308 lines) — `ProfileView` ("Mis Datos Personales" tab, "Mis Últimas Compras" tab).
  - `js/views/tracking.js` (155 lines) — `TrackingView` (order tracking timeline, package status).
  - `js/services/` — Directory does not yet exist; `pokemon-api.js` is missing.

### 1.2 Module System & Global Scope
- In `index.html` (lines 451–464), scripts are loaded without `type="module"`:
  ```html
  <script src="https://unpkg.com/dexie/dist/dexie.js"></script>
  <script src="js/db/schema.js"></script>
  <script src="js/db/db-client.js"></script>
  <script src="js/data.js"></script>
  <script src="js/state.js"></script>
  <script src="js/views/home.js"></script>
  <script src="js/views/catalog.js"></script>
  <script src="js/views/pdp.js"></script>
  <script src="js/views/cart.js"></script>
  <script src="js/views/checkout.js"></script>
  <script src="js/views/profile.js"></script>
  <script src="js/views/tracking.js"></script>
  <script src="js/app.js"></script>
  ```
- All modules expose objects directly onto `window` (`app`, `Store`, `PRODUCTS`, `APP_CONFIG`, `GradedSealedSchema`, `GradedSealedDB`, and view objects).
- External libraries: Tailwind CSS (via CDN runtime `cdn.tailwindcss.com`), Lucide Icons (`unpkg.com/lucide@latest`), Dexie.js (`unpkg.com/dexie/dist/dexie.js`).

### 1.3 Routing Architecture
- Handled in `app.handleRoute()` (`js/app.js:32–97`):
  - Listens to `hashchange` on `window`.
  - Splits hash on `?`:
    - `#pdp?id=...` -> sets `Store.data.currentPdpProduct`, renders `pdp`, calls `PDPView.afterRender()`.
    - `#catalog?cat=...&era=...&q=...` -> sets `Store.data.catalogFilters`, renders `catalog`.
    - `#tracking?order=...` -> sets `Store.data.activeTrackingOrderId`, renders `tracking`.
    - Other routes from list: `['home', 'cart', 'checkout', 'confirmation', 'error', 'auth', 'profile']`.
  - `#search-results` route is currently **missing** from `handleRoute()` and `validRoutes`.

### 1.4 Dexie.js Configuration & State Divergence
- `js/db/schema.js:24–60` defines 12 stores:
  `usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`.
- `js/db/db-client.js` implements `procesarOrdenTransaccional()` (lines 302–458) which performs stock validation/decrement, 15% VAT calculation, shipping fee calculations, and inserts to `ordenes_compra` and `items_orden`.
- **State Divergence**:
  - `Store` (`js/state.js`) operates independently using `localStorage` (`gstcg_user`, `gstcg_users`, `gstcg_cart`, `gstcg_orders`).
  - In `js/views/checkout.js:564 & 599`, `processPayment()` writes orders to `Store.addOrder(orderObj)` (`localStorage`), completely bypassing `GradedSealedDB.procesarOrdenTransaccional()` and Dexie tables.
  - In `js/views/profile.js:27`, `ProfileView` reads orders from `Store.data.orders` instead of querying Dexie table `GradedSealedDB.ordenes_compra`.

### 1.5 Existing CSS 3D & Component Styles
- `css/styles.css` already contains:
  - 3D card inspector classes: `.card-3d-scene` (perspective: 1000px), `.card-3d-object` (preserve-3d, transition: transform 0.7s), `.card-3d-object.is-flipped-y` (`rotateY(180deg)`), `.card-3d-face`, `.card-3d-back` (lines 167–195).
  - Shimmer and overlay: `.holo-sheen-layer` (radial-gradient holographic shimmer), `.centering-grid-overlay` (50/50 centering overlay with dashed guidelines) (lines 197–244).
  - Acrylic PSA slab: `.psa-acrylic-slab`, `.psa-flip-label`, `.psa-barcode`, `.psa-inner-well` (lines 245–300).
- Modals & Drawers:
  - `#categories-drawer` (`index.html:166–265`)
  - `#undo-banner` (`index.html:267–291`)
  - `#payment-modal` (`index.html:295–315`)
  - `#psa-guide-modal` (`index.html:317–373`)
  - `#delete-confirm-modal` (`index.html:375–403`)
  - `#toast-container` (`index.html:43`)

### 1.6 Tooling & Runtime Environment
- Command `cmd /c "node -v & npm -v"` returned `v24.21.0` and `11.19.0`.
- There are no `package.json`, `node_modules`, bundlers (Vite/Webpack), linter configs, or test runner frameworks in the project.
- Node.js v24 native test runner (`node --test`) and assertion module (`node:assert`) are fully functional and available without third-party packages.

---

## 2. Logic Chain

1. **Phase 4 Readiness (Visual Assets & Adaptive PDP)**:
   - *Observation*: `img/sealed/` and `img/cards/` are empty. `pdp.js` unconditionally renders the 3D buttons (Frontal, Reverso 180°, Slab PSA) and PSA condition selector (Raw, PSA 8, PSA 9, PSA 10) regardless of whether the product is a single card or sealed product.
   - *Inference*: To satisfy R1, images must be placed in `img/sealed/` (Team Rocket booster box front, perspective, side) and `img/cards/` (Raichu GX front and Pokémon card back).
   - *Inference*: `PRODUCTS` in `data.js` and `productos` in Dexie must supply/recognize `tipo_item: 'CARTA_INDIVIDUAL' | 'PRODUCTO_SELLADO'`. `pdp.js` must check `product.tipo_item`:
     - If `PRODUCTO_SELLADO`: hide PSA selector and 3D flip controls; display sealed packaging multi-angle gallery and factory specifications (gramaje, seals, pack counts).
     - If `CARTA_INDIVIDUAL`: display PSA grade radio selector, 12-month market trend SVG chart, and the 3D card inspector modes ('Frontal' shimmer, 'Reverso y Bordes' rotateY 180° with 50/50 centering grid, and 'Slab PSA' acrylic encapsulation).
   - *Inference*: The quantity selector (`- [ 1 ] +`) and "¿Qué es un Grado PSA?" modal (`#psa-guide-modal`) already exist in markup and logic, but must be verified to ensure minimum value of 1 and full keyboard accessibility.

2. **Phase 5 Readiness (Cart, Mandatory Checkout, Ecuadorian Validations, Dexie Persistence)**:
   - *Observation*: `checkout.js` currently allows guest checkout without a password field, charges either $5.00 courier or $0.00 pickup (missing $3.00 Quito flat rate), validates cédula with 10-digit module 10 but does not validate RUC or enforce +593 phone format, uses `cardNum.endsWith('0000')` without Luhn algorithm validation, and writes orders to `Store.data.orders` (`localStorage`) rather than Dexie tables.
   - *Observation*: `app.showToast()` in `app.js:489–524` allows multiple toasts to stack and has a 3.8s timeout rather than a 2.5s singleton toast.
   - *Inference*: To satisfy R2:
     - Replace guest checkout with mandatory registration (password field: "Crea tu contraseña para registrar tu compra y acceder a tu historial").
     - Add Module 10 validation for 10-digit Cédula and 13-digit RUC (natural persons with suffix '001'), plus mandatory +593 telephone format.
     - Add Luhn algorithm for credit card numbers, preserving the simulated rejection `#DECLINED-SEC-054` for cards ending in '0000'.
     - Support 3 flat shipping tiers: Quito ($3.00), Nacional ($5.00), Retiro en Tienda ($0.00), with 15% VAT calculation.
     - Replace localStorage order saving with Dexie persistence: insert user in `usuarios`, address in `direcciones_envio`, order in `ordenes_compra`, order items in `items_orden`, and activate user session in `Store.data.currentUser` / `state.js`.
     - Update `showToast()` to be a strict singleton (dismiss previous toast immediately, max 1 active, 2.5s duration).
     - Maintain cart deletion confirmation modal and undo mechanism with `#undo-banner`.

3. **Phase 6 Readiness (Dual Search API with Automatic Failover)**:
   - *Observation*: `js/services/pokemon-api.js` does not exist. `app.js:486` redirects search queries to `#catalog?q=...`. There is no dedicated `#search-results` view.
   - *Inference*: To satisfy R3:
     - Create `js/services/pokemon-api.js` implementing automatic 3-tier failover:
       1. Primary: `pokemontcg.io` (e.g. `https://api.pokemontcg.io/v2/cards?q=name:*<query>*`).
       2. Secondary: `tcgdex.net` (e.g. `https://api.tcgdex.net/v2/en/cards?name=<query>`).
       3. Fallback: Local offline catalogue (`PRODUCTS` / `GradedSealedDB.productos`).
     - Create `#search-results` view (`js/views/search-results.js`) and register `#search-results` in `app.js` router.
     - Implement 400ms debounce on search input.
     - Display animated skeleton loader cards during fetch.
     - Display friendly, informative zero-results state when no cards match.
     - Include `<script src="js/services/pokemon-api.js"></script>` and `<script src="js/views/search-results.js"></script>` in `index.html`.

4. **Phase 7 Readiness (User Profile, Order History, Work Plan Tracking)**:
   - *Observation*: `ProfileView` in `js/views/profile.js` only reads in-memory `Store.data.orders`. `saveProfileChanges()` only updates `Store.data.currentUser` in `localStorage`.
   - *Inference*: To satisfy R4:
     - Connect `ProfileView` to Dexie:
       - "Mis Datos Personales": Allows editing name, phone, shipping address; validates Module 10 and phone; saves updates to `GradedSealedDB.usuarios` and `GradedSealedDB.direcciones_envio`.
       - "Mis Últimas Compras": Queries `GradedSealedDB.ordenes_compra.where('usuario_cedula').equals(activeUserCedula).toArray()`, queries corresponding `items_orden`, and displays order thumbnails, order date, payment method, total, and logistic status.
       - Each order item includes `[Ver Tracking en Vivo]` button linking to `#tracking?order=<numero_orden>`.
       - `[Cerrar Sesión]` button clears `Store.data.currentUser`, clears user session storage, updates navbar UI, and navigates to `#home`.
     - Update `PLAN_DE_TRABAJO.md` marking all tasks under FASE 4, FASE 5, FASE 6, and FASE 7 with `[X]`.

5. **Tooling & Verification Strategy**:
   - *Observation*: No third-party runner is installed, but Node v24 is available.
   - *Inference*: Algorithmic validations (Ecuadorian Cédula/RUC Module 10, Luhn card check, VAT 15%, shipping calculations, failover logic) can be unit-tested via Node native test runner (`node --test`) without any npm install or build step.

---

## 3. Caveats

1. **Images Generation**: The images for `img/sealed/` (Team Rocket booster box front, perspective, side) and `img/cards/` (Raichu GX front and back) will need to be generated or copied in Phase 4. Currently, only `img/logo.png` and `img/booster-team-rocket.png` exist.
2. **Third-Party API Rate Limits**: `pokemontcg.io` may rate-limit or fail without an API key; the failover design to `tcgdex.net` and offline local catalogue ensures resilience even when offline or rate-limited.
3. **Execution Policy on Windows PowerShell**: PowerShell script execution policy prevents running `npm.ps1` directly, but running commands via `cmd /c` or using `node` directly operates without any security restriction.
4. **Browser Script Loading Order**: Because scripts are plain `<script>` tags without a bundler, dependency order in `index.html` must be strictly maintained (Schema -> DB Client -> Data -> State -> Services -> Views -> App).

---

## 4. Conclusion

The application has a clean, functional architectural base with Tailwind CSS, Lucide icons, Dexie.js database schema definitions, and an initial set of views. However, critical gaps exist that require resolution in Phases 4–7:
1. **Phase 4**: Populate `img/sealed/` and `img/cards/`; implement `tipo_item` conditional rendering in `pdp.js` (hiding PSA selector/3D controls for sealed items, enabling them for cards).
2. **Phase 5**: Unify checkout to require account creation with password; implement Cédula/RUC Module 10 and phone +593 validations; implement Luhn card check with `#DECLINED-SEC-054` error; implement $0/$3/$5 shipping rates and 15% VAT; persist orders and users into Dexie `usuarios` and `ordenes_compra`; update `showToast()` to a 2.5s singleton.
3. **Phase 6**: Create `js/services/pokemon-api.js` with 3-tier failover (`pokemontcg.io` -> `tcgdex.net` -> local catalogue) and create `#search-results` view with 400ms debounce and skeleton loaders.
4. **Phase 7**: Connect `#profile` reactively to Dexie `usuarios` and `ordenes_compra`; support profile editing and past order listing with live tracking links; support logout to `#home`; update `PLAN_DE_TRABAJO.md`.

---

## 5. Verification Method

To verify these architectural findings independently:

1. **File Inventory & Tree Check**:
   ```powershell
   Get-ChildItem -Recurse -File -Name
   ```
   *Expected*: Verifies existing views, missing `js/services/`, empty `img/cards/` and `img/sealed/`.

2. **Schema & Dexie Stores Inspection**:
   Inspect `js/db/schema.js:24–60` to confirm 12 tables and index configurations.

3. **Routing Verification**:
   Inspect `js/app.js:32–97` (`handleRoute`) to verify supported routes vs missing `#search-results`.

4. **Node.js Environment Verification**:
   ```cmd
   cmd /c "node -v & npm -v"
   ```
   *Expected*: Outputs `v24.21.0` and `11.19.0`.

5. **Automated Logic Verification (Module 10 & Luhn)**:
   A node script can be run with `node --test` to execute assertions on `Store.isValidEcuadorianId` and Luhn algorithm implementations.
