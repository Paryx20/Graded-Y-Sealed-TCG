# Implementation Blueprint & Handoff Report: Requirements R1, R2, and R3

**Agent**: `explorer_m1_v3_1`  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_m1_v3_1`  
**Parent Orchestrator ID**: `cbdda2aa-4562-4fed-ac08-7fe27ee601f8`  
**Date**: 2026-11-02  
**Scope**: Requirements R1 (PDP PSA Condition Buttons Exclusive Checkmark), R2 (PDP Statistics Box Removal & Price Clarity), R3 (3D Card Viewer Clean Reverse Side), and Downstream Test Suite Updates.

---

## 1. Observation

### 1.1 R1: Condition Buttons Checkmark Defect
- **Target File**: `js/views/pdp.js`
- **Initial Render (`js/views/pdp.js:420-435`)**:
```javascript
420:                     ].map(item => {
421:                       const isActive = condition === item.key;
422:                       return `
423:                         <button 
424:                           type="button" 
425:                           onclick="PDPView.selectCondition('${item.key}')" 
426:                           class="p-3 rounded-xl text-left transition ${isActive ? 'bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]' : 'bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]'}"
427:                         >
428:                           <div class="text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}">
429:                             <span>${item.title}</span>
430:                             ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>' : ''}
431:                           </div>
432:                           <div class="text-sm font-black mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}">
433:                             $${Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
434:                           </div>
435:                         </button>
436:                       `;
```
- **Runtime Defect in `selectCondition` (`js/views/pdp.js:778-788`)**:
```javascript
778:         const headerDiv = btn.querySelector('div:first-child');
779:         if (headerDiv) {
780:           headerDiv.className = `text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}`;
781:           let checkIcon = headerDiv.querySelector('i');
782:           if (isActive && !checkIcon) {
783:             headerDiv.insertAdjacentHTML('beforeend', '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>');
784:             if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
785:           } else if (!isActive && checkIcon) {
786:             checkIcon.remove();
787:           }
788:         }
```
- **Verbatim Error Mechanism**: In standard browser execution (`js/app.js:158-160` and `pdp.js:784`), `lucide.createIcons()` converts `<i data-lucide="check">` into `<svg class="lucide lucide-check w-3.5 h-3.5 text-[#059669]">`. When a user subsequently clicks another button, `headerDiv.querySelector('i')` at line 781 returns `null` because the tag is now `<svg>`. Therefore, line 785 (`else if (!isActive && checkIcon)`) evaluates to `false`, and `checkIcon.remove()` is never called. The previously selected button's SVG checkmark remains visible. Clicking across multiple condition buttons permanently accumulates checkmarks on all clicked buttons simultaneously (as evidenced in user reference Captura 4).

### 1.2 R2: Market History Statistics Box & Price Placement
- **Target File**: `js/views/pdp.js`
- **Statistics Box Markup (`js/views/pdp.js:441-468`)**:
```javascript
441:               <div class="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4">
442:                 <div class="flex items-center justify-between">
443:                   <span class="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
444:                     <i data-lucide="trending-up" class="w-4 h-4 text-[#059669]"></i>
445:                     <span>Historial de Mercado Actual (12 meses)</span>
446:                   </span>
447:                   <span id="market-trend-pill" class="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">${product.tendencia12m || '+16.5%'}</span>
448:                 </div>
449:                 <p class="text-[11px] text-slate-500 mt-0.5">Pasa el cursor por la curva para inspeccionar precios históricos mes a mes</p>
450: 
451:                 <div id="pdp-chart-container" class="w-full h-36 mt-3 relative select-none">
452:                   <svg id="pdp-interactive-chart" viewBox="0 0 400 130" class="w-full h-full overflow-visible" aria-label="Gráfica interactiva de tendencia de precio a 12 meses">
453:                     <line x1="20" y1="105" x2="380" y2="105" stroke="#E2E8F0" stroke-width="1.5" />
454:                     <line x1="20" y1="65" x2="380" y2="65" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
455:                     <line x1="20" y1="25" x2="380" y2="25" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
456:                     <line id="chart-guide-line" x1="0" y1="15" x2="0" y2="115" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3,3" style="display:none;" />
457:                     <polyline id="chart-polyline" points="30,85 110,75 190,80 270,50 370,25" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
458:                     <circle id="chart-hover-dot" cx="0" cy="0" r="5" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" style="display:none;" />
459:                     <circle id="chart-active-dot" cx="370" cy="25" r="5.5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />
460:                     <text x="30" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Oct 2025</text>
461:                     <text x="143" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Feb 2026</text>
462:                     <text x="256" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Jun 2026</text>
463:                     <text x="370" y="122" fill="#0F172A" font-size="9" font-weight="bold" text-anchor="middle">Hoy</text>
464:                   </svg>
465:                   <div id="chart-hover-tooltip" class="chart-tooltip absolute z-20 opacity-0"></div>
466:                 </div>
467:               </div>
468:             `}
```
- **Prominent Price Display (`js/views/pdp.js:470-476`)**:
```javascript
470:             <div class="pt-3 border-t border-slate-200">
471:               <div class="flex items-baseline justify-between">
472:                 <span id="pdp-price" class="text-3xl font-black text-[#0F172A]">$${Number(currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
473:                 <span class="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-md">
474:                   En Stock • Custodia Bóveda
475:                 </span>
476:               </div>
```
- **Lifecycle Calls (`js/views/pdp.js:519-523` and `796-799`)**:
  * `afterRender`: `this.drawChart(); this.bindChartEvents();`
  * `selectCondition`: `if (typeof this.drawChart === 'function') { this.drawChart(); }`

### 1.3 R3: 3D Card Viewer Centering Overlay
- **Target File**: `js/views/pdp.js` & `css/styles.css`
- **Reverse Face Markup (`js/views/pdp.js:122-140`)**:
```javascript
122:           <div class="card-3d-face card-3d-back p-2">
123:             <div class="relative inline-flex items-center justify-center max-h-[350px]">
124:               <img 
125:                 src="img/cards/card-back.png" 
126:                 class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl pointer-events-none select-none" 
127:                 draggable="false"
128:                 alt="Reverso de carta Pokémon" 
129:                 onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
130:               />
131:               <div class="centering-grid-overlay">
132:                 <span class="absolute top-2 left-2 bg-[#0F172A]/90 text-[#FEF3C7] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#D97706]/50">
133:                   EJE X: 50.0% / 50.0%
134:                 </span>
135:                 <span class="absolute bottom-2 right-2 bg-[#059669]/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
136:                   EJE Y: 50.0% / 50.0% • BORDES OK
137:                 </span>
138:               </div>
139:             </div>
140:           </div>
```
- **CSS Grid Styles (`css/styles.css:245-269`)**:
```css
245: .centering-grid-overlay {
246:   position: absolute;
247:   inset: 0;
248:   pointer-events: none;
249:   border: 2px dashed rgba(251, 191, 36, 0.85);
250:   border-radius: 0.75rem;
251: }
252: 
253: .centering-grid-overlay::before {
254:   content: '';
255:   position: absolute;
256:   top: 0;
257:   bottom: 0;
258:   left: 50%;
259:   border-left: 1.5px dashed rgba(56, 189, 248, 0.85);
260: }
261: 
262: .centering-grid-overlay::after {
263:   content: '';
264:   position: absolute;
265:   left: 0;
266:   right: 0;
267:   top: 50%;
268:   border-top: 1.5px dashed rgba(56, 189, 248, 0.85);
269: }
```
- **Inspector Mode Label (`js/views/pdp.js:366`)**:
```javascript
366:                     <span class="text-[11px] text-slate-500 mt-0.5">Centrado 50/50 (Giro 3D Y)</span>
```

### 1.4 Downstream Test Suite Assertions
- **Command**: `node --test tests/*.test.mjs`
- **Current Baseline**: 308 tests pass, 0 fail.
- **Affected Existing Test Assertions in `tests/test_pdp.test.mjs`**:
  * Line 347: `assert.ok(html.includes('centering-grid-overlay'));`
  * Lines 354-355: `assert.ok(html.includes('EJE X: 50.0% / 50.0%'));` & `assert.ok(html.includes('EJE Y: 50.0% / 50.0% • BORDES OK'));`
  * Line 443: `assert.ok(html.includes('id="pdp-interactive-chart"'));`
- **Affected Standalone Script `tests/stress_verification_m1.mjs`**:
  * Lines 363-364: `assert(inspectorHtml.includes('centering-grid-overlay'), ...);` & `assert(inspectorHtml.includes('EJE X: 50.0% / 50.0%'), ...);`

---

## 2. Logic Chain

1. **R1 Deduction**:
   - Initial rendering places `<i data-lucide="check">` on the single active condition button.
   - Lucide turns this `<i>` element into an `<svg class="lucide lucide-check">`.
   - On condition change, `selectCondition()` loops over all condition buttons. For the formerly active button, searching only for `'i'` returns `null`, preventing removal.
   - Querying for both `i` and `svg` (and `[data-lucide="check"]`) and removing all matches from inactive buttons ensures that any previously rendered icon is purged regardless of whether Lucide has replaced it or not.
   - Furthermore, purging icons before re-adding on the active button prevents accidental accumulation if the active button is clicked repeatedly.
   - Filtering `headerDiv.children` when it is an Array guarantees backward compatibility with lightweight `MockDOMElement` classes in unit tests.

2. **R2 Deduction**:
   - The market history statistics card (`js/views/pdp.js:441-467`) is an independent visual container placed between the PSA grading buttons (`div role="radiogroup"`) and the price container (`div pt-3 border-t`).
   - Removing lines 441-467 completely eliminates the box, SVG curve, and percentage indicator from the DOM.
   - Retaining line 468 (`            `}`) properly terminates the template literal expression `${isSealed ? ... : ...}`.
   - `#pdp-price` (`text-3xl font-black text-[#0F172A]`) directly follows this closure and is immediately visible beneath the grading buttons.
   - In `afterRender()` and `selectCondition()`, guarding chart lifecycle methods with `if (document.getElementById('pdp-interactive-chart'))` guarantees zero unhandled exceptions when navigating or switching conditions on single cards.
   - `selectCondition()` continues updating `#pdp-price` via `priceEl.innerText = ...` dynamically and accurately on every condition click ($750 -> $1,800 -> $4,850 -> $18,500).

3. **R3 Deduction**:
   - In `renderInspectorStage()`, the `.card-3d-back` face wraps the card back `<img>` and the `.centering-grid-overlay` containing the coordinate spans.
   - Removing lines 131-138 eliminates the entire overlay container and coordinate text, leaving solely the authentic Pokémon card back `<img>` inside the container.
   - In `css/styles.css:245-269`, replacing the dashed borders and crosshair pseudo-elements with `.centering-grid-overlay { display: none !important; }` guarantees that no residual lines can render.
   - Updating line 366 in `pdp.js` from `Centrado 50/50 (Giro 3D Y)` to `Reverso oficial (Giro 3D Y)` aligns the mode selector label with the clean inspection experience.

4. **Test Harmonization Deduction**:
   - Inverting the assertions in `tests/test_pdp.test.mjs` lines 343-356 to assert that `centering-grid-overlay`, `EJE X`, and `EJE Y` are NOT present aligns the test suite with R3 acceptance criteria.
   - Inverting the assertion in line 443 to assert that `pdp-interactive-chart` is NOT present and asserting that `#pdp-price` is present validates R2 acceptance criteria.
   - Adding a dedicated unit test in `tests/test_pdp.test.mjs` verifying that sequential clicking across all condition grades results in strictly one checkmark at any time enforces R1 mutual exclusivity and prevents future regressions.

---

## 3. Caveats

1. **Mock DOM vs. Browser DOM Compatibility**:
   - Test suites (`test_condition_pricing.test.mjs` and `test_challenger_m1_adversarial.test.mjs`) use minimalist `MockDOMElement` objects whose `querySelectorAll` only handles `'button'` and whose `children` is a plain JavaScript Array.
   - The proposed R1 replacement logic includes defensive guards: it calls `.remove()` if available, and also safely filters `Array.isArray(headerDiv.children)` so both real DOM (`NodeList`/`HTMLCollection`) and mock environments execute cleanly.
2. **Chart Method Preservation**:
   - The private helper methods `drawChart()` and `bindChartEvents()` in `js/views/pdp.js:866-1020` should be preserved rather than deleted. They already possess internal guards (`if (!svg) return;`). Preserving them while adding the lifecycle call guards in `afterRender()` and `selectCondition()` prevents breaking any external/test callers expecting method existence.
3. **Sealed Products vs Single Cards**:
   - Sealed products (`isSealed = true`) render factory specs via `this.renderFactorySpecs(product)` and do not render the PSA condition radiogroup or 3D card back. The edits strictly target the non-sealed branches, maintaining full integrity for sealed booster boxes and tins.

---

## 4. Conclusion & Implementation Blueprint for Worker

The Worker agent must apply the following exact modifications across 3 files:
1. `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
2. `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\css\styles.css`
3. `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\tests\test_pdp.test.mjs` (and optionally `tests/stress_verification_m1.mjs`)

### 4.1 Target 1: `js/views/pdp.js` (R3 - Clean 3D Card Viewer Reverse)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Remove centering grid overlay and coordinate labels from back face.
- **StartLine**: 122
- **EndLine**: 140
- **Target Content**:
```javascript
          <div class="card-3d-face card-3d-back p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                src="img/cards/card-back.png" 
                class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl pointer-events-none select-none" 
                draggable="false"
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
```
- **Replacement Content**:
```javascript
          <div class="card-3d-face card-3d-back p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                src="img/cards/card-back.png" 
                class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl pointer-events-none select-none" 
                draggable="false"
                alt="Reverso de carta Pokémon" 
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
            </div>
          </div>
```

### 4.2 Target 2: `js/views/pdp.js` (R3 - Update Inspector Mode Subtitle)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Update button subtitle from "Centrado 50/50" to "Reverso oficial".
- **StartLine**: 362
- **EndLine**: 368
- **Target Content**:
```javascript
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-[#0F172A]">Reverso y Bordes</span>
                      <i data-lucide="flip-horizontal" class="w-4 h-4 ${mode === 'back' ? 'text-[#E11D48]' : 'text-slate-400'}"></i>
                    </div>
                    <span class="text-[11px] text-slate-500 mt-0.5">Centrado 50/50 (Giro 3D Y)</span>
```
- **Replacement Content**:
```javascript
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-[#0F172A]">Reverso y Bordes</span>
                      <i data-lucide="flip-horizontal" class="w-4 h-4 ${mode === 'back' ? 'text-[#E11D48]' : 'text-slate-400'}"></i>
                    </div>
                    <span class="text-[11px] text-slate-500 mt-0.5">Reverso oficial (Giro 3D Y)</span>
```

### 4.3 Target 3: `js/views/pdp.js` (R2 - Remove Market History Statistics Box)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Completely remove 12-month market chart box, retaining closing brace and prominent `#pdp-price`.
- **StartLine**: 438
- **EndLine**: 472
- **Target Content**:
```javascript
                </div>
              </div>

              <div class="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
                    <i data-lucide="trending-up" class="w-4 h-4 text-[#059669]"></i>
                    <span>Historial de Mercado Actual (12 meses)</span>
                  </span>
                  <span id="market-trend-pill" class="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">${product.tendencia12m || '+16.5%'}</span>
                </div>
                <p class="text-[11px] text-slate-500 mt-0.5">Pasa el cursor por la curva para inspeccionar precios históricos mes a mes</p>

                <div id="pdp-chart-container" class="w-full h-36 mt-3 relative select-none">
                  <svg id="pdp-interactive-chart" viewBox="0 0 400 130" class="w-full h-full overflow-visible" aria-label="Gráfica interactiva de tendencia de precio a 12 meses">
                    <line x1="20" y1="105" x2="380" y2="105" stroke="#E2E8F0" stroke-width="1.5" />
                    <line x1="20" y1="65" x2="380" y2="65" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
                    <line x1="20" y1="25" x2="380" y2="25" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
                    <line id="chart-guide-line" x1="0" y1="15" x2="0" y2="115" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3,3" style="display:none;" />
                    <polyline id="chart-polyline" points="30,85 110,75 190,80 270,50 370,25" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    <circle id="chart-hover-dot" cx="0" cy="0" r="5" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" style="display:none;" />
                    <circle id="chart-active-dot" cx="370" cy="25" r="5.5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />
                    <text x="30" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Oct 2025</text>
                    <text x="143" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Feb 2026</text>
                    <text x="256" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Jun 2026</text>
                    <text x="370" y="122" fill="#0F172A" font-size="9" font-weight="bold" text-anchor="middle">Hoy</text>
                  </svg>
                  <div id="chart-hover-tooltip" class="chart-tooltip absolute z-20 opacity-0"></div>
                </div>
              </div>
            `}

            <div class="pt-3 border-t border-slate-200">
```
- **Replacement Content**:
```javascript
                </div>
              </div>
            `}

            <div class="pt-3 border-t border-slate-200">
```

### 4.4 Target 4: `js/views/pdp.js` (R2 - Guard Chart Calls in `afterRender`)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Guard chart drawing and event binding in `afterRender()`.
- **StartLine**: 518
- **EndLine**: 524
- **Target Content**:
```javascript
  afterRender() {
    this.drawChart();
    this.bindChartEvents();
    this.bindCard3DController();
  },
```
- **Replacement Content**:
```javascript
  afterRender() {
    if (document.getElementById('pdp-interactive-chart')) {
      this.drawChart();
      this.bindChartEvents();
    }
    this.bindCard3DController();
  },
```

### 4.5 Target 5: `js/views/pdp.js` (R1 - Mutually Exclusive Condition Checkmark)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Ensure all check icons (both `<i>` and `<svg>`) are removed from inactive buttons and exactly one is inserted on active button.
- **StartLine**: 778
- **EndLine**: 788
- **Target Content**:
```javascript
        const headerDiv = btn.querySelector('div:first-child');
        if (headerDiv) {
          headerDiv.className = `text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}`;
          let checkIcon = headerDiv.querySelector('i');
          if (isActive && !checkIcon) {
            headerDiv.insertAdjacentHTML('beforeend', '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>');
            if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
          } else if (!isActive && checkIcon) {
            checkIcon.remove();
          }
        }
```
- **Replacement Content**:
```javascript
        const headerDiv = btn.querySelector('div:first-child');
        if (headerDiv) {
          headerDiv.className = `text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}`;
          
          // Requirement R1: Remove all check icons (both initial <i> and Lucide-rendered <svg>)
          const existingIcons = headerDiv.querySelectorAll ? headerDiv.querySelectorAll('i, svg, [data-lucide="check"]') : [];
          if (existingIcons.length > 0) {
            existingIcons.forEach(icon => {
              if (typeof icon.remove === 'function') icon.remove();
            });
          }
          // Direct fallback removals for single-query mocks
          const iIcon = headerDiv.querySelector ? headerDiv.querySelector('i') : null;
          if (iIcon && typeof iIcon.remove === 'function') iIcon.remove();
          const svgIcon = headerDiv.querySelector ? headerDiv.querySelector('svg') : null;
          if (svgIcon && typeof svgIcon.remove === 'function') svgIcon.remove();

          // Array-based children cleanup for test mock environments
          if (Array.isArray(headerDiv.children)) {
            headerDiv.children = headerDiv.children.filter(c => c && c.tagName !== 'I' && c.tagName !== 'SVG');
          }

          // If active, insert exactly one check icon and initialize with Lucide
          if (isActive) {
            headerDiv.insertAdjacentHTML('beforeend', '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>');
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
              lucide.createIcons();
            }
          }
        }
```

### 4.6 Target 6: `js/views/pdp.js` (R2 - Guard Chart Call in `selectCondition`)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\pdp.js`
- **Action**: Guard `drawChart()` call in `selectCondition()`.
- **StartLine**: 795
- **EndLine**: 801
- **Target Content**:
```javascript
    // 4. Update market chart & trend badge
    if (typeof this.drawChart === 'function') {
      this.drawChart();
    }
```
- **Replacement Content**:
```javascript
    // 4. Update market chart & trend badge (if chart is rendered)
    if (document.getElementById('pdp-interactive-chart') && typeof this.drawChart === 'function') {
      this.drawChart();
    }
```

### 4.7 Target 7: `css/styles.css` (R3 - Suppress Centering Grid Overlay)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\css\styles.css`
- **Action**: Suppress centering grid overlay borders and pseudo-elements.
- **StartLine**: 244
- **EndLine**: 270
- **Target Content**:
```css
.centering-grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 2px dashed rgba(251, 191, 36, 0.85);
  border-radius: 0.75rem;
}

.centering-grid-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 1.5px dashed rgba(56, 189, 248, 0.85);
}

.centering-grid-overlay::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1.5px dashed rgba(56, 189, 248, 0.85);
}
```
- **Replacement Content**:
```css
/* Requirement R3: 3D Card Viewer Clean Reverse Side - Centering grid overlay eliminated */
.centering-grid-overlay {
  display: none !important;
}
```

### 4.8 Target 8: `tests/test_pdp.test.mjs` (R3 - Update Backface Assertions)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\tests\test_pdp.test.mjs`
- **Action**: Assert absence of `centering-grid-overlay`, `EJE X`, and `EJE Y`.
- **StartLine**: 342
- **EndLine**: 357
- **Target Content**:
```javascript
test('Feature 4 [Tier 1]: 3D Inspector Back - Displays centering grid overlay', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('centering-grid-overlay'));
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Centering indicators display 50/50 alignment metrics', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('EJE X: 50.0% / 50.0%'));
  assert.ok(html.includes('EJE Y: 50.0% / 50.0% • BORDES OK'));
});
```
- **Replacement Content**:
```javascript
test('Feature 4 [Tier 1]: 3D Inspector Back - Clean reverse side without centering grid overlay (Requirement R3)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('img/cards/card-back.png'), 'Card back image must be present');
  assert.ok(!html.includes('centering-grid-overlay'), 'centering-grid-overlay must NOT be present');
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Clean reverse side without coordinate labels (Requirement R3)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(!html.includes('EJE X: 50.0% / 50.0%'), 'EJE X coordinate label must NOT be present');
  assert.ok(!html.includes('EJE Y: 50.0% / 50.0% • BORDES OK'), 'EJE Y coordinate label must NOT be present');
});
```

### 4.9 Target 9: `tests/test_pdp.test.mjs` (R2 - Update Chart Removal Assertion & R1 Unit Test Addition)
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\tests\test_pdp.test.mjs`
- **Action**: Update line 443 chart check to assert absence and add new R1 mutual exclusivity unit test.
- **StartLine**: 436
- **EndLine**: 445
- **Target Content**:
```javascript
test('Feature 6 [Tier 1]: Adaptive PDP - Single card shows 3D inspector modes & 12-month quotation chart', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  Store.data.currentPdpProduct = card;
  const html = PDPView.render();
  assert.ok(html.includes('Modos del inspector de carta'));
  assert.ok(html.includes('id="pdp-3d-scene"'));
  assert.ok(html.includes('id="pdp-interactive-chart"'));
});
```
- **Replacement Content**:
```javascript
test('Feature 6 [Tier 1]: Adaptive PDP - Single card shows 3D inspector modes & prominent condition pricing without market chart (Requirement R2)', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  Store.data.currentPdpProduct = card;
  const html = PDPView.render();
  assert.ok(html.includes('Modos del inspector de carta'));
  assert.ok(html.includes('id="pdp-3d-scene"'));
  assert.ok(!html.includes('id="pdp-interactive-chart"'), 'Market trend chart must be removed');
  assert.ok(!html.includes('Historial de Mercado Actual'), 'Market history title must be removed');
  assert.ok(html.includes('id="pdp-price"'), 'Price must remain prominently displayed');
});

