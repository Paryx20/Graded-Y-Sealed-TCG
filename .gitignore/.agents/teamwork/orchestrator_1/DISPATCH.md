## 2026-11-01T22:13:43Z

Implement and deliver production-ready features for Phases 4 through 7 of the TCG e-commerce platform according to PLAN_DE_TRABAJO.md, covering the 3D card inspector with generated product imagery, mandatory checkout with Ecuadorian validations, failover search API, user order history, and work plan updates.

Integrity mode: development

## Requirements

### R1. Visual Assets & Adaptive Product Detail Page (PDP) (Phase 4)
Generate and integrate isolated, transparent-background product imagery for the Team Rocket Booster Box from multiple angles (front, 3/4 perspective, side) in `img/sealed/`, and format Pokémon card visual assets (Raichu GX front and official card back) in `img/cards/`. Implement the CSS 3D card inspector with smooth transitions:
- 'Frontal': Vertical display with CSS holographic reflection shimmer.
- 'Reverso y Bordes': 180° Y-axis rotation (`rotateY(180deg)`) showing official back and 50/50 centering overlay grid.
- 'Slab PSA': Acrylic grading slab frame with authentic top PSA certification label in CSS.
Implement conditional PDP logic based on `tipo_item` (hiding PSA selector and 3D controls for `PRODUCTO_SELLADO`, showing them for `CARTA_INDIVIDUAL`), a quantity selector (`- [ 1 ] +`), and an accessible modal for "¿Qué es un Grado PSA?".

### R2. Cart, Mandatory Checkout & Ecuadorian Validations (Phase 5)
Replace guest checkout with a unified checkout flow requiring account creation (password field) and mandatory customer details:
- Validate Cédula/RUC using the Ecuadorian Module 10 algorithm and telephone prefix (+593).
- Persist user and order data to Dexie.js (`usuarios`, `ordenes_compra`) and maintain active session state in `state.js`.
- Validate credit cards using Luhn's algorithm, triggering simulated error `#DECLINED-SEC-054` on card numbers ending in '0000'.
- Calculate 15% VAT and flat shipping fees ($3.00 Quito, $5.00 National, $0.00 In-store pickup).
- Implement a singleton toast notification system (max 1 active toast, auto-dismiss in 2.5s) and cart item removal confirmation with 'Deshacer' (undo).

### R3. Dual Search API with Automatic Failover (Phase 6)
Implement `js/services/pokemon-api.js` with failover logic:
- Primary source: `pokemontcg.io`.
- Secondary backup source: `tcgdex.net`.
- Offline fallback: In-memory local catalogue.
Construct a decoupled `#search-results` view featuring a 400ms search input debounce, skeleton loader indicators during fetch, and an informative zero-results state.

### R4. User Profile, Order History & Work Plan Tracking (Phase 7)
Build the reactive `#profile` view connected to Dexie.js containing:
- "Mis Datos Personales" tab allowing editing of name, phone, and saved shipping address.
- "Mis Últimas Compras" tab querying `ordenes_compra` for the active `usuario_id`, displaying order thumbnails, order date, payment method, and logistic status.
- [Ver Tracking en Vivo] action on each past order redirecting to `#tracking` with accurate order context.
- [Cerrar Sesión] action clearing active session state and redirecting to `#home`.
Update `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PLAN_DE_TRABAJO.md`, marking all checklist tasks under FASE 4, FASE 5, FASE 6, and FASE 7 with `[X]`.

## Acceptance Criteria

### Product Assets & 3D Inspector (Phase 4)
- [ ] `img/sealed/` contains transparent-background images of the Team Rocket booster box in front, perspective, and side views.
- [ ] `img/cards/` contains properly formatted front and back card images.
- [ ] The card inspector flips smoothly via `rotateY(180deg)` showing the back face and 50/50 centering grid.
- [ ] The 'Frontal' view displays holographic shimmer CSS effect, and 'Slab PSA' view encapsulates the card in an acrylic slab border with PSA label.
- [ ] PDP conditionally hides PSA selector and 3D buttons for sealed items while showing them for individual cards.
- [ ] Quantity selector increments/decrements with minimum value of 1.
- [ ] The "¿Qué es un Grado PSA?" modal opens and closes correctly.

### Checkout & Business Rules (Phase 5)
- [ ] Checkout requires account creation (password) and rejects invalid Ecuadorian Cédula/RUC (Module 10 validation) or non-Ecuadorian phones (+593).
- [ ] Completed checkout persists records to Dexie.js `usuarios` and `ordenes_compra` tables and sets active session in `state.js`.
- [ ] Card validation applies Luhn algorithm; cards ending in '0000' trigger error code `#DECLINED-SEC-054`.
- [ ] Orders calculate 15% VAT and apply selected shipping flat rate ($0, $3, or $5).
- [ ] Only one toast notification is visible at a time with 2.5s auto-dismiss.
- [ ] Removing an item from cart presents a confirmation modal with functional undo capability.

### Failover Search (Phase 6)
- [ ] `js/services/pokemon-api.js` queries `pokemontcg.io`, falls back to `tcgdex.net` on failure, and falls back to offline local catalogue if both fail.
- [ ] `#search-results` triggers queries with a 400ms debounce, displays skeleton loaders while loading, and presents a zero-results message when empty.

### User Profile & Plan Completion (Phase 7)
- [ ] `#profile` allows editing user details and updates the corresponding record in Dexie.js.
- [ ] "Mis Últimas Compras" displays past orders for the active user, with working [Ver Tracking en Vivo] links to `#tracking`.
- [ ] Logout button clears user session and navigates to `#home`.
- [ ] In `PLAN_DE_TRABAJO.md`, all checklist items under `FASE 4`, `FASE 5`, `FASE 6`, and `FASE 7` are marked with `[X]`.

---

## Agent Identity & Context
- Identity: Project Orchestrator (teamwork_orchestrator)
- Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\orchestrator_1\
- Original Request path: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
- Project root: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\
- User-provided images and context:
  - Plan de trabajo: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PLAN_DE_TRABAJO.md
  - Imágenes adjuntas:
    1. Reverso de carta Pokémon: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570186168_80295ed8.jpg
    2. Caja Booster Box Team Rocket: C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570203846_69580a5b.jpg
    3. Frontal de carta Pokémon (Raichu GX): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570244974_7f34fc1b.jpg
