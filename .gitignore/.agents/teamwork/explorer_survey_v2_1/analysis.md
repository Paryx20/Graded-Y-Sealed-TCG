# Detailed Technical Analysis: Requirements R1 & R2

## Executive Summary
This report presents an empirical, read-only architectural investigation into Requirements **R1 (Interactive 3D Card Viewer on PDP)** and **R2 (Dynamic Condition/Grade Pricing Updates on PDP)** in the Graded & Sealed Pokemon TCG e-commerce platform.

Key findings:
1. **Requirement R1 (3D Card Viewer):** Interactive mouse/touch drag rotation in 3D perspective is **not implemented**. While the CSS foundation (`perspective: 1000px`, `transform-style: preserve-3d`, `backface-visibility: hidden`) correctly supports two-sided 3D flipping, pointer events currently only calculate radial gradient coordinates for a holographic sheen overlay (`handleHoloMove`). There are no mouse/touch drag listeners, no rotation state tracking, and no dynamic 3D Euler angle transforms applied to `#pdp-3d-object`. The reverse side is only accessible via a discrete button click ("Reverso y Bordes") which triggers a full-page DOM re-render with a static `is-flipped-y` class.
2. **Requirement R2 (Dynamic Condition Pricing):** Condition buttons (Raw, PSA 8, PSA 9, PSA 10) have an inline `onclick="PDPView.selectCondition('${item.key}')"` handler that updates `Store.data.pdpSelectedCondition`. However, it triggers `app.renderCurrentView()`, destroying and re-rendering the entire view DOM on every click. Furthermore, for non-vault cards (e.g., cards returned from API search), `product.precios` is `undefined`, causing an unhandled `TypeError: Cannot read properties of undefined (reading 'raw')` at lines 410–413 of `js/views/pdp.js`, completely breaking the PDP view and price updates. In addition, cart additions fallback to a hardcoded $1000 if `product.precios` is missing.

---

## 1. Requirement R1: Interactive 3D Card Viewer on PDP

### 1.1 Current Architecture & Code Inspection

#### A. DOM Structure (`js/views/pdp.js`, Lines 98–147)
```html
<div 
  id="pdp-3d-scene" 
  onmousemove="PDPView.handleHoloMove(event)"
  ontouchstart="PDPView.handleHoloMove(event)"
  ontouchmove="PDPView.handleHoloMove(event)"
  ontouchend="PDPView.handleHoloMove(event)"
  class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4"
>
  <div id="pdp-3d-object" class="card-3d-object min-h-[350px] ${isFlipped ? 'is-flipped-y' : ''}">
    <div class="card-3d-face card-3d-front p-2">
      <div class="relative inline-flex items-center justify-center max-h-[350px]">
        <img 
          id="pdp-main-image"
          src="${product.imagenLocal}" 
          alt="${product.nombre}"
          class="max-h-[340px] max-w-full object-contain filter drop-shadow-2xl rounded-xl"
          onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
        />
        <div id="pdp-holo-layer" class="holo-sheen-layer"></div>
      </div>
    </div>

    <div class="card-3d-face card-3d-back p-2">
      <div class="relative inline-flex items-center justify-center max-h-[350px]">
        <img 
          src="img/cards/card-back.png" 
          class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl" 
          alt="Reverso de carta Pokémon" 
          onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
        />
        <div class="centering-grid-overlay">
          <span class="absolute top-2 left-2 bg-[#0F172A]/90 text-[#FEF3C7] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#D97706]/50">
            EJE X: 50.0% / 50.0%
          </span>
          <span class="absolute bottom-2 right-2 bg-[#059669]/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
            EJE Y: 50.0% / 50.0% • BORDES OK
          </span>
        </div>
      </div>
    </div>
  </div>
  ...
</div>
```

#### B. CSS Transformation Rules (`css/styles.css`, Lines 167–201)
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

### 1.2 Direct Observations & Mechanism Breakdown

