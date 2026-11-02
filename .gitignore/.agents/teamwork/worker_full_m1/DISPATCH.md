## 2026-11-02T03:41:13Z
You are teamwork_worker (Milestone 1 Implementation Worker).
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_full_m1\
Parent orchestrator conversation ID: 69df657e-af80-4a62-b4e5-01b97f66b9a7

OBJECTIVE:
Implement the complete UI, 3D interaction, condition pricing, API search integration, and stability fixes across the codebase to fulfill Requirements R1, R2, R3, and R4.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INPUTS:
- ORIGINAL_REQUEST.md: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PROJECT.md
- Explorer 1 Report (R1 3D Drag): c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_m1_1\handoff.md and analysis.md
- Explorer 2 Report (R2 Pricing & R3 Search): c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_m1_2\handoff.md and analysis.md
- Spec Miner 3 Report (R4 Tests & Stability): c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_m1_3\handoff.md and analysis.md

EXCLUSIVE WRITE OWNERSHIP:
You own exclusively:
- `js/views/pdp.js`
- `css/styles.css`
- `js/services/pokemon-api.js`
- `js/views/search-results.js`
- `js/state.js`
- `js/app.js`
- `js/views/catalog.js`
- `tests/test_challenger_m3_ui.test.mjs`
- `tests/test_pdp_3d_drag.test.mjs`
- `tests/test_condition_pricing.test.mjs`
- `tests/test_api_search_integration.test.mjs`

IMPLEMENTATION TASKS:

1. Requirement R1: Interactive 3D Card Viewer on PDP (`js/views/pdp.js`, `css/styles.css`):
   - In `js/views/pdp.js:afterRender()`, implement pointer/mouse/touch drag controller on `#pdp-3d-scene` rotating `#pdp-3d-object`:
     * Horizontal drag updates continuous `rotateY` (0 to 360 deg, enabling full inspection of both front and reverse sides).
     * Vertical drag updates clamped `rotateX` ([-40 deg, +40 deg]).
     * `style.transition = 'none'` during drag for 1:1 responsive tracking; restore smooth transition on pointer release/flick.
     * Keep calling `handleHoloMove(e)` so holographic sheen and gradient coordinates (`--holo-x`, `--holo-y`) track pointer movement smoothly without breaking existing tests.
     * Synchronize with mode buttons (`[Frontal Completo]` and `[Reverso y Bordes]`).
   - In `css/styles.css`: Add `cursor: grab`, `touch-action: none`, and `translateZ(1px)` on `.card-3d-front` and `.card-3d-back` to prevent z-fighting during rotation. Ensure card image has `pointer-events: none` to avoid ghost drag.

2. Requirement R2: Dynamic Condition/Grade Pricing Updates on PDP (`js/views/pdp.js`, `js/state.js`):
   - In `PDPView.selectCondition(condKey)`: Perform non-destructive immediate DOM updates for `#pdp-price`, active button styling, badge labels, and price chart, avoiding destructive `app.renderCurrentView()` calls that wipe the 3D canvas.
   - Defensive pricing engine: If `product.precios` is missing or undefined (e.g. from API search), calculate condition tiers deterministically:
     `raw: basePrice`, `psa8: Math.round(basePrice * 1.35)`, `psa9: Math.round(basePrice * 2.10)`, `psa10: Math.round(basePrice * 5.20)`.
   - Cart addition synchronization: Ensure selected grade and updated price are recorded when adding to cart.

3. Requirement R3: API Search Images, Realistic Pricing & Store Flow (`js/services/pokemon-api.js`, `js/views/search-results.js`, `js/state.js`, `js/app.js`):
   - Fix broken images: Replace nonexistent `'img/charizard-base.png'` with verified `'img/cards/card-back.png'` in all fallback and `onerror` handlers. Format TCGdex image URLs with `/high.webp`. Prioritize cards with artwork first.
   - Realistic multi-variable pricing algorithm: In `pokemon-api.js`, eliminate the static `$15.00` fallback (`precioEstimado: Number(c.precioEstimado) || 15.00`). Implement realistic pricing using API market data (`tcgplayer.prices`, `cardmarket.prices`) when available, or a deterministic formula based on rarity tier ($2-$80+), vintage set era multiplier (WotC/vintage 3.5x-5x vs modern 1x), popular card name bonus, and card ID hash variation.
   - Store flow integration: Implement `Store.registerApiCard(card)` and `Store.getProduct(id)`. Ensure selecting any search result card routes to `#pdp?id=${card.id}` via `app.openProductPDP()`, allowing users to inspect the card in 3D, select condition grades, and add to cart with full checkout persistence!

4. Requirement R4: Stability, Unblocking Test Runner & Acceptance Test Suite (`tests/test_challenger_m3_ui.test.mjs`, `js/app.js`, `js/views/catalog.js`, and new test files):
   - In `tests/test_challenger_m3_ui.test.mjs:432-451`: Destructure `clock`, mock `api.searchCards` deterministically, and advance clock with `clock.advanceTime(400)` so that `node --test tests/*.test.mjs` executes to 100% completion without hanging.
   - Guard `lucide.createIcons()` with `if (typeof lucide !== 'undefined' && lucide.createIcons)` in `js/app.js` and `js/views/catalog.js`. Guard `.toUpperCase()` and `.toLocaleString()` on undefined properties.
   - Create the 3 automated acceptance test suites in `tests/`:
     * `tests/test_pdp_3d_drag.test.mjs` (verifying 3D mouse & touch drag rotation, 360 front/back inspection, and sheen).
     * `tests/test_condition_pricing.test.mjs` (verifying immediate DOM price updates on condition selection, condition multiplier fallback, cart & state sync).
     * `tests/test_api_search_integration.test.mjs` (verifying TCGdex image URL sanitation, multi-variable realistic market price calculation, store registration, and PDP routing).

VERIFICATION REQUIREMENTS:
Run tests via `run_command`:
1. `cmd /c "node --test tests/test_challenger_m3_ui.test.mjs"`
2. `cmd /c "node --test tests/test_pdp_3d_drag.test.mjs tests/test_condition_pricing.test.mjs tests/test_api_search_integration.test.mjs"`
3. Full test run: `cmd /c "node --test tests/*.test.mjs"`
Ensure all tests pass with zero failures.
