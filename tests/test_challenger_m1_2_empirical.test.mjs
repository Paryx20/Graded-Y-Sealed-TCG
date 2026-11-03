/**
 * ==============================================================================
 * Challenger 2 Empirical Adversarial Test Suite: Milestone 1 Boundary Conditions
 * File: tests/test_challenger_m1_2_empirical.test.mjs
 * 
 * Challenge Scope:
 * 1. File path with space: `img/sealed/Paquete fossil.png` URI encoding & HTML quotes
 * 2. Spelling of Mewtwo file: `mewto-holo-rare.png` exact disk match vs codebase
 * 3. Fallback simulation: `onerror` execution, recursion immunity, and fallback paths
 * 4. Cart addition & removal: thumbnail path preservation across lifecycles
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();

/**
 * Helper to build an isolated DOM sandbox with Store, App, and Views
 */
function createSandbox() {
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');
  const catalogCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/catalog.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  const cartCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/cart.js'), 'utf8');
  const homeCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/home.js'), 'utf8');

  const storageMap = new Map();
  const mockLocalStorage = {
    getItem: (k) => storageMap.get(k) ?? null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear()
  };

  const elements = new Map();
  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.className = '';
      this.innerText = '';
      this._innerHTML = '';
      this.children = [];
      this.attributes = new Map();
      this.style = {};
      this.classList = {
        add: () => {},
        remove: () => {},
        toggle: () => {},
        contains: () => false
      };
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) { this._innerHTML = String(val); }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) ?? null; }
    hasAttribute(k) { return this.attributes.has(k); }
    appendChild(c) { this.children.push(c); return c; }
    addEventListener() {}
    removeEventListener() {}
  }

  function getOrCreateElement(id, tag = 'div') {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(id, tag));
    }
    return elements.get(id);
  }

  const mockDocument = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      return new MockElement('', sel);
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: new MockElement('body', 'body')
  };

  const mockWindow = {
    location: { hash: '#home' },
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    innerWidth: 1200
  };

  const sandbox = {
    console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    document: mockDocument,
    window: mockWindow,
    localStorage: mockLocalStorage,
    navigator: { userAgent: 'NodeTest' },
    lucide: { createIcons: () => {} }
  };

  vm.createContext(sandbox);

  // Load scripts in order
  vm.runInContext(dataCode, sandbox);
  vm.runInContext(stateCode, sandbox);
  vm.runInContext(appCode, sandbox);
  vm.runInContext(catalogCode, sandbox);
  vm.runInContext(pdpCode, sandbox);
  vm.runInContext(cartCode, sandbox);
  vm.runInContext(homeCode, sandbox);

  return sandbox;
}

// ============================================================================
// CHALLENGE 1: File path with space (`img/sealed/Paquete fossil.png`)
// ============================================================================

test('CH-01: Asset file `img/sealed/Paquete fossil.png` exists with correct casing and non-zero bytes', () => {
  const filePath = path.join(ROOT_DIR, 'img/sealed/Paquete fossil.png');
  assert.ok(fs.existsSync(filePath), 'File `img/sealed/Paquete fossil.png` must exist physically on disk');
  
  const stats = fs.statSync(filePath);
  assert.ok(stats.size > 500000, `File size (${stats.size} bytes) must be substantial for a high-res image`);

  // Verify exact casing in directory listing
  const dirFiles = fs.readdirSync(path.join(ROOT_DIR, 'img/sealed'));
  assert.ok(dirFiles.includes('Paquete fossil.png'), 'Directory must contain exact casing `Paquete fossil.png`');
});

test('CH-02: `img/sealed/Paquete fossil.png` URL round-trip encoding does not corrupt disk resolution', () => {
  const relPath = 'img/sealed/Paquete fossil.png';
  const encoded = encodeURI(relPath);
  assert.equal(encoded, 'img/sealed/Paquete%20fossil.png', 'Space must encode to %20');

  const decoded = decodeURIComponent(encoded);
  assert.equal(decoded, relPath, 'Decoded URI must match original disk path exactly');

  const absoluteDiskPath = path.resolve(ROOT_DIR, decoded);
  assert.ok(fs.existsSync(absoluteDiskPath), 'Decoded URI path must resolve to existing disk file');
});

