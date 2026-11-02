# Handoff Report: R3 (Catalog Image Updates in data.js) and DOM Rendering Investigation

**Agent**: Explorer Survey 2  
**Date**: 2026-11-02T19:57:30Z  
**Target Milestone**: Survey & Implementation Readiness (R3: Catalog Image Updates & DOM Rendering)  
**Parent Conversation ID**: `c10fd964-6d92-459a-9403-9be990d2711b`  

---

## 1. Observation

### 1.1 Filesystem Asset Verification
Inspected filesystem under `img/cards/` and `img/sealed/` using `list_dir` and PowerShell `Get-ChildItem -Path 'img' -Recurse`:
1. `img/cards/gengar-holo-scarlet.png`:
   - Absolute path: `C:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\cards\gengar-holo-scarlet.png`
   - Presence: Confirmed on disk.
   - Size: 717,802 bytes.
   - Casing: Exact lowercase `gengar-holo-scarlet.png`.
2. `img/cards/mewto-holo-rare.png`:
   - Absolute path: `C:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\cards\mewto-holo-rare.png`
   - Presence: Confirmed on disk.
   - Size: 1,343,533 bytes.
   - Casing & Spelling: Exact lowercase `mewto-holo-rare.png` (**Notice:** `mewto` without `w` before `t`).
3. `img/cards/mimikyu-rare.png`:
   - Absolute path: `C:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\cards\mimikyu-rare.png`
   - Presence: Confirmed on disk.
   - Size: 1,959,410 bytes.
   - Casing: Exact lowercase `mimikyu-rare.png`.
4. `img/sealed/Paquete fossil.png`:
   - Absolute path: `C:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\img\sealed\Paquete fossil.png`
   - Presence: Confirmed on disk.
   - Size: 1,418,516 bytes.
   - Casing & Spacing: Capital `P`, space, lowercase `fossil.png` (`Paquete fossil.png`).

### 1.2 Product Definitions in `js/data.js`
In `js/data.js`:
- **Gengar**: Defined in array `POKEMON_CARDS_CATALOG_10` (lines 90–113):
  ```javascript
  {
    id: 'gengar-scarlet-violet',
    nombre: 'Gengar Holo Rare #057/198',
    set: 'Scarlet & Violet 2023',
    ...
    imagenLocal: 'img/gengar-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv1/57_hires.png',
  ```
  *Observed issue:* `img/gengar-vmax.png` does not exist in `img/`; it was relying on network fallback.
- **Mimikyu**: Defined in array `POKEMON_CARDS_CATALOG_10` (lines 140–163):
  ```javascript
  {
    id: 'mimikyu-paldean',
    nombre: 'Mimikyu Baby Shiny #097/091',
    set: 'Paldean Fates 2024',
    ...
    imagenLocal: 'img/umbreon-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv4pt5/97_hires.png',
  ```
  *Observed issue:* `imagenLocal` points to Umbreon placeholder (`img/umbreon-vmax.png`).
- **Mewtwo**: Defined in array `POKEMON_CARDS_CATALOG_10` (lines 165–188):
  ```javascript
  {
    id: 'mewtwo-151',
    nombre: 'Mewtwo Holo Rare #059/165',
    set: 'Pokemon 151 2023',
    ...
    imagenLocal: 'img/mewtwo-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv3pt5/59_hires.png',
  ```
  *Observed issue:* `imagenLocal` points to Base Set placeholder (`img/mewtwo-base.png`).
- **Fossil Sealed Pack/Display**: Defined in array `SEALED_PRODUCTS` (lines 313–355):
  ```javascript
  {
    id: 'booster-box-fossil-1999',
    nombre: 'Caja Sellada Booster Box Fossil 1999 (36 Packs)',
    set: 'Fossil WotC 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Incoloro',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291955',
    imagenLocal: 'img/sealed/team-rocket-box-front.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base3/1_hires.png',
    galeria_sellada: {
      frontal: 'img/sealed/team-rocket-box-front.png',
      perspectiva: 'img/sealed/team-rocket-box-perspective.png',
      lateral: 'img/sealed/team-rocket-box-side.png'
    },
  ```
  *Observed issue:* Both `imagenLocal` and all three angles in `galeria_sellada` point to Team Rocket box images (`team-rocket-box-*.png`).
