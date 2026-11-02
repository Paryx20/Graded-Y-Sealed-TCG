# Project: Pokemon TCG E-commerce Academic Presentation Showcase

## Architecture
- **Client Architecture**: Vanilla JavaScript (ES6+), HTML5, Tailwind CSS, Lucide Icons, Dexie.js (IndexedDB), Supabase JS Client (@supabase/supabase-js@2), Google Identity Services (GIS) Web SDK.
- **Core Subsystems**:
  1. **Interactive 3D Card Inspector & Authentic PSA Slab (Captura 3 Greninja Ref)**: CSS 3D transforms with pointer/mouse/touch drag controller for continuous 3D rotation, front/back face visibility, holographic sheen tracking, and authentic PSA certification slab replication: transparent beveled acrylic frame with structural corner notches (`muescas estructurales`), official top label framed in PSA red, official PSA logo, crisp barcode, cert code, regulatory typography, and GEM MT 10 grade.
  2. **Differentiated Live Order Tracking Simulation (R1)**: Dynamic tracking view with accelerated progression (Stage 2 preparation completes rapidly with a green checkmark `✓` in ~2s and fluidly activates Stage 3). Clear differentiation by delivery mode:
     - **Retiro en Local / Bóveda Quito**: Suppresses truck icon and road transit animation; displays "Listo para retiro presencial en Bóveda", address (Av. República del Salvador N34-183 / Bóveda G&S), opening hours (Lun-Sáb 09:00 - 18:00), and mandatory ID card (Cédula de Identidad) presentation requirement.
     - **Envío a Domicilio**: Displays armored courier transport ("Transporte Blindado") in active transit with pulse animation.
  3. **Universal Google Sign-In & Dynamic Auth (R2)**: Google Identity Services (GIS) integration across all entry points: `#auth` "Iniciar Sesión" tab, `#auth` "Crear Cuenta / Registrarse" tab, and Checkout quick login sidebar. Supports official GIS SDK with automatic interactive fallback when no Client ID is configured, populating session state (`Store.data.currentUser`), updating navbar, and prefilling checkout data without console errors.
  4. **Multi-criteria Category Search & Fault-Tolerant Filtering (R4)**: Smart search within active categories without blocking card results (e.g. searching for "charizard" in any category cleanly displays matching singles across price grades or activates vault fallback).
  5. **Modernized Category Drawer with Microinteractions (R5 - Captura 5)**: Luxury styling suite for category navigation buttons: refined 1px borders, subtle dark/gold/crimson gradients, clear hover microinteractions (`translateX(4px)`, border glow, icon scale, chevron reveal), hierarchical typography (bold title + subtitle metadata), and distinct category badges (Amber for PSA, Emerald for Raw, Crimson for Sealed, Blue for Sets).
  6. **FASE 8 Cloud Database Architecture & Normal Market Catalog (R6)**:
     - `js/db/schema.sql`: Complete PostgreSQL/Supabase DDL for 12 relational business entities + Row Level Security (RLS) policies.
     - `js/db/supabase-config.js`: Supabase client initialization with `isConfigured()`, `getClient()`, and CDN integration in `index.html`.
     - `js/db/db-client.js`: Robust hybrid data layer with transparent fallback to Dexie (IndexedDB) or localStorage when offline/unconfigured.
     - 10 Pokémon cards with normal real-market prices ($5.00 to $80.00 USD) replacing legacy exorbitant quotes across `js/data.js` and DB seeds.
     - `PLAN_DE_TRABAJO.md`: FASE 8 checklist fully marked with `[X]`.
  7. **Automated Test Suite & Verification Matrix**: Comprehensive tests in `tests/` covering unit, integration, stress, and forensic verification with 100% green pass rate.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source | Acceptance Criteria |
