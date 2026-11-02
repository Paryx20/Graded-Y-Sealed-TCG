# Project: E-Commerce Web Platform Enhancement (R1-R4)

## Architecture
- **Client-Side SPA Architecture**: Vanilla JavaScript (ES Modules), Tailwind CSS, Lucide Icons, Dexie.js (IndexedDB).
- **Core Modules**:
  - `js/app.js`: Main application controller, routing, navbar, toast notifications, auth modal controller.
  - `js/state.js`: Central state management (`Store`), user session persistence (`localStorage.gstcg_user`), order history.
  - `js/data.js`: Product catalog data (`POKEMON_CARDS_CATALOG_10`, `SEALED_PRODUCTS`, `PRODUCTS`).
  - `js/views/tracking.js`: Order tracking view, stage timeline, anonymous empty search view, simulation timers.
  - `js/views/checkout.js`: Multi-step checkout, cédula/card validation, payment error handling.
  - `js/views/profile.js`: User account profile, authenticated badges, saved addresses.
  - `js/views/catalog.js` & `js/views/pdp.js`: Product display, 3D card inspect, sealed product multi-angle gallery.
- **Testing Architecture**: Zero-dependency native Node.js v24 test runner (`node:test`, `node:assert/strict`) with DOM mocking harness (`tests/test_harness.mjs`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1-F1: Dynamic Google Sign-In Modal Markup | Client-side modal in `index.html` with name/email inputs, quick selector, accessible tags | M2 | Survey Explorer 1 |
| 2 | R1-F2: Google Modal Controller & Events | Controller methods `openGoogleSignInModal`, `closeGoogleSignInModal`, `submitGoogleSignInModal`, ESC key | M2 | Survey Explorer 1 |
| 3 | R1-F3: Dynamic Google Authentication State | Parameterized `handleSimulatedGoogleLogin(name, email)` updating Store & localStorage | M2 | Survey Explorer 1 |
| 4 | R1-F4: Navbar User Indicator Reactivity | Updating `#nav-user-label` and active styling with dynamic user's first name | M2 | Survey Explorer 1 |
| 5 | R1-F5: Removal of Hardcoded Credentials | Purging "Patrick Mora" and "patrickmora2006@gmail.com" from default Google auth logic | M2 | Survey Explorer 1 |
| 6 | R2-F1: Anonymous Default Tracking View | Clean empty search interface in `#tracking` when session has no active order | M3 | Survey Explorer 1 |
| 7 | R2-F2: Order Code Lookup & Verification | `TrackingView.handleTrackingSearch()` resolving orders by ID/code with friendly feedback | M3 | Survey Explorer 1 |
| 8 | R2-F3: Active Session Order Auto-Tracking | Immediate rendering of order stages for orders placed within the active user session | M3 | Survey Explorer 1 |
| 9 | R2-F4: Anonymization of Preloaded Mock Data | Replacing hardcoded "Patricio Mora" in state & tracking with dynamic or anonymous fallback | M3 | Survey Explorer 1 |
| 10 | R2-F5: Simulation Timer Safeguard | Suppressing stage progression timers when viewing the empty search view | M3 | Survey Explorer 1 |
| 11 | R3-F1: Gengar Holo Card Asset Link | Linking `img/cards/gengar-holo-scarlet.png` to `gengar-scarlet-violet` in `js/data.js` | M1 | Survey Explorer 2 |
| 12 | R3-F2: Mewtwo Holo Card Asset Link | Linking `img/cards/mewto-holo-rare.png` to `mewtwo-151` in `js/data.js` | M1 | Survey Explorer 2 |
| 13 | R3-F3: Mimikyu Shiny Card Asset Link | Linking `img/cards/mimikyu-rare.png` to `mimikyu-paldean` in `js/data.js` | M1 | Survey Explorer 2 |
| 14 | R3-F4: Fossil Sealed Booster Asset Link | Linking `img/sealed/Paquete fossil.png` to `booster-box-fossil-1999` and `galeria_sellada` | M1 | Survey Explorer 2 |
| 15 | R3-F5: DOM Image Error Resilience | Ensuring all 4 items render properly across Catalog, PDP, Search, and Cart | M1 | Survey Explorer 2 |
| 16 | R4-F1: Natural Cart & Removal Banner | Replacing robotic terms ("Ítem eliminado", "[Deshacer acción]") with warm Spanish | M4 | Survey Explorer 3 |
| 17 | R4-F2: Consumer-Friendly Security Copy | Replacing cybersecurity jargon ("TLS 256-bit", "PCI-DSS") with reassuring consumer text | M4 | Survey Explorer 3 |
| 18 | R4-F3: Plain-Language Cédula Validation | Replacing "algoritmo Módulo 10" with plain, helpful Ecuadorian document instructions | M4 | Survey Explorer 3 |
| 19 | R4-F4: Empathetic Payment Error Diagnostics | Humanizing card decline messages without alarmist diagnostic headers | M4 | Survey Explorer 3 |
| 20 | R4-F5: Customer-Centric Tracking Stage Copy | Replacing forensic/military phrases ("cadena de custodia", "tamper-evident", "¡Hito!") | M4 | Survey Explorer 3 |
| 21 | R4-F6: Accessible Profile & Search Headers | Humanizing technical OAuth and API cascade headers | M4 | Survey Explorer 3 |
| 22 | E2E-F1: Dual-Track Test Infrastructure | Comprehensive 4-tier test suite using native `node:test` | M-E2E | Survey Explorer 3 |
| 23 | E2E-F2: Tier 1 Feature Coverage Tests | ≥5 tests per feature for R1, R2, R3, R4 | M-E2E | Survey Explorer 3 |
| 24 | E2E-F3: Tier 2 Boundary & Corner Tests | ≥5 tests per feature for edge cases, whitespace, empty states, special chars | M-E2E | Survey Explorer 3 |
| 25 | E2E-F4: Tier 3 Cross-Feature Interactions | Pairwise interaction tests connecting Auth, Catalog, Cart, Checkout, Tracking | M-E2E | Survey Explorer 3 |
| 26 | E2E-F5: Tier 4 Real-World Application Tests | Realistic end-to-end user journeys for collectors and visitors | M-E2E | Survey Explorer 3 |
| 27 | FINAL-F1: Legacy Test Suite Alignment | Transition legacy test files asserting previous phase mocks to dynamic behavior | M5 | Survey Explorer 1 |
| 28 | FINAL-F2: 100% E2E Test Suite Pass | Complete test pass across all legacy and E2E suites | M5 | Project Requirement |
| 29 | FINAL-F3: Adversarial Coverage Hardening | White-box challenger gap analysis and test coverage hardening | M5 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Catalog Assets & Data Integrity (R3) | `js/data.js`, `js/db/db-client.js` updates for Gengar, Mewtwo, Mimikyu, Fossil booster | none | PLANNED |
| M2 | Dynamic Google Sign-In Modal (R1) | `#google-signin-modal` in `index.html`, controller methods and dynamic state in `js/app.js` | none | PLANNED |
| M3 | Anonymous Order Tracking (R2) | Anonymous empty search state and code lookup in `js/views/tracking.js` and `js/state.js` | M2 | PLANNED |
| M4 | Humanized UI Copy & Tone (R4) | 32-term copy refinement across `index.html`, `js/views/*.js` | M1, M2, M3 | PLANNED |
| M-E2E | E2E Testing Track | Independent 4-tier opaque-box test suite (`tests/e2e_requirements_r1_to_r4.test.mjs`), `TEST_READY.md` | none (Parallel) | PLANNED |
| M5 | Final Milestone (E2E Pass & Hardening) | Transition legacy tests, pass 100% E2E tests, Tier 5 Adversarial Hardening | M1, M2, M3, M4, M-E2E | PLANNED |

## Interface Contracts
### App / Auth ↔ Google Modal
- `app.openGoogleSignInModal()`: Displays `#google-signin-modal`, focuses `#google-modal-name`.
- `app.closeGoogleSignInModal()`: Hides `#google-signin-modal`.
- `app.selectGoogleQuickAccount(name, email)`: Auto-fills name/email and submits.
- `app.submitGoogleSignInModal()`: Validates inputs, calls `app.handleSimulatedGoogleLogin(name, email)`.
- `app.handleSimulatedGoogleLogin(name, email)`: If called without args, calls `openGoogleSignInModal()`; if called with valid strings, establishes session with `{ id, name, email, authProvider: 'google', ... }`, saves to `Store`, updates navbar, displays friendly welcome toast.

### Store ↔ TrackingView
- `Store.data.activeTrackingOrderId`: String order ID or `null`.
- `Store.data.orders`: Array of placed orders in session.
- `TrackingView.render()`:
  - If `activeTrackingOrderId` is set or `orders.length > 0`: renders order stages.
  - If no active or session order exists: calls `renderEmptySearchState()`.
- `TrackingView.handleTrackingSearch()`: Reads `#tracking-search-input`, matches against `Store.data.orders` or demo code (with dynamic/anonymous buyer name), renders order or shows `#tracking-search-error`.

### Catalog Data ↔ DOM Views
- `card.imagenLocal` / `product.imagenLocal`:
  - `gengar-scarlet-violet`: `'img/cards/gengar-holo-scarlet.png'`
  - `mewtwo-151`: `'img/cards/mewto-holo-rare.png'`
  - `mimikyu-paldean`: `'img/cards/mimikyu-rare.png'`
  - `booster-box-fossil-1999`: `'img/sealed/Paquete fossil.png'`
- `product.galeria_sellada`:
  - `frontal`, `perspectiva`, `lateral` all point to `'img/sealed/Paquete fossil.png'`.

## Code Layout
- `index.html`: Shell markup, navbar, modals (`#google-signin-modal`, `#delete-confirm-modal`), toasts, footer.
- `js/data.js`: Master product catalog data definitions.
- `js/state.js`: Reactive Store, local storage persistence, order retrieval.
- `js/app.js`: Application router, navbar UI, Google auth controller, toast notifications.
- `js/views/tracking.js`: Tracking view, empty search state, timeline rendering, lookup handler.
- `js/views/checkout.js`: Checkout flow, payment verification, humanized labels and alerts.
- `js/views/profile.js`: User profile view, addresses, orders list.
- `js/views/catalog.js` & `js/views/pdp.js`: Catalog cards and PDP inspector modal.
- `tests/`: Node native test runner test suites (`node:test`).
