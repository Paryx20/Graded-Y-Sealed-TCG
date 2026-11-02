# Handoff Report: Survey Investigation for Requirements R1, R2, and R3

**Agent**: `explorer_survey_v3_1`  
**Date**: 2026-11-02  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_v3_1`  
**Parent Orchestrator ID**: `cbdda2aa-4562-4fed-ac08-7fe27ee601f8`

---

## 1. Executive Summary

A comprehensive read-only code and asset survey was conducted across `js/views/pdp.js`, `css/styles.css`, `index.html`, `js/app.js`, `tests/test_pdp.test.mjs`, and reference user artifacts (Capturas 1, 3, and 4) to investigate Requirements R1, R2, and R3:

1. **R1 (PDP PSA Condition Buttons Exclusive Checkmark)**: Identified exact root cause in `js/views/pdp.js:781-787`. When condition buttons are switched via `selectCondition(condKey)`, the DOM query searches only for `i` elements (`headerDiv.querySelector('i')`). However, `lucide.createIcons()` converts `<i>` icons into `<svg class="lucide lucide-check ...">`. Because `querySelector('i')` returns `null` for the previously active button's SVG checkmark, the removal code (`checkIcon.remove()`) never runs. Consequently, every button clicked permanently retains its checkmark, resulting in multiple simultaneous checkmarks as depicted in Captura 4.
2. **R2 (PDP Statistics Box Removal and Price Clarity)**: Located the entire 12-month market history box in `js/views/pdp.js:441-468` (`#pdp-chart-container`, SVG `#pdp-interactive-chart`, `#market-trend-pill`). Removing this block cleanly places the prominent card price element `#pdp-price` (`js/views/pdp.js:470-476`) directly beneath the PSA condition selection buttons. Secondary chart hooks in `afterRender()` (`pdp.js:520-521`) and `selectCondition()` (`pdp.js:797-799`) must also be cleaned/safeguarded.
3. **R3 (3D Card Viewer Clean Reverse Side)**: Located the dashed centering grid and calibration coordinate labels in `js/views/pdp.js:131-138` (`.centering-grid-overlay`, `EJE X: 50.0% / 50.0%`, `EJE Y: 50.0% / 50.0% • BORDES OK`). Deleting lines 131-138 restores an entirely clean Pokémon card back artwork (`img/cards/card-back.png`) as shown in Captura 3. Associated CSS is in `css/styles.css:245-269`.
4. **Test Suite Impact**: In `tests/test_pdp.test.mjs`, tests at lines 343-356 assert the presence of `centering-grid-overlay` and `EJE X/Y`, and line 443 asserts `id="pdp-interactive-chart"`. These tests must be updated to assert the clean reverse side and the removal of the chart.

---

## 2. Observation

### Observation 1.1: Condition Button Initial Rendering (R1)
- **File**: `js/views/pdp.js`
- **Lines 413-437**:
```javascript
413:                   ${(() => {
414:                     const condPrices = this.getConditionPrices(product);
415:                     return [
416:                       { key: 'raw', title: 'Raw / NM', price: condPrices.raw },
417:                       { key: 'psa8', title: 'PSA 8 NM-MT', price: condPrices.psa8 },
418:                       { key: 'psa9', title: 'PSA 9 MINT', price: condPrices.psa9 },
419:                       { key: 'psa10', title: 'PSA 10 GEM MT', price: condPrices.psa10 }
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
437:                     }).join('');
```

### Observation 1.2: Condition Button Selection & Checkmark Failure (R1)
- **File**: `js/views/pdp.js`
- **Lines 765-794**:
```javascript
765:     // 3. Update condition radiogroup button styles
766:     const radiogroup = document.querySelector('[role="radiogroup"][aria-label="Condición de la carta"]');
767:     if (radiogroup) {
768:       const buttons = radiogroup.querySelectorAll('button');
769:       const keys = ['raw', 'psa8', 'psa9', 'psa10'];
770:       buttons.forEach((btn, idx) => {
771:         const key = keys[idx];
772:         const isActive = key === condKey;
773:         if (isActive) {
774:           btn.className = 'p-3 rounded-xl text-left transition bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]';
775:         } else {
776:           btn.className = 'p-3 rounded-xl text-left transition bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]';
777:         }
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
789:         const priceDiv = btn.querySelector('div:last-child');
790:         if (priceDiv) {
791:           priceDiv.className = `text-sm font-black mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}`;
792:         }
793:       });
794:     }
```

