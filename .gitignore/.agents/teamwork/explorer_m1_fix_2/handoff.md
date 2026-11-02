# Investigation & Remediation Report: Milestone 1 Edge-Case Defects (PDP & CSS 3D)

**Date**: 2026-11-01T23:45:00Z  
**Investigator**: Explorer 2 (`explorer_m1_fix_2`)  
**Mission**: Investigate defects in `js/views/pdp.js` and `css/styles.css` identified during review, formulate a concrete line-by-line remediation strategy for Worker, and specify test verification criteria.

---

## 1. Observation

### Observation 1.1: `product.era.toUpperCase()` throws `TypeError` on custom/sealed products without `era`
- **File**: `js/views/pdp.js`, Line 386
- **Verbatim Code**:
  ```javascript
  385: <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] mt-2 tracking-tight">${product.nombre}</h1>
  386: <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza} • ${product.set} • ${isSealed ? `Era ${product.era.toUpperCase()} • Display Sellado` : `${product.tipo} • Cert #${product.certNumber}`}</p>
  387: </div>
  ```
- **Finding**: When `isSealed` is true but `product.era` is `undefined` or `null` (e.g. dynamic API products, custom sealed boxes, or malformed items), evaluating `product.era.toUpperCase()` produces:
  `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
  This terminates execution during `PDPView.render()` and causes an unhandled view rendering failure.

---

### Observation 1.2: Holographic shimmer in `PDPView.handleHoloMove` lacks touch events and coordinate clamping
- **File**: `js/views/pdp.js`, Lines 100–103 & 515–523
- **Verbatim Code**:
  - Template binding (Lines 100–103):
    ```html
    100:       <div 
    101:         id="pdp-3d-scene" 
    102:         onmousemove="PDPView.handleHoloMove(event)"
    103:         class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4"
    104:       >
    ```
  - Method definition (Lines 515–523):
    ```javascript
    515:   handleHoloMove(e) {
    516:     const scene = document.getElementById('pdp-3d-scene');
    517:     if (!scene) return;
    518:     const rect = scene.getBoundingClientRect();
    519:     const x = ((e.clientX - rect.left) / rect.width) * 100;
    520:     const y = ((e.clientY - rect.top) / rect.height) * 100;
    521:     scene.style.setProperty('--holo-x', `${x.toFixed(1)}%`);
    522:     scene.style.setProperty('--holo-y', `${y.toFixed(1)}%`);
    523:   },
    ```
- **Finding**:
  1. HTML template only attaches `onmousemove`, omitting `ontouchmove`. Mobile and tablet touch users cannot interact with the holographic shimmer effect.
  2. `e.clientX` and `e.clientY` are `undefined` on `TouchEvent`. `((undefined - rect.left) / rect.width) * 100` calculates `NaN`, setting `--holo-x: NaN%` and `--holo-y: NaN%`. Touch coordinates are located in `e.touches[0]` (or `e.changedTouches[0]`).
  3. Calculated percentages `x` and `y` are unclamped. When touch or mouse gestures move slightly beyond the container rect boundary, values can be negative (<0%) or exceed 100%, causing the radial gradient highlight to drift outside the visual card bounds.
  4. There is no zero-dimension safeguard (`rect.width === 0 || rect.height === 0`) which could occur during initial DOM rendering or hidden tabs.

---

### Observation 1.3: `PDPView.updateQuantity(delta)` fails to clamp on large decrements and is vulnerable to NaN state corruption
- **File**: `js/views/pdp.js`, Lines 538–546
- **Verbatim Code**:
  ```javascript
  538:   updateQuantity(delta) {
  539:     const next = (Store.data.pdpQuantity || 1) + delta;
  540:     if (next < 1 || next > 10) return;
  541:     Store.data.pdpQuantity = next;
  542:     if (typeof document !== 'undefined') {
  543:       const el = document.getElementById('pdp-quantity-value');
  544:       if (el) el.innerText = next;
  545:     }
  546:   },
  ```
