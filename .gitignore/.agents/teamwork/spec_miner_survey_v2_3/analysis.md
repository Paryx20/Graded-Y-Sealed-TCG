# Specification Mining & Architecture Report: Requirement R4
**Milestone:** Survey Instance 3 — Interface Stability, Navigation, and Automated Test Suite  
**Date:** 2026-11-02T03:25:00Z  
**Target Repository:** `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`  
**Reference Document:** `.agents/teamwork/ORIGINAL_REQUEST.md`  

---

## 1. Executive Summary

This investigation surveys **Requirement R4 (Interface Stability, Navigation, and Automated Test Suite)** across the Pokémon TCG e-commerce platform. It systematically investigates:
1. The end-to-end Single Page Application (SPA) routing and navigation architecture (`index.html`, `js/app.js`, view modules).
2. Header search bar wiring, spotlight modal interaction, and debounced input execution.
3. The empirical execution status and pass/fail state of the automated test harness in `tests/`.
4. The test coverage alignment against the four Acceptance Criteria of `ORIGINAL_REQUEST.md` (3D Card Inspection, Dynamic Condition Pricing, API Search & Realistic Prices, UI & Console Integrity).
5. Specific defects, race conditions, unshielded library calls, and test suite blockers discovered during probing.

---

## 2. Navigation & Interface Stability Analysis

### 2.1 SPA Routing Lifecycle (`js/app.js:43-163`)
The application implements client-side hash routing listening to `window.onhashchange` and initial DOM loading:
- **Hash extraction:** `const raw = window.location.hash.replace(/^#/, '').trim();`
- **Route splitting:** `const parts = raw.split('?'); const route = (parts[0] || 'home').toLowerCase(); const params = new URLSearchParams(parts[1] || '');`
- **View Container:** `<main id="app-view" class="flex-1 pb-16"></main>` (`index.html:293`).
- **Route Handlers:**
  - `#home`: Calls `HomeView.render()`. Renders hero display, vault product cards, and category drawers.
  - `#catalog`: Parses `?cat=` (psa, raw, sealed), `?era=` (vintage, modern), and `?q=`. Updates `Store.data.catalogFilters`, renders `CatalogView.render()`.
  - `#pdp`: Parses `?id=`. Matches `PRODUCTS.find(p => p.id === prodId)`. Resets condition to PSA 9/10, quantity to 1, inspector mode to `'front'`, renders `PDPView.render()`, and triggers `PDPView.afterRender()` (which paints SVG 12-month quotation curve).
  - `#cart`: Renders `CartView.render()`, computing line items, quantities, subtotal, 15% VAT, and tri-tier shipping fees ($0/$3/$5).
  - `#checkout`: Calls `CheckoutView.renderCheckout()`. Displays mandatory account registration if guest, or order summary with payment trigger if authenticated.
  - `#confirmation`: Calls `CheckoutView.renderConfirmation()`. Renders generated order details, custody chain verification, and link to `#tracking`.
  - `#tracking`: Parses `?order=`. Renders `TrackingView.render()`, resolving live logistic status from Dexie.js order history.
  - `#profile`: Calls `ProfileView.render()`. Shows user identity, tabbed personal details editor, and historical order receipts with tracking shortcuts.
  - `#auth`: Calls `CheckoutView.renderAuth()`. Registration and authentication modal.
  - `#search-results`: Parses `?q=`. Calls `SearchResultsView.render(Store.data.searchQuery)`. Wires live 400ms debounced input and calls `SearchResultsView.afterRender()`.
  - `#error`: Calls `CheckoutView.renderPaymentError()` when bank decline `#DECLINED-SEC-054` is simulated.
  - **Fallback Route:** Unknown hash fragments cleanly fall back to `home` via `validRoutes.includes(route) ? route : 'home'`.