|---|---------|-------------|-----------|--------|---------------------|
| 1 | PDP Exclusive Condition Checkmark | Clicking condition button displays checkmark (✓) exclusively on active button | M1 | ORIGINAL_REQUEST R1 | Clicking any condition button displays checkmark exclusively on that button; previous checkmark vanishes |
| 2 | PDP Statistics Box Removal | Completely remove market history statistics box (12-month chart, SVG curve, trend pill) | M1 | ORIGINAL_REQUEST R2 | 12-month market history chart box, SVG curve, and percentage labels completely removed from PDP |
| 3 | PDP Price Prominence & Dynamic Reactivity | Keep `#pdp-price` prominently visible and reactive to condition changes | M1 | ORIGINAL_REQUEST R2 | Card price is prominently visible and dynamically updates upon condition clicks |
| 4 | 3D Viewer Clean Reverse Side | Eliminate `.centering-grid-overlay` and coordinate labels | M1 | ORIGINAL_REQUEST R3 | Reverse side of 3D card viewer contains no dotted grid overlay and no coordinate text; displays clean card back |
| 5 | API Search Action Button Navigation | Fix inline syntax errors on card action buttons and route cleanly to PDP | M1 | ORIGINAL_REQUEST R4 | Action buttons on search result cards open PDP with calculated price without console errors |
| 6 | API Card Purchase Flow Integration | Ensure API search cards can be added to cart and purchased through checkout | M1 | ORIGINAL_REQUEST R4 | API search cards added to cart complete transactional order without database errors |
| 7 | API Card Cache Persistence | Persist `Store.data.apiCardsCache` to `localStorage` across page reloads | M1 | ORIGINAL_REQUEST R4 | Navigating to external card PDP survives page refresh without defaulting to Charizard base |
| 8 | Preloaded Live Order Tracking Simulation | Display active simulated order timeline upon loading `#tracking` | M1 | ORIGINAL_REQUEST R5 | Navigating to `#tracking` with no prior orders immediately displays active simulated timeline |
| 9 | Tracking Manual Controls Removal | Ensure tracking view contains zero manual simulation control buttons | M1 | ORIGINAL_REQUEST R5 | Tracking section contains no manual simulation control buttons |
| 10 | Real Checkout Tracking Sync | Checkout order finalization links to and updates active tracking timeline | M1 | ORIGINAL_REQUEST R5 | Completing a store purchase displays user's placed order with courier details in `#tracking` |
| 11 | Elimination of Hardcoded User Profile Data | Remove hardcoded mock data on initial page load | M1 | ORIGINAL_REQUEST R6 | Initial page load shows guest state with empty profile fields; no hardcoded default user data |
| 12 | Production Google Identity Services (GIS) Web SDK | Integrate GIS Web SDK in `index.html` and configure client structure | M1 | ORIGINAL_REQUEST R6 | GIS script loaded asynchronously; `google.accounts.id` initialized when client ID configured |
| 13 | Material Design Google Fallback Button | Provide Google-branded fallback button for offline or unconfigured client ID | M1 | ORIGINAL_REQUEST R6 | Elegant, Google-compliant fallback button renders on `#profile` when unauthenticated |
| 14 | Pure JavaScript JWT Decoding | Decode Google ID token payload client-side without external dependencies | M1 | ORIGINAL_REQUEST R6 | Decodes `sub`, `name`, `email`, and `picture` to establish authenticated session |
| 15 | Dynamic Profile Session & Google Sign-Out | Populate profile dynamically on login and support clean sign-out to guest state | M1 | ORIGINAL_REQUEST R6 | Profile displays avatar, name, email only after auth; sign-out reverts session and navbar to guest |
| 16 | 3D Card Interactive Drag Rotation | Preserve smooth mouse/touch drag 360° rotation with perspective | M1 | ORIGINAL_REQUEST R1/R3 | Mouse and touch dragging on 3D viewer smoothly rotates card in 3D perspective |
| 17 | Zero JavaScript Console Errors | Guarantee zero runtime errors during navigation, search, and condition switching | M1 | ORIGINAL_REQUEST Criteria | Zero JavaScript console errors across all application views and interactions |
| 18 | Automated Test Suite Expansion & Green Pass | Implement comprehensive tests for R1-R6 and maintain 100% test pass rate | M1 | ORIGINAL_REQUEST Criteria | All test suites in `tests/` pass cleanly via `node --test tests/*.test.mjs` |
| 19 | Accelerated Tracking Preparation Simulation | Accelerate Stage 2 preparation with automated non-blocking timer completing with checkmark `✓` | M2 | ORIGINAL_REQUEST (R1) | Stage 2 completes quickly with checkmark and fluidly transitions active status to Stage 3 |
| 20 | Differentiated Tracking for Vault Pickup | For "Retiro en Local / Bóveda Quito", suppress truck animation and show vault pickup instructions | M2 | ORIGINAL_REQUEST (R1) | No truck animation on pickup orders; displays "Listo para retiro presencial en Bóveda", address, hours, ID requirement |
| 21 | Differentiated Tracking for Home Delivery | For "Envío a Domicilio", display animated armored courier transport in transit | M2 | ORIGINAL_REQUEST (R1) | Armored truck animation and courier tracking active for home delivery orders |
| 22 | Google Sign-In in Auth Login & Register Tabs | Add functional Google Sign-In button in both "Iniciar Sesión" and "Crear Cuenta" tabs in `#auth` | M2 | ORIGINAL_REQUEST (R2) | Google button visible and styled in both auth tabs with clean session and navbar sync |
| 23 | Google Sign-In in Checkout Quick Login | Add functional Google Sign-In button in Checkout quick login sidebar | M2 | ORIGINAL_REQUEST (R2) | Google button present in Checkout; authenticating updates session and prefills buyer fields |
| 24 | Authentic PSA Slab Acrylic Frame & Notches | Replicate authentic PSA slab with beveled acrylic, 4 corner notches, and embossed PSA logo | M2 | ORIGINAL_REQUEST (R3) | Clear acrylic slab with beveled border, 4 corner notches, embossed mark, removing overlay sticker |
| 25 | Authentic PSA Red-Border Top Label | Style PSA top label with characteristic red border, official typography, barcode, and GEM MT 10 | M2 | ORIGINAL_REQUEST (R3) | Crisp white label with red framing border, PSA logo, barcode, cert code, 3-line details, GEM MT 10 |
| 26 | Multi-criteria Category Search Logic | Fix search within category so searching card names (e.g. "charizard") does not block results | M2 | ORIGINAL_REQUEST (R4) | Category + text query finds cards matching both criteria or triggers semantic vault fallback cleanly |
| 27 | Modernized Category Drawer Microinteractions | Redesign drawer buttons with 1px borders, gradients, badges, and hover microinteractions | M2 | ORIGINAL_REQUEST (R5) | Drawer buttons feature refined gradients, colored badges, and interactive hover feedback |
| 28 | Supabase PostgreSQL DDL (`schema.sql`) | Create `js/db/schema.sql` for 12 business entities + RLS policies | M2 | ORIGINAL_REQUEST (R6) | Complete, syntactically valid PostgreSQL DDL matching relational schema and RLS requirements |
| 29 | Supabase Config & Hybrid Transparent Fallback | Create `supabase-config.js`, CDN in `index.html`, and hybrid failover in `db-client.js` | M2 | ORIGINAL_REQUEST (R6) | Supabase initialized with transparent failover to Dexie IndexedDB when unconfigured/offline |
| 30 | 10 Pokémon Cards Normal Market Prices ($5-$80) | Populate catalog with 10 real-market Pokémon cards priced reasonably ($5 to $80 USD) and mark FASE 8 `[X]` | M2 | ORIGINAL_REQUEST (R6) | 10 cards with all condition grades between $5.00 and $80.00 USD; `PLAN_DE_TRABAJO.md` FASE 8 marked `[X]` |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| M1 | Production Refactoring & Feature Enhancement | Features 1–18 (PDP checkmarks, statistics removal, 3D clean back, API search, initial tracking, GIS baseline) | Survey Complete | DONE |
| M2 | Production Optimization & Evolution (R1–R6) | Features 19–30: Accelerated differentiated tracking (R1), Google Sign-In in Auth tabs & Checkout (R2), Authentic PSA Slab redesign (R3), Multicriteria search (R4), Modernized category drawer (R5), Supabase architecture + 10 normal cards catalog + FASE 8 mark (R6) | M1 | IN_PROGRESS |

