# Handoff Report — Explorer Survey Instance 1: Requirements R1 & R2

## 1. Observation
1. **Interactive 3D Card Viewer (`js/views/pdp.js`, lines 98–147):**
   - The scene container `#pdp-3d-scene` attaches only holographic sheen listeners:
     `onmousemove="PDPView.handleHoloMove(event)"`, `ontouchstart="PDPView.handleHoloMove(event)"`, `ontouchmove="PDPView.handleHoloMove(event)"`, `ontouchend="PDPView.handleHoloMove(event)"`.
   - In `js/views/pdp.js` lines 518–540, `handleHoloMove(e)` only computes:
     `scene.style.setProperty('--holo-x', `${xPct.toFixed(1)}%`);`
     `scene.style.setProperty('--holo-y', `${yPct.toFixed(1)}%`);`
     It never touches `#pdp-3d-object.style.transform`.
   - Card rotation is only triggered by buttons at lines 339–378 (`onclick="PDPView.setInspectorMode('back')"`), which sets `Store.data.pdpInspectorMode = 'back'` and invokes `app.renderCurrentView()`.
   - In `css/styles.css` lines 167–201:
     `.card-3d-scene` defines `perspective: 1000px`.
     `.card-3d-object` defines `transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);`.
     `.card-3d-face` defines `backface-visibility: hidden;`.
     `.card-3d-back` defines `transform: rotateY(180deg);`.
     `.card-3d-object.is-flipped-y` defines `transform: rotateY(180deg);`.
   - There are zero drag event handlers (`pointerdown`, `pointermove`, `pointerup`, `mousedown`, `mouseup`, etc.) and no rotation state variables.

2. **Dynamic Condition Pricing (`js/views/pdp.js`, lines 408–433, 547–553, 575–611):**
   - In `PDPView.render()` lines 408–433, condition buttons directly access `product.precios.raw`, `product.precios.psa8`, `product.precios.psa9`, `product.precios.psa10`.
   - In `PDPView.selectCondition(condKey)` (lines 547–553):
     ```javascript
     Store.data.pdpSelectedCondition = condKey;
     app.renderCurrentView();
     const product = Store.data.currentPdpProduct || PRODUCTS[0];
     const price = product.precios[condKey];
     app.showToast(`Grado seleccionado: ${condKey.toUpperCase()} ($${price.toLocaleString('en-US')})`, 'info');
     ```
   - For items in `PRODUCTS` (`js/data.js`), clicking updates `Store.data.pdpSelectedCondition` and re-renders `#app-view`.
   - For any product without a `precios` dictionary (e.g. from API search `PokemonAPI` in `js/services/pokemon-api.js`), accessing `product.precios.raw` throws `TypeError: Cannot read properties of undefined (reading 'raw')`.
   - In `PDPView.addToCart()` lines 592, if `product.precios` is missing, `price` defaults to hardcoded `1000`.

3. **Automated Test Suite Status:**
   - Command: `node --test tests/test_pdp.test.mjs tests/test_cart_toast.test.mjs tests/test_challenger_m1_r2.test.mjs tests/test_challenger_m2_fuzz.test.mjs tests/test_challenger_m2_lifecycle.test.mjs tests/test_e2e_suite.test.mjs tests/test_empirical_challenger.mjs tests/test_profile_orders.test.mjs tests/test_reviewer_m2_stress.mjs tests/test_search_failover.test.mjs tests/test_validations.test.mjs`
   - Result: 244 tests pass with 0 failures across all 11 suites.

## 2. Logic Chain
1. **Observation 1 (No Drag Handlers, Only Holographic Sheen):**
   - The inline handlers on `#pdp-3d-scene` solely update `--holo-x` and `--holo-y`.
   - Neither mouse drag nor touch drag modifies the transform of `#pdp-3d-object`.
   - *Inference:* Drag-to-rotate in 3D perspective is completely non-existent in current runtime code.
