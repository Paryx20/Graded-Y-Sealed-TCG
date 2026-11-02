# Project: Graded & Sealed TCG E-commerce (Phases 4-7)

## Architecture
- **Client Architecture**: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS via CDN, Lucide Icons, Dexie.js (IndexedDB).
- **Module & State Architecture**:
  - Global namespace `window.app`, `window.Store`, `window.GradedSealedDB`, `window.PRODUCTS`, `window.APP_CONFIG`.
  - In-memory reactive state in `Store` (`js/state.js`) synchronizing with Dexie.js for persistent entities.
  - SPA hash routing in `js/app.js`: `#home`, `#catalog`, `#pdp`, `#cart`, `#checkout`, `#confirmation`, `#error`, `#search-results`, `#profile`, `#tracking`.
  - Transactional persistence via `GradedSealedDB` Dexie stores: `usuarios`, `direcciones_envio`, `ordenes_compra`, `items_orden`.
  - Search subsystem with 3-tier cascade: `pokemontcg.io` -> `tcgdex.net` -> local in-memory catalogue.

---

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone.

| # | Feature | Description | Milestone | Source | Acceptance Criteria |
|---|---------|-------------|-----------|--------|---------------------|
| 1 | Team Rocket Box Multi-Angle Imagery | Generate & integrate isolated transparent-background images of Team Rocket booster box in front, perspective, and side views in `img/sealed/` | M1 | ORIGINAL_REQUEST R1 | Transparent PNG files present in `img/sealed/` [VERIFIED] |
| 2 | Pokémon Card Visual Assets | Format Raichu GX front and official blue Pokémon card back in `img/cards/` | M1 | ORIGINAL_REQUEST R1 | PNG images present in `img/cards/` [VERIFIED] |
| 3 | 3D Inspector Frontal View & Shimmer | Vertical display with interactive CSS holographic reflection shimmer on mouse movement | M1 | ORIGINAL_REQUEST R1 | CSS shimmer effect activates smoothly [VERIFIED] |
| 4 | 3D Inspector Reverso y Bordes | 180° Y-axis rotation (`rotateY(180deg)`) showing official back and 50/50 centering overlay grid | M1 | ORIGINAL_REQUEST R1 | Card flips 180° revealing official back & centering crosshairs [VERIFIED] |
| 5 | 3D Inspector Slab PSA View | Acrylic grading slab frame encapsulation with authentic top PSA certification label in CSS | M1 | ORIGINAL_REQUEST R1 | Acrylic slab container and label rendered [VERIFIED] |
| 6 | Adaptive PDP Conditional Logic | Hide PSA selector and 3D controls for `PRODUCTO_SELLADO`; show them for `CARTA_INDIVIDUAL` | M1 | ORIGINAL_REQUEST R1 | PDP conditionally branches based on `tipo_item` [VERIFIED] |
| 7 | PDP Quantity Stepper | Quantity selector (`- [ 1 ] +`) with lower bound of 1 | M1 | ORIGINAL_REQUEST R1 | Quantity increments/decrements with minimum of 1 [VERIFIED] |
| 8 | PSA Educational Modal | Accessible modal explaining PSA grading standards | M1 | ORIGINAL_REQUEST R1 | "¿Qué es un Grado PSA?" opens and closes smoothly [VERIFIED] |
| 9 | Mandatory Account Checkout | Replace guest checkout with mandatory registration requiring account creation (password field) | M2 | ORIGINAL_REQUEST R2 | Checkout enforces password and account details [VERIFIED] |
| 10 | Ecuadorian Cédula & RUC Validation | Module 10 algorithm validating 10-digit Cédula and 13-digit natural RUC ('001' suffix) | M2 | ORIGINAL_REQUEST R2 | Invalid Cédula/RUC rejected by Module 10 [VERIFIED] |
| 11 | Ecuadorian Telephone Prefix | Validate telephone prefix (+593) followed by 9 digits | M2 | ORIGINAL_REQUEST R2 | Non-+593 or invalid phone numbers rejected [VERIFIED] |
| 12 | Credit Card Luhn Algorithm | Luhn formula check verifying card number validity | M2 | ORIGINAL_REQUEST R2 | Invalid card numbers rejected [VERIFIED] |
| 13 | Simulated Decline `#DECLINED-SEC-054` | Card numbers ending in '0000' trigger simulated error `#DECLINED-SEC-054` | M2 | ORIGINAL_REQUEST R2 | Card ending in '0000' triggers decline code [VERIFIED] |
| 14 | 15% VAT Calculation | Calculate exact 15% VAT on order subtotal | M2 | ORIGINAL_REQUEST R2 | VAT calculated at 15% with 2 decimal precision [VERIFIED] |
| 15 | Flat Shipping Rates | Flat shipping tiers: $0.00 In-store pickup, $3.00 Quito express, $5.00 National blindado | M2 | ORIGINAL_REQUEST R2 | Selected shipping rate added to order total [VERIFIED] |
| 16 | Dexie.js ACID Persistence | Persist user to `usuarios` and order to `ordenes_compra` & `items_orden`, setting active session | M2 | ORIGINAL_REQUEST R2 | Records stored in IndexedDB tables; session in `state.js` [VERIFIED] |
| 17 | Singleton Toast Notification | Max 1 active toast notification visible at any time with 2.5s auto-dismiss | M2 | ORIGINAL_REQUEST R2 | Prior toasts replaced immediately; 2.5s timer [VERIFIED] |
| 18 | Cart Item Removal & Undo | Confirmation modal before removing item, with functional 'Deshacer' (undo) | M2 | ORIGINAL_REQUEST R2 | Modal prompts removal; undo restores item [VERIFIED] |
| 19 | Dual Search API with Automatic Failover | 3-tier cascade: `pokemontcg.io` (primary) -> `tcgdex.net` (secondary) -> local catalogue (fallback) | M3 | ORIGINAL_REQUEST R3 | Search seamlessly falls back on network/api failure |
| 20 | Decoupled `#search-results` View | SPA view for search results with 400ms debounce, skeleton loaders, and zero-results state | M3 | ORIGINAL_REQUEST R3 | Decoupled route, 400ms debounce, skeletons, empty state |
| 21 | Reactive User Profile View | Connected to Dexie.js (`usuarios`, `ordenes_compra`) for active user | M4 | ORIGINAL_REQUEST R4 | Profile loads and displays active user data |
| 22 | "Mis Datos Personales" Editor | Edit and save user name, phone, and shipping address to Dexie.js | M4 | ORIGINAL_REQUEST R4 | Form persists updates to Dexie `usuarios` |
| 23 | "Mis Últimas Compras" Order History | Query `ordenes_compra` for active user; show order thumbnails, date, payment method, status | M4 | ORIGINAL_REQUEST R4 | Order cards render past purchases with thumbnails |
| 24 | Live Tracking Deep Link | [Ver Tracking en Vivo] button links to `#tracking` with accurate order context | M4 | ORIGINAL_REQUEST R4 | Navigates to `#tracking?order=<id>` |
| 25 | Session Logout | [Cerrar Sesión] clears active session in state and redirects to `#home` | M4 | ORIGINAL_REQUEST R4 | Session cleared, navbar updated, redirects to `#home` |
| 26 | Work Plan Checklist Completion | Mark all checklist tasks in `PLAN_DE_TRABAJO.md` under FASE 4, 5, 6, 7 with `[X]` | M4 | ORIGINAL_REQUEST R4 | All tasks in PLAN_DE_TRABAJO.md checked |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Phase 4: Visual Assets & Adaptive 3D PDP | Populate `img/sealed/` and `img/cards/`. Update `pdp.js` with `tipo_item` conditional logic (hide PSA/3D for sealed; show for cards), official back image in 3D inspector with 50/50 centering grid, holographic shimmer, PSA slab encapsulation, quantity selector, PSA guide modal. | None | DONE |
| M2 | Phase 5: Cart, Mandatory Checkout & Ecuadorian Validations | Mandatory account checkout with password, Module 10 Cédula/RUC, phone +593, Luhn card validation with `#DECLINED-SEC-054` for '0000', 15% VAT, flat shipping ($0/$3/$5), Dexie persistence (`usuarios`, `ordenes_compra`), active session in `state.js`, singleton toast (2.5s), cart removal undo modal. | None | DONE |
| M3 | Phase 6: Dual Search API with Automatic Failover | Implement `js/services/pokemon-api.js` (pokemontcg.io -> tcgdex.net -> local catalogue), decoupled `#search-results` view with 400ms debounce, skeleton loaders, and zero-results state. Register route in `app.js` and `index.html`. | None | IN_PROGRESS |
| M4 | Phase 7: User Profile, Order History & Plan Completion | Implement `#profile` connected to Dexie (`usuarios`, `ordenes_compra`), "Mis Datos Personales" tab, "Mis Últimas Compras" tab with thumbnails, date, payment method, logistic status, [Ver Tracking en Vivo] link to `#tracking`, [Cerrar Sesión] logout, update `PLAN_DE_TRABAJO.md` marking FASE 4, 5, 6, 7 with `[X]`. | M2 | PLANNED |
| E2E | Dual Track: E2E Test Suite | Design and run comprehensive automated test harness covering all 4 tiers (Tiers 1-4) using Node.js native test runner (`node --test`). Publish `TEST_READY.md`. | None | DONE |

