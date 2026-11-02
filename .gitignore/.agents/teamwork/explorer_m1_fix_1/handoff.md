# Investigation & Refactoring Specification Report: Production PDPView Testing Harness
**Agent**: Explorer 1 (`teamwork_explorer` / `explorer_m1_fix_1`)  
**Parent Agent**: `7697e516-910f-4bbf-b2ad-e3d882af43c1`  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_m1_fix_1\`  
**Date**: 2026-11-01T23:45:00Z  
**Status**: Ready for Implementation  

---

## Executive Summary

Both Milestone 1 reviewers issued `REQUEST_CHANGES` due to a critical test integrity finding: `tests/test_pdp.test.mjs` (46 tests) evaluated inline mock functions, synthetic HTML snippets, and dummy literals rather than exercising the actual production code in `js/views/pdp.js`. If `js/views/pdp.js` was modified or deleted, all 46 tests continued to pass.

This investigation provides the complete architectural and test-case-by-test-case blueprint for the Worker to refactor `tests/test_pdp.test.mjs` to execute production `PDPView` directly in Node.js via `node:vm`, eliminating all facade mocks. It also details the necessary production bug fixes in `js/views/pdp.js`, `index.html`, and `css/styles.css` so that the refactored test harness and reviewer audits pass with 100% genuine coverage.

---

## 1. Observation

### Observation 1.1: Test Suite Decoupling & Dummy Mock Inventory in `tests/test_pdp.test.mjs`
A line-by-line inspection of `tests/test_pdp.test.mjs` (425 lines, 46 tests) revealed that `PDPView` is never imported, evaluated, or referenced (0 occurrences).

Specific instances of dummy mocks:
1. **Feature 1 (Lines 30–70)**: Tests construct private object literals (`const sealedItem = { galeria_sellada: { frontal: 'img/sealed/team-rocket-box-front.png' ... } }`) and assert against their own properties. Line 65 creates a local arrow function `const switchAngle = (angle) => { activeAngle = angle; };` rather than testing `PDPView.setSealedAngle()`.
2. **Feature 2 (Lines 84–120)**: Tests evaluate local literal objects (`cardAssets`, `cardStyle`) and strings (`const cssClasses = 'filter drop-shadow-2xl rounded-xl'`) rather than querying `PRODUCTS` from `js/data.js` or checking rendered output from `PDPView.renderInspectorStage()`.
3. **Feature 3 (Lines 122–163)**:
   - Line 124: `const setMode = (m) => { mode = m; };`
   - Line 130: Local arrow function `const renderFrontFace = () => '<div class="card-3d-face...">'`
   - Line 140: Local arrow function `const computeHoloCoords = (clientX, clientY, rect) => ({ ... })`
   - Line 152: Dummy mock `setProperty` on an empty object
   - Line 160: Dummy mock `const renderBadge = (cert, grade) => ...`
4. **Feature 4 (Lines 165–205)**:
   - Line 167: Dummy mock `setMode`
   - Line 173: Dummy mock `const get3DClasses = (mode) => ...`
   - Line 179: Dummy mock `const renderBack = () => '<div class="card-3d-face card-3d-back"><svg class="official-pokemon-card-back"></svg></div>'`
   - Line 188: Dummy mock `const renderBackStage = () => ...`
   - Lines 200–204: String literals asserted against themselves (`textX.includes('50.0%')`)
5. **Feature 5 (Lines 207–246)**:
   - Line 209: Dummy mock `setMode`
   - Line 215: Dummy mock `const renderSlab = () => '<div class="psa-acrylic-slab"></div>'`
   - Line 220: Dummy mock `const renderLabel = () => ...`
   - Line 230: Dummy mock `const renderSerial = (cert) => ...`
   - Line 238: Dummy mock `const renderGrade = (grade) => ...`
6. **Feature 6 (Lines 248–294)**:
   - Line 249: Dummy mock `const shouldShowPSASelector = (product) => ...`
   - Line 258: Dummy mock `const shouldShow3DControls = (product) => ...`
   - Line 267: Dummy mock `const renderProductDetails = (product) => ...`
   - Line 278: Dummy mock `shouldShowPSASelector` re-tested on `{ categoria: 'psa', ... }`
   - Line 287: Dummy mock `const shouldShowInspectorAndChart = (product) => ...`
7. **Feature 7 (Lines 296–330, 383–403)**:
   - Evaluates the test harness helper class `QuantityStepper` (from `test_harness.mjs:473`) rather than calling `PDPView.updateQuantity(delta)` and asserting on `Store.data.pdpQuantity` and `#pdp-quantity-value`.
   - Line 323: Creates a synthetic `const cartItem = { id: ..., quantity: stepper.quantity }` rather than executing `PDPView.addToCart()`.