test('CH-03: `js/data.js` product `booster-box-fossil-1999` specifies space path across all gallery fields', () => {
  const { PRODUCTS } = createSandbox();
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
  assert.ok(fossil, 'Product booster-box-fossil-1999 must exist in catalog');

  assert.equal(fossil.imagenLocal, 'img/sealed/Paquete fossil.png');
  assert.equal(fossil.imagenFallbackUrl, 'img/sealed/Paquete fossil.png');
  assert.ok(fossil.galeria_sellada, 'Must have galeria_sellada');
  assert.equal(fossil.galeria_sellada.frontal, 'img/sealed/booster-box-fossil-1999/frontal.svg');
  assert.equal(fossil.galeria_sellada.perspectiva, 'img/sealed/Paquete fossil.png');
  assert.equal(fossil.galeria_sellada.lateral, 'img/sealed/booster-box-fossil-1999/lateral.svg');
  assert.equal(fossil.galeria_sellada.superior, 'img/sealed/booster-box-fossil-1999/superior.svg');
});

test('CH-04: `CatalogView.render()` quotes `src="img/sealed/Paquete fossil.png"` preventing attribute truncation', () => {
  const { CatalogView, Store } = createSandbox();
  Store.data.catalogFilters = {
    category: 'all',
    era: 'all',
    condition: 'all',
    type: 'all',
    minPrice: '',
    maxPrice: '',
    searchQuery: 'fossil',
    sortBy: 'default'
  };

  const html = CatalogView.render();
  assert.ok(html.includes('Paquete fossil.png'), 'CatalogView output must include Paquete fossil.png');

  // Verify that the src attribute is strictly quoted with double quotes
  assert.ok(
    html.includes('src="img/sealed/Paquete fossil.png"'),
    'src attribute must be strictly double-quoted to prevent space from terminating attribute'
  );

  // Verify no unquoted space truncation occurred (e.g. src=img/sealed/Paquete fossil.png)
  assert.ok(
    !html.includes('src=img/sealed/Paquete fossil.png'),
    'Must NOT contain unquoted attribute with space'
  );
});

test('CH-05: `PDPView.renderSealedGalleryStage()` quotes image src across all gallery angles', () => {
  const { PDPView, PRODUCTS } = createSandbox();
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');

  // La foto real es la vista en perspectiva; un ángulo desconocido cae en ella
  const angles = ['perspectiva', 'unknown_angle'];
  for (const angle of angles) {
    const html = PDPView.renderSealedGalleryStage(fossil, angle);
    assert.ok(
      html.includes('src="img/sealed/Paquete fossil.png"'),
      `Angle ${angle} must render double-quoted src="img/sealed/Paquete fossil.png"`
    );
    assert.ok(
      html.includes("onerror=\"this.onerror=null; this.src='img/sealed/Paquete fossil.png'\""),
      `Angle ${angle} onerror handler must be properly quoted without syntax errors`
    );
  }
});

// ============================================================================
// CHALLENGE 2: Spelling of Mewtwo file (`mewto-holo-rare.png`)
// ============================================================================

test('CH-06: Physical disk file is strictly `mewto-holo-rare.png` (without `w` after `t`)', () => {
  const correctDiskPath = path.join(ROOT_DIR, 'img/cards/mewto-holo-rare.png');
  const incorrectDiskPath = path.join(ROOT_DIR, 'img/cards/mewtwo-holo-rare.png');

  assert.ok(fs.existsSync(correctDiskPath), 'File img/cards/mewto-holo-rare.png must exist');
  assert.ok(!fs.existsSync(incorrectDiskPath), 'File img/cards/mewtwo-holo-rare.png must NOT exist on disk');

  const files = fs.readdirSync(path.join(ROOT_DIR, 'img/cards'));
  assert.ok(files.includes('mewto-holo-rare.png'), 'Exact directory entry must be mewto-holo-rare.png');
  assert.ok(!files.includes('mewtwo-holo-rare.png'), 'Directory must NOT contain mewtwo-holo-rare.png');
});