- **Finding**:
  1. **Failure to clamp large deltas**: If `pdpQuantity` is `3` and `delta` is `-5`, `next = -2`. The guard `if (next < 1 || next > 10) return;` triggers an early exit. The quantity remains at `3` instead of gracefully clamping to the minimum valid quantity of `1`. Likewise, if quantity is `8` and `delta` is `+5`, `next = 13` triggers return without clamping to `10`.
  2. **NaN Bypass / State Corruption**: If `delta` is non-numeric (e.g. `undefined`, `null`, `'abc'`, `{}`), `next` evaluates to `NaN`. In JavaScript, both `NaN < 1` and `NaN > 10` evaluate to `false`! The guard does NOT catch it. Consequently, `Store.data.pdpQuantity` is set to `NaN` and `#pdp-quantity-value` displays `NaN` to the user.
  3. **String Concatenation Vulnerability**: If `delta` is passed as a string `'1'`, `1 + '1'` results in `'11'`.

---

### Observation 1.4: Missing `-webkit-` vendor prefixes in `css/styles.css`
- **File**: `css/styles.css`, Lines 167–195
- **Verbatim Code**:
  ```css
  167: .card-3d-scene {
  168:   perspective: 1000px;
  169: }
  170: 
  171: .card-3d-object {
  172:   width: 100%;
  173:   height: 100%;
  174:   position: relative;
  175:   transform-style: preserve-3d;
  176:   transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  177: }
  178: 
  179: .card-3d-object.is-flipped-y {
  180:   transform: rotateY(180deg);
  181: }
  182: 
  183: .card-3d-face {
  184:   position: absolute;
  185:   inset: 0;
  186:   backface-visibility: hidden;
  187:   -webkit-backface-visibility: hidden;
  188:   display: flex;
  189:   align-items: center;
  190:   justify-content: center;
  191: }
  192: 
  193: .card-3d-back {
  194:   transform: rotateY(180deg);
  195: }
  ```
- **Finding**:
  - `.card-3d-scene` has `perspective: 1000px;` but lacks `-webkit-perspective: 1000px;`.
  - `.card-3d-object` has `transform-style: preserve-3d;` but lacks `-webkit-transform-style: preserve-3d;`.
  - `.card-3d-object` has `transition: transform ...` but lacks `-webkit-transition: -webkit-transform ...`.
  - `.card-3d-object.is-flipped-y` has `transform: rotateY(180deg);` but lacks `-webkit-transform: rotateY(180deg);`.
  - `.card-3d-back` has `transform: rotateY(180deg);` but lacks `-webkit-transform: rotateY(180deg);`.
  - Note: `.card-3d-face` already has `-webkit-backface-visibility: hidden;` alongside `backface-visibility: hidden;`, confirming the pattern was intended but omitted from parent 3D containers.

---

## 2. Logic Chain

1. **Chain for Issue 1 (Era Fallback)**:
   - Line 386 executes `product.era.toUpperCase()`.
   - In JavaScript, accessing `.toUpperCase()` on `undefined` throws an immediate `TypeError`.
   - Adding a null-coalescing/fallback expression `(product.era || 'vintage').toUpperCase()` guarantees that if `product.era` is undefined, empty string, or null, it falls back to the canonical string `'vintage'`, producing `'VINTAGE'` without throwing an exception.

2. **Chain for Issue 2 (Holo Move Touch & Clamp)**:
   - Mobile browsers trigger touch events (`touchstart`, `touchmove`, `touchend`). Because `#pdp-3d-scene` only specifies `onmousemove`, touch events are completely ignored.
   - Adding `ontouchmove="PDPView.handleHoloMove(event)"` ensures touch gestures are received.
   - When a `TouchEvent` is passed to `handleHoloMove(e)`, `e.clientX` is `undefined`. Checking `(e.touches && e.touches[0]) ? e.touches[0] : ((e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e)` extracts valid screen coordinates.
   - Computing `Math.max(0, Math.min(100, rawX))` and `Math.max(0, Math.min(100, rawY))` clamps values strictly within the `[0%, 100%]` interval, preventing visual clipping or out-of-bounds shader offsets.

3. **Chain for Issue 3 (Quantity Sanitization & Clamping)**:
   - An arithmetic check `if (next < 1 || next > 10) return;` fails when `next` is `NaN` because comparison operators with `NaN` always return `false`.
   - Parsing `delta` with `parseInt(delta, 10)` and checking `isNaN(rawDelta)` eliminates invalid types (strings, objects, `undefined`).
   - Parsing `Store.data.pdpQuantity` with `parseInt(Store.data.pdpQuantity, 10) || 1` repairs any prior state corruption.
   - Using `Math.max(1, Math.min(10, current + rawDelta))` clamps any negative decrement (no matter how large) directly to `1`, and any positive increment directly to `10`, matching user expectations and preventing unresponsive buttons.

