## 2026-11-02T16:38:51Z
You are a Spec Miner for Milestone 2: Production Optimization & Evolution (R1–R6).

Your working directory is:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_m2_3\

Authoritative Request:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md
You MUST read c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md before starting work. Do not assume or summarize.

Scope Document:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PROJECT.md
You MUST read c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PROJECT.md to understand the architecture, feature inventory (Features 19–30), and interface contracts.

Prior Survey Findings:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_survey_v4_3\handoff.md

Your focus:
Formulate the exact, comprehensive implementation strategy for:
1. Requirement R6: FASE 8 Supabase Architecture & 10 Pokémon Cards Catalog
- `js/db/schema.sql`:
  * Complete PostgreSQL DDL matching the 12 business entities in `schema.js`: `usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`.
  * Proper constraints, composite primary key `(numero_orden, sku, grado)`, indexes, and Row Level Security (RLS) policies allowing public read of catalog and order insertion.
- `js/db/supabase-config.js`:
  * Structure singleton client initialization (`SUPABASE_CONFIG`, `isConfigured()`, `getClient()`).
  * Add CDN script tag in `index.html` (`@supabase/supabase-js@2`).
- `js/db/db-client.js`:
  * Active-passive hybrid scheme: transparent failover to Dexie (IndexedDB) or `LocalStorageFallbackDB` when Supabase is offline/unconfigured, preserving 100% of existing Dexie method signatures and behavior.
- Catalog with 10 Pokémon Cards ($5 to $80 USD):
  * Replace legacy exorbitant prices with the 10 real-market Pokémon cards in `js/data.js` and DB seeds (Pikachu, Charizard ex, Eevee, Gengar, Greninja ex, Mimikyu, Mewtwo, Lucario VSTAR, Raichu GX, Blastoise ex), with all grades strictly between $5.00 and $80.00 USD.
- `PLAN_DE_TRABAJO.md`:
  * Exact line numbers and modifications to mark FASE 8 header and all 5 checklist items with `[X]`.

2. Test Architecture for Verification Matrix:
- Define the test suite `tests/test_production_r1_to_r6.test.mjs` verifying all acceptance criteria across R1 to R6, ensuring all 356 existing tests remain 100% green.
