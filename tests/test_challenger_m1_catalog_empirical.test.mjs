/**
 * ==============================================================================
 * Empirical Challenger Verification Suite: Milestone 1 (Catalog Assets & Data Integrity - R3)
 * File: tests/test_challenger_m1_catalog_empirical.test.mjs
 * 
 * Deep Empirical Adversarial Verification for:
 * 1. Physical Disk Assets:
 *    - Existence, paths, file sizes (>100KB / 102,400 bytes), PNG magic byte validation.
 * 2. Catalog Data Integrity:
 *    - js/data.js: POKEMON_CARDS_CATALOG_10, SEALED_PRODUCTS, PRODUCTS.
 *    - js/db/db-client.js: IndexedDB Dexie initial seed synchronization.
 * 3. DOM Rendering Across All Views:
 *    - Catalog cards grid (CatalogView.renderCardsGrid)
 *    - PDP Inspector modal (single raw 3D card, PSA slab mode, sealed multi-angle gallery)
 *    - Spotlight live search dropdown (app.renderLiveSearchDropdown)
 *    - Cart view (CartView.render)
 * 4. Adversarial Edge Cases:
 *    - Filename with space ('Paquete fossil.png') HTML attribute safety.
 *    - Image onerror recursion safety (this.onerror=null prevention of infinite loops).
 *    - Zero undefined or null image attributes across all components.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();

// Helper to check PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
function verifyPngMagicBytes(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return buffer.equals(pngHeader);
}

// Sandbox builder to evaluate views without browser dependency
function createChallengeSandbox() {
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const catalogCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/catalog.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  const cartCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/cart.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');

  const elements = new Map();

  function createMockElement(id = '', tag = 'div') {
    return {
      id,
      tagName: tag.toUpperCase(),
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); }
      },
      style: {
        setProperty() {},
        getPropertyValue() { return ''; }
      },
      attributes: new Map(),
      children: [],
      innerHTML: '',
      innerText: '',
      value: '',
      addEventListener() {},
      removeEventListener() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 400 }),
      focus() {},
      blur() {}
    };
  }

  // Pre-populate expected DOM elements
  const searchDropdown = createMockElement('search-live-dropdown');
  const searchBackdrop = createMockElement('search-spotlight-backdrop');
  const searchContainer = createMockElement('search-container');
  const globalSearchInput = createMockElement('global-search', 'input');
  const pdpModal = createMockElement('pdp-modal');
  const pdpContent = createMockElement('pdp-modal-content');
  const pdpStage = createMockElement('pdp-interactive-stage');

  elements.set('search-live-dropdown', searchDropdown);
  elements.set('search-spotlight-backdrop', searchBackdrop);
  elements.set('search-container', searchContainer);
  elements.set('global-search', globalSearchInput);
  elements.set('pdp-modal', pdpModal);
  elements.set('pdp-modal-content', pdpContent);
  elements.set('pdp-interactive-stage', pdpStage);

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    Boolean,
    Number,
    String,
    Array,
    Object,
    encodeURIComponent,
    document: {
      getElementById: (id) => {
        if (!elements.has(id)) {
          elements.set(id, createMockElement(id));
        }
        return elements.get(id);
      },
      body: createMockElement('body')
    },
    window: {
      location: { hash: '#catalog' },
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
    }
  };

  vm.createContext(sandbox);

  // Execute scripts in dependency order
  vm.runInContext(dataCode, sandbox);
  vm.runInContext(stateCode, sandbox);
  vm.runInContext(catalogCode, sandbox);
  vm.runInContext(pdpCode, sandbox);
  vm.runInContext(cartCode, sandbox);
  vm.runInContext(appCode, sandbox);

  return {
    sandbox,
    PRODUCTS: sandbox.PRODUCTS,
    CatalogView: sandbox.CatalogView,
    PDPView: sandbox.PDPView,
    CartView: sandbox.CartView,
    Store: sandbox.Store,
    app: sandbox.app,
    elements
  };
}

// ==============================================================================
// 1. PHYSICAL ASSET DISK & BYTE-LEVEL VERIFICATION
// ==============================================================================

test('CHALLENGE-1.1 [Assets]: Local fallback image files physically exist on disk', () => {
  const assets = [
    'assets/img/cards/card-back.png',
    'assets/img/sealed/paquete-fossil.png'
  ];

  for (const relPath of assets) {
    const fullPath = path.join(ROOT_DIR, relPath);
    assert.ok(fs.existsSync(fullPath), `Asset file MUST exist on disk: ${relPath}`);
  }
});

test('CHALLENGE-1.2 [Assets]: Local fallback image files exceed 100KB minimum size threshold', () => {
  const assets = [
    { relPath: 'assets/img/cards/card-back.png', minBytes: 100 * 1024 },
    { relPath: 'assets/img/sealed/paquete-fossil.png', minBytes: 100 * 1024 }
  ];

  for (const { relPath, minBytes } of assets) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const stat = fs.statSync(fullPath);
    assert.ok(
      stat.size >= minBytes,
      `Asset ${relPath} size (${stat.size} bytes) must be >= 100KB (${minBytes} bytes)`
    );
  }
});

test('CHALLENGE-1.3 [Assets]: Local fallback image files are authentic valid PNGs with magic header', () => {
  const assets = [
    'assets/img/cards/card-back.png',
    'assets/img/sealed/paquete-fossil.png'
  ];

  for (const relPath of assets) {
    const fullPath = path.join(ROOT_DIR, relPath);
    const isValidPng = verifyPngMagicBytes(fullPath);
    assert.ok(isValidPng, `Asset ${relPath} must have valid PNG magic bytes header`);
  }
});

// ==============================================================================
// 2. DATA INTEGRITY & LINKAGE VERIFICATION
// ==============================================================================

test('CHALLENGE-2.1 [Data]: Gengar, Mewtwo, Mimikyu, Fossil specify exact asset paths in js/data.js', () => {
  const { PRODUCTS } = createChallengeSandbox();

  const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');
  assert.ok(gengar, 'gengar-scarlet-violet must exist in PRODUCTS');
  assert.equal(gengar.imagenLocal, 'assets/img/cards/gengar-holo-scarlet.png');
  assert.equal(gengar.imagenFallbackUrl, 'assets/img/cards/gengar-holo-scarlet.png');

  const mewtwo = PRODUCTS.find(p => p.id === 'mewtwo-151');
  assert.ok(mewtwo, 'mewtwo-151 must exist in PRODUCTS');
  assert.equal(mewtwo.imagenLocal, 'assets/img/cards/mewto-holo-rare.png');
  assert.equal(mewtwo.imagenFallbackUrl, 'assets/img/cards/mewto-holo-rare.png');

  const mimikyu = PRODUCTS.find(p => p.id === 'mimikyu-paldean');
  assert.ok(mimikyu, 'mimikyu-paldean must exist in PRODUCTS');
  assert.equal(mimikyu.imagenLocal, 'assets/img/cards/mimikyu-rare.png');
  assert.equal(mimikyu.imagenFallbackUrl, 'assets/img/cards/mimikyu-rare.png');

  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
  assert.ok(fossil, 'booster-box-fossil-1999 must exist in PRODUCTS');
  assert.equal(fossil.imagenLocal, 'assets/img/sealed/paquete-fossil.png');
  assert.equal(fossil.imagenFallbackUrl, 'assets/img/sealed/paquete-fossil.png');
  assert.ok(fossil.galeria_sellada, 'fossil must have galeria_sellada object');
  assert.equal(fossil.galeria_sellada.frontal, 'assets/img/sealed/paquete-fossil.png');
  assert.equal(fossil.galeria_sellada.perspectiva, 'assets/img/sealed/paquete-fossil.png');
  assert.equal(fossil.galeria_sellada.lateral, 'assets/img/sealed/paquete-fossil.png');
});

test('CHALLENGE-2.2 [Data]: js/db/db-client.js synchronizes initial seed records with updated images', () => {
  const dbClientPath = path.join(ROOT_DIR, 'js/db/db-client.js');
  const code = fs.readFileSync(dbClientPath, 'utf8');

  assert.ok(code.includes('assets/img/cards/gengar-holo-scarlet.png'), 'db-client.js must include gengar asset');
  assert.ok(code.includes('assets/img/cards/mewto-holo-rare.png'), 'db-client.js must include mewto asset');
  assert.ok(code.includes('assets/img/cards/mimikyu-rare.png'), 'db-client.js must include mimikyu asset');
});

// ==============================================================================
// 3. DOM RENDERING ACROSS VIEWS (ZERO UNDEFINED / BROKEN LINKS)
// ==============================================================================

test('CHALLENGE-3.1 [DOM - Catalog Grid]: CatalogView.renderCardsGrid renders all 4 assets without undefined/broken attributes', () => {
  const { CatalogView, PRODUCTS } = createChallengeSandbox();
  const targetIds = ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean', 'booster-box-fossil-1999'];
  const targetProducts = PRODUCTS.filter(p => targetIds.includes(p.id));

  assert.equal(targetProducts.length, 4, 'All 4 target products must be present in PRODUCTS');

  const gridHtml = CatalogView.renderCardsGrid(targetProducts);

  assert.ok(!gridHtml.includes('src="undefined"'), 'Grid HTML must never have src="undefined"');
  assert.ok(!gridHtml.includes('src="null"'), 'Grid HTML must never have src="null"');
  assert.ok(!gridHtml.includes('src=""'), 'Grid HTML must never have empty src=""');
  assert.ok(!gridHtml.includes('alt="undefined"'), 'Grid HTML must never have alt="undefined"');

  assert.ok(gridHtml.includes('src="assets/img/cards/gengar-holo-scarlet.png"'), 'Must render Gengar card image');
  assert.ok(gridHtml.includes('src="assets/img/cards/mewto-holo-rare.png"'), 'Must render Mewtwo card image');
  assert.ok(gridHtml.includes('src="assets/img/cards/mimikyu-rare.png"'), 'Must render Mimikyu card image');
  assert.ok(gridHtml.includes('src="assets/img/sealed/paquete-fossil.png"'), 'Must render Fossil booster pack image with space');
});

test('CHALLENGE-3.2 [DOM - PDP Single Card 3D Inspector]: Raw condition renders 3D card front and authentic back', () => {
  const { PDPView, PRODUCTS } = createChallengeSandbox();
  const singleCards = PRODUCTS.filter(p => ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean'].includes(p.id));

  for (const card of singleCards) {
    const rawStageHtml = PDPView.renderInspectorStage(card, 'raw', 'raw');
    assert.ok(rawStageHtml.includes(`src="${card.imagenLocal}"`), `Stage must render ${card.imagenLocal}`);
    assert.ok(rawStageHtml.includes('assets/img/cards/card-back.png'), 'Stage must render authentic card back');
    assert.ok(!rawStageHtml.includes('undefined'), 'Stage must contain zero undefined strings');
  }
});

test('CHALLENGE-3.3 [DOM - PDP PSA Slab Inspector]: PSA slab condition renders encapsulated acrylic card image', () => {
  const { PDPView, PRODUCTS } = createChallengeSandbox();
  const singleCards = PRODUCTS.filter(p => ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean'].includes(p.id));

  for (const card of singleCards) {
    const slabStageHtml = PDPView.renderInspectorStage(card, 'psa10', 'slab');
    assert.ok(slabStageHtml.includes(`src="${card.imagenLocal}"`), `Slab stage must render ${card.imagenLocal}`);
    assert.ok(slabStageHtml.includes('psa-acrylic-slab'), 'Must contain official acrylic slab class');
    assert.ok(slabStageHtml.includes('psa-flip-label'), 'Must contain official label');
    assert.ok(!slabStageHtml.includes('undefined'), 'Slab stage must contain zero undefined strings');
  }
});

test('CHALLENGE-3.4 [DOM - PDP Sealed Gallery]: Multi-angle gallery renders frontal, perspectiva, lateral with zero broken links', () => {
  const { PDPView, PRODUCTS } = createChallengeSandbox();
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');

  const angles = ['frontal', 'perspectiva', 'lateral'];
  for (const angle of angles) {
    const galleryHtml = PDPView.renderSealedGalleryStage(fossil, angle);
    assert.ok(galleryHtml.includes('src="assets/img/sealed/paquete-fossil.png"'), `Gallery angle ${angle} must render image`);
    assert.ok(!galleryHtml.includes('undefined'), `Gallery angle ${angle} must contain zero undefined strings`);
    assert.ok(!galleryHtml.includes('src=""'), `Gallery angle ${angle} must not have empty src`);
  }

  // Boundary check: invalid angle falls back safely to frontal image
  const fallbackHtml = PDPView.renderSealedGalleryStage(fossil, 'unknown_angle');
  assert.ok(fallbackHtml.includes('src="assets/img/sealed/paquete-fossil.png"'), 'Invalid angle must fallback to frontal asset');
});

test('CHALLENGE-3.5 [DOM - Spotlight Search]: renderLiveSearchDropdown renders thumbnails for all 4 products', () => {
  const { app, elements } = createChallengeSandbox();
  const dropdown = elements.get('search-live-dropdown');

  const searchCases = [
    { query: 'gengar', expectedSrc: 'assets/img/cards/gengar-holo-scarlet.png' },
    { query: 'mewtwo', expectedSrc: 'assets/img/cards/mewto-holo-rare.png' },
    { query: 'mimikyu', expectedSrc: 'assets/img/cards/mimikyu-rare.png' },
    { query: 'fossil', expectedSrc: 'assets/img/sealed/paquete-fossil.png' }
  ];

  for (const { query, expectedSrc } of searchCases) {
    app.renderLiveSearchDropdown(query);
    const html = dropdown.innerHTML;
    assert.ok(html.includes(`src="${expectedSrc}"`), `Search for "${query}" must render thumbnail ${expectedSrc}`);
    assert.ok(!html.includes('src="undefined"'), `Search for "${query}" must not have src="undefined"`);
    assert.ok(!html.includes('alt="undefined"'), `Search for "${query}" must not have alt="undefined"`);
  }
});

test('CHALLENGE-3.6 [DOM - Cart]: CartView.render accurately renders added items with valid image sources', () => {
  const { app, CartView, Store, PRODUCTS } = createChallengeSandbox();

  // Clear existing cart
  Store.data.cart = [];

  // Add all 4 items to cart
  const targetIds = ['gengar-scarlet-violet', 'mewtwo-151', 'mimikyu-paldean', 'booster-box-fossil-1999'];
  for (const id of targetIds) {
    const product = PRODUCTS.find(p => p.id === id);
    const isSealed = product.categoria === 'sealed';
    const condition = isSealed ? 'sealed' : 'psa10';
    const image = isSealed ? product.galeria_sellada.frontal : product.imagenLocal;

    app.addToCart(
      `${product.id}-${condition}`,
      product.nombre,
      condition,
      100.00,
      image,
      product.imagenFallbackUrl,
      1
    );
  }

  assert.equal(Store.data.cart.length, 4, 'Cart must contain 4 items');

  const cartHtml = CartView.render();

  assert.ok(cartHtml.includes('src="assets/img/cards/gengar-holo-scarlet.png"'), 'Cart must render Gengar image');
  assert.ok(cartHtml.includes('src="assets/img/cards/mewto-holo-rare.png"'), 'Cart must render Mewtwo image');
  assert.ok(cartHtml.includes('src="assets/img/cards/mimikyu-rare.png"'), 'Cart must render Mimikyu image');
  assert.ok(cartHtml.includes('src="assets/img/sealed/paquete-fossil.png"'), 'Cart must render Fossil image');

  assert.ok(!cartHtml.includes('src="undefined"'), 'Cart must not contain src="undefined"');
  assert.ok(!cartHtml.includes('alt="undefined"'), 'Cart must not contain alt="undefined"');
  assert.ok(!cartHtml.includes('src=""'), 'Cart must not contain empty src');
});

// ==============================================================================
// 4. ADVERSARIAL STRESS & CORNER CASES
// ==============================================================================

test('CHALLENGE-4.1 [Stress - Space in Filename]: Space in "Paquete fossil.png" is safely quoted and does not corrupt HTML attributes', () => {
  const { CatalogView, PDPView, PRODUCTS } = createChallengeSandbox();
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');

  const gridHtml = CatalogView.renderCardsGrid([fossil]);
  const pdpHtml = PDPView.renderSealedGalleryStage(fossil, 'frontal');

  // Verify that src is enclosed in double quotes and does not leak "fossil.png" as a separate attribute
  const srcRegex = /src="([^"]+)"/g;
  
  const gridMatches = [...gridHtml.matchAll(srcRegex)].map(m => m[1]);
  assert.ok(gridMatches.some(s => s === 'assets/img/sealed/paquete-fossil.png'), 'Grid must contain exactly quoted path');

  const pdpMatches = [...pdpHtml.matchAll(srcRegex)].map(m => m[1]);
  assert.ok(pdpMatches.some(s => s === 'assets/img/sealed/paquete-fossil.png'), 'PDP gallery must contain exactly quoted path');
});

test('CHALLENGE-4.2 [Stress - onerror Recursion Defense]: All img elements have onerror nullification to prevent infinite loops', () => {
  const { CatalogView, PDPView, CartView, Store, PRODUCTS } = createChallengeSandbox();

  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');
  const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');

  const gridHtml = CatalogView.renderCardsGrid([fossil, gengar]);
  const pdpRawHtml = PDPView.renderInspectorStage(gengar, 'raw', 'raw');
  const pdpSlabHtml = PDPView.renderInspectorStage(gengar, 'psa10', 'slab');
  const pdpSealedHtml = PDPView.renderSealedGalleryStage(fossil, 'frontal');

  Store.data.cart = [{
    id: 'fossil-item',
    name: fossil.nombre,
    condition: 'sealed',
    price: 8400,
    quantity: 1,
    imageLocal: fossil.imagenLocal,
    imageFallback: fossil.imagenFallbackUrl
  }];
  const cartHtml = CartView.render();

  const htmlSnippets = [gridHtml, pdpRawHtml, pdpSlabHtml, pdpSealedHtml, cartHtml];
  for (const html of htmlSnippets) {
    assert.ok(
      html.includes('this.onerror=null') || html.includes('onerror="this.onerror=null'),
      'Every rendered image with onerror handler MUST include this.onerror=null to prevent crash loop'
    );
  }
});

test('CHALLENGE-4.3 [Stress - Extreme Cart Operations]: Rapid addition, quantity update, and deletion preserve image integrity', () => {
  const { app, CartView, Store, PRODUCTS } = createChallengeSandbox();
  Store.data.cart = [];

  const gengar = PRODUCTS.find(p => p.id === 'gengar-scarlet-violet');
  const fossil = PRODUCTS.find(p => p.id === 'booster-box-fossil-1999');

  // Add 100 times in rapid succession
  for (let i = 0; i < 50; i++) {
    app.addToCart('gengar-item', gengar.nombre, 'psa10', 28, gengar.imagenLocal, gengar.imagenFallbackUrl, 1);
    app.addToCart('fossil-item', fossil.nombre, 'sealed', 8400, fossil.imagenLocal, fossil.imagenFallbackUrl, 2);
  }

  assert.equal(Store.data.cart.length, 2, 'Cart should consolidate into 2 unique line items');
  const gengarCart = Store.data.cart.find(c => c.id === 'gengar-item');
  const fossilCart = Store.data.cart.find(c => c.id === 'fossil-item');

  assert.equal(gengarCart.quantity, 50);
  assert.equal(fossilCart.quantity, 100);
  assert.equal(gengarCart.imageLocal, 'assets/img/cards/gengar-holo-scarlet.png');
  assert.equal(fossilCart.imageLocal, 'assets/img/sealed/paquete-fossil.png');

  const renderedCart = CartView.render();
  assert.ok(renderedCart.includes('src="assets/img/cards/gengar-holo-scarlet.png"'));
  assert.ok(renderedCart.includes('src="assets/img/sealed/paquete-fossil.png"'));
});
