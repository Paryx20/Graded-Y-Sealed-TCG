import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();

// Load actual production source files
const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
const checkoutCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8');
const cartCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/cart.js'), 'utf8');
const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');

function setupTestEnvironment() {
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
          toggle(c, force) {
            if (force !== undefined) {
              if (force) this._classes.add(c);
              else this._classes.delete(c);
              return force;
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
          if (this.parentNode) {
            this.parentNode.removeChild(this);
          }
        },
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; },
        style: {},
        _innerHTML: '',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(val) {
          this._innerHTML = String(val);
          if (val === '') {
            this.children.forEach(ch => { ch.parentNode = null; });
            this.children = [];
          }
        },
        innerText: '',
        value: ''
      };
      elements.set(id, el);
    }
    return elements.get(id);
  }

  // Pre-seed common DOM elements
  getOrCreateEl('toast-container');
  getOrCreateEl('delete-confirm-modal');
  getOrCreateEl('delete-confirm-item-name');
  getOrCreateEl('undo-banner');
  getOrCreateEl('undo-text');
  getOrCreateEl('cart-badge');
  getOrCreateEl('cart-items-container');
  getOrCreateEl('guest-name', 'input');
  getOrCreateEl('guest-id', 'input');
  getOrCreateEl('guest-email', 'input');
  getOrCreateEl('guest-phone', 'input');
  getOrCreateEl('guest-address', 'input');
  getOrCreateEl('guest-city', 'input');
  getOrCreateEl('checkout-password', 'input');
  getOrCreateEl('card-number', 'input');
  getOrCreateEl('card-exp', 'input');
  getOrCreateEl('card-cvv', 'input');

  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Math,
    Date,
    parseInt,
    parseFloat,
    encodeURIComponent,
    decodeURIComponent,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    window: {
      location: { hash: '#cart' }
    },
    document: {
      getElementById(id) { return elements.get(id) || null; },
      querySelector(sel) {
        if (sel === 'input[name="payment-method"]:checked') {
          return { value: 'card' };
        }
        return null;
      },
      querySelectorAll() { return []; },
      createElement(tag) {
        return getOrCreateEl(`gen_${Math.random().toString(36).substring(7)}`, tag);
      },
      addEventListener() {}
    },
    localStorage: {
      _store: new Map(),
      getItem(k) { return this._store.get(k) || null; },
      setItem(k, v) { this._store.set(k, String(v)); },
      removeItem(k) { this._store.delete(k); },
      clear() { this._store.clear(); }
    },
    lucide: {
      createIcons() {}
    },
    HomeView: { render: () => '<div>Home</div>' },
    CatalogView: { render: () => '<div>Catalog</div>' },
    PDPView: { render: () => '<div>PDP</div>' },
    ProfileView: { render: () => '<div>Profile</div>' },
    TrackingView: { render: () => '<div>Tracking</div>' }
  };

  context.window.document = context.document;
  context.window.localStorage = context.localStorage;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', context);
  vm.runInContext(stateCode + '\n;this.Store = Store;', context);
  vm.runInContext(checkoutCode + '\n;this.CheckoutView = CheckoutView;', context);
  vm.runInContext(cartCode + '\n;this.CartView = CartView;', context);
  vm.runInContext(appCode + '\n;this.app = app;', context);

  return { context, elements };
}

// ============================================================================
// TEST SUITE 1: ECUADORIAN CÉDULA & RUC MODULE 10 VALIDATION
// ============================================================================