---

## Interface Contracts

### R1 (Differentiated Tracking) ↔ Tracking View & Checkout
- Order metadata: `metodo_entrega` ('pickup' | 'quito' | 'courier'), `deliveryMethod` string, `courierName`, `trackingNumber`.
- Stage schema: Array of `{ id, title, subtitle, detail, status: 'completed' | 'active' | 'pending', icon }`.
- Pickup presentation: When `metodo_entrega === 'pickup'`, header displays vault shield icon (`lucide="shield-check"`), suppresses courier truck animation, and displays:
  * Stage 3 title: `"Listo para Retiro en Bóveda"`
  * Subtitle: `"Bóveda Central Quito • Sala de Entrega Privada"`
  * Address: `"Av. República del Salvador N34-183 y Moscú, Edificio Bóveda Central, Piso 2, Quito"`
  * Schedule: `"Lunes a Sábado: 09:00 - 18:00 (Previa Cita o Inmediata)"`
  * Requirements: `"Presentar Cédula de Identidad original del titular o código QR de orden"`
- Delivery presentation: When `metodo_entrega !== 'pickup'`, header displays courier truck icon, and Stage 3 shows `"En Camino / Despacho"`, `"Transporte Blindado Especializado"`, with truck animation.
- Progression timer: `TrackingView.afterRender()` starts non-blocking timer: after ~2s, if Stage 2 is `'active'`, it updates Stage 2 to `'completed'` (`icon: 'check'`), sets Stage 3 to `'active'`, and updates DOM smoothly without full reload or flicker.

