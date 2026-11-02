/**
 * ==============================================================================
 * Reviewer 1 - Milestone 2 Adversarial Stress & Integrity Verification Suite
 * File: tests/test_reviewer_m2_stress.mjs
 * 
 * Verifies real source code files:
 *   - js/data.js
 *   - js/state.js
 *   - js/views/checkout.js
 *   - js/views/cart.js
 *   - js/app.js
 *   - js/db/db-client.js
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();

// Helper to build sandbox with actual codebase files
function buildFullAppSandbox() {
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const checkoutCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8');
  const cartCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/cart.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');

  const elements = new Map();
  function getOrCreateEl(id, tag = 'div') {
    if (!elements.has(id)) {
      const el = {
        id,
        tagName: tag.toUpperCase(),
        classList: {
          _classes: new Set(),
          add(...c) { c.forEach(x => this._classes.add(x)); },
          remove(...c) { c.forEach(x => this._classes.delete(x)); },
          contains(c) { return this._classes.has(c); },
          toggle(c, f) {
            if (f !== undefined) {
              if (f) this._classes.add(c);
              else this._classes.delete(c);
              return f;
            }
            if (this._classes.has(c)) { this._classes.delete(c); return false; }
            this._classes.add(c); return true;
          }
        },
        children: [],
        appendChild(ch) {
          ch.parentNode = this;
          this.children.push(ch);
          return ch;
        },
        removeChild(ch) {
          const idx = this.children.indexOf(ch);
          if (idx !== -1) {
            this.children.splice(idx, 1);
            ch.parentNode = null;
          }
          return ch;
        },
        remove() {
          if (this.parentNode) this.parentNode.removeChild(this);
        },
        setAttribute(n, v) { this[n] = v; },
        getAttribute(n) { return this[n] || null; },
        _innerHTML: '',
        _innerText: '',
        get innerText() { return this._innerText || this._innerHTML; },
        set innerText(v) { this._innerText = String(v); },
        get innerHTML() { return this._innerHTML; },
        set innerHTML(val) {
          this._innerHTML = String(val);
          if (!val) {
            for (const ch of this.children) ch.parentNode = null;
            this.children = [];
          }
        },
        style: {}
      };
      elements.set(id, el);
    }
    return elements.get(id);
  }

  // Pre-populate known DOM IDs
  const toastContainer = getOrCreateEl('toast-container');
  const deleteModal = getOrCreateEl('delete-confirm-modal');
  const deleteItemName = getOrCreateEl('delete-confirm-item-name', 'p');
  deleteModal.appendChild(deleteItemName);
  const undoBanner = getOrCreateEl('undo-banner');
  const undoText = getOrCreateEl('undo-text', 'span');
  undoBanner.appendChild(undoText);
  const cartBadge = getOrCreateEl('cart-badge', 'span');
  const appView = getOrCreateEl('app-view', 'main');

  const mockLocalStorage = {
    _data: new Map(),
    getItem(k) { return this._data.has(k) ? this._data.get(k) : null; },
    setItem(k, v) { this._data.set(k, String(v)); },
    removeItem(k) { this._data.delete(k); },
    clear() { this._data.clear(); }
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Math,
    Date,
    JSON,
    URLSearchParams,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    localStorage: mockLocalStorage,
    window: {
      location: { hash: '#home' },
      localStorage: mockLocalStorage
    },
    document: {
      getElementById(id) {
        return elements.get(id) || null;
      },
      querySelector(selector) {
        if (selector.startsWith('#')) return elements.get(selector.slice(1)) || null;
        if (selector === 'input[name="payment-method"]:checked') {
          return elements.get('payment-method-checked') || { value: 'card' };
        }
        return null;
      },
      querySelectorAll() { return []; },
      createElement(tag) {
        return getOrCreateEl(`gen-${Math.random()}`, tag);
      },
      addEventListener() {},
      body: { classList: { add() {}, remove() {} } }
    },
    lucide: { createIcons() {} },
    HomeView: { render: () => '<div>Home</div>' },
    CatalogView: { render: () => '<div>Catalog</div>' },
    PDPView: { render: () => '<div>PDP</div>' },
    ProfileView: { render: () => '<div>Profile</div>' },
    TrackingView: { render: () => '<div>Tracking</div>' }
  };
  sandbox.window.document = sandbox.document;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);

  // Evaluate files in order and expose globals on sandbox
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(checkoutCode + '\n;this.CheckoutView = CheckoutView;', sandbox);
  vm.runInContext(cartCode + '\n;this.CartView = CartView;', sandbox);
  vm.runInContext(appCode + '\n;this.app = app;', sandbox);

  return { sandbox, elements, mockLocalStorage };
}

// ==============================================================================
// 1. INTEGRITY CHECK: NO HARDCODED CARD CHECKS OR CHEAT SHORTCUTS
// ==============================================================================

test('Integrity Check: Source code contains authentic logic without hardcoded test inputs', () => {
  const checkoutCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');

  // Verify no hardcoded test card passes
  assert.ok(!checkoutCode.includes("cardNumber === '4532015112830366'"), 'Must not hardcode Visa test card');
  assert.ok(!checkoutCode.includes("cardNumber === '5424180123456789'"), 'Must not hardcode Mastercard test card');

  // Verify no hardcoded test cédula passes
  assert.ok(!stateCode.includes("idString === '1710034065'"), 'Must not hardcode Pichincha test cédula');
  assert.ok(!stateCode.includes("idString === '0926629916'"), 'Must not hardcode Guayas test cédula');

  // Verify real Luhn doubling loop is present
  assert.ok(checkoutCode.includes('alternate = !alternate'), 'Must contain actual Luhn alternation loop');
  assert.ok(checkoutCode.includes('sum % 10'), 'Must calculate real Luhn modulo 10');

  // Verify real Ecuadorian Module 10 is present
  assert.ok(stateCode.includes('[2, 1, 2, 1, 2, 1, 2, 1, 2]'), 'Must use authentic Module 10 coefficients');
  assert.ok(stateCode.includes('tercerDigito >= 6'), 'Must enforce third digit natural person constraint (tercerDigito >= 6 rejects)');
});

// ==============================================================================
// 2. ADVERSARIAL STRESS TEST: Store.isValidEcuadorianId (in js/state.js)
// ==============================================================================

test('Adversarial Store.isValidEcuadorianId: Validates real Cédulas across all 24 provinces', () => {
  const { sandbox } = buildFullAppSandbox();
  const { Store } = sandbox;

  // Real algorithmically generated valid 10-digit cédulas for provinces 01 to 24:
  function makeValidCedula(provStr, seqStr = '100340') {
    const base9 = provStr + '0' + seqStr; // 3rd digit is 0 (< 6)
    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let v = parseInt(base9.charAt(i), 10) * coef[i];
      if (v >= 10) v -= 9;
      sum += v;
    }
    const r = sum % 10;
    const check = r === 0 ? 0 : 10 - r;
    return base9 + check;
  }

  for (let p = 1; p <= 24; p++) {
    const pStr = p.toString().padStart(2, '0');
    const validCedula = makeValidCedula(pStr);
    assert.equal(Store.isValidEcuadorianId(validCedula), true, `Province ${pStr} valid cédula should pass`);

    const validRuc = validCedula + '001';
    assert.equal(Store.isValidEcuadorianId(validRuc), true, `Province ${pStr} valid natural RUC should pass`);

    // Invalid check digit
    const lastD = parseInt(validCedula.slice(-1), 10);
    const corruptedLastD = (lastD + 1) % 10;
    const invalidCedula = validCedula.slice(0, 9) + corruptedLastD;
    assert.equal(Store.isValidEcuadorianId(invalidCedula), false, `Province ${pStr} corrupted check digit should fail`);
  }
});

test('Adversarial Store.isValidEcuadorianId: Boundary and hostile inputs', () => {
  const { sandbox } = buildFullAppSandbox();
  const { Store } = sandbox;

  // Out of bound provinces
  assert.equal(Store.isValidEcuadorianId('0010034065'), false, 'Province 00 rejected');
  assert.equal(Store.isValidEcuadorianId('2510034065'), false, 'Province 25 rejected');
  assert.equal(Store.isValidEcuadorianId('9910034065'), false, 'Province 99 rejected');

  // Third digit >= 6 (legal entities / public institutions, not natural cédula)
  assert.equal(Store.isValidEcuadorianId('1760034065'), false, 'Third digit 6 rejected');
  assert.equal(Store.isValidEcuadorianId('1790034065'), false, 'Third digit 9 rejected');

  // RUC with non-001 suffix
  assert.equal(Store.isValidEcuadorianId('1710034065000'), false, 'Suffix 000 rejected');
  assert.equal(Store.isValidEcuadorianId('1710034065002'), false, 'Suffix 002 rejected');
  assert.equal(Store.isValidEcuadorianId('1710034065100'), false, 'Suffix 100 rejected');

  // Hostile types and injections
  assert.equal(Store.isValidEcuadorianId(null), false);
  assert.equal(Store.isValidEcuadorianId(undefined), false);
  assert.equal(Store.isValidEcuadorianId(''), false);
  assert.equal(Store.isValidEcuadorianId(1710034065), false);
  assert.equal(Store.isValidEcuadorianId({}), false);
  assert.equal(Store.isValidEcuadorianId('1710034065A'), false);
  assert.equal(Store.isValidEcuadorianId('<script>1710034065</script>'), false);
  assert.equal(Store.isValidEcuadorianId('DROP TABLE usuarios;'), false);
  assert.equal(Store.isValidEcuadorianId('171003406-5'), false);
});

// ==============================================================================
// 3. ADVERSARIAL STRESS TEST: Store.isValidEcuadorianPhone (in js/state.js)
// ==============================================================================

test('Adversarial Store.isValidEcuadorianPhone: Valid and hostile inputs', () => {
  const { sandbox } = buildFullAppSandbox();
  const { Store } = sandbox;

  assert.equal(Store.isValidEcuadorianPhone('+593 991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone('+593991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone('+593-991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone('+593 223456789'), true);

  // Missing prefix
  assert.equal(Store.isValidEcuadorianPhone('0991234567'), false);
  assert.equal(Store.isValidEcuadorianPhone('991234567'), false);
  assert.equal(Store.isValidEcuadorianPhone('+1 5551234567'), false);
  assert.equal(Store.isValidEcuadorianPhone('+57 3001234567'), false);

  // Wrong lengths
  assert.equal(Store.isValidEcuadorianPhone('+593 99123456'), false, '8 digits rejected');
  assert.equal(Store.isValidEcuadorianPhone('+593 9912345678'), false, '10 digits rejected');
  assert.equal(Store.isValidEcuadorianPhone('+593 0'), false);

  // Malicious / Non-string
  assert.equal(Store.isValidEcuadorianPhone(null), false);
  assert.equal(Store.isValidEcuadorianPhone(undefined), false);
  assert.equal(Store.isValidEcuadorianPhone(593991234567), false);
  assert.equal(Store.isValidEcuadorianPhone('+593 99123456a'), false);
  assert.equal(Store.isValidEcuadorianPhone('+593 991234567; DROP'), false);
});

// ==============================================================================
// 4. ADVERSARIAL STRESS TEST: Store.getCartTotals (in js/state.js)
// ==============================================================================

test('Adversarial Store.getCartTotals: Financial precision, tri-tier shipping and empty states', () => {
  const { sandbox } = buildFullAppSandbox();
  const { Store, APP_CONFIG } = sandbox;

  // Verify APP_CONFIG rates
  assert.equal(APP_CONFIG.TAX_RATE, 0.15);
  assert.equal(APP_CONFIG.QUITO_SHIPPING_FEE, 3.00);
  assert.equal(APP_CONFIG.COURIER_SHIPPING_FEE, 5.00);
  assert.equal(APP_CONFIG.PICKUP_SHIPPING_FEE, 0.00);

  // Empty cart
  Store.data.cart = [];
  Store.data.deliveryMethod = 'courier';
  const emptyTotals = Store.getCartTotals();
  assert.equal(emptyTotals.subtotal, 0.00);
  assert.equal(emptyTotals.shipping, 0.00);
  assert.equal(emptyTotals.tax, 0.00);
  assert.equal(emptyTotals.total, 0.00);

  // Single item with pickup ($0.00)
  Store.data.cart = [{ price: 100.00, quantity: 1 }];
  Store.data.deliveryMethod = 'pickup';
  const pickupTotals = Store.getCartTotals();
  assert.equal(pickupTotals.subtotal, 100.00);
  assert.equal(pickupTotals.shipping, 0.00);
  assert.equal(pickupTotals.tax, 15.00);
  assert.equal(pickupTotals.total, 115.00);

  // Single item with Quito express ($3.00)
  Store.data.deliveryMethod = 'quito';
  const quitoTotals = Store.getCartTotals();
  assert.equal(quitoTotals.shipping, 3.00);
  assert.equal(quitoTotals.tax, 15.00);
  assert.equal(quitoTotals.total, 118.00);

  // Single item with courier national ($5.00)
  Store.data.deliveryMethod = 'courier';
  const courierTotals = Store.getCartTotals();
  assert.equal(courierTotals.shipping, 5.00);
  assert.equal(courierTotals.tax, 15.00);
  assert.equal(courierTotals.total, 120.00);

  // Odd cents rounding test: $49.99 * 0.15 = 7.4985 -> $7.50
  Store.data.cart = [{ price: 49.99, quantity: 1 }];
  Store.data.deliveryMethod = 'quito';
  const oddTotals = Store.getCartTotals();
  assert.equal(oddTotals.subtotal, 49.99);
  assert.equal(oddTotals.tax, 7.50);
  assert.equal(oddTotals.shipping, 3.00);
  assert.equal(oddTotals.total, 60.49); // 49.99 + 7.50 + 3.00 = 60.49

  // Multi-item with fallback field names (precio_unitario, cantidad)
  Store.data.cart = [
    { precio_unitario: 25.50, cantidad: 2 },
    { price: 10.00, quantity: 1 }
  ];
  Store.data.deliveryMethod = 'national';
  const multiTotals = Store.getCartTotals();
  assert.equal(multiTotals.subtotal, 61.00); // 51.00 + 10.00
  assert.equal(multiTotals.tax, 9.15); // 61 * 0.15
  assert.equal(multiTotals.shipping, 5.00);
  assert.equal(multiTotals.total, 75.15);
});

// ==============================================================================
// 5. ADVERSARIAL STRESS TEST: CheckoutView.validateCreditCard
// ==============================================================================

test('Adversarial CheckoutView.validateCreditCard: Luhn calculation, 0000 decline simulation, and boundaries', () => {
  const { sandbox } = buildFullAppSandbox();
  const { CheckoutView } = sandbox;

  // Real Luhn valid cards
  const validVisa = '4532015112830366';
  const resVisa = CheckoutView.validateCreditCard(validVisa);
  assert.equal(resVisa.valid, true);
  assert.equal(resVisa.code, '00-APPROVED');

  const validMastercard = '5424180123456789';
  const resMC = CheckoutView.validateCreditCard(validMastercard);
  assert.equal(resMC.valid, true);

  const validAmex = '378282246310005';
  const resAmex = CheckoutView.validateCreditCard(validAmex);
  assert.equal(resAmex.valid, true);

  // Formatted with spaces and dashes
  assert.equal(CheckoutView.validateCreditCard('4532 0151 1283 0366').valid, true);
  assert.equal(CheckoutView.validateCreditCard('4532-0151-1283-0366').valid, true);

  // Simulated decline: Card MUST pass Luhn AND end in '0000'
  // 4532015114830000: Luhn sum = 40 (valid), ends in 0000
  const declineCard = '4532015114830000';
  const resDecline = CheckoutView.validateCreditCard(declineCard);
  assert.equal(resDecline.valid, false, 'Simulated decline card must not be valid');
  assert.equal(resDecline.simulatedDecline, true);
  assert.equal(resDecline.code, '#DECLINED-SEC-054');
  assert.ok(resDecline.message.includes('#DECLINED-SEC-054'));

  // Corrupted card ending in 0000 that FAILS Luhn:
  // Must fail on Luhn BEFORE triggering simulated decline!
  const fake0000 = '4532015112830000'; // sum is not div by 10
  const resFake = CheckoutView.validateCreditCard(fake0000);
  assert.equal(resFake.valid, false);
  assert.equal(resFake.code, 'LUHN_FAILED');
  assert.equal(Boolean(resFake.simulatedDecline), false);

  // Invalid length cards
  assert.equal(CheckoutView.validateCreditCard('123456789012').code, 'INVALID_LENGTH'); // 12 digits
  assert.equal(CheckoutView.validateCreditCard('12345678901234567890').code, 'INVALID_LENGTH'); // 20 digits

  // Non-numeric or invalid types
  assert.equal(CheckoutView.validateCreditCard(null).valid, false);
  assert.equal(CheckoutView.validateCreditCard(undefined).valid, false);
  assert.equal(CheckoutView.validateCreditCard('').valid, false);
  assert.equal(CheckoutView.validateCreditCard(4532015112830366).valid, false);
});

// ==============================================================================
// 6. ADVERSARIAL STRESS TEST: app.showToast Strict Singleton & Timer Replacement
// ==============================================================================

test('Adversarial app.showToast: Strict singleton guarantee in DOM and immediate timer dismissal', () => {
  const { sandbox, elements } = buildFullAppSandbox();
  const { app } = sandbox;
  const container = elements.get('toast-container');

  // Trigger 20 rapid toasts
  for (let i = 1; i <= 20; i++) {
    app.showToast(`Mensaje rápido ${i}`, i % 2 === 0 ? 'success' : 'error');
    assert.equal(container.children.length, 1, `After call ${i}, container MUST contain strictly 1 child`);
  }

  // Check last toast content
  assert.ok(container.children[0].innerText.includes('Mensaje rápido 20'));
  assert.equal(container.children[0].getAttribute('data-type'), 'success');

  // Verify active timer replacement
  assert.ok(app._activeToastTimeout !== null, 'Active timeout should be set');
  const timer1 = app._activeToastTimeout;

  // New toast should cancel timer1
  app.showToast('Mensaje de reemplazo', 'info');
  assert.notEqual(app._activeToastTimeout, timer1, 'Timer should have been cleared and replaced');
  assert.equal(container.children.length, 1);
  assert.ok(container.children[0].innerText.includes('Mensaje de reemplazo'));
});

// ==============================================================================
// 7. ADVERSARIAL STRESS TEST: Cart Removal Confirmation & Undo Restoration
// ==============================================================================

test('Adversarial Cart Removal & Undo: Modal lifecycle, index preservation, and idempotent undo', () => {
  const { sandbox, elements } = buildFullAppSandbox();
  const { app, Store } = sandbox;

  Store.data.cart = [
    { id: 'item-0', name: 'Charizard Raw', price: 750, quantity: 1, condition: 'Raw' },
    { id: 'item-1', name: 'Umbreon VMAX', price: 650, quantity: 2, condition: 'PSA 9' },
    { id: 'item-2', name: 'Team Rocket Box', price: 1200, quantity: 1, condition: 'Factory Sealed' }
  ];

  // 1. Request removal of middle item (item-1)
  app.requestRemoveItem('item-1');
  const modal = elements.get('delete-confirm-modal');
  const modalName = elements.get('delete-confirm-item-name');
  assert.equal(modal.classList.contains('active'), true);
  assert.ok(modalName.innerText.includes('Umbreon VMAX'));
  assert.equal(Store.data.pendingDeleteItemId, 'item-1');

  // 2. Cancel removal
  app.cancelRemoveItem();
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(Store.data.pendingDeleteItemId, null);
  assert.equal(Store.data.cart.length, 3, 'Cart unchanged on cancel');

  // 3. Request and confirm removal
  app.requestRemoveItem('item-1');
  app.confirmRemoveItem();
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(Store.data.cart.length, 2);
  assert.equal(Store.data.cart[0].id, 'item-0');
  assert.equal(Store.data.cart[1].id, 'item-2');
  assert.equal(Store.data.lastDeletedItem.item.id, 'item-1');
  assert.equal(Store.data.lastDeletedItem.index, 1);

  const banner = elements.get('undo-banner');
  const undoText = elements.get('undo-text');
  assert.equal(banner.classList.contains('hidden'), false);
  assert.ok(undoText.innerText.includes('Umbreon VMAX'));

  // 4. Undo restoration restores to exact index 1
  app.undoLastDeletion();
  assert.equal(Store.data.cart.length, 3);
  assert.equal(Store.data.cart[0].id, 'item-0');
  assert.equal(Store.data.cart[1].id, 'item-1');
  assert.equal(Store.data.cart[2].id, 'item-2');
  assert.equal(Store.data.lastDeletedItem, null);
  assert.equal(banner.classList.contains('hidden'), true);

  // 5. Subsequent undo is a safe no-op
  assert.doesNotThrow(() => {
    app.undoLastDeletion();
  });
  assert.equal(Store.data.cart.length, 3);
});

// ==============================================================================
// 8. ADVERSARIAL STRESS TEST: CheckoutView.processPayment Full Lifecycle
// ==============================================================================

test('Adversarial CheckoutView.processPayment: Mandatory password, decline simulation, and order persistence', async () => {
  const { sandbox, elements } = buildFullAppSandbox();
  const { CheckoutView, Store } = sandbox;

  // Setup cart
  Store.data.cart = [{ id: 'charizard-base', name: 'Charizard', price: 750, quantity: 1, condition: 'PSA 10' }];
  Store.data.currentUser = null;

  // Mock DOM inputs
  const nameInput = elements.get('guest-name') || { value: 'Carlos Mendoza' };
  const idInput = elements.get('guest-id') || { value: '1710034065' };
  const emailInput = elements.get('guest-email') || { value: 'carlos@pkm.ec' };
  const phoneInput = elements.get('guest-phone') || { value: '0991234567' };
  const addressInput = elements.get('guest-address') || { value: 'Av. República del Salvador' };
  const cityInput = elements.get('guest-city') || { value: 'Quito' };
  const passInput = elements.get('checkout-password') || { value: '' };
  const cardInput = elements.get('card-number') || { value: '4532015112830366' };

  elements.set('guest-name', nameInput);
  elements.set('guest-id', idInput);
  elements.set('guest-email', emailInput);
  elements.set('guest-phone', phoneInput);
  elements.set('guest-address', addressInput);
  elements.set('guest-city', cityInput);
  elements.set('checkout-password', passInput);
  elements.set('card-number', cardInput);

  // Scenario A: Missing password (< 8 chars) on unauthenticated user MUST be rejected
  passInput.value = '12345';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Must not process order with invalid password');
  assert.equal(Store.data.currentUser, null);

  // Scenario B: Invalid Cédula MUST be rejected
  passInput.value = 'ValidPass2026!';
  idInput.value = '1710034069'; // Bad check digit
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Must not process order with bad cédula');

  // Scenario C: Invalid Phone MUST be rejected
  idInput.value = '1710034065';
  phoneInput.value = '1234'; // Insufficient digits
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Must not process order with bad phone');

  // Scenario D: Valid card ending in '0000' MUST trigger simulated decline and navigate to #error
  phoneInput.value = '0991234567';
  cardInput.value = '4532015114830000'; // valid Luhn, ends in 0000
  await CheckoutView.processPayment();
  assert.equal(sandbox.window.location.hash, '#error', 'Must redirect to #error on 0000 decline');
  assert.equal(Store.data.orders.length, 0, 'Must not create order on decline');

  // Scenario E: Cash on pickup payment method bypasses card check and completes order
  cardInput.value = '';
  Store.data.deliveryMethod = 'pickup';
  elements.set('payment-method-checked', { value: 'cash' });
  await CheckoutView.processPayment();

  assert.equal(Store.data.orders.length, 1, 'Cash order must be recorded');
  const order = Store.data.orders[0];
  assert.equal(order.paymentMethod, 'Efectivo en Tienda');
  assert.equal(order.buyerName, 'Carlos Mendoza');
  assert.equal(order.usuario_cedula, '1710034065');
  assert.equal(order.buyerPhone, '+593 991234567');
  assert.equal(order.shipping, 0.00);
  assert.equal(order.subtotal, 750.00);
  assert.equal(order.iva_15, 112.50);
  assert.equal(order.total, 862.50);
  assert.equal(Store.data.cart.length, 0, 'Cart must be cleared after order placement');
  assert.ok(Store.data.currentUser !== null, 'Active session must be set');
  assert.equal(Store.data.currentUser.name, 'Carlos Mendoza');
  assert.equal(sandbox.window.location.hash, '#confirmation', 'Must navigate to #confirmation');
});