test('Requirement R1 [Unit]: PDP Condition Buttons - Exclusive checkmark across sequential condition switches', () => {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  // Build simulated DOM nodes supporting Lucide SVG transformation and removal
  class MockNode {
    constructor(tagName, id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.className = className;
      this.children = [];
      this.attributes = new Map();
      this.parentElement = null;
    }
    setAttribute(k, v) { this.attributes.set(k, v); }
    getAttribute(k) { return this.attributes.get(k); }
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    insertAdjacentHTML(position, html) {
      if (html.includes('<i data-lucide="check"')) {
        const icon = new MockNode('i', '', 'w-3.5 h-3.5 text-[#059669]');
        icon.setAttribute('data-lucide', 'check');
        this.appendChild(icon);
      }
    }
    remove() {
      if (this.parentElement) {
        const idx = this.parentElement.children.indexOf(this);
        if (idx !== -1) this.parentElement.children.splice(idx, 1);
        this.parentElement = null;
      }
    }
    querySelector(selector) {
      if (selector === 'div:first-child') return this.children[0] || null;
      if (selector === 'div:last-child') return this.children[this.children.length - 1] || null;
      if (selector === 'i') return this.children.find(c => c.tagName === 'I') || null;
      if (selector === 'svg') return this.children.find(c => c.tagName === 'SVG') || null;
      return null;
    }
    querySelectorAll(selector) {
      if (selector === 'button') {
        return this.children.filter(c => c.tagName === 'BUTTON');
      }
      if (selector.includes('i') || selector.includes('svg') || selector.includes('check')) {
        return this.children.filter(c => 
          c.tagName === 'I' || 
          c.tagName === 'SVG' || 
          c.getAttribute('data-lucide') === 'check' || 
          (c.className && c.className.includes('lucide-check'))
        );
      }
      return [];
    }
  }

  // Construct DOM radiogroup with 4 condition buttons
  const radiogroup = new MockNode('div');
  radiogroup.setAttribute('role', 'radiogroup');
  radiogroup.setAttribute('aria-label', 'Condición de la carta');

  const btnKeys = ['raw', 'psa8', 'psa9', 'psa10'];
  const buttons = btnKeys.map((key) => {
    const btn = new MockNode('button');
    const headerDiv = new MockNode('div');
    const titleSpan = new MockNode('span');
    titleSpan.innerText = key.toUpperCase();
    headerDiv.appendChild(titleSpan);
    const priceDiv = new MockNode('div');
    btn.appendChild(headerDiv);
    btn.appendChild(priceDiv);
    radiogroup.appendChild(btn);
    return btn;
  });

  // Simulated Lucide createIcons implementation: transforms <i> tags into <svg>
  const lucideMock = {
    createIcons: () => {
      buttons.forEach(btn => {
        const header = btn.querySelector('div:first-child');
        const iconI = header.querySelector('i');
        if (iconI && iconI.getAttribute('data-lucide') === 'check') {
          const svg = new MockNode('svg', '', 'lucide lucide-check w-3.5 h-3.5 text-[#059669]');
          svg.setAttribute('data-lucide', 'check');
          iconI.remove();
          header.appendChild(svg);
        }
      });
    }
  };

  const elementsMap = new Map([
    ['pdp-price', new MockNode('span', 'pdp-price')],
    ['pdp-cert-badge', new MockNode('span', 'pdp-cert-badge')]
  ]);

  const sandbox = {
    console,
    Math,
    document: {
      getElementById: (id) => elementsMap.get(id) || null,
      querySelector: (selector) => {
        if (selector === '[role="radiogroup"][aria-label="Condición de la carta"]') return radiogroup;
        return null;
      }
    },
    lucide: lucideMock,
    app: { showToast: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);

  const { PDPView, Store, PRODUCTS } = sandbox;
  Store.data.currentPdpProduct = PRODUCTS[0];

  const getCheckmarkStatus = () => {
    return buttons.map((btn, idx) => {
      const header = btn.querySelector('div:first-child');
      const hasIcon = header.children.some(c => 
        c.tagName === 'I' || 
        c.tagName === 'SVG' || 
        c.getAttribute('data-lucide') === 'check'
      );
      return { key: btnKeys[idx], hasIcon };
    });
  };

  // Test sequential condition switching: raw -> psa8 -> psa9 -> psa10 -> raw
  const sequence = ['raw', 'psa8', 'psa9', 'psa10', 'raw'];
  for (const selectedKey of sequence) {
    PDPView.selectCondition(selectedKey);
    const statuses = getCheckmarkStatus();
    const activeWithIcon = statuses.filter(s => s.hasIcon);

    assert.equal(activeWithIcon.length, 1, `Exactly ONE button must display a checkmark when '${selectedKey}' is selected. Got ${activeWithIcon.length} buttons.`);
    assert.equal(activeWithIcon[0].key, selectedKey, `The checkmark must be on '${selectedKey}', but was on '${activeWithIcon[0].key}'.`);

    // Verify all other 3 buttons have zero checkmarks
    statuses.filter(s => s.key !== selectedKey).forEach(inactive => {
      assert.equal(inactive.hasIcon, false, `Inactive button '${inactive.key}' must NOT display a checkmark.`);
    });
  }
});
```

### 4.10 Target 10 (Optional/Recommended): `tests/stress_verification_m1.mjs`
- **Target File**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\tests\stress_verification_m1.mjs`
- **Action**: Update obsolete assertions at lines 363-364 to negative assertions.
- **StartLine**: 361
- **EndLine**: 365
- **Target Content**:
```javascript
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', 'back');
assert(inspectorHtml.includes('is-flipped-y'), 'Back mode applies 180° Y-rotation class (is-flipped-y)');
assert(inspectorHtml.includes('centering-grid-overlay'), 'Back mode renders 50/50 centering grid overlay');
assert(inspectorHtml.includes('EJE X: 50.0% / 50.0%'), 'Back mode displays 50/50 crosshair calibration metrics');
```
- **Replacement Content**:
```javascript
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', 'back');
assert(inspectorHtml.includes('is-flipped-y'), 'Back mode applies 180° Y-rotation class (is-flipped-y)');
assert(!inspectorHtml.includes('centering-grid-overlay'), 'Back mode eliminates centering grid overlay (Requirement R3)');
assert(!inspectorHtml.includes('EJE X: 50.0% / 50.0%'), 'Back mode eliminates 50/50 crosshair calibration metrics (Requirement R3)');
```

---

## 5. Verification Method

### 5.1 Automated Test Suite Verification
Execute the project test command in terminal:
```powershell
node --test tests/*.test.mjs
```
**Expected Output**:
- All suites pass cleanly.
- Test pass count increases from 308 to 309 (reflecting the new `Requirement R1 [Unit]` test).
- Zero test failures, zero unhandled rejections.

### 5.2 Manual Browser Verification Checklist
1. **R1 (PDP PSA Condition Buttons Exclusive Checkmark)**:
   - Navigate to `#pdp?id=charizard-base`.
   - On initial load, verify only `PSA 10 GEM MT` displays the green checkmark (`data-lucide="check"` / `<svg class="lucide lucide-check">`).
   - Click `Raw / NM`: verify the checkmark moves to `Raw / NM` and immediately vanishes from `PSA 10`.
   - Click `PSA 8 NM-MT`: verify checkmark moves to `PSA 8` and vanishes from `Raw`.
   - Click `PSA 9 MINT`: verify checkmark moves to `PSA 9` and vanishes from `PSA 8`.
   - Confirm that at no point do two or more checkmarks appear simultaneously.
2. **R2 (PDP Statistics Box Removal & Price Clarity)**:
   - On the same PDP view, inspect the right column between the PSA condition buttons and the CTA buttons.
   - Confirm that the box titled "Historial de Mercado Actual (12 meses)", the SVG polyline chart (`#pdp-interactive-chart`), and trend pills are completely gone.
   - Confirm `#pdp-price` is prominently rendered immediately below the condition buttons.
   - Switching conditions updates `#pdp-price` dynamically ($750.00 -> $1,800.00 -> $4,850.00 -> $18,500.00) without any console errors.
3. **R3 (3D Card Viewer Clean Reverse Side)**:
   - In the 3D card inspector, click "Reverso y Bordes" or drag the card 180° horizontally to reveal the back.
   - Confirm that the reverse side displays only the Pokémon card back artwork.
   - Confirm there are zero dashed yellow/cyan lines and no text badges ("EJE X: 50.0% / 50.0%", "EJE Y: 50.0% • BORDES OK").

### 5.3 Invalidation Conditions
- Any checkmark remains visible on an inactive condition button after clicking another button.
- The 12-month market chart or "Historial de Mercado" appears anywhere on `#pdp`.
- `#pdp-price` fails to dynamically update or throws an exception upon condition selection.
- Centering grid dashed lines or coordinate text appear on the reverse face of the 3D card viewer.
- Any automated test in `tests/*.test.mjs` fails.
