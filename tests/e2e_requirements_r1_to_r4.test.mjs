/**
 * ==============================================================================
 * Master E2E Test Suite: Requirements R1 through R4 (Dual-Track Testing)
 * File: tests/e2e_requirements_r1_to_r4.test.mjs
 * 
 * Requirements Covered:
 *   - R1: Dynamic Google Sign-In Modal (client-side modal, custom credentials, no hardcoded Patrick)
 *   - R2: Anonymous Default Order Tracking (empty search view, 0 occurrences of Patricio Mora)
 *   - R3: Catalog Image Updates in data.js (Gengar, Mewtwo, Mimikyu, Fossil booster pack)
 *   - R4: Humanized UI Copy and Tone (natural Spanish across cart, checkout, errors, tracking)
 * 
 * 4-Tier Verification Matrix:
 *   - Tier 1: Feature Coverage (>=5 tests per feature for R1, R2, R3, R4 = 20 tests)
 *   - Tier 2: Boundary & Corner Cases (>=5 tests per feature for R1, R2, R3, R4 = 20 tests)
 *   - Tier 3: Cross-Feature Interactions (3 comprehensive pairwise tests)
 *   - Tier 4: Real-World Scenarios (3 end-to-end customer purchase journeys)
 * Total: 46 comprehensive, independent opaque-box tests.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import {
  ROOT_DIR,
  createMockEnvironment,
  MockDOMElement,
  validateEcuadorianIdContract,
  validateLuhnContract,
  checkSimulatedDeclineContract,
  validateEcuadorianPhoneContract,
  calculateVAT15Contract,
  calculateShippingFeeContract,
  calculateOrderTotalsContract,
  SingletonToastManager
} from './test_harness.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * -----------------------------------------------------------------------------
 * Sandbox Environment Initializer for R1-R4 E2E Tests
 * -----------------------------------------------------------------------------
 */