8. **Feature 8 (Lines 332–377)**:
   - Line 354: Hardcoded `const guideContent = '<h3>Escala de Certificación PSA</h3>...'`
   - Line 370: Local dummy `const onKeydown = (e) => { if (e.key === 'Escape') ... }`
9. **Tier 2 Boundary Tests (Lines 405–424)**:
   - Line 406: `const clampCoord = (val) => Math.max(0, Math.min(100, val));` asserted against `-25` and `150`, while `PDPView.handleHoloMove` in `js/views/pdp.js:515` does NOT clamp coordinates.
   - Line 413: `const getCertCode = (product) => product.certNumber || '48291034';`
   - Line 418: `const getGradeLabel = (cond) => ...`

### Observation 1.2: Production File Execution Context (`js/views/pdp.js`)
1. `js/views/pdp.js` is a browser script structured as:
   ```javascript
   const PDPView = {
     getGradeLabel(condition) { ... },
     getConditionFullTitle(condition) { ... },
     renderOfficialPokemonCardBackSVG() { ... },
     renderInspectorStage(product, condition, mode) { ... },
     renderSealedGalleryStage(product, activeAngle) { ... },
     renderSealedGalleryControls(product, activeAngle) { ... },
     renderFactorySpecs(product) { ... },
     render() { ... },
     afterRender() { ... },
     handleHoloMove(e) { ... },
     setInspectorMode(mode) { ... },
     selectCondition(condKey) { ... },
     updateQuantity(delta) { ... },
     setSealedAngle(angle) { ... },
     addToCart() { ... },
     drawChart() { ... },
     bindChartEvents() { ... }
   };
   ```
2. In Node.js, `const PDPView = ...` at the top level of a file evaluated with `vm.runInContext(code, sandbox)` does NOT attach `PDPView` to the `sandbox` object because `const` is block-scoped.
   - Empirical verification:
     ```javascript
     vm.runInContext('const PDPView = { test: 1 };', sandbox);
     console.log(sandbox.PDPView); // -> undefined
     ```
   - Successful evaluation requires appending `\n;this.PDPView = PDPView;` or `\n;globalThis.PDPView = PDPView;`:
     ```javascript
     vm.runInContext(code + '\n;this.PDPView = PDPView;', sandbox);
     console.log(sandbox.PDPView); // -> { getGradeLabel: [Function], ... }
     ```
3. `PDPView` depends on the following global references at runtime:
   - `Store`: `Store.data.currentPdpProduct`, `Store.data.pdpSelectedCondition`, `Store.data.pdpInspectorMode`, `Store.data.pdpSealedAngle`, `Store.data.pdpQuantity`.
   - `PRODUCTS`: Array of catalog items from `js/data.js` used as fallback when `Store.data.currentPdpProduct` is null.
   - `app`: `app.renderCurrentView()`, `app.showToast()`, `app.addToCart()`, `app.openPSAGuideModal()`.
   - `document`: `document.getElementById('pdp-3d-scene')`, `document.getElementById('pdp-quantity-value')`.
   - `Math`, `console`, `Date`, `JSON`.

### Observation 1.3: Empirical Production Code Defects Flagged by Reviewers
During reviewer audits, the following bugs in `js/views/pdp.js` and `index.html` were identified:
1. **Unchecked `product.era.toUpperCase()` Crash** (`js/views/pdp.js:386`):
   ```javascript
   ${isSealed ? `Era ${product.era.toUpperCase()} • Display Sellado` : ...}
   ```
   If a sealed product lacks `era`, this throws `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
2. **Missing Shimmer Clamping & Touch Events** (`js/views/pdp.js:101, 515–523`):
   `handleHoloMove` does not clamp coordinate percentages with `Math.max(0, Math.min(100, ...))` and only reads `e.clientX` / `e.clientY`, ignoring touch events. Line 101 lacks `ontouchmove`.
3. **Quantity Stepper Non-Numeric & Negative Delta Handling** (`js/views/pdp.js:538–546`):
   `updateQuantity(delta)` does not parse integers, allowing `NaN` state pollution, and returns early on large negative deltas instead of clamping to 1.
4. **PSA Modal Backdrop Dismissal** (`index.html:317`):
   `#psa-guide-modal` lacks `onclick="if (event.target === this) app.closePSAGuideModal()"`.
