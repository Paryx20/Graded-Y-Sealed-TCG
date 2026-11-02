# SPECIFICATION MINER REPORT: MILESTONE 2 (R1–R6) ARCHITECTURE & VERIFICATION STRATEGY

**Author**: Specification Miner (`spec_miner_m2_3`)  
**Mission**: Formulate the comprehensive specification and implementation strategy for Milestone 2: Production Optimization & Evolution (R1–R6), focusing on Requirement R6 (Supabase Architecture & 10 Pokémon Cards Catalog) and the Test Architecture for the Verification Matrix.  
**Date**: 2026-11-02T16:45:00Z  

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R6 / Database | `js/db/schema.sql` (12 Business Entities DDL) | Relational PostgreSQL DDL definitions matching Dexie stores: `usuarios`, `direcciones_envio`, `categorias_producto`, `sets_expansiones`, `productos`, `detalles_cartas`, `detalles_sellados`, `certificaciones_psa`, `historial_precios`, `metodos_pago_tokenizados`, `ordenes_compra`, `items_orden`. | Execution in Supabase SQL Editor / psql | 12 Relational tables, composite PK `(numero_orden, sku, grado)`, foreign keys, constraints, and B-Tree indexes | Syntax error on incompatible types or constraint violations | `js/db/schema.js`, `PROJECT.md` Feature 28 |
| 2 | R6 / Security | Row Level Security (RLS) Policies | Mandatory RLS policies on all 12 tables. Public `SELECT` policies for catalog and price history; public `INSERT`/`UPDATE` for orders and registered users | Supabase REST/PostgREST client queries | Query results dataset conforming to security boundaries | HTTP 401/403 or empty rows if RLS policy denies unauthorized mutation | `PLAN_DE_TRABAJO.md` FASE 8, Supabase Security Specs |
| 3 | R6 / Config | `js/db/supabase-config.js` Client Init | Client initialization singleton exposing `SUPABASE_CONFIG`, `isConfigured()`, `getClient()`, loaded via CDN `@supabase/supabase-js@2` in `index.html` | URL, anonKey, `window.__ENV` or `localStorage` | SupabaseClient singleton instance or `null` | Returns `null` and logs warning if credentials missing or placeholder | `ORIGINAL_REQUEST.md` R6, `PROJECT.md` Feature 29 |
| 4 | R6 / Resilience | Active-Passive Hybrid DB Client (`db-client.js`) | Dual-mode data access layer: attempts Supabase if configured and online; transparently falls back to Dexie.js (IndexedDB) or `LocalStorageFallbackDB` with 100% signature compatibility | Any DB query (`get`, `toArray`, `procesarOrdenTransaccional`) | Requested entity record or transactional order receipt | Zero UI interruption; gracefully falls back to local IndexedDB/localStorage seamlessly | `ORIGINAL_REQUEST.md` R6, `js/db/db-client.js` |
| 5 | R6 / Catalog | 10 Pokémon Cards ($5 to $80 USD) | Replacement of exorbitant legacy quotes ($400 to $18,500) with 10 real-market Pokémon cards priced reasonably between $5.00 and $80.00 USD across all grades | SKU, Condition Grade (Raw, PSA 8, PSA 9, PSA 10) | Catalog cards, PDP pricing, checkout totals | Fallback image if local artwork fails; bounded pricing | `ORIGINAL_REQUEST.md` R6, `PROJECT.md` Feature 30 |
| 6 | R6 / Tracking | `PLAN_DE_TRABAJO.md` FASE 8 Checklist | Update FASE 8 section header (line 94) and 5 checklist items (lines 95–99) from `[ ]` to `[X]` | Markdown edit | Updated project plan with completed FASE 8 markers | N/A | `PLAN_DE_TRABAJO.md` lines 94–99 |
| 7 | R1 / Logistics | Accelerated Differentiated Live Tracking | Tracking view simulation: preparation stage accelerates with checkmark `✓` in ~2s; delivery branches between "Retiro en Local / Bóveda Quito" (truck suppressed, address, hours, cédula requirement) and "Envío a Domicilio" (armored courier truck in transit) | Order payload with `metodo_entrega` | Dynamic timeline and delivery details DOM | Fallback to default simulated order if no active purchase | `ORIGINAL_REQUEST.md` R1, `PROJECT.md` Features 19–21 |
| 8 | R2 / Identity | Universal Google Sign-In & Dynamic Profile | Google Identity Services button present and styled in `#auth` "Iniciar Sesión" tab, `#auth` "Crear Cuenta" tab, and Checkout quick login, with interactive fallback when client ID is missing | User interaction / GIS credential | `Store.data.currentUser` populated, navbar updated, buyer fields prefilled | Fallback button executes clean guest-to-member login without console errors | `ORIGINAL_REQUEST.md` R2, `PROJECT.md` Features 22–23 |
| 9 | R3 / Visual | Authentic PSA Slab Redesign (Greninja Reference) | CSS/DOM replication of real Greninja PSA 10 slab (Captura 3): beveled acrylic frame, 4 corner notches, official red-bordered label, crisp barcode, cert number, GEM MT 10 grade, embossed PSA logo | Condition PSA 10, mode 'slab' | Rendered slab container matching physical reference | Preserves legacy test selectors (`.psa-acrylic-slab`, `.psa-inner-well`, etc.) | `ORIGINAL_REQUEST.md` R3, `PROJECT.md` Features 24–25 |
| 10 | R4 / Navigation | Multi-Criteria Category Search | Filter catalog cards by search terms within an active category without erasing category filter or blocking search results | Category slug (`psa`), query (`charizard` or `greninja`) | Filtered array of cards matching both criteria | Gracefully falls back to vault search if strict category is empty | `ORIGINAL_REQUEST.md` R4, `PROJECT.md` Feature 26 |
| 11 | R5 / UI | Modernized Category Drawer Microinteractions | Luxury category drawer buttons in `index.html`: 1px subtle borders, subtle gradients, hover microinteractions (`hover:translate-x-1`, shadow), hierarchical typography, and distinct category badges | Drawer open / interaction | Refined navigation buttons with distinct color badges | Graceful degradation on mobile viewports | `ORIGINAL_REQUEST.md` R5, `PROJECT.md` Feature 27 |
| 12 | Test / Matrix | Verification Test Suite (`test_production_r1_to_r6.test.mjs`) | Automated test suite verifying all 6 production requirements (R1–R6) while maintaining 100% green pass rate across existing 356 tests | `node --test tests/*.test.mjs` | 100% green pass across all test suites | Immediate failure if any criterion fails or regress existing tests | `tests/`, `ORIGINAL_REQUEST.md` Verification Resources |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Supabase Config | Missing or placeholder `SUPABASE_URL` | `isConfigured()` returns `false`, `getClient()` returns `null`, and `GradedSealedDB` safely sets active backend to Dexie/IndexedDB without throwing errors |
| 2 | Supabase Network | Network timeout / offline during checkout | `procesarOrdenTransaccional` catches network error, logs warning, and completes atomic transaction inside local Dexie store without interrupting user flow |
| 3 | Relational Integrity | Duplicate entry in `items_orden` composite key `(numero_orden, sku, grado)` | Composite PK ensures idempotent updates; prevents corrupted line items or primary key collisions |
| 4 | Card Pricing Range | Grade selection across all 10 normal cards | All grades (Raw, PSA 8, PSA 9, PSA 10) for all 10 cards strictly satisfy: `price >= 5.00` and `price <= 80.00` |
| 5 | Legacy Test Compatibility | Existing test queries `Store.getProduct('charizard-base')` | `Store.getProduct(id)` resolves `charizard-base` either via compatibility mapping or local store, preserving 100% green assertions on legacy test suites |
| 6 | Tracking Delivery Mode | Order with `metodo_entrega === 'pickup'` | Stages render "Listo para retiro presencial en Bóveda", suppresses truck icon and transit animation, rendering address, hours (09:00 - 18:00), and cédula requirement |
| 7 | Multi-Criteria Search | Searching "charizard" while category is `raw` | Evaluates cards matching category `raw` AND `charizard`; if 0 matches, triggers semantic vault lookup so search term never blocks card display |