- Merged array `PRODUCTS` (lines 616–619):
  ```javascript
  const PRODUCTS = [
    ...POKEMON_CARDS_CATALOG_10,
    ...SEALED_PRODUCTS
  ];
  ```

### 1.3 DOM Rendering Traces across the Codebase
1. **Catalog View (`js/views/catalog.js:360-365`)**:
   ```html
   <img 
     src="${card.imagenLocal}" 
     alt="${card.nombre}" 
     class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
     onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
   />
   ```
2. **Home View Featured Cards (`js/views/home.js:251-256`)**:
   ```html
   <img 
     src="${card.imagenLocal}" 
     alt="${card.nombre}" 
     class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
     onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
   />
   ```
   *Note:* `POKEMON_CARDS_CATALOG_10.slice(0, 4)` is rendered here; Gengar (`gengar-scarlet-violet`) is item index 3 (4th featured card).
3. **Home View Sealed Vault Showcase (`js/views/home.js:323-328`)**:
   ```html
   <img 
     src="${pack.imagenLocal}" 
     alt="${pack.nombre}" 
     class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
     onerror="this.onerror=null; this.src='${pack.imagenFallbackUrl}'"
   />
   ```
   *Note:* `SEALED_PRODUCTS` is rendered here; `booster-box-fossil-1999` is item index 1 (2nd featured sealed item).
4. **Product Detail Page (PDP) / Product Modal (`js/views/pdp.js`)**:
   - Single Card Front View (`lines 135–141`):
     `<img id="pdp-main-image" src="${product.imagenLocal}" ... onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'" />`
   - Single Card PSA Slab View (`lines 107–112`):
     `<img src="${product.imagenLocal}" alt="${product.nombre} encapsulada en Slab PSA" ... onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'" />`
   - Sealed Stage (`lines 167–201`):
     `const gallery = product.galeria_sellada || { frontal: product.imagenLocal, perspectiva: product.imagenFallbackUrl || product.imagenLocal, lateral: product.imagenLocal };`
     `const currentImage = gallery[activeAngle] || gallery.frontal || product.imagenLocal;`
     `<img id="pdp-sealed-main-img" src="${currentImage}" ... onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'" />`
   - Adding to Cart (`lines 844–851`):
     ```javascript
     let image = product.imagenLocal || 'img/cards/card-back.png';
     if (isSealed) {
       if (product.galeria_sellada && product.galeria_sellada.frontal) {
         image = product.galeria_sellada.frontal;
       }
     }
     ```
5. **Live Search Spotlight Dropdown (`js/app.js:682–687`)**:
   Renders `<img src="${card.imagenLocal}" alt="${card.nombre}" ... onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'" />`.
6. **Cart View (`js/views/cart.js:38–43`)**:
   Renders `<img src="${item.imageLocal}" alt="${item.name}" ... onerror="this.onerror=null; this.src='${item.imageFallback}'" />`.
7. **Tracking View (`js/views/tracking.js:474–479`)**:
   Renders `<img src="${item.imageLocal || item.imagen || item.imagenLocal || 'img/cards/card-back.png'}" ... />`.

### 1.4 Secondary Product References
- `js/db/db-client.js`: Lines 808–868 contain Dexie IndexedDB initial seed records:
  - SKU `PKM-SV-GEN-057` has `imagen_local: 'img/gengar-vmax.png'`.
  - SKU `PKM-PF-MIM-097` has `imagen_local: 'img/umbreon-vmax.png'`.
  - SKU `PKM-151-MEW-059` has `imagen_local: 'img/mewtwo-base.png'`.
- Test suite: `node --test tests/*.test.mjs` currently runs **429 tests** and passes 100% (429 pass, 0 fail).

---

## 2. Logic Chain

1. **Premise 1 (Physical Availability)**: All four target image files exist on disk with verifiable sizes and paths:
   - `img/cards/gengar-holo-scarlet.png`
   - `img/cards/mewto-holo-rare.png`
   - `img/cards/mimikyu-rare.png`
   - `img/sealed/Paquete fossil.png`