5. **CSS 3D WebKit Prefixes** (`css/styles.css:167–177`):
   Missing `-webkit-perspective: 1000px;` and `-webkit-transform-style: preserve-3d;`.

---

## 2. Logic Chain

1. **Integrity Rule Compliance**:
   Per the review guidelines, test suites must assert directly on the production codebase under test. Testing synthetic inline functions or locally declared literals constitutes an integrity violation.
2. **Technical Feasibility in Node.js v24**:
   `node:vm` allows loading `js/data.js`, `js/state.js`, and `js/views/pdp.js` into an isolated sandbox in <5ms without requiring external dependencies (like JSDOM) or altering the production browser script architecture.
3. **Mocking Boundaries**:
   `PDPView` only calls `document.getElementById` for two elements:
   - `#pdp-3d-scene`: needs `getBoundingClientRect()` returning `{ left, top, width, height }` and a `style.setProperty(key, val)` map.
   - `#pdp-quantity-value`: needs `innerText`.
   By supplying lightweight stubs for these two elements in the sandbox `document`, `PDPView.render()`, `handleHoloMove()`, `updateQuantity()`, `setInspectorMode()`, `setSealedAngle()`, and `addToCart()` can all be executed cleanly in pure Node.js.
4. **Prerequisite Code Hardening**:
   To rewrite boundary test 44 (`Feature 3 [Tier 2 Boundary]: 3D Sheen Coordinates - Clamps extreme coordinates gracefully`) to assert on the real `PDPView.handleHoloMove()`, `PDPView.handleHoloMove` in `js/views/pdp.js` MUST implement coordinate clamping (`Math.max(0, Math.min(100, ...))`). Otherwise, the real code will fail the test. Similarly, `product.era.toUpperCase()` must have a fallback `(product.era || 'vintage').toUpperCase()` so custom or minimal test product fixtures do not crash `PDPView.render()`.

---

## 3. Test-by-Test Refactoring Blueprint (All 46 Tests)

Below is the exact specification of how all 46 test cases in `tests/test_pdp.test.mjs` must be refactored to execute production `PDPView`:

### Setup Helper: `setupPDPRenderer()`
The test file must define a reusable test runtime setup:
```javascript
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export function setupPDPRenderer() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const sceneStyles = {};
  const mockSceneElement = {
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 300 }),
    style: {
      setProperty(key, val) { sceneStyles[key] = String(val); },
      getPropertyValue(key) { return sceneStyles[key]; },
      _styles: sceneStyles
    }
  };

  const mockQtyElement = { innerText: '1' };
  const elements = new Map([
    ['pdp-3d-scene', mockSceneElement],
    ['pdp-quantity-value', mockQtyElement]
  ]);

  const cartHistory = [];
  const toastHistory = [];

  const sandbox = {
    console,
    Math,
    document: {
      getElementById: (id) => elements.get(id) || null
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    app: {
      renderCurrentView: () => {},
      showToast: (msg, type) => { toastHistory.push({ msg, type }); },
      addToCart: (sku, name, label, price, img, fallback, qty) => {
        cartHistory.push({ sku, name, label, price, img, fallback, qty });
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);

  return {
    PRODUCTS: sandbox.PRODUCTS,
    Store: sandbox.Store,
    PDPView: sandbox.PDPView,
    mockSceneElement,
    mockQtyElement,
    cartHistory,
    toastHistory,
    sceneStyles
  };
}
```

---

### Detailed Test Mappings

