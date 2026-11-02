# Handoff Report: Milestone 2 Implementation Strategy for R3, R4, and R5

**Author**: Explorer Subagent (`explorer_m2_2`)  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_m2_2\`  
**Target Milestone**: Milestone 2: Production Optimization & Evolution (R1–R6)  
**Parent Agent**: `d0559baa-cd30-4455-b406-13994e294aca`  
**Date**: 2026-11-02  

---

## 1. Observation

### 1.1 Requirement R3: Authentic PSA Slab Visual Redesign
Direct analysis of the official reference image:
- **Reference Photo**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634479327_23c1d67d.jpg` (2026 Pokemon M4 JP #114 Mega Greninja ex Special Art Rare, PSA GEM MT 10, Cert #158905756).

**Direct Visual Observations from Reference Photo**:
1. **Clear Beveled Acrylic Casing**:
   - The outer case is high-transparency clear polycarbonate/acrylic with smooth rounded exterior corners.
   - Stepped, beveled frosted outer perimeter border surrounding the entire perimeter.
   - Distinct horizontal acrylic dividing rail separating the upper label chamber from the card well.
   - At the bottom-right corner of the clear acrylic casing (below the card pocket, in the margin of the acrylic frame), there is an authentic **embossed / molded "PSA" logomark** etched into the plastic itself.
2. **Card Well & 4 Structural Corner Notches ("Muescas Estructurales")**:
   - The card sits securely inside a recessed rectangular inner pocket (`.psa-inner-well`).
   - At each of the **four corners** (top-left, top-right, bottom-left, bottom-right), there is a square/diamond structural bumper notch cut into the acrylic rim. This creates empty space around the card corners, ensuring mint card corners float freely in air without touching or rubbing against the acrylic walls.
   - The card face is **completely pristine and uncovered**. There is NO intrusive overlay or sticker covering the card artwork.
3. **Official PSA Header Label**:
   - White cardstock background encased in a signature **solid red border** (`#D8232A` / `#DC2626`), inset ~2-3px from the outer cut edge.
   - **Line 1**: Left: Year + Set code (`2026 POKEMON M4 JP`); Right: Card number (`#114`).
   - **Line 2**: Left: Card name (`MEGA GRENINJA ex`); Right: Grade title (`GEM MT`).
   - **Line 3**: Left: Rarity/variant (`SPECIAL ART RARE`); Right: Grade numeral (`10`).
   - **Bottom Row**: Left: Crisp vertical barcode (`.psa-barcode`); Center: Official PSA oval logo emblem / security foil with iridescent sheen; Right: Official certification number (`#158905756`).
   - Clean, high-contrast, uppercase sans-serif grotesque typography with precise baseline alignment.

**Current Codebase Deficiencies in `js/views/pdp.js` (lines 58-94)**:
```javascript
58: if (mode === 'slab') {
59:   return `
60:     <div class="w-full max-w-[350px] mx-auto psa-acrylic-slab transition-all duration-300">
61:       <div class="psa-flip-label mb-3">
62:         <div class="flex items-center justify-between text-[10px] font-black text-[#E11D48] tracking-wider uppercase border-b border-rose-100 pb-1 mb-1">
63:           <span>PROFESSIONAL SPORTS AUTHENTICATOR</span>
64:           <span>PSA</span>
65:         </div>
66:         <div class="flex items-start justify-between gap-2">
67:           <div class="text-left">
68:             <div class="text-[11px] font-black text-[#0F172A] leading-tight line-clamp-1">${String(product.set || 'EXP').toUpperCase()}</div>
69:             <div class="text-[11px] font-bold text-slate-700 leading-tight line-clamp-1">${product.nombre}</div>
70:             <div class="mt-1.5 flex items-center gap-2">
71:               <div class="psa-barcode" aria-hidden="true"></div>
72:               <span class="font-mono text-[10px] font-bold text-slate-600">#${certCode}</span>
73:             </div>
74:           </div>
75:           <div class="text-right flex-shrink-0 bg-[#0F172A] text-[#FEF3C7] px-2.5 py-1 rounded-md border border-[#D97706]">
76:             <div class="text-[9px] font-bold uppercase tracking-wider text-slate-300">GRADO</div>
77:             <div class="text-xs font-black">${gradeLabel}</div>
78:           </div>
79:         </div>
80:       </div>
81: 
82:       <div class="psa-inner-well aspect-[3/4] flex items-center justify-center relative overflow-hidden">
83:         <img 
84:           src="${product.imagenLocal}" 
85:           alt="${product.nombre} encapsulada en Slab PSA" 
86:           class="max-h-full max-w-full object-contain filter drop-shadow-xl"
87:           onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
88:         />
89:         <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-white/85 backdrop-blur text-[9px] font-black text-[#0F172A] border border-slate-300">
90:           PSA HOLOGRAM SEAL
91:         </div>
92:       </div>
93:     </div>
94:   `;
95: }
```
- **Defect 1**: Line 89-91 adds an artificial `<div class="absolute bottom-2 right-2 ...">PSA HOLOGRAM SEAL</div>` directly over the card art.
- **Defect 2**: Line 75 uses an opaque dark navy rectangle (`bg-[#0F172A] border-[#D97706]`) instead of an authentic red-bordered white paper label.
- **Defect 3**: Lines 82-92 contain zero structural corner notches (`muescas`).
- **Defect 4**: There is no molded/embossed PSA logo in the bottom-right corner of the acrylic.
- **Defect 5** (`css/styles.css` lines 250-256): `.psa-acrylic-slab` uses an opaque gradient (`rgba(255,255,255,0.92)` to `rgba(241,245,249,0.95)`) instead of clear beveled acrylic.

**Existing Unit Test Constraints (`tests/test_pdp.test.mjs`, lines 367-397)**:
```javascript
assert.ok(html.includes('psa-acrylic-slab'));
assert.ok(html.includes('psa-inner-well'));
assert.ok(html.includes('PROFESSIONAL SPORTS AUTHENTICATOR'));
assert.ok(html.includes('<span>PSA</span>'));
assert.ok(html.includes('psa-barcode'));
assert.ok(html.includes(`#${card.certNumber}`));
assert.ok(html.includes('GRADO'));
assert.ok(html.includes('GEM MT 10'));
```
Any updated markup must preserve all 8 exact string tokens.

---

### 1.2 Requirement R4: Multi-criteria Category Search & Filtering
- **Reference Photo**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634656938_1630c76b.jpg` shows the `#catalog` view with "charizard" in the search box, displaying "1 piezas encontradas" and "Mostrando 1 de 13 activos en bóveda" for Charizard Base Set 1999 #4/102.

**Current Codebase Deficiencies**:
1. In `js/views/catalog.js` (lines 8-18):
   ```javascript
   if (f.category !== 'all' && card.categoria !== f.category) return false;
   if ((f.condition === 'psa8' || f.condition === 'psa9' || f.condition === 'psa10') && card.categoria !== 'psa') {
     return false;
   }
   ```
   - In `js/data.js`, cards like `charizard-base` have `categoria: 'psa'`, while cards like `umbreon-vmax` have `categoria: 'raw'`. Both cards have prices for both Raw and PSA 8/9/10 grades (`charizard-base` has `raw: 750.00`, `umbreon-vmax` has `psa10: 1350.00`).
   - If a user navigates to "Cartas Sueltas / Raw" (`f.category = 'raw'`) and types "charizard", `card.categoria !== f.category` rejects Charizard completely, returning 0 results.
2. In `js/app.js` (lines 75-84):
   ```javascript
   if (catParam) {
     Store.data.catalogFilters.category = catParam;
     Store.data.catalogFilters.era = 'all';
   } else if (eraParam) {
     Store.data.catalogFilters.era = eraParam;
     Store.data.catalogFilters.category = 'all';
   } else if (!qParam) {
     Store.data.catalogFilters.category = 'all';
     Store.data.catalogFilters.era = 'all';
   }

   if (qParam !== null) {
     Store.data.catalogFilters.searchQuery = qParam;
   }
   ```
   - If `qParam` is passed without `catParam` (e.g. `#catalog?q=charizard`), `!qParam` evaluates to `false`. If the user had previously selected a category like `raw`, `Store.data.catalogFilters.category` remains locked to `'raw'`, causing Charizard to be blocked.
3. Lack of Vault Fallback:
   - If a user is searching for a card within an active category (such as searching "charizard" while in `sealed`), the system currently provides a blank dead-end ("No encontramos piezas con esos criterios") instead of gracefully falling back to searching across the entire vault.
4. Input Desynchronization:
   - When `#catalog` renders, `#global-search` in the navbar is never populated with `Store.data.catalogFilters.searchQuery`.

---

### 1.3 Requirement R5: Modernized Category Drawer Microinteractions
- **Reference Photo**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634877558_f20d87f2.png` shows the "Categorías de Bóveda" sliding drawer.

**Direct Visual Observations & Current Deficiencies (`index.html` lines 186-234)**:
- Six category buttons:
  1. `1. Ver Todo el Catálogo` (badge: `Todos`)
  2. `2. Slabs Certificados PSA` (badge: `Grado 8-10`)
  3. `3. Cartas Sueltas / Raw` (badge: `Near Mint`)
  4. `4. Cajas y Sobres Sellados Vintage` (badge: `1999 WotC`)
  5. `5. Era Clásica WotC 1999-2002` (badge: `Base/Neo`)
  6. `6. Era Moderna & Alt Arts` (badge: `Secret Rare`)
- **Current Deficiencies**:
  - Buttons 2 to 6 are plain text rows (`text-slate-200 hover:bg-[#1E293B]`) lacking individual card containers, borders, and gradients.
  - Button 1 has a hardcoded static active background (`bg-[#1E293B] hover:bg-[#E11D48]`), failing to dynamically reflect whether the user is currently viewing `#catalog` or a subcategory.
  - Badges have weak styling with flat colors and no category-specific identity.
  - No hover microinteractions: no `translateX(4px)`, no icon scaling, no chevron reveal, and no border glow.

---

## 2. Logic Chain

### 2.1 Logic Chain for R3: Authentic PSA Slab Redesign
1. **Observation**: Reference photo Captura 3 displays a clear, highly transparent acrylic frame with stepped bevels, 4 corner notches in the card pocket, an authentic bottom-right molded "PSA" mark, and a crisp white label framed with a signature PSA red border (`#D8232A`). The card artwork is completely clean with zero stickers over it.
2. **Observation**: `tests/test_pdp.test.mjs` strictly requires 8 literal tokens: `psa-acrylic-slab`, `psa-inner-well`, `PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#` + certNumber, `GRADO`, and `GEM MT 10`.
3. **Deduction**: We must:
   - Update `pdp.js`:
     * Encapsulate the label in a white card with an authentic red border (`border: 2.5px solid #d8232a`).
     * Retain the header bar with exact text `<span>PROFESSIONAL SPORTS AUTHENTICATOR</span>` and `<span>PSA</span>`.
     * Format card information across 3 lines: Line 1 (Set + Card #), Line 2 (Card Name + Grade Title), Line 3 (Rarity + Grade Numeral). Include metadata `GRADO` and `${gradeLabel}` (`GEM MT 10`).
     * Move the PSA hologram security foil to the bottom row of the label between the barcode and cert number.
     * Remove the `.absolute.bottom-2.right-2` overlay sticker completely from `.psa-inner-well`.
     * Add 4 corner notch elements inside `.psa-inner-well`: `.psa-notch.psa-notch-tl`, `.psa-notch.psa-notch-tr`, `.psa-notch.psa-notch-bl`, `.psa-notch.psa-notch-br`.
     * Add molded acrylic text `<div class="psa-molded-logo" aria-hidden="true">PSA</div>`.
   - Update `css/styles.css`:
     * Transform `.psa-acrylic-slab` from an opaque white block into a transparent glassmorphic acrylic frame (`background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(241,245,249,0.08) 40%, rgba(226,232,240,0.16) 100%)`, `backdrop-filter: blur(10px)`, and stepped inset box-shadow bevels).
     * Style `.psa-flip-label` as white cardstock with a crisp red border `2.5px solid #d8232a`.
     * Style `.psa-notch` elements as subtle transparent corner cutouts.
     * Style `.psa-molded-logo` with 3D text-shadow (`text-shadow: 1px 1px 1px rgba(255,255,255,0.8), -1px -1px 1px rgba(15,23,42,0.2)`).

### 2.2 Logic Chain for R4: Multi-criteria Category Search & Filtering
1. **Observation**: Individual cards in `js/data.js` have both Raw and PSA grade prices, but are classified under a single static `card.categoria`.
2. **Observation**: When a user selects a category and searches, strict inequality `card.categoria !== f.category` rejects cards that are available in that grade/format.
3. **Observation**: Navigating to `#catalog?q=...` without `catParam` preserves old category state in `Store.data.catalogFilters.category`.
4. **Deduction**: We must:
   - Implement **semantic category matching** in `CatalogView`:
     * `category === 'all'`: Matches all cards.
     * `category === 'psa'`: Matches cards with `card.categoria === 'psa'` OR cards with PSA prices (`psa10`, `psa9`, `psa8`).
     * `category === 'raw'`: Matches cards with `card.categoria === 'raw'` OR non-sealed cards with `precios.raw > 0`.
     * `category === 'sealed'`: Matches cards with `card.categoria === 'sealed'` or `card.tipo_discriminador === 'PRODUCTO_SELLADO'`.
   - Implement **vault search fallback**:
     * If a text query is present (`f.searchQuery`) and the filtered results within the active category produce 0 matches, the filter evaluates the query across the entire vault (`PRODUCTS`). If matching cards exist, it displays them and shows a status indicator: `"Mostrando resultados en Toda la Bóveda para '${f.searchQuery}'"`.
   - In `js/app.js` route handler:
     * When routing to `#catalog` without explicit `cat` or `era` params, normalize both `category` and `era` to `'all'`.
     * Synchronize `#global-search` input value with `Store.data.catalogFilters.searchQuery`.

### 2.3 Logic Chain for R5: Modernized Category Drawer Microinteractions
1. **Observation**: In Captura 5, category navigation buttons need a modern, premium appearance with distinct category badges and visual hierarchy.
2. **Observation**: Current drawer markup in `index.html` has unstyled flat links for categories 2–6, with no borders, no gradients, and no hover microinteractions.
3. **Deduction**: We must:
   - Modernize all 6 buttons using the `.drawer-cat-btn` card pattern:
     * 1px subtle borders: `border border-slate-700/60` and `hover:border-amber-500/40`.
     * Subtle dark/gold/crimson gradients: `bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80`.
     * Microinteractions: `transition-all duration-200 hover:translate-x-1 hover:shadow-lg`.
     * Icon containers: `w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform`.
     * Chevron reveal: `<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>`.
     * Hierarchical typography: Primary category title in bold white, secondary subtitle with item metadata in `text-slate-400`.
     * Category-specific badges:
       - Slabs PSA: Amber badge (`bg-amber-500/15 text-amber-300 border border-amber-500/30`)
       - Raw Singles: Emerald badge (`bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`)
       - Cajas Selladas: Crimson badge (`bg-rose-500/15 text-rose-300 border border-rose-500/30`)
       - Era Clásica WotC: Orange/Amber badge (`bg-orange-500/15 text-orange-300 border border-orange-500/30`)
       - Era Moderna: Blue/Cyan badge (`bg-sky-500/15 text-sky-300 border border-sky-500/30`)
       - Todos: Slate/White badge (`bg-white/10 text-slate-200 border border-white/15`)

---

## 3. Caveats

1. **Exact Test Token Preservation**: `tests/test_pdp.test.mjs` line 380 asserts `assert.ok(html.includes('<span>PSA</span>'))`. Do NOT alter this tag to `<span class="...">PSA</span>`. The tag must remain exactly `<span>PSA</span>`.
2. **Backward Compatibility**: `card.categoria` in `js/data.js` is read by other views (Home, Cart, PDP). Semantic matching in `CatalogView` must augment compatibility without mutating `card.categoria` in `js/data.js`.
3. **Zero Console Errors**: All changes must maintain 0 console errors and 100% test pass rate across all 356 automated tests.
4. **Read-Only Explorer Constraint**: This report provides the exact implementation plan and diff snippets. No source code was modified during this investigation.

---

## 4. Conclusion & Technical Implementation Strategy

### 4.1 Requirement R3: Authentic PSA Slab Visual Redesign

#### File 1: `js/views/pdp.js` (lines 54-95)
**Target Replacement**: In `renderInspectorStage(product, condition, mode)`, when `mode === 'slab'`:

```javascript
  renderInspectorStage(product, condition, mode) {
    const certCode = product.certNumber || '48291034';
    const gradeLabel = this.getGradeLabel(condition);

    if (mode === 'slab') {
      const cardNumMatch = (product.nombre || '').match(/#(\d+)(?:\/\d+)?/);
      const cardNum = product.numeroCarta || (cardNumMatch ? '#' + cardNumMatch[1] : '#114');

      return `
        <div class="w-full max-w-[340px] mx-auto psa-acrylic-slab transition-all duration-300 relative select-none">
          <!-- Official PSA White Paper Label with Signature Red Border Frame -->
          <div class="psa-flip-label psa-official-label mb-3 relative">
            <!-- Header Bar: PROFESSIONAL SPORTS AUTHENTICATOR & PSA -->
            <div class="flex items-center justify-between text-[8px] sm:text-[8.5px] font-black text-[#D8232A] tracking-wider uppercase border-b border-rose-100 pb-1 mb-1.5 select-none">
              <span class="tracking-widest">PROFESSIONAL SPORTS AUTHENTICATOR</span>
              <span>PSA</span>
            </div>

            <!-- 3-Line Official Typography Grid -->
            <div class="grid grid-cols-12 gap-1 items-start text-[#0F172A] font-mono leading-tight">
              <div class="col-span-8 text-left space-y-0.5">
                <div class="text-[10px] font-black tracking-tight line-clamp-1 uppercase text-slate-900">${String(product.set || 'EXP').toUpperCase()}</div>
                <div class="text-[11px] font-black tracking-tight line-clamp-1 text-slate-950">${product.nombre}</div>
                <div class="text-[9.5px] font-bold text-slate-600 line-clamp-1 uppercase">${product.rareza || 'SPECIAL ART RARE'}</div>
              </div>
              <div class="col-span-4 text-right flex flex-col items-end justify-start">
                <span class="text-[10.5px] font-black text-slate-800 tracking-tighter">${cardNum}</span>
                <div class="mt-0.5 text-right">
                  <span class="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider block leading-none">GRADO</span>
                  <span class="text-xs font-black text-slate-950 leading-tight block">${gradeLabel}</span>
                </div>
              </div>
            </div>

            <!-- Bottom Row: Barcode, Center Hologram Security Foil & Cert Number -->
            <div class="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between gap-1">
              <div class="psa-barcode flex-shrink-0" aria-label="Código de barras oficial"></div>
              <div class="psa-hologram-emblem flex-shrink-0 flex items-center justify-center px-1.5 py-0.5 rounded bg-gradient-to-r from-slate-200 via-amber-100 to-slate-200 border border-slate-300 text-[8px] font-black shadow-xs" title="PSA Authentic Security Hologram">
                <span class="text-[#0284C7] font-black">P</span><span class="text-[#D8232A] font-black">S</span><span class="text-[#0F172A] font-black">A</span>
              </div>
              <span class="font-mono text-[10px] font-bold text-slate-700 tracking-wider">#${certCode}</span>
            </div>
          </div>

          <!-- Inner Acrylic Recess with 4 Structural Corner Notches ("Muescas") -->
          <div class="psa-inner-well aspect-[3/4] flex items-center justify-center relative overflow-hidden">
            <!-- 4 Structural Corner Cutouts -->
            <div class="psa-notch psa-notch-tl" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-tr" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-bl" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-br" aria-hidden="true"></div>

            <!-- Centered Card Artwork without artificial overlay sticker -->
            <img 
              src="${product.imagenLocal}" 
              alt="${product.nombre} encapsulada en Slab PSA" 
              class="max-h-full max-w-full object-contain filter drop-shadow-2xl rounded-xs select-none"
              onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
            />
          </div>

          <!-- Molded Acrylic PSA Emboss (Bottom-Right) -->
          <div class="psa-molded-logo" aria-hidden="true">PSA</div>
        </div>
      `;
    }
```

#### File 2: `css/styles.css` (lines 250-305)
**Target Replacement**: Update `.psa-acrylic-slab`, `.psa-flip-label`, `.psa-inner-well` and add `.psa-notch` and `.psa-molded-logo`:

```css
/* Authentic PSA Slab Styles - Replicating Reference Greninja PSA 10 */
.psa-acrylic-slab {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(241, 245, 249, 0.08) 40%, rgba(226, 232, 240, 0.16) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(255, 255, 255, 0.7);
  border-radius: 1.25rem;
  padding: 0.75rem;
  position: relative;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.8),
    inset 0 0 0 4px rgba(226, 232, 240, 0.35),
    inset 0 2px 8px rgba(255, 255, 255, 0.9),
    inset 0 -3px 10px rgba(15, 23, 42, 0.15),
    0 25px 45px -12px rgba(15, 23, 42, 0.35);
}

.psa-acrylic-slab::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  pointer-events: none;
}

.psa-flip-label {
  border: 2.5px solid #D8232A;
  background: #FFFFFF;
  border-radius: 0.35rem;
  padding: 0.5rem 0.65rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.9);
  outline: 2px solid #FFFFFF;
  outline-offset: -4px;
}

.psa-barcode {
  height: 14px;
  width: 78px;
  background: repeating-linear-gradient(
    90deg,
    #0F172A 0px,
    #0F172A 2px,
    transparent 2px,
    transparent 4px,
    #0F172A 4px,
    #0F172A 5px,
    transparent 5px,
    transparent 8px,
    #0F172A 8px,
    #0F172A 11px,
    transparent 11px,
    transparent 13px
  );
}

.psa-inner-well {
  background: rgba(15, 23, 42, 0.03);
  border: 2px solid rgba(203, 213, 225, 0.65);
  border-radius: 0.65rem;
  padding: 0.65rem;
  position: relative;
  box-shadow: 
    inset 0 2px 5px rgba(15, 23, 42, 0.15),
    inset 0 -2px 5px rgba(255, 255, 255, 0.8);
}

/* 4 Structural Corner Bumper Notches ("Muescas Estructurales") */
.psa-notch {
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.35);
  border: 1.5px solid rgba(148, 163, 184, 0.65);
  z-index: 2;
  pointer-events: none;
}
.psa-notch-tl { top: -2px; left: -2px; border-top-left-radius: 3px; border-bottom-right-radius: 6px; }
.psa-notch-tr { top: -2px; right: -2px; border-top-right-radius: 3px; border-bottom-left-radius: 6px; }
.psa-notch-bl { bottom: -2px; left: -2px; border-bottom-left-radius: 3px; border-top-right-radius: 6px; }
.psa-notch-br { bottom: -2px; right: -2px; border-bottom-right-radius: 3px; border-top-left-radius: 6px; }

/* Molded PSA Logo on Acrylic Bottom-Right */
.psa-molded-logo {
  position: absolute;
  bottom: 6px;
  right: 14px;
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 900;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.45);
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.8), -1px -1px 1px rgba(15, 23, 42, 0.25);
  pointer-events: none;
  user-select: none;
}
```

---

### 4.2 Requirement R4: Multi-criteria Category Search & Filtering

#### File 1: `js/views/catalog.js` (lines 4-56)
**Target Replacement**: Update `getFilteredProducts()` and add `matchesCategory`:

```javascript
  matchesCategory(card, category) {
    if (category === 'all') return true;
    if (category === 'sealed') {
      return card.categoria === 'sealed' || 
             card.tipo_discriminador === 'PRODUCTO_SELLADO' || 
             (card.set && card.set.toLowerCase().includes('sealed'));
    }
    if (category === 'psa') {
      return card.categoria === 'psa' || 
             Boolean(card.precios && (card.precios.psa10 || card.precios.psa9 || card.precios.psa8));
    }
    if (category === 'raw') {
      return card.categoria === 'raw' || 
             (card.categoria !== 'sealed' && Boolean(card.precios && card.precios.raw));
    }
    return card.categoria === category;
  },

  getFilteredProducts() {
    const f = Store.data.catalogFilters;
    const condKey = (f.condition && f.condition !== 'all' && f.condition !== 'sealed') ? f.condition : 'raw';

    const testCard = (card, useCategoryFilter, useEraFilter) => {
      if (useCategoryFilter && !this.matchesCategory(card, f.category)) return false;
      if (useEraFilter && f.era !== 'all' && card.era !== f.era) return false;

      if (f.condition !== 'all') {
        if (f.condition === 'sealed' && card.categoria !== 'sealed') return false;
        if (f.condition === 'raw' && (card.categoria === 'sealed' || !card.precios?.raw)) return false;
        if ((f.condition === 'psa8' || f.condition === 'psa9' || f.condition === 'psa10') && (!card.precios || !card.precios[f.condition])) {
          return false;
        }
      }

      if (f.type !== 'all' && card.tipo !== f.type) return false;

      const refPrice = f.condition === 'psa10'
        ? card.precios.psa10
        : f.condition === 'psa9'
          ? card.precios.psa9
          : f.condition === 'psa8'
            ? card.precios.psa8
            : card.precios.raw;

      const min = f.minPrice !== '' && f.minPrice !== null ? parseFloat(f.minPrice) : null;
      const max = f.maxPrice !== '' && f.maxPrice !== null ? parseFloat(f.maxPrice) : null;

      if (min !== null && !isNaN(min) && refPrice < min) return false;
      if (max !== null && !isNaN(max) && refPrice > max) return false;

      if (f.searchQuery) {
        const q = f.searchQuery.toLowerCase().trim();
        const inName = (card.nombre || '').toLowerCase().includes(q);
        const inSet = (card.set || '').toLowerCase().includes(q);
        const inType = (card.tipo || '').toLowerCase().includes(q);
        const inRarity = (card.rareza || '').toLowerCase().includes(q);
        const inCert = (card.certNumber || '').toLowerCase().includes(q);
        if (!inName && !inSet && !inType && !inRarity && !inCert) return false;
      }

      return true;
    };

    let list = PRODUCTS.filter(card => testCard(card, true, true));

    // Vault search fallback: If a text query produces 0 results within the selected category/era,
    // fallback gracefully to searching across all categories in the vault so the user is never blocked.
    this.isVaultFallback = false;
    if (list.length === 0 && f.searchQuery) {
      const fallbackList = PRODUCTS.filter(card => testCard(card, false, false));
      if (fallbackList.length > 0) {
        list = fallbackList;
        this.isVaultFallback = true;
      }
    }

    if (f.sortBy === 'price-asc') {
      list.sort((a, b) => a.precios[condKey] - b.precios[condKey]);
    } else if (f.sortBy === 'price-desc') {
      list.sort((a, b) => b.precios[condKey] - a.precios[condKey]);
    } else if (f.sortBy === 'yield-desc') {
      list.sort((a, b) => b.rendimientoAnual - a.rendimientoAnual);
    }

    return list;
  },
```

#### File 2: `js/app.js` (lines 70-94)
**Target Replacement**: Update `route === 'catalog'` in `handleRoute`:

```javascript
    if (route === 'catalog') {
      const catParam = params.get('cat');
      const eraParam = params.get('era');
      const qParam = params.get('q');

      if (catParam) {
        Store.data.catalogFilters.category = catParam;
        Store.data.catalogFilters.era = 'all';
      } else if (eraParam) {
        Store.data.catalogFilters.era = eraParam;
        Store.data.catalogFilters.category = 'all';
      } else {
        // When neither catParam nor eraParam is explicitly provided in URL,
        // reset category and era to 'all' so search queries default to the entire inventory
        Store.data.catalogFilters.category = 'all';
        Store.data.catalogFilters.era = 'all';
      }

      if (qParam !== null) {
        Store.data.catalogFilters.searchQuery = qParam;
        Store.data.searchQuery = qParam;
      }

      Store.data.currentView = 'catalog';
      this.renderCurrentView();

      // Synchronize search input in navbar with active searchQuery
      const searchInput = document.getElementById('global-search');
      if (searchInput && qParam !== null) {
        searchInput.value = qParam;
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
```

---

### 4.3 Requirement R5: Modernized Category Drawer Microinteractions

#### File 1: `index.html` (lines 186-234)
**Target Replacement**: Modernize category navigation links with `.drawer-cat-btn` cards, gradients, borders, badges, and hover chevron reveal:

```html
        <nav class="mt-5 space-y-2.5" aria-label="Navegación de categorías">
          <!-- 1. Ver Todo el Catálogo -->
          <a href="#catalog" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-amber-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#FEF3C7] group-hover:scale-110 transition-transform">
                <i data-lucide="layout-grid" class="w-4 h-4 text-[#FEF3C7]"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-[#FEF3C7] transition-colors">1. Ver Todo el Catálogo</div>
                <div class="text-[10px] text-slate-400 font-medium">Bóveda Completa • 10 Activos</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-white/10 text-slate-200 border border-white/15 shadow-xs">Todos</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>

          <!-- 2. Slabs Certificados PSA -->
          <a href="#catalog?cat=psa" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-amber-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#D97706] group-hover:scale-110 transition-transform">
                <i data-lucide="award" class="w-4 h-4 text-[#D97706]"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-amber-300 transition-colors">2. Slabs Certificados PSA</div>
                <div class="text-[10px] text-slate-400 font-medium">Grados de Inversión • Certificación Oficial</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs">Grado 8-10</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>

          <!-- 3. Cartas Sueltas / Raw -->
          <a href="#catalog?cat=raw" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-emerald-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#059669] group-hover:scale-110 transition-transform">
                <i data-lucide="sparkles" class="w-4 h-4 text-[#059669]"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-emerald-300 transition-colors">3. Cartas Sueltas / Raw</div>
                <div class="text-[10px] text-slate-400 font-medium">Condición Near Mint • Para Colección</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">Near Mint</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>

          <!-- 4. Cajas y Sobres Sellados Vintage -->
          <a href="#catalog?cat=sealed" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-rose-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[#E11D48] group-hover:scale-110 transition-transform">
                <i data-lucide="package" class="w-4 h-4 text-[#E11D48]"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-rose-300 transition-colors">4. Cajas y Sobres Sellados Vintage</div>
                <div class="text-[10px] text-slate-400 font-medium">Booster Packs • Factory Sealed WotC</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs">1999 WotC</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>

          <!-- 5. Era Clásica WotC 1999-2002 -->
          <a href="#catalog?era=vintage" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-orange-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                <i data-lucide="history" class="w-4 h-4 text-orange-400"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-orange-300 transition-colors">5. Era Clásica WotC 1999-2002</div>
                <div class="text-[10px] text-slate-400 font-medium">Base Set, Jungle, Fossil, Neo</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 shadow-xs">Base/Neo</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>

          <!-- 6. Era Moderna & Alt Arts -->
          <a href="#catalog?era=modern" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-slate-700/60 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700/80 hover:border-sky-500/40 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <i data-lucide="zap" class="w-4 h-4 text-sky-400"></i>
              </div>
              <div class="text-left">
                <div class="text-xs font-black tracking-tight group-hover:text-sky-300 transition-colors">6. Era Moderna &amp; Alt Arts</div>
                <div class="text-[10px] text-slate-400 font-medium">Sword &amp; Shield, Scarlet &amp; Violet Sets</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-xs">Secret Rare</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all"></i>
            </div>
          </a>
        </nav>
```

#### File 2: `css/styles.css`
**Target Addition**: Add drawer microinteraction CSS rules:

```css
/* Drawer Category Button Microinteractions */
.drawer-cat-btn {
  position: relative;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.drawer-cat-btn:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.5), 0 0 12px rgba(217, 119, 6, 0.15);
}
```

---

## 5. Verification Method

### 5.1 Automated Unit Tests
Run the test runner to ensure zero regressions across all 356 existing tests:
```powershell
node --test tests/*.test.mjs
```

Specifically verify:
1. `node tests/test_pdp.test.mjs`:
   * Verifies all 8 PSA slab token assertions: `psa-acrylic-slab`, `psa-inner-well`, `PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#${card.certNumber}`, `GRADO`, and `GEM MT 10`.
2. `node tests/test_adversarial_r3_r4.test.mjs`:
   * Verifies 150 router navigations (`#catalog?q=Charizard`, `#catalog?cat=psa`, etc.).
3. `node tests/challenger_stress_r4_r5_r6.test.mjs`:
   * Verifies stress, fuzzing, and adversarial criteria.

### 5.2 Browser & Visual Verification
1. **PSA Slab Visual Inspection (`#pdp?id=charizard-base`)**:
   - Switch inspector mode to 'Slab PSA'.
   - Verify clear transparent acrylic with double bevel and frosted edge.
   - Verify 4 corner notches (`.psa-notch-tl/tr/bl/br`) floating around the card corners.
   - Verify card art is completely clean with zero sticker overlay.
   - Verify molded `PSA` mark in the acrylic bottom-right.
   - Verify white paper label framed by official PSA red border with barcode, security foil emblem, and cert code.
2. **Category Search Verification (`#catalog`)**:
   - Navigate to `#catalog?cat=raw` or select "Cartas Sueltas / Raw".
   - Search for "charizard" -> Charizard Base Set must be returned cleanly at its raw price ($750.00) without being blocked.
   - Navigate to `#catalog?cat=sealed` or select "Cajas Selladas".
   - Search for "charizard" -> Fallback triggers: Charizard is returned with notice "Mostrando en Toda la Bóveda".
   - Verify navbar `#global-search` input displays the active query.
3. **Category Drawer Verification**:
   - Click `[☰ Categorías]` to open the drawer.
   - Inspect all 6 category buttons: verify 1px borders, dark gradients, hierarchical titles + subtitles, and distinct category badges (Amber for PSA, Emerald for Raw, Crimson for Sealed, Orange for Vintage, Blue for Modern).
   - Hover over buttons: verify `translateX(4px)`, icon scale (1.1x), border glow, and chevron right reveal.