test('Reviewer 2 Stress: Valid Cédulas across all 24 Ecuadorian provinces pass Module 10', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  function computeEcuadorianCheckDigit(prefix9) {
    const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let v = parseInt(prefix9.charAt(i), 10) * coefs[i];
      if (v >= 10) v -= 9;
      sum += v;
    }
    const rem = sum % 10;
    return rem === 0 ? 0 : 10 - rem;
  }

  // Test provinces 01 to 24 with third digit 0 to 5
  for (let prov = 1; prov <= 24; prov++) {
    const provStr = prov.toString().padStart(2, '0');
    for (let thirdDigit = 0; thirdDigit <= 5; thirdDigit++) {
      const prefix9 = `${provStr}${thirdDigit}000000`;
      const checkDigit = computeEcuadorianCheckDigit(prefix9);
      const fullCedula = `${prefix9}${checkDigit}`;

      assert.equal(
        Store.isValidEcuadorianId(fullCedula),
        true,
        `Expected valid cédula for province ${provStr}: ${fullCedula}`
      );

      // Corresponding natural RUC with '001' suffix must also be valid
      const fullRuc = `${fullCedula}001`;
      assert.equal(
        Store.isValidEcuadorianId(fullRuc),
        true,
        `Expected valid RUC for province ${provStr}: ${fullRuc}`
      );
    }
  }
});

test('Reviewer 2 Stress: Province code 30 (Exterior / Consular registration)', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  // Province 30 prefix with check digit:
  // prefix: '300000000', coef 3*2=6, check digit = 4 -> '3000000004'
  const consularCedula = '3000000004';
  const result = Store.isValidEcuadorianId(consularCedula);

  // In the current implementation (js/state.js:160):
  // provincia < 1 || provincia > 24 returns false.
  // Province 30 is rejected.
  assert.equal(result, false, 'Province 30 is currently rejected by range check 01-24');
});

test('Reviewer 2 Stress: Invalid province numbers (00, 25, 26, 99) rejected', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  assert.equal(Store.isValidEcuadorianId('0010034065'), false);
  assert.equal(Store.isValidEcuadorianId('2510034065'), false);
  assert.equal(Store.isValidEcuadorianId('2610034065'), false);
  assert.equal(Store.isValidEcuadorianId('9910034065'), false);
});

test('Reviewer 2 Stress: Third digit >= 6 rejected for natural person', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  for (let third = 6; third <= 9; third++) {
    const invalidThird = `17${third}0000001`;
    assert.equal(Store.isValidEcuadorianId(invalidThird), false);
  }
});

test('Reviewer 2 Stress: Invalid checksums (off-by-one, transposed digits) rejected', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  const validCedula = '1710034065';
  assert.equal(Store.isValidEcuadorianId(validCedula), true);

  // Off-by-one check digits
  for (let d = 0; d <= 9; d++) {
    if (d !== 5) {
      const badCheckDigit = `171003406${d}`;
      assert.equal(Store.isValidEcuadorianId(badCheckDigit), false, `Should reject ${badCheckDigit}`);
    }
  }

  // Transposed internal digits
  assert.equal(Store.isValidEcuadorianId('1701034065'), false);
});

test('Reviewer 2 Stress: RUC suffixes other than 001 rejected for natural persons', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  assert.equal(Store.isValidEcuadorianId('1710034065001'), true);
  assert.equal(Store.isValidEcuadorianId('1710034065002'), false);
  assert.equal(Store.isValidEcuadorianId('1710034065000'), false);
  assert.equal(Store.isValidEcuadorianId('1710034065123'), false);
  assert.equal(Store.isValidEcuadorianId('17100340650010'), false); // 14 digits
});

test('Reviewer 2 Stress: Malformed inputs (whitespace, letters, symbols, SQL/XSS, empty, types)', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  assert.equal(Store.isValidEcuadorianId(' 1710034065 '), true, 'Trims whitespace');
  assert.equal(Store.isValidEcuadorianId('1710034065\n'), true, 'Trims newline');
  assert.equal(Store.isValidEcuadorianId('17100 34065'), false, 'Internal space rejected');
  assert.equal(Store.isValidEcuadorianId('1710034065A'), false, 'Trailing character rejected');
  assert.equal(Store.isValidEcuadorianId('A1710034065'), false, 'Leading character rejected');
  assert.equal(Store.isValidEcuadorianId('1710034-065'), false, 'Hyphen rejected');
  assert.equal(Store.isValidEcuadorianId('<script>1710034065</script>'), false);
  assert.equal(Store.isValidEcuadorianId('1710034065 OR 1=1'), false);
  assert.equal(Store.isValidEcuadorianId(''), false);
  assert.equal(Store.isValidEcuadorianId(null), false);
  assert.equal(Store.isValidEcuadorianId(undefined), false);
  assert.equal(Store.isValidEcuadorianId(1710034065), false, 'Number rejected (string required)');
  assert.equal(Store.isValidEcuadorianId({}), false);
});