#### Feature 1: Team Rocket Box Multi-Angle Imagery (Tests 1–5)
- **Test 1: Specifies front angle image path**
  - *Current*: Asserts on literal `{ galeria_sellada: { frontal: 'img/sealed/team-rocket-box-front.png' } }`.
  - *Refactored*: Query `PRODUCTS.find(p => p.id === 'booster-team-rocket')`. Assert `product.galeria_sellada.frontal === 'img/sealed/team-rocket-box-front.png'`. Call `PDPView.renderSealedGalleryStage(product, 'frontal')`. Assert `html.includes('img/sealed/team-rocket-box-front.png')`. Assert `fs.existsSync('img/sealed/team-rocket-box-front.png')`.
- **Test 2: Specifies 3/4 perspective angle image path**
  - *Current*: Asserts on literal `{ galeria_sellada: { perspectiva: ... } }`.
  - *Refactored*: Assert `product.galeria_sellada.perspectiva === 'img/sealed/team-rocket-box-perspective.png'`. Call `PDPView.renderSealedGalleryStage(product, 'perspectiva')`. Assert `html.includes('img/sealed/team-rocket-box-perspective.png')`. Assert `fs.existsSync('img/sealed/team-rocket-box-perspective.png')`.
- **Test 3: Specifies side profile image path**
  - *Current*: Asserts on literal `{ galeria_sellada: { lateral: ... } }`.
  - *Refactored*: Assert `product.galeria_sellada.lateral === 'img/sealed/team-rocket-box-side.png'`. Call `PDPView.renderSealedGalleryStage(product, 'lateral')`. Assert `html.includes('img/sealed/team-rocket-box-side.png')`. Assert `fs.existsSync('img/sealed/team-rocket-box-side.png')`.
- **Test 4: Gallery switcher toggles active preview angle**
  - *Current*: Asserts on dummy `switchAngle` arrow function.
  - *Refactored*: Set `Store.data.currentPdpProduct = product`. Call `PDPView.setSealedAngle('perspectiva')`. Assert `Store.data.pdpSealedAngle === 'perspectiva'`. Call `PDPView.render()`; assert `html.includes('img/sealed/team-rocket-box-perspective.png')`. Call `PDPView.setSealedAngle('lateral')`; assert `Store.data.pdpSealedAngle === 'lateral'`.
- **Test 5: Preserves factory seal description metadata**
  - *Current*: Asserts on literal `const specs = { gramaje_gramos: 750 ... }`.
  - *Refactored*: Call `PDPView.renderFactorySpecs(product)` or `PDPView.render()`. Assert `html.includes('750g')`, `html.includes('36 Sobres')`, `html.includes('Wizards of the Coast')`, `html.includes('Sin pesar')`. Assert `product.detalles_sellados.gramaje_gramos === 750`.

#### Feature 2: Pokémon Card Visual Assets (Tests 6–10)
- **Test 6: Official card back image asset is specified**
  - *Current*: Asserts on literal `cardAssets.backOfficial`.
  - *Refactored*: Query `card = PRODUCTS.find(p => p.id === 'raichu-gx' || p.categoria === 'psa')`. Call `PDPView.renderInspectorStage(card, 'psa10', 'back')`. Assert `html.includes('img/cards/card-back.png')`. Assert `fs.existsSync('img/cards/card-back.png')`.
- **Test 7: Raichu GX front asset is specified**
  - *Current*: Asserts on literal `cardAssets.front`.
  - *Refactored*: Query `raichu = PRODUCTS.find(p => p.id === 'raichu-gx')`. Assert `raichu.imagenLocal === 'img/cards/raichu-gx.png'`. Call `PDPView.renderInspectorStage(raichu, 'psa10', 'front')`. Assert `html.includes('img/cards/raichu-gx.png')`. Assert `fs.existsSync('img/cards/raichu-gx.png')`.
- **Test 8: Supports standard card ratio aspect styling**
  - *Current*: Asserts on literal `aspectRatio: '3 / 4'`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `html.includes('max-h-[340px]')`. Call `PDPView.renderInspectorStage(card, 'psa10', 'slab')`. Assert `html.includes('aspect-[3/4]')`.
- **Test 9: Provides fallback URL when local asset is missing**
  - *Current*: Asserts on dummy `product.imagenFallbackUrl`.
  - *Refactored*: Assert `card.imagenFallbackUrl.startsWith('https://')`. Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `html.includes(`onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"`)`.
- **Test 10: Applies drop shadow filter for realistic 3D appearance**
  - *Current*: Asserts on literal string `filter drop-shadow-2xl`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `html.includes('drop-shadow-2xl')` and `html.includes('rounded-xl')`.