### R2 (Google Sign-In) ↔ Auth Tabs, Checkout & GIS SDK
- Container IDs:
  * `#auth` Login tab: `#google-signin-container-auth-login`
  * `#auth` Register tab: `#google-signin-container-auth-register`
  * `#checkout` Quick Login: `#google-signin-container-checkout`
- SDK Initialization: `app.initGoogleSignIn(containerId)` mounts either official Google button via `google.accounts.id.renderButton` or interactive Material Design fallback button `app.handleSimulatedGoogleLogin()`.
- Session sync: On successful sign-in (credential response or simulated login), `Store.data.currentUser` is set with `{ id, name, email, avatar, authProvider: 'google', idCard, phone, city, address }`. `app.updateNavbarUserUI()` is called, and relevant checkout/auth views re-render with buyer data prefilled.

### R3 (Authentic PSA Slab) ↔ PDP CSS & DOM
- Slab root: `.psa-acrylic-slab` with transparent beveled acrylic frame (`box-shadow`, multiple stepped borders, glass reflection gradient).
- Corner notches: 4 structural notches `.psa-notch-tl`, `.psa-notch-tr`, `.psa-notch-bl`, `.psa-notch-br` in acrylic corners replicating Greninja PSA 10 photo.
- PSA Label: `.psa-official-label` with white paper texture, characteristic red border (`border: 3px solid #d32f2f` / `#dc2626`), official PSA red header with centered/aligned text `PROFESSIONAL SPORTS AUTHENTICATOR`, 3-line card info, barcode `.psa-barcode`, cert number `#certCode`, and grade block `GEM MT 10`.
- Embossed logo: Bottom-right molded acrylic text `"PSA"` with subtle 3D emboss.
- Card artwork: Free of artificial sticker overlays over the card face.
- Preserves all legacy test selectors (`.psa-acrylic-slab`, `.psa-inner-well`, `PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#certCode`, `GRADO`, `GEM MT 10`).

### R4 (Multicriteria Category Search) ↔ Catalog & Router
- In `js/views/catalog.js` `getFilteredProducts()`:
  * Category filter matches cards where `card.categoria === f.category` OR semantic category compatibility (e.g. Raw cards and PSA singles are both single cards, or cards tagged `'single'`/`'psa'`/`'raw'`).
  * If a text query `f.search` is present, it searches by card name, set, or number within the category. If the strict category yields 0 matches, it gracefully searches all single cards in the vault matching the term, ensuring search terms like "charizard" or "greninja" never block result display.
- In `js/app.js`: When routing to `#catalog?q=...`, ensure query parsing does not lock incompatible category state.

### R5 (Modernized Category Drawer) ↔ Drawer DOM & CSS
- Drawer button structure in `index.html`:
  * Gradient card background (`bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80`).
  * 1px subtle gold/slate border (`border border-slate-700/50 hover:border-amber-500/50`).
  * Hover microinteractions: `transition-all duration-200 hover:translate-x-1 hover:shadow-lg`.
  * Distinct category badges (`PSA 10`: Amber badge `bg-amber-500/10 text-amber-400 border border-amber-500/30`, `Raw`: Emerald badge, `Sellado`: Crimson badge, `Sets`: Cyan/Blue badge).
  * Right chevron icon `.drawer-chevron` with subtle slide on hover.