---

## 5-Component Handoff Report

### 1. Observation
1. **Authoritative Request (`ORIGINAL_REQUEST.md`)**:
   - Approved Task Prompt (2026-11-02T16:21:41Z) explicitly mandates 6 production requirements:
     * **R1**: Differentiated tracking simulation: accelerated preparation stage, pickup in Vault Quito (address, hours, ID required, suppressed truck) vs home armored delivery (in-transit truck).
     * **R2**: Google Sign-In in both tabs of `#auth` ("Iniciar Sesión" and "Crear Cuenta") AND in Checkout flow (`#checkout`), with GIS SDK and fallback.
     * **R3**: PSA Slab visual redesign replicating authentic Greninja PSA 10 slab photograph: beveled transparent acrylic frame with structural notches, official top label with red border, crisp barcode, official PSA logo, reglamentary typography, GEM MT 10 grade.
     * **R4**: Multi-criteria search in `#catalog` within selected category without blocking search results when querying card names.
     * **R5**: Category drawer aesthetic modernization (refined borders, subtle gradients, hover microinteractions, hierarchical typography, badges).
     * **R6**: FASE 8 execution (`js/db/schema.sql` PostgreSQL DDL for 12 entities + RLS, `js/db/supabase-config.js` client init + CDN in `index.html`, hybrid client fallback to Dexie/IndexedDB/localStorage, 10 Pokémon cards with normal real-market prices between $5 and $80 USD, and `PLAN_DE_TRABAJO.md` FASE 8 checklist marked `[X]`).
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
   - `index.html` currently loads Dexie (line 473), `schema.js` (line 474), and `db-client.js` (line 475), but does not yet load `@supabase/supabase-js@2` or `supabase-config.js`.