### Observation 1.3: Lucide SVG Transformation (R1)
- **File**: `js/app.js`
- **Lines 157-160**:
```javascript
157:     container.innerHTML = html;
158:     if (typeof lucide !== 'undefined' && lucide.createIcons) {
159:       lucide.createIcons();
160:     }
```
`lucide.createIcons()` scans the DOM for `<i data-lucide="...">` tags and replaces them with `<svg class="lucide lucide-... ...">`.

### Observation 2.1: Market History Box Markup & Price Placement (R2)
- **File**: `js/views/pdp.js`
- **Lines 441-476**:
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
469: 
470:             <div class="pt-3 border-t border-slate-200">
471:               <div class="flex items-baseline justify-between">
472:                 <span id="pdp-price" class="text-3xl font-black text-[#0F172A]">$${Number(currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
473:                 <span class="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-md">
474:                   En Stock • Custodia Bóveda
475:                 </span>
476:               </div>
```

### Observation 2.2: Market Chart JavaScript Functions (R2)
- **File**: `js/views/pdp.js`
- **Lines 519-523 (`afterRender`)**:
```javascript
519:   afterRender() {
520:     this.drawChart();
521:     this.bindChartEvents();
522:     this.bindCard3DController();
523:   },
```
- **Lines 796-799 (`selectCondition`)**:
```javascript
796:     // 4. Update market chart & trend badge
797:     if (typeof this.drawChart === 'function') {
798:       this.drawChart();
799:     }
```
- **Lines 866-1020 (`drawChart` & `bindChartEvents`)**: Render SVG points and bind pointer events.

### Observation 3.1: 3D Card Viewer Reverse Face Markup (R3)
- **File**: `js/views/pdp.js`
- **Lines 122-140**:
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

### Observation 3.2: Centering Grid CSS (R3)
- **File**: `css/styles.css`
- **Lines 245-269**:
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

### Observation 4.1: Existing Test Suite Status
- **Command**: `node --test tests/*.test.mjs`
- **Result**: `308 tests pass, 0 fail` (Duration ~2.8s).
- **Direct Test Assertions that will be affected**:
  * `tests/test_pdp.test.mjs:343-356`: Asserts `html.includes('centering-grid-overlay')`, `EJE X: 50.0% / 50.0%`, and `EJE Y: 50.0% / 50.0% • BORDES OK`.
  * `tests/test_pdp.test.mjs:443`: Asserts `html.includes('id="pdp-interactive-chart"')`.
  * `tests/stress_verification_m1.mjs:363-364`: Asserts `centering-grid-overlay` and `EJE X: 50.0% / 50.0%`.

---

## 3. Logic Chain

1. **R1 Logic Chain**:
   - Initial render creates condition buttons with `<i data-lucide="check">` on the active condition (`psa10` by default).
   - `lucide.createIcons()` converts this element into `<svg class="lucide lucide-check ...">`.
   - When user clicks another condition button (e.g. `raw`), `selectCondition('raw')` loops through all buttons.
   - For the inactive button (`psa10`), line 781 queries: `let checkIcon = headerDiv.querySelector('i');`.
   - Because the checkmark is now an `<svg>` tag, `querySelector('i')` returns `null`.
   - Line 785 checks `else if (!isActive && checkIcon)`. Since `checkIcon` is `null`, this branch does NOT execute.
   - `checkIcon.remove()` is never called. The `<svg>` checkmark remains visible on the old button.
   - For the newly selected button (`raw`), `isActive` is `true` and `!checkIcon` is `true`. It inserts a new `<i data-lucide="check">`, and `lucide.createIcons()` turns it into `<svg>`.
   - Both buttons now exhibit checkmarks. Clicking each condition adds another persistent checkmark, exactly producing the defect recorded in Captura 4.
   - **Conclusion**: The checkmark removal logic must query for both `i` and `svg` (and children) and forcefully remove all check icons on inactive buttons.

2. **R2 Logic Chain**:
   - In `render()` (`pdp.js:441-468`), the entire statistics card containing the title `Historial de Mercado Actual (12 meses)`, the trend pill `#market-trend-pill`, the explanatory text, and `#pdp-chart-container` with `#pdp-interactive-chart` is wrapped in a self-contained `div`.
   - Directly underneath this box is the `#pdp-price` display block (`pdp.js:470-476`).
   - Removing lines 441-468 directly eliminates the statistics box without disrupting the layout or `#pdp-price`.
   - In `afterRender()` (`pdp.js:520-521`) and `selectCondition()` (`pdp.js:797-799`), `drawChart()` and `bindChartEvents()` must be deactivated or guarded so they do not attempt DOM operations on missing chart elements.
   - Price updates in `selectCondition()` (`pdp.js:752-756`) target `#pdp-price` directly and remain fully intact and functional.
   - **Conclusion**: Removing lines 441-468 and guarding chart lifecycle methods cleanly fulfills R2 while ensuring `#pdp-price` is prominent and reactive.

3. **R3 Logic Chain**:
   - In `renderInspectorStage()` (`pdp.js:122-140`), the back face `.card-3d-back` wraps an `<img>` tag for `img/cards/card-back.png` and a sibling `<div class="centering-grid-overlay">` containing two coordinate `<span>`s.
   - Removing lines 131-138 leaves only the clean `<img>` tag inside the back face.
   - In `css/styles.css:245-269`, the `.centering-grid-overlay` CSS rules provide the dashed borders and crosshairs.
   - Removing or clearing this class leaves the reverse side showing solely the official Pokémon card back artwork with zero overlays, satisfying R3 and matching the target aesthetic of Captura 3.

---

## 4. Recommended Precise Remediation Strategies

### Remediation for R1: Exclusive Checkmark Handling
In `js/views/pdp.js` inside `selectCondition(condKey)` (lines 778-788):

**Current Code**:
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

**Proposed Replacement**:
```javascript
        const headerDiv = btn.querySelector('div:first-child');
        if (headerDiv) {
          headerDiv.className = `text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}`;
          
          // Remove any existing check icon (both <i> and transformed <svg>)
          const existingIcons = headerDiv.querySelectorAll ? headerDiv.querySelectorAll('i, svg, [data-lucide="check"]') : [];
          if (existingIcons.length > 0) {
            existingIcons.forEach(icon => {
              if (typeof icon.remove === 'function') icon.remove();
            });
          }
          // Fallback cleanup for test mocks with direct children array
          if (headerDiv.children && Array.isArray(headerDiv.children)) {
            headerDiv.children = headerDiv.children.filter(c => c.tagName !== 'I' && c.tagName !== 'SVG');
          }

          // If active, insert exactly one check icon and render with Lucide
          if (isActive) {
            headerDiv.insertAdjacentHTML('beforeend', '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>');
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
              lucide.createIcons();
            }
          }
        }
```

### Remediation for R2: Market History Box Removal & Price Clarity
1. In `js/views/pdp.js` inside `render()`:
   Delete lines 441-467 (`<div class="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4">...</div>`).
2. In `js/views/pdp.js` inside `afterRender()` (lines 519-523):
   Guard or remove calls to `this.drawChart()` and `this.bindChartEvents()`:
   ```javascript
   afterRender() {
     if (document.getElementById('pdp-interactive-chart')) {
       this.drawChart();
       this.bindChartEvents();
     }
     this.bindCard3DController();
   },
   ```
3. In `js/views/pdp.js` inside `selectCondition()` (lines 796-799):
   Remove or guard:
   ```javascript
   if (document.getElementById('pdp-interactive-chart') && typeof this.drawChart === 'function') {
     this.drawChart();
   }
   ```
4. In `js/views/pdp.js` inside `drawChart()` (lines 866-948) and `bindChartEvents()` (lines 950-1020):
   Keep the existing defensive early exits (`if (!svg) return;`, `if (!container || !svg || !tooltip) return;`).

### Remediation for R3: 3D Card Viewer Clean Reverse Side
1. In `js/views/pdp.js` inside `renderInspectorStage()` (lines 122-140):
   Remove lines 131-138 (`<div class="centering-grid-overlay">...</div>`).
   The clean card back markup becomes:
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
2. In `css/styles.css` (lines 245-269):
   Remove the `.centering-grid-overlay`, `::before`, and `::after` rules, or set `.centering-grid-overlay { display: none !important; }`.
3. In `js/views/pdp.js` (line 366):
   Update the mode button label from `Centrado 50/50 (Giro 3D Y)` to `Reverso oficial (Giro 3D Y)` for consistency.

### Remediation for Test Suites
In `tests/test_pdp.test.mjs`:
1. Lines 343-356:
   ```javascript
   test('Feature 4 [Tier 1]: 3D Inspector Back - Clean reverse side without centering grid overlay', () => {
     const { PRODUCTS, PDPView } = setupPDPRenderer();
     const card = PRODUCTS.find(p => p.categoria === 'psa');
     const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
     assert.ok(html.includes('img/cards/card-back.png'), 'Card back image must be rendered');
     assert.ok(!html.includes('centering-grid-overlay'), 'centering-grid-overlay must NOT be present');
     assert.ok(!html.includes('EJE X: 50.0% / 50.0%'), 'Centering X label must NOT be present');
     assert.ok(!html.includes('EJE Y: 50.0% / 50.0% • BORDES OK'), 'Centering Y label must NOT be present');
   });
   ```
2. Line 443:
   ```javascript
   test('Feature 6 [Tier 1]: Adaptive PDP - Single card shows 3D inspector modes & prominent condition pricing', () => {
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
   ```
3. Add a dedicated R1 Mutual Exclusivity Test:
   Verify that clicking sequentially through all condition buttons (`raw`, `psa8`, `psa9`, `psa10`) results in exactly one button displaying the checkmark at any given point in time.

---

## 5. Caveats

1. **Read-Only Constraint**: No source code files or tests were modified during this survey. All proposed changes are documented as diffs and snippets for the implementing worker agent.
2. **Mock Environment Compatibility**: Certain tests in `tests/test_condition_pricing.test.mjs` and `tests/test_challenger_m1_adversarial.test.mjs` implement lightweight custom `MockDOMElement` classes without full HTML parser or querySelector capabilities. The remediation proposed for R1 explicitly supports both standard W3C DOM and these mock environments.

---

## 6. Conclusion

- **R1**: Defect is strictly caused by `querySelector('i')` failing to locate Lucide-converted `<svg>` icons in `pdp.js:781`. Proposed cleanup solves the defect completely.
- **R2**: Removal of `pdp.js:441-468` cleanly achieves the requirement. Price display `#pdp-price` is untouched and retains full prominence.
- **R3**: Removal of `pdp.js:131-138` delivers a pristine card back view with zero text or grid overlays.
- Downstream test updates are mapped and straightforward to execute.

---

## 7. Verification Method

1. **Automated Test Verification**:
   Execute `node --test tests/*.test.mjs` to ensure zero regressions across all 308+ test cases.
2. **Browser Interaction Check**:
   - Navigate to `#pdp?id=charizard-base`.
   - Click each condition button (`Raw / NM`, `PSA 8 NM-MT`, `PSA 9 MINT`, `PSA 10 GEM MT`). Verify that only the clicked button shows a checkmark (✓) and the previous checkmark vanishes immediately.
   - Inspect the PDP right column: verify that no market chart, SVG curve, or percentage pill appears, and `#pdp-price` updates accurately ($750.00 -> $1,800.00 -> $4,850.00 -> $18,500.00).
   - In the 3D card inspector, click "Reverso y Bordes" (or rotate card 180° horizontally): verify the reverse side displays only the authentic Pokémon card back with no dashed yellow/cyan grid and no coordinate text.
