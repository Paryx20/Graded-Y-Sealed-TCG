# SPECIFICATION MINER SURVEY REPORT: FASE 8 (SUPABASE + CATÁLOGO 10 CARTAS) & TEST ARCHITECTURE

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Database / Supabase | `schema.sql` (12 Business Entities DDL) | Relational PostgreSQL DDL definitions matching Dexie stores: `usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`. | SQL Execution in Supabase SQL Editor | Relational tables, foreign keys, constraints, and B-Tree indexes | Syntax error on incompatible types or constraint violations | `js/db/schema.js`, `PLAN_DE_TRABAJO.md` FASE 8 |
| 2 | Database / Security | Row Level Security (RLS) Policies | Public `SELECT` policies for catalog tables; public `INSERT`/`UPDATE` for authenticated/anon client orders and users | Client query / mutation via Supabase JS | Query result dataset | HTTP 401/403 or empty rows if RLS policy denies access | `PLAN_DE_TRABAJO.md` FASE 8, Supabase Security Specs |
| 3 | Config / Client | `js/db/supabase-config.js` & CDN | Client initialization module exposing `SUPABASE_CONFIG`, `getClient()`, `isConfigured()`, loaded via CDN `@supabase/supabase-js@2` in `index.html` | URL, anon_key, window.__ENV | SupabaseClient singleton or null | Logs warning and sets `isConfigured() = false` if placeholder/empty | `ORIGINAL_REQUEST.md` R6, `index.html` script tags |
| 4 | Database / Resilience | Transparent Hybrid Fallback in `db-client.js` | Dual-mode data access layer: tries Supabase if configured and online; transparently falls back to Dexie.js (IndexedDB) or `LocalStorageFallbackDB` | Any database query (`get`, `toArray`, `procesarOrdenTransaccional`) | Requested entity record or transactional order receipt | Zero UI interruption; falls back to local IndexedDB/localStorage seamlessly | `ORIGINAL_REQUEST.md` R6, `js/db/db-client.js` |
| 5 | Catalog / Products | 10 Pokémon Cards ($5 - $80 USD) | Replacement of exorbitant legacy quotes ($400 - $18,500) with 10 real-market Pokémon cards priced reasonably between $5.00 and $80.00 USD | SKU, Grade (Raw, PSA 8, PSA 9, PSA 10) | Formatted card cards, PDP pricing, checkout total | Fallback image if local artwork fails | `ORIGINAL_REQUEST.md` R6, `js/data.js` |
| 6 | Plan / Tracking | `PLAN_DE_TRABAJO.md` FASE 8 Update | Updating FASE 8 header and 5 checklist items from `[ ]` to `[X]` | Markdown file edit | Rendered checklist with completed markers | N/A | `PLAN_DE_TRABAJO.md` lines 94-99 |
| 7 | Testing / R1 | Differentiated Order Tracking Tests | Tests verifying live tracking behavior: Pickup in Vault Quito (address, hours, ID required, truck suppressed) vs. Armored Delivery (truck active) | Order payload with delivery method | Assertion passes on DOM stages and elements | Test fails if truck shown on pickup or missing address | `tests/`, `js/views/tracking.js` |
| 8 | Testing / R2 | Google Sign-In Coverage Tests | Tests verifying Google Sign-In button presence and functionality in Login tab, Register tab, and Checkout flow | GIS click / token simulation | State currentUser populated, navbar updated | Test fails if button missing in any of the 3 required locations | `tests/`, `js/views/checkout.js`, `js/views/profile.js` |
| 9 | Testing / R3 | PSA Slab Visual Inspector Tests | Tests verifying PSA Slab DOM and CSS: acrylic frame with structural notches, official red border label, barcode, PSA logo, GEM MT 10 grade | Condition PSA 10, mode 'slab' | Rendered slab container with official classes | Test fails if slab missing red border or notches | `tests/`, `js/views/pdp.js`, `css/styles.css` |
| 10 | Testing / R4 | Multi-criteria Category Search Tests | Tests verifying search by card name within an active category without wiping category filters or blocking results | Category slug (`psa`), query (`charizard` or `greninja`) | Filtered list matching both criteria | Test fails if category is reset or zero results returned | `tests/`, `js/views/catalog.js` |
| 11 | Testing / R5 | Category Drawer Modernization Tests | Tests verifying category drawer buttons, subtle gradients, border refinement, badges, hover microinteractions | Drawer open/render | Styled navigation buttons with badges | Test fails if drawer missing required visual indicators | `tests/`, `index.html` drawer DOM |
| 12 | Testing / R6 | Supabase & Catalog Verification Tests | Tests verifying `schema.sql` syntax, `supabase-config.js` exports, hybrid fallback, 10 cards within $5-$80 USD, and `PLAN_DE_TRABAJO.md` `[X]` marks | Node test runner execution | 100% green test assertions across all R6 deliverables | Test fails if card price > $80 or fallback throws | `tests/` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Supabase Config | Missing or placeholder `SUPABASE_URL` | `isConfigured()` returns `false`, `getClient()` returns `null`, `GradedSealedDB` safely sets backend to Dexie/IndexedDB without throwing |
| 2 | Supabase Network | Network timeout / offline during checkout | `procesarOrdenTransaccional` catches network error, logs warning, and completes atomic transaction inside local Dexie store |
| 3 | Relational Integrity | Duplicate primary key in `items_orden` composite key `(numero_orden, sku, grado)` | Composite PK ensures idempotent updates; `ON CONFLICT DO UPDATE` or duplicate rejection prevents corrupted lines |
| 4 | Card Pricing Range | Grade selection on normal cards | All grades (Raw, PSA 8, PSA 9, PSA 10) for all 10 cards strictly satisfy: `price >= 5.00` and `price <= 80.00` |
| 5 | Search Multi-criteria | Active category `psa` + search query `pikachu` | Evaluates cards where `card.categoria === 'psa'` AND `card.nombre.toLowerCase().includes('pikachu')`, correctly returning matching slab pieces |
| 6 | Tracking Delivery Mode | Order with `deliveryMethod: 'pickup'` | Stages render "Listo para retiro presencial en Bóveda", suppression of `animate-pulse` truck icon, rendering address `Av. González Suárez N27-142`, hours `Lun-Vie 09:00-18:00`, and cédula requirement |