### 2.2 Global Search Bar Wiring (`index.html:78-98` & `js/app.js:424-546`)
- **Structure:**
  - Form: `<form onsubmit="event.preventDefault(); app.executeGlobalSearch(document.getElementById('global-search').value);" role="search">`
  - Input: `<input id="global-search" type="search" placeholder="Buscar Charizard, Moonbreon...">`
  - Submit Button: `<button type="submit" aria-label="Ejecutar búsqueda">`
  - Backdrop: `<div id="search-spotlight-backdrop" class="fixed inset-0 ..."></div>`
  - Live Dropdown: `<div id="search-live-dropdown" class="hidden absolute left-0 right-0 top-full mt-2 ..."></div>`
- **Behavior & Events:**
  - `focus`: Activates spotlight backdrop (`backdrop.classList.add('active')`) and calls `renderLiveSearchDropdown()`.
  - `input`: Re-evaluates query across local `PRODUCTS` in real time, rendering up to 5 quick matches with thumbnails and prices.
  - `keydown Enter`: Catches Enter key, prevents default form reload, closes spotlight backdrop, and calls `app.executeGlobalSearch(searchInput.value)`.
  - `submit`: Form `onsubmit` prevents page reload and executes `app.executeGlobalSearch(value)`.
  - Navigation execution: `app.executeGlobalSearch(query)` normalizes whitespace, updates `Store.data.searchQuery`, and sets `window.location.hash = '#search-results?q=' + encodeURIComponent(cleanQ)`.
  - **Verdict:** Smooth, single-page navigation without full page reload.

### 2.3 Broken Links & Console Integrity Risks
The codebase was probed for broken links, syntax errors, and unhandled runtime exceptions:
1. **Unshielded `lucide.createIcons()` Calls:**
   - In `js/app.js:156` (`renderCurrentView`), `js/app.js:261` (`requestRemoveItem`), `js/app.js:294` (`confirmRemoveItem`), and `js/views/catalog.js:405`:
     `lucide.createIcons()` is called directly without checking `if (typeof lucide !== 'undefined' && lucide.createIcons)`.
   - If the third-party Lucide CDN script (`https://unpkg.com/lucide@latest`) fails to load, is blocked by adblockers, or executes in an offline testing environment, any route change throws `ReferenceError: lucide is not defined`, crashing the SPA rendering loop.
2. **Missing Property Access Vulnerability in `js/views/pdp.js:68`:**
   - `<div class="text-[11px] font-black text-[#0F172A] leading-tight line-clamp-1">${product.set.toUpperCase()}</div>`
   - If `product.set` is missing, null, or undefined (e.g. from an API card search result missing a set name), `toUpperCase()` throws `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
3. **Missing Condition Pricing Vulnerability in `js/views/pdp.js:551`:**
   - In `PDPView.selectCondition(condKey)`:
     `const price = product.precios[condKey];`
     `app.showToast('Grado seleccionado: ... ($' + price.toLocaleString('en-US') + ')', 'info');`
   - If `product.precios` is undefined or does not contain `condKey`, `price.toLocaleString()` throws `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`.
4. **HTML Injection in Dropdown (`js/app.js:515`):**
   - `<button type="button" onclick="app.executeGlobalSearch('${q.replace(/'/g, '')}')" ...>`
   - Query sanitization relies on stripping single quotes, but double quotes or special characters could break inline attributes.

---

## 3. Automated Test Suite Census & Empirical Execution

### 3.1 Test Execution Census
When executing the full suite command:
```powershell
cmd /c "node --test tests/*.test.mjs"
```
**Empirical Result: HANGS INDEFINITELY after test 57.**

### 3.2 Root-Cause Analysis of Suite Hang
- **Culprit:** `tests/test_challenger_m3_ui.test.mjs`, Suite 1.5 (lines 432-451).
- **Code:**
  ```javascript
  test('Challenger 2 [Suite 1.5]: PokemonAPI.debounceSearch facade cancels previous unresolved promise', async () => {
    const { sandbox } = createSearchEnvironment();
    const PokemonAPI = sandbox.PokemonAPI;
    const api = new PokemonAPI();
    let callCount = 0;
    const p1 = api.debounceSearch('Char', () => { callCount++; });
    const p2 = api.debounceSearch('Chari', () => { callCount++; });
    const p3 = api.debounceSearch('Charizard', () => { callCount++; });
    const r1 = await p1;
    const r2 = await p2;
    const r3 = await p3;
    assert.ok(Array.isArray(r3));
  });
  ```
- **Mechanism:**
  1. `createSearchEnvironment()` binds `sandbox.setTimeout` to a mock `VirtualClock.setTimeout`.
  2. `api.debounceSearch()` registers a 400ms timer inside `VirtualClock.timers`.
  3. `p1` and `p2` resolve immediately with `{ cancelled: true }` because superseding calls cancel prior handles synchronously.
  4. However, `clock.advanceTime(400)` is **never called** for `p3`.
  5. In addition, when the timer would fire, `api.debounceSearch` attempts a real network `fetch()` to `https://api.pokemontcg.io/v2/cards` without mocked options.
  6. Node's test runner halts awaiting unresolved promise `p3`, hanging the entire multi-file runner.

