/**
 * ==============================================================================
 * ADVERSARIAL CHALLENGER TEST SUITE: MILESTONE 2 (R1 & R2)
 * File: tests/test_challenger_m2_r1_r2.test.mjs
 * 
 * Empirical verification, boundary stress tests, and attack harnesses for:
 *   - R1: Live tracking simulation progression (~2s automated timer) and
 *         delivery differentiation (pickup vs courier, Bóveda Quito card,
 *         suppression of truck graphics, timer cancellation on route change).
 *   - R2: Universal Google Sign-In containers (#auth login/register, checkout),
 *         JWT decoding fuzzing with hostile payloads, GIS dual-mode fallback,
 *         session state Store.data.currentUser updates, navbar reactivity,
 *         and clean sign-out protocol.
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

// Factory for mock DOM elements
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
    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
    Buffer: Buffer,
    URLSearchParams: URLSearchParams,
    document: documentMock,
    window: null,
    globalThis: null,
    localStorage: localStorageMock,
    location: { hash: '#home' },
    scrollTo: () => {},
    lucide: { createIcons: () => {} },
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

// Helper to construct valid mock Google JWT tokens
function createMockGoogleJwt(payloadObject) {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'mock-google-key' };
  const encodeB64Url = (obj) => {
    const json = JSON.stringify(obj);
    const b64 = Buffer.from(json, 'utf8').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  return `${encodeB64Url(header)}.${encodeB64Url(payloadObject)}.mock_signature_bytes`;
}

// ==============================================================================
// SUITE 1: Requirement R1 - Live Tracking Simulation Progression & Timer Lifecycle
// ==============================================================================

test('R1 Adversarial [1.1]: Accelerated ~2s simulation timer advances Stage 2 to completed and activates Stage 3', async () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const testOrder = {
    orderId: '#ADV-R1-001',
    numero_orden: '#ADV-R1-001',
    metodo_entrega: 'courier',
    currentStageIndex: 1,
    stages: [
      { title: '1. Orden Recibida', status: 'completed', date: '02 Nov, 08:30' },
      { title: '2. Autenticación PSA', status: 'active', date: '02 Nov, 09:15' },
      { title: '3. Despacho Blindado', status: 'pending', date: '03 Nov, 10:00 (Est.)' },
      { title: '4. En Reparto', status: 'pending', date: '04 Nov, 14:00 (Est.)' }
    ]
  };

  Store.data.orders = [testOrder];
  Store.data.activeTrackingOrderId = testOrder.orderId;

  // Mount tracking view and trigger afterRender lifecycle
  TrackingView.afterRender();

  assert.ok(TrackingView._simulationTimer !== null, 'TrackingView must register an active _simulationTimer');
  assert.equal(testOrder.stages[1].status, 'active', 'Stage 2 must initially be active');
  assert.equal(testOrder.stages[2].status, 'pending', 'Stage 3 must initially be pending');

  // Await exactly 2.15 seconds to simulate automated progression
  await new Promise(r => setTimeout(r, 2150));

  assert.equal(testOrder.stages[1].status, 'completed', 'Stage 2 must transition to completed after ~2s');
  assert.equal(testOrder.stages[2].status, 'active', 'Stage 3 must transition to active after ~2s');
  assert.equal(testOrder.currentStageIndex, 2, 'currentStageIndex must advance to 2');
  assert.equal(testOrder.status, 'En Camino / Despacho Blindado', 'Status string must reflect active courier transit');

  TrackingView.clearSimulationTimer();
});

test('R1 Adversarial [1.2]: DOM updating renders checkmark ✓ for completed Stage 2 and active package icon for Stage 3', async () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const order = {
    orderId: '#ADV-R1-DOM',
    numero_orden: '#ADV-R1-DOM',
    metodo_entrega: 'pickup',
    stages: [
      { title: '1. Orden Recibida', status: 'completed' },
      { title: '2. En Preparación', status: 'completed' },
      { title: '3. Listo para Retiro en Bóveda', status: 'active' },
      { title: '4. Retirado en Bóveda', status: 'pending' }
    ]
  };

  const html = TrackingView.renderTimelineStages(order.stages);

  // Stage 1 & 2 are completed -> must render data-lucide="check"
  const checkMatches = (html.match(/data-lucide="check"/g) || []).length;
  assert.equal(checkMatches, 2, 'Completed stages 1 and 2 must both display checkmark icon');

  // Stage 3 is active -> must render data-lucide="package" with pulsating animation
  assert.ok(html.includes('data-lucide="package"'), 'Active Stage 3 must display package icon');
  assert.ok(html.includes('animate-pulse'), 'Active Stage 3 must have animate-pulse styling');
});

test('R1 Adversarial [1.3]: Timer cancellation on route change prevents memory leaks and zombie updates', async () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store, app } = sandbox;

  const order = {
    orderId: '#ADV-R1-LEAK-CHECK',
    numero_orden: '#ADV-R1-LEAK-CHECK',
    metodo_entrega: 'courier',
    currentStageIndex: 1,
    stages: [
      { title: '1. Recibida', status: 'completed' },
      { title: '2. Preparando', status: 'active' },
      { title: '3. Despacho', status: 'pending' },
      { title: '4. Entrega', status: 'pending' }
    ]
  };

  Store.data.orders = [order];
  Store.data.activeTrackingOrderId = order.orderId;

  // Mount tracking view and start simulation timer
  TrackingView.afterRender();
  assert.ok(TrackingView._simulationTimer !== null, 'Timer must be active initially');

  // User immediately navigates away to #catalog before timer expires (at ~100ms)
  await new Promise(r => setTimeout(r, 100));
  sandbox.location.hash = '#catalog';
  app.handleRoute();

  // Assert timer was cleaned up immediately by router
  assert.equal(TrackingView._simulationTimer, null, 'Router handleRoute must immediately clear _simulationTimer');

  // Wait 2.2 seconds to confirm timer does NOT fire in background
  await new Promise(r => setTimeout(r, 2200));

  // Stage 2 must still be active and Stage 3 pending (no zombie progression)
  assert.equal(order.stages[1].status, 'active', 'Stage 2 must not be modified after route cancellation');
  assert.equal(order.stages[2].status, 'pending', 'Stage 3 must remain pending');
});

test('R1 Adversarial [1.4]: Idempotent and boundary timer handling (double-init, already completed, missing stages)', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  // Case A: Consecutive calls to clearSimulationTimer must never throw
  assert.doesNotThrow(() => {
    for (let i = 0; i < 25; i++) {
      TrackingView.clearSimulationTimer();
    }
  }, 'Consecutive clearSimulationTimer calls must be idempotent and safe');

  // Case B: Order with Stage 2 already completed does NOT schedule new timer
  const completedOrder = {
    orderId: '#ADV-COMPLETED',
    stages: [
      { title: '1', status: 'completed' },
      { title: '2', status: 'completed' },
      { title: '3', status: 'active' }
    ]
  };
  Store.data.orders = [completedOrder];
  Store.data.activeTrackingOrderId = completedOrder.orderId;

  TrackingView.initSimulationTimer();
  assert.equal(TrackingView._simulationTimer, null, 'Must NOT set timer if Stage 2 is already completed');

  // Case C: Malformed order with empty or null stages
  const brokenOrder = { orderId: '#ADV-BROKEN', stages: [] };
  Store.data.orders = [brokenOrder];
  Store.data.activeTrackingOrderId = brokenOrder.orderId;

  assert.doesNotThrow(() => {
    TrackingView.initSimulationTimer();
  }, 'initSimulationTimer must handle empty stages array gracefully');
  assert.equal(TrackingView._simulationTimer, null);

  // Case D: Rapid consecutive afterRender calls cancel prior timers cleanly
  const normalOrder = {
    orderId: '#ADV-RAPID',
    stages: [
      { title: '1', status: 'completed' },
      { title: '2', status: 'active' },
      { title: '3', status: 'pending' }
    ]
  };
  Store.data.orders = [normalOrder];
  Store.data.activeTrackingOrderId = normalOrder.orderId;

  for (let i = 0; i < 5; i++) {
    TrackingView.afterRender();
  }
  assert.ok(TrackingView._simulationTimer !== null);
  TrackingView.clearSimulationTimer();
  assert.equal(TrackingView._simulationTimer, null);
});

// ==============================================================================
// SUITE 2: Requirement R1 - Delivery Differentiation (Pickup vs Home Courier)
// ==============================================================================

test('R1 Adversarial [2.1]: Pickup orders NEVER display truck icon or transit road animations', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const pickupOrder = {
    orderId: '#GS-PICKUP-STRICT',
    numero_orden: '#GS-PICKUP-STRICT',
    metodo_entrega: 'pickup',
    buyerName: 'Carlos Mendoza',
    buyerEmail: 'carlos@bovedatcg.ec',
    subtotal: 50.00,
    shipping: 0.00,
    tax: 7.50,
    total: 57.50,
    stages: TrackingView.getDefaultStages({ metodo_entrega: 'pickup' })
  };

  Store.data.orders = [pickupOrder];
  Store.data.activeTrackingOrderId = pickupOrder.orderId;

  const html = TrackingView.render();
  const transitSection = TrackingView.renderPickupCard(pickupOrder);

  // Strict check on pickup transit section: NO TRUCK ICONS
  assert.ok(!transitSection.includes('data-lucide="truck"'), 'renderPickupCard MUST NOT contain data-lucide="truck"');
  assert.ok(!transitSection.includes('Transporte Blindado'), 'renderPickupCard MUST NOT contain Transporte Blindado');
  assert.ok(!transitSection.includes('animate-ping'), 'renderPickupCard MUST NOT contain route animation (animate-ping)');
  assert.ok(!transitSection.includes('En Ruta de Entrega'), 'renderPickupCard MUST NOT contain road route graphics');

  // In full page render: header must render shield-check, not truck
  assert.ok(html.includes('data-lucide="shield-check"'), 'Header badge must render shield-check for pickup');
  assert.ok(html.includes('Código de Retiro: RET-'), 'Must display collection code rather than shipping guide');
});

test('R1 Adversarial [2.2]: Pickup orders DO display complete Bóveda Quito collection card with address, schedule and Cédula', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView } = sandbox;

  const pickupOrder = {
    orderId: '#GS-BOVEDA-VERIFY',
    buyerName: 'Valeria Cisneros',
    metodo_entrega: 'pickup'
  };

  const cardHtml = TrackingView.renderPickupCard(pickupOrder);

  // 1. Title and badge
  assert.ok(cardHtml.includes('Retiro Seguro en Bóveda Central Quito'), 'Must include vault security badge');
  assert.ok(cardHtml.includes('Listo para retiro presencial en Bóveda'), 'Must include readiness title');

  // 2. Exact address
  assert.ok(cardHtml.includes('Av. República del Salvador N34-183 y Moscú'), 'Must display exact street address');
  assert.ok(cardHtml.includes('Edificio Bóveda Central, Piso 2, Quito'), 'Must display building and floor');

  // 3. Opening hours
  assert.ok(cardHtml.includes('Lunes a Sábado: 09:00 - 18:00'), 'Must display exact operating schedule (09:00 - 18:00)');

  // 4. Identity requirement and buyer reference
  assert.ok(cardHtml.includes('Cédula de Identidad original'), 'Must explicitly require original Cédula');
  assert.ok(cardHtml.includes('Valeria Cisneros'), 'Must reference registered buyer name in custody clause');
});

test('R1 Adversarial [2.3]: Home courier orders DO display specialized armored transport in active transit', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  const courierOrder = {
    orderId: '#GS-COURIER-VERIFY',
    metodo_entrega: 'courier',
    courierName: 'Servientrega Blindado • Bóveda G&S',
    trackingNumber: 'GUI-EC-948102-PSA',
    buyerName: 'Andrés Morales',
    stages: TrackingView.getDefaultStages({ metodo_entrega: 'courier' })
  };

  Store.data.orders = [courierOrder];
  Store.data.activeTrackingOrderId = courierOrder.orderId;

  const html = TrackingView.render();
  const cardHtml = TrackingView.renderArmoredTransitCard(courierOrder);

  // Must render armored truck icon with pulse animation
  assert.ok(cardHtml.includes('data-lucide="truck"'), 'Armored transit card must render truck icon');
  assert.ok(cardHtml.includes('animate-pulse'), 'Truck icon must have pulse animation');
  assert.ok(cardHtml.includes('Transporte Blindado Especializado en Tránsito'), 'Must render armored courier header');

  // Route animation and GPS telemetry
  assert.ok(cardHtml.includes('animate-ping'), 'Must render animated transit beacon (animate-ping)');
  assert.ok(cardHtml.includes('En Ruta de Entrega'), 'Must show en route status');
  assert.ok(cardHtml.includes('GPS Activo • Valija Nivel IV'), 'Must display active GPS and Level IV security tag');

  // Header guide
  assert.ok(html.includes('Guía: GUI-EC-948102-PSA'), 'Header must display tracking guide code');
});

test('R1 Adversarial [2.4]: Delivery mode detection resilience (pickup vs quito vs courier, casing, and deliveryMethod fallback)', () => {
  const { sandbox } = createTestRuntime();
  const { TrackingView, Store } = sandbox;

  // Case A: metodo_entrega === 'pickup' -> pickup
  const orderA = { orderId: '#A', metodo_entrega: 'pickup' };
  Store.data.orders = [orderA];
  Store.data.activeTrackingOrderId = '#A';
  assert.ok(!TrackingView.render().includes('Transporte Blindado Especializado'));

  // Case B: deliveryMethod regex match for 'retiro' even if metodo_entrega is undefined
  const orderB = { orderId: '#B', deliveryMethod: 'Retiro en Tienda / Bóveda Central' };
  Store.data.orders = [orderB];
  Store.data.activeTrackingOrderId = '#B';
  const htmlB = TrackingView.render();
  assert.ok(htmlB.includes('Listo para retiro presencial en Bóveda'));
  assert.ok(!htmlB.includes('Transporte Blindado Especializado'));

  // Case C: metodo_entrega === 'quito' (Local Express) -> counts as home delivery (not pickup)
  const orderC = { orderId: '#C', metodo_entrega: 'quito', deliveryMethod: 'Local Express (Quito)' };
  Store.data.orders = [orderC];
  Store.data.activeTrackingOrderId = '#C';
  const htmlC = TrackingView.render();
  assert.ok(htmlC.includes('Transporte Blindado Especializado en Tránsito'), 'Local Express Quito is home delivery and must show transport');
});

// ==============================================================================
// SUITE 3: Requirement R2 - Universal Google Sign-In Containers & Dual-Mode GIS
// ==============================================================================

test('R2 Adversarial [3.1]: Universal Google Sign-In containers present in #auth Login, Register, and Checkout', () => {
  const { sandbox } = createTestRuntime();
  const { CheckoutView, Store } = sandbox;

  // 1. #auth Login tab
  const loginHtml = CheckoutView.renderAuth('login');
  assert.ok(loginHtml.includes('id="google-signin-container-auth-login"'), 'Must contain container in #auth login tab');

  // 2. #auth Register tab
  const registerHtml = CheckoutView.renderAuth('register');
  assert.ok(registerHtml.includes('id="google-signin-container-auth-register"'), 'Must contain container in #auth register tab');

  // 3. Checkout guest sidebar
  Store.data.currentUser = null;
  const checkoutGuestHtml = CheckoutView.renderCheckout();
  assert.ok(checkoutGuestHtml.includes('id="google-signin-container-checkout"'), 'Must contain container in Checkout guest sidebar');

  // 4. Checkout authenticated mode: guest quick login and Google button are replaced by active session badge
  Store.data.currentUser = { id: 'usr-1', name: 'Ana Coleccionista', email: 'ana@tcg.ec' };
  const checkoutAuthHtml = CheckoutView.renderCheckout();
  assert.ok(!checkoutAuthHtml.includes('id="google-signin-container-checkout"'), 'Authenticated checkout must not show Google login container');
  assert.ok(checkoutAuthHtml.includes('Sesión Activa'), 'Authenticated checkout must show active session title');
  assert.ok(checkoutAuthHtml.includes('Ana Coleccionista'), 'Authenticated checkout must display user name');
});

test('R2 Adversarial [3.2]: Dual-mode GIS initialization mounts Material Design fallback button when Client ID is unconfigured', () => {
  const { sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Unconfigured client ID placeholder
  sandbox.APP_CONFIG = { GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com' };

  const container = sandbox.document.getElementById('test-google-mount');
  app.initGoogleSignIn('test-google-mount');

  // Must mount fallback button
  assert.ok(container.innerHTML.includes('id="btn-google-fallback"'), 'Must render fallback button');
  assert.ok(container.innerHTML.includes('Continuar con Google'), 'Fallback button must have standard Google text');
  assert.ok(container.innerHTML.includes('app.handleSimulatedGoogleLogin()'), 'Fallback button must bind to simulated login handler');
  
  // Must render 4-color Google logo paths
  assert.ok(container.innerHTML.includes('#4285F4'), 'Must render Google Blue SVG path');
  assert.ok(container.innerHTML.includes('#34A853'), 'Must render Google Green SVG path');
  assert.ok(container.innerHTML.includes('#FBBC05'), 'Must render Google Yellow SVG path');
  assert.ok(container.innerHTML.includes('#EA4335'), 'Must render Google Red SVG path');
});

test('R2 Adversarial [3.3]: Dual-mode GIS initialization mounts official GIS button when Client ID is configured', () => {
  const { context, sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Configured valid Client ID in VM context
  vm.runInContext("APP_CONFIG.GOOGLE_CLIENT_ID = '987654321-prodclient.apps.googleusercontent.com';", context);

  let initializedWith = null;
  let renderedInto = null;

  sandbox.window.google = {
    accounts: {
      id: {
        initialize: (cfg) => { initializedWith = cfg; },
        renderButton: (el, opts) => { renderedInto = { el, opts }; }
      }
    }
  };

  const container = sandbox.document.getElementById('test-google-gis');
  app.initGoogleSignIn('test-google-gis');

  assert.ok(initializedWith !== null, 'google.accounts.id.initialize must be called');
  assert.equal(initializedWith.client_id, '987654321-prodclient.apps.googleusercontent.com');
  assert.ok(renderedInto !== null, 'google.accounts.id.renderButton must be called');
  assert.equal(renderedInto.opts.type, 'standard');
  assert.equal(renderedInto.opts.theme, 'filled_black');
});

test('R2 Adversarial [3.4]: Resilience against nonexistent container ID and GIS SDK errors', () => {
  const { context, sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Null element lookup simulation
  const originalGetById = sandbox.document.getElementById;
  sandbox.document.getElementById = (id) => (id === 'missing-container' ? null : originalGetById(id));

  assert.doesNotThrow(() => {
    app.initGoogleSignIn('missing-container');
  }, 'Nonexistent container must exit safely without error');

  // GIS SDK throws an unexpected exception during initialize -> must catch and mount fallback
  vm.runInContext("APP_CONFIG.GOOGLE_CLIENT_ID = '987654321-prodclient.apps.googleusercontent.com';", context);
  sandbox.window.google = {
    accounts: {
      id: {
        initialize: () => { throw new Error('Simulated GIS SDK Network Failure'); },
        renderButton: () => {}
      }
    }
  };

  const errContainer = originalGetById('test-gis-error');
  app.initGoogleSignIn('test-gis-error');

  assert.ok(errContainer.innerHTML.includes('id="btn-google-fallback"'), 'GIS error must trigger graceful fallback button mounting');
});

// ==============================================================================
// SUITE 4: Requirement R2 - JWT Decoding Fuzzing & Malformed Payload Stress
// ==============================================================================

test('R2 Adversarial [4.1]: Fuzzing decodeJwtResponse with null, empty, non-string, and malformed inputs', () => {
  const { sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Boundary falsy and invalid types
  assert.equal(app.decodeJwtResponse(null), null);
  assert.equal(app.decodeJwtResponse(undefined), null);
  assert.equal(app.decodeJwtResponse(''), null);
  assert.equal(app.decodeJwtResponse(12345), null);
  assert.equal(app.decodeJwtResponse({}), null);
  assert.equal(app.decodeJwtResponse(true), null);

  // Single part or missing payload
  assert.equal(app.decodeJwtResponse('notajwttoken'), null);
  assert.equal(app.decodeJwtResponse('headeronly'), null);
  assert.equal(app.decodeJwtResponse('.'), null);
  assert.equal(app.decodeJwtResponse('header.'), null);

  // Invalid base64 characters
  assert.equal(app.decodeJwtResponse('header.!!!invalid-base64!!!.sig'), null);
  assert.equal(app.decodeJwtResponse('header.@@@###$$$.sig'), null);

  // Valid base64 but invalid JSON string
  const notJsonB64 = Buffer.from('hello plain text not json').toString('base64');
  assert.equal(app.decodeJwtResponse(`header.${notJsonB64}.sig`), null);
});

test('R2 Adversarial [4.2]: decodeJwtResponse accurately parses Base64Url replacements (- and _) and multi-part tokens', () => {
  const { sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Payload containing characters that produce Base64Url '-' and '_'
  const testPayload = {
    sub: '109283746591029384756',
    name: 'Roberto Gómez-Bolaños',
    email: 'roberto_gomez@bovedatcg.ec',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocK_xyz-123=s96-c',
    email_verified: true
  };

  const jwt = createMockGoogleJwt(testPayload);
  const decoded = app.decodeJwtResponse(jwt);

  assert.ok(decoded !== null, 'JWT with Base64Url characters must decode successfully');
  assert.equal(decoded.sub, testPayload.sub);
  assert.equal(decoded.name, 'Roberto Gómez-Bolaños');
  assert.equal(decoded.email, 'roberto_gomez@bovedatcg.ec');
  assert.equal(decoded.picture, testPayload.picture);
});

test('R2 Adversarial [4.3]: decodeJwtResponse handles exotic UTF-8 accents, Asian scripts, and emojis without URIError', () => {
  const { sandbox } = createTestRuntime();
  const { app } = sandbox;

  const complexPayload = {
    sub: 'google-complex-user',
    name: 'José María Peña & サトシ • 🛡️⚡ Pokémon Master',
    email: 'jose.peña@bovedatcg.ec',
    picture: 'https://images.unsplash.com/avatar-emoji-👑.jpg'
  };

  const jwt = createMockGoogleJwt(complexPayload);
  const decoded = app.decodeJwtResponse(jwt);

  assert.ok(decoded !== null, 'UTF-8 multi-byte payload must decode cleanly');
  assert.equal(decoded.name, 'José María Peña & サトシ • 🛡️⚡ Pokémon Master');
  assert.equal(decoded.email, 'jose.peña@bovedatcg.ec');
  assert.equal(decoded.picture, 'https://images.unsplash.com/avatar-emoji-👑.jpg');
});

test('R2 Adversarial [4.4]: decodeJwtResponse resistance to SQL/XSS injections and large payload stress', () => {
  const { sandbox } = createTestRuntime();
  const { app } = sandbox;

  // Injection vectors in payload
  const injectionPayload = {
    sub: "google-inject' OR 1=1 --",
    name: "<script>alert('xss')</script>",
    email: 'hacker@safe.ec',
    role: "admin' --"
  };

  const jwt = createMockGoogleJwt(injectionPayload);
  const decoded = app.decodeJwtResponse(jwt);

  assert.ok(decoded !== null);
  assert.equal(decoded.name, "<script>alert('xss')</script>");
  assert.equal(decoded.sub, "google-inject' OR 1=1 --");

  // Stress test: 50 KB nested payload
  const largeArray = Array.from({ length: 500 }, (_, i) => ({ id: i, label: `Card Collection Item #${i} with metadata padding` }));
  const largePayload = { sub: 'large-user', email: 'large@tcg.ec', cards: largeArray };
  const largeJwt = createMockGoogleJwt(largePayload);

  const start = performance.now();
  const largeDecoded = app.decodeJwtResponse(largeJwt);
  const elapsed = performance.now() - start;

  assert.ok(largeDecoded !== null);
  assert.equal(largeDecoded.cards.length, 500);
  assert.ok(elapsed < 100, `Large payload decoding should take < 100ms, took ${elapsed.toFixed(2)}ms`);
});

// ==============================================================================
// SUITE 5: Requirement R2 - Session State, Navbar Reactivity, and Sign-Out
// ==============================================================================

test('R2 Adversarial [5.1]: Simulated Google login updates Store.data.currentUser with pristine empty ID card and updates navbar', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  Store.data.currentUser = null;
  assert.equal(Store.data.currentUser, null);

  app.handleSimulatedGoogleLogin();

  const user = Store.data.currentUser;
  assert.ok(user !== null, 'currentUser must be set');
  assert.equal(user.authProvider, 'google');
  assert.equal(user.name, 'Patrick Mora');
  assert.equal(user.email, 'patrickmora2006@gmail.com');
  
  // Strict check on ID card: must be empty string (no hardcoded default Cédula!)
  assert.equal(user.idCard, '', 'Google login must leave idCard empty for user input');
  assert.equal(user.phone, '');
  assert.equal(user.city, '');
  assert.equal(user.address, '');

  // Navbar reactivity
  const navLabel = sandbox.document.getElementById('nav-user-label');
  assert.equal(navLabel.innerText, 'Patrick', 'Navbar must display user first name');

  const navBtn = sandbox.document.getElementById('btn-nav-account');
  assert.ok(navBtn.classList.contains('border-[#D97706]'), 'Navbar button must receive active amber highlight');
});

test('R2 Adversarial [5.2]: Real Google credential response login establishes session and redirects from #auth to #profile', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  Store.data.currentUser = null;
  Store.data.currentView = 'auth';

  const payload = {
    sub: 'google-oauth2-998877665544',
    name: 'Carolina Dávila',
    email: 'carolina.davila@gmail.com',
    picture: 'https://lh3.googleusercontent.com/avatar-carolina.png'
  };

  const fakeJwt = createMockGoogleJwt(payload);
  app.handleGoogleCredentialResponse({ credential: fakeJwt });

  const user = Store.data.currentUser;
  assert.ok(user !== null);
  assert.equal(user.id, 'google-oauth2-998877665544');
  assert.equal(user.name, 'Carolina Dávila');
  assert.equal(user.email, 'carolina.davila@gmail.com');
  assert.equal(user.avatar, 'https://lh3.googleusercontent.com/avatar-carolina.png');
  assert.equal(user.authProvider, 'google');

  // Verify redirection to profile when logging in from auth view
  assert.equal(sandbox.location.hash, '#profile', 'Logging in from #auth must redirect to #profile');
});

test('R2 Adversarial [5.3]: Malformed credential response handles error gracefully without altering session', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  Store.data.currentUser = null;

  // Case A: Missing response object
  app.handleGoogleCredentialResponse(null);
  assert.equal(Store.data.currentUser, null, 'Session must remain null');

  // Case B: Response missing credential property
  app.handleGoogleCredentialResponse({});
  assert.equal(Store.data.currentUser, null);

  // Case C: Response with malformed token
  app.handleGoogleCredentialResponse({ credential: 'totally.invalid.token' });
  assert.equal(Store.data.currentUser, null);

  // Case D: Token missing email address
  const noEmailJwt = createMockGoogleJwt({ sub: 'no-email-user', name: 'No Email' });
  app.handleGoogleCredentialResponse({ credential: noEmailJwt });
  assert.equal(Store.data.currentUser, null);
});

test('R2 Adversarial [5.4]: Complete logout protocol resets session, navbar, and invokes GIS disableAutoSelect safely', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  let disabledAutoSelectCalled = false;
  sandbox.window.google = {
    accounts: {
      id: {
        disableAutoSelect: () => { disabledAutoSelectCalled = true; }
      }
    }
  };

  // Log user in
  app.handleSimulatedGoogleLogin();
  assert.ok(Store.data.currentUser !== null);

  const navLabel = sandbox.document.getElementById('nav-user-label');
  const navBtn = sandbox.document.getElementById('btn-nav-account');
  assert.equal(navLabel.innerText, 'Patrick');
  assert.ok(navBtn.classList.contains('border-[#D97706]'));

  // Execute logout
  app.logoutUser();

  // Assert session is null
  assert.equal(Store.data.currentUser, null, 'Store.data.currentUser must be null');

  // Assert navbar is restored to guest state
  assert.equal(navLabel.innerText, 'Mi Cuenta', 'Navbar label must revert to Mi Cuenta');
  assert.ok(!navBtn.classList.contains('border-[#D97706]'), 'Navbar active highlight must be removed');

  // Assert GIS disableAutoSelect was called
  assert.equal(disabledAutoSelectCalled, true, 'google.accounts.id.disableAutoSelect must be invoked');

  // Assert navigation reverts to #home
  assert.equal(sandbox.location.hash, '#home', 'Logout outside of profile view must route to #home');
});
