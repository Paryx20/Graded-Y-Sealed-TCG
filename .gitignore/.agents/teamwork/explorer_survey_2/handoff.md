# Handoff Report: UI Assets, Views, 3D Inspector, Cart & Toast System Survey

**Agent**: UI Assets and Views Explorer (`explorer_survey_2`)  
**Date**: 2026-11-01T22:25:00Z  
**Target Milestone**: Phase 0 Survey & Phase 4-5 Preparation  
**Parent Agent**: `7697e516-910f-4bbf-b2ad-e3d882af43c1`  
**Handoff Type**: Hard (Investigation Complete)

---

## 1. Observation

### 1.1 User-Uploaded Image Assets
Direct verification was performed on user files and workspace assets:
- **Card Back**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570186168_80295ed8.jpg`
  - *Properties*: Size: 32,304 bytes, Dimensions: 330 × 461 px, 3 color channels (JPEG).
  - *Visual*: Official blue Pokémon TCG card back with centered Pokéball and blue border swirl.
- **Card Front (Raichu GX)**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570244974_7f34fc1b.jpg`
  - *Properties*: Size: 344,390 bytes, Dimensions: 612 × 853 px, 3 color channels (JPEG). Standard Pokémon TCG aspect ratio (~1:1.39).
  - *Visual*: Full art / standard frame Raichu GX (Fase 1, PS 210, Chispa Poderosa 20+, Trueno 160, Colavoltio GX 120, 29/73, Spanish edition).
- **Booster Box (Team Rocket)**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570203846_69580a5b.jpg` (also present in workspace at `img/booster-team-rocket.png`)
  - *Properties*: Size: 304,706 bytes (workspace PNG: 6,508,080 bytes, Dimensions: 2400 × 1792 px).
  - *Visual*: Team Rocket Booster Box photographed at a 3/4 perspective showing top, front, and left side, with white/light-gray studio background and PWCC certification stickers.
- **Target Directories**:
  - `img/cards/`: Directory exists, currently empty (`list_dir` returned 0 entries).
  - `img/sealed/`: Directory exists, currently empty (`list_dir` returned 0 entries).
- **Runtime & Tooling Verification**:
  - `python.exe` / `py -0`: `No installed Pythons found!`. Python is not installed on the system.
  - `node`: Node.js v24.21.0 is installed and functional.
  - Windows PowerShell: `.NET System.Drawing` (`[System.Drawing.Bitmap]`, `[System.Drawing.Graphics]`) is fully functional.
  - Native tool `generate_image`: Available to edit and generate new perspective views.

### 1.2 PDP Implementation
- **View Location & Routing**:
  - PDP rendered in `PDPView.render()` (`js/views/pdp.js:141-337`).
  - Container: `<main id="app-view">` (`index.html:293`).
  - Hash route: `#pdp?id=<productId>` parsed in `app.handleRoute()` (`js/app.js:39-54`), which sets `Store.data.currentPdpProduct` and calls `app.renderCurrentView()`.
- **Handling of Individual Cards vs Sealed Items**:
  - In `js/data.js:7-284`, products are marked with `categoria: 'psa' | 'raw' | 'sealed'`.
  - In `js/db/schema.js:38, 98`, products have `tipo_discriminador: 'CARTA_INDIVIDUAL' | 'PRODUCTO_SELLADO'`.
  - In `PDPView.render()` (`js/views/pdp.js:141-337`), **there is currently no conditional logic** based on `tipo_item` or `categoria`. Every product (including sealed boxes like `booster-team-rocket` and `booster-box-fossil-1999`) unconditionally renders:
    1. The 3D card inspection buttons (`Frontal Completo`, `Reverso y Bordes`, `Slab & Empaque`) (`js/views/pdp.js:169-208`).
    2. The PSA grading radio buttons (`raw`, `psa8`, `psa9`, `psa10`) (`js/views/pdp.js:236-260`).
    3. The 12-month market trend line chart (`#pdp-chart-container`) (`js/views/pdp.js:263-289`).
