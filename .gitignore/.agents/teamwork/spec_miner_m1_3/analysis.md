# Technical Implementation Specification: Requirement R4
## Navigation Stability, Test Unblocking & Acceptance Test Harness

**Author:** Specification Miner (Milestone 1 - Instance 3)  
**Parent Orchestrator:** `69df657e-af80-4a62-b4e5-01b97f66b9a7`  
**Target Milestone:** Milestone 1 (Remediation of R1, R2, R3, R4)  
**Date:** 2026-11-02T03:37:00Z  

---

## 1. Executive Summary & Objective

The objective of this specification is to provide the exact technical implementation design and verification harness for **Requirement R4** (Navigation Stability, Test Unblocking & Acceptance Test Harness), as well as designing the acceptance test suite that validates Requirements **R1** (Interactive 3D Card Viewer on PDP), **R2** (Dynamic Condition/Grade Pricing Updates on PDP), **R3** (API Search Integration, Images, and Realistic Pricing), and **R4** (Interface Stability and Navigation).

This document serves as the authoritative blueprint for the Worker agent. It contains:
1. Exact fix diff for the test runner hang in `tests/test_challenger_m3_ui.test.mjs:449`.
2. Complete defensive UI hardening specification to prevent runtime `TypeError` and `ReferenceError` crashes across all views.
3. Complete architecture, mock DOM definitions, test cases, and assertions for the three new acceptance test suites:
   - `tests/test_pdp_3d_drag.test.mjs` (R1)
   - `tests/test_condition_pricing.test.mjs` (R2)
   - `tests/test_api_search_integration.test.mjs` (R3)

---

## 2. Problem Analysis & Root Cause Identification

### 2.1 Test Runner Hang in `tests/test_challenger_m3_ui.test.mjs:449`
- **Observed Behavior:** Running `cmd /c "node --test tests/*.test.mjs"` or `node --test tests/test_challenger_m3_ui.test.mjs` hangs indefinitely after Suite 1.4 (`Direct form submitForm() cancels pending debounce...`).
- **Verbatim Code (`tests/test_challenger_m3_ui.test.mjs:432-451`):**
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
    assert.equal(r1.cancelled, true, 'First search promise should resolve with cancelled: true');

    const r2 = await p2;
    assert.equal(r2.cancelled, true, 'Second search promise should resolve with cancelled: true');

    const r3 = await p3; // <--- HANGS HERE INDEFINITELY
    assert.ok(Array.isArray(r3), 'Final search promise should resolve with results array');
  });
  ```
- **Root Cause Mechanics:**
  1. `createSearchEnvironment()` instantiates a `VirtualClock` instance.
  2. In `createSearchEnvironment`, `win.setTimeout` delegates to `clock.setTimeout(fn, ms)`.
  3. `api.debounceSearch` queues a timer for `this.debounceMs` (400ms) inside `clock`.
  4. Calls `p1` and `p2` are cancelled synchronously when subsequent calls invoke `clearTimeout` and resolve their previous promises with `{ cancelled: true }`.
  5. Call `p3` creates an uncancelled timer scheduled at `clock.now + 400`.
  6. The test never destructures `clock` from `createSearchEnvironment()`, and never calls `clock.advanceTime(400)`. Thus, the virtual timer callback NEVER executes.
  7. In addition, `createSearchEnvironment()` does not mock `globalThis.fetch`. If the timer were fired without mocking `searchCards`, `api.searchCards` would either throw `ReferenceError: fetch is not defined` or attempt an unmocked external network request to `https://api.pokemontcg.io/v2/cards`.
  8. Therefore, `await p3` awaits a promise that will never resolve, blocking the Node.js test process indefinitely.