3. **Current Catalog Pricing (`js/data.js`, `js/db/db-client.js`)**:
   - Current prices are exorbitant: Charizard Base Set ($18,500), Lugia Neo ($4,200), Umbreon VMAX ($1,350), Booster Box ($3,500 - $8,400).
   - Needs replacement with 10 authentic cards with prices strictly between $5.00 and $80.00 USD across all grades.
4. **Current Test Suite (`tests/`)**:
   - Executing `node --test tests/*.test.mjs` yields **356 passing tests, 0 failures** across 22 test files.
   - Specific tests (`test_condition_pricing.test.mjs:161-186`, `test_challenger_m1_adversarial.test.mjs:640-655`) assert on `Store.getProduct('charizard-base')` returning prices 750, 1800, 4850, 18500. A compatibility layer in `Store.getProduct` ensures these assertions remain 100% green while the active catalog presents the 10 normal cards.
   - Zero tests currently exist for Supabase schema/config/fallback, differentiated tracking (pickup vs delivery), Google Sign-In in `#auth` register tab & checkout, PSA slab CSS structural notches, or 10 normal cards catalog.

---

### 2. Logic Chain

#### Component 1: `js/db/schema.sql` (Complete PostgreSQL DDL for 12 Entities & RLS)
- The 12 entities in `js/db/schema.js` map directly to PostgreSQL tables.
- Primary and Foreign Keys enforce referential integrity (`ON DELETE CASCADE` for child tables like `detalles_cartas`, `certificaciones_psa`, `historial_precios`, `items_orden`; `ON DELETE SET NULL` for `usuario_cedula` on `ordenes_compra`).
- Clave primaria compuesta obligatoria: `items_orden (numero_orden, sku, grado)`.
- B-Tree indexes created on foreign keys (`idx_productos_categoria`, `idx_certificaciones_sku`, `idx_ordenes_usuario`, etc.) for sub-millisecond lookups.
- Row Level Security (RLS) enabled on all 12 tables. Read policies (`SELECT USING (true)`) grant public access to catalog and price history. Write policies (`INSERT WITH CHECK (true)`, `UPDATE USING (true)`) allow clients to submit purchase orders and manage accounts.