| Aspect | Current Status | Code Location | Observed Behavior |
|---|---|---|---|
| **Pointer Drag Rotation** | **Absent** | `js/views/pdp.js:518-540` | `handleHoloMove` only calculates relative pointer percentages (`--holo-x`, `--holo-y`) for the `.holo-sheen-layer` background gradient. It never alters card `transform`. |
| **Free 360°/180° Inspection** | **Blocked** | `js/views/pdp.js:107` | Card is constrained to either 0° (default) or 180° (`.is-flipped-y`). Users cannot rotate to intermediate angles or inspect corners/edges in perspective. |
| **Existing Controls** | **Button-only** | `js/views/pdp.js:339-378` | 3 tab buttons ("Frontal Completo", "Reverso y Bordes", "Slab & Empaque") call `PDPView.setInspectorMode()`, which sets store state and triggers a complete DOM re-render. |
| **Perspective Configuration** | **Correct (1000px)** | `css/styles.css:168-169` | `.card-3d-scene` has `-webkit-perspective: 1000px; perspective: 1000px;`. |
| **Transform-Style** | **Correct (preserve-3d)** | `css/styles.css:176-177` | `.card-3d-object` has `transform-style: preserve-3d;`. |
| **Backface Visibility** | **Correct (hidden)** | `css/styles.css:190-191` | `.card-3d-face` has `backface-visibility: hidden;`. The front face is at 0° and the back face (`.card-3d-back`) is at `rotateY(180deg)`. |
| **Drag Transition Conflict** | **Vulnerability** | `css/styles.css:178-179` | `.card-3d-object` has `transition: transform 0.7s`. If `transform` is updated on drag without setting `transition: none`, movement lags 700ms behind cursor input. |
| **Touch & Mouse Default Actions** | **Uninhibited** | `js/views/pdp.js:109-128` | Card images have no `draggable="false"` or `user-select: none`. Dragging on desktop initiates native browser image drag; dragging on mobile scrolls the window. |

### 1.3 Root Cause of R1 Defect
The 3D card inspection mechanism was designed as a static dual-state presentation (mode `'front'` vs mode `'back'`) triggered by tab buttons, combined with a holographic gradient pointer tracker (`handleHoloMove`). Interactive spatial drag manipulation was never wired into the pointer event cycle.

### 1.4 Step-by-Step Fix Recommendations for R1
1. **Initialize 3D Drag Rotation Controller in `PDPView.afterRender()` (`js/views/pdp.js`):**
   - Bind pointer/mouse/touch listeners to `#pdp-3d-scene` (or the card container) when rendering cards.
   - Maintain drag tracking state: `isDragging`, `startX`, `startY`, `currentRotX`, `currentRotY`.
   - On `pointerdown` / `mousedown` / `touchstart`:
     - Mark `isDragging = true`.
     - Store initial pointer coordinates and baseline rotation.
     - Set `#pdp-3d-object.style.transition = 'none'` to enable 60fps tracking.
     - Set cursor to `grabbing`.
     - Call `e.preventDefault()` on touch to block vertical scroll interference.
   - On `pointermove` / `mousemove` / `touchmove`:
     - Calculate horizontal drag delta $\Delta X$ and vertical drag delta $\Delta Y$.
     - Compute new Y rotation: `rotY = currentRotY + deltaX * 0.55`.
     - Compute new X rotation with realistic tilt clamping: `rotX = Math.max(-40, Math.min(40, currentRotX - deltaY * 0.55))`.
     - Apply inline transform: `object.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)'`.
     - Update holographic sheen via `this.handleHoloMove(e)` simultaneously.
   - On `pointerup` / `pointercancel` / `touchend`:
     - Set `isDragging = false`.
     - Restore smooth transition: `object.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'`.
     - Reset cursor to `grab`.
     - Persist current rotation angle.
2. **Synchronize Mode Buttons with 3D Controller:**
   - Clicking "Frontal Completo" smoothly animates `rotateX(0deg) rotateY(0deg)`.
   - Clicking "Reverso y Bordes" smoothly animates `rotateX(0deg) rotateY(180deg)`.
   - Update `aria-selected` and active button classes without re-rendering the entire view.
3. **Prevent Native Drag Conflicts:**
   - Add `draggable="false"` and `select-none` to `#pdp-main-image` and the card back image.
   - Add `touch-action: none;` or `user-select: none;` to `.card-3d-scene`.

---

## 2. Requirement R2: Dynamic Condition/Grade Pricing Updates on PDP

### 2.1 Code Inspection & Data Architecture