- **3D Card Inspection, Holographic Shimmer, Rotation, Centering Grid, Slab**:
  - `js/views/pdp.js:54-138` (`renderInspectorStage(product, condition, mode)`):
    - Mode `slab`: Renders `.psa-acrylic-slab` with `.psa-flip-label` (PSA red border, card name, barcode, grade badge) and `.psa-inner-well`.
    - Mode `front`: Renders `.card-3d-scene` > `.card-3d-object` > `.card-3d-front` with `<img>` and `<div id="pdp-holo-layer" class="holo-sheen-layer">`.
    - Mode `back`: Adds class `.is-flipped-y` to `.card-3d-object` and renders `.card-3d-back` containing an inline SVG (`renderOfficialPokemonCardBackSVG()`) and `.centering-grid-overlay`.
  - `css/styles.css:167-300`:
    - `.card-3d-scene`: `perspective: 1000px;` (line 167).
    - `.card-3d-object`: `transform-style: preserve-3d; transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);` (lines 171-177).
    - `.card-3d-object.is-flipped-y`: `transform: rotateY(180deg);` (lines 179-181).
    - `.card-3d-face`: `backface-visibility: hidden;` (lines 183-191).
    - `.card-3d-back`: `transform: rotateY(180deg);` (lines 193-195).
    - `.holo-sheen-layer`: Radial gradient using CSS custom properties `var(--holo-x, 50%)` and `var(--holo-y, 50%)`, updated via `PDPView.handleHoloMove(e)` (`js/views/pdp.js:345-353`), with `mix-blend-mode: screen; opacity: 0;` (lines 197-217).
    - `.centering-grid-overlay`: Dashed border and crosshairs at `left: 50%` and `top: 50%` (lines 219-243).
    - `.psa-acrylic-slab`: Multi-layer gradient, 4px border, and double inset box shadows (lines 245-265).
- **Quantity Selector**:
  - Implemented in `js/views/pdp.js:304-322` (`− [ qty ] +`).
  - Handler `PDPView.updateQuantity(delta)` (`js/views/pdp.js:368-374`):
    ```javascript
    updateQuantity(delta) {
      const next = (Store.data.pdpQuantity || 1) + delta;
      if (next < 1 || next > 10) return;
      Store.data.pdpQuantity = next;
      const el = document.getElementById('pdp-quantity-value');
      if (el) el.innerText = next;
    }
    ```
    Minimum value 1 is strictly enforced.
- **Modal "¿Qué es un Grado PSA?"**:
  - Markup in `index.html:317-373` (`#psa-guide-modal`).
  - Triggered by `app.openPSAGuideModal()` (`js/app.js:293-299`) and closed by `app.closePSAGuideModal()` (`js/app.js:301-304`).
  - Accessible attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="psa-guide-title"`, Escape key dismissal (`js/app.js:11-12`).

### 1.3 Cart and Toast System
- **Toast Notifications**:
  - Container in `index.html:43`: `<div id="toast-container" aria-live="polite" aria-atomic="true" class="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>`.
  - Implementation in `js/app.js:489-524`:
    ```javascript
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      ...
      container.appendChild(toast);
      ...
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 250);
      }, 3800);
    }
    ```
    - **Singleton Status**: **NOT a singleton**. Does not clear or dismiss existing toasts before appending a new one. Rapid successive triggers stack multiple toasts vertically.
    - **Dismiss Timer**: Configured to `3800ms` (3.8 seconds), violating Acceptance Criteria 57 ("auto-dismiss in 2.5s").