### 3.3 Individual File Test Results (Isolated Execution)
When running each test file in isolation with individual timeouts:

| File Path | Total Tests | Pass | Fail | Hang | Duration | Features Tested |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `tests/test_pdp.test.mjs` | 46 | 46 | 0 | No | 154ms | **F1-F8**: Multi-angle sealed images, card assets, 3D Frontal sheen, 3D Back 180° flip + 50/50 centering, Slab PSA, sealed adaptive logic, quantity stepper, PSA guide modal. |
| `tests/test_validations.test.mjs` | 58 | 58 | 0 | No | 86ms | **F9-F15**: Mandatory account registration, Ecuadorian Cédula & natural RUC Module 10, Phone +593, Luhn credit card validation, `#DECLINED-SEC-054` on 0000, 15% VAT, flat shipping rates ($0/$3/$5). |
| `tests/test_cart_toast.test.mjs` | 15 | 15 | 0 | No | 2587ms | **F17-F18**: Singleton toast notification (strict DOM count of 1, 2.5s auto-dismiss), cart item deletion confirmation modal, and undo ('Deshacer') restoration. |
| `tests/test_search_failover.test.mjs` | 14 | 14 | 0 | No | 916ms | **F19-F20**: 3-tier search cascade (`pokemontcg.io` → `tcgdex.net` → local vault), 400ms input debounce, skeleton loader state, zero-results state. |
| `tests/test_profile_orders.test.mjs` | 34 | 34 | 0 | No | 85ms | **F16, F21-F25**: Dexie.js ACID persistence, `#profile` view, Personal Data editor, Order history by cédula, `[Ver Tracking en Vivo]` deep link, logout session. |
| `tests/test_e2e_suite.test.mjs` | 15 | 15 | 0 | No | 2593ms | **F26**: Work plan checklist contract + Tier 3 cross-feature integration + Tier 4 customer purchase journeys. |
| `tests/test_challenger_m1_r2.test.mjs` | 11 | 11 | 0 | No | 123ms | Adversarial Holo coordinates (10,000 iterations), quantity stepper boundaries, missing product era fallback. |
| `tests/test_challenger_m2_fuzz.test.mjs` | 18 | 18 | 0 | No | 108ms | Fuzzing Ecuadorian IDs (all 24 provinces), Luhn mutation detection (>7,000 cards), 10,000 VAT calculations, financial cart reconciliation. |
| `tests/test_challenger_m2_lifecycle.test.mjs` | 13 | 13 | 0 | No | 111ms | Toast burst concurrency (100 rapid toasts), cart removal undo lifecycle, checkout failure and decline simulation paths. |
| `tests/test_challenger_m3_ui.test.mjs` | 23 | 4 | 0 | **YES (Suite 1.5)** | >30s (timeout) | Decoupled search view, skeleton loaders, zero-results sanitization, source badges, search route parsing, adversarial burst typing. |
| `tests/test_reviewer_m2_stress.mjs` | 9 | 9 | 0 | No | 2754ms | Integrity verification, authentic business logic checks, stress validations for Cédula, RUC, Phone, Luhn, Toast, and Cart Undo. |
| `tests/test_empirical_challenger.mjs` | 11 | 11 | 0 | No | 113ms | High-res asset binary verification on disk, sealed vs card DOM invariants, quantity boundaries, PSA guide modal existence. |
| `tests/stress_verification_m1.mjs` | 74 assertions | 61 | 13 | No | 1210ms | Adversarial coordinate bounds, division by zero handling in `handleHoloMove`, asset payload sizes. |