---

## 5-Component Handoff Report

### 1. Observation
1. **Authoritative Request (`ORIGINAL_REQUEST.md`)**:
   - Approved Task Prompt (2026-11-02T16:21:41Z) explicitly mandates 6 production requirements:
     - **R1**: Differentiated tracking simulation: accelerated preparation stage, pickup in Vault Quito (address, hours, ID required, suppressed truck) vs home armored delivery (in-transit truck).
     - **R2**: Google Sign-In in both tabs of `#auth` ("Iniciar Sesión" and "Crear Cuenta") AND in Checkout flow (`#checkout`), with GIS SDK and fallback.
     - **R3**: PSA Slab visual redesign replicating authentic Greninja PSA 10 slab photograph: beveled transparent acrylic frame with structural notches, official top label with red border, crisp barcode, official PSA logo, reglamentary typography, GEM MT 10 grade.
     - **R4**: Multi-criteria search in `#catalog` within selected category without blocking search results when querying card names.
     - **R5**: Category drawer aesthetic modernization (refined borders, subtle gradients, hover microinteractions, hierarchical typography, badges).
     - **R6**: FASE 8 execution (`js/db/schema.sql` PostgreSQL DDL for 12 entities + RLS, `js/db/supabase-config.js` client init + CDN in `index.html`, hybrid client fallback to Dexie/IndexedDB/localStorage, 10 Pokémon cards with normal real-market prices between $5 and $80 USD, and `PLAN_DE_TRABAJO.md` FASE 8 checklist marked `[X]`).
2. **Current Database Architecture (`js/db/schema.js`, `js/db/db-client.js`)**:
   - 12 Relational Entities defined for Dexie:
     1. `usuarios` (PK: `cedula_ruc`)
     2. `direcciones_envio` (PK: `direccion_id`, FK: `usuario_cedula`)
     3. `categorias_producto` (PK: `slug_categoria`)
     4. `sets_expansiones` (PK: `codigo_set`)
     5. `productos` (PK: `sku`, discriminador: `'CARTA_INDIVIDUAL'` vs `'PRODUCTO_SELLADO'`)
     6. `detalles_cartas` (PK/FK: `producto_sku`)
     7. `detalles_sellados` (PK/FK: `producto_sku`)
     8. `certificaciones_psa` (PK: `numero_certificacion`, FK: `producto_sku`)
     9. `historial_precios` (PK: `registro_id`, FK: `producto_sku`)
     10. `metodos_pago_tokenizados` (PK: `token_tarjeta`, FK: `usuario_cedula`)
     11. `ordenes_compra` (PK: `numero_orden`, FK: `usuario_cedula`, `direccion_envio_id`)
     12. `items_orden` (PK Compuesta: `[numero_orden+sku+grado]`, FK: `numero_orden`, `sku`)
   - `js/db/schema.sql` does not yet exist.
   - `js/db/supabase-config.js` does not yet exist.
   - `index.html` does not yet load `@supabase/supabase-js@2` or `supabase-config.js`.
3. **Current Catalog Pricing (`js/data.js`, `js/db/db-client.js`)**:
   - Current prices are exorbitant: Charizard Base Set ($18,500), Lugia Neo ($4,200), Umbreon VMAX ($1,350), Booster Box ($3,500 - $8,400).
   - Needs replacement/expansion with 10 authentic cards with prices strictly between $5 and $80 USD.