- **Cart Removal & Undo Mechanism**:
  - Triggered from `CartView` (`js/views/cart.js:74`) via `app.requestRemoveItem(id)`.
  - Modal `#delete-confirm-modal` (`index.html:375-403`) opens and prompts confirmation.
  - On confirm (`app.confirmRemoveItem()`, `js/app.js:244-269`):
    - Stores `{ item: removed, index: idx }` into `Store.data.lastDeletedItem`.
    - Splices item out of `Store.data.cart` and saves state.
    - Shows `#undo-banner` (`index.html:267-291`) with message: `Ítem "${removed.name}" eliminado de la bolsa.`.
  - On undo (`app.undoLastDeletion()`, `js/app.js:271-285`):
    - Re-inserts item at original index: `Store.data.cart.splice(index, 0, item)`.
    - Clears `Store.data.lastDeletedItem = null`.
    - Hides `#undo-banner`.
    - Re-renders cart and shows toast.

---

## 2. Logic Chain

1. **Asset Pipeline to `img/cards/` and `img/sealed/`**:
   - *Observation*: Three source files exist in `.user_uploaded/` (Card Back, Raichu GX, Booster Box 3/4).
   - *Observation*: `img/cards/` and `img/sealed/` are empty.
   - *Observation*: Phase 4 requires `img/cards/` to contain Raichu GX front and official back, and `img/sealed/` to contain transparent-background Team Rocket box images for three angles: front, 3/4 perspective, and side.
   - *Deduction*:
     - `media_1793570186168_80295ed8.jpg` maps directly to `img/cards/card-back.png` (or `.jpg`).
     - `media_1793570244974_7f34fc1b.jpg` maps directly to `img/cards/raichu-gx.png`.
     - `media_1793570203846_69580a5b.jpg` represents the 3/4 perspective angle. To produce `img/sealed/team-rocket-box-perspective.png` with a transparent background, the studio white sweep background must be knocked out to RGBA alpha = 0.
     - For `team-rocket-box-front.png` and `team-rocket-box-side.png`, these views can be generated via `generate_image` using the 3/4 image as reference, or rendered via PowerShell `.NET System.Drawing` / canvas transformations.

2. **PDP Adaptation for Sealed vs Cards (`tipo_item`)**:
   - *Observation*: `PDPView.render()` currently renders PSA conditions (`raw`, `psa8`, `psa9`, `psa10`), 3D card inspection buttons, and price trends for ALL products.
   - *Observation*: Requirement R1 and `PLAN_DE_TRABAJO.md` line 48-50 mandate:
     - `PRODUCTO_SELLADO`: Hide PSA selector, hide 3D card inspector controls; display factory specifications (weight, pack artwork, sealed condition) and multi-angle packaging gallery (front, 3/4, side).
     - `CARTA_INDIVIDUAL`: Display PSA grading selector, 3D card inspector (front, back 50/50, slab), and 12m trend chart.
   - *Deduction*: `PDPView.render()` must branch on `product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed'`. The sealed branch must render the multi-angle image gallery using `img/sealed/` and display factory specs (`detalles_sellados`), while the card branch retains the 3D card inspector and PSA selector.

3. **Card Inspector Back Face Replacement**:
   - *Observation*: `renderOfficialPokemonCardBackSVG()` currently renders a synthetic SVG with blue gradients and vector paths.
   - *Observation*: Requirement R1 and Acceptance Criteria 45 state that `img/cards/` must contain the formatted official back, and the 180° rotation inspector must show this back.
   - *Deduction*: Replace the synthetic SVG in `.card-3d-back` with an `<img>` tag referencing `img/cards/card-back.png` under the existing `.centering-grid-overlay`.

4. **Toast Notification Singleton & Timer Defect**:
   - *Observation*: `showToast()` in `js/app.js:489` creates a new DOM node and appends it to `#toast-container` without removing existing toasts. It uses a `setTimeout` of `3800ms`.
   - *Observation*: Acceptance Criteria 57 dictates: "Only one toast notification is visible at a time with 2.5s auto-dismiss."
   - *Deduction*: `showToast()` must be refactored into a true singleton:
     1. Maintain an active timer reference `currentToastTimer`.
     2. Call `clearTimeout(currentToastTimer)` and immediately remove any existing children in `container.innerHTML = ''`.
     3. Set auto-dismiss timeout to `2500ms` (2.5 seconds).