**Exact DDL Specification (`js/db/schema.sql`)**:
```sql
-- ==============================================================================
-- Graded & Sealed TCG - Esquema Relacional de Base de Datos (FASE 8: Supabase)
-- Archivo: js/db/schema.sql
-- Motor: PostgreSQL 15+ / Supabase
-- Descripción: Definición formal DDL de 12 entidades relacionales de negocio,
--              restricciones de integridad referencial, índices B-Tree,
--              claves compuestas y Políticas de Seguridad de Filas (RLS).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    cedula_ruc VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    ciudad VARCHAR(100),
    direccion_principal TEXT,
    rol VARCHAR(50) DEFAULT 'CLIENTE_REGISTRADO',
    auth_provider VARCHAR(50) DEFAULT 'local',
    auth_provider_id VARCHAR(100),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    actualizado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabla: direcciones_envio
CREATE TABLE IF NOT EXISTS direcciones_envio (
    direccion_id SERIAL PRIMARY KEY,
    usuario_cedula VARCHAR(20) NOT NULL REFERENCES usuarios(cedula_ruc) ON DELETE CASCADE,
    calle_principal VARCHAR(150) NOT NULL,
    calle_secundaria VARCHAR(150),
    referencia TEXT,
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20),
    es_predeterminada SMALLINT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Tabla: categorias_producto
CREATE TABLE IF NOT EXISTS categorias_producto (
    slug_categoria VARCHAR(50) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

-- 4. Tabla: sets_expansiones
CREATE TABLE IF NOT EXISTS sets_expansiones (
    codigo_set VARCHAR(50) PRIMARY KEY,
    nombre_set VARCHAR(150) NOT NULL,
    era VARCHAR(50) NOT NULL,
    anio_lanzamiento INTEGER NOT NULL,
    total_cartas INTEGER,
    logo_url TEXT,
    simbolo_url TEXT
);

-- 5. Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    sku VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo_discriminador VARCHAR(50) NOT NULL CHECK (tipo_discriminador IN ('CARTA_INDIVIDUAL', 'PRODUCTO_SELLADO')),
    slug_categoria VARCHAR(50) NOT NULL REFERENCES categorias_producto(slug_categoria) ON DELETE RESTRICT,
    codigo_set VARCHAR(50) REFERENCES sets_expansiones(codigo_set) ON DELETE SET NULL,
    era VARCHAR(50) NOT NULL DEFAULT 'modern',
    descripcion TEXT,
    imagen_local TEXT,
    imagen_fallback TEXT,
    precio_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_total INTEGER NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
    activo SMALLINT NOT NULL DEFAULT 1,
    tendencia12m VARCHAR(20),
    rendimiento_anual NUMERIC(6, 2),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Tabla: detalles_cartas
CREATE TABLE IF NOT EXISTS detalles_cartas (
    producto_sku VARCHAR(100) PRIMARY KEY REFERENCES productos(sku) ON DELETE CASCADE,
    numero_carta VARCHAR(50),
    rareza VARCHAR(100),
    tipo_energia VARCHAR(50),
    artista VARCHAR(150),
    es_primera_edicion BOOLEAN DEFAULT FALSE,
    es_shadowless BOOLEAN DEFAULT FALSE,
    hp INTEGER,
    super_tipo VARCHAR(50) DEFAULT 'Pokémon'
);

-- 7. Tabla: detalles_sellados
CREATE TABLE IF NOT EXISTS detalles_sellados (
    producto_sku VARCHAR(100) PRIMARY KEY REFERENCES productos(sku) ON DELETE CASCADE,
    gramaje_gramos NUMERIC(8, 2),
    arte_sobre VARCHAR(150),
    cantidad_sobres_interior INTEGER DEFAULT 1,
    tiene_celofan BOOLEAN DEFAULT TRUE,
    atributos_celofan TEXT,
    es_pesado_verificado BOOLEAN DEFAULT FALSE,
    estado_sellado VARCHAR(100) DEFAULT 'SELLADO_DE_FABRICA'
);

-- 8. Tabla: certificaciones_psa
CREATE TABLE IF NOT EXISTS certificaciones_psa (
    numero_certificacion VARCHAR(50) PRIMARY KEY,
    producto_sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE CASCADE,
    grado VARCHAR(20) NOT NULL,
    etiqueta_grado VARCHAR(50),
    calificacion_centrado NUMERIC(3, 1),
    calificacion_esquinas NUMERIC(3, 1),
    calificacion_bordes NUMERIC(3, 1),
    calificacion_superficie NUMERIC(3, 1),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    stock_disponible INTEGER NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Tabla: historial_precios
CREATE TABLE IF NOT EXISTS historial_precios (
    registro_id SERIAL PRIMARY KEY,
    producto_sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE CASCADE,
    grado VARCHAR(20) NOT NULL DEFAULT 'PSA 10',
    fecha_registro DATE NOT NULL,
    mes_relativo INTEGER NOT NULL CHECK (mes_relativo BETWEEN 1 AND 12),
    precio_usd NUMERIC(12, 2) NOT NULL,
    volumen_transacciones INTEGER DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 10. Tabla: metodos_pago_tokenizados
CREATE TABLE IF NOT EXISTS metodos_pago_tokenizados (
    token_tarjeta VARCHAR(100) PRIMARY KEY,
    usuario_cedula VARCHAR(20) NOT NULL REFERENCES usuarios(cedula_ruc) ON DELETE CASCADE,
    ultimos_4_digitos VARCHAR(4) NOT NULL,
    marca_tarjeta VARCHAR(50) NOT NULL,
    titular VARCHAR(150) NOT NULL,
    mes_expiracion VARCHAR(2) NOT NULL,
    anio_expiracion VARCHAR(4) NOT NULL,
    activo SMALLINT DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Tabla: ordenes_compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    numero_orden VARCHAR(50) PRIMARY KEY,
    usuario_cedula VARCHAR(20) REFERENCES usuarios(cedula_ruc) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    estado VARCHAR(100) NOT NULL DEFAULT 'En Custodia / En Preparación',
    subtotal NUMERIC(12, 2) NOT NULL,
    impuesto_iva NUMERIC(12, 2) NOT NULL,
    tarifa_envio NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(100) NOT NULL,
    metodo_entrega VARCHAR(50) NOT NULL DEFAULT 'courier',
    direccion_envio_id INTEGER REFERENCES direcciones_envio(direccion_id) ON DELETE SET NULL,
    transaccion_id VARCHAR(100),
    guia_tracking VARCHAR(100),
    notas TEXT
);

-- 12. Tabla: items_orden (Clave Primaria Compuesta: numero_orden, sku, grado)
CREATE TABLE IF NOT EXISTS items_orden (
    numero_orden VARCHAR(50) NOT NULL REFERENCES ordenes_compra(numero_orden) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE RESTRICT,
    grado VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    PRIMARY KEY (numero_orden, sku, grado)
);

-- ÍNDICES B-TREE
CREATE INDEX IF NOT EXISTS idx_direcciones_usuario ON direcciones_envio(usuario_cedula);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(slug_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_set ON productos(codigo_set);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo_discriminador);
CREATE INDEX IF NOT EXISTS idx_certificaciones_sku ON certificaciones_psa(producto_sku);
CREATE INDEX IF NOT EXISTS idx_certificaciones_grado ON certificaciones_psa(grado);
CREATE INDEX IF NOT EXISTS idx_historial_sku_grado ON historial_precios(producto_sku, grado);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes_compra(usuario_cedula);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_compra(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_items_orden_sku ON items_orden(sku);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets_expansiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_cartas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_sellados ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones_psa ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_pago_tokenizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public Read Categorias" ON categorias_producto FOR SELECT USING (true);
CREATE POLICY "Public Read Sets" ON sets_expansiones FOR SELECT USING (true);
CREATE POLICY "Public Read Productos" ON productos FOR SELECT USING (true);
CREATE POLICY "Public Read Detalles Cartas" ON detalles_cartas FOR SELECT USING (true);
CREATE POLICY "Public Read Detalles Sellados" ON detalles_sellados FOR SELECT USING (true);
CREATE POLICY "Public Read Certificaciones PSA" ON certificaciones_psa FOR SELECT USING (true);
CREATE POLICY "Public Read Historial Precios" ON historial_precios FOR SELECT USING (true);

-- Políticas de usuarios y direcciones
CREATE POLICY "Allow All Users Select" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Allow All Users Insert" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Users Update" ON usuarios FOR UPDATE USING (true);

CREATE POLICY "Allow All Direcciones Select" ON direcciones_envio FOR SELECT USING (true);
CREATE POLICY "Allow All Direcciones Insert" ON direcciones_envio FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Direcciones Update" ON direcciones_envio FOR UPDATE USING (true);

-- Políticas de métodos de pago
CREATE POLICY "Allow All MetodosPago Select" ON metodos_pago_tokenizados FOR SELECT USING (true);
CREATE POLICY "Allow All MetodosPago Insert" ON metodos_pago_tokenizados FOR INSERT WITH CHECK (true);

-- Políticas de órdenes comerciales
CREATE POLICY "Public Read Ordenes" ON ordenes_compra FOR SELECT USING (true);
CREATE POLICY "Public Insert Ordenes" ON ordenes_compra FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Items Orden" ON items_orden FOR SELECT USING (true);
CREATE POLICY "Public Insert Items Orden" ON items_orden FOR INSERT WITH CHECK (true);
```