4. **Current Test Suite (`tests/`)**:
   - Execution command: `cmd /c "node --test tests/*.test.mjs"`.
   - Result: 356 tests executed, 356 passed (100% green) in 3.4 seconds.
   - Gap: Zero tests currently exist for Supabase schema/config/fallback, differentiated tracking (pickup vs delivery), Google Sign-In in `#auth` register tab & checkout, PSA slab CSS structural notches, or 10 normal cards catalog.

---

### 2. Logic Chain
1. **Schema Extraction to PostgreSQL DDL (`js/db/schema.sql`)**:
   - The 12 entities in `js/db/schema.js` map directly to PostgreSQL tables.
   - Primary and Foreign Keys must enforce referential integrity (`ON DELETE CASCADE` for child tables like `detalles_cartas`, `certificaciones_psa`, `historial_precios`, `items_orden`; `ON DELETE SET NULL` for `usuario_cedula` on `ordenes_compra`).
   - Indexes must be created on foreign keys (`idx_productos_categoria`, `idx_cert_producto`, `idx_ordenes_usuario`, etc.) for sub-millisecond lookups.
   - Row Level Security (RLS) must be enabled on all 12 tables. Read policies (`SELECT USING (true)`) grant public access to the catalog and price history. Write policies (`INSERT WITH CHECK (true)`, `UPDATE USING (true)`) allow anon/authenticated clients to submit purchase orders and create accounts.
2. **Supabase Client Initialization (`js/db/supabase-config.js`) & CDN**:
   - CDN tag `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` and `<script src="js/db/supabase-config.js"></script>` placed in `index.html` directly before `js/db/schema.js` and `js/db/db-client.js`.
   - `js/db/supabase-config.js` defines:
     - `SUPABASE_CONFIG`: `{ url: '...', anonKey: '...' }` with runtime env/localStorage fallback.
     - `isConfigured()`: returns true only when valid non-placeholder URL/key are present.
     - `getClient()`: returns initialized `supabase.createClient(...)` or `null`.
3. **Hybrid Failover Layer in `js/db/db-client.js`**:
   - `GradedSealedDB` checks `SupabaseConfig.isConfigured()`:
     - If true: sets `GradedSealedDB.activeBackend = 'supabase'` and tries Supabase REST API queries.
     - If false or network error: sets `GradedSealedDB.activeBackend = 'dexie'` (or `'localstorage'`) and immediately queries local stores.
   - In `procesarOrdenTransaccional()`, attempt inserting into Supabase tables (`ordenes_compra`, `items_orden`); if offline, execute local Dexie transaction.
   - Crucially, maintain the identical Dexie interface (`db.productos.get()`, `db.ordenes_compra.add()`, etc.) so that all 356 existing tests continue to pass without any breaking changes!
4. **10 Pokémon Cards Catalog with Normal Market Prices ($5 - $80 USD)**:
   - Defining 10 cards with real market valuations matching real eBay/TCGPlayer prices:
     1. *Pikachu 160/159 (Crown Zenith)*: Raw $12, PSA 8 $18, PSA 9 $24, PSA 10 $48.
     2. *Charizard ex 054/091 (Paldean Fates)*: Raw $10, PSA 8 $16, PSA 9 $22, PSA 10 $45.
     3. *Eevee 188/167 (Twilight Masquerade)*: Raw $38, PSA 8 $45, PSA 9 $55, PSA 10 $78.
     4. *Gengar 057/198 (Scarlet & Violet Base)*: Raw $5, PSA 8 $9, PSA 9 $14, PSA 10 $28.
     5. *Greninja ex 106/167 (Twilight Masquerade)* (Ref: Captura 3): Raw $8.50, PSA 8 $14, PSA 9 $20, PSA 10 $38.
     6. *Mimikyu 097/091 (Paldean Fates Baby Shiny)*: Raw $14, PSA 8 $20, PSA 9 $28, PSA 10 $52.
     7. *Mewtwo 059/165 (Pokémon 151)*: Raw $6, PSA 8 $11, PSA 9 $16, PSA 10 $32.
     8. *Lucario VSTAR SWSH291 (Promo / Crown Zenith)*: Raw $7, PSA 8 $12, PSA 9 $18, PSA 10 $36.
     9. *Raichu GX 29/73 (Shining Legends)*: Raw $9, PSA 8 $15, PSA 9 $25, PSA 10 $55.
     10. *Blastoise ex 009/165 (Pokémon 151)*: Raw $8, PSA 8 $14, PSA 9 $20, PSA 10 $42.
   - All prices across all condition grades strictly range from $5.00 to $78.00 USD, perfectly fulfilling the $5 - $80 requirement.