#### Feature 3: 3D Inspector Frontal View & Shimmer (Tests 11–15)
- **Test 11: Sets inspector mode to front**
  - *Current*: Asserts on dummy `setMode` function.
  - *Refactored*: Call `PDPView.setInspectorMode('front')`. Assert `Store.data.pdpInspectorMode === 'front'`.
- **Test 12: Holographic sheen layer container is present**
  - *Current*: Asserts on synthetic template arrow function.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `html.includes('id="pdp-holo-layer"')` and `html.includes('class="holo-sheen-layer"')`.
- **Test 13: Mousemove handler computes relative sheen coordinates**
  - *Current*: Asserts on dummy `computeHoloCoords`.
  - *Refactored*: Call `PDPView.handleHoloMove({ clientX: 200, clientY: 250 })`. With mock rect `{ left: 100, top: 100, width: 200, height: 300 }`, assert `sceneStyles['--holo-x'] === '50.0%'` and `sceneStyles['--holo-y'] === '50.0%'`.
- **Test 14: Applies holo coordinates to CSS custom properties**
  - *Current*: Asserts on dummy `setProperty` object mock.
  - *Refactored*: Call `PDPView.handleHoloMove({ clientX: 231, clientY: 226 })`. Assert `sceneStyles['--holo-x'] === '65.5%'` and `sceneStyles['--holo-y'] === '42.0%'`.
- **Test 15: Displays PSA authentication certification badge**
  - *Current*: Asserts on dummy `renderBadge`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `html.includes('id="pdp-cert-badge"')` and `html.includes(`#${card.certNumber || '48291034'}`)`.

#### Feature 4: 3D Inspector Reverso y Bordes (Tests 16–20)
- **Test 16: Sets inspector mode to back**
  - *Current*: Asserts on dummy `setMode`.
  - *Refactored*: Call `PDPView.setInspectorMode('back')`. Assert `Store.data.pdpInspectorMode === 'back'`.
- **Test 17: Applies 180° Y-axis rotation CSS class (is-flipped-y)**
  - *Current*: Asserts on dummy `get3DClasses`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'back')`. Assert `html.includes('is-flipped-y')`. Call `PDPView.renderInspectorStage(card, 'psa10', 'front')`. Assert `!html.includes('is-flipped-y')`.
- **Test 18: Renders official Pocket Monsters card back artwork**
  - *Current*: Asserts on dummy SVG arrow function.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'back')`. Assert `html.includes('card-3d-back')` and `html.includes('img/cards/card-back.png')`.
- **Test 19: Displays centering grid overlay**
  - *Current*: Asserts on dummy template arrow function.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'back')`. Assert `html.includes('centering-grid-overlay')`.
- **Test 20: Centering indicators display 50/50 alignment metrics**
  - *Current*: Asserts on literal string variables.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'back')`. Assert `html.includes('EJE X: 50.0% / 50.0%')` and `html.includes('EJE Y: 50.0% / 50.0% • BORDES OK')`.

#### Feature 5: 3D Inspector Slab PSA View (Tests 21–25)
- **Test 21: Sets inspector mode to slab**
  - *Current*: Asserts on dummy `setMode`.
  - *Refactored*: Call `PDPView.setInspectorMode('slab')`. Assert `Store.data.pdpInspectorMode === 'slab'`.
- **Test 22: Renders PSA acrylic slab container (psa-acrylic-slab)**
  - *Current*: Asserts on dummy `renderSlab`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'slab')`. Assert `html.includes('psa-acrylic-slab')` and `html.includes('psa-inner-well')`.
- **Test 23: Renders PSA certification header label**
  - *Current*: Asserts on dummy `renderLabel`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'slab')`. Assert `html.includes('PROFESSIONAL SPORTS AUTHENTICATOR')` and `html.includes('<span>PSA</span>')`.