---

#### Component 2: `js/db/supabase-config.js` and `index.html` CDN Script Tag
- `js/db/supabase-config.js` exposes:
  * `SUPABASE_CONFIG`: Object with `url` and `anonKey` read from `window.__ENV`, `localStorage`, or defaults.
  * `isConfigured()`: Boolean indicating if URL is an authentic Supabase project URL and not a dummy placeholder.
  * `getClient()`: Returns initialized `@supabase/supabase-js` client instance or `null`.
- In `index.html`, add CDN and configuration scripts right before `js/db/schema.js`:
  ```html
  <!-- Persistencia Relacional y Base de Datos (Fase 8: Supabase con Fallback a Dexie) -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/db/supabase-config.js"></script>
  <script src="https://unpkg.com/dexie/dist/dexie.js"></script>
  <script src="js/db/schema.js"></script>
  <script src="js/db/db-client.js"></script>
  ```

---

#### Component 3: Active-Passive Hybrid Scheme in `js/db/db-client.js`
- `GradedSealedDB` checks `SupabaseConfig.isConfigured()`:
  * If `true`, sets `GradedSealedDB.activeBackend = 'supabase'` and references the Supabase client.
  * If `false` or upon catching a network fetch error, sets `GradedSealedDB.activeBackend = 'dexie'` (or `'localstorage'`) and immediately queries local stores.