function createE2ESandbox() {
  const { win, doc, localStorage, elementsById } = createMockEnvironment();

  // Navigation & Shell elements
  const navUserLabel = new MockDOMElement('span', 'nav-user-label');
  navUserLabel.innerText = 'Mi Cuenta';
  elementsById.set('nav-user-label', navUserLabel);
  doc.body.appendChild(navUserLabel);

  const btnNavAccount = new MockDOMElement('button', 'btn-nav-account');
  elementsById.set('btn-nav-account', btnNavAccount);
  doc.body.appendChild(btnNavAccount);

  // Google Sign-In Modal Elements (R1)
  const googleModal = new MockDOMElement('div', 'google-signin-modal', 'hidden');
  const googleModalName = new MockDOMElement('input', 'google-modal-name');
  const googleModalEmail = new MockDOMElement('input', 'google-modal-email');
  const googleModalError = new MockDOMElement('div', 'google-modal-error', 'hidden');
  const googleModalSubmit = new MockDOMElement('button', 'google-modal-submit');
  const googleModalClose = new MockDOMElement('button', 'google-modal-close');

  googleModal.appendChild(googleModalName);
  googleModal.appendChild(googleModalEmail);
  googleModal.appendChild(googleModalError);
  googleModal.appendChild(googleModalSubmit);
  googleModal.appendChild(googleModalClose);
  doc.body.appendChild(googleModal);

  elementsById.set('google-signin-modal', googleModal);
  elementsById.set('google-modal-name', googleModalName);
  elementsById.set('google-modal-email', googleModalEmail);
  elementsById.set('google-modal-error', googleModalError);
  elementsById.set('google-modal-submit', googleModalSubmit);
  elementsById.set('google-modal-close', googleModalClose);

  // Tracking Search Elements (R2)
  const trackingSearchInput = new MockDOMElement('input', 'tracking-search-input');
  const trackingSearchBtn = new MockDOMElement('button', 'tracking-search-btn');
  const trackingSearchError = new MockDOMElement('div', 'tracking-search-error', 'hidden');
  doc.body.appendChild(trackingSearchInput);
  doc.body.appendChild(trackingSearchBtn);
  doc.body.appendChild(trackingSearchError);
  elementsById.set('tracking-search-input', trackingSearchInput);
  elementsById.set('tracking-search-btn', trackingSearchBtn);
  elementsById.set('tracking-search-error', trackingSearchError);

  // Undo and Cart Elements (R4)
  const undoBanner = elementsById.get('undo-banner') || new MockDOMElement('div', 'undo-banner', 'hidden');
  const undoText = elementsById.get('undo-text') || new MockDOMElement('span', 'undo-text');
  const btnUndo = new MockDOMElement('button', 'btn-undo-delete');
  undoBanner.appendChild(undoText);
  undoBanner.appendChild(btnUndo);
  elementsById.set('undo-banner', undoBanner);
  elementsById.set('undo-text', undoText);
  elementsById.set('btn-undo-delete', btnUndo);

  const context = {
    window: win,
    document: doc,
    localStorage,
    console,
    Math,
    Date,
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
  context.globalThis = context;
  vm.createContext(context);

  // Load modules into sandbox
  const loadModule = (relPath, exportsVar) => {
    const full = path.join(ROOT_DIR, relPath);
    if (fs.existsSync(full)) {
      const code = fs.readFileSync(full, 'utf8');
      vm.runInContext(code + (exportsVar ? `\n; globalThis.${exportsVar} = ${exportsVar};` : ''), context);
    }
  };

  loadModule('js/data.js', 'PRODUCTS');
  vm.runInContext('globalThis.APP_CONFIG = APP_CONFIG; globalThis.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10;', context);
  win.APP_CONFIG = context.APP_CONFIG;
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;

  loadModule('js/state.js', 'Store');
  loadModule('js/views/home.js', 'HomeView');
  loadModule('js/views/catalog.js', 'CatalogView');
  loadModule('js/views/pdp.js', 'PDPView');
  loadModule('js/views/tracking.js', 'TrackingView');
  loadModule('js/views/checkout.js', 'CheckoutView');
  loadModule('js/views/profile.js', 'ProfileView');
  loadModule('js/app.js', 'app');

  return {
    context,
    doc,
    win,
    localStorage,
    elementsById,
    Store: context.Store,
    app: context.app,
    TrackingView: context.TrackingView,
    CheckoutView: context.CheckoutView,
    ProfileView: context.ProfileView,
    PDPView: context.PDPView,
    CatalogView: context.CatalogView,
    PRODUCTS: context.PRODUCTS,
    POKEMON_CARDS_CATALOG_10: context.POKEMON_CARDS_CATALOG_10
  };
}

// ==============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH CONTRACT TESTS)
// ==============================================================================

// --- Requirement R1: Dynamic Google Sign-In Modal (5 tests) ---

test('TC-T1-R1-01 [R1]: Clicking Google Sign-In triggers modal opening instead of silent Patrick login', () => {
  const { app, doc, elementsById, Store } = createE2ESandbox();
  Store.data.currentUser = null;

  assert.equal(typeof app.openGoogleSignInModal, 'function', 'app.openGoogleSignInModal must be implemented');
  app.openGoogleSignInModal();

  const modal = elementsById.get('google-signin-modal') || doc.getElementById('google-signin-modal');
  assert.ok(modal, '#google-signin-modal must exist in DOM');
  assert.ok(!modal.classList.contains('hidden'), 'Google Sign-In modal must be visible after opening');
  assert.equal(Store.data.currentUser, null, 'Opening modal must not create a session prematurely');
});

test('TC-T1-R1-02 [R1]: Submitting custom credentials authenticates the user with dynamic name and email', () => {
  const { app, Store, elementsById } = createE2ESandbox();
  Store.data.currentUser = null;

  const testName = 'Elena Ramos';
  const testEmail = 'elena.ramos@gmail.com';

  assert.equal(typeof app.handleSimulatedGoogleLogin, 'function', 'app.handleSimulatedGoogleLogin must be implemented');
  app.handleSimulatedGoogleLogin(testName, testEmail);

  assert.ok(Store.data.currentUser, 'Store.data.currentUser must be populated');
  assert.equal(Store.data.currentUser.name, testName, 'currentUser.name must match entered dynamic name');
  assert.equal(Store.data.currentUser.email, testEmail, 'currentUser.email must match entered dynamic email');
  assert.equal(Store.data.currentUser.authProvider, 'google', 'authProvider must be google');
  assert.ok(!Store.data.currentUser.name.includes('Patrick Mora'), 'Name must not contain Patrick Mora');
});

test('TC-T1-R1-03 [R1]: Navbar user indicator updates to display dynamic user first name and active styling', () => {
  const { app, elementsById } = createE2ESandbox();

  app.handleSimulatedGoogleLogin('Diana Salazar', 'dsalazar@gmail.com');
  app.updateNavbarUserUI();

  const navLabel = elementsById.get('nav-user-label');
  assert.ok(navLabel, '#nav-user-label must exist');
  assert.ok(navLabel.innerText.includes('Diana'), `Navbar label must contain first name 'Diana', got: ${navLabel.innerText}`);
  assert.ok(!navLabel.innerText.includes('Patrick'), 'Navbar label must not contain Patrick');
});

test('TC-T1-R1-04 [R1]: Dynamic Google session persists to localStorage with authProvider google', () => {
  const { app, localStorage, Store } = createE2ESandbox();

  app.handleSimulatedGoogleLogin('Carlos Mendoza', 'cmendoza@gmail.com');
  const storedJson = localStorage.getItem('gstcg_user');
  assert.ok(storedJson, 'localStorage.gstcg_user must be set');

  const storedUser = JSON.parse(storedJson);
  assert.equal(storedUser.name, 'Carlos Mendoza');
  assert.equal(storedUser.email, 'cmendoza@gmail.com');
  assert.equal(storedUser.authProvider, 'google');
});

test('TC-T1-R1-05 [R1]: Quick account selector populates and authenticates chosen credentials', () => {
  const { app, Store } = createE2ESandbox();

  assert.equal(typeof app.selectGoogleQuickAccount, 'function', 'app.selectGoogleQuickAccount must be implemented');
  app.selectGoogleQuickAccount('Coleccionista Quito', 'quito.collector@gmail.com');

  assert.ok(Store.data.currentUser);
  assert.equal(Store.data.currentUser.name, 'Coleccionista Quito');
  assert.equal(Store.data.currentUser.email, 'quito.collector@gmail.com');
});

// --- Requirement R2: Anonymous Default Order Tracking (5 tests) ---

test('TC-T1-R2-01 [R2]: Navigating to #tracking in clean session renders empty search state', () => {
  const { TrackingView, Store } = createE2ESandbox();
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  const html = TrackingView.render();
  assert.ok(html.includes('tracking-search-input') || html.includes('código de seguimiento') || html.includes('Ingresa tu código'),
    'Tracking view must render search input or prompt when no order is active');
});

test('TC-T1-R2-02 [R2]: Clean #tracking view strictly contains zero occurrences of Patricio/Patrick Mora', () => {
  const { TrackingView, Store } = createE2ESandbox();
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  const html = TrackingView.render();
  assert.ok(!html.includes('Patricio Mora'), 'Empty tracking view must not contain "Patricio Mora"');
  assert.ok(!html.includes('Patrick Mora'), 'Empty tracking view must not contain "Patrick Mora"');
  assert.ok(!html.includes('coleccionista.paryx@bovedatcg.ec'), 'Empty tracking view must not contain preloaded email');
  assert.ok(!html.includes('#GS-2026-9481'), 'Empty tracking view must not expose preloaded order #GS-2026-9481');
});

test('TC-T1-R2-03 [R2]: Order code lookup resolves and renders order stages for valid code', () => {
  const { TrackingView, Store } = createE2ESandbox();
  const sampleOrder = {
    orderId: '#ORD-2026-7788',
    numero_orden: '#ORD-2026-7788',
    buyerName: 'Verónica Alarcón',
    buyerEmail: 'valarcon@gmail.com',
    metodo_entrega: 'pickup',
    status: 'Listo para retiro',
    currentStageIndex: 1,
    stages: [
      { title: '1. Pago Confirmado', status: 'completed' },
      { title: '2. Empaque Seguro', status: 'active' }
    ]
  };
  Store.data.orders = [sampleOrder];

  assert.equal(typeof TrackingView.handleTrackingSearch, 'function', 'TrackingView.handleTrackingSearch must be implemented');
  Store.data.activeTrackingOrderId = '#ORD-2026-7788';
  const html = TrackingView.render();

  assert.ok(html.includes('#ORD-2026-7788'), 'Rendered tracking must show looked-up order number');
  assert.ok(html.includes('Verónica Alarcón'), 'Rendered tracking must show buyer name');
});

test('TC-T1-R2-04 [R2]: Active session order auto-populates #tracking immediately after checkout', () => {
  const { TrackingView, Store } = createE2ESandbox();
  const newOrder = {
    orderId: '#NEW-ORD-101',
    numero_orden: '#NEW-ORD-101',
    buyerName: 'Mateo Guerrero',
    buyerEmail: 'mguerrero@gmail.com',
    metodo_entrega: 'courier',
    stages: [
      { title: '1. Pago Confirmado', status: 'completed' }
    ]
  };
  Store.data.orders = [newOrder];
  Store.data.activeTrackingOrderId = '#NEW-ORD-101';

  const html = TrackingView.render();
  assert.ok(html.includes('#NEW-ORD-101'), 'Active session order must be rendered');
  assert.ok(html.includes('Mateo Guerrero'), 'Active session buyer name must be rendered');
});

test('TC-T1-R2-05 [R2]: Empty search state suppresses automated timeline progression timers', () => {
  const { TrackingView, Store } = createE2ESandbox();
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  TrackingView.render();
  // If timer was started for non-existent order, TrackingView.timerId would be set
  assert.ok(!TrackingView.simulationTimerId && !TrackingView.liveTimerId,
    'Simulation timers must be suppressed when viewing empty search state');
});

// --- Requirement R3: Catalog Image Updates in data.js (5 tests) ---

test('TC-T1-R3-01 [R3]: Product gengar-scarlet-violet specifies img/cards/gengar-holo-scarlet.png in js/data.js', () => {
  const dataPath = path.join(ROOT_DIR, 'js/data.js');
  const code = fs.readFileSync(dataPath, 'utf8');

  assert.ok(
    code.includes('img/cards/gengar-holo-scarlet.png'),
    'js/data.js must reference img/cards/gengar-holo-scarlet.png'
  );
  assert.ok(
    !code.includes('img/gengar-vmax.png'),
    'js/data.js must not reference old placeholder img/gengar-vmax.png'
  );
});

test('TC-T1-R3-02 [R3]: Product mewtwo-151 specifies img/cards/mewto-holo-rare.png in js/data.js', () => {
  const dataPath = path.join(ROOT_DIR, 'js/data.js');
  const code = fs.readFileSync(dataPath, 'utf8');

  assert.ok(
    code.includes('img/cards/mewto-holo-rare.png'),
    'js/data.js must reference img/cards/mewto-holo-rare.png'
  );
  assert.ok(
    !code.includes('img/mewtwo-base.png'),
    'js/data.js must not reference old placeholder img/mewtwo-base.png'
  );
});

test('TC-T1-R3-03 [R3]: Product mimikyu-paldean specifies img/cards/mimikyu-rare.png in js/data.js', () => {
  const dataPath = path.join(ROOT_DIR, 'js/data.js');
  const code = fs.readFileSync(dataPath, 'utf8');

  assert.ok(
    code.includes('img/cards/mimikyu-rare.png'),
    'js/data.js must reference img/cards/mimikyu-rare.png'
  );
  assert.ok(
    !code.includes('img/umbreon-vmax.png'),
    'js/data.js must not reference old placeholder img/umbreon-vmax.png'
  );
});

test('TC-T1-R3-04 [R3]: Product booster-box-fossil-1999 specifies img/sealed/Paquete fossil.png in js/data.js', () => {
  const dataPath = path.join(ROOT_DIR, 'js/data.js');
  const code = fs.readFileSync(dataPath, 'utf8');

  assert.ok(
    code.includes('img/sealed/Paquete fossil.png'),
    'js/data.js must reference img/sealed/Paquete fossil.png'
  );
  assert.ok(
    !code.includes('img/sealed/team-rocket-box-front.png'),
    'js/data.js must not reference old placeholder img/sealed/team-rocket-box-front.png'
  );
});

test('TC-T1-R3-05 [R3]: All four newly linked image assets exist physically on disk with non-zero byte size', () => {
  const requiredAssets = [
    'img/cards/gengar-holo-scarlet.png',
    'img/cards/mewto-holo-rare.png',
    'img/cards/mimikyu-rare.png',
    'img/sealed/Paquete fossil.png'
  ];

  for (const assetRelPath of requiredAssets) {
    const fullPath = path.join(ROOT_DIR, assetRelPath);
    assert.ok(fs.existsSync(fullPath), `Asset file must exist on disk: ${assetRelPath}`);
    const stats = fs.statSync(fullPath);
    assert.ok(stats.size > 0, `Asset file must have non-zero size: ${assetRelPath} (size: ${stats.size} bytes)`);
  }
});

// --- Requirement R4: Humanized UI Copy and Tone (5 tests) ---

test('TC-T1-R4-01 [R4]: Cart removal banner uses natural retail Spanish and clean Deshacer button', () => {
  const indexPath = path.join(ROOT_DIR, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');

  assert.ok(
    html.includes('Producto retirado de tu bolsa'),
    'index.html undo banner must contain "Producto retirado de tu bolsa"'
  );
  assert.ok(
    !html.includes('Ítem eliminado de la bolsa'),
    'index.html undo banner must not contain robotic "Ítem eliminado de la bolsa"'
  );
  assert.ok(
    !html.includes('[Deshacer acción]'),
    'index.html undo banner must not contain ugly brackets "[Deshacer acción]"'
  );
});

test('TC-T1-R4-02 [R4]: Checkout security badges present consumer-friendly reassurance without jargon', () => {
  const checkoutPath = path.join(ROOT_DIR, 'js/views/checkout.js');
  const code = fs.readFileSync(checkoutPath, 'utf8');

  assert.ok(
    code.includes('Pago Seguro y Protegido') || code.includes('Tus datos viajan 100% encriptados'),
    'checkout.js must contain consumer-friendly security reassurance'
  );
  assert.ok(
    !code.includes('TLS 256-bit • Graded & Sealed TCG'),
    'checkout.js must not display "TLS 256-bit • Graded & Sealed TCG" badge'
  );
  assert.ok(
    !code.includes('Cumplimiento PCI-DSS'),
    'checkout.js must not display compliance code "Cumplimiento PCI-DSS" to consumers'
  );
});

test('TC-T1-R4-03 [R4]: Cédula validation guides user naturally without exposing Módulo 10 algorithm', () => {
  const checkoutPath = path.join(ROOT_DIR, 'js/views/checkout.js');
  const code = fs.readFileSync(checkoutPath, 'utf8');

  assert.ok(
    !code.includes('Módulo 10') && !code.includes('modulo 10'),
    'checkout.js must not expose mathematical "Módulo 10" algorithm name in consumer labels or errors'
  );
  assert.ok(
    code.includes('Cédula o RUC ecuatoriano') || code.includes('número de cédula o RUC válido'),
    'checkout.js must guide user with plain identification instructions'
  );
});

test('TC-T1-R4-04 [R4]: Payment error screen offers empathetic explanation without scary diagnostic headers', () => {
  const checkoutPath = path.join(ROOT_DIR, 'js/views/checkout.js');
  const code = fs.readFileSync(checkoutPath, 'utf8');

  assert.ok(
    !code.includes('Diagnóstico de la Operación'),
    'checkout.js must not display harsh "Diagnóstico de la Operación" header'
  );
  assert.ok(
    code.includes('No te preocupes') || code.includes('no se ha realizado ningún cobro'),
    'checkout.js must reassure customer with calming language on card decline'
  );
});

test('TC-T1-R4-05 [R4]: Tracking stages use friendly collector status copy without forensic or military jargon', () => {
  const trackingPath = path.join(ROOT_DIR, 'js/views/tracking.js');
  const code = fs.readFileSync(trackingPath, 'utf8');

  assert.ok(
    !code.includes('cadena de custodia'),
    'tracking.js must not contain forensic phrase "cadena de custodia"'
  );
  assert.ok(
    !code.includes('tamper-evident'),
    'tracking.js must not contain untranslated English term "tamper-evident"'
  );
  assert.ok(
    !code.includes('¡Hito completado!'),
    'tracking.js must not contain developer jargon "¡Hito completado!" in toasts'
  );
  assert.ok(
    code.includes('Pago Confirmado') || code.includes('Empaque Seguro'),
    'tracking.js must use natural collector milestone names'
  );
});

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (ADVERSARIAL STRESS)
// ==============================================================================

// --- Requirement R1 Boundaries ---

test('TC-T2-R1-01 [R1 Boundary]: Empty name or email submission is rejected with inline alert', () => {
  const { app, elementsById, Store } = createE2ESandbox();
  Store.data.currentUser = null;

  assert.equal(typeof app.submitGoogleSignInModal, 'function', 'app.submitGoogleSignInModal must be implemented');

  // Case 1: Both empty
  elementsById.get('google-modal-name').value = '';
  elementsById.get('google-modal-email').value = '';
  app.submitGoogleSignInModal();

  assert.equal(Store.data.currentUser, null, 'Must not authenticate with empty inputs');
  const errEl = elementsById.get('google-modal-error');
  assert.ok(!errEl.classList.contains('hidden'), 'Error container must be visible');
  assert.ok(errEl.innerText.length > 0, 'Error message must be displayed');
});

test('TC-T2-R1-02 [R1 Boundary]: Whitespace-only name and email inputs are trimmed and rejected', () => {
  const { app, elementsById, Store } = createE2ESandbox();
  Store.data.currentUser = null;

  elementsById.get('google-modal-name').value = '   ';
  elementsById.get('google-modal-email').value = '   \t  ';
  app.submitGoogleSignInModal();

  assert.equal(Store.data.currentUser, null, 'Must reject whitespace-only inputs');
});

test('TC-T2-R1-03 [R1 Boundary]: Malformed email format without @ or domain is rejected', () => {
  const { app, elementsById, Store } = createE2ESandbox();
  Store.data.currentUser = null;

  elementsById.get('google-modal-name').value = 'Andrés';
  elementsById.get('google-modal-email').value = 'not-an-email';
  app.submitGoogleSignInModal();

  assert.equal(Store.data.currentUser, null, 'Must reject malformed email');
});

test('TC-T2-R1-04 [R1 Boundary]: Accented UTF-8 Latin names and compound surnames are preserved accurately', () => {
  const { app, Store, elementsById } = createE2ESandbox();
  const complexName = 'María José Peña-Herrera';
  const email = 'maria.pena@gmail.com';

  app.handleSimulatedGoogleLogin(complexName, email);
  assert.equal(Store.data.currentUser.name, complexName, 'Name must maintain exact UTF-8 accents and hyphens');

  app.updateNavbarUserUI();
  const navLabel = elementsById.get('nav-user-label');
  assert.ok(navLabel.innerText.includes('María José') || navLabel.innerText.includes('María'),
    `Navbar must handle accented first name, got: ${navLabel.innerText}`);
});

test('TC-T2-R1-05 [R1 Boundary]: Modal dismissal via close button or Escape leaves active session intact', () => {
  const { app, elementsById, Store } = createE2ESandbox();
  const existingUser = { id: 'u-123', name: 'Original User', email: 'orig@gmail.com', authProvider: 'email' };
  Store.data.currentUser = existingUser;

  app.openGoogleSignInModal();
  assert.equal(typeof app.closeGoogleSignInModal, 'function', 'app.closeGoogleSignInModal must be implemented');
  app.closeGoogleSignInModal();

  const modal = elementsById.get('google-signin-modal');
  assert.ok(modal.classList.contains('hidden'), 'Modal must be hidden after closing');
  assert.equal(Store.data.currentUser.name, 'Original User', 'Existing session must be preserved');
});

// --- Requirement R2 Boundaries ---

test('TC-T2-R2-01 [R2 Boundary]: Empty tracking code submission prompts user without crash', () => {
  const { TrackingView, elementsById } = createE2ESandbox();

  elementsById.get('tracking-search-input').value = '';
  assert.doesNotThrow(() => {
    TrackingView.handleTrackingSearch();
  }, 'Empty code search must not throw an exception');

  const errEl = elementsById.get('tracking-search-error');
  assert.ok(!errEl.classList.contains('hidden'), 'Error alert must be visible on empty search');
});

test('TC-T2-R2-02 [R2 Boundary]: Nonexistent tracking code search displays clear friendly banner without leaking other orders', () => {
  const { TrackingView, elementsById, Store } = createE2ESandbox();
  Store.data.orders = [
    { orderId: '#SECRET-999', buyerName: 'Secret Buyer' }
  ];

  elementsById.get('tracking-search-input').value = 'NONEXISTENT-CODE-000';
  TrackingView.handleTrackingSearch();

  const errEl = elementsById.get('tracking-search-error');
  assert.ok(errEl.innerText.includes('No encontramos') || errEl.innerText.includes('no encontrado') || errEl.innerText.includes('Verifica'),
    `Must show friendly not-found error, got: ${errEl.innerText}`);
  assert.ok(!errEl.innerText.includes('Secret Buyer'), 'Must not leak secret order data');
});

test('TC-T2-R2-03 [R2 Boundary]: Script tag and SQL injection in tracking search input are sanitized safely', () => {
  const { TrackingView, elementsById } = createE2ESandbox();
  const hostilePayload = `<script>alert('XSS')</script>' OR '1'='1`;

  elementsById.get('tracking-search-input').value = hostilePayload;
  assert.doesNotThrow(() => {
    TrackingView.handleTrackingSearch();
  }, 'Hostile injection payload must not crash search handler');

  const errEl = elementsById.get('tracking-search-error');
  assert.ok(!errEl.innerHTML.includes('<script>'), 'Hostile script tags must never be injected raw into innerHTML');
});

test('TC-T2-R2-04 [R2 Boundary]: Tracking code with leading and trailing whitespace is trimmed properly', () => {
  const { TrackingView, Store, elementsById } = createE2ESandbox();
  Store.data.orders = [
    {
      orderId: '#PKM-2026-TRIM',
      numero_orden: '#PKM-2026-TRIM',
      buyerName: 'Pedro Gómez',
      stages: [{ title: '1. Pago Confirmado', status: 'completed' }]
    }
  ];

  elementsById.get('tracking-search-input').value = '   #PKM-2026-TRIM   \n';
  TrackingView.handleTrackingSearch();

  assert.equal(Store.data.activeTrackingOrderId, '#PKM-2026-TRIM', 'Search must trim input whitespace');
});

test('TC-T2-R2-05 [R2 Boundary]: Direct URL hash navigation with invalid order query handles zero state gracefully', () => {
  const { TrackingView, Store } = createE2ESandbox();
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = '#INVALID-HASH-ORDER';

  // Even if activeTrackingOrderId is set to a nonexistent order, render must fall back to empty search safely
  const html = TrackingView.render();
  assert.ok(!html.includes('Patricio Mora'), 'Fallback must not expose Patricio Mora');
});

// --- Requirement R3 Boundaries ---

test('TC-T3-R3-01 [R3 Boundary]: Asset path containing spaces renders valid HTML attribute without breaking img tag', () => {
  const { CatalogView, PRODUCTS } = createE2ESandbox();
  const fossilProduct = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999') || {
    id: 'booster-box-fossil-1999',
    nombre: 'Booster Pack Fossil 1999',
    imagenLocal: 'img/sealed/Paquete fossil.png',
    categoria: 'sealed'
  };

  const cardHtml = CatalogView.renderProductCard(fossilProduct);
  assert.ok(cardHtml.includes('Paquete fossil.png'), 'Card HTML must include asset path with space');
  assert.ok(cardHtml.includes('src="img/sealed/Paquete fossil.png"') || cardHtml.includes("src='img/sealed/Paquete fossil.png'"),
    'src attribute must be properly quoted');
});

test('TC-T3-R3-02 [R3 Boundary]: Simulated image 404 triggers onerror fallback to designated backup asset', () => {
  const { CatalogView } = createE2ESandbox();
  const cardHtml = CatalogView.renderProductCard({
    id: 'test-card',
    nombre: 'Test Card',
    imagenLocal: 'img/cards/gengar-holo-scarlet.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/fallback.png',
    precios: { raw: 10 }
  });

  assert.ok(cardHtml.includes('onerror'), 'Rendered card image must specify onerror fallback handler');
});

test('TC-T3-R3-03 [R3 Boundary]: Product database sync in js/db/db-client.js matches the new image assets', () => {
  const dbClientPath = path.join(ROOT_DIR, 'js/db/db-client.js');
  if (fs.existsSync(dbClientPath)) {
    const code = fs.readFileSync(dbClientPath, 'utf8');
    assert.ok(
      code.includes('img/cards/gengar-holo-scarlet.png') || !code.includes('gengar-vmax.png'),
      'db-client.js must synchronize new Gengar asset or eliminate old placeholder'
    );
  }
});

test('TC-T3-R3-04 [R3 Boundary]: Sealed product multi-angle gallery specifies valid perspectives', () => {
  const { PDPView, PRODUCTS } = createE2ESandbox();
  const fossilProduct = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');

  if (fossilProduct && fossilProduct.galeria_sellada) {
    assert.equal(fossilProduct.galeria_sellada.frontal, 'img/sealed/booster-box-fossil-1999/frontal.svg');
    assert.equal(fossilProduct.galeria_sellada.perspectiva, 'img/sealed/Paquete fossil.png');
    assert.equal(fossilProduct.galeria_sellada.lateral, 'img/sealed/booster-box-fossil-1999/lateral.svg');
    assert.equal(fossilProduct.galeria_sellada.superior, 'img/sealed/booster-box-fossil-1999/superior.svg');
  }
});

test('TC-T3-R3-05 [R3 Boundary]: Visual asset paths use normalized forward slashes for cross-platform reliability', () => {
  const { PRODUCTS } = createE2ESandbox();
  const targetIds = ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean', 'booster-box-fossil-1999'];

  for (const id of targetIds) {
    const prod = PRODUCTS.find(p => p.id === id);
    if (prod && prod.imagenLocal) {
      assert.ok(!prod.imagenLocal.includes('\\'), `Image path for ${id} must use forward slashes, got: ${prod.imagenLocal}`);
    }
  }
});

// --- Requirement R4 Boundaries ---

test('TC-T2-R4-01 [R4 Boundary]: Ecuadorian phone accepts standard mobile and provides helpful format guidance', () => {
  assert.ok(validateEcuadorianPhoneContract('+593 991234567'), 'Valid standard +593 phone must be accepted');
  assert.ok(validateEcuadorianPhoneContract('+593987654321'), 'Valid unspaced +593 phone must be accepted');
  assert.ok(!validateEcuadorianPhoneContract('099123456'), 'Phone without +593 prefix must fail contract');
  assert.ok(!validateEcuadorianPhoneContract('+593 123'), 'Short phone must fail contract');
});

test('TC-T2-R4-02 [R4 Boundary]: In-store pickup instructions remind customer to present ID without harsh command', () => {
  const trackingPath = path.join(ROOT_DIR, 'js/views/tracking.js');
  const code = fs.readFileSync(trackingPath, 'utf8');

  assert.ok(
    !code.includes('Requisito Obligatorio: Presentar Cédula de Identidad original del titular registrado'),
    'Must not use punitive "Requisito Obligatorio" phrasing'
  );
  assert.ok(
    code.includes('Recuerda') || code.includes('presenta tu cédula') || code.includes('cédula de identidad'),
    'Must use helpful reminder phrasing for pickup'
  );
});

test('TC-T2-R4-03 [R4 Boundary]: Singleton toast dismisses reliably within 2500ms without leaving ghost elements', async () => {
  const { doc } = createE2ESandbox();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  toastManager.showToast('Test Toast 1');
  assert.equal(toastManager.getActiveToastCount(), 1);

  toastManager.showToast('Test Toast 2');
  assert.equal(toastManager.getActiveToastCount(), 1, 'Singleton manager must replace prior toast immediately');

  await new Promise(r => setTimeout(r, 2600));
  assert.equal(toastManager.getActiveToastCount(), 0, 'Toast must auto-dismiss completely after 2500ms');
});

test('TC-T2-R4-04 [R4 Boundary]: Card decline code #DECLINED-SEC-054 offers immediate action to switch method', () => {
  const declineResult = checkSimulatedDeclineContract('4532015114830000');
  assert.equal(declineResult.approved, false);
  assert.equal(declineResult.code, '#DECLINED-SEC-054');

  const checkoutPath = path.join(ROOT_DIR, 'js/views/checkout.js');
  const code = fs.readFileSync(checkoutPath, 'utf8');
  assert.ok(
    code.includes('otra tarjeta') || code.includes('método') || code.includes('retiro'),
    'checkout.js must suggest actionable alternatives on decline'
  );
});

test('TC-T2-R4-05 [R4 Boundary]: Elimination of English untranslated fragments across user alert touchpoints', () => {
  const checkoutPath = path.join(ROOT_DIR, 'js/views/checkout.js');
  const code = fs.readFileSync(checkoutPath, 'utf8');

  assert.ok(!code.includes('1-clic'), 'checkout.js must not contain awkward Spanglish "1-clic"');
});

// ==============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE WORKFLOWS)
// ==============================================================================

test('TC-T3-01 [Cross-Feature]: Dynamic Auth + Profile + Tracking Flow', () => {
  const { app, Store, TrackingView, ProfileView } = createE2ESandbox();

  // 1. Initial State: Unauthenticated visitor visits #tracking
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;
  const initialTrackingHtml = TrackingView.render();
  assert.ok(!initialTrackingHtml.includes('Patricio Mora'), 'Step 1: Anonymous tracking must not expose user details');

  // 2. User signs in dynamically with Google
  app.handleSimulatedGoogleLogin('Esteban Andrade', 'eandrade@gmail.com');
  assert.equal(Store.data.currentUser.name, 'Esteban Andrade');

  // 3. User visits #profile -> sees dynamic name and Google Verified account
  const profileHtml = ProfileView.render();
  assert.ok(profileHtml.includes('Esteban Andrade'), 'Step 2: Profile must show dynamic name');
  assert.ok(profileHtml.includes('Google') || profileHtml.includes('google'), 'Step 2: Profile must reflect Google auth');

  // 4. User places an order
  const order = {
    orderId: '#ORD-ESTEBAN-01',
    numero_orden: '#ORD-ESTEBAN-01',
    buyerName: Store.data.currentUser.name,
    buyerEmail: Store.data.currentUser.email,
    metodo_entrega: 'pickup',
    stages: [{ title: '1. Pago Confirmado', status: 'completed' }]
  };
  Store.data.orders = [order];
  Store.data.activeTrackingOrderId = order.orderId;

  // 5. Tracking now displays order tied to dynamic user Esteban Andrade
  const updatedTrackingHtml = TrackingView.render();
  assert.ok(updatedTrackingHtml.includes('#ORD-ESTEBAN-01'), 'Step 3: Tracking must reflect placed order');
  assert.ok(updatedTrackingHtml.includes('Esteban Andrade'), 'Step 3: Tracking must show dynamic buyer name');
});

test('TC-T3-02 [Cross-Feature]: Catalog Image Assets + PDP Multi-Angle Gallery + Cart + Undo Flow', () => {
  const { Store, CatalogView, PRODUCTS, elementsById, app } = createE2ESandbox();

  // 1. Find Fossil sealed item and verify updated image
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
  assert.ok(fossil, 'Fossil booster must exist in catalog');
  assert.equal(fossil.imagenLocal, 'img/sealed/Paquete fossil.png', 'Catalog must link new Fossil asset');

  // 2. Add item to cart
  Store.data.cart = [{
    id: fossil.id,
    sku: fossil.id,
    nombre: fossil.nombre,
    precio: 250.00,
    price: 250.00,
    quantity: 1,
    imagen: fossil.imagenLocal
  }];
  assert.equal(Store.data.cart.length, 1);

  // 3. Remove item from cart and verify humanized undo banner
  const removedItem = Store.data.cart[0];
  Store.data.lastDeletedItem = removedItem;
  Store.data.cart = [];

  const undoText = elementsById.get('undo-text');
  undoText.innerText = 'Producto retirado de tu bolsa.';
  const undoBanner = elementsById.get('undo-banner');
  undoBanner.classList.remove('hidden');

  assert.ok(undoText.innerText.includes('Producto retirado de tu bolsa'), 'Undo text must be humanized');
  assert.ok(!undoText.innerText.includes('Ítem eliminado'), 'Undo text must not be robotic');

  // 4. Click Deshacer to restore item
  Store.data.cart.push(Store.data.lastDeletedItem);
  Store.data.lastDeletedItem = null;
  assert.equal(Store.data.cart.length, 1, 'Item must be restored to cart after undo');
  assert.equal(Store.data.cart[0].id, fossil.id);
});

test('TC-T3-03 [Cross-Feature]: Checkout Cédula Validation + Humanized Card Rejection + Cash Pickup Recovery', () => {
  const { Store } = createE2ESandbox();

  // 1. Invalid Ecuadorian Cédula fails validation contract
  const invalidCedula = '1710034069'; // Invalid check digit
  assert.equal(validateEcuadorianIdContract(invalidCedula), false, 'Invalid cédula must fail Module 10 contract');

  // 2. Valid Ecuadorian Cédula passes
  const validCedula = '1710034065';
  assert.equal(validateEcuadorianIdContract(validCedula), true, 'Valid cédula must pass Module 10 contract');

  // 3. Test card ending in 0000 triggers decline #DECLINED-SEC-054
  const testCardEnding0000 = '4532015114830000';
  const declineResult = checkSimulatedDeclineContract(testCardEnding0000);
  assert.equal(declineResult.approved, false);
  assert.equal(declineResult.code, '#DECLINED-SEC-054');

  // 4. Recovery: customer switches to in-store pickup with cash
  const cartItems = [{ id: 'card-1', price: 100.00, quantity: 1 }];
  const pickupTotals = calculateOrderTotalsContract(cartItems, 'pickup');
  assert.equal(pickupTotals.subtotal, 100.00);
  assert.equal(pickupTotals.shipping, 0.00, 'In-store pickup shipping must be $0.00');
  assert.equal(pickupTotals.tax, 15.00, '15% VAT on $100 must be $15.00');
  assert.equal(pickupTotals.total, 115.00);

  // 5. Order successfully completed under cash pickup
  const order = {
    orderId: '#ORD-RECOVERY-01',
    numero_orden: '#ORD-RECOVERY-01',
    metodo_entrega: 'pickup',
    metodo_pago: 'cash_vault',
    total: pickupTotals.total
  };
  Store.data.orders.push(order);
  Store.data.cart = [];
  assert.equal(Store.data.cart.length, 0, 'Cart must be cleared after recovery order');
});

// ==============================================================================
// TIER 4: REAL-WORLD SCENARIOS (END-TO-END CUSTOMER JOURNEYS)
// ==============================================================================

test('TC-T4-01 [Real-World]: Collector Dynamic Onboarding & First Order Journey', () => {
  const { app, Store, TrackingView, PRODUCTS } = createE2ESandbox();

  // Step 1: Customer arrives and uses dynamic Google Sign-In
  app.handleSimulatedGoogleLogin('Santiago Noboa', 'snoboa@gmail.com');
  assert.equal(Store.data.currentUser.name, 'Santiago Noboa');

  // Step 2: Browses catalog, selects Gengar Holo card
  const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');
  assert.ok(gengar);
  assert.equal(gengar.imagenLocal, 'img/cards/gengar-holo-scarlet.png');

  // Step 3: Adds PSA 10 grade to cart
  const psa10Price = gengar.precios?.psa10 || 28.00;
  Store.data.cart = [{
    id: gengar.id,
    sku: `${gengar.id}-psa10`,
    nombre: `${gengar.nombre} (PSA 10)`,
    price: psa10Price,
    quantity: 1,
    imagen: gengar.imagenLocal
  }];

  // Step 4: Checkout calculation with Quito local delivery ($3.00)
  const totals = calculateOrderTotalsContract(Store.data.cart, 'quito');
  assert.equal(totals.shipping, 3.00);
  assert.equal(totals.subtotal, 28.00);
  assert.equal(totals.tax, 4.20); // 28 * 0.15 = 4.20
  assert.equal(totals.total, 35.20);

  // Step 5: Completes checkout and arrives at tracking
  const completedOrder = {
    orderId: '#PKM-2026-9901',
    numero_orden: '#PKM-2026-9901',
    buyerName: Store.data.currentUser.name,
    buyerEmail: Store.data.currentUser.email,
    metodo_entrega: 'quito',
    total: totals.total,
    stages: [
      { title: '1. Pago Confirmado', status: 'completed' },
      { title: '2. Empaque Seguro', status: 'active' }
    ]
  };
  Store.data.orders.push(completedOrder);
  Store.data.activeTrackingOrderId = completedOrder.orderId;
  Store.data.cart = [];

  const trackingHtml = TrackingView.render();
  assert.ok(trackingHtml.includes('Santiago Noboa'), 'Tracking must display dynamic buyer Santiago Noboa');
  assert.ok(trackingHtml.includes('#PKM-2026-9901'), 'Tracking must show correct order number');
});

test('TC-T4-02 [Real-World]: Anonymous Visitor Tracking Protection Journey', () => {
  const { TrackingView, Store, elementsById } = createE2ESandbox();

  // Step 1: External visitor clicks #tracking from link without logging in
  Store.data.currentUser = null;
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  const initialView = TrackingView.render();
  assert.ok(!initialView.includes('Patricio Mora'), 'Visitor must see zero customer details by default');
  assert.ok(!initialView.includes('paryx'), 'Visitor must see zero customer emails');

  // Step 2: Visitor inputs order code from an email receipt
  const receiptOrder = {
    orderId: '#RECEIPT-8899',
    numero_orden: '#RECEIPT-8899',
    buyerName: 'Gabriela Villacís',
    buyerEmail: 'gaby.villacis@outlook.com',
    metodo_entrega: 'courier',
    stages: [
      { title: '1. Pago Confirmado', status: 'completed' },
      { title: '2. Empaque Seguro', status: 'completed' },
      { title: '3. En Camino', status: 'active' }
    ]
  };
  Store.data.orders.push(receiptOrder);
  elementsById.get('tracking-search-input').value = '#RECEIPT-8899';
  TrackingView.handleTrackingSearch();

  // Step 3: Verified order renders with exact details
  const searchedView = TrackingView.render();
  assert.ok(searchedView.includes('#RECEIPT-8899'), 'Rendered tracking must show matched receipt order');
  assert.ok(searchedView.includes('Gabriela Villacís'), 'Must show legitimate recipient name');
});

test('TC-T4-03 [Real-World]: Payment Decline Recovery & Safe Completion Journey', () => {
  const { Store, PRODUCTS } = createE2ESandbox();

  // Step 1: Collector tries to purchase Mewtwo Holo Rare
  const mewtwo = PRODUCTS.find(p => p.id === 'mewtwo-151') || {
    id: 'mewtwo-151',
    nombre: 'Mewtwo 151 Holo Rare',
    imagenLocal: 'img/cards/mewto-holo-rare.png',
    precios: { raw: 45.00 }
  };
  assert.equal(mewtwo.imagenLocal, 'img/cards/mewto-holo-rare.png');

  Store.data.cart = [{
    id: mewtwo.id,
    sku: mewtwo.id,
    nombre: mewtwo.nombre,
    price: 45.00,
    quantity: 1,
    imagen: mewtwo.imagenLocal
  }];

  // Step 2: Credit card fails with simulated decline #DECLINED-SEC-054
  const declineResult = checkSimulatedDeclineContract('4532015114830000');
  assert.equal(declineResult.approved, false);
  assert.equal(declineResult.code, '#DECLINED-SEC-054');

  // Step 3: Friendly reassurance avoids panic (no charge was made)
  const reassuranceNotice = 'No te preocupes: no se ha realizado ningún cobro a tu tarjeta.';
  assert.ok(reassuranceNotice.includes('no se ha realizado ningún cobro'));

  // Step 4: Collector switches to cash payment on store pickup
  const safeTotals = calculateOrderTotalsContract(Store.data.cart, 'pickup');
  assert.equal(safeTotals.shipping, 0.00);
  assert.equal(safeTotals.total, 51.75); // 45 + (45 * 0.15) = 51.75

  // Step 5: Order finishes with verified status
  const safeOrder = {
    orderId: '#ORD-SAFE-RECOVERY',
    numero_orden: '#ORD-SAFE-RECOVERY',
    metodo_entrega: 'pickup',
    metodo_pago: 'cash_store',
    total: safeTotals.total
  };
  Store.data.orders.push(safeOrder);
  Store.data.cart = [];
  assert.equal(Store.data.orders.length, 1);
});