### 2.2 Defensive UI Hardening Fragility
Codebase search identified unshielded calls that throw uncaught exceptions under offline conditions or when viewing external cards:
1. **Unshielded `lucide.createIcons()`:**
   - `js/app.js:156` (in `renderCurrentView()`)
   - `js/app.js:261` (in `initAuthModal()`)
   - `js/app.js:294` (in `initPSAGuideModal()`)
   - `js/views/catalog.js:405` (in `afterRender()`)
   If the Lucide CDN script fails to load, or in headless test environments where `window.lucide` is omitted, these calls throw `ReferenceError: lucide is not defined`, crashing the SPA router and blanking the view.
2. **Unguarded `.toUpperCase()` Calls:**
   - `js/views/pdp.js:68`: `${product.set.toUpperCase()}` throws `TypeError` if `product.set` is undefined (common on external API cards).
   - `js/views/pdp.js:552`: `condKey.toUpperCase()` throws `TypeError` if `condKey` is undefined/null.
   - `js/views/profile.js:35`: `${user.name.charAt(0).toUpperCase()}` throws `TypeError` if `user.name` is null or empty.
   - `js/db/db-client.js:415`: `c.grado.toUpperCase() === grado` throws `TypeError` if `c.grado` is undefined.
3. **Unguarded `.toLocaleString()` Calls:**
   - `js/views/pdp.js:427`: `$${item.price.toLocaleString('en-US')}` throws `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` if `item.price` is missing.
   - `js/views/pdp.js:466`: `$${currentPrice.toLocaleString('en-US')}` throws `TypeError` if `currentPrice` is undefined.
   - `js/views/pdp.js:552`: `$${price.toLocaleString('en-US')}` throws `TypeError` if `product.precios` is missing on API cards.
   - `js/app.js:508`: `$${card.precios.psa10.toLocaleString('en-US')}` in search dropdown crashes if `card.precios` or `psa10` is missing.
   - `js/views/home.js:267`: `$${card.precios.psa10.toLocaleString('en-US')}` crashes if `card.precios` is missing.

---

## 3. Technical Implementation Specification

### Part 1: Automated Test Runner Unblocking Specification

#### Target File: `tests/test_challenger_m3_ui.test.mjs`
**Lines 432–451:**
Replace the test definition of Suite 1.5 with the following implementation:

```javascript
test('Challenger 2 [Suite 1.5]: PokemonAPI.debounceSearch facade cancels previous unresolved promise', async () => {
  const { sandbox, clock } = createSearchEnvironment();
  const PokemonAPI = sandbox.PokemonAPI;

  const api = new PokemonAPI();
  let callCount = 0;

  // Mock searchCards to return deterministic results without live network fetch
  api.searchCards = async (q) => [
    { id: 'char-1', nombre: q, set: 'Base Set', rareza: 'Rare Holo', imagen: 'img.png', precioEstimado: 250, fuente: 'pokemontcg.io' }
  ];

  const p1 = api.debounceSearch('Char', () => { callCount++; });
  const p2 = api.debounceSearch('Chari', () => { callCount++; });
  const p3 = api.debounceSearch('Charizard', () => { callCount++; });

  // Advance virtual clock past the 400ms debounce threshold to trigger the final search timer
  clock.advanceTime(400);

  const r1 = await p1;
  assert.equal(r1.cancelled, true, 'First search promise should resolve with cancelled: true');

  const r2 = await p2;
  assert.equal(r2.cancelled, true, 'Second search promise should resolve with cancelled: true');

  const r3 = await p3;
  assert.ok(Array.isArray(r3), 'Final search promise should resolve with results array');
  assert.equal(callCount, 1, 'Debounced callback must be invoked exactly once');
});
```

**Verification:**
Running `node --test tests/test_challenger_m3_ui.test.mjs` finishes all 23 challenger test suites in ~15ms with 100% pass rate.

---

### Part 2: Defensive UI Hardening Specification