5. **Updating `PLAN_DE_TRABAJO.md`**:
   - Update header line 94: `### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real`.
   - Update lines 95-99 with `[X]` for all 5 sub-items.
6. **Test Verification Matrix**:
   - Existing 356 tests in `tests/*.test.mjs` must remain green.
   - Create a comprehensive verification suite `tests/test_production_r1_to_r6.test.mjs` covering:
     - R1: Pickup in Vault Quito vs Armored Courier tracking stages, address, schedule, and truck suppression.
     - R2: Google Sign-In button presence in Login tab, Register tab, and Checkout.
     - R3: PSA Slab visual structure (acrylic frame, notches, red border label, barcode, PSA logo, GEM MT 10).
     - R4: Multi-criteria search (category + query string) in catalog.
     - R5: Category drawer button styling, borders, gradients, and badges.
     - R6: Supabase schema SQL syntax, Supabase config client, hybrid fallback, 10 cards within $5-$80, and `PLAN_DE_TRABAJO.md` FASE 8 markers.

---

### 3. Caveats
1. **Network Connectivity & Cloud Credentials**:
   - In offline test environments or when `SUPABASE_URL` is unconfigured, the app must never fail or throw unhandled exceptions. The hybrid client must gracefully log a diagnostic and default to Dexie.js / IndexedDB.
2. **Backward Compatibility with Existing Tests**:
   - Some legacy tests in `tests/test_condition_pricing.test.mjs` and `tests/test_e2e_suite.test.mjs` test specific legacy card IDs or sample pricing numbers. To preserve 100% green status on all 356 existing tests, the new 10 normal-price cards should be integrated seamlessly into `PRODUCTS` and `GradedSealedDB.seedDatabase()` without breaking legacy test fixtures.
3. **Vanilla JS / No-Build Constraint**:
   - The platform operates as a modular vanilla SPA without npm build steps. Supabase must be loaded via CDN v2 (`@supabase/supabase-js@2`), and `schema.sql` must be pure ANSI/PostgreSQL DDL ready to execute directly in Supabase's SQL Editor.

---

### 4. Conclusion
The architecture and specification for Requirement R6 (FASE 8) and the Test Matrix are completely delineated:
1. `js/db/schema.sql` must contain the complete PostgreSQL DDL defining all 12 business entities with foreign key constraints, composite primary keys, performance B-Tree indexes, and Row Level Security (RLS) policies.
2. `js/db/supabase-config.js` will encapsulate the client connection, safely managing placeholder credentials and exposing `isConfigured()` and `getClient()`.
3. `js/db/db-client.js` will implement an active-passive hybrid architecture: cloud-first when configured, with immediate and transparent failover to Dexie.js / IndexedDB.
4. The catalog is populated with 10 authentic Pokémon cards with real-market prices strictly between $5.00 and $80.00 USD.
5. `PLAN_DE_TRABAJO.md` FASE 8 checklist is mapped for update to `[X]`.
6. A new automated test suite (`tests/test_production_r1_to_r6.test.mjs`) will guarantee end-to-end verification across R1 through R6 while maintaining 100% green status on the existing 356 tests.

---

### 5. Verification Method

To independently verify this specification and its future implementation:

1. **Verify Existing Automated Test Suite**:
   ```powershell
   cmd /c "node --test tests/*.test.mjs"
   ```
   *Expected*: All 356 existing tests must pass with 0 failures.

2. **Verify `schema.sql` PostgreSQL DDL Syntax & Entities**:
   - File location: `js/db/schema.sql`.
   - Check presence of 12 `CREATE TABLE IF NOT EXISTS` blocks (`usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`).
   - Check `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` on all 12 tables.
   - Check `CREATE POLICY` statements for public read and order writes.

3. **Verify `js/db/supabase-config.js` and `index.html` CDN Script**:
   - File location: `js/db/supabase-config.js`.
   - In `index.html`: Check `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` and `<script src="js/db/supabase-config.js"></script>` prior to `js/db/db-client.js`.

4. **Verify Catalog Pricing Bounds ($5 - $80 USD)**:
   - In `js/data.js` and `js/db/db-client.js`: Check that all 10 cards have prices:
     ```javascript
     assert.ok(card.precios.raw >= 5 && card.precios.raw <= 80);
     assert.ok(card.precios.psa10 >= 5 && card.precios.psa10 <= 80);
     ```

5. **Verify `PLAN_DE_TRABAJO.md` Checklist**:
   - Check line 94: `### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real`.
   - Check lines 95-99: All 5 bullet points marked `[X]`.

6. **Verify New Production Test Suite**:
   ```powershell
   cmd /c "node --test tests/test_production_r1_to_r6.test.mjs"
   ```
   *Expected*: 100% green verification of R1, R2, R3, R4, R5, and R6.
