/**
 * ==============================================================================
 * CHALLENGER ADVERSARIAL STRESS TEST SUITE: R4, R5, R6 EMPIRICAL VERIFICATION
 * File: tests/challenger_stress_r4_r5_r6.test.mjs
 * 
 * Verifies Requirements R4, R5, R6 under hostile, edge-case, and boundary conditions:
 *   1. R4: Search Card Navigation & Cache Persistence
 *      - Action buttons with exotic card names (apostrophes, quotes, HTML entities, diacritics)
 *      - Assert ZERO syntax errors in onclick attributes
 *      - Full PDP navigation, multi-variable pricing, condition switching
 *      - Store.data.apiCardsCache persistence across simulated page reloads
 *      - Cart addition and order processing for external API search cards
 *   2. R5: Preloaded Live Tracking Simulation & Zero Manual Controls
 *      - Clean session without orders loads #GS-2026-9481, GUI-EC-948102-PSA
 *      - 4 custody timeline stages, no empty-state text
 *      - ZERO manual simulation control buttons
 *      - Real checkout order placement overrides simulation and updates tracking
 *      - Multi-order switching in tracking view
 *   3. R6: Google OAuth 2.0 Integration & Dynamic Profile
 *      - Zero hardcoded mock user data on initial unauthenticated load
 *      - Client-side decodeJwtResponse fuzzing (empty, malformed, non-string, truncated, UTF-8 accented)
 *      - Dual-mode GIS initialization (fallback button vs official google.accounts.id)
 *      - Dynamic profile session population with Google badge
 *      - Full logout protocol (google.accounts.id.disableAutoSelect, storage purge, navbar reset, guest UI)
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

// Helper to build a comprehensive sandbox for testing
function createChallengerSandbox() {
  const elements = new Map();

  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.classList = {
        _classes: new Set(),
        add(...cls) { cls.forEach(c => this._classes.add(c)); },
        remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
        contains(c) { return this._classes.has(c); },
        toggle(c, force) {
          if (force !== undefined) {
            force ? this._classes.add(c) : this._classes.delete(c);
            return force;
          }
          if (this._classes.has(c)) { this._classes.delete(c); return false; }
          this._classes.add(c); return true;
        }
      };
      this.style = {};
      this.attributes = new Map();
      this._innerHTML = '';
      this._innerText = '';
      this.value = '';
      this.children = [];
      this.parentNode = null;
      if (id) elements.set(id, this);
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) { this._innerHTML = String(v); }
    get innerText() { return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim(); }
    set innerText(v) { this._innerText = String(v); }
    setAttribute(k, v) { this.attributes.set(k, String(v)); this[k] = String(v); }
    getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
    hasAttribute(k) { return this.attributes.has(k); }
    removeAttribute(k) { this.attributes.delete(k); delete this[k]; }
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) { this.children.splice(idx, 1); child.parentNode = null; }
      return child;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    addEventListener() {}
    removeEventListener() {}
    focus() {}
  }

  // Pre-create common DOM elements
  new MockElement('app-view');
  new MockElement('toast-container');
  new MockElement('search-results-container');
  new MockElement('cart-count-badge');
  new MockElement('cart-count-badge-mobile');
  new MockElement('nav-user-label');
  new MockElement('btn-nav-account');

  const storageMap = new Map();
  const localStorageMock = {
    getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear(),
    get length() { return storageMap.size; }
  };

  const doc = {
    readyState: 'complete',
    body: new MockElement('body'),
    createElement: (tag) => new MockElement('', tag),
    getElementById: (id) => elements.get(id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const win = {
    location: { hash: '#home' },
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const sandbox = {
    window: win,
    document: doc,
    localStorage: localStorageMock,
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    JSON,
    URLSearchParams,
    Buffer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    lucide: { createIcons: () => {} }
  };
  sandbox.globalThis = sandbox;
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;

  vm.createContext(sandbox);

  // Load production files
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8') + '\n; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS;', sandbox);
  win.APP_CONFIG = sandbox.APP_CONFIG;
  win.PRODUCTS = sandbox.PRODUCTS;

  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8') + '\n; globalThis.Store = Store;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/services/pokemon-api.js'), 'utf8') + '\n; globalThis.PokemonAPI = PokemonAPI;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/views/search-results.js'), 'utf8') + '\n; globalThis.SearchResultsView = SearchResultsView;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8') + '\n; globalThis.PDPView = PDPView;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/views/tracking.js'), 'utf8') + '\n; globalThis.TrackingView = TrackingView;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/views/profile.js'), 'utf8') + '\n; globalThis.ProfileView = ProfileView;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8') + '\n; globalThis.CheckoutView = CheckoutView;', sandbox);

  sandbox.HomeView = { render: () => '<div id="home-view">Home</div>' };
  sandbox.CatalogView = { render: () => '<div id="catalog-view">Catalog</div>' };
  sandbox.CartView = { render: () => '<div id="cart-view">Cart</div>' };
  win.HomeView = sandbox.HomeView;

  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8') + '\n; globalThis.app = app;', sandbox);

  return {
    sandbox,
    doc,
    win,
    elements,
    localStorage: localStorageMock,
    Store: sandbox.Store,
    app: sandbox.app,
    SearchResultsView: sandbox.SearchResultsView,
    PDPView: sandbox.PDPView,
    TrackingView: sandbox.TrackingView,
    ProfileView: sandbox.ProfileView,
    CheckoutView: sandbox.CheckoutView,
    PokemonAPI: sandbox.PokemonAPI
  };
}

// Helper to craft valid base64url JWTs
function createJwt(payload, header = { alg: 'RS256', typ: 'JWT' }) {
  const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64url(header)}.${b64url(payload)}.mockSignature_XYZ123`;
}

// ==============================================================================
// 1. REQUIREMENT R4: SEARCH CARD NAVIGATION & CACHE PERSISTENCE
// ==============================================================================

test('R4 Adversarial [1.1]: Search results render exotic card names without JavaScript syntax errors in HTML', () => {
  const { SearchResultsView } = createChallengerSandbox();

  const exoticCards = [
    {
      id: 'gym2-2',
      nombre: "Blaine's Charizard",
      set: 'Gym Challenge',
      rareza: 'Holo Rare',
      imagen: 'https://images.pokemontcg.io/gym2/2.png',
      precioEstimado: 285.50,
      fuente: 'pokemontcg.io'
    },
    {
      id: 'gym1-13',
      nombre: "Lt. Surge's Raichu",
      set: 'Gym Heroes',
      rareza: 'Rare Holo',
      imagen: 'https://images.pokemontcg.io/gym1/13.png',
      precioEstimado: 95.00,
      fuente: 'pokemontcg.io'
    },
    {
      id: 'gym1-115',
      nombre: "Koga's Ninja Trick",
      set: 'Gym Heroes',
      rareza: 'Uncommon',
      imagen: 'https://images.pokemontcg.io/gym1/115.png',
      precioEstimado: 38.00,
      fuente: 'pokemontcg.io'
    },
    {
      id: 'swsh45-71',
      nombre: "Farfetch'd & Sirfetch'd \"GX\" Special",
      set: "Champion's Path",
      rareza: 'Secret Rare',
      imagen: 'https://images.pokemontcg.io/swsh45/71.png',
      precioEstimado: 450.00,
      fuente: 'pokemontcg.io'
    },
    {
      id: 'ex-flabebe-01',
      nombre: 'Flabébé <Special Edition> & Pokémon Trainer',
      set: 'Flashfire',
      rareza: 'Ultra Rare',
      imagen: 'https://images.pokemontcg.io/xy2/62.png',
      precioEstimado: 62.00,
      fuente: 'pokemontcg.io'
    }
  ];

  SearchResultsView.results = exoticCards;
  const gridHtml = SearchResultsView.renderResultsGrid(exoticCards, 'Exotic Query');

  // Verify that rendered HTML does NOT contain unescaped single quotes inside JS onclick
  assert.ok(!gridHtml.includes("openQuoteModal('Blaine's"), 'Must not have unescaped quote in onclick');
  assert.ok(!gridHtml.includes("openQuoteModal('Lt. Surge's"), 'Must not have unescaped quote in onclick');
  assert.ok(!gridHtml.includes("openQuoteModal('Koga's"), 'Must not have unescaped quote in onclick');

  // Verify safe invocation using clean card ID
  for (const card of exoticCards) {
    assert.ok(
      gridHtml.includes(`SearchResultsView.handleCardAction('${card.id}')`),
      `Must generate clean handleCardAction invocation for ${card.id}`
    );
  }
});

test('R4 Adversarial [1.2]: Action button click navigates to PDP with multi-variable pricing for exotic cards', () => {
  const { SearchResultsView, Store } = createChallengerSandbox();

  const exoticCard = {
    id: 'gym2-2',
    nombre: "Blaine's Charizard",
    set: 'Gym Challenge',
    rareza: 'Holo Rare',
    imagen: 'https://images.pokemontcg.io/gym2/2.png',
    precioEstimado: 250.00,
    fuente: 'pokemontcg.io'
  };

  SearchResultsView.results = [exoticCard];
  SearchResultsView.handleCardAction('gym2-2');

  const pdpProduct = Store.data.currentPdpProduct;
  assert.ok(pdpProduct, 'currentPdpProduct must be set');
  assert.equal(pdpProduct.id, 'gym2-2');
  assert.equal(pdpProduct.nombre, "Blaine's Charizard");
  assert.equal(pdpProduct.precios.raw, 250);
  assert.equal(pdpProduct.precios.psa8, Math.round(250 * 1.35));
  assert.equal(pdpProduct.precios.psa9, Math.round(250 * 2.10));
  assert.equal(pdpProduct.precios.psa10, Math.round(250 * 5.20));
  assert.equal(Store.data.pdpSelectedCondition, 'psa10');
});

test('R4 Adversarial [1.3]: Store.data.apiCardsCache persistence across simulated page reloads', () => {
  const { Store, localStorage } = createChallengerSandbox();

  const testCards = [
    { id: 'card-1', nombre: "Blaine's Charizard", set: 'Gym Challenge', precioEstimado: 250 },
    { id: 'card-2', nombre: "Lt. Surge's Raichu", set: 'Gym Heroes', precioEstimado: 95 },
    { id: 'card-3', nombre: "Koga's Ninja Trick", set: 'Gym Heroes', precioEstimado: 38 },
    { id: 'card-4', nombre: "Farfetch'd V", set: 'Darkness Ablaze', precioEstimado: 45 },
    { id: 'card-5', nombre: "Flabébé Shiny", set: 'Hidden Fates', precioEstimado: 120 }
  ];

  for (const card of testCards) {
    Store.registerApiCard(card);
  }

  // Verify localStorage has cached all 5 cards
  const rawCache = localStorage.getItem('gstcg_api_cards_cache');
  assert.ok(rawCache, 'localStorage must contain gstcg_api_cards_cache');
  const parsedCache = JSON.parse(rawCache);
  assert.equal(Object.keys(parsedCache).length, 5);
  assert.ok(parsedCache['card-1']);
  assert.ok(parsedCache['card-5']);

  // Simulate complete page reload: wipe in-memory state and re-initialize
  Store.data.apiCardsCache = {};
  assert.equal(Object.keys(Store.data.apiCardsCache).length, 0);

  Store.init();

  // Verify all 5 cards are rehydrated into memory
  assert.equal(Object.keys(Store.data.apiCardsCache).length, 5);
  for (const card of testCards) {
    const loaded = Store.getProduct(card.id);
    assert.ok(loaded, `Product ${card.id} must be resolved from cache`);
    assert.equal(loaded.nombre, card.nombre);
    assert.ok(loaded.precios.psa10 > 0);
  }
});

test('R4 Adversarial [1.4]: External API search card can be added to cart and completes order processing', () => {
  const { Store, PDPView, app } = createChallengerSandbox();

  const externalCard = {
    id: 'api-espeon-vmax',
    nombre: 'Espeon VMAX Alternate Art',
    set: 'Fusion Strike',
    rareza: 'Secret Rare',
    imagen: 'https://images.pokemontcg.io/swsh8/270.png',
    precioEstimado: 180.00,
    fuente: 'pokemontcg.io'
  };

  const registered = Store.registerApiCard(externalCard);
  Store.data.currentPdpProduct = registered;
  Store.data.pdpSelectedCondition = 'psa9';
  Store.data.pdpQuantity = 2;

  // Add to cart via PDPView
  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const cartItem = Store.data.cart[0];
  assert.equal(cartItem.id, 'api-espeon-vmax-psa9');
  assert.equal(cartItem.name, 'Espeon VMAX Alternate Art');
  assert.equal(cartItem.condition, 'PSA 9 MINT');
  assert.equal(cartItem.price, registered.precios.psa9);
  assert.equal(cartItem.quantity, 2);

  // Check totals calculation
  Store.data.deliveryMethod = 'courier';
  const totals = Store.getCartTotals();
  const expectedSubtotal = registered.precios.psa9 * 2;
  assert.equal(totals.subtotal, expectedSubtotal);
  assert.equal(totals.shipping, 5.00);
  assert.equal(totals.tax, Math.round(expectedSubtotal * 0.15 * 100) / 100);
  assert.equal(totals.total, Math.round((expectedSubtotal + 5.00 + totals.tax) * 100) / 100);

  // Finalize order
  const newOrder = {
    orderId: '#GS-2026-API-01',
    numero_orden: '#GS-2026-API-01',
    trackingNumber: 'GUI-EC-API001-PSA',
    courierName: 'Servientrega Blindado • Bóveda G&S',
    date: '02 Nov 2026',
    status: 'En Preparación / En Custodia',
    total: totals.total,
    items: [...Store.data.cart]
  };

  Store.addOrder(newOrder);

  assert.equal(Store.data.orders.length, 1);
  assert.equal(Store.data.activeTrackingOrderId, '#GS-2026-API-01');
  const retrievedOrder = Store.getOrderById('#GS-2026-API-01');
  assert.equal(retrievedOrder.orderId, '#GS-2026-API-01');
  assert.equal(retrievedOrder.items[0].name, 'Espeon VMAX Alternate Art');
});

// ==============================================================================
// 2. REQUIREMENT R5: PRELOADED LIVE TRACKING SIMULATION & ZERO CONTROLS
// ==============================================================================

test('R5 Adversarial [2.1]: Clean session with empty orders renders active simulated timeline #GS-2026-9481', () => {
  const { Store, TrackingView } = createChallengerSandbox();

  // Clean session
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  const html = TrackingView.render();

  // Invariant 1: Absolutely no empty state text
  assert.ok(!html.includes('No tienes pedidos activos en curso'), 'Must NOT contain empty-order placeholder');
  assert.ok(!html.includes('Aún no registras órdenes'), 'Must NOT contain empty profile text');

  // Invariant 2: Contains required order & tracking codes
  assert.ok(html.includes('#GS-2026-9481'), 'Must contain order #GS-2026-9481');
  assert.ok(html.includes('GUI-EC-948102-PSA'), 'Must contain tracking number GUI-EC-948102-PSA');
  assert.ok(html.includes('Servientrega Blindado • Bóveda G&S'), 'Must contain designated armored courier');
  assert.ok(html.includes('04 Nov 2026 (Entrega Garantizada en Mano)'), 'Must contain realistic delivery date');

  // Invariant 3: Contains exactly 4 stages with expected custody titles
  assert.ok(html.includes('1. Orden Recibida'), 'Must contain stage 1');
  assert.ok(html.includes('2. Autenticación PSA'), 'Must contain stage 2');
  assert.ok(html.includes('3. Despacho Blindado'), 'Must contain stage 3');
  assert.ok(html.includes('4. En Reparto / Entrega'), 'Must contain stage 4');

  // Invariant 4: Stage 2 is active (pulse / in-custody milestone)
  assert.ok(html.includes('Autenticación PSA Bóveda'), 'Active status must reflect PSA authentication');
});

test('R5 Adversarial [2.2]: Invariant - Tracking view contains ZERO manual simulation control buttons', () => {
  const { TrackingView, Store } = createChallengerSandbox();
  Store.data.orders = [];

  const html = TrackingView.render();

  // Attack vectors: manual advance, state manipulation, step simulation
  const forbiddenControlPhrases = [
    'Avanzar paso',
    'Paso siguiente',
    'Simular despacho',
    'Avanzar etapa',
    'Siguiente etapa',
    'Simular entrega',
    'Retroceder',
    'Cambiar estado',
    'Forzar entrega',
    'Modo demo',
    'Simular estado'
  ];

  for (const phrase of forbiddenControlPhrases) {
    assert.ok(
      !html.toLowerCase().includes(phrase.toLowerCase()),
      `Tracking view must not contain manual simulation phrase: "${phrase}"`
    );
  }

  // Verify only permitted action buttons exist (e.g. Descargar Factura)
  const buttonMatches = html.match(/<button[\s\S]*?<\/button>/gi) || [];
  for (const btn of buttonMatches) {
    const isSRIFactura = btn.includes('Factura') || btn.includes('app.showToast');
    const isOrderTab = btn.includes('openOrderTracking');
    assert.ok(
      isSRIFactura || isOrderTab,
      `Unexpected button found in tracking view: ${btn}`
    );
  }
});

test('R5 Adversarial [2.3]: Placing real order updates tracking with real purchase details and overrides simulation', () => {
  const { Store, TrackingView } = createChallengerSandbox();

  // Real purchase placed
  const realOrder = {
    orderId: '#GS-2026-7788',
    numero_orden: '#GS-2026-7788',
    trackingNumber: 'GUI-EC-778899-PSA',
    courierName: 'Servientrega Blindado • Bóveda G&S',
    date: '02 Nov 2026, 12:45',
    buyerName: 'Coleccionista Guayaquil',
    deliveryMethod: 'Courier Nacional Blindado Especializado',
    estimatedDelivery: '04 Nov 2026',
    status: 'En Custodia • Autenticación PSA Bóveda',
    subtotal: 4850.00,
    tax: 727.50,
    shipping: 5.00,
    total: 5582.50,
    paymentMethod: 'Tarjeta de Crédito (3D Secure)',
    items: [
      {
        id: 'umbreon-vmax-alt',
        name: 'Umbreon VMAX Moonbreon #215/203',
        condition: 'PSA 10 GEM MT',
        price: 4850.00,
        quantity: 1,
        imageLocal: 'assets/img/cards/card-back.png'
      }
    ]
  };

  Store.addOrder(realOrder);

  const html = TrackingView.render();

  // Invariant: Real order takes priority
  assert.ok(html.includes('#GS-2026-7788'), 'Must display real order ID');
  assert.ok(html.includes('GUI-EC-778899-PSA'), 'Must display real tracking code');
  assert.ok(html.includes('Umbreon VMAX Moonbreon #215/203'), 'Must display real item in order');
  assert.ok(html.includes('$5,582.50 USD'), 'Must display real order total');
  assert.ok(!html.includes('Charizard Base Set 1999 #4/102'), 'Must not display simulated order item');
});

test('R5 Adversarial [2.4]: Multi-order tracking history allows selecting between multiple real orders', () => {
  const { Store, TrackingView } = createChallengerSandbox();

  const order1 = { orderId: '#GS-2026-0001', trackingNumber: 'GUI-EC-0001-PSA', total: 100, items: [] };
  const order2 = { orderId: '#GS-2026-0002', trackingNumber: 'GUI-EC-0002-PSA', total: 200, items: [] };

  Store.addOrder(order1);
  Store.addOrder(order2);

  assert.equal(Store.data.orders.length, 2);
  const html = TrackingView.render();

  // Verify multi-order selector buttons
  assert.ok(html.includes('Seleccionar orden del historial (2)'), 'Must render multi-order picker');
  assert.ok(html.includes('#GS-2026-0001'), 'Must include button for order 1');
  assert.ok(html.includes('#GS-2026-0002'), 'Must include button for order 2');
});

// ==============================================================================
// 3. REQUIREMENT R6: GOOGLE OAUTH 2.0 INTEGRATION & DYNAMIC PROFILE
// ==============================================================================

test('R6 Adversarial [3.1]: Initial unauthenticated load strictly contains ZERO hardcoded mock identity data', () => {
  const { Store, ProfileView, CheckoutView } = createChallengerSandbox();

  // Assert Store currentUser is null
  assert.equal(Store.data.currentUser, null, 'Store.data.currentUser must be null on unauthenticated boot');

  // Assert ProfileView renders clean guest prompt with #google-signin-container
  const profileHtml = ProfileView.render();
  assert.ok(profileHtml.includes('id="google-signin-container"'), 'Must render #google-signin-container');
  assert.ok(profileHtml.includes('Acceso a Bóveda &amp; Perfil de Custodia'), 'Must display guest prompt');

  // Verify complete absence of hardcoded mock values
  const forbiddenMockData = [
    '1710034065',
    '0991234567',
    'Av. República del Salvador',
    'Patricio Coleccionista',
    'user@tcgvault.com',
    'Quito'
  ];

  for (const mockVal of forbiddenMockData) {
    assert.ok(
      !profileHtml.includes(mockVal),
      `Unauthenticated Profile HTML must not contain mock data: "${mockVal}"`
    );
  }

  // Assert CheckoutView guest fields are empty strings
  const checkoutHtml = CheckoutView.renderCheckout();
  assert.ok(checkoutHtml.includes('id="guest-city" value=""'), 'Guest city must be empty string');
  assert.ok(checkoutHtml.includes('id="guest-id"'), 'Guest id field present');
});

test('R6 Adversarial [3.2]: Fuzzing client-side decodeJwtResponse with hostile, malformed & boundary inputs', () => {
  const { app } = createChallengerSandbox();

  // 1. Primitive and malformed inputs
  assert.equal(app.decodeJwtResponse(null), null);
  assert.equal(app.decodeJwtResponse(undefined), null);
  assert.equal(app.decodeJwtResponse(12345), null);
  assert.equal(app.decodeJwtResponse({}), null);
  assert.equal(app.decodeJwtResponse([]), null);
  assert.equal(app.decodeJwtResponse(true), null);
  assert.equal(app.decodeJwtResponse(false), null);
  assert.equal(app.decodeJwtResponse(''), null);
  assert.equal(app.decodeJwtResponse('   '), null);
  assert.equal(app.decodeJwtResponse('.'), null);
  assert.equal(app.decodeJwtResponse('..'), null);
  assert.equal(app.decodeJwtResponse('...'), null);
  assert.equal(app.decodeJwtResponse('only_one_part'), null);
  assert.equal(app.decodeJwtResponse('part1.part2'), null, 'Invalid base64 payload should return null');
  assert.equal(app.decodeJwtResponse('part1.###not_base64###.part3'), null);

  // 2. Valid Base64 but non-JSON payload
  const nonJsonB64 = Buffer.from('hello world, this is plain text').toString('base64');
  assert.equal(app.decodeJwtResponse(`header.${nonJsonB64}.sig`), null);

  // 3. Valid JSON with standard claims
  const validClaims = {
    sub: 'google-sub-778899',
    name: 'Carlos Alberto Mora',
    email: 'carlos.mora@bovedapkm.ec',
    picture: 'https://lh3.googleusercontent.com/a/carlos-avatar'
  };
  const token = createJwt(validClaims);
  const decoded = app.decodeJwtResponse(token);
  assert.ok(decoded !== null);
  assert.equal(decoded.sub, 'google-sub-778899');
  assert.equal(decoded.name, 'Carlos Alberto Mora');
  assert.equal(decoded.email, 'carlos.mora@bovedapkm.ec');
  assert.equal(decoded.picture, 'https://lh3.googleusercontent.com/a/carlos-avatar');
});

test('R6 Adversarial [3.3]: decodeJwtResponse accurately preserves complex UTF-8 accented characters and emojis', () => {
  const { app } = createChallengerSandbox();

  const utf8TestCases = [
    { name: 'José Ñuñez & María Belén Córdova', email: 'jose.nuñez@vault.ec' },
    { name: 'Álvaro Peña & René Ibáñez', email: 'alvaro.peña@pkm.ec' },
    { name: 'Satoshi Tajiri (田尻 智) 🎮', email: 'tajiri@nintendo.jp' },
    { name: 'Müller & François Müller', email: 'muller@vault.de' },
    { name: 'Coleccionista Pokémon™ ⭐ Bóveda 👑', email: 'champion@vault.ec' }
  ];

  for (const tc of utf8TestCases) {
    const payload = { sub: 'google-sub-utf8', name: tc.name, email: tc.email };
    const jwt = createJwt(payload);
    const result = app.decodeJwtResponse(jwt);

    assert.ok(result !== null, `Failed to decode JWT for: ${tc.name}`);
    assert.equal(result.name, tc.name, `Accented characters corrupted for: ${tc.name}`);
    assert.equal(result.email, tc.email);
  }
});

test('R6 Adversarial [3.4]: Dual-mode GIS initialization - Fallback button when unconfigured/offline', () => {
  const { app, Store, doc, elements } = createChallengerSandbox();

  const container = doc.createElement('div');
  container.id = 'google-signin-container';
  elements.set('google-signin-container', container);

  // When unconfigured (default placeholder client ID)
  app.initGoogleSignIn('google-signin-container');

  assert.ok(container.innerHTML.includes('id="btn-google-fallback"'), 'Must render fallback button');
  assert.ok(container.innerHTML.includes('Continuar con Google'), 'Must render Continuar con Google text');
  assert.ok(container.innerHTML.includes('<svg'), 'Must render Google SVG icon');

  // Test triggering fallback login
  app.handleSimulatedGoogleLogin();
  assert.ok(Store.data.currentUser !== null);
  assert.equal(Store.data.currentUser.name, 'Patrick Mora');
  assert.equal(Store.data.currentUser.email, 'patrickmora2006@gmail.com');
  assert.equal(Store.data.currentUser.authProvider, 'google');
  assert.equal(Store.data.currentUser.idCard, '');
  assert.equal(Store.data.currentUser.phone, '');
});

test('R6 Adversarial [3.5]: Dual-mode GIS initialization - Official google.accounts.id when configured', () => {
  const { app, doc, elements, win, sandbox } = createChallengerSandbox();

  const container = doc.createElement('div');
  container.id = 'google-signin-container';
  elements.set('google-signin-container', container);

  let gisInitOpts = null;
  let gisRenderEl = null;

  win.google = {
    accounts: {
      id: {
        initialize: (opts) => { gisInitOpts = opts; },
        renderButton: (el, opts) => {
          gisRenderEl = el;
          el.innerHTML = '<div class="google-official-btn">Sign in with Google</div>';
        }
      }
    }
  };

  const PROD_CLIENT_ID = '9876543210-pokemonvault.apps.googleusercontent.com';
  sandbox.APP_CONFIG.GOOGLE_CLIENT_ID = PROD_CLIENT_ID;
  win.APP_CONFIG.GOOGLE_CLIENT_ID = PROD_CLIENT_ID;

  app.initGoogleSignIn('google-signin-container');

  assert.ok(gisInitOpts !== null, 'google.accounts.id.initialize must be called');
  assert.equal(gisInitOpts.client_id, PROD_CLIENT_ID);
  assert.equal(gisInitOpts.auto_select, false);
  assert.equal(gisInitOpts.cancel_on_tap_outside, true);
  assert.equal(typeof gisInitOpts.callback, 'function');
  assert.equal(gisRenderEl, container);
  assert.ok(container.innerHTML.includes('google-official-btn'));

  // Simulate Google identity callback delivery
  const token = createJwt({
    sub: 'google-sub-prod-99',
    name: 'Verónica Castro',
    email: 'veronica.castro@tcg.ec',
    picture: 'https://lh3.googleusercontent.com/a/veronica'
  });

  gisInitOpts.callback({ credential: token });

  const activeUser = sandbox.Store.data.currentUser;
  assert.ok(activeUser !== null);
  assert.equal(activeUser.id, 'google-sub-prod-99');
  assert.equal(activeUser.name, 'Verónica Castro');
  assert.equal(activeUser.email, 'veronica.castro@tcg.ec');
  assert.equal(activeUser.avatar, 'https://lh3.googleusercontent.com/a/veronica');
  assert.equal(activeUser.authProvider, 'google');
  assert.equal(activeUser.idCard, '');
  assert.equal(activeUser.city, '');
});

test('R6 Adversarial [3.6]: Authenticated profile renders Google Verified badge, user data and pristine empty inputs', () => {
  const { ProfileView, Store } = createChallengerSandbox();

  Store.data.currentUser = {
    id: 'google-sub-test',
    name: 'José Delgado',
    email: 'jose.delgado@vault.ec',
    avatar: 'https://images.unsplash.com/mock-avatar.jpg',
    authProvider: 'google',
    idCard: '',
    phone: '',
    city: '',
    address: ''
  };

  const html = ProfileView.render();

  assert.ok(html.includes('Cuenta Google Verificada'), 'Must display Cuenta Google Verificada badge');
  assert.ok(html.includes('José Delgado'), 'Must display user name');
  assert.ok(html.includes('jose.delgado@vault.ec'), 'Must display user email');
  assert.ok(html.includes('https://images.unsplash.com/mock-avatar.jpg'), 'Must display Google avatar URL');
  assert.ok(html.includes('value=""'), 'Empty fields must render with value=""');
  assert.ok(!html.includes('1710034065'), 'Must not render mock cédula');
});

test('R6 Adversarial [3.7]: Complete Logout Protocol resets GIS, session, storage, navbar and resets #profile to guest state', () => {
  const { app, Store, localStorage, doc, win, elements } = createChallengerSandbox();

  let autoSelectDisabled = false;
  win.google = {
    accounts: {
      id: {
        disableAutoSelect: () => { autoSelectDisabled = true; }
      }
    }
  };

  // Setup active authenticated session
  Store.data.currentUser = {
    id: 'google-sub-88',
    name: 'María Augusta',
    email: 'maria@vault.ec',
    authProvider: 'google'
  };
  Store.saveUserSession();
  assert.ok(localStorage.getItem('gstcg_user') !== null);

  // Update navbar to reflect logged-in state
  const navLabel = doc.getElementById('nav-user-label');
  app.updateNavbarUserUI();
  assert.equal(navLabel.innerText, 'María');

  // View is currently #profile
  Store.data.currentView = 'profile';

  // Execute logoutUser
  app.logoutUser();

  // Invariant 1: google.accounts.id.disableAutoSelect was called
  assert.equal(autoSelectDisabled, true, 'google.accounts.id.disableAutoSelect must be called on logout');

  // Invariant 2: Store.data.currentUser cleared
  assert.equal(Store.data.currentUser, null, 'currentUser must be set to null');

  // Invariant 3: localStorage purged
  assert.equal(localStorage.getItem('gstcg_user'), null, 'gstcg_user must be purged from localStorage');

  // Invariant 4: Navbar reset to guest label
  assert.equal(navLabel.innerText, 'Mi Cuenta', 'Navbar label must revert to Mi Cuenta');

  // Invariant 5: Profile view resets to unauthenticated guest state
  const appView = doc.getElementById('app-view');
  assert.ok(
    appView.innerHTML.includes('google-signin-container') || ProfileView.render().includes('google-signin-container'),
    'Profile view must reset to unauthenticated guest state with google-signin-container'
  );
});