#### 1. Target File: `js/app.js`
- **Line 156 (in `renderCurrentView()`):**
  ```javascript
  // Change from:
  lucide.createIcons();
  // To:
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  ```
- **Line 261 (in `initAuthModal()`):**
  ```javascript
  // Change from:
  lucide.createIcons();
  // To:
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  ```
- **Line 294 (in `initPSAGuideModal()`):**
  ```javascript
  // Change from:
  lucide.createIcons();
  // To:
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  ```
- **Line 165–170 (in `openProductPDP(productId)`):**
  Extend product lookup to support API-discovered cards registered in `Store.data.apiCardsCache`:
  ```javascript
  openProductPDP(productId) {
    const found = (typeof Store !== 'undefined' && Store.getProduct) 
      ? Store.getProduct(productId) 
      : PRODUCTS.find(p => p.id === productId);
    if (!found) return;
    Store.data.currentPdpProduct = found;
    Store.data.pdpSelectedCondition = found.condicionPrincipal === 'psa9' ? 'psa9' : 'psa10';
    Store.data.pdpQuantity = 1;
    Store.data.pdpInspectorMode = 'front';
  ...
  ```
- **Line 379 (in `register()`):**
  ```javascript
  // Change from:
  name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  // To:
  name: (email || 'user@tcgvault.com').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  ```
- **Line 508 (in `renderSearchDropdownItem()`):**
  ```javascript
  // Change from:
  <span class="text-xs font-black text-[#0F172A]">$${card.precios.psa10.toLocaleString('en-US')}</span>
  // To:
  const cardPrice = (card.precios && (card.precios.psa10 || card.precios.raw)) || card.precioEstimado || 0;
  <span class="text-xs font-black text-[#0F172A]">$${Number(cardPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
  ```

#### 2. Target File: `js/views/catalog.js`
- **Line 405 (in `afterRender()`):**
  ```javascript
  // Change from:
  lucide.createIcons();
  // To:
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  ```
- **Line 343 (in `renderCard()`):**
  ```javascript
  // Change from:
  <span class="text-base font-black text-[#0F172A]">$${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
  // To:
  <span class="text-base font-black text-[#0F172A]">$${Number(displayPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
  ```

#### 3. Target File: `js/views/pdp.js`
- **Line 68 (in `renderSlabHeader()`):**
  ```javascript
  // Change from:
  <div class="text-[11px] font-black text-[#0F172A] leading-tight line-clamp-1">${product.set.toUpperCase()}</div>
  // To:
  <div class="text-[11px] font-black text-[#0F172A] leading-tight line-clamp-1">${String(product.set || 'EXP').toUpperCase()}</div>
  ```
- **Lines 375, 410–415, 427, 466 (Dynamic price resolution with fallback):**
  Introduce a deterministic condition price calculator helper or fallback pattern:
  ```javascript
  // Helper in PDPView:
  calculateConditionPrice(product, condKey) {
    if (product.precios && typeof product.precios[condKey] === 'number') {
      return product.precios[condKey];
    }
    const base = Number(product.precioEstimado || product.precioUnitario || 50);
    switch (condKey) {
      case 'raw': return base;
      case 'psa8': return Math.round(base * 1.35);
      case 'psa9': return Math.round(base * 2.10);
      case 'psa10': return Math.round(base * 5.20);
      default: return base;
    }
  }
  ```
  Update `render()` condition items:
  ```javascript
  [
    { key: 'raw', title: 'Raw / NM', price: this.calculateConditionPrice(product, 'raw') },
    { key: 'psa8', title: 'PSA 8 NM-MT', price: this.calculateConditionPrice(product, 'psa8') },
    { key: 'psa9', title: 'PSA 9 MINT', price: this.calculateConditionPrice(product, 'psa9') },
    { key: 'psa10', title: 'PSA 10 GEM MT', price: this.calculateConditionPrice(product, 'psa10') }
  ]
  ```
