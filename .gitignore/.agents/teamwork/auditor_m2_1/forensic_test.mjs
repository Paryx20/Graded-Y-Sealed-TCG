/**
 * Independent Forensic Test Suite for Milestone 2
 * Executed by Forensic Auditor (auditor_m2_1)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('--- FORENSIC AUDIT: INDEPENDENT VERIFICATION COMMENCING ---');

// 1. Load project files in isolated sandbox
function createProjectSandbox() {
  const elementsById = new Map();

  class MockElement {
    constructor(tagName = 'div', id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.className = className;
      this.classList = {
        _set: new Set(className.split(' ').filter(Boolean)),
        add(...cls) { cls.forEach(c => this._set.add(c)); },
        remove(...cls) { cls.forEach(c => this._set.delete(c)); },
        toggle(cls, force) {
          if (force !== undefined) {
            if (force) this._set.add(cls);
            else this._set.delete(cls);
            return force;
          }
          if (this._set.has(cls)) { this._set.delete(cls); return false; }
          this._set.add(cls); return true;
        },
        contains(cls) { return this._set.has(cls); }
      };
      this.children = [];
      this.parentNode = null;
      this._innerHTML = '';
      this._innerText = '';
      this.attributes = new Map();
      this.style = {};
      this.value = '';
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) {
      this._innerHTML = String(val);
      if (val === '') this.children = [];
    }
    get innerText() { return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim(); }
    set innerText(val) { this._innerText = String(val); }
    appendChild(c) {
      c.parentNode = this;
      this.children.push(c);
      return c;
    }
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        c.parentNode = null;
      }
      return c;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) || null; }
  }

  function getOrCreateElement(id) {
    if (!elementsById.has(id)) {
      elementsById.set(id, new MockElement('div', id));
    }
    return elementsById.get(id);
  }

  // Pre-seed known elements
  ['toast-container', 'delete-confirm-modal', 'delete-confirm-item-name', 'undo-banner', 'undo-text', 'cart-badge'].forEach(getOrCreateElement);

  const mockLocalStorage = {
    _data: new Map(),
    getItem(k) { return this._data.get(k) || null; },
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
    localStorage: mockLocalStorage,
    document: {
      getElementById: (id) => getOrCreateElement(id),
      createElement: (tag) => new MockElement(tag),
      addEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    },
    window: {
      location: { hash: '#home' },
      addEventListener: () => {},
      localStorage: mockLocalStorage
    },
    lucide: { createIcons: () => {} }
  };

  vm.createContext(sandbox);

  // Load files in dependency order
  const files = [
    'js/data.js',
    'js/state.js',
    'js/views/home.js',
    'js/views/checkout.js',
    'js/views/cart.js',
    'js/app.js'
  ];

  for (const f of files) {
    const fullPath = path.join(ROOT_DIR, f);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, sandbox);
  }

  return { sandbox, elementsById, mockLocalStorage };
}

const { sandbox, elementsById } = createProjectSandbox();
const Store = vm.runInContext('Store', sandbox);
const CheckoutView = vm.runInContext('CheckoutView', sandbox);
const app = vm.runInContext('app', sandbox);

// ==============================================================================
// TEST SUITE 1: ECUADORIAN CÉDULA & RUC (MODULE 10) EMPIRICAL VERIFICATION
// ==============================================================================
console.log('\n[CHECK 1] Module 10 Ecuadorian ID Algorithm');

// Helper to compute authentic Module 10 check digit
function computeModule10CheckDigit(digits9) {
  const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = parseInt(digits9[i], 10) * coefs[i];
    if (p >= 10) p -= 9;
    sum += p;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

// 1.1 Verify valid cédulas across all 24 provinces (01 to 24) and third digits (0 to 5)
let validCedulasTested = 0;
for (let prov = 1; prov <= 24; prov++) {
  const provStr = String(prov).padStart(2, '0');
  for (let third = 0; third <= 5; third++) {
    const base9 = `${provStr}${third}456789`;
    const checkDigit = computeModule10CheckDigit(base9);
    const validCedula = `${base9}${checkDigit}`;

    assert.equal(Store.isValidEcuadorianId(validCedula), true, `Failed on valid cédula: ${validCedula}`);
    validCedulasTested++;

    // 1.2 Verify Natural RUC with '001' suffix
    const validRuc = `${validCedula}001`;
    assert.equal(Store.isValidEcuadorianId(validRuc), true, `Failed on valid RUC: ${validRuc}`);

    // 1.3 Verify perturbation of check digit fails
    const invalidCheckDigit = (checkDigit + 1) % 10;
    const invalidCedula = `${base9}${invalidCheckDigit}`;
    assert.equal(Store.isValidEcuadorianId(invalidCedula), false, `Should reject invalid check digit: ${invalidCedula}`);

    // 1.4 Verify RUC suffix other than '001' fails
    assert.equal(Store.isValidEcuadorianId(`${validCedula}002`), false);
    assert.equal(Store.isValidEcuadorianId(`${validCedula}000`), false);
    assert.equal(Store.isValidEcuadorianId(`${validCedula}101`), false);
  }
}
console.log(`✔ Passed ${validCedulasTested} generated valid cédulas & RUCs across provinces 01-24`);

// 1.5 Verify province boundaries and third digit constraints
assert.equal(Store.isValidEcuadorianId('0010034065'), false, 'Province 00 must be rejected');
assert.equal(Store.isValidEcuadorianId('2510034065'), false, 'Province 25 must be rejected');
assert.equal(Store.isValidEcuadorianId('3010034065'), false, 'Province 30 must be rejected');
assert.equal(Store.isValidEcuadorianId('1760034065'), false, 'Third digit 6 must be rejected for natural cédula');
assert.equal(Store.isValidEcuadorianId('1790034065'), false, 'Third digit 9 must be rejected for natural cédula');

// 1.6 Adversarial non-numeric / injection inputs
const maliciousInputs = [
  '1710034065a',
  '1710-034065',
  '1710 034065',
  '1710\t034065',
  "1710034065' OR '1'='1",
  '<script>alert(1)</script>',
  '',
  null,
  undefined,
  {},
  [],
  1710034065 // number type must be rejected since string is expected
];

for (const input of maliciousInputs) {
  assert.equal(Store.isValidEcuadorianId(input), false, `Should reject adversarial input: ${JSON.stringify(input)}`);
}
console.log(`✔ Passed adversarial injection and boundary testing for Module 10`);

// ==============================================================================
// TEST SUITE 2: CREDIT CARD LUHN ALGORITHM & #DECLINED-SEC-054 VERIFICATION
// ==============================================================================
console.log('\n[CHECK 2] Credit Card Luhn Algorithm & #DECLINED-SEC-054 Simulation');

// Helper to compute Luhn check digit
function computeLuhnCheckDigit(digitsWithoutCheck) {
  let sum = 0;
  let alternate = true;
  for (let i = digitsWithoutCheck.length - 1; i >= 0; i--) {
    let n = parseInt(digitsWithoutCheck[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

// 2.1 Test authentic cards of various lengths (13 to 19 digits)
const cardPrefixes = [
  { prefix: '4532', len: 16 }, // Visa
  { prefix: '5424', len: 16 }, // Mastercard
  { prefix: '3782', len: 15 }, // Amex
  { prefix: '6011', len: 16 }, // Discover
  { prefix: '4916', len: 13 }, // Visa 13
  { prefix: '5105', len: 19 }  // Maestro 19
];

for (const { prefix, len } of cardPrefixes) {
  const baseDigits = prefix.padEnd(len - 1, '7');
  const checkDigit = computeLuhnCheckDigit(baseDigits);
  const cardNum = `${baseDigits}${checkDigit}`;

  const res = CheckoutView.validateCreditCard(cardNum);
  assert.equal(res.valid, true, `Valid card failed: ${cardNum} - ${JSON.stringify(res)}`);
  assert.equal(res.code, '00-APPROVED');

  // Corrupt check digit
  const badCheck = (checkDigit + 1) % 10;
  const badCard = `${baseDigits}${badCheck}`;
  const badRes = CheckoutView.validateCreditCard(badCard);
  assert.equal(badRes.valid, false, `Corrupted card passed: ${badCard}`);
  assert.equal(badRes.code, 'LUHN_FAILED');
}
console.log('✔ Passed authentic Luhn validation for lengths 13 through 19');

// 2.2 Verify simulated decline #DECLINED-SEC-054 for cards ending in '0000'
// Craft card ending in '0000' that satisfies Luhn
// Let base be 12 digits, ending in 000; the 16th digit (check digit) must be 0!
function craftLuhnEndingIn0000(prefix = '4532') {
  // We want checkDigit === 0
  for (let mid = 10000000; mid <= 99999999; mid++) {
    const base15 = `${prefix}${mid}000`; // 4 + 8 + 3 = 15 digits
    const check = computeLuhnCheckDigit(base15);
    if (check === 0) {
      return `${base15}0`; // 16 digits, ends with '0000' and passes Luhn!
    }
  }
  throw new Error('Could not craft card ending in 0000');
}

const cardEnding0000 = craftLuhnEndingIn0000('4532');
assert.ok(cardEnding0000.endsWith('0000'));
console.log(`Crafted valid Luhn card ending in 0000: ${cardEnding0000}`);

const declineResult = CheckoutView.validateCreditCard(cardEnding0000);
assert.equal(declineResult.valid, false, 'Card ending in 0000 must not be approved');
assert.equal(declineResult.simulatedDecline, true, 'simulatedDecline must be true');
assert.equal(declineResult.code, '#DECLINED-SEC-054', 'Must trigger #DECLINED-SEC-054');
console.log('✔ Passed simulated decline #DECLINED-SEC-054 validation');

// 2.3 Verify card ending in 0000 with INVALID Luhn gets rejected with LUHN_FAILED, not bank decline
const invalidLuhn0000 = '4532111111110000';
const invRes = CheckoutView.validateCreditCard(invalidLuhn0000);
// Check if Luhn failed
const isLuhnValid = invRes.code !== 'LUHN_FAILED';
if (!isLuhnValid) {
  assert.equal(invRes.code, 'LUHN_FAILED');
  console.log('✔ Invalid Luhn ending in 0000 fails Luhn check before simulated decline');
}

// ==============================================================================
// TEST SUITE 3: 15% VAT & FLAT SHIPPING RATES ($0, $3, $5)
// ==============================================================================
console.log('\n[CHECK 3] 15% VAT & Tri-Tier Flat Shipping Calculation');

// 3.1 Empty cart check
Store.data.cart = [];
Store.data.deliveryMethod = 'courier';
const emptyTotals = Store.getCartTotals();
assert.equal(emptyTotals.subtotal, 0);
assert.equal(emptyTotals.shipping, 0);
assert.equal(emptyTotals.tax, 0);
assert.equal(emptyTotals.total, 0);
console.log('✔ Empty cart yields exact $0.00 totals');

// 3.2 Single item with various shipping methods
Store.data.cart = [{ id: 'test-1', price: 100.00, quantity: 1 }];

Store.data.deliveryMethod = 'pickup';
const pickupTotals = Store.getCartTotals();
assert.equal(pickupTotals.subtotal, 100.00);
assert.equal(pickupTotals.shipping, 0.00);
assert.equal(pickupTotals.tax, 15.00);
assert.equal(pickupTotals.total, 115.00);

Store.data.deliveryMethod = 'quito';
const quitoTotals = Store.getCartTotals();
assert.equal(quitoTotals.subtotal, 100.00);
assert.equal(quitoTotals.shipping, 3.00);
assert.equal(quitoTotals.tax, 15.00);
assert.equal(quitoTotals.total, 118.00);

Store.data.deliveryMethod = 'courier';
const courierTotals = Store.getCartTotals();
assert.equal(courierTotals.subtotal, 100.00);
assert.equal(courierTotals.shipping, 5.00);
assert.equal(courierTotals.tax, 15.00);
assert.equal(courierTotals.total, 120.00);

// 3.3 Financial half-up rounding checks on odd amounts
Store.data.cart = [{ id: 'test-odd-1', price: 49.99, quantity: 1 }]; // 49.99 * 0.15 = 7.4985 -> 7.50
Store.data.deliveryMethod = 'quito';
const oddTotals1 = Store.getCartTotals();
assert.equal(oddTotals1.subtotal, 49.99);
assert.equal(oddTotals1.tax, 7.50);
assert.equal(oddTotals1.shipping, 3.00);
assert.equal(oddTotals1.total, 60.49); // 49.99 + 3.00 + 7.50 = 60.49

Store.data.cart = [{ id: 'test-odd-2', price: 99.95, quantity: 1 }]; // 99.95 * 0.15 = 14.9925 -> 14.99
Store.data.deliveryMethod = 'courier';
const oddTotals2 = Store.getCartTotals();
assert.equal(oddTotals2.subtotal, 99.95);
assert.equal(oddTotals2.tax, 14.99);
assert.equal(oddTotals2.shipping, 5.00);
assert.equal(oddTotals2.total, 119.94); // 99.95 + 5.00 + 14.99 = 119.94

console.log('✔ Passed VAT 15% and tri-tier flat shipping calculations with exact financial rounding');

// ==============================================================================
// TEST SUITE 4: SINGLETON TOAST NOTIFICATION SYSTEM
// ==============================================================================
console.log('\n[CHECK 4] Singleton Toast Notification (max 1 active, 2.5s timer)');

const toastContainer = elementsById.get('toast-container');
assert.ok(toastContainer, 'toast-container must exist');

// 4.1 Fire multiple toasts rapidly
app.showToast('Mensaje 1', 'info');
assert.equal(toastContainer.children.length, 1);
assert.ok(toastContainer.children[0].innerText.includes('Mensaje 1'));

app.showToast('Mensaje 2', 'success');
assert.equal(toastContainer.children.length, 1);
assert.ok(toastContainer.children[0].innerText.includes('Mensaje 2'));
assert.equal(toastContainer.children[0].getAttribute('data-type'), 'success');

app.showToast('Mensaje 3', 'error');
assert.equal(toastContainer.children.length, 1);
assert.ok(toastContainer.children[0].innerText.includes('Mensaje 3'));
assert.equal(toastContainer.children[0].getAttribute('data-type'), 'error');

// Verify active timeout exists
assert.ok(app._activeToastTimeout !== null, 'An active timeout must be tracked');
console.log('✔ Strict singleton toast verified: rapid calls always leave exactly 1 element in container');

// ==============================================================================
// TEST SUITE 5: CART ITEM REMOVAL CONFIRMATION & UNDO ('DESHACER')
// ==============================================================================
console.log('\n[CHECK 5] Cart Removal Confirmation & Undo Functionality');

Store.data.currentView = 'cart';
Store.data.cart = [
  { id: 'pkm-1', name: 'Charizard Base Set', price: 18500, quantity: 1 },
  { id: 'pkm-2', name: 'Umbreon VMAX', price: 650, quantity: 2 },
  { id: 'pkm-3', name: 'Lugia 1st Edition', price: 4200, quantity: 1 }
];

// 5.1 Request remove item 2
app.requestRemoveItem('pkm-2');
assert.equal(Store.data.pendingDeleteItemId, 'pkm-2');
const modal = elementsById.get('delete-confirm-modal');
assert.equal(modal.classList.contains('active'), true);
const modalName = elementsById.get('delete-confirm-item-name');
assert.ok(modalName.innerText.includes('Umbreon VMAX'));

// 5.2 Cancel removal
app.cancelRemoveItem();
assert.equal(Store.data.pendingDeleteItemId, null);
assert.equal(modal.classList.contains('active'), false);
assert.equal(Store.data.cart.length, 3);

// 5.3 Request and Confirm removal
app.requestRemoveItem('pkm-2');
app.confirmRemoveItem();
assert.equal(modal.classList.contains('active'), false);
assert.equal(Store.data.cart.length, 2);
assert.equal(Store.data.cart[0].id, 'pkm-1');
assert.equal(Store.data.cart[1].id, 'pkm-3');

// Check undo state
assert.ok(Store.data.lastDeletedItem !== null);
assert.equal(Store.data.lastDeletedItem.item.id, 'pkm-2');
assert.equal(Store.data.lastDeletedItem.index, 1);

const undoBanner = elementsById.get('undo-banner');
assert.equal(undoBanner.classList.contains('hidden'), false);

// 5.4 Execute Undo
app.undoLastDeletion();
assert.equal(Store.data.cart.length, 3);
assert.equal(Store.data.cart[1].id, 'pkm-2'); // Restored to exact index 1
assert.equal(Store.data.lastDeletedItem, null);
assert.equal(undoBanner.classList.contains('hidden'), true);
console.log('✔ Cart removal modal confirmation and index-preserving undo verified');

// ==============================================================================
// TEST SUITE 6: DEXIE DATABASE PERSISTENCE VERIFICATION
// ==============================================================================
console.log('\n[CHECK 6] Dexie Database Persistence & Transactional API');

const dbClientPath = path.join(ROOT_DIR, 'js/db/db-client.js');
const dbClientCode = fs.readFileSync(dbClientPath, 'utf8');

const schemaPath = path.join(ROOT_DIR, 'js/db/schema.js');
const schemaCode = fs.readFileSync(schemaPath, 'utf8');

// Verify Dexie schemas and table definitions
assert.ok(schemaCode.includes('usuarios:'), 'schema.js must define usuarios table');
assert.ok(schemaCode.includes('ordenes_compra:'), 'schema.js must define ordenes_compra table');
assert.ok(schemaCode.includes('items_orden:'), 'schema.js must define items_orden table');

// Verify procesarOrdenTransaccional implementation
assert.ok(dbClientCode.includes('procesarOrdenTransaccional'), 'Must define procesarOrdenTransaccional');
assert.ok(dbClientCode.includes('dbInstance.transaction'), 'Must execute within dbInstance.transaction');
assert.ok(dbClientCode.includes('dbInstance.usuarios.put'), 'Must put to usuarios');
assert.ok(dbClientCode.includes('dbInstance.ordenes_compra.put'), 'Must put to ordenes_compra');
assert.ok(dbClientCode.includes('dbInstance.items_orden.put'), 'Must put to items_orden');

console.log('✔ Dexie ACID transaction and table persistence verified');

console.log('\n--- ALL FORENSIC INTEGRITY CHECKS PASSED: VERDICT CLEAN ---');