2. **Observation 1 & CSS Structure (Preserve-3D & Backface Visibility):**
   - CSS already provides the 3D optical hierarchy: `perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`, and 180° back face rotation.
   - However, the `.card-3d-object` class specifies `transition: transform 0.7s`.
   - *Inference:* Drag interaction can be readily built on top of this CSS foundation by managing `rotateX(deg)` and `rotateY(deg)` dynamically. During dragging, `transition` must be temporarily set to `none` to eliminate a 700ms lag.
3. **Observation 2 (Condition Pricing & Full Re-render):**
   - Clicking a condition button executes `app.renderCurrentView()`, replacing the entire `#app-view.innerHTML`.
   - *Inference:* This is destructive to interactive 3D rotation, as any pointer/Euler rotation state in the DOM is wiped on condition selection.
4. **Observation 2 (API Cards Lack `precios` Object):**
   - Normalized card objects from `PokemonAPI` only feature `precioEstimado: number`.
   - `PDPView.render()` lines 410–413 expect `product.precios.raw`, `.psa8`, `.psa9`, `.psa10`.
   - *Inference:* Directly opening an API search card in PDP crashes JavaScript execution before the price can ever be displayed or updated.

## 3. Caveats
- **Live Network Dependency:** `tests/test_challenger_m3_ui.test.mjs` contains a test (Suite 1.5) that executes live external network fetch against `https://api.pokemontcg.io/v2/cards` without a timeout mock, which may pause depending on external network conditions.
- **Slab Mode Scope:** The acrylic slab inspection mode (`mode === 'slab'`) is structurally distinct from the card 3D scene (`mode === 'front' | 'back'`). Free 3D card rotation applies primarily to the raw card stage (`#pdp-3d-scene`), though gentle 3D tilt can also enhance the slab.
- **No Source Code Changes Applied:** In accordance with the Explorer role instructions, this investigation is strictly read-only.

## 4. Conclusion
1. **Requirement R1 (Interactive 3D Card Viewer):**
   - **Root Cause:** Interactive pointer drag rotation was never implemented; only button flips and holographic gradient coordinates are hooked up.
   - **Remedy:** Implement pointer/mouse/touch drag controller in `PDPView.afterRender()` that computes continuous `rotateY` (0–360°) and clamped `rotateX` (-40° to +40°) with `transition: none` during drag and smooth transition on release, while keeping `--holo-x`/`--holo-y` sheen tracking and button state synchronization.
2. **Requirement R2 (Dynamic Condition Pricing):**
   - **Root Cause:** Condition updates rely on a destructive full-view re-render (`app.renderCurrentView()`), and `PDPView.render()` fatally crashes on any product lacking the static `precios` dictionary.
   - **Remedy:** Add defensive price normalization generating realistic grade prices from base price when `precios` is missing, and implement non-destructive DOM updates for `#pdp-price`, active button styling, badge labels, and trend chart.

## 5. Verification Method
1. **Inspect Code Locations:**
   - 3D Viewer & Sheen: `js/views/pdp.js:98-147`, `js/views/pdp.js:518-540`
   - CSS 3D Rules: `css/styles.css:167-201`
   - Condition Pricing & Buttons: `js/views/pdp.js:408-433`, `js/views/pdp.js:547-553`
   - Cart Pricing Integration: `js/views/pdp.js:575-611`, `js/app.js:209-232`
2. **Automated Regression Suite:**
   Run the full core test suite using Node.js:
   ```bash
   node --test tests/test_pdp.test.mjs tests/test_cart_toast.test.mjs tests/test_challenger_m1_r2.test.mjs tests/test_challenger_m2_fuzz.test.mjs tests/test_challenger_m2_lifecycle.test.mjs tests/test_e2e_suite.test.mjs tests/test_empirical_challenger.mjs tests/test_profile_orders.test.mjs tests/test_reviewer_m2_stress.mjs tests/test_search_failover.test.mjs tests/test_validations.test.mjs
   ```
   *Expected Output:* 244 tests passing, 0 failures.
3. **Invalidation Conditions:**
   - If mouse/touch drag rotates the card without updating `--holo-x` and `--holo-y`, test suites in `tests/test_pdp.test.mjs` and `tests/test_challenger_m1_r2.test.mjs` will fail.
   - If sealed products display PSA grading or 3D flip controls, `tests/test_empirical_challenger.mjs` will fail.