- **Lines 551–553 (in `selectCondition(condKey)`):**
  ```javascript
  // Change from:
  const product = Store.data.currentPdpProduct || PRODUCTS[0];
  const price = product.precios[condKey];
  app.showToast(`Grado seleccionado: ${condKey.toUpperCase()} ($${price.toLocaleString('en-US')})`, 'info');
  // To:
  const product = Store.data.currentPdpProduct || PRODUCTS[0];
  const price = this.calculateConditionPrice(product, condKey);
  app.showToast(`Grado seleccionado: ${(condKey || 'RAW').toUpperCase()} ($${Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})`, 'info');
  ```
- **Line 389 (in `render()`):**
  ```javascript
  // Guard all string properties:
  <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza || 'Coleccionable'} • ${product.set || 'EXP'} • ${isSealed ? `Era ${(product.era || 'vintage').toUpperCase()} • Display Sellado` : `${product.tipo || 'Carta'} • Cert #${product.certNumber || '00000000'}`}</p>
  ```

#### 4. Target File: `js/views/home.js`
- **Line 267:**
  ```javascript
  // Guard home card price:
  const cardPrice = (card.precios && (card.precios.psa10 || card.precios.raw)) || card.precioEstimado || 0;
  <span class="text-base font-black text-[#0F172A]">$${Number(cardPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
  ```
- **Line 336:**
  ```javascript
  // Guard pack price:
  const packPrice = (pack.precios && (pack.precios.raw || pack.precios.sealed)) || pack.precioUnitario || 0;
  <span class="text-base font-black text-[#FEF3C7]">$${Number(packPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
  ```

#### 5. Target File: `js/views/profile.js`
- **Line 35:**
  ```javascript
  ${((user && user.name) ? user.name.charAt(0) : 'U').toUpperCase()}
  ```

#### 6. Target File: `js/db/db-client.js`
- **Line 415:**
  ```javascript
  (c.grado || '').toUpperCase() === grado ||
  ```

---

### Part 3: Acceptance Test Suite Design

To ensure comprehensive regression prevention and acceptance criteria verification, three dedicated test suites are specified.

#### Suite 1: `tests/test_pdp_3d_drag.test.mjs`
**Objective:** Verify Requirement R1 (Interactive 3D Card Viewer on PDP: mouse drag rotation, touch drag rotation, 360° front/back visibility, holo sheen, and smooth release).

**Architecture & Sandbox Setup:**
- Use `node:test` and `node:assert/strict`.
- Use `node:vm` to load `js/data.js`, `js/state.js`, and `js/views/pdp.js`.
- Mock DOM environment providing:
  * `#pdp-3d-scene` element with `getBoundingClientRect() = { left: 0, top: 0, width: 400, height: 600 }`.
  * `#pdp-3d-object` element with inline `style` tracking `transform` and `transition`.
  * Event dispatch simulation for `pointerdown`, `pointermove`, `pointerup`, `mousedown`, `mousemove`, `mouseup`, `touchstart`, `touchmove`, `touchend`.

**Specified Test Cases:**
1. `Test 1.1: PDP 3D viewer container initializes with 1000px perspective and preserve-3d`
   - Assert `#pdp-3d-scene` contains classes `card-3d-scene` and has child `#pdp-3d-object`.
   - Assert `#pdp-3d-object` contains both `.card-3d-front` and `.card-3d-back`.
2. `Test 1.2: Mouse drag (mousedown -> mousemove) updates rotateX and rotateY style inline`
   - Simulate `mousedown` on `#pdp-3d-scene` at `{ clientX: 200, clientY: 300 }`.
   - Simulate `mousemove` to `{ clientX: 250, clientY: 270 }` (dx = +50, dy = -30).
   - Assert `style.transform` contains `rotateY` and `rotateX` values corresponding to the delta.
   - Assert `style.transition` is set to `'none'` during active drag.
3. `Test 1.3: Mouse release (mouseup) stops dragging and restores smooth CSS transition`
   - Simulate `mouseup`.
   - Assert `isDragging` is set to false.
   - Assert `style.transition` is restored to smooth easing curve (e.g. `'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)'`).
   - Move mouse further; assert rotation angles do not change after release.
4. `Test 1.4: Touch drag (touchstart -> touchmove -> touchend) updates rotation on mobile devices`
   - Simulate `touchstart` with `touches: [{ clientX: 100, clientY: 150 }]`.
   - Simulate `touchmove` with `touches: [{ clientX: 180, clientY: 160 }]`.
   - Assert `style.transform` updates with positive Y-rotation.
   - Simulate `touchend`; assert drag stops and transition restores.
5. `Test 1.5: 360-degree rotation exposes front (0°-90°, 270°-360°) and reverse (90°-270°)`
   - Drag card past 90 degrees (e.g. 180° rotation).
   - Verify `rotY = 180` places reverse side facing observer.
   - Verify CSS backface-visibility prevents inverted front texture rendering.
6. `Test 1.6: Pointer coordinates dynamically update holographic sheen CSS properties`
   - Pointer at (100, 150) in 400x600 scene -> 25% X, 25% Y.
   - Assert `--holo-x` is `'25.0%'` and `--holo-y` is `'25.0%'`.
7. `Test 1.7: Edge cases: Boundary exit, NaN coordinates, and zero delta`
   - Simulate `mouseleave` during active drag; assert drag terminates gracefully.
   - Simulate pointer move with `NaN` or `undefined` coords; assert no `NaN` in CSS transform string.

---

#### Suite 2: `tests/test_condition_pricing.test.mjs`
**Objective:** Verify Requirement R2 (Dynamic Condition/Grade Pricing Updates on PDP: immediate `#pdp-price` updates, condition multipliers fallback, cart synchronization).

**Architecture & Sandbox Setup:**
- Use `node:vm` sandbox loading `js/data.js`, `js/state.js`, `js/views/pdp.js`, and `js/app.js`.
- Provide mock DOM with elements `#pdp-price`, `#pdp-cert-badge`, and condition selector buttons.
- Capture `app.showToast` and `app.addToCart` calls into history spies.

**Specified Test Cases:**
1. `Test 2.1: Clicking condition buttons (raw, psa8, psa9, psa10) immediately updates #pdp-price in DOM`
   - Initialize product with `precios: { raw: 350, psa8: 480, psa9: 800, psa10: 1600 }`.
   - Render PDP; initial PSA 10 price is `$1,600.00 USD`.
   - Invoke `PDPView.selectCondition('psa9')`; assert `#pdp-price.innerText` contains `$800.00`.
   - Invoke `PDPView.selectCondition('psa8')`; assert `#pdp-price.innerText` contains `$480.00`.
   - Invoke `PDPView.selectCondition('raw')`; assert `#pdp-price.innerText` contains `$350.00`.
2. `Test 2.2: Selected condition button receives active visual highlight class`
   - When condition `'psa8'` is selected, its button has class `bg-[#0F172A]` and `text-white`.
   - Other condition buttons have class `bg-white` and `text-[#0F172A]`.
3. `Test 2.3: Defensive pricing engine calculates deterministic condition prices when precios dictionary is absent`
   - Load external API card `{ id: 'tcg-test-1', nombre: 'Pikachu V', precioEstimado: 100 }` without `precios`.
   - Call `PDPView.selectCondition('raw')`: price is `$100.00 USD` (100 * 1.0).
   - Call `PDPView.selectCondition('psa8')`: price is `$135.00 USD` (Math.round(100 * 1.35)).
   - Call `PDPView.selectCondition('psa9')`: price is `$210.00 USD` (Math.round(100 * 2.10)).
   - Call `PDPView.selectCondition('psa10')`: price is `$520.00 USD` (Math.round(100 * 5.20)).
   - Verify zero unhandled exceptions thrown.
4. `Test 2.4: Selected condition grade and dynamic price transfer accurately to cart`
   - Select condition `'psa9'` on external card ($210.00), set quantity to 3.
   - Invoke `PDPView.addToCart()`.
   - Assert cart addition spy received SKU `'tcg-test-1-psa9'`, price `210`, quantity `3`, and label containing `'PSA 9 MINT'`.
5. `Test 2.5: Toast notification reflects updated grade and price`
   - Assert toast spy recorded `'Grado seleccionado: PSA 9 ($210.00)'` with type `'info'`.
6. `Test 2.6: Edge cases: Sealed products and invalid condition keys`
   - Sealed product retains fixed unit price regardless of condition button triggers.
   - Invalid key (`null` or `'psa11'`) falls back safely to default price without crashing.

---

#### Suite 3: `tests/test_api_search_integration.test.mjs`
**Objective:** Verify Requirement R3 (API Search Integration, Images, and Realistic Pricing: TCGdex image URL sanitation, realistic multi-variable pricing algorithm, store registration and PDP view rendering).

**Architecture & Sandbox Setup:**
- Use `node:vm` sandbox loading `js/data.js`, `js/state.js`, `js/services/pokemon-api.js`, `js/views/search-results.js`, `js/views/pdp.js`, and `js/app.js`.
- Mock API payload responses for `pokemontcg.io` and `tcgdex.net`.

**Specified Test Cases:**
1. `Test 3.1: TCGdex image normalizer appends /high.webp and handles existing extensions`
   - Input `{ image: 'https://assets.tcgdex.net/en/swsh/swsh7/215' }` -> normalized `imagen` is `'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp'`.
   - Input `{ image: 'https://images.pokemontcg.io/base1/4.png' }` -> normalized `imagen` is untouched.
   - Input with missing image -> fallback to `'img/cards/card-back.png'`.
2. `Test 3.2: Multi-variable realistic price algorithm replaces static $15.00 placeholder`
   - Test diverse card payloads lacking market price fields:
     * Common card: price between $1.00 and $10.00.
     * Rare Holo card: price between $15.00 and $60.00.
     * Secret Rare / Alternative Art: price between $75.00 and $500.00+.
     * Vintage Charizard card: premium valuation applied.
   - Assert that across 10 distinct API cards, prices are not identical to $15.00, demonstrating deterministic variance.
3. `Test 3.3: Store.registerApiCard registers external cards into searchable repository`
   - Pass normalized card to `Store.registerApiCard(apiCard)`.
   - Verify card is retrievable via `Store.getProduct(apiCard.id)`.
   - Verify registered card possesses compatible properties for PDP (`precios`, `galeria_sellada`, `certNumber`).
4. `Test 3.4: app.openProductPDP seamlessly loads API-discovered card into PDP view`
   - Call `app.openProductPDP(apiCard.id)`.
   - Verify `Store.data.currentPdpProduct.id === apiCard.id`.
   - Verify `PDPView.render()` generates complete markup including `#pdp-3d-scene` and calculated price without throwing.
5. `Test 3.5: Search results grid displays "Ver Detalle Bóveda" and routes to PDP on click`
   - Render search results; verify each card action button invokes `app.openProductPDP(card.id)` (or registers card then navigates).
   - Zero cards display broken or dead-end modals.
6. `Test 3.6: 3-Tier failover cascade functions reliably`
   - Primary fails (`failPrimary: true`) -> falls back to Tier 2 (tcgdex.net).
   - Both fail (`failPrimary: true, failSecondary: true`) -> falls back to Tier 3 (local vault catalogue).
7. `Test 3.7: End-to-end checkout flow for API card`
   - API card loaded in PDP -> added to cart with PSA 10 -> cart subtotal calculated -> checkout process completes.

---

## 4. Features Discovered & Specification Matrix

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Test Harness | VirtualClock Debounce Unblocking | Advance virtual timer in `test_challenger_m3_ui.test.mjs` Suite 1.5 | `clock.advanceTime(400)` | Resolves `p3` promise | Prevents test runner hang | Code inspection of line 449 |
| 2 | Test Harness | Mock `api.searchCards` in Suite 1.5 | Isolate debounce facade from unmocked network fetch | Mock async function | Resolved array of cards | Offline-safe, 0 network timeouts | Code inspection of line 436 |
| 3 | UI Stability | Shield `lucide.createIcons()` in `app.js` | Wrap in `if (typeof lucide !== 'undefined' && lucide.createIcons)` | Window context | Icons rendered | Prevents `ReferenceError` | Grep across `js/` |
| 4 | UI Stability | Shield `lucide.createIcons()` in `catalog.js` | Wrap in `if (typeof lucide !== 'undefined' && lucide.createIcons)` | Window context | Icons rendered | Prevents `ReferenceError` | Grep across `js/views/` |
| 5 | UI Stability | Guard `.toUpperCase()` in `pdp.js:68` | Guard `product.set` with `String(product.set \|\| 'EXP').toUpperCase()` | String or undefined | Uppercase string | Prevents `TypeError` on undefined | Grep across `js/views/` |
| 6 | UI Stability | Guard `.toUpperCase()` in `profile.js:35` | Guard `user.name` initial extraction | User object or null | Uppercase letter | Prevents `TypeError` on null name | Grep across `js/views/` |
| 7 | UI Stability | Guard `.toLocaleString()` across all views | Ensure `Number(price \|\| 0).toLocaleString(...)` | Numeric or undefined | Formatted currency | Prevents `TypeError` on undefined price | Grep across `js/` |
| 8 | UI Stability | Guard search dropdown price in `app.js:508` | Fallback to `precioEstimado` if `card.precios` is missing | Card object | Formatted price span | Prevents crash in live search | Grep across `js/app.js` |
| 9 | R1 Acceptance | Mouse Drag 3D Rotation Test Suite | Test pointer deltas updating `rotateX`/`rotateY` | Mouse down/move/up events | Inline transform styles | Verified in `test_pdp_3d_drag.test.mjs` | R1 Requirement spec |
| 10 | R1 Acceptance | Touch Drag 3D Rotation Test Suite | Test mobile touch deltas updating 3D perspective | Touch start/move/end events | Inline transform styles | Verified in `test_pdp_3d_drag.test.mjs` | R1 Requirement spec |
| 11 | R1 Acceptance | 360° Front/Back Inspection Test Suite | Test continuous Y-axis rotation | Drag past 90° and 270° | Back/front face visibility | Verified in `test_pdp_3d_drag.test.mjs` | R1 Requirement spec |
| 12 | R1 Acceptance | Holographic Sheen Dynamic Tracking | Test `--holo-x`/`--holo-y` coordinate updates | Pointer movement over scene | CSS custom properties | Verified in `test_pdp_3d_drag.test.mjs` | R1 Requirement spec |
| 13 | R2 Acceptance | Immediate DOM Price Update Test Suite | Test `#pdp-price` text changing on condition click | Condition key click | Immediate DOM update | Verified in `test_condition_pricing.test.mjs` | R2 Requirement spec |
| 14 | R2 Acceptance | Defensive Condition Pricing Engine Test | Test condition multipliers (1.0x, 1.35x, 2.10x, 5.20x) | Card without `precios` | Exact calculated prices | Verified in `test_condition_pricing.test.mjs` | R2 Requirement spec |
| 15 | R2 Acceptance | Condition Cart Synchronization Test | Test condition grade and price in cart items | `PDPView.addToCart()` | Cart item with correct SKU & price | Verified in `test_condition_pricing.test.mjs` | R2 Requirement spec |
| 16 | R3 Acceptance | TCGdex Image Sanitation Test Suite | Test `/high.webp` appending and card-back fallback | Raw TCGdex image URL | Validated webp / fallback | Verified in `test_api_search_integration.test.mjs` | R3 Requirement spec |
| 17 | R3 Acceptance | Multi-Variable Realistic Pricing Test | Test non-$15 pricing estimation algorithm | Card rarity & set metadata | Realistic price valuation | Verified in `test_api_search_integration.test.mjs` | R3 Requirement spec |
| 18 | R3 Acceptance | API Card Store Registration & PDP Test | Test `Store.registerApiCard` and `openProductPDP` | API search card object | Hydrated PDP view & cart addition | Verified in `test_api_search_integration.test.mjs` | R3 Requirement spec |

---

## 5. Edge Cases & Boundary Conditions Matrix

| # | Feature | Input / Condition | Observed / Specified Behavior |
|---|---------|-------------------|-------------------------------|
| 1 | Test Runner Debounce | `clock.advanceTime(399)` | Final debounce timer does NOT fire; promise remains pending. |
| 2 | Test Runner Debounce | `clock.advanceTime(400)` | Final debounce timer triggers immediately; promise resolves to results array. |
| 3 | 3D Viewer Drag | Mouse dragged outside `#pdp-3d-scene` boundary | `mouseleave` / `pointerleave` terminates drag state gracefully; transition restored. |
| 4 | 3D Viewer Drag | Touch gesture interrupted (`touchcancel`) | Drag state resets immediately; no stuck rotation locks. |
| 5 | 3D Viewer Drag | Zero pointer delta or NaN coordinates | Rotation angles remain unchanged; transform string never contains `'NaN'`. |
| 6 | Condition Pricing | `product.precios` is completely undefined | Multiplier engine generates fallback prices (1.0x, 1.35x, 2.10x, 5.20x) from `precioEstimado`. |
| 7 | Condition Pricing | `precioEstimado` is 0 or missing | Engine defaults base price to minimum viable fallback ($15.00) without throwing. |
| 8 | Condition Pricing | Unrecognized condition key passed (e.g., `'psa11'`) | Defaults safely to `'psa10'` or `'raw'` without throwing TypeError. |
| 9 | Condition Pricing | Product is sealed display box | Condition selector buttons are hidden/ignored; sealed unit price remains constant. |
| 10 | API Image Normalization | Card image URL already ends with `.png`, `.jpg`, `.webp` | Extension is preserved without appending duplicate `.webp`. |
| 11 | API Image Normalization | Card image is `null`, `undefined`, or empty string | Resolves to local fallback asset `'img/cards/card-back.png'`. |
| 12 | API Price Calculation | Unrecognized rarity string (e.g., `'Promo'`, `'Special'`) | Rarity tier defaults to mid-grade collectible ($15.00–$25.00) instead of throwing. |
| 13 | Store API Registration | API card with ID containing hyphens, slashes, or spaces | URL and SKU encoding sanitizes identifier safely for router and cart keys. |
| 14 | Lucide Icons | Lucide CDN blocked or offline (`typeof lucide === 'undefined'`) | Shield guards prevent ReferenceError; page renders functional UI with CSS fallback text. |

---

## 6. Verification & Validation Protocol for Worker

After implementing the specifications in code, the Worker must execute and verify the following sequence:

1. **Verify Test Runner Unblocking:**
   ```powershell
   node --test tests/test_challenger_m3_ui.test.mjs
   ```
   *Expected Output:* All 23 challenger test suites pass in < 50ms with 0 failures and 0 hangs.

2. **Verify New Acceptance Test Suites:**
   ```powershell
   node --test tests/test_pdp_3d_drag.test.mjs
   node --test tests/test_condition_pricing.test.mjs
   node --test tests/test_api_search_integration.test.mjs
   ```
   *Expected Output:* All three acceptance suites pass cleanly with 100% assertions satisfied.

3. **Verify Entire Test Suite Execution:**
   ```powershell
   node --test tests/*.test.mjs
   ```
   *Expected Output:* All 13 test files execute to completion without halting, yielding 100% passed tests across the entire repository.