// ============================================================================
// TEST SUITE 2: ECUADORIAN PHONE FORMAT VALIDATION (+593)
// ============================================================================

test('Reviewer 2 Stress: Phone format edge cases (+593 followed by 9 digits)', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  // Valid formats
  assert.equal(Store.isValidEcuadorianPhone('+593 991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone('+593991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone('+593-991234567'), true);
  assert.equal(Store.isValidEcuadorianPhone(' +593 991234567 '), true, 'Trims outer whitespace');
  assert.equal(Store.isValidEcuadorianPhone('+593 223456789'), true, 'Landline 9 digits');

  // Invalid formats
  assert.equal(Store.isValidEcuadorianPhone('0991234567'), false, 'Missing +593 prefix');
  assert.equal(Store.isValidEcuadorianPhone('593991234567'), false, 'Missing + symbol');
  assert.equal(Store.isValidEcuadorianPhone('+1 991234567'), false, 'US country code');
  assert.equal(Store.isValidEcuadorianPhone('+57 3001234567'), false, 'Colombia country code');
  assert.equal(Store.isValidEcuadorianPhone('+593 99123456'), false, '8 digits (insufficient)');
  assert.equal(Store.isValidEcuadorianPhone('+593 9912345678'), false, '10 digits (excessive)');
  assert.equal(Store.isValidEcuadorianPhone('+593  991234567'), false, 'Multiple internal spaces');
  assert.equal(Store.isValidEcuadorianPhone('+593 99123456A'), false, 'Letter in phone');
  assert.equal(Store.isValidEcuadorianPhone(''), false);
  assert.equal(Store.isValidEcuadorianPhone(null), false);
  assert.equal(Store.isValidEcuadorianPhone(undefined), false);
});

// ============================================================================
// TEST SUITE 3: CREDIT CARD LUHN & SIMULATED DECLINE #DECLINED-SEC-054
// ============================================================================

test('Reviewer 2 Stress: Luhn validation on major card networks (Visa, MC, Amex, Discover)', () => {
  const { context } = setupTestEnvironment();
  const CheckoutView = context.CheckoutView;

  // Valid Visa (16 digits)
  assert.equal(CheckoutView.validateCreditCard('4532 0151 1283 0366').valid, true);
  assert.equal(CheckoutView.validateCreditCard('4532015112830366').code, '00-APPROVED');

  // Valid Mastercard (16 digits)
  assert.equal(CheckoutView.validateCreditCard('5424 1801 2345 6789').valid, true);

  // Valid Amex (15 digits)
  assert.equal(CheckoutView.validateCreditCard('3782 822463 10005').valid, true);

  // Valid Discover (16 digits)
  assert.equal(CheckoutView.validateCreditCard('6011 1111 1111 1117').valid, true);

  // Invalid check digit Visa
  const badVisa = CheckoutView.validateCreditCard('4532 0151 1283 0367');
  assert.equal(badVisa.valid, false);
  assert.equal(badVisa.code, 'LUHN_FAILED');

  // Short card (< 13 digits)
  const shortCard = CheckoutView.validateCreditCard('4532015112');
  assert.equal(shortCard.valid, false);
  assert.equal(shortCard.code, 'INVALID_LENGTH');

  // Long card (> 19 digits)
  const longCard = CheckoutView.validateCreditCard('453201511283036612345');
  assert.equal(longCard.valid, false);
  assert.equal(longCard.code, 'INVALID_LENGTH');
});