4. **Chain for Issue 4 (Vendor Prefixes)**:
   - WebKit rendering engines in iOS Safari, older macOS Safari, and embedded WebViews require `-webkit-perspective`, `-webkit-transform-style`, `-webkit-transition`, and `-webkit-transform`.
   - Without `-webkit-transform-style: preserve-3d`, WebKit treats the 3D scene as flat 2D, causing `rotateY(180deg)` to disappear or glitch rather than flipping the card in 3D space.
   - Adding paired `-webkit-` declarations before standard declarations restores full cross-browser compatibility.

---

## 3. Caveats

- **Caveat 1**: `js/data.js` currently defines `era: 'vintage'` for the built-in sealed booster box (`booster-team-rocket-box`). However, the PDP template handles arbitrary products from search failover or dynamic injection where `era` may not be populated.
- **Caveat 2**: On touch devices, dragging across `#pdp-3d-scene` may trigger default vertical page scrolling unless `{ passive: false }` and `e.preventDefault()` are applied, or CSS `touch-action: none` / `touch-action: pan-y` is set on the container. In inline handlers, `ontouchmove="PDPView.handleHoloMove(event)"` will update coordinates, but setting `touch-action: manipulation` or `touch-action: none` on `.card-3d-scene` prevents unintended gesture interference.
- **Caveat 3**: No other files in the project were found to access `.era` or `card-3d` definitions; the scope of remediation is strictly confined to `js/views/pdp.js` and `css/styles.css`.

---

## 4. Conclusion & Concrete Fix Strategy for Worker

The Worker should apply the following targeted modifications:

