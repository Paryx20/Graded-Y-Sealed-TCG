# Technical Investigation Report: Requirement R3 (API Search Integration, Images, and Realistic Pricing)

**Document:** `analysis.md`  
**Date:** 2026-11-02T03:26:00Z  
**Investigator:** Teamwork Explorer (Survey Instance 2)  
**Target Project:** Graded & Sealed TCG E-commerce (`c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`)  
**Scope:** R3 — API Card Search Integration, Image Asset Resolution, Realistic Dynamic Pricing, and Store Flow Lifecycle  

---

## Executive Summary

Investigation into Requirement R3 reveals three interconnected root causes affecting the real-time search subsystem:
1. **Broken Card Images:** When the primary API (`pokemontcg.io`) experiences outages or timeouts (returning HTTP 502 Bad Gateway), the failover cascade switches to Tier 2 (`tcgdex.net`). However, ~18% of TCGdex search results lack an `image` property. In `js/services/pokemon-api.js` line 145 and `js/views/search-results.js` line 421, missing images and the `onerror` fallback both point to `'img/charizard-base.png'`, an asset that does not exist in the project repository. This causes a double 404, resulting in broken image icons with alt text.
2. **Static $15.00 Placeholder Prices:** The TCGdex search list endpoint (`/v2/en/cards?name=...`) returns lightweight objects containing only `{ id, localId, name, image }`—omitting `set`, `rarity`, and `pricing`. In `js/services/pokemon-api.js` line 157, `c.precioEstimado` evaluates to undefined and falls back unconditionally to `15.00`. Similarly, `set` defaults to `"TCG Set"` and `rareza` defaults to `"Rare"`.
3. **Broken Store Flow Integration:** External API cards are not registered in `PRODUCTS`. In `js/views/search-results.js` lines 463-471, cards not in `PRODUCTS` render a "Solicitar Adquisición" button that merely fires an ephemeral toast via `SearchResultsView.openQuoteModal` without opening the Product Detail Page (PDP). Furthermore, both `app.openProductPDP(id)` and `app.handleRoute()` in `js/app.js` only look up cards within `PRODUCTS`, returning early on API card IDs. Even if navigated to directly, `PDPView.render()` in `js/views/pdp.js` expects a `precios` object with `{ raw, psa8, psa9, psa10 }` and crashes with a `TypeError` on missing properties.

---

## 1. Broken Card Images in API Search Results

### 1.1 Direct Observations & Evidence

- **Screenshot Evidence:** In `media_1793587837576_3085961d.jpg` and `media_1793587852151_4661f05c.jpg`, cards 1 and 2 ("Pikachu on the Ball" and "Pikachu Base Set Promo") display artwork, while cards 3 and 4 display browser broken image icons with alt text `"Pikachu"`. All cards display the badge `RESPALDO TCGDEX.NET`.
- **Primary API Failure:** Live queries to `https://api.pokemontcg.io/v2/cards` return `HTTP 502 Bad Gateway` from Cloudflare origin, causing `PokemonAPI.searchCards()` to immediately switch to Tier 2 (`tcgdex.net`).
- **TCGdex Search Data Distribution:** Live queries to `https://api.tcgdex.net/v2/en/cards?name=pikachu` return 243 cards:
  - 200 cards contain an `image` base URL (e.g., `https://assets.tcgdex.net/en/swsh/fut2020/1`).
  - 43 cards (~18%) have **no `image` property at all** (e.g., `tk-hs-r-2`, `2024sv-2`, `2018sm-4`).
  - The first 5 results returned from TCGdex are:
    1. `fut2020-1` (`image` present)
    2. `basep-1` (`image` present)
    3. `tk-hs-r-2` (`image` is undefined)
    4. `2024sv-2` (`image` is undefined)
    5. `2018sm-4` (`image` is undefined)
  - This perfectly matches the screenshot where cards 3 and 4 are broken!

### 1.2 Code Inspection

#### File: `js/services/pokemon-api.js` (lines 142-161)
```javascript
142:   _normalizeSecondaryResults(cards) {
143:     if (!Array.isArray(cards)) return [];
144:     return cards.slice(0, 12).map(c => {
145:       let img = 'img/charizard-base.png';
146:       if (c.image) {
147:         img = (c.image.endsWith('.webp') || c.image.endsWith('.png') || c.image.endsWith('.jpg'))
148:           ? c.image
149:           : `${c.image}/high.webp`;
150:       }
151:       return {
152:         id: String(c.id || ''),
153:         nombre: c.name || 'Sin Nombre',
154:         set: c.set?.name || 'TCG Set',
155:         rareza: c.rarity || 'Rare',
156:         imagen: img,
157:         precioEstimado: Number(c.precioEstimado) || 15.00,
158:         fuente: 'tcgdex.net'
159:       };
160:     });
161:   }
```

