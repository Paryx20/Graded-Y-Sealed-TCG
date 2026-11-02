/**
 * ==============================================================================
 * Acceptance Test Suite: Dynamic Condition/Grade Pricing Updates on PDP (Requirement R2)
 * File: tests/test_condition_pricing.test.mjs
 * 
 * Verifies:
 * 1. Immediate in-place DOM update for #pdp-price on condition selection
 * 2. Active button styling and checkmark indicator updates without full re-render
 * 3. 3D canvas preservation (zero destructive re-renders on condition change)
 * 4. Defensive condition pricing engine (1.0x, 1.35x, 2.10x, 5.20x) for API cards
 * 5. Accurate cart addition synchronization (SKU, condition title, dynamic price)
 * 6. User feedback toast notification synchronization
 * 7. Sealed product pricing immunity from condition grade changes
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createPricingEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const elements = new Map();

  class MockDOMElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.className = '';
      this.innerText = '';
      this._innerHTML = '';
      this.children = [];
      this.style = {};
      this.attributes = new Map();
      if (id) elements.set(id, this);
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) { this._innerHTML = val; }

    setAttribute(k, v) { this.attributes.set(k, v); }
    getAttribute(k) { return this.attributes.get(k); }

    querySelector(sel) {
      if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
      if (sel === 'i') return this.children.find(c => c.tagName === 'I') || null;
      if (sel === 'div:first-child') return this.children[0] || null;
      if (sel === 'div:last-child') return this.children[this.children.length - 1] || null;
      return null;
    }

    querySelectorAll(sel) {
      if (sel === 'button') return this.children.filter(c => c.tagName === 'BUTTON');
      return [];
    }

    insertAdjacentHTML(pos, html) {
      if (html.includes('<i')) {
        const iconEl = new MockDOMElement('', 'i');
        iconEl.setAttribute('data-lucide', 'check');
        this.children.push(iconEl);
      }
    }

    remove() {
      // Remove self from parent children
      elements.delete(this.id);
    }
  }

  // Setup DOM elements
  const priceEl = new MockDOMElement('pdp-price', 'span');
  priceEl.innerText = '$18,500.00 USD';

  const certBadgeEl = new MockDOMElement('pdp-cert-badge', 'span');
  certBadgeEl.innerText = 'PSA 10 GEM MT • #48291034';

  const sceneEl = new MockDOMElement('pdp-3d-scene', 'div');
  const cardObjEl = new MockDOMElement('pdp-3d-object', 'div');
  cardObjEl.style = { transform: 'perspective(1000px) rotateX(15.00deg) rotateY(45.00deg)' };

  const radiogroup = new MockDOMElement('', 'div');
  radiogroup.setAttribute('role', 'radiogroup');
  radiogroup.setAttribute('aria-label', 'Condición de la carta');

  ['raw', 'psa8', 'psa9', 'psa10'].forEach((key) => {
    const btn = new MockDOMElement('', 'button');
    const header = new MockDOMElement('', 'div');
    header.innerText = key.toUpperCase();
    const priceDiv = new MockDOMElement('', 'div');
    priceDiv.innerText = '$0.00';
    btn.children = [header, priceDiv];
    radiogroup.children.push(btn);
  });

  const cartHistory = [];
  const toastHistory = [];
  let fullReRenderCount = 0;

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    document: {
      getElementById: (id) => elements.get(id) || null,
      querySelector: (sel) => {
        if (sel.includes('radiogroup')) return radiogroup;
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        return null;
      },
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    app: {
      renderCurrentView: () => { fullReRenderCount++; },
      showToast: (msg, type) => { toastHistory.push({ msg, type }); },
      addToCart: (sku, name, label, price, img, fallback, qty) => {
        cartHistory.push({ sku, name, label, price, img, fallback, qty });
      }
    }
  };

  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);

  return {
    sandbox,
    Store: sandbox.Store,
    PDPView: sandbox.PDPView,
    priceEl,
    certBadgeEl,
    cardObjEl,
    radiogroup,
    cartHistory,
    toastHistory,
    getFullReRenderCount: () => fullReRenderCount
  };
}

test('R2 Pricing [Test 2.1]: Selecting condition immediately updates #pdp-price in DOM without wiping 3D scene', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, priceEl, cardObjEl, getFullReRenderCount } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;
  // Product pricing: raw: 750, psa8: 1200, psa9: 3500, psa10: 18500

  // Select Raw
  PDPView.selectCondition('raw');
  assert.equal(Store.data.pdpSelectedCondition, 'raw');
  assert.ok(priceEl.innerText.includes('$750.00 USD'), `Expected $750.00 USD, got: ${priceEl.innerText}`);
  assert.equal(getFullReRenderCount(), 0, 'Must NOT trigger destructive full view re-render');
  assert.equal(cardObjEl.style.transform, 'perspective(1000px) rotateX(15.00deg) rotateY(45.00deg)', '3D rotation state must be preserved');

  // Select PSA 8
  PDPView.selectCondition('psa8');
  assert.ok(priceEl.innerText.includes('$1,800.00 USD'), `Expected $1,800.00 USD, got: ${priceEl.innerText}`);
  assert.equal(getFullReRenderCount(), 0);

  // Select PSA 9
  PDPView.selectCondition('psa9');
  assert.ok(priceEl.innerText.includes('$4,850.00 USD'), `Expected $4,850.00 USD, got: ${priceEl.innerText}`);
  assert.equal(getFullReRenderCount(), 0);

  // Select PSA 10
  PDPView.selectCondition('psa10');
  assert.ok(priceEl.innerText.includes('$18,500.00 USD'), `Expected $18,500.00 USD, got: ${priceEl.innerText}`);
  assert.equal(getFullReRenderCount(), 0);
});

test('R2 Pricing [Test 2.2]: Active condition button receives highlight class and certification badge updates', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, certBadgeEl, radiogroup } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  PDPView.selectCondition('psa9');

  // Verify badge
  assert.ok(certBadgeEl.innerText.includes('PSA 9 MINT'), 'Cert badge must display PSA 9 MINT');
  assert.ok(certBadgeEl.innerText.includes(product.certNumber), 'Cert badge must retain certification serial');

  // Verify radiogroup button styles
  const buttons = radiogroup.querySelectorAll('button');
  const psa9Btn = buttons[2]; // index 2 is psa9
  const rawBtn = buttons[0];

  assert.ok(psa9Btn.className.includes('bg-[#0F172A]'), 'Selected condition button must have active dark background');
  assert.ok(rawBtn.className.includes('bg-white'), 'Unselected condition button must have inactive white background');
});

test('R2 Pricing [Test 2.3]: Defensive pricing engine calculates deterministic condition tiers when precios is missing', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, priceEl } = env;

  // External card without explicit precios dictionary
  const apiCard = {
    id: 'tcgdex-lugia-neo',
    nombre: 'Lugia Neo Genesis',
    set: 'Neo Genesis',
    rareza: 'Holo Rare',
    precioEstimado: 100, // Base Price = 100
    imagen: 'img/cards/card-back.png'
  };

  const registeredProduct = Store.registerApiCard(apiCard);
  // Remove precios to test runtime defensive calculation in PDPView
  delete registeredProduct.precios;
  Store.data.currentPdpProduct = registeredProduct;

  const prices = PDPView.getConditionPrices(registeredProduct);
  assert.equal(prices.raw, 100, 'Raw tier must equal base price (100 * 1.0)');
  assert.equal(prices.psa8, 135, 'PSA 8 tier must equal 1.35x (100 * 1.35)');
  assert.equal(prices.psa9, 210, 'PSA 9 tier must equal 2.10x (100 * 2.10)');
  assert.equal(prices.psa10, 520, 'PSA 10 tier must equal 5.20x (100 * 5.20)');

  // Select PSA 8
  PDPView.selectCondition('psa8');
  assert.ok(priceEl.innerText.includes('$135.00 USD'));

  // Select PSA 10
  PDPView.selectCondition('psa10');
  assert.ok(priceEl.innerText.includes('$520.00 USD'));
});

test('R2 Pricing [Test 2.4]: Selected condition grade and dynamic price transfer accurately to cart upon addition', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, cartHistory } = env;

  const product = Store.getProduct('umbreon-vmax');
  Store.data.currentPdpProduct = product;
  // Umbreon prices in data.js: raw: 650, psa8: 720, psa9: 890, psa10: 1350

  // Select PSA 8 and set quantity to 2
  PDPView.selectCondition('psa8');
  Store.data.pdpQuantity = 2;

  PDPView.addToCart();

  assert.equal(cartHistory.length, 1);
  const cartItem = cartHistory[0];
  assert.equal(cartItem.sku, 'umbreon-vmax-psa8', 'SKU must include selected grade');
  assert.equal(cartItem.price, 720, 'Price must match selected condition price ($720)');
  assert.equal(cartItem.qty, 2, 'Quantity must be preserved');
  assert.ok(cartItem.label.includes('PSA 8 NM-MT'), 'Label must state PSA 8');
});

test('R2 Pricing [Test 2.5]: Toast notification triggers on condition selection with formatted grade and price', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, toastHistory } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  PDPView.selectCondition('psa9');

  assert.equal(toastHistory.length, 1);
  assert.equal(toastHistory[0].type, 'info');
  assert.ok(toastHistory[0].msg.includes('PSA9'), 'Toast must mention grade');
  assert.ok(toastHistory[0].msg.includes('$4,850.00'), 'Toast must display formatted price $4,850.00');
});

test('R2 Pricing [Test 2.6]: Sealed product preserves unit price and factory seal label on cart addition', () => {
  const env = createPricingEnvironment();
  const { Store, PDPView, cartHistory } = env;

  const sealedProduct = Store.getProduct('booster-team-rocket');
  Store.data.currentPdpProduct = sealedProduct;
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(cartHistory.length, 1);
  const cartItem = cartHistory[0];
  assert.equal(cartItem.sku, 'booster-team-rocket-sealed');
  assert.equal(cartItem.price, 3500);
  assert.equal(cartItem.label, 'Sellado de Fábrica (Caja Intacta)');
});