- **Test 24: Displays barcode and certification serial number**
  - *Current*: Asserts on dummy `renderSerial`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'slab')`. Assert `html.includes('psa-barcode')` and `html.includes(`#${card.certNumber || '48291034'}`)`.
- **Test 25: Displays grade badge (GEM MT 10)**
  - *Current*: Asserts on dummy `renderGrade`.
  - *Refactored*: Call `PDPView.renderInspectorStage(card, 'psa10', 'slab')`. Assert `html.includes('GRADO')` and `html.includes('GEM MT 10')`.

#### Feature 6: Adaptive PDP Conditional Logic (Tests 26–30)
- **Test 26: Sealed product hides PSA grading selector**
  - *Current*: Asserts on dummy `shouldShowPSASelector`.
  - *Refactored*: Set `Store.data.currentPdpProduct = sealed`. Call `PDPView.render()`. Assert `!html.includes('Seleccionar Condición / Grado PSA:')` and `!html.includes('role="radiogroup"')`.
- **Test 27: Sealed product hides 3D rotation controls**
  - *Current*: Asserts on dummy `shouldShow3DControls`.
  - *Refactored*: Set `Store.data.currentPdpProduct = sealed`. Call `PDPView.render()`. Assert `!html.includes('Modos del inspector de carta')` and `!html.includes('card-3d-scene')`.
- **Test 28: Sealed product displays factory specifications and packaging gallery**
  - *Current*: Asserts on dummy `renderProductDetails`.
  - *Refactored*: Set `Store.data.currentPdpProduct = sealed`. Call `PDPView.render()`. Assert `html.includes('id="sealed-factory-specs"')`, `html.includes('id="pdp-sealed-stage"')`, and `html.includes('Ángulos del empaque sellado')`.
- **Test 29: Single card shows PSA grading selector**
  - *Current*: Asserts on dummy `shouldShowPSASelector`.
  - *Refactored*: Set `Store.data.currentPdpProduct = card`. Call `PDPView.render()`. Assert `html.includes('Seleccionar Condición / Grado PSA:')` and `html.includes('role="radiogroup"')`.
- **Test 30: Single card shows 3D inspector modes & 12-month quotation chart**
  - *Current*: Asserts on dummy `shouldShowInspectorAndChart`.
  - *Refactored*: Set `Store.data.currentPdpProduct = card`. Call `PDPView.render()`. Assert `html.includes('Modos del inspector de carta')`, `html.includes('id="pdp-3d-scene"')`, and `html.includes('id="pdp-interactive-chart"')`.

#### Feature 7: PDP Quantity Stepper (Tests 31–35, 41–43)
- **Test 31: Initial count is exactly 1**
  - *Current*: `new QuantityStepper(1)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 1`. Set `Store.data.currentPdpProduct = card`. Call `PDPView.render()`. Assert `html.includes('id="pdp-quantity-value"')` with inner text `1`.
- **Test 32: Increment (+) increases quantity from 1 to 2**
  - *Current*: `stepper.updateQuantity(1)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 1`. Call `PDPView.updateQuantity(1)`. Assert `Store.data.pdpQuantity === 2` and `mockQtyElement.innerText === '2'`.
- **Test 33: Decrement (-) decreases quantity from 2 to 1**
  - *Current*: `stepper.updateQuantity(-1)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 2`. Call `PDPView.updateQuantity(-1)`. Assert `Store.data.pdpQuantity === 1` and `mockQtyElement.innerText === '1'`.
- **Test 34: Multiple increments accumulate predictably**
  - *Current*: Multi-call on `stepper`.
  - *Refactored*: Set `Store.data.pdpQuantity = 1`. Call `PDPView.updateQuantity(1); PDPView.updateQuantity(1); PDPView.updateQuantity(1);`. Assert `Store.data.pdpQuantity === 4` and `mockQtyElement.innerText === '4'`.
- **Test 35: Adding to cart passes selected quantity correctly**
  - *Current*: Asserts on dummy `cartItem` object literal.
  - *Refactored*: Set `Store.data.currentPdpProduct = card`. Set `Store.data.pdpQuantity = 3`. Call `PDPView.addToCart()`. Assert `cartHistory[0].qty === 3`, `cartHistory[0].name === card.nombre`, and assert `Store.data.pdpQuantity` was reset to 1.
- **Test 41 (Boundary): Lower bound cannot decrement below 1**
  - *Current*: Asserts on `stepper.updateQuantity(-1)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 1`. Call `PDPView.updateQuantity(-1)`. Assert `Store.data.pdpQuantity === 1`. Call `PDPView.updateQuantity(-5)`. Assert `Store.data.pdpQuantity === 1`.
- **Test 42 (Boundary): Direct non-numeric / negative input handling**
  - *Current*: Asserts on `stepper.setQuantity(0)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 1`. Call `PDPView.updateQuantity('invalid')`. Assert `Store.data.pdpQuantity === 1` (not corrupted to NaN). Call `PDPView.updateQuantity(-99)`. Assert `Store.data.pdpQuantity === 1`.
- **Test 43 (Boundary): Upper bound clamp at maximum stock (10)**
  - *Current*: Asserts on `stepper.updateQuantity(1)`.
  - *Refactored*: Set `Store.data.pdpQuantity = 10`. Call `PDPView.updateQuantity(1)`. Assert `Store.data.pdpQuantity === 10`.

#### Feature 8: PSA Educational Modal (Tests 36–40)
- **Test 36: Modal element exists in DOM structure**
  - *Current*: Asserts on mock DOM element.
  - *Refactored*: Read `index.html` from disk (`fs.readFileSync('index.html', 'utf8')`). Assert `indexHtml.includes('id="psa-guide-modal"')`, `role="dialog"`, `aria-modal="true"`.
- **Test 37: Opening modal adds active class**
  - *Current*: Directly executes `modal.classList.add('active')`.
  - *Refactored*: In mock DOM, evaluate `app.openPSAGuideModal()`. Assert `modal.classList.contains('active') === true`.
- **Test 38: Closing modal removes active class**
  - *Current*: Directly executes `modal.classList.remove('active')`.
  - *Refactored*: Set `modal.classList.add('active')`. Evaluate `app.closePSAGuideModal()`. Assert `modal.classList.contains('active') === false`.
- **Test 39: Contains grade descriptions (Gem Mint 10, Mint 9, NM-MT 8)**
  - *Current*: Asserts on local string `guideContent`.
  - *Refactored*: Read `index.html`. Assert `indexHtml.includes('PSA 10 GEM MINT')`, `indexHtml.includes('PSA 9 MINT')`, `indexHtml.includes('PSA 8 NM-MT')`.
- **Test 40: Escape key event closes active modal**
  - *Current*: Asserts on local arrow function `onKeydown`.
  - *Refactored*: Read `js/app.js` ESC handler or dispatch keyboard event in mock window. Assert ESC removes `active` class.

#### Tier 2 Boundary Tests for Feature 3 & Feature 5 (Tests 44–46)
- **Test 44: 3D Sheen Coordinates - Clamps extreme coordinates gracefully**
  - *Current*: Asserts on local `clampCoord` function.
  - *Refactored*: Execute real `PDPView.handleHoloMove({ clientX: -50, clientY: 600 })` on `mockSceneElement` (bounds: `left: 100, top: 100, width: 200, height: 300`). Assert `sceneStyles['--holo-x'] === '0.0%'` (clamped at 0%, not negative) and `sceneStyles['--holo-y'] === '100.0%'` (clamped at 100%, not >100%).
- **Test 45: Slab PSA View - Fallback to default cert code when undefined**
  - *Current*: Asserts on local `getCertCode` function.
  - *Refactored*: Execute real `PDPView.renderInspectorStage({ set: 'Base Set', nombre: 'Test Card' }, 'psa10', 'slab')`. Assert `html.includes('#48291034')`.
- **Test 46: Slab PSA View - Unknown grading condition defaults safely**
  - *Current*: Asserts on local `getGradeLabel` function.
  - *Refactored*: Execute real `PDPView.getGradeLabel('unknown_cond')` and `PDPView.getGradeLabel(null)`. Assert both return `'GEM MT 10'`.

---

## 4. Concrete Implementation Strategy for the Worker

The Worker should execute the following steps in sequence:

### Step 1: Harden Production Code in `js/views/pdp.js`
1. **Coordinate Clamping & Touch Support in `PDPView.handleHoloMove` (`js/views/pdp.js:515–523`)**:
   ```javascript
   handleHoloMove(e) {
     const scene = document.getElementById('pdp-3d-scene');
     if (!scene) return;
     const rect = scene.getBoundingClientRect();
     const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
     const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
     if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
     const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
     const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
     scene.style.setProperty('--holo-x', `${x.toFixed(1)}%`);
     scene.style.setProperty('--holo-y', `${y.toFixed(1)}%`);
   },
   ```
2. **Touchmove event binding in `renderInspectorStage` (`js/views/pdp.js:101`)**:
   Add `ontouchmove="PDPView.handleHoloMove(event)"`.
3. **Safe Era Fallback (`js/views/pdp.js:386`)**:
   Replace:
   ```javascript
   ${isSealed ? `Era ${product.era.toUpperCase()} • Display Sellado` : ...}
   ```
   With:
   ```javascript
   ${isSealed ? `Era ${(product.era || 'vintage').toUpperCase()} • Display Sellado` : ...}
   ```
4. **Input Sanitization in `PDPView.updateQuantity` (`js/views/pdp.js:538–546`)**:
   ```javascript
   updateQuantity(delta) {
     const d = parseInt(delta, 10);
     if (isNaN(d)) return;
     const current = parseInt(Store.data.pdpQuantity, 10) || 1;
     const next = Math.max(1, Math.min(10, current + d));
     Store.data.pdpQuantity = next;
     if (typeof document !== 'undefined') {
       const el = document.getElementById('pdp-quantity-value');
       if (el) el.innerText = String(next);
     }
   },
   ```

### Step 2: Harden Production Code in `index.html` and `css/styles.css`
1. **Backdrop Dismissal in `index.html:317`**:
   Add `onclick="if (event.target === this) app.closePSAGuideModal()"` on `#psa-guide-modal`.