### R6 (Supabase Architecture, Hybrid DB & Normal Catalog) ↔ DB Layer & Plan
- `js/db/schema.sql`: 12 DDL tables (`usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`) + composite PKs + foreign keys + indexes + RLS policies.
- `js/db/supabase-config.js`: Singleton `SupabaseConfig` with `SUPABASE_CONFIG`, `isConfigured()`, `getClient()`.
- `index.html`: Added `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` and `<script src="js/db/supabase-config.js"></script>`.
- `js/db/db-client.js`: `GradedSealedDB` checks `SupabaseConfig.isConfigured()`. If online, queries Supabase; on error or when unconfigured, falls back transparently to Dexie/IndexedDB with identical API.
- 10 Pokémon Cards in `js/data.js` and DB seeds:
  1. Pikachu (Crown Zenith 160/159): Raw $12, PSA 8 $18, PSA 9 $24, PSA 10 $48
  2. Charizard ex (Paldean Fates 054/091): Raw $10, PSA 8 $16, PSA 9 $22, PSA 10 $45
  3. Eevee (Twilight Masquerade 188/167): Raw $38, PSA 8 $45, PSA 9 $55, PSA 10 $78
  4. Gengar (Scarlet & Violet Base 057/198): Raw $5, PSA 8 $9, PSA 9 $14, PSA 10 $28
  5. Greninja ex (Twilight Masquerade 106/167): Raw $8.50, PSA 8 $14, PSA 9 $20, PSA 10 $38
  6. Mimikyu (Paldean Fates 097/091): Raw $14, PSA 8 $20, PSA 9 $28, PSA 10 $52
  7. Mewtwo (Pokémon 151 059/165): Raw $6, PSA 8 $11, PSA 9 $16, PSA 10 $32
  8. Lucario VSTAR (Crown Zenith SWSH291): Raw $7, PSA 8 $12, PSA 9 $18, PSA 10 $36
  9. Raichu GX (Shining Legends 29/73): Raw $6.50, PSA 8 $12, PSA 9 $18, PSA 10 $35
  10. Blastoise ex (Pokémon 151 009/165): Raw $8, PSA 8 $14, PSA 9 $20, PSA 10 $42
  - All cards strictly between $5.00 and $80.00 USD across all grades.
- `PLAN_DE_TRABAJO.md`: FASE 8 header line and all 5 checklist items updated to `[X]`.

---

## Code Layout
- `js/views/tracking.js`: Live order tracking view, accelerated Stage 2 simulation timer, pickup vs delivery branching.
- `js/views/checkout.js`: Checkout delivery method metadata sync, Google Sign-In button container in quick login sidebar and `#auth` tabs.
- `js/app.js`: Global router, `afterRender()` invocations for tracking and auth, Google Sign-In initialization across all containers, query parsing.
- `js/views/pdp.js`: PDP view rendering, authentic PSA slab markup with acrylic frame, 4 corner notches, and official red border label.
- `css/styles.css`: Authentic PSA slab styling, corner notches, embossed logo, Google sign-in buttons, modernized category drawer styling.
- `js/views/catalog.js`: Multicriteria category search logic, semantic category matching, vault search fallback.
- `index.html`: Supabase CDN scripts, category drawer modern markup with badges and microinteractions.
- `js/db/schema.sql`: PostgreSQL DDL for 12 business entities + composite PKs + indexes + RLS policies.
- `js/db/supabase-config.js`: Supabase client configuration module.
- `js/db/db-client.js`: Hybrid transparent database access layer (Supabase with automatic Dexie IndexedDB fallback).
- `js/data.js`: Catalog containing 10 Pokémon cards with normal real-market prices ($5 to $80 USD).
- `PLAN_DE_TRABAJO.md`: Project plan with FASE 8 marked with `[X]`.
- `tests/`: Automated unit, integration, and challenger test suites (expanding to verify R1–R6).