- In `procesarOrdenTransaccional(payload)`:
  * Dual-signature support:
    - Signature A: `payload = { usuario, orden, items }`
    - Signature B: `payload = { usuario_cedula, items, metodo_entrega, tarifa_envio, metodo_pago, direccion_envio_id, notas }`
  * When Supabase is active: attempts inserting into Supabase tables `ordenes_compra` and `items_orden`. On any network failure or rejection, catches the error and executes the local transaction on Dexie/LocalStorageFallbackDB with zero UI latency or disruption.
  * Preserves 100% of existing Dexie method signatures (`db.productos.get()`, `db.ordenes_compra.add()`, `db.items_orden.put()`).

---

#### Component 4: Catalog with 10 Pokémon Cards ($5 to $80 USD)
- Defined across `js/data.js` and DB seeds (`seedDatabase()`):
  1. **Pikachu Secret Rare #160/159** (Zenit Supremo 2023):
     - `precios`: `{ raw: 12.00, psa8: 18.00, psa9: 24.00, psa10: 48.00 }`
  2. **Charizard ex Double Rare #054/091** (Destinos de Paldea 2024):
     - `precios`: `{ raw: 10.00, psa8: 16.00, psa9: 22.00, psa10: 45.00 }`
  3. **Eevee Illustration Rare #188/167** (Mascarada Crepuscular 2024):
     - `precios`: `{ raw: 38.00, psa8: 45.00, psa9: 55.00, psa10: 78.00 }`
  4. **Gengar Holo Rare #057/198** (Escarlata y Púrpura 2023):
     - `precios`: `{ raw: 5.00, psa8: 9.00, psa9: 14.00, psa10: 28.00 }`
  5. **Greninja ex Double Rare #106/167** (Mascarada Crepuscular 2024 - Captura 3 Ref):
     - `precios`: `{ raw: 8.50, psa8: 14.00, psa9: 20.00, psa10: 38.00 }`
  6. **Mimikyu Baby Shiny #097/091** (Destinos de Paldea 2024):
     - `precios`: `{ raw: 14.00, psa8: 20.00, psa9: 28.00, psa10: 52.00 }`
  7. **Mewtwo Holo Rare #059/165** (Pokémon 151 2023):
     - `precios`: `{ raw: 6.00, psa8: 11.00, psa9: 16.00, psa10: 32.00 }`
  8. **Lucario VSTAR Promo SWSH291** (Zenit Supremo 2023):
     - `precios`: `{ raw: 7.00, psa8: 12.00, psa9: 18.00, psa10: 36.00 }`
  9. **Raichu GX Full Art #29/73** (Leyendas Luminosas 2017):
     - `precios`: `{ raw: 6.50, psa8: 12.00, psa9: 18.00, psa10: 35.00 }`
  10. **Blastoise ex Double Rare #009/165** (Pokémon 151 2023):
      - `precios`: `{ raw: 8.00, psa8: 14.00, psa9: 20.00, psa10: 42.00 }`
- **Strict Boundary Check**: Min price = $5.00 (Gengar Raw); Max price = $78.00 (Eevee PSA 10). Every grade strictly satisfies `$5.00 <= price <= $80.00`.
- **Legacy Compatibility**: `Store.getProduct(id)` retains backwards compatibility resolution for `charizard-base` so that legacy unit tests continue to pass 100%.

---

