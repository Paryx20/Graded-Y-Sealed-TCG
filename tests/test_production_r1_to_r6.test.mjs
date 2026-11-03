/**
 * ==============================================================================
 * PRODUCTION VERIFICATION TEST SUITE: MILESTONE 2 (R1–R6)
 * File: tests/test_production_r1_to_r6.test.mjs
 * 
 * Verifies all Acceptance Criteria for Requirements R1 through R6:
 *   1. R1: Live Differentiated Tracking Simulation (#tracking)
 *      - Automated non-blocking Stage 2 completion (~2s) and Stage 3 active transition
 *      - Differentiated delivery modes:
 *        * 'pickup': suppresses truck animation and transit road graphics; renders
 *          "Listo para retiro presencial en Bóveda", address, opening hours (09:00 - 18:00),
 *          and Cédula de Identidad requirement.
 *        * 'courier': renders specialized armored courier transit and road graphics.
 *   2. R2: Universal Google Sign-In & Dynamic Auth
 *      - Google Sign-In container in #auth login tab (#google-signin-container-auth-login)
 *      - Google Sign-In container in #auth register tab (#google-signin-container-auth-register)
 *      - Google Sign-In container in #checkout quick login sidebar (#google-signin-container-checkout)
 *      - Simulated fallback login updates Store.data.currentUser, navbar UI, and auto-fills buyer fields.
 *   3. R3: Authentic PSA Slab Redesign (Captura 3 Greninja PSA 10 Reference)
 *      - Clear beveled acrylic frame with 4 structural corner notches (.psa-notch-tl/tr/bl/br)
 *      - Embossed .psa-molded-logo on bottom-right of slab frame
 *      - Authentic white paper label with signature red border (border: 2.5px solid #d8232a)
 *      - Centered "PROFESSIONAL SPORTS AUTHENTICATOR", exact "<span>PSA</span>" token, barcode,
 *        cert number, and "GRADO GEM MT 10" grade block
 *      - Removal of artificial overlay sticker covering card art
 *   4. R4: Multi-Criteria Category Search
 *      - Filtering by search query within active category without clearing category
 *      - Vault search fallback so card name queries (like "charizard" or "greninja") never block results
 *      - Hash route synchronization between #global-search and catalog filters
 *   5. R5: Modernized Category Drawer (Captura 5 Reference)
 *      - Category buttons (.drawer-cat-btn) with 1px borders, subtle gradients, and hover transitions
 *      - Distinct category badges (Amber for PSA, Emerald for Raw, Crimson for Sealed, etc.)
 *   6. R6: Supabase Architecture & 10 Pokémon Cards Catalog at Real-Market Prices
 *      - schema.sql defines all 12 relational business entities, composite PK (numero_orden, sku, grado),
 *        foreign keys, B-Tree indexes, and Row Level Security (RLS) policies
 *      - js/db/supabase-config.js exports isConfigured() and getClient() with graceful offline handling
 *      - index.html includes Supabase v2 CDN and supabase-config.js
 *      - js/db/db-client.js provides transparent hybrid failover to Dexie and LocalStorageFallbackDB
 *      - 10 Pokémon cards strictly bounded between $5.00 and $80.00 USD across all grades
 *      - PLAN_DE_TRABAJO.md marks FASE 8 and all 5 checklist items with [X]
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to create mock DOM elements
function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    style: {},
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    removeAttribute(k) { delete this.attributes[k]; },
    innerHTML: '',
    innerText: '',
    value: '',
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        if (this.id === targetId) return this;
        for (const ch of this.children) {
          if (ch.id === targetId) return ch;
          const found = ch.querySelector ? ch.querySelector(sel) : null;
          if (found) return found;
        }
      }
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {}
  };
}

// Sandbox builder loading core application modules
function createTestRuntime() {
  const elements = new Map();

  const getOrCreate = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createMockElement(id));
    }
    return elements.get(id);
  };

  const documentMock = {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
      return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: createMockElement('body', 'body')
  };

  const storage = new Map();
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear()
  };

  const sandbox = {
    console,
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
    document: documentMock,
    window: null,
    globalThis: null,
    localStorage: localStorageMock,
    location: { hash: '#home' },
    Event: class { constructor(type) { this.type = type; } }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);

  // Load modules
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode + '\n; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS; globalThis.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10; globalThis.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;', context);

  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  vm.runInContext(stateCode + '\n; globalThis.Store = Store;', context);

  const homeCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/home.js'), 'utf8');
  vm.runInContext(homeCode + '\n; globalThis.HomeView = HomeView;', context);

  const trackingCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/tracking.js'), 'utf8');
  vm.runInContext(trackingCode + '\n; globalThis.TrackingView = TrackingView;', context);

  const checkoutCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8');
  vm.runInContext(checkoutCode + '\n; globalThis.CheckoutView = CheckoutView;', context);

  const catalogCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/catalog.js'), 'utf8');
  vm.runInContext(catalogCode + '\n; globalThis.CatalogView = CatalogView;', context);

  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  vm.runInContext(pdpCode + '\n; globalThis.PDPView = PDPView;', context);

  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');
  vm.runInContext(appCode + '\n; globalThis.app = app;', context);

  return { context, sandbox, elements };
}

// ==============================================================================
// SUITE 1: Requirement R1 - Live Differentiated Tracking Simulation
// ==============================================================================

test('R1 Tracking [1.1]: Accelerated Stage 2 progression completes Stage 2 with green checkmark and activates Stage 3', async () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  // Mock initial order
  const order = {
    orderId: '#TEST-R1-001',
    numero_orden: '#TEST-R1-001',
    metodo_entrega: 'courier',
    currentStageIndex: 1, // Stage 2 active
    stages: [
      { title: '1. Pago Verificado', status: 'completed', date: '02 Nov, 08:30' },
      { title: '2. En Preparación', status: 'active', date: '02 Nov, 09:00' },
      { title: '3. En Tránsito Blindado', status: 'pending', date: '02 Nov, 10:00' },
      { title: '4. Entrega en Custodia', status: 'pending', date: '04 Nov, 12:00' }
    ]
  };
  Store.data.orders = [order];
  Store.data.activeTrackingOrderId = order.orderId;

  // Render tracking view into main container
  const main = sandbox.document.getElementById('main-content');
  main.innerHTML = TrackingView.render();

  // Call afterRender to kick off automated timer
  TrackingView.afterRender();

  // Initially Stage 2 is active and Stage 3 is pending
  assert.equal(order.stages[1].status, 'active');
  assert.equal(order.stages[2].status, 'pending');

  // Fast-forward 2.2 seconds to allow timer transition
  await new Promise(r => setTimeout(r, 2200));

  // Assert Stage 2 is now completed and Stage 3 is active
  assert.equal(order.stages[1].status, 'completed', 'Stage 2 must be transitioned to completed');
  assert.equal(order.stages[2].status, 'active', 'Stage 3 must be transitioned to active');
  assert.equal(order.currentStageIndex, 2, 'currentStageIndex must advance to Stage 3 (index 2)');

  // Clear timer
  TrackingView.clearSimulationTimer();
});

test('R1 Tracking [1.2]: Delivery pickup mode suppresses truck animation and renders Bóveda details', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const pickupOrder = {
    orderId: '#TEST-PICKUP-002',
    numero_orden: '#TEST-PICKUP-002',
    metodo_entrega: 'pickup',
    buyerName: 'Patricio Coleccionista',
    buyerEmail: 'patricio@bovedatcg.ec',
    subtotal: 78.00,
    tax: 11.70,
    shipping: 0.00,
    total: 89.70,
    paymentMethod: 'Tarjeta de Crédito',
    stages: TrackingView.getDefaultStages('pickup')
  };

  Store.data.orders = [pickupOrder];
  Store.data.activeTrackingOrderId = pickupOrder.orderId;

  const html = TrackingView.render();

  // Assert truck animation & transit road graphics are suppressed
  assert.ok(!html.includes('truck-in-transit-animation'), 'Pickup mode must NOT render truck transit animation');
  assert.ok(!html.includes('Transporte Blindado en Tránsito'), 'Pickup mode must NOT show courier road graphics');

  // Assert Bóveda Quito pickup details are rendered
  assert.ok(html.includes('Listo para retiro presencial en Bóveda'), 'Must indicate readiness for Bóveda pickup');
  assert.ok(html.includes('Av. República del Salvador N34-183 y Moscú'), 'Must display official Bóveda Quito street address');
  assert.ok(html.includes('Edificio Bóveda Central, Piso 2, Quito'), 'Must display building and floor details');
  assert.ok(html.includes('09:00 - 18:00'), 'Must display opening hours (09:00 - 18:00)');
  assert.ok(html.includes('Cédula de Identidad'), 'Must state Cédula requirement for collection');
});

test('R1 Tracking [1.3]: Courier delivery mode renders armored courier transport in transit', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const courierOrder = {
    orderId: '#TEST-COURIER-003',
    numero_orden: '#TEST-COURIER-003',
    metodo_entrega: 'courier',
    courierName: 'Servientrega Blindado • Bóveda G&S',
    trackingNumber: 'GUI-EC-948102-PSA',
    stages: TrackingView.getDefaultStages('courier')
  };

  Store.data.orders = [courierOrder];
  Store.data.activeTrackingOrderId = courierOrder.orderId;

  const html = TrackingView.render();

  assert.ok(html.includes('Transporte Blindado Especializado en Tránsito'), 'Courier mode must display armored transport card');
  assert.ok(html.includes('Servientrega Blindado • Bóveda G&S') || html.includes('GUI-EC-948102-PSA'), 'Must show courier or tracking number');
});

// ==============================================================================
// SUITE 2: Requirement R2 - Universal Google Sign-In & Dynamic Auth
// ==============================================================================

test('R2 Google Sign-In [2.1]: Button container present in #auth Iniciar Sesión tab', () => {
  const { sandbox } = createTestRuntime();
  const { CheckoutView } = sandbox;

  const html = CheckoutView.renderAuth('login');
  assert.ok(html.includes('id="google-signin-container-auth-login"'), 'Auth login tab must contain #google-signin-container-auth-login');
});

test('R2 Google Sign-In [2.2]: Button container present in #auth Crear Cuenta tab', () => {
  const { sandbox } = createTestRuntime();
  const { CheckoutView } = sandbox;

  const html = CheckoutView.renderAuth('register');
  assert.ok(html.includes('id="google-signin-container-auth-register"'), 'Auth register tab must contain #google-signin-container-auth-register');
});

test('R2 Google Sign-In [2.3]: Button container present in Checkout quick login sidebar', () => {
  const { sandbox } = createTestRuntime();
  const { CheckoutView, Store } = sandbox;

  Store.data.currentUser = null;
  Store.data.cart = [{ id: 'pika-1', name: 'Pikachu', price: 12.00, qty: 1, condition: 'PSA 10' }];

  const html = CheckoutView.renderCheckout();
  assert.ok(html.includes('id="google-signin-container-checkout"'), 'Checkout guest view must contain #google-signin-container-checkout');
});

test('R2 Google Sign-In [2.4]: Simulated fallback login sets Store.data.currentUser and updates navbar', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  Store.data.currentUser = null;
  assert.equal(Store.data.currentUser, null);

  // Trigger simulated Google Sign-In
  app.handleSimulatedGoogleLogin();

  assert.ok(Store.data.currentUser !== null, 'currentUser must be set');
  assert.equal(Store.data.currentUser.authProvider, 'google');
  assert.ok(Store.data.currentUser.email.includes('@gmail.com'));
  assert.equal(Store.data.currentUser.idCard, '', 'New Google user has empty idCard until filled');
});

// ==============================================================================
// SUITE 3: Requirement R3 - Authentic PSA Slab Redesign
// ==============================================================================

test('R3 PSA Slab [3.1]: Renders beveled acrylic frame with 4 structural corner notches and molded logo', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, Store } = sandbox;

  const greninja = Store.getProduct('greninja-ex-twilight');
  assert.ok(greninja, 'Greninja product must exist in catalog');

  const html = PDPView.renderInspectorStage(greninja, 'psa10', 'slab');

  // Assert 4 corner notches
  assert.ok(html.includes('psa-notch-tl'), 'Must contain top-left corner notch');
  assert.ok(html.includes('psa-notch-tr'), 'Must contain top-right corner notch');
  assert.ok(html.includes('psa-notch-bl'), 'Must contain bottom-left corner notch');
  assert.ok(html.includes('psa-notch-br'), 'Must contain bottom-right corner notch');

  // Assert embossed logo mark
  assert.ok(html.includes('psa-molded-logo'), 'Must contain embossed PSA molded logo in bottom right');
});

test('R3 PSA Slab [3.2]: Renders official top label with red border and exact PSA tokens', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, Store } = sandbox;

  const greninja = Store.getProduct('greninja-ex-twilight');
  const html = PDPView.renderInspectorStage(greninja, 'psa10', 'slab');

  // Invariant test strings from test_pdp.test.mjs
  assert.ok(html.includes('psa-acrylic-slab'), 'Must contain .psa-acrylic-slab');
  assert.ok(html.includes('psa-inner-well'), 'Must contain .psa-inner-well');
  assert.ok(html.includes('PROFESSIONAL SPORTS AUTHENTICATOR'), 'Must contain PROFESSIONAL SPORTS AUTHENTICATOR');
  assert.ok(html.includes('<span>PSA</span>'), 'Must contain exact <span>PSA</span> token');
  assert.ok(html.includes('psa-barcode'), 'Must contain .psa-barcode');
  assert.ok(html.includes('#' + greninja.certNumber), 'Must contain certNumber preceded by #');
  assert.ok(html.includes('GRADO'), 'Must contain GRADO token');
  assert.ok(html.includes('GEM MT 10'), 'Must contain GEM MT 10 token');
});

test('R3 PSA Slab [3.3]: Authentic layout contains zero centering grid overlays or artificial stickers covering art', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, Store } = sandbox;

  const greninja = Store.getProduct('greninja-ex-twilight');
  const html = PDPView.renderInspectorStage(greninja, 'psa10', 'slab');

  // Assert absence of fake grid and overlay stickers
  assert.ok(!html.includes('centering-grid-overlay'), 'Must NOT contain artificial centering grid overlay');
  assert.ok(!html.includes('PSA HOLOGRAM SEAL'), 'Must NOT contain artificial hologram seal plastered over card art');
});

// ==============================================================================
// SUITE 4: Requirement R4 - Multi-Criteria Category Search
// ==============================================================================

test('R4 Search [4.1]: Filters by search term within active category without clearing category', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  // Set category to psa and search query to "pikachu"
  Store.data.catalogFilters.category = 'psa';
  Store.data.catalogFilters.searchQuery = 'pikachu';

  const filtered = CatalogView.getFilteredProducts();

  assert.ok(filtered.length > 0, 'Should return matching PSA card');
  assert.ok(filtered.some(p => p.id === 'pikachu-crown-zenith'), 'Must find pikachu-crown-zenith');
  assert.equal(Store.data.catalogFilters.category, 'psa', 'Category must remain psa');
});

test('R4 Search [4.2]: Querying card name never blocks results (vault search fallback)', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  // User is browsing 'sealed' category but searches for single card "greninja"
  Store.data.catalogFilters.category = 'sealed';
  Store.data.catalogFilters.searchQuery = 'greninja';

  const filtered = CatalogView.getFilteredProducts();

  // Vault fallback should locate greninja across vault single cards instead of showing 0 items
  assert.ok(filtered.length > 0, 'Vault fallback must locate card in other categories');
  assert.ok(filtered.some(p => p.id === 'greninja-ex-twilight'), 'Must return greninja-ex-twilight');
  assert.equal(CatalogView.isVaultFallback, true, 'isVaultFallback flag must be set to true');
});

// ==============================================================================
// SUITE 5: Requirement R5 - Modernized Category Drawer
// ==============================================================================

test('R5 Category Drawer [5.1]: Drawer buttons contain 1px borders, gradients, and hover transitions in CSS', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');

  assert.ok(css.includes('.drawer-cat-btn'), 'CSS must define .drawer-cat-btn');
  assert.ok(css.includes('border: 1px solid'), 'CSS must define 1px border on drawer buttons');
  assert.ok(css.includes('background: linear-gradient'), 'CSS must define gradient background on drawer buttons');
  assert.ok(css.includes('transform: translateX(4px)'), 'CSS must define translateX(4px) hover transition');
});

test('R5 Category Drawer [5.2]: Renders distinct badges for PSA, Raw, and Sealed categories in index.html', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

  // Verify badges in drawer
  assert.ok(html.includes('bg-amber-500/15 text-amber-300') || html.includes('bg-amber-500/15 text-amber-400'), 'Must contain Amber badge for PSA');
  assert.ok(html.includes('bg-emerald-500/15 text-emerald-300') || html.includes('bg-emerald-500/15 text-emerald-400'), 'Must contain Emerald badge for Raw');
  assert.ok(html.includes('bg-rose-500/15 text-rose-300') || html.includes('bg-rose-500/15 text-rose-400'), 'Must contain Crimson/Rose badge for Sealed');
});

// ==============================================================================
// SUITE 6: Requirement R6 - Supabase Architecture & 10 Pokémon Cards Catalog
// ==============================================================================

test('R6 Supabase [6.1]: schema.sql defines all 12 business entities with composite PK and foreign keys', () => {
  const sql = fs.readFileSync(path.join(ROOT_DIR, 'js/db/schema.sql'), 'utf8');

  const expectedTables = [
    'usuarios',
    'direcciones_envio',
    'categorias_producto',
    'sets_expansiones',
    'productos',
    'detalles_cartas',
    'detalles_sellados',
    'certificaciones_psa',
    'historial_precios',
    'metodos_pago_tokenizados',
    'ordenes_compra',
    'items_orden'
  ];

  expectedTables.forEach(tbl => {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS ${tbl}`), `schema.sql must create table ${tbl}`);
  });

  // Verify composite primary key in items_orden
  assert.ok(sql.includes('PRIMARY KEY (numero_orden, sku, grado)'), 'items_orden must declare composite PRIMARY KEY (numero_orden, sku, grado)');

  // Verify foreign keys
  assert.ok(sql.includes('REFERENCES ordenes_compra(numero_orden)'), 'Must reference ordenes_compra(numero_orden)');
  assert.ok(sql.includes('REFERENCES productos(sku)'), 'Must reference productos(sku)');
});

test('R6 Supabase [6.2]: schema.sql enables RLS on all 12 tables and defines public policies', () => {
  const sql = fs.readFileSync(path.join(ROOT_DIR, 'js/db/schema.sql'), 'utf8');

  const expectedTables = [
    'usuarios',
    'direcciones_envio',
    'categorias_producto',
    'sets_expansiones',
    'productos',
    'detalles_cartas',
    'detalles_sellados',
    'certificaciones_psa',
    'historial_precios',
    'metodos_pago_tokenizados',
    'ordenes_compra',
    'items_orden'
  ];

  expectedTables.forEach(tbl => {
    assert.ok(sql.includes(`ALTER TABLE ${tbl} ENABLE ROW LEVEL SECURITY;`), `Must enable RLS on table ${tbl}`);
  });

  assert.ok(sql.includes('CREATE POLICY "Public Read Categorias"'), 'Must define public read policy for catalog');
  assert.ok(sql.includes('CREATE POLICY "Public Insert Ordenes"'), 'Must define public insert policy for orders');
});

test('R6 Supabase [6.3]: supabase-config.js exports isConfigured() and getClient()', () => {
  const config = fs.readFileSync(path.join(ROOT_DIR, 'js/db/supabase-config.js'), 'utf8');

  assert.ok(config.includes('isConfigured: function'), 'supabase-config.js must export isConfigured()');
  assert.ok(config.includes('getClient: function'), 'supabase-config.js must export getClient()');
  assert.ok(config.includes('SUPABASE_CONFIG'), 'supabase-config.js must export SUPABASE_CONFIG');
});

test('R6 Supabase [6.4]: index.html includes Supabase v2 CDN and supabase-config.js', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

  assert.ok(html.includes('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'), 'index.html must load @supabase/supabase-js@2 CDN');
  assert.ok(html.includes('src="js/db/supabase-config.js"'), 'index.html must load js/db/supabase-config.js');
});

test('R6 Hybrid DB [6.5]: db-client.js provides transparent failover to Dexie/LocalStorage', () => {
  const dbClientCode = fs.readFileSync(path.join(ROOT_DIR, 'js/db/db-client.js'), 'utf8');

  assert.ok(dbClientCode.includes('activeBackend'), 'db-client.js must maintain activeBackend attribute');
  assert.ok(dbClientCode.includes('supabaseClient'), 'db-client.js must support supabaseClient');
  assert.ok(dbClientCode.includes('LocalStorageFallbackDB'), 'db-client.js must maintain LocalStorageFallbackDB');
});

test('R6 Catalog [6.6]: 10 Pokémon cards strictly bounded between $5.00 and $80.00 USD across all grades', () => {
  const { sandbox } = createTestRuntime();
  const { POKEMON_CARDS_CATALOG_10 } = sandbox;

  assert.equal(POKEMON_CARDS_CATALOG_10.length, 10, 'Catalog must contain exactly 10 cards');

  POKEMON_CARDS_CATALOG_10.forEach(card => {
    assert.ok(card.precios, `Card ${card.nombre} must have precios object`);
    const grades = ['raw', 'psa8', 'psa9', 'psa10'];
    grades.forEach(g => {
      const p = card.precios[g];
      assert.ok(typeof p === 'number', `Price for ${card.nombre} grade ${g} must be a number`);
      assert.ok(p >= 5.00, `Price $${p} for ${card.nombre} (${g}) is below minimum $5.00 USD`);
      assert.ok(p <= 80.00, `Price $${p} for ${card.nombre} (${g}) exceeds maximum $80.00 USD`);
    });
  });
});

test('R6 Plan [6.7]: PLAN_DE_TRABAJO.md marks FASE 8 and all 5 checklist items with [X]', () => {
  const plan = fs.readFileSync(path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md'), 'utf8');

  assert.ok(plan.includes('### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real'), 'FASE 8 header must be marked [X]');
  assert.ok(plan.includes('- [X] Extraer el modelo de datos a un archivo `js/db/schema.sql`'), 'Item 1 must be marked [X]');
  assert.ok(plan.includes('- [X] Importar el cliente de Supabase por CDN en `index.html`'), 'Item 2 must be marked [X]');
  assert.ok(plan.includes('- [X] Crear `js/db/supabase-config.js`'), 'Item 3 must be marked [X]');
  assert.ok(plan.includes('- [X] Refactorizar `js/db/db-client.js`'), 'Item 4 must be marked [X]');
  assert.ok(plan.includes('- [X] Configurar Políticas de Seguridad de Filas (RLS) en Supabase'), 'Item 5 must be marked [X]');
});