5. **Cart Removal & Undo Protocol**:
   - *Observation*: Cart item removal in `js/app.js` already features a confirmation modal (`requestRemoveItem`), an undo state variable (`Store.data.lastDeletedItem`), an undo banner (`#undo-banner`), and an undo function (`undoLastDeletion`).
   - *Deduction*: The foundational workflow is solid; it only needs to be verified that removing items and pressing "Deshacer" properly restores the item in all edge cases (e.g. empty cart returning to 1 item, badge updating, and toast firing).

---

## 3. Caveats

1. **Python Environment**: `python.exe` is a non-functional Windows App Store stub on this machine. Any image manipulation scripts must use Node.js (v24.21.0), PowerShell `.NET System.Drawing`, or the native `generate_image` tool rather than Python PIL.
2. **PWCC Stickers on Uploaded Sealed Box**: The source photo of the Team Rocket Booster Box includes PWCC certification stickers and shrinkwrap reflections. If an ultra-clean product render is desired, `generate_image` can clean up artifacts or synthesize pristine front and side angles.
3. **Data Uniformity**: Products in `js/data.js` currently define prices for `raw`, `psa8`, `psa9`, `psa10` even for sealed items. To maintain data integrity, `precios` for sealed items should represent the sealed unit price, or the PDP must read `precio_base` / single price rather than looking up `product.precios.psa10`.

---

## 4. Conclusion

- **Asset Mapping**:
  - `img/cards/card-back.png` ← `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570186168_80295ed8.jpg`
  - `img/cards/raichu-gx.png` ← `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570244974_7f34fc1b.jpg`
  - `img/sealed/team-rocket-box-perspective.png` ← Processed transparent PNG of `media_1793570203846_69580a5b.jpg` (or `img/booster-team-rocket.png`).
  - `img/sealed/team-rocket-box-front.png` & `team-rocket-box-side.png` ← Generated via `generate_image` / transformed image assets with transparent background.
- **PDP View**: Needs conditional branching on `tipo_item` / `categoria === 'sealed'`. The 3D inspector styling and animations (`rotateY(180deg)`, holographic mousemove shader, 50/50 centering overlay, and PSA acrylic slab) are completely functional in CSS, but the card back SVG should point to the real card back asset.
- **Toast System**: Needs a 10-line fix in `js/app.js:showToast` to enforce singleton behavior (`container.innerHTML = ''`, timer cancellation) and change auto-dismiss duration from `3800ms` to `2500ms`.
- **Cart Removal & Undo**: Fully implemented with modal `#delete-confirm-modal` and `#undo-banner`; fully aligns with Acceptance Criteria 58 once verified.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Asset File Exists & Properties**:
   ```powershell
   # Run with BypassSandbox or direct check:
   Get-Item "C:\Users\patri\.gemini\antigravity\brain\81d26242-cfdc-492f-a712-669157c1638a\.user_uploaded\*" | Select-Object Name, Length
   Get-ChildItem "c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\cards"
   Get-ChildItem "c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\sealed"
   ```

2. **Verify PDP Rendering & Conditional Logic**:
   - Inspect `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`, lines 141-260: Confirm lack of check for `product.categoria === 'sealed'` or `tipo_discriminador`.
   - Inspect `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\css\styles.css`, lines 167-245: Confirm `.card-3d-scene`, `.card-3d-object.is-flipped-y`, `.holo-sheen-layer`, and `.centering-grid-overlay`.

3. **Verify Toast Notification Logic**:
   - Inspect `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js`, line 523: Confirm `setTimeout(..., 3800)` and `container.appendChild(toast)` without singleton guard.

4. **Verify Cart Removal and Undo**:
   - Inspect `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js`, lines 222-285: Confirm `requestRemoveItem`, `confirmRemoveItem`, and `undoLastDeletion`.
   - Inspect `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\index.html`, lines 267-291 (`#undo-banner`) and lines 375-403 (`#delete-confirm-modal`).