---

## 4. Acceptance Criteria Coverage Matrix

The table below contrasts the actual automated test suite against the acceptance criteria specified in `ORIGINAL_REQUEST.md`:

| Requirement / Acceptance Criteria | Current Code Implementation Status | Automated Test Coverage in `tests/` | Gap / Defect Identified |
|---|---|---|---|
| **AC 1: 3D Card Inspection**<br>• Dragging with mouse or touch on PDP 3D viewer smoothly rotates card in 3D perspective.<br>• Both front and reverse sides fully visible and inspectable during rotation. | **PARTIAL / DEFECTIVE**<br>`PDPView.handleHoloMove` only adjusts CSS variables `--holo-x` and `--holo-y` for radial gradient sheen. Rotation is a static binary 180° flip triggered only by clicking tab buttons (`is-flipped-y`). No drag-to-rotate interaction exists. | **0% Coverage for Drag Rotation**<br>`test_pdp.test.mjs` and `test_challenger_m1_r2.test.mjs` only test static CSS classes and coordinate clamping for holo sheen. Zero tests simulate mouse/touch dragging, rotation angle computation, or continuous 360° perspective rotation. | **CRITICAL GAP**<br>Need implementation and test coverage for mousedown/mousemove/mouseup and touchstart/touchmove/touchend drag listeners, Euler angle transforms (`rotateX`, `rotateY`), and visibility of front/back faces across rotation range. |
| **AC 2: Dynamic Condition Pricing**<br>• Clicking condition buttons (Raw, PSA 8, PSA 9, PSA 10) immediately updates price to reflect that condition's price. | **PARTIAL / FRAGILE**<br>`PDPView.selectCondition(condKey)` updates `Store.data.pdpSelectedCondition` and renders `#pdp-price`. However, it crashes with `TypeError` if `product.precios` is missing or lacks `condKey`. | **0% Direct Dynamic Pricing Tests**<br>`test_empirical_challenger.mjs` only verifies that the string `'PDPView.selectCondition'` appears in HTML. Zero tests execute `selectCondition('raw')`, `selectCondition('psa8')`, etc., or assert that `#pdp-price` reflects that condition. | **HIGH PRIORITY GAP**<br>Must add automated unit & E2E tests clicking each condition button, verifying immediate DOM price update, verifying cart integration at that price, and verifying fallback when pricing tiers are absent. |
| **AC 3: API Search & Realistic Prices**<br>• Card images in API search load with valid URLs (no broken images).<br>• Cards do not show fixed $15.00 placeholder prices; realistic market pricing used.<br>• Selecting API card opens PDP with calculated cost & store flow integration. | **DEFECTIVE**<br>1. TCGdex cards hardcode `precioEstimado: Number(c.precioEstimado) \|\| 15.00` (line 157 in `pokemon-api.js`), forcing fixed $15.00.<br>2. TCGdex image URL formatting can produce broken links.<br>3. Selecting an API card calls `openQuoteModal` instead of opening PDP; `openProductPDP` only looks in local `PRODUCTS` array. | **Partial / Missing Verification**<br>`test_search_failover.test.mjs` tests failover cascade between APIs, but does NOT assert that prices are non-$15, does NOT validate image URL extensions, and does NOT test opening PDP for API cards. | **CRITICAL GAP**<br>Must implement: realistic price estimation by rarity/set; image URL sanitization; API card ingestion into PDP store flow. Must add automated tests for all three criteria. |
| **AC 4: UI & Console Integrity**<br>• Navigating between catalog, search results, and PDP produces zero console errors.<br>• Automated tests in `tests/` pass. | **FAILING**<br>1. Test suite hangs on `test_challenger_m3_ui.test.mjs:449`.<br>2. Unshielded `lucide.createIcons()` calls in `app.js` and `catalog.js` risk uncaught `ReferenceError`.<br>3. `product.set.toUpperCase()` and `product.precios[condKey]` risk uncaught `TypeError`. | **Blocked by Test Suite Hang**<br>While 8 of 10 test files pass in isolation, running the required automated test command `node --test tests/*.test.mjs` hangs indefinitely. | **HIGH PRIORITY GAP**<br>Unblock test runner by fixing unhandled promise in `test_challenger_m3_ui.test.mjs:449`. Add automated router navigation test asserting zero thrown errors across all route transitions. |

