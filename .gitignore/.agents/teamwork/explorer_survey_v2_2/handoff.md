# Handoff Report — Requirement R3: API Search Integration, Images, and Realistic Pricing

**Agent:** `explorer_survey_v2_2` (Teamwork Explorer)  
**Parent Orchestrator:** `69df657e-af80-4a62-b4e5-01b97f66b9a7`  
**Working Directory:** `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_v2_2\`  
**Target Project:** `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`  
**Handoff Type:** Hard (Survey Investigation Complete)

---

## 1. Observation

### 1.1 Broken Card Images
1. **File:** `js/services/pokemon-api.js`, lines 144-150:
   ```javascript
   return cards.slice(0, 12).map(c => {
     let img = 'img/charizard-base.png';
     if (c.image) {
       img = (c.image.endsWith('.webp') || c.image.endsWith('.png') || c.image.endsWith('.jpg'))
         ? c.image
         : `${c.image}/high.webp`;
     }
     ...
     imagen: img,
   ```
2. **File:** `js/views/search-results.js`, lines 417-422:
   ```html
   <img 
     src="${card.imagen || 'img/charizard-base.png'}" 
     alt="${this._escapeHtml(card.nombre)}" 
     class="max-h-48 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
     onerror="this.onerror=null; this.src='img/charizard-base.png'"
     loading="lazy"
   />
   ```
3. **Local Directory Audit (`img/`):**
   `list_dir` on `img/` confirmed only the following files exist:
   `booster-team-rocket.png`, `logo.png`, `cards/card-back.png`, `cards/raichu-gx.png`, and `sealed/team-rocket-box-{front,perspective,side}.png`.
   **The file `'img/charizard-base.png'` does not exist in the local workspace.**
4. **API Response Audit (`tcgdex.net`):**
   Live query to `https://api.tcgdex.net/v2/en/cards?name=pikachu`:
   Out of 243 cards, 200 provide `c.image` (e.g. `https://assets.tcgdex.net/en/swsh/fut2020/1`), while 43 cards (~18%) have `c.image === undefined` (e.g. `tk-hs-r-2`, `2024sv-2`, `2018sm-4`). Cards without images occur within the first 5 results.
5. **Primary API Failover:**
   `https://api.pokemontcg.io/v2/cards` returns HTTP 502 Bad Gateway from Cloudflare, triggering immediate failover to Tier 2 (`tcgdex.net`).

### 1.2 Static $15.00 Placeholder Pricing
1. **File:** `js/services/pokemon-api.js`, line 157:
   ```javascript
   precioEstimado: Number(c.precioEstimado) || 15.00,
   ```
   Because `https://api.tcgdex.net/v2/en/cards?name=...` only returns `{ id, localId, name, image }`, `c.precioEstimado` is undefined, causing 100% of TCGdex search cards to default to `$15.00`.
2. **File:** `js/services/pokemon-api.js`, lines 154-155:
   ```javascript
   set: c.set?.name || 'TCG Set',
   rareza: c.rarity || 'Rare',
   ```
   All cards default to `"TCG Set"` and `"Rare"`.
3. **API Pricing Fields:**
   Full card details from TCGdex (`https://api.tcgdex.net/v2/en/cards/<id>`) contain:
   `pricing.tcgplayer.normal.marketPrice`, `pricing.tcgplayer.holofoil.marketPrice`, and `pricing.cardmarket.avg`.
   In PokemonTCG.io, cards contain `cardmarket.prices.averageSellPrice`, `tcgplayer.prices.holofoil.market`, and `tcgplayer.prices.normal.market`.

### 1.3 Store Flow & PDP Integration
1. **File:** `js/views/search-results.js`, lines 397-471:
   ```javascript
   const matchedVaultProduct = (typeof PRODUCTS !== 'undefined')
     ? PRODUCTS.find(p => p.id === card.id || p.nombre.toLowerCase() === (card.nombre || '').toLowerCase())
     : null;
   ```
   Non-vault items render only:
   ```html
   <button type="button" onclick="SearchResultsView.openQuoteModal('${this._escapeHtml(card.nombre)}', '${this._escapeHtml(card.set)}', ${card.precioEstimado})" ...>
     <span>Solicitar Adquisición</span>
   </button>
   ```
   `openQuoteModal` merely displays `app.showToast(...)` with a text string. Neither the card item nor the button opens PDP.
2. **File:** `js/app.js`, lines 165-168:
   ```javascript
   openProductPDP(productId) {
     const found = PRODUCTS.find(p => p.id === productId);
     if (!found) return;
   ```
   If an external API card ID is passed, `openProductPDP` returns early without executing.
3. **File:** `js/app.js`, lines 51-56:
   `handleRoute()` looks up `prodId` exclusively in `PRODUCTS`.
4. **File:** `js/views/pdp.js`, lines 410-413:
   `PDPView.render()` expects `product.precios` with `{ raw, psa8, psa9, psa10 }` and will crash with `TypeError: Cannot read properties of undefined (reading 'toLocaleString')` if missing.

---

## 2. Logic Chain

1. **Broken Images:**
   - *Premise (Obs 1.1, 1.3):* `_normalizeSecondaryResults` sets `img = 'img/charizard-base.png'` whenever `c.image` is undefined.
   - *Premise (Obs 1.4):* 18% of TCGdex search items have `c.image === undefined`.
   - *Premise (Obs 1.3):* `'img/charizard-base.png'` does not exist on disk (404).
   - *Premise (Obs 1.2):* `SearchResultsView` sets `onerror="this.onerror=null; this.src='img/charizard-base.png'"`.
   - *Deduction:* When `c.image` is undefined, `src` requests a nonexistent file (404), triggering `onerror`. The handler sets `this.src` to the same nonexistent file (double 404) and clears `onerror`. The browser ceases loading and renders the broken image icon with alt text.
   - *Remedy:* Replace `'img/charizard-base.png'` with `'img/cards/card-back.png'` (which is physically present in the project) and prioritize cards with artwork (`c.image`) in `_normalizeSecondaryResults`.

2. **Static $15.00 Prices:**
   - *Premise (Obs 1.1, 2.1):* Primary source fails with 502, forcing fallback to TCGdex.
   - *Premise (Obs 2.1):* TCGdex list search returns objects without `precioEstimado`.
   - *Premise (Obs 2.1):* Code has hardcoded `Number(c.precioEstimado) || 15.00`.
   - *Deduction:* All search cards from TCGdex fallback receive the static `$15.00` price.
   - *Remedy:* Implement a realistic dynamic pricing calculator in `PokemonAPI`. If API market fields exist (`tcgplayer`, `cardmarket`), use them; otherwise, compute price deterministically based on rarity tier ($2 common to $80+ secret rare), era multiplier (vintage WotC 3.5×-5× vs modern 1×), popular card keyword bonuses, and card ID hash variation.

3. **Store Flow Disconnection:**
   - *Premise (Obs 3.1):* Non-vault items only trigger `openQuoteModal`, which does not route to PDP.
   - *Premise (Obs 3.2, 3.3):* `app.openProductPDP` and `app.handleRoute` only search in `PRODUCTS`.
   - *Premise (Obs 3.4):* `PDPView` requires a complete vault product schema (`precios: {raw, psa8, psa9, psa10}`, `certNumber`, etc.).
   - *Deduction:* Users cannot inspect or purchase external cards discovered via API search.
   - *Remedy:* Introduce `Store.registerApiCard(card)` and `Store.getProduct(id)`. When an API card is clicked or acquired, normalize it into a full vault product with calculated condition tiers (Raw, PSA 8, PSA 9, PSA 10) and route seamlessly to `#pdp?id=${id}` so the user can inspect in 3D and add to cart.

---

## 3. Caveats

1. **Network Sandbox Mode:** When running automated tests inside a sandboxed environment without external network access, live HTTP requests to `pokemontcg.io` or `tcgdex.net` will abort or timeout to local fallback. All pricing heuristics and image fallbacks must function 100% offline deterministically.
2. **Preserving Challenger Test Invariants:** Test `test_challenger_m3_ui.test.mjs` (lines 688-690) asserts that external cards contain `"SearchResultsView.openQuoteModal"` and `"Solicitar Adquisición"`. The implementation must preserve these strings and call `openQuoteModal`, but enrich `openQuoteModal` to register the product in `Store` and route to PDP.

---

## 4. Conclusion

The search subsystem issues stem from missing local fallback assets, incomplete normalization defaults, and lack of external product registration in the router and store. The proposed modifications resolve all three problems:
- **Image Fix:** Use `img/cards/card-back.png` as fallback, append `/high.webp` to TCGdex assets, and sort cards with artwork first.
- **Realistic Pricing:** Replace the static $15.00 fallback with a deterministic multi-variable pricing engine supporting real market data and rarity/vintage/keyword heuristics.
- **Store Flow Integration:** Add `Store.registerApiCard()` and `Store.getProduct()` so that clicking any API card opens its interactive 3D PDP with dynamic PSA grading prices and full checkout integration.

---

## 5. Verification Method

### Automated Test Verification
Run the complete test suite using Node.js native test runner:
```powershell
node --test tests/test_validations.test.mjs tests/test_pdp.test.mjs tests/test_search_failover.test.mjs tests/test_cart_toast.test.mjs tests/test_profile_orders.test.mjs tests/test_e2e_suite.test.mjs
```
*Expected Result:* 182 passed, 0 failed.

### Search Verification
Execute node verification script for image and price normalization:
```powershell
node -e "
const api = new (require('./js/services/pokemon-api.js').PokemonAPI)();
api.searchCards('Pikachu', { failPrimary: true }).then(cards => {
  console.log('Results count:', cards.length);
  cards.forEach(c => {
    console.log(c.nombre, '|', c.rareza, '| $', c.precioEstimado, '| Img:', c.imagen);
  });
});
"
```
*Verification Invalidation Conditions:*
- Any card image evaluates to `'img/charizard-base.png'`.
- Any card shows exactly `$15.00` across diverse rarities.
- Selecting an external card fails to navigate to `#pdp?id=...` or throws a `TypeError` in `PDPView`.