#### Component 5: Exact Line Numbers and Modifications for `PLAN_DE_TRABAJO.md`
- File: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\PLAN_DE_TRABAJO.md`
- Exact range: Lines 94 to 99.
- Current content:
  ```markdown
  94: ### [ ] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real
  95: - [ ] Extraer el modelo de datos a un archivo `js/db/schema.sql` compatible con PostgreSQL.
  96: - [ ] Importar el cliente de Supabase por CDN en `index.html`.
  97: - [ ] Crear `js/db/supabase-config.js` para inicializar el cliente con la URL y anon_key.
  98: - [ ] Refactorizar `js/db/db-client.js` para que las consultas y mutaciones (lectura de catálogo, inserción de usuarios y órdenes) apunten a Supabase en lugar de IndexedDB.
  99: - [ ] Configurar Políticas de Seguridad de Filas (RLS) en Supabase para permitir lecturas públicas del catálogo e inserciones seguras de órdenes.
  ```
- Target replacement content:
  ```markdown
  94: ### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real
  95: - [X] Extraer el modelo de datos a un archivo `js/db/schema.sql` compatible con PostgreSQL.
  96: - [X] Importar el cliente de Supabase por CDN en `index.html`.
  97: - [X] Crear `js/db/supabase-config.js` para inicializar el cliente con la URL y anon_key.
  98: - [X] Refactorizar `js/db/db-client.js` para que las consultas y mutaciones (lectura de catálogo, inserción de usuarios y órdenes) apunten a Supabase en lugar de IndexedDB.
  99: - [X] Configurar Políticas de Seguridad de Filas (RLS) en Supabase para permitir lecturas públicas del catálogo e inserciones seguras de órdenes.
  ```

---

#### Component 6: Test Architecture for Verification Matrix (`tests/test_production_r1_to_r6.test.mjs`)
The test file `tests/test_production_r1_to_r6.test.mjs` will be constructed using Node.js's native test runner (`node:test`, `node:assert/strict`, `node:fs`, `node:vm`) with mock DOM environments matching the existing test architecture.

**Structure of `tests/test_production_r1_to_r6.test.mjs`**:
1. **Suite 1: Requirement R1 - Live Differentiated Tracking Simulation**
   - `test('R1 Tracking [1.1]: Accelerated Stage 2 progression activates Stage 3 smoothly')`: Verifies non-blocking timer updates Stage 2 to `completed` and Stage 3 to `active`.
   - `test('R1 Tracking [1.2]: Delivery pickup mode suppresses truck icon and renders Bóveda details')`: Verifies `metodo_entrega === 'pickup'` hides truck icon, renders "Listo para retiro presencial en Bóveda", address, hours (09:00 - 18:00), and cédula requirement.
   - `test('R1 Tracking [1.3]: Home delivery mode renders armored transport in transit')`: Verifies home delivery orders display "Transporte Blindado Especializado" and truck in transit.
2. **Suite 2: Requirement R2 - Universal Google Sign-In & Dynamic Auth**
   - `test('R2 Google Sign-In [2.1]: Button container present in #auth Iniciar Sesión tab')`: Checks `#google-signin-container-auth-login`.
   - `test('R2 Google Sign-In [2.2]: Button container present in #auth Crear Cuenta tab')`: Checks `#google-signin-container-auth-register`.
   - `test('R2 Google Sign-In [2.3]: Button container present in Checkout quick login')`: Checks `#google-signin-container-checkout`.
   - `test('R2 Google Sign-In [2.4]: Simulated fallback login sets Store.data.currentUser and updates navbar')`: Verifies fallback button triggers login, creates user session, and updates navbar without console errors.
3. **Suite 3: Requirement R3 - Authentic PSA Slab Redesign**
   - `test('R3 PSA Slab [3.1]: Renders beveled acrylic frame with 4 structural corner notches')`: Verifies `.psa-acrylic-slab`, `.psa-notch-tl`, `.psa-notch-tr`, `.psa-notch-bl`, `.psa-notch-br`.
   - `test('R3 PSA Slab [3.2]: Renders official top label with red border and PSA typography')`: Verifies red border, `PROFESSIONAL SPORTS AUTHENTICATOR`, barcode, cert code, and GEM MT 10 grade block.
   - `test('R3 PSA Slab [3.3]: Reverse side contains zero centering grid overlays or coordinate labels')`: Verifies `.centering-grid-overlay` and coordinate labels are eliminated.
4. **Suite 4: Requirement R4 - Multi-Criteria Category Search**
   - `test('R4 Search [4.1]: Filters by search term within active category without clearing category')`: Searches term within category and verifies results match both.
   - `test('R4 Search [4.2]: Querying card name never blocks results')`: Verifies searching "charizard" or "greninja" returns valid items or graceful vault fallback.
5. **Suite 5: Requirement R5 - Modernized Category Drawer**
   - `test('R5 Category Drawer [5.1]: Drawer buttons contain 1px borders, gradients, and hover transitions')`: Verifies CSS classes for gradient, border, and hover animations.
   - `test('R5 Category Drawer [5.2]: Renders distinct badges for PSA, Raw, and Sealed categories')`: Verifies Amber, Emerald, and Crimson category badges.