#### File: `js/views/search-results.js` (lines 415-424)
```javascript
415:           <!-- Card Thumbnail -->
416:           <div class="p-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white min-h-[220px]">
417:             <img 
418:               src="${card.imagen || 'img/charizard-base.png'}" 
419:               alt="${this._escapeHtml(card.nombre)}" 
420:               class="max-h-48 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
421:               onerror="this.onerror=null; this.src='img/charizard-base.png'"
422:               loading="lazy"
423:             />
424:           </div>
```

#### Local Asset Audit (`img/` directory):
A complete directory inspection of `img/` yields:
- `img/booster-team-rocket.png`
- `img/logo.png`
- `img/cards/card-back.png` (authentic official Pokemon card back, 334 KB)
- `img/cards/raichu-gx.png`
- `img/sealed/team-rocket-box-front.png`
- `img/sealed/team-rocket-box-perspective.png`
- `img/sealed/team-rocket-box-side.png`

**`img/charizard-base.png` does NOT exist in the repository.**

### 1.3 Image URL Specifications & Formats

1. **TCGdex Asset CDN:**
   - Base format: `https://assets.tcgdex.net/{lang}/{set_path}/{local_id}`
   - Supported extensions (verified via HTTP HEAD requests):
     * `/high.webp` (status: 200, Content-Type: `image/webp`)
     * `/low.webp` (status: 200, Content-Type: `image/webp`)
     * `/high.png` (status: 200, Content-Type: `image/png`)
     * `/low.png` (status: 200, Content-Type: `image/png`)
   - Recommendation: Append `/high.webp` for cards that have `c.image`.

2. **PokemonTCG.io:**
   - Format: `c.images.small` (e.g., `https://images.pokemontcg.io/base1/4.png`) and `c.images.large` (e.g., `https://images.pokemontcg.io/base1/4_hires.png`). Both are complete URLs with file extensions.

3. **Fallback Strategy:**
   - Local fallback: `'img/cards/card-back.png'` (guaranteed local availability).
   - Network fallback: `'https://images.pokemontcg.io/base1/4_hires.png'` (used by `PRODUCTS[0].imagenFallbackUrl`).
   - Prioritization: Filter cards in search normalization so that cards with valid artwork appear first:
     ```javascript
     const withImg = cards.filter(c => !!c.image);
     const withoutImg = cards.filter(c => !c.image);
     const sortedCards = [...withImg, ...withoutImg].slice(0, 12);
     ```

---

## 2. Static $15.00 Placeholder Prices

### 2.1 Root Cause of $15.00

In `js/services/pokemon-api.js` line 157:
```javascript
precioEstimado: Number(c.precioEstimado) || 15.00,
```
- The endpoint `https://api.tcgdex.net/v2/en/cards?name=<query>` is a search index endpoint that does not include price data. Therefore, `c.precioEstimado` is always `undefined`, evaluating to `15.00` for every single card.
- In `_normalizePrimaryResults` (line 137), `pokemontcg.io` cards default to `10.00` if `c.cardmarket?.prices?.averageSellPrice` and `c.tcgplayer?.prices?.holofoil?.market` are missing.

### 2.2 Raw API Price Fields

#### 1. PokemonTCG.io Card Schema:
- `cardmarket.prices`:
  * `averageSellPrice`: Average selling price (EUR)
  * `lowPrice`: Lowest current listing
  * `trendPrice`: Trend pricing
  * `reverseHoloAvg`: Reverse holofoil average
- `tcgplayer.prices`:
  * `normal.market`, `normal.low`, `normal.mid`, `normal.high`
  * `holofoil.market`, `holofoil.low`, `holofoil.mid`, `holofoil.high`
  * `reverseHolofoil.market`
  * `1stEditionHolofoil.market`

#### 2. TCGdex Card Detail Schema (`/v2/en/cards/<id>`):
- `pricing.tcgplayer`:
  * `normal.marketPrice`, `normal.lowPrice`, `normal.midPrice`, `normal.highPrice`
  * `holofoil.marketPrice`, `holofoil.lowPrice`, `holofoil.midPrice`
- `pricing.cardmarket`:
  * `avg`, `low`, `trend`, `avg1`, `avg7`, `avg30`
- `set`: `{ id, name, symbol, cardCount }`
- `rarity`: e.g., `"Holo Rare V"`, `"Rare"`, `"Common"`, `"Ultra Rare"`

