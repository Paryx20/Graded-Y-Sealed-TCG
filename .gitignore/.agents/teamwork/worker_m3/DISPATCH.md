## 2026-11-02T00:31:26Z
You are Worker for Milestone 3: Phase 6 Dual Search API with Automatic Failover & Decoupled Search View (teamwork_worker).
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m3\
Your parent is: 7697e516-910f-4bbf-b2ad-e3d882af43c1

MANDATORY: Read ORIGINAL_REQUEST.md first:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md

Also read PROJECT.md and specification mining findings:
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\orchestrator_1\PROJECT.md
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_survey_3\handoff.md (Algorithm 4: Dual Search API Failover Cascade & Algorithm 6: Debounce)
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive File Ownership:
- `js/services/pokemon-api.js` (NEW)
- `js/views/search-results.js` (NEW)
- `js/app.js` (register route and spotlight integration)
- `index.html` (include script tags)

Mission:
Implement all Requirement R3 / Phase 6 features according to PLAN_DE_TRABAJO.md and ORIGINAL_REQUEST.md:

1. Failover Search API in `js/services/pokemon-api.js`:
   - Create `PokemonAPI` service exposed on `window.PokemonAPI` and `globalThis.PokemonAPI`.
   - Implement `searchCards(query)` with 3-tier automatic failover cascade:
     * Primary Source: `pokemontcg.io` (e.g. `https://api.pokemontcg.io/v2/cards?q=name:*${encodeURIComponent(query)}*&pageSize=12` with 4-second AbortController timeout).
     * Secondary Backup Source: `tcgdex.net` (e.g. `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}` with 4-second AbortController timeout).
     * Offline Local Fallback: In-memory catalogue (`PRODUCTS` from `js/data.js` and/or `GradedSealedDB.productos`).
   - Normalize returned cards into standard format:
     `{ id, nombre, set, rareza, imagen, precioEstimado, fuente: 'pokemontcg.io' | 'tcgdex.net' | 'local-vault' }`.
   - Ensure the cascade logs warnings when falling back to backup or offline sources.

2. Decoupled Search Results View in `js/views/search-results.js`:
   - Create `SearchResultsView` exposed on `window.SearchResultsView` and `globalThis.SearchResultsView`.
   - Render decoupled view responding to route `#search-results?q=<query>`.
   - Search input featuring 400ms debounce (`clearTimeout` / `setTimeout` 400ms).
   - Animated skeleton loader cards (`animate-pulse`) displayed while queries are actively fetching.
   - Informative, user-friendly zero-results state when no cards match the query (with suggestions to check spelling or try other set names).
   - Card grid rendering matching cards with image, title, set, rarity badge, estimated price, and [Ver Detalle] or [Comprar] CTA.

3. Router & HTML Integration:
   - In `js/app.js`, register `#search-results` route in `handleRoute()`:
     * Parse query parameter `q`: `#search-results?q=...`.
     * Render `SearchResultsView` into `#app-view`.
     * Call `SearchResultsView.afterRender()` to attach event listeners and initiate fetch.
   - In `index.html`, add `<script src="js/services/pokemon-api.js"></script>` and `<script src="js/views/search-results.js"></script>` in correct dependency order (after `state.js` and before `app.js`).

4. Testing & Verification:
   - Run tests: `cmd /c "node --test tests/*.test.mjs"`.
   - Ensure `tests/test_search_failover.test.mjs` passes 100% (and all 224+ tests pass with 0 failures).

Deliverable:
Write report in:
`c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m3\handoff.md`.
Also maintain `progress.md` with timestamps during your work.
When done, message your parent (7697e516-910f-4bbf-b2ad-e3d882af43c1) confirming completion.
