/**
 * ==============================================================================
 * Challenger 2: Adversarial Empirical UI & State Lifecycle Test Suite
 * Milestone 2: Phase 5 Cart, Mandatory Checkout & Ecuadorian Validations
 * File: tests/test_challenger_m2_lifecycle.test.mjs
 * 
 * Verifies:
 * 1. Toast Singleton Lifecycle:
 *    - 100 rapid sequential calls keeping DOM count strictly at 1.
 *    - Clock advance: 2490ms (toast present), 2510ms (auto-dismiss triggered), 2710ms (removed from DOM).
 *    - Race condition / timer leak stress test.
 * 2. Cart Removal Confirmation & Undo:
 *    - Request removal triggers #delete-confirm-modal and pending state.
 *    - Confirm removal extracts item to lastDeletedItem and shows #undo-banner.
 *    - Undo restores item to exact original index and hides banner.
 *    - Emptied cart restore and double undo idempotency.
 * 3. Mandatory Account Registration Flow:
 *    - Password validation rejection (missing, < 8 chars).
 *    - Invalid Ecuadorian Cédula / RUC (Module 10) rejection.
 *    - Invalid Ecuadorian Phone (+593 prefix / 9 digits) rejection.
 *    - Card ending in '0000' with valid Luhn triggers #DECLINED-SEC-054 and routes to #error.
 *    - Valid card completes order, empties cart, sets active session, and routes to #confirmation.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(...cls) {
    cls.forEach(c => {
      if (c && typeof c === 'string') {
        c.split(/\s+/).filter(Boolean).forEach(x => this.classes.add(x));
      }
    });
  }
  remove(...cls) {
    cls.forEach(c => {
      if (c && typeof c === 'string') {
        c.split(/\s+/).filter(Boolean).forEach(x => this.classes.delete(x));
      }
    });
  }
  toggle(c, force) {
    if (force !== undefined) {
      force ? this.add(c) : this.remove(c);
      return force;
    }
    if (this.contains(c)) {
      this.remove(c);
      return false;
    }
    this.add(c);
    return true;
  }
  contains(c) {
    return this.classes.has(c);
  }
  toString() {
    return Array.from(this.classes).join(' ');
  }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.classList = new MockClassList();
    this.attributes = new Map();
    this.parentNode = null;
    this._innerHTML = '';
    this._innerText = '';
    this.value = '';
    this.checked = false;
    this.style = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    if (!val || val === '') {
      this.children.forEach(c => { c.parentNode = null; });
      this.children = [];
    }
  }

  get innerText() {
    return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim();
  }

  set innerText(val) {
    this._innerText = String(val);
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    this[k] = v;
    if (k === 'id') this.id = String(v);
  }

  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : (this[k] || null);
  }

  focus() {}
}

class VirtualClock {
  constructor() {
    this.now = 0;
    this.timers = [];
    this.nextId = 1;
  }

  setTimeout(fn, ms) {
    const id = this.nextId++;
    this.timers.push({ id, fn, triggerAt: this.now + Number(ms || 0), cleared: false });
    return id;
  }

  clearTimeout(id) {
    const timer = this.timers.find(t => t.id === id);
    if (timer) {
      timer.cleared = true;
    }
  }

  advanceTime(ms) {
    this.now += Number(ms);
    let keepGoing = true;
    while (keepGoing) {
      keepGoing = false;
      this.timers.sort((a, b) => a.triggerAt - b.triggerAt);
      for (const t of this.timers) {
        if (!t.cleared && t.triggerAt <= this.now) {
          t.cleared = true;
          t.fn();
          keepGoing = true;
          break; // re-sort as fn may schedule new timers
        }
      }
    }
  }
}

function createTestSandbox() {
  const rootDir = process.cwd();
  const elements = new Map();

  const getOrCreateElement = (id, tag = 'div') => {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(tag, id));
    }
    return elements.get(id);
  };

  // Pre-seed critical DOM elements
  const toastContainer = getOrCreateElement('toast-container', 'div');
  const deleteModal = getOrCreateElement('delete-confirm-modal', 'div');
  const deleteItemName = getOrCreateElement('delete-confirm-item-name', 'p');
  const undoBanner = getOrCreateElement('undo-banner', 'div');
  undoBanner.classList.add('hidden');
  const undoText = getOrCreateElement('undo-text', 'span');
  const cartBadge = getOrCreateElement('cart-badge', 'span');
  const appView = getOrCreateElement('app-view', 'main');
  const psaModal = getOrCreateElement('psa-guide-modal', 'div');
  const paymentModal = getOrCreateElement('payment-modal', 'div');
  const paymentModalText = getOrCreateElement('payment-modal-text', 'p');
  const paymentProgressBar = getOrCreateElement('payment-progress-bar', 'div');

  // Pre-seed checkout input elements
  const guestName = getOrCreateElement('guest-name', 'input');
  const guestId = getOrCreateElement('guest-id', 'input');
  const guestIdError = getOrCreateElement('guest-id-error', 'p');
  guestIdError.classList.add('hidden');
  const guestEmail = getOrCreateElement('guest-email', 'input');
  const guestPhone = getOrCreateElement('guest-phone', 'input');
  const guestAddress = getOrCreateElement('guest-address', 'input');
  const guestCity = getOrCreateElement('guest-city', 'input');
  const checkoutPassword = getOrCreateElement('checkout-password', 'input');
  const guestPassword = getOrCreateElement('guest-password', 'input');
  const cardNumber = getOrCreateElement('card-number', 'input');

  const paymentRadioCard = new MockElement('input');
  paymentRadioCard.value = 'card';
  paymentRadioCard.checked = true;

  const clock = new VirtualClock();

  const localStorageData = new Map();
  const mockLocalStorage = {
    getItem: (k) => localStorageData.has(k) ? localStorageData.get(k) : null,
    setItem: (k, v) => localStorageData.set(k, String(v)),
    removeItem: (k) => localStorageData.delete(k),
    clear: () => localStorageData.clear()
  };

  const doc = {
    readyState: 'complete',
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => new MockElement(tag),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      if (sel.includes('payment-method')) return paymentRadioCard;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const win = {
    document: doc,
    location: { hash: '#home' },
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: mockLocalStorage,
    requestAnimationFrame: (cb) => clock.setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clock.clearTimeout(id)
  };

  const context = {
    window: win,
    document: doc,
    localStorage: mockLocalStorage,
    console,
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: (id) => clock.clearTimeout(id),
    lucide: { createIcons: () => {} },
    HomeView: { render: () => '<div id="home-view"></div>' },
    CatalogView: { render: () => '<div id="catalog-view"></div>' },
    PDPView: { render: () => '<div id="pdp-view"></div>', afterRender: () => {} },
    ProfileView: { render: () => '<div id="profile-view"></div>' },
    TrackingView: { render: () => '<div id="tracking-view"></div>' },
    Math,
    Date,
    JSON,
    URLSearchParams
  };
  context.globalThis = context;
  vm.createContext(context);

  // Load production files
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8') + '\n; globalThis.PRODUCTS = PRODUCTS; globalThis.APP_CONFIG = APP_CONFIG;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8') + '\n; globalThis.Store = Store;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/cart.js'), 'utf8') + '\n; globalThis.CartView = CartView;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/checkout.js'), 'utf8') + '\n; globalThis.CheckoutView = CheckoutView;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8') + '\n; globalThis.app = app;', context);

  return {
    context,
    clock,
    doc,
    win,
    elements,
    Store: context.Store,
    app: context.app,
    CartView: context.CartView,
    CheckoutView: context.CheckoutView
  };
}

// ==============================================================================
// 1. TOAST SINGLETON LIFECYCLE TESTS
// ==============================================================================

test('Toast Singleton [Stress]: Rapid fire 100 toasts keeps DOM count strictly at 1', () => {
  const { app, doc } = createTestSandbox();
  const container = doc.getElementById('toast-container');

  for (let i = 0; i < 100; i++) {
    app.showToast(`Mensaje secuencial de prueba #${i}`, i % 2 === 0 ? 'success' : 'error');
    assert.equal(
      container.children.length,
      1,
      `Invariant violated at iteration ${i}: expected strictly 1 toast, found ${container.children.length}`
    );
  }

  // Final toast in DOM must be the 100th invocation
  const activeToast = container.children[0];
  assert.ok(activeToast, 'Toast element must exist in container');
  assert.ok(
    activeToast.innerHTML.includes('Mensaje secuencial de prueba #99'),
    'Container must retain the message from the 100th invocation'
  );
  assert.equal(activeToast.getAttribute('data-type'), 'error');
});

test('Toast Singleton [Lifecycle Timing]: 2490ms preserves toast, 2510ms triggers auto-dismiss, 2710ms clears DOM', () => {
  const { app, doc, clock } = createTestSandbox();
  const container = doc.getElementById('toast-container');

  app.showToast('Notificación con temporizador 2500ms', 'info');
  assert.equal(container.children.length, 1);
  const toast = container.children[0];

  // 1. Advance clock by 2490ms (< 2500ms specification threshold)
  clock.advanceTime(2490);
  assert.equal(container.children.length, 1, 'Toast must remain in DOM at 2490ms');
  assert.equal(toast.classList.contains('opacity-0'), false, 'Toast must NOT have dismissal opacity at 2490ms');

  // 2. Advance clock by 20ms (total 2510ms > 2500ms threshold)
  clock.advanceTime(20);
  assert.equal(container.children.length, 1, 'Toast element transitions out during 200ms exit window');
  assert.equal(toast.classList.contains('opacity-0'), true, 'Toast must have opacity-0 class applied at 2510ms');
  assert.equal(toast.classList.contains('translate-y-2'), true, 'Toast must have translate-y-2 dismissal class');

  // 3. Advance clock past the 200ms exit transition (total 2710ms)
  clock.advanceTime(200);
  assert.equal(container.children.length, 0, 'Toast must be completely removed from DOM after exit animation');
  assert.equal(toast.parentNode, null, 'Toast node must be unparented');
});

test('Toast Singleton [Adversarial Concurrency]: Burst interleaving with clock advances maintains singleton integrity', () => {
  const { app, doc, clock } = createTestSandbox();
  const container = doc.getElementById('toast-container');

  // Burst 1: 20 toasts
  for (let i = 0; i < 20; i++) {
    app.showToast(`Burst 1 - ${i}`, 'info');
    assert.equal(container.children.length, 1);
  }
  clock.advanceTime(1000); // 1000ms elapsed
  assert.equal(container.children.length, 1);

  // Burst 2: 30 toasts at t=1000ms
  for (let i = 0; i < 30; i++) {
    app.showToast(`Burst 2 - ${i}`, 'success');
    assert.equal(container.children.length, 1);
  }
  // Clock advance to t=3490ms (2490ms since Burst 2's last toast)
  clock.advanceTime(2490);
  assert.equal(container.children.length, 1);
  assert.equal(container.children[0].classList.contains('opacity-0'), false);

  // Advance by 30ms -> t=3520ms (2520ms since Burst 2)
  clock.advanceTime(30);
  assert.equal(container.children[0].classList.contains('opacity-0'), true);

  // Complete dismissal
  clock.advanceTime(200);
  assert.equal(container.children.length, 0);
});

// ==============================================================================
// 2. CART REMOVAL CONFIRMATION & UNDO LIFECYCLE TESTS
// ==============================================================================

test('Cart Removal [Modal Trigger]: Requesting removal opens modal and sets pending item without mutating cart', () => {
  const { app, doc, Store } = createTestSandbox();
  const modal = doc.getElementById('delete-confirm-modal');
  const itemNameEl = doc.getElementById('delete-confirm-item-name');

  Store.data.cart = [
    { id: 'charizard-psa10', name: 'Charizard Base Set', condition: 'PSA 10', price: 18500, quantity: 1 },
    { id: 'raichu-gx-psa9', name: 'Raichu GX', condition: 'PSA 9', price: 280, quantity: 2 },
    { id: 'team-rocket-box', name: 'Team Rocket Booster Box', condition: 'RAW', price: 1350, quantity: 1 }
  ];

  app.requestRemoveItem('raichu-gx-psa9');

  assert.equal(modal.classList.contains('active'), true, 'Modal must have active class');
  assert.equal(Store.data.pendingDeleteItemId, 'raichu-gx-psa9');
  assert.ok(
    itemNameEl.innerText.includes('Raichu GX'),
    'Modal description must include target item name'
  );
  assert.equal(Store.data.cart.length, 3, 'Cart items must NOT be removed prior to user confirmation');
});

test('Cart Removal [Cancellation]: Cancelling removal restores clean state without mutation', () => {
  const { app, doc, Store } = createTestSandbox();
  const modal = doc.getElementById('delete-confirm-modal');

  Store.data.cart = [
    { id: 'charizard-psa10', name: 'Charizard Base Set', condition: 'PSA 10', price: 18500, quantity: 1 }
  ];

  app.requestRemoveItem('charizard-psa10');
  assert.equal(modal.classList.contains('active'), true);
  assert.equal(Store.data.pendingDeleteItemId, 'charizard-psa10');

  app.cancelRemoveItem();
  assert.equal(modal.classList.contains('active'), false, 'Modal active class must be removed');
  assert.equal(Store.data.pendingDeleteItemId, null, 'Pending item must be reset to null');
  assert.equal(Store.data.cart.length, 1, 'Cart items must remain intact');
});

test('Cart Removal [Confirmation & Undo]: Confirm removal splices item, stores lastDeletedItem, undo restores exact index', () => {
  const { app, doc, Store } = createTestSandbox();
  const modal = doc.getElementById('delete-confirm-modal');
  const undoBanner = doc.getElementById('undo-banner');
  const undoText = doc.getElementById('undo-text');

  Store.data.cart = [
    { id: 'item-0', name: 'Charizard Base Set', condition: 'PSA 10', price: 18500, quantity: 1 },
    { id: 'item-1', name: 'Raichu GX', condition: 'PSA 9', price: 280, quantity: 2 },
    { id: 'item-2', name: 'Team Rocket Booster Box', condition: 'RAW', price: 1350, quantity: 1 }
  ];

  // 1. Request removal of middle item (index 1)
  app.requestRemoveItem('item-1');
  assert.equal(modal.classList.contains('active'), true);

  // 2. Confirm removal
  app.confirmRemoveItem();
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(Store.data.cart.length, 2);
  assert.deepEqual(Store.data.cart.map(c => c.id), ['item-0', 'item-2']);

  // Verify lastDeletedItem metadata
  assert.ok(Store.data.lastDeletedItem, 'lastDeletedItem must be stored in Store');
  assert.equal(Store.data.lastDeletedItem.item.id, 'item-1');
  assert.equal(Store.data.lastDeletedItem.index, 1, 'Must record exact original index 1');

  // Verify Undo banner visibility
  assert.equal(undoBanner.classList.contains('hidden'), false, 'Undo banner must be visible');
  assert.ok(undoText.innerText.includes('Raichu GX'), 'Undo text must reference deleted item name');

  // 3. Trigger Undo
  app.undoLastDeletion();

  // Verify exact index restoration
  assert.equal(Store.data.cart.length, 3, 'Cart length must return to 3');
  assert.equal(Store.data.cart[0].id, 'item-0');
  assert.equal(Store.data.cart[1].id, 'item-1', 'Item must be restored to its exact original index 1');
  assert.equal(Store.data.cart[2].id, 'item-2');

  // Verify state reset
  assert.equal(Store.data.lastDeletedItem, null, 'lastDeletedItem must be cleared to null');
  assert.equal(undoBanner.classList.contains('hidden'), true, 'Undo banner must be hidden after undo');
  assert.equal(Store.getCartCount(), 4, 'Cart count must reconcile: 1 + 2 + 1 = 4');
});

test('Cart Removal [Edge Case]: Empty cart restoration via Undo', () => {
  const { app, doc, Store } = createTestSandbox();
  const undoBanner = doc.getElementById('undo-banner');

  Store.data.cart = [
    { id: 'lone-card', name: 'Umbreon VMAX', condition: 'RAW', price: 650, quantity: 1 }
  ];

  // Delete only item
  app.requestRemoveItem('lone-card');
  app.confirmRemoveItem();

  assert.equal(Store.data.cart.length, 0, 'Cart must be empty');
  assert.equal(Store.getCartCount(), 0);
  assert.equal(undoBanner.classList.contains('hidden'), false);

  // Restore emptied cart
  app.undoLastDeletion();

  assert.equal(Store.data.cart.length, 1, 'Cart must be restored');
  assert.equal(Store.data.cart[0].id, 'lone-card');
  assert.equal(Store.getCartCount(), 1);
  assert.equal(undoBanner.classList.contains('hidden'), true);
});

test('Cart Removal [Edge Case]: Double undo is an idempotent safe no-op', () => {
  const { app, Store } = createTestSandbox();

  Store.data.cart = [{ id: 'card-1', name: 'Card 1', price: 50, quantity: 1 }];
  app.requestRemoveItem('card-1');
  app.confirmRemoveItem();

  // First undo
  app.undoLastDeletion();
  assert.equal(Store.data.cart.length, 1);
  assert.equal(Store.data.lastDeletedItem, null);

  // Second undo invocation
  assert.doesNotThrow(() => {
    app.undoLastDeletion();
  });
  assert.equal(Store.data.cart.length, 1, 'Double undo must not alter cart length');
  assert.equal(Store.data.lastDeletedItem, null);
});

// ==============================================================================
// 3. MANDATORY ACCOUNT REGISTRATION & CHECKOUT FLOW TESTS
// ==============================================================================

test('Mandatory Checkout [Validation 1]: Rejects checkout when password is missing or < 8 characters', async () => {
  const { CheckoutView, Store, doc } = createTestSandbox();

  Store.data.cart = [{ id: 'charizard', name: 'Charizard', price: 100, quantity: 1 }];
  Store.data.currentUser = null;

  doc.getElementById('guest-name').value = 'Carlos Mendoza';
  doc.getElementById('guest-email').value = 'carlos@pkm.ec';
  doc.getElementById('guest-id').value = '1710034065';
  doc.getElementById('guest-phone').value = '0991234567';
  doc.getElementById('card-number').value = '4532015112830366';

  // Subtest 1a: Empty password
  doc.getElementById('checkout-password').value = '';
  doc.getElementById('guest-password').value = '';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'No order should be placed without password');
  assert.equal(Store.data.currentUser, null, 'No session should be created');

  // Subtest 1b: Short password (length < 8)
  doc.getElementById('checkout-password').value = 'Abc1!';
  doc.getElementById('guest-password').value = 'Abc1!';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Password < 8 characters must be rejected');
  assert.equal(Store.data.currentUser, null);
});

test('Mandatory Checkout [Validation 2]: Rejects checkout with invalid Ecuadorian Cédula/RUC (Module 10)', async () => {
  const { CheckoutView, Store, doc } = createTestSandbox();

  Store.data.cart = [{ id: 'charizard', name: 'Charizard', price: 100, quantity: 1 }];
  Store.data.currentUser = null;

  doc.getElementById('guest-name').value = 'Carlos Mendoza';
  doc.getElementById('guest-email').value = 'carlos@pkm.ec';
  doc.getElementById('guest-phone').value = '0991234567';
  doc.getElementById('checkout-password').value = 'SecurePassword2026!';
  doc.getElementById('card-number').value = '4532015112830366';

  // Subtest 2a: Invalid check digit
  doc.getElementById('guest-id').value = '1710034069'; // Valid base, wrong check digit (must be 5)
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Cédula with invalid check digit must be rejected');
  assert.equal(Store.data.currentUser, null);

  // Subtest 2b: Invalid province code (25)
  doc.getElementById('guest-id').value = '2510034065';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Cédula with province > 24 must be rejected');
  assert.equal(Store.data.currentUser, null);

  // Subtest 2c: Invalid RUC (doesn't end in 001)
  doc.getElementById('guest-id').value = '1710034065002';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'RUC not ending in 001 must be rejected');
});

test('Mandatory Checkout [Validation 3]: Rejects checkout with invalid Ecuadorian phone (+593 prefix / 9 digits)', async () => {
  const { CheckoutView, Store, doc } = createTestSandbox();

  Store.data.cart = [{ id: 'charizard', name: 'Charizard', price: 100, quantity: 1 }];
  Store.data.currentUser = null;

  doc.getElementById('guest-name').value = 'Carlos Mendoza';
  doc.getElementById('guest-email').value = 'carlos@pkm.ec';
  doc.getElementById('guest-id').value = '1710034065';
  doc.getElementById('checkout-password').value = 'SecurePassword2026!';
  doc.getElementById('card-number').value = '4532015112830366';

  // Subtest 3a: Non-Ecuadorian phone / insufficient digits
  doc.getElementById('guest-phone').value = '123456';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Short phone must be rejected');

  // Subtest 3b: Excessive digits (> 10 digits)
  doc.getElementById('guest-phone').value = '099123456789999';
  await CheckoutView.processPayment();
  assert.equal(Store.data.orders.length, 0, 'Excessive phone digits must be rejected');
});

test('Mandatory Checkout [Validation 4]: Valid details + card ending in 0000 triggers #DECLINED-SEC-054 and routes to #error', async () => {
  const { CheckoutView, Store, doc, win } = createTestSandbox();

  Store.data.cart = [{ id: 'charizard', name: 'Charizard', price: 100, quantity: 1 }];
  Store.data.currentUser = null;

  doc.getElementById('guest-name').value = 'Carlos Mendoza';
  doc.getElementById('guest-email').value = 'carlos@pkm.ec';
  doc.getElementById('guest-id').value = '1710034065';
  doc.getElementById('guest-phone').value = '0991234567';
  doc.getElementById('checkout-password').value = 'SecurePassword2026!';

  // Card ending in '0000' that satisfies Luhn checksum: 4532015114830000
  doc.getElementById('card-number').value = '4532 0151 1483 0000';

  await CheckoutView.processPayment();

  // Must trigger simulated decline and route to error view
  assert.equal(win.location.hash, '#error', 'Must redirect to #error upon simulated bank decline');
  assert.equal(Store.data.orders.length, 0, 'No order record may be generated for declined card');
  assert.equal(Store.data.cart.length, 1, 'Cart items must be preserved so user can retry payment');
});

test('Mandatory Checkout [Validation 5]: Valid details + valid card creates order, empties cart, sets active session, routes to #confirmation', async () => {
  const { CheckoutView, Store, doc, win, clock } = createTestSandbox();

  Store.data.cart = [
    { id: 'charizard', name: 'Charizard Base Set', condition: 'PSA 10', price: 100, quantity: 2 }
  ];
  Store.data.currentUser = null;
  Store.data.deliveryMethod = 'courier'; // $5.00 national flat shipping

  doc.getElementById('guest-name').value = 'Carlos Mendoza';
  doc.getElementById('guest-email').value = 'carlos@pkm.ec';
  doc.getElementById('guest-id').value = '1710034065';
  doc.getElementById('guest-phone').value = '0991234567';
  doc.getElementById('guest-address').value = 'Av. Amazonas N24-196';
  doc.getElementById('guest-city').value = 'Quito';
  doc.getElementById('checkout-password').value = 'SecureCollector2026!';
  doc.getElementById('card-number').value = '4532 0151 1283 0366'; // Valid Luhn card

  await CheckoutView.processPayment();

  // Advance virtual clock through gateway processing simulation (800ms)
  clock.advanceTime(1000);

  // 1. Order Verification
  assert.equal(Store.data.orders.length, 1, 'Order must be placed');
  const createdOrder = Store.data.orders[0];
  assert.ok(createdOrder.orderId.startsWith('#PKM-2026-'));
  assert.equal(createdOrder.buyerId, '1710034065');
  assert.equal(createdOrder.buyerEmail, 'carlos@pkm.ec');
  assert.equal(createdOrder.subtotal, 200.00);
  assert.equal(createdOrder.tax, 30.00, '15% VAT on $200.00 must be $30.00');
  assert.equal(createdOrder.shipping, 5.00, 'National flat shipping must be $5.00');
  assert.equal(createdOrder.total, 235.00, 'Total must reconcile: $200 + $30 + $5 = $235.00');

  // 2. Mandatory Active Session Verification
  assert.ok(Store.data.currentUser, 'Active user session must be established');
  assert.equal(Store.data.currentUser.name, 'Carlos Mendoza');
  assert.equal(Store.data.currentUser.email, 'carlos@pkm.ec');
  assert.equal(Store.data.currentUser.idCard, '1710034065');
  assert.equal(Store.data.currentUser.has_account, true, 'User record must denote verified account registration');
  assert.equal(Store.data.currentUser.auth_tier, 'verified_collector');

  // 3. Cart State Cleaned & Route updated
  assert.equal(Store.data.cart.length, 0, 'Cart must be emptied upon successful checkout');
  assert.equal(win.location.hash, '#confirmation', 'Navigation must route to #confirmation view');
});