### 2.3 Parallel Card Detail Enrichment Performance
Empirical benchmarking (`run_command`) proved that fetching full details for the 12 search results in parallel using `Promise.all` executes in **under 400ms** (367ms measured), providing real set names ("Celebrations", "Pokémon Futsal 2020", "Detective Pikachu") and real market prices ($4.76, $357.50, $899.99).

### 2.4 Realistic Dynamic Pricing Model (When Market Data Is Absent)

When neither TCGplayer nor Cardmarket price fields are available, a realistic deterministic pricing algorithm must compute market value based on card attributes:

```
Calculated Price = Base Rarity Price × Vintage/Era Multiplier × Name/Keyword Multiplier × Hash Variance
```

#### A. Rarity Base Price Table:
| Rarity Tier | Indicators | Base Price (USD) |
|---|---|---|
| **Common** | `"Common"`, `"Común"`, none | $1.50 – $2.50 (Default: $2.00) |
| **Uncommon** | `"Uncommon"`, `"Infrecuente"` | $3.00 – $5.00 (Default: $3.75) |
| **Rare** | `"Rare"`, `"Rara"` | $7.00 – $14.00 (Default: $9.50) |
| **Holo Rare / V / EX** | `"Holo Rare"`, `"Rare Holo"`, `"V"`, `"EX"` | $18.00 – $38.00 (Default: $26.00) |
| **Ultra Rare / Secret** | `"Ultra Rare"`, `"Secret Rare"`, `"VMAX"`, `"VSTAR"`, `"Alt Art"` | $45.00 – $140.00 (Default: $78.00) |
| **Promo** | `"Promo"`, `"Black Star Promo"` | $12.00 – $35.00 (Default: $22.00) |

#### B. Vintage / Era Multiplier:
- **Vintage WotC (1999–2003):** Sets matching `base`, `jungle`, `fossil`, `rocket`, `gym`, `neo`, `expedition`, or release year ≤ 2003: **3.5× – 5.0×**
- **EX & HGSS Eras (2004–2010):** **2.0× – 2.5×**
- **BW / XY / Sun & Moon (2011–2019):** **1.3× – 1.6×**
- **Modern SWSH / SV (2020–present):** **1.0×**

#### C. Popular Pokemon & Keyword Multiplier:
- "Charizard": **2.5×**
- "Umbreon", "Lugia", "Rayquaza", "Gengar": **1.8×**
- "Pikachu", "Mewtwo", "Mew": **1.4×**
- "1st Edition" / "First Edition": **3.0×**
- "Gold Star" / "Shining" / "Crystal": **4.0×**

#### D. Deterministic Variation:
To avoid uniform prices (e.g. all rares being exactly $9.50), apply a deterministic hash multiplier based on `card.id` characters:
```javascript
function getStableVariance(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xFFFF;
  return 0.85 + (hash % 30) / 100; // Multiplier between 0.85 and 1.15
}
```

#### E. PSA Grading Price Matrix:
For any card entering PDP, generate condition prices:
```javascript
const raw = Math.round(basePrice * 100) / 100;
const isVintage = eraMultiplier > 2.0;
const psa8 = Math.round(raw * (isVintage ? 2.2 : 1.35) * 100) / 100;
const psa9 = Math.round(raw * (isVintage ? 5.5 : 1.85) * 100) / 100;
const psa10 = Math.round(raw * (isVintage ? 22.0 : 3.20) * 100) / 100;
```

---

## 3. Store Flow Integration

### 3.1 Current Disconnection Analysis

1. **Card Action Buttons in Search Grid (`js/views/search-results.js` lines 397-471):**
   ```javascript
   const matchedVaultProduct = (typeof PRODUCTS !== 'undefined')
     ? PRODUCTS.find(p => p.id === card.id || p.nombre.toLowerCase() === (card.nombre || '').toLowerCase())
     : null;
   ```
   - If `matchedVaultProduct` is false, the card displays a single button:
     `<button onclick="SearchResultsView.openQuoteModal(...)">Solicitar Adquisición</button>`
   - `openQuoteModal` only executes `app.showToast(...)` saying the acquisition request was sent.
   - The card thumbnail, title, and card item container have **zero click handlers**.
   - The user cannot view the card's details, 3D model, or condition options, nor add it to the cart!

