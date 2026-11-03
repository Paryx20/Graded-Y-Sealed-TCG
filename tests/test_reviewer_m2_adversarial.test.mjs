/**
 * ==============================================================================
 * Independent Reviewer Adversarial Stress Test Suite: Milestone 2 (R1–R6)
 * File: tests/test_reviewer_m2_adversarial.test.mjs
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
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    document: documentMock,
    window: null,
    globalThis: null,
    localStorage: localStorageMock,
    location: { hash: '#home' },
    Event: class { constructor(type) { this.type = type; } },
    lucide: { createIcons: () => {} }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);

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
// ADVERSARIAL SUITE 1: R1 LIVE TRACKING SIMULATION & DELIVERY DIFFERENTIATION
// ==============================================================================

test('R1 Adversarial [1.1]: Accelerated progression timer advances Stage 2 to checked and activates Stage 3', async () => {
  const { sandbox, elements } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const order = TrackingView.getSimulatedOrder();
  Store.data.orders = [order];
  Store.data.activeTrackingOrderId = order.orderId;

  assert.equal(order.stages[1].status, 'active');
  assert.equal(order.stages[2].status, 'pending');

  TrackingView.afterRender();

  await new Promise(r => setTimeout(r, 2200));

  assert.equal(order.stages[1].status, 'completed', 'Stage 2 must be completed');
  assert.equal(order.stages[2].status, 'active', 'Stage 3 must be active');
  assert.equal(order.currentStageIndex, 2);

  const statusBadge = elements.get('tracking-status-badge');
  assert.ok(statusBadge.innerText.includes('Despacho') || statusBadge.innerText.includes('Camino'));
});

test('R1 Adversarial [1.2]: Timer cancellation (clearSimulationTimer) aborts progression on unmount', async () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const order = TrackingView.getSimulatedOrder();
  Store.data.orders = [order];
  Store.data.activeTrackingOrderId = order.orderId;

  TrackingView.afterRender();
  assert.ok(TrackingView._simulationTimer !== null, 'Timer must be active');

  TrackingView.clearSimulationTimer();
  assert.equal(TrackingView._simulationTimer, null, 'Timer must be cleared');

  await new Promise(r => setTimeout(r, 2200));

  assert.equal(order.stages[1].status, 'active', 'Stage 2 must remain active because timer was aborted');
  assert.equal(order.stages[2].status, 'pending', 'Stage 3 must remain pending');
});

test('R1 Adversarial [1.3]: Pickup delivery mode strictly suppresses courier truck and renders Bóveda details', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const pickupOrder = {
    orderId: '#PKM-PICKUP-TEST',
    numero_orden: '#PKM-PICKUP-TEST',
    metodo_entrega: 'pickup',
    deliveryMethod: 'Retiro en Local Central ($0.00)',
    buyerName: 'Verificador Auditor',
    stages: TrackingView.getDefaultStages({ metodo_entrega: 'pickup' }),
    items: []
  };

  Store.data.orders = [pickupOrder];
  Store.data.activeTrackingOrderId = pickupOrder.orderId;

  const html = TrackingView.render();
  const transitSectionHtml = TrackingView.renderPickupCard(pickupOrder);

  // In pickup mode:
  assert.ok(!transitSectionHtml.includes('data-lucide="truck"'), 'Pickup transit card must not render truck icon');
  assert.ok(html.includes('Listo para retiro presencial en Bóveda'), 'Must indicate ready for in-person pickup');
  assert.ok(html.includes('Av. República del Salvador N34-183 y Moscú'), 'Must display exact Bóveda address');
  assert.ok(html.includes('Lunes a Sábado: 09:00 - 18:00'), 'Must display opening hours');
  assert.ok(html.includes('Cédula de Identidad original'), 'Must mandate national ID card');
});

test('R1 Adversarial [1.4]: Home delivery mode renders specialized armored courier in transit', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const courierOrder = {
    orderId: '#PKM-COURIER-TEST',
    numero_orden: '#PKM-COURIER-TEST',
    metodo_entrega: 'courier',
    deliveryMethod: 'Envío Nacional Blindado ($5.00)',
    buyerName: 'Destinatario Verificado',
    stages: TrackingView.getDefaultStages({ metodo_entrega: 'courier' }),
    items: []
  };

  Store.data.orders = [courierOrder];
  Store.data.activeTrackingOrderId = courierOrder.orderId;

  const html = TrackingView.render();
  const transitSectionHtml = TrackingView.renderArmoredTransitCard(courierOrder);

  assert.ok(transitSectionHtml.includes('data-lucide="truck"'), 'Courier delivery card must display truck icon');
  assert.ok(html.includes('Transporte Blindado Especializado'), 'Must indicate armored transport');
  assert.ok(html.includes('GPS Activo'), 'Must display GPS monitoring badge');
});

// ==============================================================================
// ADVERSARIAL SUITE 2: R2 UNIVERSAL GOOGLE SIGN-IN & DYNAMIC PROFILE
// ==============================================================================

test('R2 Adversarial [2.1]: Google Sign-In containers exist across Login tab, Register tab, and Checkout', () => {
  const { sandbox } = createTestRuntime();
  const { CheckoutView } = sandbox;

  CheckoutView.authTab = 'login';
  const loginHtml = CheckoutView.renderAuth('login');
  assert.ok(loginHtml.includes('id="google-signin-container-auth-login"'), 'Login tab must have google container');

  CheckoutView.authTab = 'register';
  const registerHtml = CheckoutView.renderAuth('register');
  assert.ok(registerHtml.includes('id="google-signin-container-auth-register"'), 'Register tab must have google container');

  const checkoutHtml = CheckoutView.renderCheckout();
  assert.ok(checkoutHtml.includes('id="google-signin-container-checkout"'), 'Checkout must have google container');
});

test('R2 Adversarial [2.2]: Interactive fallback Google button activates and logs in cleanly without hardcoded ID', () => {
  const { sandbox, elements } = createTestRuntime();
  const { app, Store } = sandbox;

  app.initGoogleSignIn('google-signin-container-auth-login');
  const container = elements.get('google-signin-container-auth-login');
  assert.ok(container.innerHTML.includes('id="btn-google-fallback"'), 'Fallback button must be injected');

  app.handleSimulatedGoogleLogin();

  const user = Store.data.currentUser;
  assert.ok(user !== null, 'Current user must be logged in');
  assert.equal(user.authProvider, 'google');
  assert.ok(user.name && user.name.length > 0);
  assert.ok(user.email && user.email.includes('@'));
  // Critical integrity check: ID card, phone, and address MUST remain empty
  assert.equal(user.idCard, '', 'Ecuadorian ID must remain pristine empty');
  assert.equal(user.phone, '', 'Phone must remain empty');
  assert.equal(user.address, '', 'Address must remain empty');
});

// ==============================================================================
// ADVERSARIAL SUITE 3: R3 AUTHENTIC PSA SLAB REDESIGN (GRENINJA REFERENCE)
// ==============================================================================

test('R3 Adversarial [3.1]: PSA Slab renders beveled acrylic, 4 corner notches, and embossed logo', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, Store } = sandbox;

  const card = Store.getProduct('greninja-ex-twilight') || Store.getProduct('pikachu-crown-zenith');
  const slabHtml = PDPView.renderInspectorStage(card, 'psa10', 'slab');

  assert.ok(slabHtml.includes('psa-acrylic-slab'), 'Must have .psa-acrylic-slab');
  assert.ok(slabHtml.includes('psa-inner-well'), 'Must have .psa-inner-well');
  assert.ok(slabHtml.includes('psa-notch-tl'), 'Must have top-left notch');
  assert.ok(slabHtml.includes('psa-notch-tr'), 'Must have top-right notch');
  assert.ok(slabHtml.includes('psa-notch-bl'), 'Must have bottom-left notch');
  assert.ok(slabHtml.includes('psa-notch-br'), 'Must have bottom-right notch');
  assert.ok(slabHtml.includes('psa-molded-logo'), 'Must have molded PSA logo');
});

test('R3 Adversarial [3.2]: PSA Slab red border label contains official typography, barcode, cert, and grade', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, Store } = sandbox;

  const card = Store.getProduct('greninja-ex-twilight') || Store.getProduct('charizard-base');
  const slabHtml = PDPView.renderInspectorStage(card, 'psa10', 'slab');

  assert.ok(slabHtml.includes('psa-official-label'), 'Must have .psa-official-label');
  assert.ok(slabHtml.includes('PROFESSIONAL SPORTS AUTHENTICATOR'), 'Must have header text');
  assert.ok(slabHtml.includes('<span>PSA</span>'), 'Must have exact <span>PSA</span>');
  assert.ok(slabHtml.includes('psa-barcode'), 'Must have barcode element');
  assert.ok(slabHtml.includes('#' + card.certNumber), 'Must display certification code');
  assert.ok(slabHtml.includes('GRADO'), 'Must display GRADO label');
  assert.ok(slabHtml.includes('GEM MT 10'), 'Must display GEM MT 10 grade');
  assert.ok(!slabHtml.includes('centering-grid-overlay'), 'Must strictly eliminate centering grid overlay');
});

// ==============================================================================
// ADVERSARIAL SUITE 4: R4 MULTI-CRITERIA CATEGORY SEARCH & VAULT FALLBACK
// ==============================================================================

test('R4 Adversarial [4.1]: matchesCategory cleanly identifies single cards vs sealed products', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const psaCard = Store.getProduct('pikachu-crown-zenith');
  const rawCard = Store.getProduct('eevee-twilight');
  const sealed = Store.getProduct('booster-team-rocket');

  assert.ok(CatalogView.matchesCategory(psaCard, 'psa'), 'Pikachu must match psa');
  assert.ok(CatalogView.matchesCategory(rawCard, 'raw'), 'Eevee must match raw');
  assert.ok(CatalogView.matchesCategory(sealed, 'sealed'), 'Booster box must match sealed');
  assert.ok(!CatalogView.matchesCategory(psaCard, 'sealed'), 'Pikachu must not match sealed');
});

test('R4 Adversarial [4.2]: Searching card name within sealed category triggers vault fallback without blocking results', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  Store.data.catalogFilters.category = 'sealed';
  Store.data.catalogFilters.searchQuery = 'greninja';

  const results = CatalogView.getFilteredProducts();
  assert.ok(results.length > 0, 'Searching greninja in sealed category must return cards via vault fallback');
  assert.equal(CatalogView.isVaultFallback, true, 'isVaultFallback flag must be active');
  assert.ok(results.some(c => c.nombre.toLowerCase().includes('greninja')));
});

test('R4 Adversarial [4.3]: Searching nonexistent query returns 0 results cleanly without errors', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  Store.data.catalogFilters.category = 'all';
  Store.data.catalogFilters.searchQuery = 'nonexistentcardquery_xyz_99999';

  const results = CatalogView.getFilteredProducts();
  assert.equal(results.length, 0);
  assert.equal(CatalogView.isVaultFallback, false);
});

// ==============================================================================
// ADVERSARIAL SUITE 5: R5 MODERNIZED CATEGORY DRAWER MICROINTERACTIONS
// ==============================================================================

test('R5 Adversarial [5.1]: Drawer category buttons contain 1px borders, gradients, badges, and hover translation', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');

  // Verify CSS microinteraction
  assert.ok(css.includes('.drawer-cat-btn'), 'CSS must define .drawer-cat-btn');
  assert.ok(css.includes('transform: translateX(4px)'), 'CSS must define translateX on hover');

  // Verify HTML drawer markup
  assert.ok(html.includes('id="categories-drawer"'), 'HTML must have #categories-drawer');
  assert.ok(html.includes('Grado 8-10'), 'Must contain PSA badge');
  assert.ok(html.includes('Near Mint'), 'Must contain Raw badge');
  assert.ok(html.includes('1999 WotC'), 'Must contain Sealed badge');
});

// ==============================================================================
// ADVERSARIAL SUITE 6: R6 SUPABASE ARCHITECTURE & 10-CARD REAL MARKET PRICING
// ==============================================================================

test('R6 Adversarial [6.1]: schema.sql defines all 12 entities, composite PK, indexes, and RLS', () => {
  const sql = fs.readFileSync(path.join(ROOT_DIR, 'js/db/schema.sql'), 'utf8');

  const requiredTables = [
    'usuarios', 'direcciones_envio', 'categorias_producto', 'sets_expansiones',
    'productos', 'detalles_cartas', 'detalles_sellados', 'certificaciones_psa',
    'historial_precios', 'metodos_pago_tokenizados', 'ordenes_compra', 'items_orden'
  ];

  requiredTables.forEach(t => {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS ${t}`), `Table ${t} missing in schema.sql`);
    assert.ok(sql.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`), `RLS missing for ${t}`);
  });

  assert.ok(sql.includes('PRIMARY KEY (numero_orden, sku, grado)'), 'items_orden must declare composite PK');
});

test('R6 Adversarial [6.2]: 10 Pokémon cards strictly bounded between $5.00 and $80.00 USD across all grades', () => {
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(dataCode + '\n; globalThis.catalog = POKEMON_CARDS_CATALOG_10;', context);
  const catalog = context.catalog;

  assert.equal(catalog.length, 10, 'Catalog must contain exactly 10 cards');

  catalog.forEach(card => {
    assert.ok(card.precios, `Card ${card.id} must have precios`);
    ['raw', 'psa8', 'psa9', 'psa10'].forEach(grade => {
      const p = card.precios[grade];
      assert.ok(typeof p === 'number', `Price for ${card.id} ${grade} must be a number`);
      assert.ok(p >= 5.00 && p <= 80.00, `Price for ${card.id} ${grade} ($${p}) must be strictly between $5.00 and $80.00 USD`);
    });
  });
});

test('R6 Adversarial [6.3]: PLAN_DE_TRABAJO.md marks FASE 8 with [X]', () => {
  const plan = fs.readFileSync(path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md'), 'utf8');
  assert.ok(plan.includes('### [X] FASE 8: Migración a Supabase'), 'FASE 8 header must be marked [X]');
  assert.ok(!plan.includes('### [ ] FASE 8: Migración a Supabase'), 'FASE 8 header must not be uncompleted');
});