test('CH-07: Product `mewtwo-151` in `js/data.js` and `js/db/db-client.js` use exact spelling `mewto-holo-rare.png`', () => {
  const { PRODUCTS } = createSandbox();
  const mewtwo = PRODUCTS.find(p => p.id === 'mewtwo-151');
  assert.ok(mewtwo, 'Product mewtwo-151 must exist in catalog');
  assert.equal(mewtwo.imagenLocal, 'img/cards/mewto-holo-rare.png');

  // Verify db-client.js
  const dbCode = fs.readFileSync(path.join(ROOT_DIR, 'js/db/db-client.js'), 'utf8');
  assert.ok(
    dbCode.includes("'img/cards/mewto-holo-rare.png'"),
    'db-client.js must reference exact spelling img/cards/mewto-holo-rare.png'
  );
});

test('CH-08: Codebase scan verifies zero erroneous references to `mewtwo-holo-rare.png`', () => {
  const checkDirs = ['js', 'index.html'];
  for (const item of checkDirs) {
    const fullPath = path.join(ROOT_DIR, item);
    if (fs.statSync(fullPath).isDirectory()) {
      const files = fs.readdirSync(fullPath, { recursive: true });
      for (const f of files) {
        const p = path.join(fullPath, f);
        if (fs.statSync(p).isFile() && (p.endsWith('.js') || p.endsWith('.html'))) {
          const content = fs.readFileSync(p, 'utf8');
          assert.ok(
            !content.includes('mewtwo-holo-rare.png'),
            `File ${p} must not contain erroneous spelling mewtwo-holo-rare.png`
          );
        }
      }
    } else {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        !content.includes('mewtwo-holo-rare.png'),
        `File ${fullPath} must not contain erroneous spelling mewtwo-holo-rare.png`
      );
    }
  }
});

// ============================================================================
// CHALLENGE 3: Fallback simulation (`onerror` handlers)
// ============================================================================

test('CH-09: All UI views specify `this.onerror=null;` preventing infinite error loops', () => {
  const views = [
    'js/views/catalog.js',
    'js/views/pdp.js',
    'js/views/cart.js',
    'js/views/home.js',
    'js/views/search-results.js',
    'js/views/tracking.js',
    'js/views/profile.js',
    'js/app.js'
  ];

  for (const v of views) {
    const content = fs.readFileSync(path.join(ROOT_DIR, v), 'utf8');
    const onerrorMatches = content.match(/onerror="([^"]+)"/g) || [];
    for (const match of onerrorMatches) {
      assert.ok(
        match.includes('this.onerror=null;') || match.includes('this.onerror = null;'),
        `View ${v} has onerror handler without loop guard: ${match}`
      );
    }
  }
});

test('CH-10: Simulated execution of `onerror` clears handler and applies fallback', () => {
  // Simulate image element behavior in browser
  class SimulatedImage {
    constructor(src, onerrorCode) {
      this.src = src;
      this.onerrorCode = onerrorCode;
      this.onerror = () => {
        // Evaluate the inline onerror script in the context of `this`
        const fn = new Function(this.onerrorCode);
        fn.call(this);
      };
      this.errorEventsCount = 0;
    }

    triggerError() {
      this.errorEventsCount++;
      if (typeof this.onerror === 'function') {
        this.onerror();
      }
    }
  }

  const fallbackTarget = 'img/cards/card-back.png';
  const img = new SimulatedImage(
    'img/cards/non-existent-card.png',
    `this.onerror=null; this.src='${fallbackTarget}';`
  );

  // First error event: triggers handler
  img.triggerError();
  assert.equal(img.src, fallbackTarget, 'img.src must be updated to fallback path');
  assert.equal(img.onerror, null, 'img.onerror must be set to null after first failure');

  // Second error event (if fallback also failed): handler should NOT fire again
  img.triggerError();
  assert.equal(img.errorEventsCount, 2, 'Two error events registered');
  assert.equal(img.onerror, null, 'img.onerror remains null, preventing recursion');
});