2. **Premise 2 (Direct Data Dependency)**: In `js/data.js`, the primary catalog `PRODUCTS` is derived from `POKEMON_CARDS_CATALOG_10` and `SEALED_PRODUCTS`. All frontend views (`CatalogView`, `HomeView`, `PDPView`, live search dropdown) read directly from `card.imagenLocal` or `product.imagenLocal`.
3. **Premise 3 (Sealed Gallery Structure)**: For sealed products, `PDPView.renderSealedGalleryStage` and `PDPView.addToCart` read from `product.galeria_sellada.frontal` ahead of `product.imagenLocal`. If `galeria_sellada` in `booster-box-fossil-1999` is not updated along with `imagenLocal`, the PDP modal/stage and cart will continue to display the old Team Rocket box artwork (`img/sealed/team-rocket-box-front.png`).
4. **Conclusion**:
   - Updating `imagenLocal` in `POKEMON_CARDS_CATALOG_10` for `gengar-scarlet-violet`, `mimikyu-paldean`, and `mewtwo-151` immediately updates catalog cards, home showcase cards, spotlight search, and PDP inspector stages (both standard and slab views).
   - Updating `imagenLocal`, `imagenFallbackUrl`, and `galeria_sellada` (`frontal`, `perspectiva`, `lateral`) in `booster-box-fossil-1999` guarantees that the Fossil item renders `img/sealed/Paquete fossil.png` across catalog, home showcase, PDP multi-angle gallery, and cart without broken links or mismatching Team Rocket images.
   - Synchronizing `js/db/db-client.js` seed data for the 3 matching SKUs ensures parity between static JavaScript memory and local client databases.

---

## 3. Caveats

1. **Filename Spelling of Mewtwo**:
   The physical file on disk is `img/cards/mewto-holo-rare.png` (without the 'w' in `mewto`). The path must be specified exactly as `img/cards/mewto-holo-rare.png` to avoid 404 / broken image errors.
2. **Filename Casing & Space in Fossil Pack**:
   The physical file on disk has a capital `P` and a space: `img/sealed/Paquete fossil.png`. While Windows filesystems are case-insensitive, web URLs and standard web servers (e.g. Linux, GitHub Pages) are strictly case-sensitive and URI-encoded. The string `'img/sealed/Paquete fossil.png'` must preserve the exact casing and spacing.
3. **Legacy Fixture Objects**:
   `LEGACY_FIXTURE_PRODUCTS` in `js/data.js` contains older test fixtures (`gengar-vmax`, `mewtwo-base-1999`). These are preserved for backwards compatibility with legacy unit test mocks and should not be confused with the 10-card catalog items in `POKEMON_CARDS_CATALOG_10`.
4. **Sealed Multi-Angle Gallery**:
   Only one Fossil image exists (`img/sealed/Paquete fossil.png`). Therefore, all 3 angles in `galeria_sellada` (`frontal`, `perspectiva`, `lateral`) should point to `img/sealed/Paquete fossil.png`, mirroring how `booster-pack-base-1999` handles single-image sealed items (see `js/data.js:367–373`).

---

## 4. Conclusion & Recommended Code Changes

### 4.1 Recommended Edits in `js/data.js`

#### Change 1: Gengar Card (`id: 'gengar-scarlet-violet'`)
*Location: lines 101–102 in `js/data.js`*
```javascript
// BEFORE:
    imagenLocal: 'img/gengar-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv1/57_hires.png',

// AFTER:
    imagenLocal: 'img/cards/gengar-holo-scarlet.png',
    imagenFallbackUrl: 'img/cards/gengar-holo-scarlet.png',
```

#### Change 2: Mimikyu Card (`id: 'mimikyu-paldean'`)
*Location: lines 151–152 in `js/data.js`*
```javascript
// BEFORE:
    imagenLocal: 'img/umbreon-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv4pt5/97_hires.png',

// AFTER:
    imagenLocal: 'img/cards/mimikyu-rare.png',
    imagenFallbackUrl: 'img/cards/mimikyu-rare.png',
```