2. **WebKit 3D Prefixes in `css/styles.css:167–177`**:
   Add `-webkit-perspective: 1000px;` to `.card-3d-scene` and `-webkit-transform-style: preserve-3d;` to `.card-3d-object`.

### Step 3: Rewrite `tests/test_pdp.test.mjs`
1. Replace all dummy mocks with `setupPDPRenderer()` and call real `PDPView` methods per the detailed 46-test mapping above.
2. Remove all unused local mock functions (`shouldShowPSASelector`, `clampCoord`, `renderBack`, `setMode`, `computeHoloCoords`).
3. Ensure all 46 test titles remain identical or cleanly mapped to preserve test report stability.

### Step 4: Validate and Verify
1. Run `node --test tests/test_pdp.test.mjs` (must pass 46 / 46).
2. Run `node --test tests/*.test.mjs` (must pass 182 / 182).
3. Verify that removing or corrupting `PDPView.render()` causes tests in `tests/test_pdp.test.mjs` to genuinely fail.

---

## 5. Caveats

1. **Browser Visual Composition**: Headless Node.js `node:vm` tests verify generated DOM HTML strings, CSS class assignments, and style property updates, but cannot measure physical GPU rendering (e.g. `mix-blend-mode: screen`).
2. **App.js Coupling**: `PDPView.selectCondition`, `PDPView.setInspectorMode`, and `PDPView.setSealedAngle` invoke `app.renderCurrentView()`. In the test sandbox, `app.renderCurrentView()` is safely stubbed as a no-op so that setting state does not trigger unwanted UI redraw side-effects during tests.

---

## 6. Conclusion

The self-certifying dummy tests in `tests/test_pdp.test.mjs` can be completely eliminated and replaced with direct execution of `PDPView` using a zero-dependency `node:vm` sandbox. This ensures 100% genuine code verification, resolves all reviewer integrity objections, and hardens the PDP against runtime edge cases.

---

## 7. Verification Method

To verify this investigation independently:

1. **Verify Sandbox Execution of `PDPView`**:
   ```powershell
   node -e "const fs = require('fs'), vm = require('vm'); const ctx = { Store: { data: { pdpQuantity: 1 } }, PRODUCTS: [{}], app: {}, document: { getElementById: () => ({ innerText: '' }) } }; vm.createContext(ctx); vm.runInContext(fs.readFileSync('js/views/pdp.js', 'utf8') + '\n;this.PDPView = PDPView;', ctx); ctx.PDPView.updateQuantity(1); console.log('PDPView quantity updated to:', ctx.Store.data.pdpQuantity);"
   ```
   *Expected output*: `PDPView quantity updated to: 2`.

2. **Verify Real Test Suite Execution**:
   ```powershell
   node --test tests/test_pdp.test.mjs
   node --test tests/*.test.mjs
   ```