test('CH-11: Resilient fallback asset `img/cards/card-back.png` exists on disk', () => {
  const cardBackPath = path.join(ROOT_DIR, 'img/cards/card-back.png');
  assert.ok(fs.existsSync(cardBackPath), 'Universal fallback img/cards/card-back.png must exist');
  assert.ok(fs.statSync(cardBackPath).size > 10000, 'Universal fallback card-back.png must have valid size');
});

// ============================================================================
// CHALLENGE 4: Cart addition & removal with valid thumbnail paths
// ============================================================================

test('CH-12: Adding Gengar to cart via PDP retains valid thumbnail path', () => {
  const { Store, PDPView, PRODUCTS, app } = createSandbox();
  Store.data.cart = [];
  const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');
  Store.data.currentPdpProduct = gengar;
  Store.data.pdpSelectedCondition = 'psa10';
  Store.data.pdpQuantity = 2;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const item = Store.data.cart[0];
  assert.equal(item.id, 'gengar-scarlet-violet-psa10');
  assert.equal(item.quantity, 2);
  assert.equal(item.imageLocal, 'img/cards/gengar-holo-scarlet.png');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, item.imageLocal)), 'Cart item imageLocal must exist on disk');
});

test('CH-13: Adding Mewtwo to cart via PDP retains valid thumbnail path', () => {
  const { Store, PDPView, PRODUCTS } = createSandbox();
  Store.data.cart = [];
  const mewtwo = PRODUCTS.find(p => p.id === 'mewtwo-151');
  Store.data.currentPdpProduct = mewtwo;
  Store.data.pdpSelectedCondition = 'psa9';
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const item = Store.data.cart[0];
  assert.equal(item.id, 'mewtwo-151-psa9');
  assert.equal(item.imageLocal, 'img/cards/mewto-holo-rare.png');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, item.imageLocal)), 'Cart item imageLocal must exist on disk');
});

test('CH-14: Adding Mimikyu to cart via PDP retains valid thumbnail path', () => {
  const { Store, PDPView, PRODUCTS } = createSandbox();
  Store.data.cart = [];
  const mimikyu = PRODUCTS.find(p => p.id === 'mimikyu-paldean');
  Store.data.currentPdpProduct = mimikyu;
  Store.data.pdpSelectedCondition = 'raw';
  Store.data.pdpQuantity = 3;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const item = Store.data.cart[0];
  assert.equal(item.id, 'mimikyu-paldean-raw');
  assert.equal(item.quantity, 3);
  assert.equal(item.imageLocal, 'img/cards/mimikyu-rare.png');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, item.imageLocal)), 'Cart item imageLocal must exist on disk');
});

test('CH-15: Adding Fossil to cart via PDP retains space path and sealed frontal gallery image', () => {
  const { Store, PDPView, PRODUCTS } = createSandbox();
  Store.data.cart = [];
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
  Store.data.currentPdpProduct = fossil;
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const item = Store.data.cart[0];
  assert.equal(item.id, 'booster-box-fossil-1999-sealed');
  assert.equal(item.imageLocal, 'img/sealed/Paquete fossil.png');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, item.imageLocal)), 'Cart item imageLocal must exist on disk');
});

test('CH-16: `CartView.render()` renders all 4 items with valid image paths and quotes', () => {
  const { Store, PDPView, PRODUCTS, CartView } = createSandbox();
  Store.data.cart = [];

  const productIds = [
    'gengar-scarlet-violet',
    'mewtwo-151',
    'mimikyu-paldean',
    'booster-box-fossil-1999'
  ];

  for (const id of productIds) {
    const prod = PRODUCTS.find(p => p.id === id);
    Store.data.currentPdpProduct = prod;
    Store.data.pdpQuantity = 1;
    PDPView.addToCart();
  }

  assert.equal(Store.data.cart.length, 4, 'All 4 items should be in cart');

  const cartHtml = CartView.render();

  assert.ok(cartHtml.includes('src="img/cards/gengar-holo-scarlet.png"'), 'Gengar thumbnail rendered');
  assert.ok(cartHtml.includes('src="img/cards/mewto-holo-rare.png"'), 'Mewtwo thumbnail rendered');
  assert.ok(cartHtml.includes('src="img/cards/mimikyu-rare.png"'), 'Mimikyu thumbnail rendered');
  assert.ok(cartHtml.includes('src="img/sealed/Paquete fossil.png"'), 'Fossil thumbnail rendered with space');

  // Verify none of the src attributes are broken or unquoted
  const srcMatches = cartHtml.match(/src="[^"]+"/g) || [];
  assert.ok(srcMatches.length >= 4, 'Must have at least 4 quoted src attributes');
});