#### Change 3: Mewtwo Card (`id: 'mewtwo-151'`)
*Location: lines 176–177 in `js/data.js`*
```javascript
// BEFORE:
    imagenLocal: 'img/mewtwo-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv3pt5/59_hires.png',

// AFTER:
    imagenLocal: 'img/cards/mewto-holo-rare.png',
    imagenFallbackUrl: 'img/cards/mewto-holo-rare.png',
```

#### Change 4: Fossil Sealed Product (`id: 'booster-box-fossil-1999'`)
*Location: lines 325–331 in `js/data.js`*
```javascript
// BEFORE:
    imagenLocal: 'img/sealed/team-rocket-box-front.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base3/1_hires.png',
    galeria_sellada: {
      frontal: 'img/sealed/team-rocket-box-front.png',
      perspectiva: 'img/sealed/team-rocket-box-perspective.png',
      lateral: 'img/sealed/team-rocket-box-side.png'
    },

// AFTER:
    imagenLocal: 'img/sealed/Paquete fossil.png',
    imagenFallbackUrl: 'img/sealed/Paquete fossil.png',
    galeria_sellada: {
      frontal: 'img/sealed/Paquete fossil.png',
      perspectiva: 'img/sealed/Paquete fossil.png',
      lateral: 'img/sealed/Paquete fossil.png'
    },
```

### 4.2 Recommended Synchronized Edits in `js/db/db-client.js`
*Location: lines 815, 847, 863 in `js/db/db-client.js`*
- Line 815 (`PKM-SV-GEN-057`): Update `imagen_local: 'img/cards/gengar-holo-scarlet.png'`.
- Line 847 (`PKM-PF-MIM-097`): Update `imagen_local: 'img/cards/mimikyu-rare.png'`.
- Line 863 (`PKM-151-MEW-059`): Update `imagen_local: 'img/cards/mewto-holo-rare.png'`.

---

## 5. Verification Method

### 5.1 Verification Script
Run the following programmatic assertion test using Node:
```javascript
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { POKEMON_CARDS_CATALOG_10, SEALED_PRODUCTS, PRODUCTS } from './js/data.js';

// 1. Physical existence of all 4 images
const assets = [
  'img/cards/gengar-holo-scarlet.png',
  'img/cards/mewto-holo-rare.png',
  'img/cards/mimikyu-rare.png',
  'img/sealed/Paquete fossil.png'
];
for (const relPath of assets) {
  const fullPath = path.join(process.cwd(), relPath);
  assert.ok(fs.existsSync(fullPath), `Asset must exist: ${relPath}`);
  assert.ok(fs.statSync(fullPath).size > 100000, `Asset must be valid image: ${relPath}`);
}

// 2. Data model assertions in js/data.js
const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');
assert.equal(gengar.imagenLocal, 'img/cards/gengar-holo-scarlet.png');

const mewtwo = PRODUCTS.find(p => p.id === 'mewtwo-151');
assert.equal(mewtwo.imagenLocal, 'img/cards/mewto-holo-rare.png');

const mimikyu = PRODUCTS.find(p => p.id === 'mimikyu-paldean');
assert.equal(mimikyu.imagenLocal, 'img/cards/mimikyu-rare.png');

const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
assert.equal(fossil.imagenLocal, 'img/sealed/Paquete fossil.png');
assert.equal(fossil.galeria_sellada.frontal, 'img/sealed/Paquete fossil.png');
```

### 5.2 Test Suite Execution
Execute the project test command to confirm zero regressions:
```bash
node --test tests/*.test.mjs
```
Expected outcome: All tests pass (≥ 429 passing tests).

### 5.3 Invalidation Conditions
The conclusion would be invalidated if:
- Any of the 4 image files is renamed, moved, or deleted from disk.
- An existing test specifically asserts that `gengar-scarlet-violet` has `imagenLocal === 'img/gengar-vmax.png'` (verified: none do).
- A PDP modal test expects `galeria_sellada.frontal` for `booster-box-fossil-1999` to be `team-rocket-box-front.png` (verified: tests only test `booster-team-rocket` for `team-rocket-box-front.png`).