test('Reviewer 2 Stress: Cards ending in 0000 trigger #DECLINED-SEC-054 vs Luhn precedence', () => {
  const { context } = setupTestEnvironment();
  const CheckoutView = context.CheckoutView;

  // 16-digit valid Luhn card ending in 0000
  const valid16Card0000 = '4532015114830000';
  const res16 = CheckoutView.validateCreditCard(valid16Card0000);
  assert.equal(res16.valid, false);
  assert.equal(res16.simulatedDecline, true);
  assert.equal(res16.code, '#DECLINED-SEC-054');

  // 15-digit card (Amex length) ending in 0000 that satisfies Luhn
  // Let's find one dynamically
  let valid15Card0000 = null;
  for (let i = 37000000000; i <= 37000001000; i++) {
    const candidate = `${i}0000`; // 11 + 4 = 15 digits
    let sum = 0;
    let alt = false;
    for (let j = candidate.length - 1; j >= 0; j--) {
      let n = parseInt(candidate.charAt(j), 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    if (sum % 10 === 0) {
      valid15Card0000 = candidate;
      break;
    }
  }

  assert.ok(valid15Card0000, 'Found valid 15-digit Luhn card ending in 0000');
  const res15 = CheckoutView.validateCreditCard(valid15Card0000);
  assert.equal(res15.valid, false);
  assert.equal(res15.simulatedDecline, true);
  assert.equal(res15.code, '#DECLINED-SEC-054');

  // Card ending in 0000 that FAILS Luhn:
  const badLuhn0000 = '4532015112820000';
  const resBadLuhn = CheckoutView.validateCreditCard(badLuhn0000);
  assert.equal(resBadLuhn.valid, false);
  assert.equal(resBadLuhn.code, 'LUHN_FAILED', 'Invalid Luhn check precedes simulated decline');
});

// ============================================================================
// TEST SUITE 4: FINANCIAL CALCULATIONS (15% VAT & TRI-TIER FLAT SHIPPING)
// ============================================================================

test('Reviewer 2 Stress: 15% VAT half-up rounding precision across critical cents', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  const testCases = [
    { subtotal: 0.00, expectedVat: 0.00 },
    { subtotal: 100.00, expectedVat: 15.00 },
    { subtotal: 750.00, expectedVat: 112.50 },
    { subtotal: 18500.00, expectedVat: 2775.00 },
    { subtotal: 49.99, expectedVat: 7.50 },   // 49.99 * 0.15 = 7.4985 -> 7.50
    { subtotal: 99.95, expectedVat: 14.99 },  // 99.95 * 0.15 = 14.9925 -> 14.99
    { subtotal: 10.03, expectedVat: 1.50 },   // 10.03 * 0.15 = 1.5045 -> 1.50
    { subtotal: 10.04, expectedVat: 1.51 },   // 10.04 * 0.15 = 1.506 -> 1.51
    { subtotal: 0.01, expectedVat: 0.00 },    // 0.01 * 0.15 = 0.0015 -> 0.00
    { subtotal: 0.07, expectedVat: 0.01 },    // 0.07 * 0.15 = 0.0105 -> 0.01
  ];

  for (const tc of testCases) {
    Store.data.cart = tc.subtotal > 0 ? [{ price: tc.subtotal, quantity: 1 }] : [];
    Store.data.deliveryMethod = 'pickup';
    const totals = Store.getCartTotals();
    assert.equal(
      totals.tax,
      tc.expectedVat,
      `Subtotal $${tc.subtotal}: expected VAT $${tc.expectedVat}, got $${totals.tax}`
    );
  }
});

test('Reviewer 2 Stress: Tri-tier flat shipping rates ($0.00, $3.00, $5.00) and aliases', () => {
  const { context } = setupTestEnvironment();
  const Store = context.Store;

  // Pickup tier ($0.00)
  Store.data.cart = [{ price: 100, quantity: 1 }];
  Store.data.deliveryMethod = 'pickup';
  let totals = Store.getCartTotals();
  assert.equal(totals.shipping, 0.00);
  assert.equal(totals.total, 115.00);

  Store.data.deliveryMethod = 'retiro';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 0.00);

  // Quito Local Express tier ($3.00)
  Store.data.deliveryMethod = 'quito';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 3.00);
  assert.equal(totals.total, 118.00);

  Store.data.deliveryMethod = 'local_express';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 3.00);

  Store.data.deliveryMethod = 'local';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 3.00);

  // National Armored Courier tier ($5.00)
  Store.data.deliveryMethod = 'courier';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 5.00);
  assert.equal(totals.total, 120.00);

  Store.data.deliveryMethod = 'national';
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 5.00);

  // Empty cart tier
  Store.data.cart = [];
  totals = Store.getCartTotals();
  assert.equal(totals.shipping, 0.00);
  assert.equal(totals.subtotal, 0.00);
  assert.equal(totals.tax, 0.00);
  assert.equal(totals.total, 0.00);
});

