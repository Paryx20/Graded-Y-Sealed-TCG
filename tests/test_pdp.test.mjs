/**
 * ==============================================================================
 * Test Suite: Adaptive Product Detail Page (PDP) & 3D Inspector (Phase 4)
 * File: tests/test_pdp.test.mjs
 * 
 * Production Testing Harness for PDPView (js/views/pdp.js), Store (js/state.js),
 * and APP (js/app.js) using node:vm sandbox.
 * Genuine implementation - Zero facade mocks of business logic.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function setupPDPRenderer() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const sceneStyles = {};
  const mockSceneElement = {
    id: 'pdp-3d-scene',
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 300 }),
    style: {
      setProperty(key, val) { sceneStyles[key] = String(val); },
      getPropertyValue(key) { return sceneStyles[key]; },
      _styles: sceneStyles
    }
  };

  const mockQtyElement = { id: 'pdp-quantity-value', innerText: '1' };
  const elements = new Map([
    ['pdp-3d-scene', mockSceneElement],
    ['pdp-quantity-value', mockQtyElement]
  ]);

  const cartHistory = [];
  const toastHistory = [];

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    document: {
      getElementById: (id) => elements.get(id) || null
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    app: {
      renderCurrentView: () => {},
      showToast: (msg, type) => { toastHistory.push({ msg, type }); },
      addToCart: (sku, name, label, price, img, fallback, qty) => {
        cartHistory.push({ sku, name, label, price, img, fallback, qty });
      },
      openPSAGuideModal: () => {}
    }
  };

  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);

  return {
    PRODUCTS: sandbox.PRODUCTS,
    Store: sandbox.Store,
    PDPView: sandbox.PDPView,
    mockSceneElement,
    mockQtyElement,
    cartHistory,
    toastHistory,
    sceneStyles
  };
}

function setupAppRenderer() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');

  const docBody = {
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    }
  };

  const modal = {
    id: 'psa-guide-modal',
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    attributes: new Map([['aria-hidden', 'true']]),
    setAttribute(k, v) { this.attributes.set(k, String(v)); },
    getAttribute(k) { return this.attributes.get(k) || null; },
    querySelector: () => ({ focus: () => {} }),
    listeners: new Map(),
    addEventListener(event, fn) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(fn);
    }
  };

  const windowListeners = new Map();
  const mockWindow = {
    addEventListener: (event, fn) => {
      if (!windowListeners.has(event)) windowListeners.set(event, []);
      windowListeners.get(event).push(fn);
    },
    scrollTo: () => {},
    location: { hash: '#pdp' }
  };

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    URLSearchParams,
    document: {
      getElementById: (id) => id === 'psa-guide-modal' ? modal : null,
      body: docBody,
      activeElement: { focus: () => {} },
      addEventListener: () => {}
    },
    window: mockWindow,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    lucide: {
      createIcons: () => {}
    }
  };

  sandbox.globalThis = sandbox;
  sandbox.window = mockWindow;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(appCode + '\n;this.app = app;', sandbox);

  return {
    app: sandbox.app,
    modal,
    docBody,
    windowListeners,
    dispatchKeydown: (key) => {
      const handlers = windowListeners.get('keydown') || [];
      handlers.forEach(h => h({ key }));
    }
  };
}

// ==============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH - >=5 tests per feature)
// ==============================================================================

// Feature 1: Team Rocket Box Multi-Angle Imagery
test('Feature 1 [Tier 1]: Team Rocket Box - Specifies front angle image path', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const sealedItem = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  assert.ok(sealedItem, 'Sealed item booster-team-rocket should exist in catalog');
  assert.equal(sealedItem.galeria_sellada.frontal, 'img/sealed/team-rocket-box-front.png');
  const html = PDPView.renderSealedGalleryStage(sealedItem, 'frontal');
  assert.ok(html.includes('img/sealed/team-rocket-box-front.png'));
  assert.ok(fs.existsSync(path.join(process.cwd(), sealedItem.galeria_sellada.frontal)));
});

test('Feature 1 [Tier 1]: Team Rocket Box - Specifies 3/4 perspective angle image path', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const sealedItem = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  assert.equal(sealedItem.galeria_sellada.perspectiva, 'img/sealed/team-rocket-box-perspective.png');
  const html = PDPView.renderSealedGalleryStage(sealedItem, 'perspectiva');
  assert.ok(html.includes('img/sealed/team-rocket-box-perspective.png'));
  assert.ok(fs.existsSync(path.join(process.cwd(), sealedItem.galeria_sellada.perspectiva)));
});

test('Feature 1 [Tier 1]: Team Rocket Box - Specifies side profile image path', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const sealedItem = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  assert.equal(sealedItem.galeria_sellada.lateral, 'img/sealed/team-rocket-box-side.png');
  const html = PDPView.renderSealedGalleryStage(sealedItem, 'lateral');
  assert.ok(html.includes('img/sealed/team-rocket-box-side.png'));
  assert.ok(fs.existsSync(path.join(process.cwd(), sealedItem.galeria_sellada.lateral)));
});

test('Feature 1 [Tier 1]: Team Rocket Box - Gallery switcher toggles active preview angle', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const sealedItem = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  Store.data.currentPdpProduct = sealedItem;

  PDPView.setSealedAngle('perspectiva');
  assert.equal(Store.data.pdpSealedAngle, 'perspectiva');
  const htmlPersp = PDPView.render();
  assert.ok(htmlPersp.includes('img/sealed/team-rocket-box-perspective.png'));

  PDPView.setSealedAngle('lateral');
  assert.equal(Store.data.pdpSealedAngle, 'lateral');
  const htmlLat = PDPView.render();
  assert.ok(htmlLat.includes('img/sealed/team-rocket-box-side.png'));
});

test('Feature 1 [Tier 1]: Team Rocket Box - Preserves factory seal description metadata', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const sealedItem = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  assert.equal(sealedItem.detalles_sellados.cantidad_sobres_interior, 36);
  assert.equal(sealedItem.detalles_sellados.es_pesado_verificado, true);
  assert.equal(sealedItem.detalles_sellados.gramaje_gramos, 750);
  const html = PDPView.renderFactorySpecs(sealedItem);
  assert.ok(html.includes('750g'));
  assert.ok(html.includes('36 Sobres'));
  assert.ok(html.includes('Wizards of the Coast'));
  assert.ok(html.includes('Sin pesar'));
});

// Feature 2: Pokémon Card Visual Assets
test('Feature 2 [Tier 1]: Card Assets - Official card back image asset is specified', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('img/cards/card-back.png'));
  assert.ok(fs.existsSync(path.join(process.cwd(), 'img/cards/card-back.png')));
});

test('Feature 2 [Tier 1]: Card Assets - Raichu GX front asset is specified', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const raichu = PRODUCTS.find(p => p.id === 'raichu-gx');
  assert.ok(raichu, 'raichu-gx should be present in catalog');
  assert.equal(raichu.imagenLocal, 'img/cards/raichu-gx.png');
  const html = PDPView.renderInspectorStage(raichu, 'psa10', 'front');
  assert.ok(html.includes('img/cards/raichu-gx.png'));
  assert.ok(fs.existsSync(path.join(process.cwd(), 'img/cards/raichu-gx.png')));
});

test('Feature 2 [Tier 1]: Card Assets - Supports standard card ratio aspect styling', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const htmlFront = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(htmlFront.includes('max-h-[340px]'));
  const htmlSlab = PDPView.renderInspectorStage(card, 'psa10', 'slab');
  assert.ok(htmlSlab.includes('aspect-[3/4]'));
});

test('Feature 2 [Tier 1]: Card Assets - Provides fallback URL when local asset is missing', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  assert.ok(card.imagenFallbackUrl.startsWith('https://'));
  const html = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(html.includes(`onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"`));
});

test('Feature 2 [Tier 1]: Card Assets - Applies drop shadow filter for realistic 3D appearance', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(html.includes('drop-shadow-2xl'));
  assert.ok(html.includes('rounded-xl'));
});

// Feature 3: 3D Inspector Frontal View & Shimmer
test('Feature 3 [Tier 1]: 3D Inspector Frontal - Sets inspector mode to front', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpInspectorMode = 'slab';
  PDPView.setInspectorMode('front');
  assert.equal(Store.data.pdpInspectorMode, 'front');
});

test('Feature 3 [Tier 1]: 3D Inspector Frontal - Holographic sheen layer container is present', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(html.includes('id="pdp-holo-layer"'));
  assert.ok(html.includes('class="holo-sheen-layer"'));
});

test('Feature 3 [Tier 1]: 3D Inspector Frontal - Mousemove handler computes relative sheen coordinates', () => {
  const { PDPView, sceneStyles } = setupPDPRenderer();
  PDPView.handleHoloMove({ clientX: 200, clientY: 250 });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');
});

test('Feature 3 [Tier 1]: 3D Inspector Frontal - Applies holo coordinates to CSS custom properties', () => {
  const { PDPView, sceneStyles } = setupPDPRenderer();
  PDPView.handleHoloMove({ clientX: 231, clientY: 226 });
  assert.equal(sceneStyles['--holo-x'], '65.5%');
  assert.equal(sceneStyles['--holo-y'], '42.0%');
});

test('Feature 3 [Tier 1]: 3D Inspector Frontal - Displays PSA authentication certification badge', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(html.includes('id="pdp-cert-badge"'));
  assert.ok(html.includes(`#${card.certNumber}`));
});

// Feature 4: 3D Inspector Reverso y Bordes
test('Feature 4 [Tier 1]: 3D Inspector Back - Sets inspector mode to back', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpInspectorMode = 'front';
  PDPView.setInspectorMode('back');
  assert.equal(Store.data.pdpInspectorMode, 'back');
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Applies 180° Y-axis rotation CSS class (is-flipped-y)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const htmlBack = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(htmlBack.includes('is-flipped-y'));
  const htmlFront = PDPView.renderInspectorStage(card, 'psa10', 'front');
  assert.ok(!htmlFront.includes('is-flipped-y'));
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Renders official Pocket Monsters card back artwork', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('card-3d-back'));
  assert.ok(html.includes('img/cards/card-back.png'));
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Clean reverse side without centering grid overlay (Requirement R3)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(html.includes('img/cards/card-back.png'), 'Card back image must be present');
  assert.ok(!html.includes('centering-grid-overlay'), 'centering-grid-overlay must NOT be present');
});

test('Feature 4 [Tier 1]: 3D Inspector Back - Clean reverse side without coordinate labels (Requirement R3)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
  assert.ok(!html.includes('EJE X: 50.0% / 50.0%'), 'EJE X coordinate label must NOT be present');
  assert.ok(!html.includes('EJE Y: 50.0% / 50.0% • BORDES OK'), 'EJE Y coordinate label must NOT be present');
});

// Feature 5: 3D Inspector Slab PSA View
test('Feature 5 [Tier 1]: 3D Inspector Slab - Sets inspector mode to slab', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpInspectorMode = 'front';
  PDPView.setInspectorMode('slab');
  assert.equal(Store.data.pdpInspectorMode, 'slab');
});

test('Feature 5 [Tier 1]: 3D Inspector Slab - Renders PSA acrylic slab container (psa-acrylic-slab)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'slab');
  assert.ok(html.includes('psa-acrylic-slab'));
  assert.ok(html.includes('psa-inner-well'));
});

test('Feature 5 [Tier 1]: 3D Inspector Slab - Renders PSA certification header label', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'slab');
  assert.ok(html.includes('PROFESSIONAL SPORTS AUTHENTICATOR'));
  assert.ok(html.includes('<span>PSA</span>'));
});

test('Feature 5 [Tier 1]: 3D Inspector Slab - Displays barcode and certification serial number', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'slab');
  assert.ok(html.includes('psa-barcode'));
  assert.ok(html.includes(`#${card.certNumber}`));
});

test('Feature 5 [Tier 1]: 3D Inspector Slab - Displays grade badge (GEM MT 10)', () => {
  const { PRODUCTS, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  const html = PDPView.renderInspectorStage(card, 'psa10', 'slab');
  assert.ok(html.includes('GRADO'));
  assert.ok(html.includes('GEM MT 10'));
});

// Feature 6: Adaptive PDP Conditional Logic
test('Feature 6 [Tier 1]: Adaptive PDP - Sealed product hides PSA grading selector', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const sealed = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  Store.data.currentPdpProduct = sealed;
  const html = PDPView.render();
  assert.equal(html.includes('Seleccionar Condición / Grado PSA:'), false);
  assert.equal(html.includes('role="radiogroup"'), false);
});

test('Feature 6 [Tier 1]: Adaptive PDP - Sealed product hides 3D rotation controls', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const sealed = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  Store.data.currentPdpProduct = sealed;
  const html = PDPView.render();
  assert.equal(html.includes('Modos del inspector de carta'), false);
  assert.equal(html.includes('card-3d-scene'), false);
});

test('Feature 6 [Tier 1]: Adaptive PDP - Sealed product displays factory specifications and packaging gallery', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const sealed = PRODUCTS.find(p => p.id === 'booster-team-rocket');
  Store.data.currentPdpProduct = sealed;
  const html = PDPView.render();
  assert.ok(html.includes('id="sealed-factory-specs"'));
  assert.ok(html.includes('id="pdp-sealed-stage"'));
  assert.ok(html.includes('Ángulos del empaque sellado'));
});

test('Feature 6 [Tier 1]: Adaptive PDP - Single card shows PSA grading selector', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  Store.data.currentPdpProduct = card;
  const html = PDPView.render();
  assert.ok(html.includes('Seleccionar Condición / Grado PSA:'));
  assert.ok(html.includes('role="radiogroup"'));
});

test('Feature 6 [Tier 1]: Adaptive PDP - Single card shows 3D inspector modes & prominent condition pricing without market chart (Requirement R2)', () => {
  const { PRODUCTS, Store, PDPView } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  Store.data.currentPdpProduct = card;
  const html = PDPView.render();
  assert.ok(html.includes('Modos del inspector de carta'));
  assert.ok(html.includes('id="pdp-3d-scene"'));
  assert.ok(!html.includes('id="pdp-interactive-chart"'), 'Market trend chart must be removed');
  assert.ok(!html.includes('Historial de Mercado Actual'), 'Market history title must be removed');
  assert.ok(html.includes('id="pdp-price"'), 'Price must remain prominently displayed');
});

test('Requirement R1 [Unit]: PDP Condition Buttons - Exclusive checkmark across sequential condition switches', () => {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  // Build simulated DOM nodes supporting Lucide SVG transformation and removal
  class MockNode {
    constructor(tagName, id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.className = className;
      this.children = [];
      this.attributes = new Map();
      this.parentElement = null;
    }
    setAttribute(k, v) { this.attributes.set(k, v); }
    getAttribute(k) { return this.attributes.get(k); }
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    insertAdjacentHTML(position, html) {
      if (html.includes('<i data-lucide="check"')) {
        const icon = new MockNode('i', '', 'w-3.5 h-3.5 text-[#059669]');
        icon.setAttribute('data-lucide', 'check');
        this.appendChild(icon);
      }
    }
    remove() {
      if (this.parentElement) {
        const idx = this.parentElement.children.indexOf(this);
        if (idx !== -1) this.parentElement.children.splice(idx, 1);
        this.parentElement = null;
      }
    }
    querySelector(selector) {
      if (selector === 'div:first-child') return this.children[0] || null;
      if (selector === 'div:last-child') return this.children[this.children.length - 1] || null;
      if (selector === 'i') return this.children.find(c => c.tagName === 'I') || null;
      if (selector === 'svg') return this.children.find(c => c.tagName === 'SVG') || null;
      return null;
    }
    querySelectorAll(selector) {
      if (selector === 'button') {
        return this.children.filter(c => c.tagName === 'BUTTON');
      }
      if (selector.includes('i') || selector.includes('svg') || selector.includes('check')) {
        return this.children.filter(c => 
          c.tagName === 'I' || 
          c.tagName === 'SVG' || 
          c.getAttribute('data-lucide') === 'check' || 
          (c.className && c.className.includes('lucide-check'))
        );
      }
      return [];
    }
  }

  // Construct DOM radiogroup with 4 condition buttons
  const radiogroup = new MockNode('div');
  radiogroup.setAttribute('role', 'radiogroup');
  radiogroup.setAttribute('aria-label', 'Condición de la carta');

  const btnKeys = ['raw', 'psa8', 'psa9', 'psa10'];
  const buttons = btnKeys.map((key) => {
    const btn = new MockNode('button');
    const headerDiv = new MockNode('div');
    const titleSpan = new MockNode('span');
    titleSpan.innerText = key.toUpperCase();
    headerDiv.appendChild(titleSpan);
    const priceDiv = new MockNode('div');
    btn.appendChild(headerDiv);
    btn.appendChild(priceDiv);
    radiogroup.appendChild(btn);
    return btn;
  });

  // Simulated Lucide createIcons implementation: transforms <i> tags into <svg>
  const lucideMock = {
    createIcons: () => {
      buttons.forEach(btn => {
        const header = btn.querySelector('div:first-child');
        const iconI = header.querySelector('i');
        if (iconI && iconI.getAttribute('data-lucide') === 'check') {
          const svg = new MockNode('svg', '', 'lucide lucide-check w-3.5 h-3.5 text-[#059669]');
          svg.setAttribute('data-lucide', 'check');
          iconI.remove();
          header.appendChild(svg);
        }
      });
    }
  };

  const elementsMap = new Map([
    ['pdp-price', new MockNode('span', 'pdp-price')],
    ['pdp-cert-badge', new MockNode('span', 'pdp-cert-badge')]
  ]);

  const sandbox = {
    console,
    Math,
    document: {
      getElementById: (id) => elementsMap.get(id) || null,
      querySelector: (selector) => {
        if (selector === '[role="radiogroup"][aria-label="Condición de la carta"]') return radiogroup;
        return null;
      }
    },
    lucide: lucideMock,
    app: { showToast: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);

  const { PDPView, Store, PRODUCTS } = sandbox;
  Store.data.currentPdpProduct = PRODUCTS[0];

  const getCheckmarkStatus = () => {
    return buttons.map((btn, idx) => {
      const header = btn.querySelector('div:first-child');
      const hasIcon = header.children.some(c => 
        c.tagName === 'I' || 
        c.tagName === 'SVG' || 
        c.getAttribute('data-lucide') === 'check'
      );
      return { key: btnKeys[idx], hasIcon };
    });
  };

  // Test sequential condition switching: raw -> psa8 -> psa9 -> psa10 -> raw
  const sequence = ['raw', 'psa8', 'psa9', 'psa10', 'raw'];
  for (const selectedKey of sequence) {
    PDPView.selectCondition(selectedKey);
    const statuses = getCheckmarkStatus();
    const activeWithIcon = statuses.filter(s => s.hasIcon);

    assert.equal(activeWithIcon.length, 1, `Exactly ONE button must display a checkmark when '${selectedKey}' is selected. Got ${activeWithIcon.length} buttons.`);
    assert.equal(activeWithIcon[0].key, selectedKey, `The checkmark must be on '${selectedKey}', but was on '${activeWithIcon[0].key}'.`);

    // Verify all other 3 buttons have zero checkmarks
    statuses.filter(s => s.key !== selectedKey).forEach(inactive => {
      assert.equal(inactive.hasIcon, false, `Inactive button '${inactive.key}' must NOT display a checkmark.`);
    });
  }
});

// Feature 7: PDP Quantity Stepper
test('Feature 7 [Tier 1]: Quantity Stepper - Initial count is exactly 1', () => {
  const { PRODUCTS, Store, PDPView, mockQtyElement } = setupPDPRenderer();
  Store.data.pdpQuantity = 1;
  Store.data.currentPdpProduct = PRODUCTS[0];
  const html = PDPView.render();
  assert.ok(html.includes('id="pdp-quantity-value"'));
  assert.ok(html.includes('>1</span>'));
  assert.equal(Store.data.pdpQuantity, 1);
  assert.equal(mockQtyElement.innerText, '1');
});

test('Feature 7 [Tier 1]: Quantity Stepper - Increment (+) increases quantity from 1 to 2', () => {
  const { Store, PDPView, mockQtyElement } = setupPDPRenderer();
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 2);
  assert.equal(mockQtyElement.innerText, '2');
});

test('Feature 7 [Tier 1]: Quantity Stepper - Decrement (-) decreases quantity from 2 to 1', () => {
  const { Store, PDPView, mockQtyElement } = setupPDPRenderer();
  Store.data.pdpQuantity = 2;
  PDPView.updateQuantity(-1);
  assert.equal(Store.data.pdpQuantity, 1);
  assert.equal(mockQtyElement.innerText, '1');
});

test('Feature 7 [Tier 1]: Quantity Stepper - Multiple increments accumulate predictably', () => {
  const { Store, PDPView, mockQtyElement } = setupPDPRenderer();
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity(1);
  PDPView.updateQuantity(1);
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 4);
  assert.equal(mockQtyElement.innerText, '4');
});

test('Feature 7 [Tier 1]: Quantity Stepper - Adding to cart passes selected quantity correctly', () => {
  const { PRODUCTS, Store, PDPView, cartHistory } = setupPDPRenderer();
  const card = PRODUCTS.find(p => p.categoria === 'psa');
  Store.data.currentPdpProduct = card;
  Store.data.pdpQuantity = 3;
  PDPView.addToCart();
  assert.equal(cartHistory.length, 1);
  assert.equal(cartHistory[0].qty, 3);
  assert.equal(cartHistory[0].name, card.nombre);
  assert.equal(Store.data.pdpQuantity, 1);
});

// Feature 8: PSA Educational Modal
test('Feature 8 [Tier 1]: PSA Modal - Modal element exists in DOM structure', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="psa-guide-modal"'));
  assert.ok(indexHtml.includes('role="dialog"'));
  assert.ok(indexHtml.includes('aria-modal="true"'));
  assert.ok(indexHtml.includes('aria-labelledby="psa-guide-title"'));
  assert.ok(indexHtml.includes('app.closePSAGuideModal()'));
});

test('Feature 8 [Tier 1]: PSA Modal - Opening modal adds active class', () => {
  const { app, modal, docBody } = setupAppRenderer();
  assert.equal(modal.classList.contains('active'), false);
  app.openPSAGuideModal();
  assert.equal(modal.classList.contains('active'), true);
  assert.equal(modal.getAttribute('aria-hidden'), 'false');
  assert.equal(docBody.classList.contains('overflow-hidden'), true);
});

test('Feature 8 [Tier 1]: PSA Modal - Closing modal removes active class', () => {
  const { app, modal, docBody } = setupAppRenderer();
  app.openPSAGuideModal();
  assert.equal(modal.classList.contains('active'), true);
  app.closePSAGuideModal();
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(modal.getAttribute('aria-hidden'), 'true');
  assert.equal(docBody.classList.contains('overflow-hidden'), false);
});

test('Feature 8 [Tier 1]: PSA Modal - Contains grade descriptions (Gem Mint 10, Mint 9, NM-MT 8)', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('PSA 10 Gem Mint'));
  assert.ok(indexHtml.includes('PSA 9 Mint'));
  assert.ok(indexHtml.includes('PSA 8 NM-MT'));
  assert.ok(indexHtml.includes('Estándar internacional de graduación y custodia'));
});

test('Feature 8 [Tier 1]: PSA Modal - Escape key event closes active modal', () => {
  const { app, modal, docBody, dispatchKeydown } = setupAppRenderer();
  app.init();
  app.openPSAGuideModal();
  assert.equal(modal.classList.contains('active'), true);
  assert.equal(docBody.classList.contains('overflow-hidden'), true);

  dispatchKeydown('Escape');
  assert.equal(modal.classList.contains('active'), false);
  assert.equal(docBody.classList.contains('overflow-hidden'), false);
});

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Clamping, Limits, State Edge Conditions)
// ==============================================================================

test('Feature 7 [Tier 2 Boundary]: Quantity Stepper - Lower bound cannot decrement below 1', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity(-1);
  assert.equal(Store.data.pdpQuantity, 1);
  PDPView.updateQuantity(-5);
  assert.equal(Store.data.pdpQuantity, 1);
});

test('Feature 7 [Tier 2 Boundary]: Quantity Stepper - Direct assignment below 1 is clamped to 1', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity('invalid');
  assert.equal(Store.data.pdpQuantity, 1);
  PDPView.updateQuantity(-99);
  assert.equal(Store.data.pdpQuantity, 1);
});

test('Feature 7 [Tier 2 Boundary]: Quantity Stepper - Upper bound clamp at maximum stock (10)', () => {
  const { Store, PDPView } = setupPDPRenderer();
  Store.data.pdpQuantity = 10;
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 10);
  PDPView.updateQuantity(5);
  assert.equal(Store.data.pdpQuantity, 10);
});

test('Feature 3 [Tier 2 Boundary]: 3D Sheen Coordinates - Clamps extreme coordinates gracefully', () => {
  const { PDPView, sceneStyles } = setupPDPRenderer();
  PDPView.handleHoloMove({ clientX: -50, clientY: 600 });
  assert.equal(sceneStyles['--holo-x'], '0.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  PDPView.handleHoloMove({ touches: [{ clientX: 200, clientY: 250 }] });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');
});

test('Feature 5 [Tier 2 Boundary]: Slab PSA View - Fallback to default cert code when undefined', () => {
  const { PDPView } = setupPDPRenderer();
  const html = PDPView.renderInspectorStage({ set: 'Base Set', nombre: 'Test Card' }, 'psa10', 'slab');
  assert.ok(html.includes('#48291034'));
});

test('Feature 5 [Tier 2 Boundary]: Slab PSA View - Unknown grading condition defaults safely', () => {
  const { PDPView } = setupPDPRenderer();
  assert.equal(PDPView.getGradeLabel('unknown_grade'), 'GEM MT 10');
  assert.equal(PDPView.getGradeLabel(null), 'GEM MT 10');
  assert.equal(PDPView.getGradeLabel('raw'), 'RAW NEAR MINT');
  assert.equal(PDPView.getGradeLabel('psa8'), 'NM-MT 8');
  assert.equal(PDPView.getGradeLabel('psa9'), 'MINT 9');
  assert.equal(PDPView.getGradeLabel('psa10'), 'GEM MT 10');
});