---

## Interface Contracts

### M1 (PDP) ↔ Catalog & Data [VERIFIED & SEALED]
- `product.tipo_discriminador`: `'PRODUCTO_SELLADO' | 'CARTA_INDIVIDUAL'`
- `product.categoria`: `'sealed' | 'psa' | 'raw'`

### M2 (Checkout & State) ↔ M4 (Profile & Orders) [VERIFIED & SEALED]
- Active User in `Store.data.currentUser`: `{ idCard: string, name: string, phone: string, email: string, address: string, city: string }`
- Dexie Store `usuarios`: Primary key `cedula_ruc`, fields: `nombre_completo`, `telefono`, `correo`, `direccion_envio`, `ciudad`, `password_hash` (or password).
- Dexie Store `ordenes_compra`: Primary key `numero_orden`, indexes: `usuario_cedula`, `fecha_creacion`, `estado_logistico`. Fields: `subtotal`, `iva_15`, `costo_envio`, `total`, `metodo_pago`, `estado_logistico` ('CONFIRMADO' / 'EN_PREPARACION' / 'EN_TRANSITO' / 'ENTREGADO'), `items`: array of `{ id, nombre, precio_unitario, cantidad, imagen, condicion }`.

### M3 (Search Service) ↔ App Router
- `window.PokemonAPI.searchCards(query)`: Returns Promise resolving to normalized card array:
  `[{ id: string, nombre: string, set: string, rareza: string, imagen: string, precioEstimado: number, fuente: 'pokemontcg.io' | 'tcgdex.net' | 'local-vault' }]`
- Hash route `#search-results?q=<query>` triggers search view rendering with 400ms debounce and skeleton state.

---

## Code Layout
- `img/sealed/`: Sealed product multi-angle transparent PNGs (`team-rocket-box-front.png`, `team-rocket-box-perspective.png`, `team-rocket-box-side.png`). [DONE]
- `img/cards/`: Card assets (`card-back.png`, `raichu-gx.png`). [DONE]
- `js/services/pokemon-api.js`: Failover search service. [M3]
- `js/views/pdp.js`: Adaptive Product Detail Page view. [DONE]
- `js/views/checkout.js`: Mandatory checkout with Ecuadorian validations. [DONE]
- `js/views/cart.js`: Cart with item removal confirmation and undo. [DONE]
- `js/views/search-results.js`: Decoupled search results view. [M3]
- `js/views/profile.js`: User profile & order history. [M4]
- `js/state.js`: Global state management and math/validation helpers. [DONE]
- `js/app.js`: Global app controller, singleton toast, router. [DONE for M2; M3 route addition]
- `tests/`: Automated unit & E2E test suites executable via `node --test`. [DONE - 224 tests passing]