// ============================================================================
// TEST SUITE 5: TOAST UX & SINGLETON GUARANTEE (2.5s TIMING)
// ============================================================================

test('Reviewer 2 Stress: Rapid consecutive toast calls maintain strictly 1 DOM element', () => {
  const { context, elements } = setupTestEnvironment();
  const app = context.app;
  const container = elements.get('toast-container');

  for (let i = 1; i <= 20; i++) {
    app.showToast(`Mensaje de prueba número ${i}`, i % 2 === 0 ? 'success' : 'error');
    assert.equal(
      container.children.length,
      1,
      `At call ${i}, container MUST contain strictly 1 toast`
    );
  }

  assert.ok(container.children[0].innerHTML.includes('Mensaje de prueba número 20'));
});

// ============================================================================
// TEST SUITE 6: CART REMOVAL MODAL PROMPT & FUNCTIONAL UNDO ('DESHACER')
// ============================================================================

test('Reviewer 2 Stress: Full Cart Removal, Cancel, Confirm, and Deshacer lifecycle', () => {
  const { context, elements } = setupTestEnvironment();
  const app = context.app;
  const Store = context.Store;

  const initialItems = [
    { id: 'item-1', name: 'Charizard Base Set', condition: 'PSA 10', price: 18500, quantity: 1 },
    { id: 'item-2', name: 'Team Rocket Booster Box', condition: 'Factory Sealed', price: 1350, quantity: 2 },
    { id: 'item-3', name: 'Raichu GX Holo', condition: 'Raw Mint', price: 120, quantity: 1 }
  ];

  Store.data.cart = [...initialItems];

  const modal = elements.get('delete-confirm-modal');
  const banner = elements.get('undo-banner');
  const itemNameEl = elements.get('delete-confirm-item-name');

  // Step 1: Request removal of item-2 (middle item)
  app.requestRemoveItem('item-2');
  assert.equal(Store.data.pendingDeleteItemId, 'item-2');
  assert.equal(modal.classList.contains('active'), true);
  assert.ok(itemNameEl.innerText.includes('Team Rocket Booster Box'));

  // Step 2: Cancel removal
  app.cancelRemoveItem();
  assert.equal(Store.data.pendingDeleteItemId, null);
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(Store.data.cart.length, 3, 'Cart unchanged after cancel');

  // Step 3: Re-request removal of item-2 and confirm
  app.requestRemoveItem('item-2');
  app.confirmRemoveItem();
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(Store.data.cart.length, 2);
  assert.equal(Store.data.cart.find(c => c.id === 'item-2'), undefined);
  assert.equal(Store.data.lastDeletedItem.item.id, 'item-2');
  assert.equal(Store.data.lastDeletedItem.index, 1, 'Saved correct original index 1');
  assert.equal(banner.classList.contains('hidden'), false, 'Undo banner visible');

  // Step 4: Deshacer (Undo) restoration
  app.undoLastDeletion();
  assert.equal(Store.data.cart.length, 3);
  assert.equal(Store.data.cart[1].id, 'item-2', 'Restored to exact original index 1');
  assert.equal(Store.data.lastDeletedItem, null);
  assert.equal(banner.classList.contains('hidden'), true, 'Undo banner hidden');

  // Step 5: Second undo call must be safe no-op
  app.undoLastDeletion();
  assert.equal(Store.data.cart.length, 3, 'Cart unchanged on double undo');
});
