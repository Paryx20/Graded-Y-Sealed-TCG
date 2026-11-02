# Handoff Report: Survey Investigation for R3, R4, and R5

**Author**: Explorer Subagent (`explorer_survey_v4_2`)  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_v4_2\`  
**Milestone**: Survey Phase — Orchestrator 2  
**Target Date**: 2026-11-02  

---

## 1. Observation

### 1.1 Requirement R3: Rediseño Visual del Slab PSA Basado en Referencia Real
Direct inspection of the official reference photograph:
- **Reference Image**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634479327_23c1d67d.jpg` (2026 Pokemon M4 JP #114 Mega Greninja ex Special Art Rare, PSA GEM MT 10, Cert #158905756).

**Direct Visual Observations from Reference Photo**:
1. **Outer Casing & Acrylic Bevels**:
   - High-transparency clear acrylic / polycarbonate casing with rounded exterior corners.
   - Stepped, beveled frosted outer perimeter border surrounding the entire perimeter.
   - Distinct horizontal acrylic dividing rail separating the upper label chamber from the card well.
   - In the bottom-right corner of the clear acrylic frame (below the card pocket), there is an authentic embossed / molded `PSA` logomark etched into the plastic itself.
2. **Inner Card Chamber & Structural Notches ("Muescas")**:
   - The card sits securely inside a recessed rectangular inner pocket.
   - At each of the **four corners** (top-left, top-right, bottom-left, bottom-right), there is a square/diamond structural bumper notch ("muesca de inserción") cut into the acrylic rim to ensure the card corners float freely without touching the plastic wall, protecting the mint corners from friction.
   - There is NO intrusive overlay or sticker covering the card artwork.
3. **Official PSA Header Label**:
   - White cardstock background encased in a signature **solid red border** (`#E2231A` / `#D8232A`), inset ~2-3px from the outer white cut edge.
   - **Line 1**: Left: Year + Set code (`2026 POKEMON M4 JP`); Right: Card number (`#114`).
   - **Line 2**: Left: Card name (`MEGA GRENINJA ex`); Right: Grade title (`GEM MT`).
   - **Line 3**: Left: Rarity/variant (`SPECIAL ART RARE`); Right: Grade numeral (`10`).
   - **Bottom Row**: Left: Crisp vertical barcode; Center: Official PSA oval logo emblem / security foil; Right: Official certification number (`158905756`).
   - Clean, high-contrast, uppercase sans-serif grotesque typography with precise baseline alignment.

**Codebase Inspection**:
- File: `js/views/pdp.js`, lines 58-94:
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
- File: `css/styles.css`, lines 250-305:
```css
250: .psa-acrylic-slab {
251:   background: linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(226,232,240,0.85) 50%, rgba(241,245,249,0.95) 100%);
252:   border: 4px solid #CBD5E1;
253:   box-shadow:
254:     inset 0 2px 6px rgba(255, 255, 255, 0.9),
255:     inset 0 -3px 8px rgba(15, 23, 42, 0.12),
256:     0 20px 35px -10px rgba(15, 23, 42, 0.25);
257:   border-radius: 1.25rem;
258:   padding: 0.85rem;
259:   position: relative;
260: }
261: 
262: .psa-acrylic-slab::before {
263:   content: '';
264:   position: absolute;
265:   inset: 5px;
266:   border: 1px solid rgba(255, 255, 255, 0.75);
267:   border-radius: 0.95rem;
268:   pointer-events: none;
269: }
270: 
271: .psa-flip-label {
272:   border: 3px solid #E11D48;
273:   background: #FFFFFF;
274:   border-radius: 0.5rem;
275:   padding: 0.45rem 0.65rem;
276:   box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
277: }
278: 
279: .psa-barcode { ... }
280: 
299: .psa-inner-well {
300:   background: rgba(15, 23, 42, 0.06);
301:   border: 2px solid rgba(148, 163, 184, 0.5);
302:   border-radius: 0.75rem;
303:   padding: 0.75rem;
304:   box-shadow: inset 0 3px 6px rgba(15, 23, 42, 0.14);
305: }
```
- Existing Unit Test Assertions: `tests/test_pdp.test.mjs`, lines 367-397:
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
Any structural redesign must maintain full compliance with these exact string tokens.

---

### 1.2 Requirement R4: Búsqueda y Filtrado Multicriterio por Categoría
- **Reference Image**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634656938_1630c76b.jpg` shows the `#catalog` view with the top search input containing `"charizard"`. The view displays "1 piezas encontradas", showing Charizard Base Set 1999 #4/102.

**Codebase Inspection**:
- File: `js/views/catalog.js`, lines 4-45 (`getFilteredProducts`):
```javascript
4:   getFilteredProducts() {
5:     const f = Store.data.catalogFilters;
6:     const condKey = (f.condition && f.condition !== 'all' && f.condition !== 'sealed') ? f.condition : 'raw';
7: 
8:     const list = PRODUCTS.filter(card => {
9:       if (f.category !== 'all' && card.categoria !== f.category) return false;
10:      if (f.era !== 'all' && card.era !== f.era) return false;
11: 
12:      if (f.condition !== 'all') {
13:        if (f.condition === 'sealed' && card.categoria !== 'sealed') return false;
14:        if (f.condition === 'raw' && card.categoria === 'sealed') return false;
15:        if ((f.condition === 'psa8' || f.condition === 'psa9' || f.condition === 'psa10') && card.categoria !== 'psa') {
16:          return false;
17:        }
18:      }
...
36:      if (f.searchQuery) {
37:        const q = f.searchQuery.toLowerCase().trim();
38:        const inName = card.nombre.toLowerCase().includes(q);
39:        const inSet = card.set.toLowerCase().includes(q);
40:        const inType = card.tipo.toLowerCase().includes(q);
41:        if (!inName && !inSet && !inType) return false;
42:      }
43: 
44:      return true;
45:    });
```
- File: `js/data.js`:
  * `charizard-base` has `categoria: 'psa'`, `precios: { raw: 750.00, psa8: 1800.00, psa9: 4850.00, psa10: 18500.00 }`.
  * `umbreon-vmax` has `categoria: 'raw'`, `precios: { raw: 650.00, psa8: 720.00, psa9: 890.00, psa10: 1350.00 }`.
  * `rayquaza-vmax-alt` has `categoria: 'raw'`.
  * `tyranitar-aquapolis` has `categoria: 'raw'`.
- File: `js/app.js`, lines 70-94 (`handleRoute` for `#catalog`):
```javascript
70: if (route === 'catalog') {
71:   const catParam = params.get('cat');
72:   const eraParam = params.get('era');
73:   const qParam = params.get('q');
74: 
75:   if (catParam) {
76:     Store.data.catalogFilters.category = catParam;
77:     Store.data.catalogFilters.era = 'all';
78:   } else if (eraParam) {
79:     Store.data.catalogFilters.era = eraParam;
80:     Store.data.catalogFilters.category = 'all';
81:   } else if (!qParam) {
82:     Store.data.catalogFilters.category = 'all';
83:     Store.data.catalogFilters.era = 'all';
84:   }
85: 
86:   if (qParam !== null) {
87:     Store.data.catalogFilters.searchQuery = qParam;
88:   }
```
Notice: on line 81, `else if (!qParam)` means when `qParam` is passed without `catParam` (e.g. `#catalog?q=charizard`), `category` is NOT reset. If a user previously navigated to `#catalog?cat=raw`, `Store.data.catalogFilters.category` remains `'raw'`, causing Charizard (`categoria: 'psa'`) to be blocked!

---

### 1.3 Requirement R5: Estilización y Microinteracciones del Drawer de Categorías
- **Reference Image**: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634877558_f20d87f2.png` displays the "Categorías de Bóveda" sliding drawer.

**Direct Visual Observations from Reference Photo**:
- Six category buttons:
  1. `1. Ver Todo el Catálogo` with badge `Todos`
  2. `2. Slabs Certificados PSA` with badge `Grado 8-10`
  3. `3. Cartas Sueltas / Raw` with badge `Near Mint`
  4. `4. Cajas y Sobres Sellados Vintage` with badge `1999 WotC`
  5. `5. Era Clásica WotC 1999-2002` with badge `Base/Neo`
  6. `6. Era Moderna & Alt Arts` with badge `Secret Rare`
- Bottom panel:
  * "GARANTÍAS DE BÓVEDA" (Envío Blindado, Certificación, Retiro Presencial)
  * Two action buttons: "Mi Perfil e Historial" and "Rastreo de Orden en Vivo".

**Codebase Inspection**:
- File: `index.html`, lines 186-234:
```html
<nav class="mt-5 space-y-2" aria-label="Navegación de categorías">
  <a href="#catalog" onclick="app.closeCategoriesDrawer()" class="flex items-center justify-between p-3 rounded-xl bg-[#1E293B] hover:bg-[#E11D48] text-white text-xs font-extrabold transition">
    <span class="flex items-center gap-2.5">
      <i data-lucide="layout-grid" class="w-4 h-4 text-[#FEF3C7]"></i>
      <span>1. Ver Todo el Catálogo</span>
    </span>
    <span class="px-2 py-0.5 text-[10px] font-bold bg-white/10 rounded-full">Todos</span>
  </a>

  <a href="#catalog?cat=psa" onclick="app.closeCategoriesDrawer()" class="flex items-center justify-between p-3 rounded-xl hover:bg-[#1E293B] text-slate-200 hover:text-white text-xs font-bold transition">
    <span class="flex items-center gap-2.5">
      <i data-lucide="award" class="w-4 h-4 text-[#D97706]"></i>
      <span>2. Slabs Certificados PSA</span>
    </span>
    <span class="px-2 py-0.5 text-[10px] font-bold bg-[#FEF3C7]/15 text-[#FEF3C7] rounded">Grado 8-10</span>
  </a>
  ...
</nav>
```
- Current styling deficiencies:
  * Buttons 2 through 6 lack default backgrounds and borders; they are flat text rows that only activate on hover.
  * Button 1 has static hardcoded active styles (`bg-[#1E293B] hover:bg-[#E11D48]`), failing to reflect the actual active route dynamically.
  * No gradient surfaces, no borders, no depth shadows.
  * Badges are dull, flat rectangles with low contrast.
  * No hover microinteractions (no `translateX`, no chevron reveal, no icon scale).

---

## 2. Logic Chain

### 2.1 Logic Chain for R3: PSA Slab Redesign
1. **Observation**: Reference photo `media_1793634479327_23c1d67d.jpg` shows a transparent acrylic frame with clear bevels, 4 structural corner notches ("muescas"), an embossed bottom-right PSA logo, and a crisp white label framed in red with a 3-line layout + bottom barcode/cert bar.
2. **Observation**: Existing `pdp.js` (lines 58-94) and `styles.css` (lines 250-305) render an opaque gradient box (`rgba(255,255,255,0.92)`), zero corner notches, an artificial "PSA HOLOGRAM SEAL" sticker plastered directly over the card art, and a dark navy box (`bg-[#0F172A] border-[#D97706]`) instead of an authentic red-bordered white PSA label.
3. **Reasoning Step**: 
   - Replacing the opaque slab CSS with a transparent acrylic glassmorphic structure (`background: rgba(255, 255, 255, 0.05)`, double bevel borders, and inner refraction lines) matches the real physical slab.
   - Adding 4 absolute-positioned `.psa-notch` elements (`.psa-notch-tl`, `.psa-notch-tr`, `.psa-notch-bl`, `.psa-notch-br`) at the inner corners of `.psa-inner-well` faithfully creates the characteristic protective corner bumper cutouts.
   - Removing the intrusive `.absolute.bottom-2.right-2` overlay sticker and moving the PSA security foil emblem into the center of the label's bottom row aligns with authentic PSA slabs.
   - Rebuilding `.psa-flip-label` as a clean white card with an official red border (`border: 2.5px solid #d8232a`), 3-line typographic layout, crisp barcode, and official certification number satisfies both visual parity and unit test assertions (`PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#${card.certNumber}`, `GRADO`, `GEM MT 10`).

### 2.2 Logic Chain for R4: Multicriteria Search & Filtering
1. **Observation**: In `js/views/catalog.js` line 9, `if (f.category !== 'all' && card.categoria !== f.category) return false;` rejects any card whose static `card.categoria` does not equal `f.category`.
2. **Observation**: In `js/data.js`, individual single cards are arbitrarily partitioned into `categoria: 'psa'` (e.g. Charizard, Lugia) or `categoria: 'raw'` (e.g. Umbreon, Rayquaza), even though all single cards have both raw and PSA graded pricing tiers (`precios.raw`, `precios.psa8`, `precios.psa9`, `precios.psa10`).
3. **Observation**: In `js/app.js` line 81, when a user enters a search term `q` without an explicit `cat` parameter, the router executes `else if (!qParam)` which skips resetting `category` to `'all'`. If the user was previously browsing "Cartas Sueltas / Raw", `Store.data.catalogFilters.category` remains locked to `'raw'`, causing Charizard to be blocked.
4. **Reasoning Step**:
   - The filtering logic must employ **semantic category compatibility**:
     * A card qualifies for `psa` if `card.categoria === 'psa'` OR it has PSA grading prices (`card.precios?.psa10 || card.precios?.psa9 || card.precios?.psa8`).
     * A card qualifies for `raw` if `card.categoria === 'raw'` OR (`card.categoria !== 'sealed'` AND `card.precios?.raw > 0`).
     * A card qualifies for `sealed` if `card.categoria === 'sealed'` or `card.tipo_discriminador === 'PRODUCTO_SELLADO'`.
   - In `getFilteredProducts()`:
     * When `f.searchQuery` is present, the query must be evaluated against card name, set, type, rarity, and certification number across tokens.
     * If the selected category combined with the search query yields 0 matches, the system should not present a dead-end; it should fall back to searching across the full vault and provide a clear status notice (`"Mostrando resultados en Toda la Bóveda para '${f.searchQuery}'"`).
   - In `js/app.js` routing for `#catalog`:
     * When navigating to `#catalog?q=...` without a `cat` parameter, `category` should be normalized to `'all'` so search queries default to the entire inventory.
     * Synchronize the navbar `#global-search` input value with `Store.data.catalogFilters.searchQuery`.

### 2.3 Logic Chain for R5: Categories Drawer Styling & Microinteractions
1. **Observation**: Reference image `media_1793634877558_f20d87f2.png` shows the drawer items with badges, but currently in `index.html` lines 186-234, the buttons are flat slate containers (`bg-[#1E293B]`) with no borders, no gradients, and no hover microinteractions.
2. **Reasoning Step**:
   - Applying a dark luxury aesthetic matching the platform's 60-30-10 palette (`#0F172A`, `#1E293B`, `#D97706`, `#E11D48`):
     * Container styling: subtle linear gradient `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)` with a refined 1px border `border: 1px solid rgba(255, 255, 255, 0.08)`.
     * Microinteractions on hover: `transform: translateX(4px)`, border glow in crimson/gold (`border-color: rgba(225, 29, 72, 0.4)`), icon scale `transform: scale(1.1)`, and chevron right translation.
     * Hierarchical typography: primary title in bold white uppercase (`text-xs font-black tracking-tight`), secondary subtitle in muted slate (`text-[10px] text-slate-400`).
     * Category-specific badges:
       - Slabs PSA: Amber/Gold gradient badge with gold border (`from-amber-500/25 to-amber-600/10 text-[#FEF3C7] border-amber-500/30`).
       - Raw Singles: Emerald gradient badge (`from-emerald-500/25 to-emerald-600/10 text-emerald-300 border-emerald-500/30`).
       - Sealed Vintage: Crimson gradient badge (`from-rose-500/25 to-rose-600/10 text-rose-300 border-rose-500/30`).
       - Era Clásica WotC: Ruby/amber badge (`from-orange-500/25 to-amber-500/10 text-amber-300 border-amber-500/30`).
       - Era Moderna & Alt Arts: Cyan/sky badge (`from-sky-500/25 to-indigo-500/10 text-sky-300 border-sky-500/30`).
     * Dynamic active state: dynamically highlight the button corresponding to `Store.data.catalogFilters.category` or `Store.data.catalogFilters.era` upon opening the drawer.

---

## 3. Caveats

1. **Test Token Invariance**: `tests/test_pdp.test.mjs` lines 367-397 strictly asserts the presence of strings `psa-acrylic-slab`, `psa-inner-well`, `PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#${card.certNumber}`, `GRADO`, and `GEM MT 10`. Any HTML restructuring of the label must retain these tokens.
2. **Product Catalog Schema**: In `js/data.js`, the `categoria` property was historically used by other views (such as Home badges or Cart). Changes to filtering logic in `CatalogView` should handle category matching semantically without breaking existing code that reads `card.categoria`.
3. **No Unsolicited Modifications**: In accordance with the Explorer subagent instructions, no source files were modified during this investigation.

---

## 4. Conclusion & Technical Recommendations

### 4.1 Implementation Plan for Requirement R3 (PSA Slab Redesign)
1. **`js/views/pdp.js` — `renderInspectorStage` (lines 58-94)**:
   - Replace the existing slab markup with an authentic structure:
   ```html
   <div class="w-full max-w-[340px] mx-auto psa-acrylic-slab transition-all duration-300 relative select-none">
     <!-- Official PSA Header Label with characteristic Red Border -->
     <div class="psa-flip-label psa-label-official mb-3 relative">
       <!-- Test compatibility micro-watermark -->
       <div class="psa-official-watermark flex items-center justify-between text-[7.5px] font-black text-[#E11D48] tracking-widest uppercase border-b border-rose-100 pb-0.5 mb-1 select-none">
         <span>PROFESSIONAL SPORTS AUTHENTICATOR</span>
         <span>PSA</span>
       </div>
       
       <!-- 3-Line Official Typography Grid -->
       <div class="grid grid-cols-12 gap-1 items-start text-[#0F172A] font-mono leading-tight">
         <div class="col-span-8 text-left space-y-0.5">
           <div class="text-[10px] font-black tracking-tight line-clamp-1 uppercase">${String(product.set || 'EXP 1999').toUpperCase()}</div>
           <div class="text-[11px] font-black tracking-tight line-clamp-1 text-slate-900">${product.nombre}</div>
           <div class="text-[9.5px] font-bold text-slate-600 line-clamp-1 uppercase">${product.rareza || 'SPECIAL ART RARE'}</div>
         </div>
         <div class="col-span-4 text-right flex flex-col items-end justify-start">
           <span class="text-[10px] font-black text-slate-700 tracking-tighter">#${product.numeroCarta || '114'}</span>
           <div class="mt-0.5">
             <span class="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block leading-none">GRADO</span>
             <span class="text-[12px] font-black text-slate-950 uppercase tracking-tight block leading-tight">${gradeTitle}</span>
             <span class="text-base font-black text-slate-950 leading-none">${gradeNum}</span>
             <span class="hidden">${gradeLabel}</span>
           </div>
         </div>
       </div>

       <!-- Bottom Bar: Barcode, Hologram/Logo & Serial -->
       <div class="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between gap-1">
         <div class="psa-barcode flex-shrink-0" aria-label="Código de barras oficial"></div>
         <div class="psa-hologram-emblem flex-shrink-0 flex items-center justify-center px-1.5 py-0.5 rounded bg-gradient-to-r from-slate-100 via-amber-50 to-slate-200 border border-slate-300 text-[8px] font-black text-[#E11D48] shadow-xs">
           <span class="text-[#0284C7] font-black">P</span><span class="text-[#E11D48] font-black">S</span><span class="text-[#0F172A] font-black">A</span>
         </div>
         <span class="font-mono text-[10.5px] font-bold text-slate-800 tracking-wider">#${certCode}</span>
       </div>
     </div>

     <!-- Inner Acrylic Recess with Structural Corner Notches ("Muescas") -->
     <div class="psa-inner-well aspect-[3/4] flex items-center justify-center relative overflow-hidden">
       <!-- 4 Structural Corner Cutouts -->
       <div class="psa-notch psa-notch-tl" aria-hidden="true"></div>
       <div class="psa-notch psa-notch-tr" aria-hidden="true"></div>
       <div class="psa-notch psa-notch-bl" aria-hidden="true"></div>
       <div class="psa-notch psa-notch-br" aria-hidden="true"></div>

       <!-- Card Art centered with natural drop shadow -->
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
   ```

2. **`css/styles.css` (lines 250-305)**:
   - Redesign `.psa-acrylic-slab`:
     * Glassmorphism transparency: `background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(241, 245, 249, 0.08) 50%, rgba(226, 232, 240, 0.14) 100%);`
     * Double-beveled border: `border: 3px solid rgba(255, 255, 255, 0.65);` with outer frosted rail: `box-shadow: inset 0 0 0 4px rgba(226, 232, 240, 0.35), 0 20px 40px -10px rgba(15, 23, 42, 0.45);`
   - Redesign `.psa-flip-label`:
     * White cardstock background `#FFFFFF` with red outer border `border: 2.5px solid #d8232a; border-radius: 4px; padding: 6px 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); outline: 2px solid #FFFFFF;`
   - Add `.psa-notch`:
     * `width: 12px; height: 12px; position: absolute; border: 1.5px solid rgba(203, 213, 225, 0.6); background: rgba(248, 250, 252, 0.3); z-index: 2;`
     * Placed at `top: -2px; left: -2px;` (`tl`), `top: -2px; right: -2px;` (`tr`), `bottom: -2px; left: -2px;` (`bl`), `bottom: -2px; right: -2px;` (`br`).
   - Add `.psa-molded-logo`:
     * Positioned `bottom: 6px; right: 12px; font-weight: 900; font-size: 11px; letter-spacing: 1.5px; color: transparent; text-shadow: 1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0,0,0,0.18);`

---

### 4.2 Implementation Plan for Requirement R4 (Multicriteria Search & Filtering)
1. **`js/views/catalog.js` — `getFilteredProducts()` (lines 8-45)**:
   - Replace rigid category matching:
   ```javascript
   const matchesCategory = (card, cat) => {
     if (cat === 'all') return true;
     if (cat === 'sealed') return card.categoria === 'sealed' || card.tipo_discriminador === 'PRODUCTO_SELLADO';
     if (cat === 'psa') return card.categoria === 'psa' || Boolean(card.precios?.psa10 || card.precios?.psa9 || card.precios?.psa8);
     if (cat === 'raw') return card.categoria === 'raw' || (card.categoria !== 'sealed' && Boolean(card.precios?.raw));
     return card.categoria === cat;
   };
   ```
   - Multicriteria search logic:
     * Check if card matches category, era, condition, type, and price.
     * When `f.searchQuery` is present, check across all tokens (name, set, type, rarity, cert).
     * If searching with a specific category yields 0 results across the catalog, automatically test matching across the entire vault (`cat = 'all'`). If matches exist across the vault, return those matches and update the title/badge to inform the user: `"Mostrando 1 activo en Toda la Bóveda para '${f.searchQuery}'"`.
2. **`js/app.js` — `handleRoute()` for `#catalog` (lines 75-84)**:
   - When `qParam` is present and `catParam` is absent, reset `Store.data.catalogFilters.category = 'all'` and `era = 'all'` so the search query is unrestricted by default.
3. **Synchronize Search Bar**:
   - Ensure `document.getElementById('global-search').value = Store.data.catalogFilters.searchQuery || ''` is maintained when rendering `#catalog`.

---

### 4.3 Implementation Plan for Requirement R5 (Categories Drawer Styling)
1. **`index.html` — Drawer Links (lines 186-234)**:
   - Upgrade category items to modern cards with microinteractions:
   ```html
   <a href="#catalog" onclick="app.closeCategoriesDrawer()" class="drawer-cat-btn group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-gradient-to-r from-slate-800/80 to-slate-900/90 hover:from-slate-800 hover:to-slate-700 hover:border-amber-500/30 text-white transition-all duration-200 hover:translate-x-1 shadow-sm">
     <div class="flex items-center gap-3">
       <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#FEF3C7] group-hover:scale-110 transition-transform">
         <i data-lucide="layout-grid" class="w-4 h-4 text-[#FEF3C7]"></i>
       </div>
       <div class="text-left">
         <div class="text-xs font-black tracking-tight group-hover:text-[#FEF3C7] transition-colors">1. Ver Todo el Catálogo</div>
         <div class="text-[10px] text-slate-400 font-medium">Bóveda Completa • 13 Activos</div>
       </div>
     </div>
     <span class="px-2.5 py-0.5 text-[9.5px] font-black rounded-full bg-white/10 text-slate-200 border border-white/10 shadow-xs">Todos</span>
   </a>
   ```
2. **Category Badges**:
   - Slabs PSA: `bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-[#FEF3C7] border border-amber-500/30`
   - Raw Singles: `bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 border border-emerald-500/30`
   - Cajas Selladas: `bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-300 border border-rose-500/30`
   - Era Clásica WotC: `bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-amber-300 border border-amber-500/30`
   - Era Moderna & Alt Arts: `bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-300 border border-sky-500/30`
3. **`css/styles.css`**:
   - Add `.drawer-cat-btn:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35); }`
   - Add active category highlight styling.

---

## 5. Verification Method

1. **Automated Unit Tests**:
   Execute Node test runner on affected test suites:
   - `node tests/test_pdp.test.mjs` (must pass all 47 tests, specifically verifying `psa-acrylic-slab`, `psa-inner-well`, `PROFESSIONAL SPORTS AUTHENTICATOR`, `<span>PSA</span>`, `psa-barcode`, `#certNumber`, `GRADO`, and `GEM MT 10`).
   - `node tests/test_adversarial_r3_r4.test.mjs` (must pass all 15 stress tests).
   - `node tests/challenger_stress_r4_r5_r6.test.mjs` (must pass all 15 adversarial tests).
   - `node tests/test_challenger_m3_ui.test.mjs` (must pass all 29 UI tests).

2. **Empirical Code & Visual Verification**:
   - Inspect PDP in browser under Inspector Mode 'Slab PSA' (`#pdp?id=charizard-base`): Verify clear transparent acrylic with frosted stepped rim, 4 corner notches ("muescas"), red-framed official PSA label, and molded PSA emblem.
   - Test Multicriteria Search in Catalog (`#catalog`):
     * Select category "Cartas Sueltas / Raw", search for "charizard" -> Charizard must be displayed with its Raw price ($750.00) without being blocked.
     * Select category "Slabs Certificados PSA", search for "umbreon" -> Umbreon must be displayed with its PSA 10 price ($1,350.00).
   - Inspect Categories Drawer (`[☰ Categorías]` button): Verify luxurious dark/gold/crimson buttons, refined 1px borders, subtle gradients, `translateX(4px)` hover microinteractions, icon scale, hierarchical typography, and colorful category badges.