---

## 5. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| F1 | Navigation | Hash SPA Router | Client-side routing between `#home`, `#catalog`, `#pdp`, `#cart`, `#checkout`, `#confirmation`, `#tracking`, `#profile`, `#auth`, `#search-results`, `#error`. | `window.location.hash` | Injected HTML in `#app-view`, window smooth scroll to (0,0) | Unknown routes safely default to `#home`. | `js/app.js:43-118` |
| F2 | Navigation | PDP Deep Link Resolver | Resolves product ID parameter (`#pdp?id=prodId`) from query string. | `prodId` string | Sets `Store.data.currentPdpProduct`, resets condition & quantity | If ID is not in `PRODUCTS`, retains prior product or defaults. | `js/app.js:51-66` |
| F3 | Navigation | Catalog Multi-Filter Linker | Parses `cat`, `era`, and `q` params from hash route. | `?cat=psa`, `?era=vintage`, `?q=Charizard` | Sets `Store.data.catalogFilters`, renders filtered catalog | Invalid params fall back to `'all'`. | `js/app.js:68-92` |
| F4 | Search | Header Spotlight Search | Full-screen spotlight backdrop overlay focusing the search bar. | `focus` on `#global-search` | Backdrop active class, z-index elevation | `Escape` or clicking backdrop closes spotlight cleanly. | `js/app.js:424-464` |
| F5 | Search | Live Search Dropdown | Renders instant match dropdown (up to 5 items) while typing in header. | Input string | Dropdown DOM with thumbnails, set, PSA 10 price, and multifuente CTA | Empty results displays "No se encontraron piezas". | `js/app.js:466-526` |
| F6 | Search | Global Search Execution | Form submission handler for search bar without page reload. | Query string | Navigates to `#search-results?q=<query>` | Sanitizes whitespace; empty query opens blank prompt. | `js/app.js:536-546` |
| F7 | Search | 400ms Debounced Keystroke | Debounces input typing on `#search-results` page before dispatching search. | Keystroke events | Dispatches search query 400ms after final keypress | Superseded keypresses cancel prior timer handles. | `js/views/search-results.js:113-143` |
| F8 | Search | Skeleton Loader State | Displays 8 animated pulsing placeholder cards during pending search. | Triggering search query | `#search-skeletons` with `animate-pulse` and `skeleton-card` | Removed upon results, zero-state, or error. | `js/views/search-results.js:247-274` |
| F9 | Search | Multifuente 3-Tier Cascade | Primary `pokemontcg.io` → Secondary `tcgdex.net` → Fallback Local Vault. | Query string, abort timeout (4s) | Array of normalized card objects | Automatically catches network/HTTP failure and cascades down. | `js/services/pokemon-api.js:41-127` |
| F10 | Search | Zero-Results State & Escaping | User guidance tips and suggestions when query produces no matches. | Query string | `#search-zero-state` with recommendations and catalog CTA | Escapes HTML entities (`&lt;`, `&gt;`, `&quot;`, `&#39;`). | `js/views/search-results.js:281-314` |
| F11 | PDP | 3D Sheen Inspector (Front) | Holographic radial gradient tracking pointer movement across card. | `mousemove` / `touchmove` coordinates | Computes `--holo-x` and `--holo-y` [0%, 100%] | Clamps negative, excessive, and NaN coordinates safely. | `js/views/pdp.js:518-540` |
| F12 | PDP | 3D Reverse Flip & 50/50 Grid | Rotates card 180° Y-axis to inspect centering grid overlay and back art. | Click `setInspectorMode('back')` | CSS `.is-flipped-y`, renders centering crosshairs | Fallback defaults to front view if mode is unknown. | `js/views/pdp.js:98-145` |
| F13 | PDP | PSA Slab Inspector Mode | Renders PSA acrylic encapsulation case with cert number, barcode, and grade. | Click `setInspectorMode('slab')` | `.psa-acrylic-slab` container with hologram seal | Fallback cert code `'48291034'` if certNumber undefined. | `js/views/pdp.js:58-94` |
| F14 | PDP | Adaptive View Discriminator | Dynamically alters UI for sealed products vs graded single cards. | `tipo_discriminador` or `categoria === 'sealed'` | Suppresses PSA controls; renders sealed multi-angle gallery & specs | Defaults to card mode if property is absent. | `js/views/pdp.js:300-380` |
| F15 | PDP | Sealed Box Multi-Angle Gallery | Switches between Frontal, Perspectiva 3/4, and Lateral product angles. | `setSealedAngle('perspectiva')` | Displays high-res asset with angle badge and spec panel | Unrecognized angle falls back safely to frontal image. | `js/views/pdp.js:149-224` |
| F16 | PDP | Condition / Grade Selector | Switches card grade between Raw, PSA 8, PSA 9, PSA 10. | `selectCondition('psa10')` | Sets `pdpSelectedCondition`, updates `#pdp-price` | **Defect:** Throws TypeError if `precios[condKey]` is missing. | `js/views/pdp.js:547-553` |
| F17 | PDP | Quantity Stepper | Increments / decrements purchase quantity between 1 and 10. | `updateQuantity(delta)` | Clamps value in range [1, 10], updates `#pdp-quantity-value` | Rejects non-numeric, NaN, and negative delta values. | `js/views/pdp.js:555-568` |
| F18 | PDP | Interactive 12-Month Chart | SVG interactive price history curve with guide line, dot, and tooltip. | `mousemove` on `#pdp-interactive-chart` | Calculates nearest month data point, updates tooltip | Coordinates clamped within chart bounding box. | `js/views/pdp.js:710-760` |
| F19 | PDP | PSA Educational Guide Modal | Modal explaining PSA grading standards (Raw, PSA 8, PSA 9, PSA 10). | `app.openPSAGuideModal()` | Displays `#psa-guide-modal`, traps focus, locks body scroll | `Escape` or backdrop click cleanly closes modal. | `js/app.js:320-358` |
| F20 | Cart | Singleton Toast System | Displays temporary status notification with strict singleton guarantee. | `app.showToast(msg, type)` | Max 1 active toast in DOM, auto-dismiss in exactly 2.5s | Replaces prior active toast immediately and resets timer. | `js/app.js:550-606` |
| F21 | Cart | Cart Removal Confirmation Modal | Prompts user before removing product from shopping cart. | `requestRemoveItem(id)` | `#delete-confirm-modal` with item description | Cancelling restores clean state without cart mutation. | `js/app.js:249-270` |
| F22 | Cart | Undo ('Deshacer') Restoration | Reversible deletion restoring removed item to its exact prior index. | `undoLastDeletion()` | Re-inserts item at original index, dismisses undo banner | Safe no-op if `lastDeletedItem` is null. | `js/app.js:298-311` |
| F23 | Cart | Financial Calculation Engine | Computes subtotal, 15% VAT, and tri-tier flat shipping rates. | Line items, shipping selection (`pickup`, `quito`, `courier`) | Subtotal, Tax ($0.15 * subtotal), Shipping ($0/$3/$5), Total | Empty cart yields $0.00 across all fields. | `js/state.js:98-124` |
| F24 | Checkout | Mandatory Account Validation | Enforces user registration and password before processing payment. | Password string (>= 8 chars) | Creates or binds user entity in Dexie `usuarios` table | Blocks guest checkout with human-readable error. | `js/views/checkout.js:100-145` |
| F25 | Checkout | Ecuadorian Cédula & RUC Module 10 | Validates 10-digit Cédula and 13-digit natural RUC (`cedula + '001'`). | Identification string | Returns boolean (true = valid Module 10 checksum) | Rejects bad province (00, >24), invalid check digit, letters. | `js/state.js:127-160` |
| F26 | Checkout | Ecuadorian Phone Validation | Validates Ecuadorian telephone number with +593 format. | Phone string | Normalizes string, verifies +593 prefix and 9 digits | Rejects insufficient digits, missing prefix, script injections. | `js/state.js:163-172` |
| F27 | Checkout | Luhn Check & Card Verification | Validates credit card number format and Luhn mod 10 checksum. | Card number string | Validates card brand (Visa, MC, Amex, Discover) | Rejects incorrect checksum, non-numeric strings, bad lengths. | `js/views/checkout.js:180-210` |
| F28 | Checkout | Bank Decline Simulation | Cards ending in `'0000'` with valid Luhn simulate bank decline. | Card ending in `0000` | Rejects transaction with code `#DECLINED-SEC-054`, routes to `#error` | Does NOT create order or empty cart. | `js/views/checkout.js:215-235` |
| F29 | Database | Dexie.js ACID Order Persistence | Transactional persistence across `usuarios`, `ordenes_compra`, `items_orden`. | Order and user payloads | IndexedDB storage with indexed querying | Rolls back transaction on database error. | `js/db/db-client.js:100-180` |
| F30 | Profile | Order History & Tracking Deep Link | Renders past purchases by user ID with `[Ver Tracking en Vivo]` button. | Active user cédula | Order receipt cards, status badges, tracking redirection | Zero purchases displays informative empty state. | `js/views/profile.js:120-210` |