test('CH-17: Cart quantity adjustments and item removals preserve remaining thumbnail paths', () => {
  const { Store, PDPView, PRODUCTS, app } = createSandbox();
  Store.data.cart = [];

  // Add all 4
  for (const id of ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean', 'booster-box-fossil-1999']) {
    Store.data.currentPdpProduct = PRODUCTS.find(p => p.id === id);
    Store.data.pdpQuantity = 1;
    PDPView.addToCart();
  }

  // Update Gengar quantity (+2)
  app.updateCartQuantity('gengar-scarlet-violet-psa10', 2);
  const gengarItem = Store.data.cart.find(c => c.id === 'gengar-scarlet-violet-psa10');
  assert.equal(gengarItem.quantity, 3);
  assert.equal(gengarItem.imageLocal, 'img/cards/gengar-holo-scarlet.png');

  // Remove Mewtwo directly from cart
  app.removeFromCart('mewtwo-151-psa10');
  assert.equal(Store.data.cart.length, 3);
  assert.ok(!Store.data.cart.some(c => c.id === 'mewtwo-151-psa10'));

  // Remaining items still retain correct paths
  assert.equal(Store.data.cart.find(c => c.id === 'gengar-scarlet-violet-psa10').imageLocal, 'img/cards/gengar-holo-scarlet.png');
  assert.equal(Store.data.cart.find(c => c.id === 'mimikyu-paldean-psa10').imageLocal, 'img/cards/mimikyu-rare.png');
  assert.equal(Store.data.cart.find(c => c.id === 'booster-box-fossil-1999-sealed').imageLocal, 'img/sealed/Paquete fossil.png');

  // Remove Fossil
  app.removeFromCart('booster-box-fossil-1999-sealed');
  assert.equal(Store.data.cart.length, 2);
  assert.ok(!Store.data.cart.some(c => c.id === 'booster-box-fossil-1999-sealed'));
});

test('CH-18: Cart serialization to localStorage preserves spaces and special paths across reload', () => {
  const sandbox1 = createSandbox();
  const { Store, PDPView, PRODUCTS } = sandbox1;
  Store.data.cart = [];

  for (const id of ['gengar-scarlet-violet', 'booster-box-fossil-1999']) {
    Store.data.currentPdpProduct = PRODUCTS.find(p => p.id === id);
    Store.data.pdpQuantity = 1;
    PDPView.addToCart();
  }

  // Save to localStorage
  Store.saveCart();
  const serialized = sandbox1.localStorage.getItem('gstcg_cart');
  assert.ok(serialized, 'Cart data must be serialized in localStorage');
  assert.ok(serialized.includes('img/sealed/Paquete fossil.png'), 'Serialized JSON must preserve space in path');

  // Simulate new page load with saved cart
  const sandbox2 = createSandbox();
  sandbox2.localStorage.setItem('gstcg_cart', serialized);
  sandbox2.Store.init();

  assert.equal(sandbox2.Store.data.cart.length, 2);
  const reloadedFossil = sandbox2.Store.data.cart.find(c => c.id === 'booster-box-fossil-1999-sealed');
  assert.ok(reloadedFossil, 'Fossil item reloaded from localStorage');
  assert.equal(reloadedFossil.imageLocal, 'img/sealed/Paquete fossil.png');
  assert.ok(fs.existsSync(path.join(ROOT_DIR, reloadedFossil.imageLocal)), 'Reloaded path must exist on disk');
});