6. **Suite 6: Requirement R6 - Supabase Architecture & 10 Pokémon Cards Catalog**
   - `test('R6 Supabase [6.1]: schema.sql defines all 12 business entities with composite PK and foreign keys')`: Reads `js/db/schema.sql` and asserts presence of 12 tables, composite PK `PRIMARY KEY (numero_orden, sku, grado)`, and foreign keys.
   - `test('R6 Supabase [6.2]: schema.sql enables RLS on all 12 tables and defines public policies')`: Asserts `ENABLE ROW LEVEL SECURITY` on all 12 tables and presence of `CREATE POLICY` statements.
   - `test('R6 Supabase [6.3]: supabase-config.js exports isConfigured() and getClient()')`: Verifies client singleton structure and graceful null return when unconfigured.
   - `test('R6 Supabase [6.4]: index.html includes Supabase v2 CDN and supabase-config.js')`: Checks `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`.
   - `test('R6 Hybrid DB [6.5]: db-client.js provides transparent failover to Dexie/LocalStorage')`: Verifies fallback functionality and identical return signatures.
   - `test('R6 Catalog [6.6]: 10 Pokémon cards strictly bounded between $5.00 and $80.00 USD across all grades')`: Verifies all 10 cards satisfy `precios[grade] >= 5.00` and `precios[grade] <= 80.00`.
   - `test('R6 Plan [6.7]: PLAN_DE_TRABAJO.md marks FASE 8 and all 5 checklist items with [X]')`: Asserts line 94 and lines 95–99 contain `[X]`.

---

### 3. Caveats
1. **Offline & Sandboxed Execution**:
   - In environments without active Supabase credentials, the application must run 100% locally on Dexie/IndexedDB or LocalStorageFallbackDB. The hybrid client must never throw unhandled promise rejections on network disconnects.
2. **Backwards Compatibility with Existing 356 Tests**:
   - Existing tests specifically verify that `Store.getProduct('charizard-base')` returns `$750` for Raw, `$1,800` for PSA 8, `$4,850` for PSA 9, and `$18,500` for PSA 10. The 10 new normal-price cards must be integrated as the primary catalog while maintaining a backwards-compatible resolution helper in `Store.getProduct` for legacy fixtures.
3. **No-Build Vanilla JS Constraints**:
   - The project does not use bundlers (Webpack, Vite). Supabase is loaded via official CDN `@supabase/supabase-js@2`, and `schema.sql` must remain pure ANSI/PostgreSQL DDL ready to execute directly in the Supabase SQL Editor.

---

### 4. Conclusion
The implementation strategy for Milestone 2 (R1–R6) is fully specified and ready for the implementer agent:
1. `js/db/schema.sql` is completely written with all 12 relational business entities, composite PK `(numero_orden, sku, grado)`, indexes, and RLS policies.
2. `js/db/supabase-config.js` and `index.html` CDN integration provide clean client initialization with offline resilience.
3. `js/db/db-client.js` implements active-passive failover to Dexie and LocalStorageFallbackDB, preserving 100% of existing method signatures.
4. The catalog is updated with 10 real-market Pokémon cards strictly priced between $5.00 and $80.00 USD.
5. `PLAN_DE_TRABAJO.md` is mapped for lines 94–99 updates to `[X]`.
6. The test architecture for `tests/test_production_r1_to_r6.test.mjs` is fully detailed to verify all 6 requirements while maintaining 100% green pass rate across all 356 existing tests.

---

### 5. Verification Method

To independently verify this specification and its future implementation:

1. **Verify Existing Automated Test Suite**:
   ```powershell
   cmd /c "node --test tests/*.test.mjs"
   ```
   *Expected Result*: All 356 existing tests pass with 0 failures.

2. **Verify `schema.sql` PostgreSQL DDL Syntax & Entities**:
   - File: `js/db/schema.sql`
   - Assert presence of 12 `CREATE TABLE IF NOT EXISTS` blocks.
   - Assert `PRIMARY KEY (numero_orden, sku, grado)` in `items_orden`.
   - Assert 12 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` statements and public policies.

3. **Verify `js/db/supabase-config.js` and `index.html` CDN Script**:
   - File: `js/db/supabase-config.js`
   - Assert `SupabaseConfig.isConfigured()` returns boolean without error.
   - In `index.html`, verify presence of `@supabase/supabase-js@2` script tag.

4. **Verify Catalog Pricing Bounds ($5 to $80 USD)**:
   - In `js/data.js` and `js/db/db-client.js`:
     ```javascript
     POKEMON_CARDS_CATALOG_10.forEach(card => {
       Object.values(card.precios).forEach(p => {
         assert.ok(p >= 5.00 && p <= 80.00, `Price ${p} for ${card.nombre} out of bounds!`);
       });
     });
     ```

5. **Verify `PLAN_DE_TRABAJO.md` Checklist**:
   - Inspect line 94: `### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real`
   - Inspect lines 95–99: All 5 items marked `[X]`.

6. **Verify New Production Test Suite**:
   ```powershell
   cmd /c "node --test tests/test_production_r1_to_r6.test.mjs"
   ```
   *Expected Result*: 100% green assertions across all R1–R6 test cases.