---

## 6. Edge Cases & Empirical Observations

| # | Feature | Input / Condition | Observed Behavior |
|---|---|---|---|
| E1 | Automated Test Suite | `cmd /c "node --test tests/*.test.mjs"` | Suite executes tests in `test_cart_toast`, `test_challenger_m1_r2`, `test_challenger_m2_fuzz`, `test_challenger_m2_lifecycle`, then **hangs indefinitely** on `test_challenger_m3_ui.test.mjs:449` because `clock.advanceTime(400)` is omitted before `await p3`. |
| E2 | 3D Card Inspector | Pointer / Touch dragging across card | Card remains at fixed 0° or 180° orientation; only radial gradient sheen moves. Does NOT rotate in 3D perspective along X/Y axes during drag. |
| E3 | Condition Selector | Clicking condition when `product.precios` is undefined (e.g. API card) | `PDPView.selectCondition` throws unhandled `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` on line 552. |
| E4 | PDP Render | Product object missing `era` property (e.g., custom sealed product) | Unhandled `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` if `(product.era \|\| 'vintage')` fallback is omitted. |
| E5 | PDP Render | Product object missing `set` property | Line 68 of `js/views/pdp.js` calls `product.set.toUpperCase()`, throwing `TypeError` if `product.set` is undefined. |
| E6 | Search API Normalization | Secondary source (`tcgdex.net`) card response | `c.precioEstimado` is undefined, causing line 157 of `pokemon-api.js` to assign fixed fallback `$15.00` to all TCGdex cards regardless of rarity or set. |
| E7 | Search Results Interaction | Clicking an API search result that is not in local `PRODUCTS` | Shows "Solicitar Adquisición" button which triggers a toast. Clicking card does NOT open PDP with calculated cost, violating R3 Acceptance Criteria. |
| E8 | SPA Router | Lucide library fails to load or offline | Line 156 in `js/app.js` (`lucide.createIcons()`) throws `ReferenceError: lucide is not defined`, crashing router view rendering completely. |
| E9 | Search Input Debounce | Rapid burst typing (20 keypresses at 15ms interval) | Debounce cancels intermediate timers properly; dispatches exactly 1 search at 400ms following final keypress (`test_challenger_m3_ui.test.mjs:789`). |
| E10 | Asynchronous Search Race | Fast query B resolves after slow query A | If response order is reversed, stale query results can overwrite newer query if query check `query === this.currentQuery` is omitted (`test_challenger_m3_ui.test.mjs:854`). |
| E11 | Ecuadorian Cédula Check | 13-digit natural RUC ending in `001` with valid 10-digit base | Correctly passes Module 10 validation; invalid RUCs (wrong suffix, corrupted check digit) are rejected (`test_challenger_m2_fuzz.test.mjs:28`). |
| E12 | Credit Card Luhn Check | Card number with valid Luhn ending in `0000` | Successfully triggers bank decline code `#DECLINED-SEC-054` without saving order (`test_validations.test.mjs:21`). Card ending in `0000` with INVALID Luhn is rejected for checksum failure prior to simulated decline code. |