### Fix 1: Defensive Era Fallback in `js/views/pdp.js`
- **Target Line**: Line 386
- **Current**:
  ```javascript
  <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza} • ${product.set} • ${isSealed ? `Era ${product.era.toUpperCase()} • Display Sellado` : `${product.tipo} • Cert #${product.certNumber}`}</p>
  ```
- **Replacement**:
  ```javascript
  <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza} • ${product.set} • ${isSealed ? `Era ${(product.era || 'vintage').toUpperCase()} • Display Sellado` : `${product.tipo} • Cert #${product.certNumber}`}</p>
  ```

---

### Fix 2: Touch Support & Coordinate Clamping in `js/views/pdp.js`
- **Part A: HTML Template (Lines 100–103)**
  - **Current**:
    ```html
          <div 
            id="pdp-3d-scene" 
            onmousemove="PDPView.handleHoloMove(event)"
            class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4"
          >
    ```
  - **Replacement**:
    ```html
          <div 
            id="pdp-3d-scene" 
            onmousemove="PDPView.handleHoloMove(event)"
            ontouchmove="PDPView.handleHoloMove(event)"
            class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4"
          >
    ```

- **Part B: `handleHoloMove(e)` Method (Lines 515–523)**
  - **Current**:
    ```javascript
      handleHoloMove(e) {
        const scene = document.getElementById('pdp-3d-scene');
        if (!scene) return;
        const rect = scene.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        scene.style.setProperty('--holo-x', `${x.toFixed(1)}%`);
        scene.style.setProperty('--holo-y', `${y.toFixed(1)}%`);
      },
    ```
  - **Replacement**:
    ```javascript
      handleHoloMove(e) {
        if (!e) return;
        const scene = document.getElementById('pdp-3d-scene');
        if (!scene) return;
        const rect = scene.getBoundingClientRect();
        if (!rect || !rect.width || !rect.height) return;

        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        }

        if (typeof clientX !== 'number' || typeof clientY !== 'number' || isNaN(clientX) || isNaN(clientY)) {
          return;
        }

        const rawX = ((clientX - rect.left) / rect.width) * 100;
        const rawY = ((clientY - rect.top) / rect.height) * 100;

        const clampedX = Math.max(0, Math.min(100, rawX));
        const clampedY = Math.max(0, Math.min(100, rawY));

        scene.style.setProperty('--holo-x', `${clampedX.toFixed(1)}%`);
        scene.style.setProperty('--holo-y', `${clampedY.toFixed(1)}%`);
      },
    ```

---

### Fix 3: Sanitization & Strict Clamping in `PDPView.updateQuantity(delta)` in `js/views/pdp.js`
- **Target Lines**: Lines 538–546
- **Current**:
  ```javascript
    updateQuantity(delta) {
      const next = (Store.data.pdpQuantity || 1) + delta;
      if (next < 1 || next > 10) return;
      Store.data.pdpQuantity = next;
      if (typeof document !== 'undefined') {
        const el = document.getElementById('pdp-quantity-value');
        if (el) el.innerText = next;
      }
    },
  ```
- **Replacement**:
  ```javascript
    updateQuantity(delta) {
      const rawDelta = parseInt(delta, 10);
      if (isNaN(rawDelta)) return;

      const current = parseInt(Store.data.pdpQuantity, 10) || 1;
      const next = Math.max(1, Math.min(10, current + rawDelta));

      Store.data.pdpQuantity = next;
      if (typeof document !== 'undefined') {
        const el = document.getElementById('pdp-quantity-value');
        if (el) el.innerText = next;
      }
      return next;
    },
  ```

---

### Fix 4: Add `-webkit-` Vendor Prefixes in `css/styles.css`
- **Target Lines**: Lines 167–195
- **Current**:
  ```css
  .card-3d-scene {
    perspective: 1000px;
  }

  .card-3d-object {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-3d-object.is-flipped-y {
    transform: rotateY(180deg);
  }

  .card-3d-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-3d-back {
    transform: rotateY(180deg);
  }
  ```
- **Replacement**:
  ```css
  .card-3d-scene {
    -webkit-perspective: 1000px;
    perspective: 1000px;
  }

  .card-3d-object {
    width: 100%;
    height: 100%;
    position: relative;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    -webkit-transition: -webkit-transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .card-3d-object.is-flipped-y {
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
  }

  .card-3d-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-3d-back {
    -webkit-transform: rotateY(180deg);
    transform: rotateY(180deg);
  }
  ```

---

## 5. Verification Method

To independently verify these remediations:

1. **Automated Unit & Adversarial Test Suites**:
   Execute Node.js test suites across the workspace:
   ```powershell
   node --test tests/test_pdp.test.mjs
   node --test tests/test_empirical_challenger.mjs
   node --test tests/*.test.mjs
   ```

2. **Specific Adversarial Assertions to Validate**:
   - **Era Fallback**: Verify that calling `PDPView.render()` with a mock product `{ id: 'test-sealed', tipo_discriminador: 'PRODUCTO_SELLADO', categoria: 'sealed', set: 'Gym Heroes', rareza: 'Rare' }` (omitting `era`) does NOT throw `TypeError` and renders `'Era VINTAGE • Display Sellado'`.
   - **Holo Move Touch & Clamp**:
     - Call `PDPView.handleHoloMove({ touches: [{ clientX: -50, clientY: 500 }] })` on a mock scene `rect = { left: 0, top: 0, width: 200, height: 300 }`.
     - Verify `--holo-x` is clamped to `'0.0%'` (not negative) and `--holo-y` is clamped to `'100.0%'` (not >100%).
   - **Quantity Sanitization & Clamping**:
     - `Store.data.pdpQuantity = 3; PDPView.updateQuantity(-5);` -> Assert `Store.data.pdpQuantity === 1`.
     - `Store.data.pdpQuantity = 8; PDPView.updateQuantity(10);` -> Assert `Store.data.pdpQuantity === 10`.
     - `Store.data.pdpQuantity = 2; PDPView.updateQuantity('invalid_input');` -> Assert `Store.data.pdpQuantity === 2` (no NaN).
   - **CSS Vendor Prefixes**:
     - Read `css/styles.css` and assert presence of `-webkit-perspective: 1000px`, `-webkit-transform-style: preserve-3d`, `-webkit-transition: -webkit-transform`, and `-webkit-transform: rotateY(180deg)`.

3. **Invalidation Conditions**:
   - If `PDPView.render()` throws when `product.era` is omitted.
   - If `PDPView.updateQuantity(delta)` produces `NaN` or fails to clamp when `delta` is large negative/positive.
   - If `PDPView.handleHoloMove(e)` crashes or writes `NaN%` when passed a touch event.
   - If `css/styles.css` is missing `-webkit-` prefixes for 3D perspective or preserve-3d.