#### A. Data Structure in `js/data.js`
In `PRODUCTS` (lines 8–369), each card item has a nested `precios` dictionary:
```javascript
{
  id: 'raichu-gx',
  nombre: 'Raichu GX Fase 1 Full Art #29/73',
  ...
  precios: {
    raw: 85.00,
    psa8: 140.00,
    psa9: 220.00,
    psa10: 450.00
  }
}
```
For sealed products (`categoria: 'sealed'`), `precios.sealed` and `precioUnitario` are defined (e.g. $3500.00).

#### B. State Management in `js/state.js`
- `Store.data.pdpSelectedCondition`: holds current condition string (`'raw'`, `'psa8'`, `'psa9'`, `'psa10'`), defaults to `'psa10'` (or `'psa9'`).
- `Store.data.currentPdpProduct`: holds current product object.
- `Store.data.pdpQuantity`: holds integer quantity (1–10).

#### C. Rendering of Grading Options (`js/views/pdp.js`, Lines 408–433)
```javascript
<div class="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Condición de la carta">
  ${[
    { key: 'raw', title: 'Raw / NM', price: product.precios.raw },
    { key: 'psa8', title: 'PSA 8 NM-MT', price: product.precios.psa8 },
    { key: 'psa9', title: 'PSA 9 MINT', price: product.precios.psa9 },
    { key: 'psa10', title: 'PSA 10 GEM MT', price: product.precios.psa10 }
  ].map(item => {
    const isActive = condition === item.key;
    return `
      <button 
        type="button" 
        onclick="PDPView.selectCondition('${item.key}')" 
        class="p-3 rounded-xl text-left transition ${isActive ? 'bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]' : 'bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]'}"
      >
        <div class="text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}">
          <span>${item.title}</span>
          ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>' : ''}
        </div>
        <div class="text-sm font-black mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}">
          $${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </button>
    `;
  }).join('')}
</div>
```

#### D. Condition Selection Handler (`js/views/pdp.js`, Lines 547–553)
```javascript
selectCondition(condKey) {
  Store.data.pdpSelectedCondition = condKey;
  app.renderCurrentView();
  const product = Store.data.currentPdpProduct || PRODUCTS[0];
  const price = product.precios[condKey];
  app.showToast(`Grado seleccionado: ${condKey.toUpperCase()} ($${price.toLocaleString('en-US')})`, 'info');
}
```

#### E. Cart Dispatch Integration (`js/views/pdp.js`, Lines 575–611)
```javascript
addToCart() {
  const product = Store.data.currentPdpProduct || PRODUCTS[0];
  const isSealed = product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed' || product.tipo_item === 'PRODUCTO_SELLADO';
  const condition = isSealed ? 'sealed' : (Store.data.pdpSelectedCondition || 'psa10');
  const qty = Store.data.pdpQuantity || 1;

  let price;
  let label;
  let image = product.imagenLocal;

  if (isSealed) {
    price = product.precioUnitario || (product.precios && product.precios.sealed) || (product.precios && product.precios.raw) || 3500;
    label = 'Sellado de Fábrica (Caja Intacta)';
  } else {
    price = (product.precios && product.precios[condition]) || (product.precios && product.precios.psa10) || 1000;
    label = this.getConditionFullTitle(condition);
  }

  app.addToCart(
    `${product.id}-${condition}`,
    product.nombre,
    label,
    price,
    image,
    product.imagenFallbackUrl,
    qty
  );
  ...
}
```

### 2.2 Direct Observations & Mechanism Breakdown

| Component | Observation | Status | Impact |
|---|---|---|---|
| **Event Listener** | Inline `onclick="PDPView.selectCondition('${item.key}')"` | Attached | Fires on button click for catalog cards. |
| **Price Recalculation (Catalog Cards)** | `Store.data.pdpSelectedCondition = condKey; app.renderCurrentView();` | Functional for static cards | Immediately re-evaluates price in `PDPView.render()` and updates `#pdp-price`. |
| **API Search Cards / Missing `precios`** | `product.precios.raw` at line 410 | **Fatal Crash** | For any card discovered via API search (`PokemonAPI`), `product.precios` is `undefined`. Accessing `.raw` throws an unhandled `TypeError`, crashing PDP entirely. |
| **DOM Destruction on Selection** | `app.renderCurrentView()` recreates `#app-view.innerHTML` | **Degraded UX / Conflict with R1** | Full view re-rendering tears down the 3D canvas/object, resetting rotation angles, causing visual blink, and rebuilding all icons. |
| **Cart SKU & Price Accuracy** | SKU: `${product.id}-${condition}`, Price: `product.precios[condition]` | Accurate for catalog cards; Broken fallback for API cards | When `product.precios` is missing, price defaults to $1000.00 instead of using realistic calculated pricing. |
| **12-Month Market Chart Sync** | `PDPView.drawChart()` (lines 613–694) | Functional | Updates trend percentage and sparkline based on condition multipliers (`raw`: -8.4%, `psa8`: -3.2%, `psa9`: +9.5%, `psa10`: +21.7%). |

### 2.3 Root Causes of R2 Defects
1. **Tight Coupling to Static Catalog Schema (`product.precios`):**
   `PDPView.render` assumes `product.precios` is always a populated object with `raw`, `psa8`, `psa9`, `psa10`. No defensive normalization or dynamic multiplier derivation exists for API cards or cards with a single base price.
2. **Coarse-Grained View Re-rendering:**
   Condition switching calls `app.renderCurrentView()`, an aggressive sledgehammer that wipes and recreates the entire page DOM rather than surgically patching `#pdp-price`, button classes, and the chart.
3. **Navigation Barrier from Search Results:**
   In `js/views/search-results.js`, non-vault API cards render a "Solicitar Adquisición" modal trigger instead of linking into the PDP view with generated condition pricing.

### 2.4 Step-by-Step Fix Recommendations for R2
1. **Dynamic Pricing Normalizer in `PDPView`:**
   Add a helper `getNormalizedPrices(product)`:
   - If `product.precios` exists and has `raw`, `psa8`, `psa9`, `psa10`, use it directly.
   - If `product.precios` is missing or incomplete, derive realistic grade pricing from the base estimated price (`base = product.precioEstimado || product.precioUnitario || 15.00`):
     - `raw`: `Math.round(base * 1.0)`
     - `psa8`: `Math.round(base * 1.45)`
     - `psa9`: `Math.round(base * 2.2)`
     - `psa10`: `Math.round(base * 4.8)`
   - Guarantee `product.precios` is never undefined during rendering.
2. **Surgical DOM Update Option / Preserved 3D State:**
   In `PDPView.selectCondition(condKey)`:
   - Update `Store.data.pdpSelectedCondition = condKey`.
   - Instead of tearing down the 3D stage, update `#pdp-price` text, toggle active classes on the condition buttons, update `#pdp-cert-badge` if in 3D mode, update slab badge if in slab mode, and call `this.drawChart()`.
   - Alternatively, ensure `renderCurrentView()` preserves and restores current 3D rotation Euler angles (`rotX`, `rotY`).
3. **Cart Integration Alignment:**
   Ensure `PDPView.addToCart()` references the normalized price dictionary so API cards can be added to the cart with their selected condition and calculated price.

---

## 3. Test Suites & Invariant Protection

The codebase contains 11 core automated test suites (244 tests passing):
- `tests/test_pdp.test.mjs` (46 tests)
- `tests/test_cart_toast.test.mjs` (15 tests)
- `tests/test_challenger_m1_r2.test.mjs` (12 tests)
- `tests/test_challenger_m2_fuzz.test.mjs` (18 tests)
- `tests/test_challenger_m2_lifecycle.test.mjs` (13 tests)
- `tests/test_e2e_suite.test.mjs` (15 tests)
- `tests/test_empirical_challenger.mjs` (11 tests)
- `tests/test_profile_orders.test.mjs` (34 tests)
- `tests/test_reviewer_m2_stress.mjs` (9 tests)
- `tests/test_search_failover.test.mjs` (14 tests)
- `tests/test_validations.test.mjs` (58 tests)

### Critical Invariants to Preserve:
1. `PDPView.handleHoloMove(e)` must continue to set `--holo-x` and `--holo-y` in percentage strings and clamp them strictly within `[0.0%, 100.0%]`.
2. `PDPView.renderInspectorStage(product, condition, 'back')` must produce the `is-flipped-y` class and contain `img/cards/card-back.png`.
3. Sealed products must strictly NEVER render PSA condition selectors or 3D flip buttons, and must ALWAYS render `#sealed-factory-specs` and sealed angle buttons.
4. Cards must ALWAYS render the PSA condition selectors and 3D mode buttons.
5. Quantity stepper must strictly clamp between 1 and 10.