---

## 7. Required Test Additions & Updates

To guarantee 100% automated regression and acceptance testing for the user requirements, the following test suite modifications are required:

1. **Fix Suite 1.5 in `tests/test_challenger_m3_ui.test.mjs`:**
   - Advance virtual clock or provide mock options to resolve `PokemonAPI.debounceSearch` promise deterministically so `node --test tests/*.test.mjs` executes to completion without hanging.
2. **Add 3D Drag Rotation Test Suite (`tests/test_pdp_3d_drag.test.mjs`):**
   - Test mouse drag interaction (`mousedown` → `mousemove` → `mouseup`) computing Euler angles (`rotateX`, `rotateY`).
   - Test touch drag interaction (`touchstart` → `touchmove` → `touchend`) with multi-touch / touch coordinates.
   - Assert card transform property updates smoothly with perspective (`perspective(1000px) rotateX(...) rotateY(...)`).
   - Assert front face is visible during [0°, 90°) and [270°, 360°], and reverse face is visible during [90°, 270°].
3. **Add Dynamic Condition Pricing Test Suite (`tests/test_condition_pricing.test.mjs`):**
   - Test that clicking `Raw`, `PSA 8`, `PSA 9`, and `PSA 10` immediately updates `Store.data.pdpSelectedCondition`.
   - Test that `#pdp-price` DOM text updates immediately to `$X.XX USD`.
   - Test adding to cart at each condition preserves that condition's exact price in `Store.data.cart`.
   - Test defensive fallback when `product.precios` is incomplete or missing.
4. **Add API Search Realistic Pricing & PDP Integration Test Suite (`tests/test_api_realistic_pricing.test.mjs`):**
   - Test price estimation function: assert that missing price fields receive realistic tiered prices based on rarity (Common, Uncommon, Rare, Holo, Secret Rare) and set vintage.
   - Assert that NO card has a static `$15.00` placeholder.
   - Test image URL resolution: ensure TCGdex images have valid `.webp` or `.png` extensions.
   - Test opening PDP for an API-discovered card: assert that `openProductPDP` handles external cards, loads them into `Store.data.currentPdpProduct`, and displays their realistic price in the store flow.
5. **Add Router & Console Integrity Test Suite (`tests/test_router_integrity.test.mjs`):**
   - Simulate navigating through all routes (`#home`, `#catalog`, `#pdp`, `#cart`, `#checkout`, `#confirmation`, `#profile`, `#tracking`, `#search-results`).
   - Assert zero uncaught exceptions, even when `lucide` is undefined.