2. **PDP Navigation Blocking in `js/app.js`:**
   - In `app.openProductPDP(productId)` (lines 165-181):
     ```javascript
     openProductPDP(productId) {
       const found = PRODUCTS.find(p => p.id === productId);
       if (!found) return; // Silent early return!
     ```
   - In `app.handleRoute()` (lines 51-66):
     ```javascript
     if (route === 'pdp') {
       const prodId = params.get('id');
       if (prodId) {
         const found = PRODUCTS.find(p => p.id === prodId);
         if (found) { ... }
     ```
   - Any external API card ID (e.g. `fut2020-1`, `basep-1`) fails the `PRODUCTS.find` check and is silently rejected.

3. **PDPView Crash Hazard (`js/views/pdp.js`):**
   - Lines 409-432 directly access:
     `product.precios.raw`, `product.precios.psa8`, `product.precios.psa9`, `product.precios.psa10`.
   - If an API card without this structure is passed to PDP, `item.price.toLocaleString()` throws an unhandled `TypeError`.

### 3.2 Required Architecture for Seamless Store Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   PokemonAPI.searchCards()                  │
│  - Fetches from Primary / Secondary / Local                 │
│  - Normalizes with real/heuristic pricing & valid images     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Store.registerApiCard(card)                 │
│  - Converts normalized card into complete Vault Product     │
│  - Synthesizes: precios {raw, psa8, psa9, psa10}, certCode, │
│    historialBase (12m), tendencia12m, era, tipo, categoria │
│  - Stores in Store.data.apiProducts[card.id]                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Store Resolution                       │
│  Store.findProduct(id) = PRODUCTS.find(...) || apiProducts  │
│  - Used by: app.openProductPDP, app.handleRoute, PDPView    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Interactive PDP & Cart                    │
│  - Free 3D card inspection (front and back)                 │
│  - Real-time condition price toggling (Raw, PSA 8, 9, 10)   │
│  - "Añadir a la bolsa" -> Checkout -> Order Tracking       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Test Suite Compatibility

The project has an automated test suite with 182 tests across:
- `tests/test_validations.test.mjs`
- `tests/test_pdp.test.mjs`
- `tests/test_search_failover.test.mjs`
- `tests/test_cart_toast.test.mjs`
- `tests/test_profile_orders.test.mjs`
- `tests/test_e2e_suite.test.mjs`

### Critical Contract Invariants:
1. `tests/test_challenger_m3_ui.test.mjs` requires that for external cards, `SearchResultsView.renderResultsGrid` markup includes:
   `SearchResultsView.openQuoteModal` and `"Solicitar Adquisición"`.
   * **Solution:** Keep `SearchResultsView.openQuoteModal` as the handler for the primary action button, but have it register the card and navigate to its PDP (or provide both "Inspeccionar / Ver Ficha" and "Solicitar Adquisición"). Also ensure clicking the card thumbnail or card title triggers `app.openProductPDP(card.id)`.
2. `tests/test_search_failover.test.mjs` asserts `fuente: 'tcgdex.net'`, `fuente: 'pokemontcg.io'`, `fuente: 'local-vault'`, and normalized fields `id`, `nombre`, `set`, `rareza`, `imagen`, `precioEstimado`.
   * **Solution:** Maintain these exact field keys and types.
3. Tests require that empty search returns `[]` immediately without delay.

---

## 5. File Modification Plan

| Target File | Changes Required |
|---|---|
| `js/services/pokemon-api.js` | 1. In `_normalizeSecondaryResults`, prioritize cards with images.<br>2. Replace missing image fallback `'img/charizard-base.png'` with `'img/cards/card-back.png'`.<br>3. Implement dynamic pricing engine (`_calculateCardPricing`) using raw price fields or realistic rarity/vintage heuristic.<br>4. Fetch parallel details or enhance search normalization with set and rarity heuristics. |
| `js/state.js` | 1. Add `Store.data.apiProducts = {}`.<br>2. Add `Store.registerApiCard(card)` to convert and cache API cards as full PDP-compatible products.<br>3. Add `Store.getProduct(id)` to resolve from both `PRODUCTS` and `Store.data.apiProducts`. |
| `js/app.js` | 1. Update `openProductPDP(productId)` to use `Store.getProduct(productId)`.<br>2. Update `handleRoute()` for `#pdp` route to use `Store.getProduct(prodId)`. |
| `js/views/search-results.js` | 1. Fix `onerror` in `_renderCardItem` to use `'img/cards/card-back.png'`.<br>2. Make card item clickable (`app.openProductPDP(card.id)`).<br>3. Enhance `SearchResultsView.openQuoteModal` so it registers the card and routes to `#pdp?id=${id}` while maintaining test compatibility with `"Solicitar Adquisición"`. |

---
*Report completed and verified against local repository state and live API contracts.*
