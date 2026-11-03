/**
 * ==============================================================================
 * Challenger 1 - Milestone 1 Iteration 2 Adversarial Empirical Test Suite
 * File: tests/test_challenger_m1_r2.test.mjs
 * 
 * Target:
 * 1. PDPView.handleHoloMove: simulated touch events, extreme coords (-9999, 999999, NaN)
 *    Strict verification that --holo-x and --holo-y remain in [0%, 100%].
 * 2. PDPView.updateQuantity(delta): large negative deltas (-10), zero, decimals,
 *    non-numeric strings, corrupted store states.
 *    Strict verification that quantity remains in [1, 10].
 * 3. Custom products missing 'era':
 *    Strict verification that PDPView.render() never throws unhandled errors.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function setupEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const sceneStyles = {};
  const mockSceneElement = {
    id: 'pdp-3d-scene',
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 300, right: 300, bottom: 400 }),
    style: {
      setProperty(key, val) { sceneStyles[key] = String(val); },
      getPropertyValue(key) { return sceneStyles[key] || ''; },
      _props: sceneStyles
    }
  };

  const mockQtyElement = { id: 'pdp-quantity-value', innerText: '1' };
  const mockPriceElement = { id: 'pdp-price', innerText: '' };
  const mockCertBadge = { id: 'pdp-cert-badge', innerText: '' };
  const mockTrendPill = { id: 'market-trend-pill', innerText: '', className: '' };
  const mockChartSvg = { id: 'pdp-interactive-chart', getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 130 }) };
  const mockPolyline = { id: 'chart-polyline', setAttribute: () => {} };
  const mockActiveDot = { id: 'chart-active-dot', setAttribute: () => {} };

  const elements = new Map([
    ['pdp-3d-scene', mockSceneElement],
    ['pdp-quantity-value', mockQtyElement],
    ['pdp-price', mockPriceElement],
    ['pdp-cert-badge', mockCertBadge],
    ['market-trend-pill', mockTrendPill],
    ['pdp-interactive-chart', mockChartSvg],
    ['chart-polyline', mockPolyline],
    ['chart-active-dot', mockActiveDot]
  ]);

  const cartHistory = [];
  const toastHistory = [];

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
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
    sceneStyles,
    elements
  };
}

function parsePercent(val) {
  if (typeof val !== 'string' || !val.endsWith('%')) return NaN;
  return parseFloat(val.slice(0, -1));
}

// ==============================================================================
// 1. ADVERSARIAL TESTS: handleHoloMove Coordinates & Touch Handling
// ==============================================================================

test('PDPView.handleHoloMove: Simulated touch events clamp correctly within [0%, 100%]', () => {
  const { PDPView, sceneStyles } = setupEnvironment();

  // Test standard touch in center of bounds (rect is 100..300 x, 100..400 y)
  PDPView.handleHoloMove({ touches: [{ clientX: 200, clientY: 250 }] });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');

  // Test touch outside top-left (e.g. clientX: 50, clientY: 50 -> relative x: -50, y: -50)
  PDPView.handleHoloMove({ touches: [{ clientX: 50, clientY: 50 }] });
  assert.equal(sceneStyles['--holo-x'], '0.0%');
  assert.equal(sceneStyles['--holo-y'], '0.0%');
  const xVal1 = parsePercent(sceneStyles['--holo-x']);
  const yVal1 = parsePercent(sceneStyles['--holo-y']);
  assert.ok(xVal1 >= 0 && xVal1 <= 100, `Expected --holo-x in [0, 100], got ${xVal1}`);
  assert.ok(yVal1 >= 0 && yVal1 <= 100, `Expected --holo-y in [0, 100], got ${yVal1}`);

  // Test touch outside bottom-right (e.g. clientX: 500, clientY: 600)
  PDPView.handleHoloMove({ touches: [{ clientX: 500, clientY: 600 }] });
  assert.equal(sceneStyles['--holo-x'], '100.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  // Test changedTouches (as delivered in touchend)
  PDPView.handleHoloMove({ touches: [], changedTouches: [{ clientX: 150, clientY: 200 }] });
  assert.equal(sceneStyles['--holo-x'], '25.0%');
  assert.equal(sceneStyles['--holo-y'], '33.3%');
});

test('PDPView.handleHoloMove: Extreme pointer coordinates (-9999, 999999, NaN) maintain bounds [0%, 100%]', () => {
  const { PDPView, sceneStyles } = setupEnvironment();

  // Initial reference position
  PDPView.handleHoloMove({ clientX: 200, clientY: 250 });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');

  // Extreme negative coordinate: clientX: -9999, clientY: -9999
  PDPView.handleHoloMove({ clientX: -9999, clientY: -9999 });
  assert.equal(sceneStyles['--holo-x'], '0.0%');
  assert.equal(sceneStyles['--holo-y'], '0.0%');

  // Extreme positive coordinate: clientX: 999999, clientY: 999999
  PDPView.handleHoloMove({ clientX: 999999, clientY: 999999 });
  assert.equal(sceneStyles['--holo-x'], '100.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  // clientX: NaN, clientY: NaN -> should be ignored, NOT write "NaN%"
  // Prior values should be preserved
  PDPView.handleHoloMove({ clientX: NaN, clientY: NaN });
  assert.equal(sceneStyles['--holo-x'], '100.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  // Mixed NaN and numbers
  PDPView.handleHoloMove({ clientX: 200, clientY: NaN });
  assert.equal(sceneStyles['--holo-x'], '100.0%'); // Unchanged because ignored

  PDPView.handleHoloMove({ clientX: NaN, clientY: 250 });
  assert.equal(sceneStyles['--holo-y'], '100.0%'); // Unchanged because ignored

  // Touch with NaN coordinates
  PDPView.handleHoloMove({ touches: [{ clientX: NaN, clientY: NaN }] });
  assert.equal(sceneStyles['--holo-x'], '100.0%');

  // Infinity and -Infinity handling
  PDPView.handleHoloMove({ clientX: Infinity, clientY: Infinity });
  assert.equal(sceneStyles['--holo-x'], '100.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  PDPView.handleHoloMove({ clientX: -Infinity, clientY: -Infinity });
  assert.equal(sceneStyles['--holo-x'], '0.0%');
  assert.equal(sceneStyles['--holo-y'], '0.0%');
});

test('PDPView.handleHoloMove: Malformed events and DOM edge conditions handle safely', () => {
  const { PDPView, elements, sceneStyles } = setupEnvironment();

  // Null, undefined, empty event
  assert.doesNotThrow(() => PDPView.handleHoloMove(null));
  assert.doesNotThrow(() => PDPView.handleHoloMove(undefined));
  assert.doesNotThrow(() => PDPView.handleHoloMove({}));
  assert.doesNotThrow(() => PDPView.handleHoloMove({ touches: [] }));
  assert.doesNotThrow(() => PDPView.handleHoloMove({ clientX: 'invalid', clientY: 200 }));

  // Missing DOM scene element
  const originalScene = elements.get('pdp-3d-scene');
  elements.set('pdp-3d-scene', null);
  assert.doesNotThrow(() => PDPView.handleHoloMove({ clientX: 200, clientY: 200 }));

  // Collapsed scene element (0 width and 0 height -> prevent division by zero)
  elements.set('pdp-3d-scene', {
    ...originalScene,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 })
  });
  assert.doesNotThrow(() => PDPView.handleHoloMove({ clientX: 200, clientY: 200 }));
});

test('PDPView.handleHoloMove: 10,000 randomized adversarial coordinate iterations stay in [0%, 100%]', () => {
  const { PDPView, sceneStyles } = setupEnvironment();

  for (let i = 0; i < 10000; i++) {
    const rawX = (Math.random() - 0.5) * 2000000;
    const rawY = (Math.random() - 0.5) * 2000000;
    const isTouch = i % 3 === 0;

    const event = isTouch
      ? { touches: [{ clientX: rawX, clientY: rawY }] }
      : { clientX: rawX, clientY: rawY };

    PDPView.handleHoloMove(event);

    const xVal = parsePercent(sceneStyles['--holo-x']);
    const yVal = parsePercent(sceneStyles['--holo-y']);

    assert.ok(
      !isNaN(xVal) && xVal >= 0 && xVal <= 100,
      `Iteration ${i}: --holo-x out of bounds: ${sceneStyles['--holo-x']}`
    );
    assert.ok(
      !isNaN(yVal) && yVal >= 0 && yVal <= 100,
      `Iteration ${i}: --holo-y out of bounds: ${sceneStyles['--holo-y']}`
    );
  }
});

// ==============================================================================
// 2. ADVERSARIAL TESTS: updateQuantity(delta) Clamping & Sanitization
// ==============================================================================

test('PDPView.updateQuantity: Large negative deltas (-10, -1000) strictly clamp to 1', () => {
  const { Store, PDPView, mockQtyElement } = setupEnvironment();

  Store.data.pdpQuantity = 5;
  const res1 = PDPView.updateQuantity(-10);
  assert.equal(Store.data.pdpQuantity, 1, 'Store pdpQuantity must clamp at 1');
  assert.equal(mockQtyElement.innerText, '1', 'DOM must display 1');
  assert.equal(res1, 1, 'Return value must be 1');

  Store.data.pdpQuantity = 10;
  const res2 = PDPView.updateQuantity(-1000);
  assert.equal(Store.data.pdpQuantity, 1);
  assert.equal(mockQtyElement.innerText, '1');
  assert.equal(res2, 1);
});

test('PDPView.updateQuantity: Zero delta preserves current quantity within [1, 10]', () => {
  const { Store, PDPView, mockQtyElement } = setupEnvironment();

  Store.data.pdpQuantity = 4;
  const res = PDPView.updateQuantity(0);
  assert.equal(Store.data.pdpQuantity, 4);
  assert.equal(mockQtyElement.innerText, '4');
  assert.equal(res, 4);

  // Zero delta when at boundaries
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity(0);
  assert.equal(Store.data.pdpQuantity, 1);

  Store.data.pdpQuantity = 10;
  PDPView.updateQuantity(0);
  assert.equal(Store.data.pdpQuantity, 10);
});

test('PDPView.updateQuantity: Decimal numbers keep quantity strictly within [1, 10]', () => {
  const { Store, PDPView, mockQtyElement } = setupEnvironment();

  Store.data.pdpQuantity = 1;
  // Positive float increment
  PDPView.updateQuantity(2.5);
  assert.ok(Store.data.pdpQuantity >= 1 && Store.data.pdpQuantity <= 10, 'Quantity must be in [1, 10]');

  // Large float increment beyond 10
  PDPView.updateQuantity(25.7);
  assert.equal(Store.data.pdpQuantity, 10, 'Float exceeding 10 must clamp to 10');

  // Large float decrement below 1
  PDPView.updateQuantity(-99.9);
  assert.equal(Store.data.pdpQuantity, 1, 'Float below 1 must clamp to 1');

  // String decimal deltas
  Store.data.pdpQuantity = 3;
  PDPView.updateQuantity('2.8'); // parsed as integer 2
  assert.equal(Store.data.pdpQuantity, 5);

  PDPView.updateQuantity('-10.5'); // parsed as integer -10
  assert.equal(Store.data.pdpQuantity, 1);
});

test('PDPView.updateQuantity: Non-numeric strings, NaN, and objects are safely rejected', () => {
  const { Store, PDPView, mockQtyElement } = setupEnvironment();

  Store.data.pdpQuantity = 3;
  mockQtyElement.innerText = '3';

  const adversarialInputs = [
    'abc',
    'foo_bar',
    '',
    '   ',
    '<script>alert(1)</script>',
    NaN,
    null,
    undefined,
    {},
    [],
    true,
    false,
    Symbol('sym')
  ];

  for (const bad of adversarialInputs) {
    try {
      PDPView.updateQuantity(bad);
    } catch (e) {
      // Symbol might throw on toString, which is caught
    }
    assert.equal(
      Store.data.pdpQuantity,
      3,
      `Store pdpQuantity must remain unchanged on bad input: ${String(bad)}`
    );
    assert.equal(
      mockQtyElement.innerText,
      '3',
      `DOM text must remain unchanged on bad input: ${String(bad)}`
    );
  }
});

test('PDPView.updateQuantity: Corrupted store state auto-recovers to valid [1, 10]', () => {
  const { Store, PDPView, mockQtyElement } = setupEnvironment();

  // Corrupted negative store value
  Store.data.pdpQuantity = -50;
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 1, 'Clamps up to 1 from negative state');

  // Corrupted NaN store value
  Store.data.pdpQuantity = NaN;
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 2, 'Recovers from NaN state');

  // Corrupted non-numeric string store value
  Store.data.pdpQuantity = 'corrupted';
  PDPView.updateQuantity(1);
  assert.equal(Store.data.pdpQuantity, 2, 'Recovers from string state');

  // Corrupted oversized store value
  Store.data.pdpQuantity = 999;
  PDPView.updateQuantity(-1);
  assert.equal(Store.data.pdpQuantity, 10, 'Clamps down to 10 from oversized state');
});

test('PDPView.updateQuantity: 10,000 randomized operations guarantee 1 <= qty <= 10', () => {
  const { Store, PDPView } = setupEnvironment();

  Store.data.pdpQuantity = 1;

  for (let i = 0; i < 10000; i++) {
    const selector = i % 5;
    let d;
    if (selector === 0) d = Math.floor((Math.random() - 0.5) * 50); // numeric integer [-25..25]
    else if (selector === 1) d = (Math.random() - 0.5) * 20; // float
    else if (selector === 2) d = String(Math.floor((Math.random() - 0.5) * 20)); // numeric string
    else if (selector === 3) d = 'invalid_' + i; // bad string
    else d = i % 2 === 0 ? 1 : -1; // standard step

    PDPView.updateQuantity(d);

    assert.ok(
      Store.data.pdpQuantity >= 1 && Store.data.pdpQuantity <= 10,
      `Iteration ${i}: Quantity ${Store.data.pdpQuantity} fell outside [1, 10] with delta ${d}`
    );
  }
});

// ==============================================================================
// 3. ADVERSARIAL TESTS: Custom Products Missing 'era' Field
// ==============================================================================

test('PDPView.render: Custom products missing era do NOT throw unhandled errors', () => {
  const { Store, PDPView } = setupEnvironment();

  const testProducts = [
    {
      id: 'custom-sealed-no-era-prop',
      nombre: 'Mystery Sealed Booster Box 1999',
      set: 'Mystery Expansion',
      rareza: 'Ultra Rare',
      categoria: 'sealed',
      tipo_discriminador: 'PRODUCTO_SELLADO',
      tipo_item: 'PRODUCTO_SELLADO',
      // era completely omitted
      imagenLocal: 'assets/img/sealed/team-rocket-box-front.png',
      imagenFallbackUrl: 'assets/img/sealed/team-rocket-box-perspective.png',
      precios: { sealed: 2500 }
    },
    {
      id: 'custom-sealed-era-undefined',
      nombre: 'Jungle Booster Box Sealed',
      set: 'Jungle 1999',
      rareza: 'Rare',
      categoria: 'sealed',
      tipo_discriminador: 'PRODUCTO_SELLADO',
      era: undefined,
      imagenLocal: 'assets/img/sealed/team-rocket-box-front.png',
      imagenFallbackUrl: 'assets/img/sealed/team-rocket-box-perspective.png',
      precios: { sealed: 3000 }
    },
    {
      id: 'custom-sealed-era-null',
      nombre: 'Fossil Booster Box Sealed',
      set: 'Fossil 1999',
      rareza: 'Rare',
      categoria: 'sealed',
      tipo_discriminador: 'PRODUCTO_SELLADO',
      era: null,
      imagenLocal: 'assets/img/sealed/team-rocket-box-front.png',
      imagenFallbackUrl: 'assets/img/sealed/team-rocket-box-perspective.png',
      precios: { sealed: 3200 }
    },
    {
      id: 'custom-sealed-era-empty-string',
      nombre: 'Gym Heroes Booster Box Sealed',
      set: 'Gym Heroes 2000',
      rareza: 'Rare',
      categoria: 'sealed',
      tipo_discriminador: 'PRODUCTO_SELLADO',
      era: '',
      imagenLocal: 'assets/img/sealed/team-rocket-box-front.png',
      imagenFallbackUrl: 'assets/img/sealed/team-rocket-box-perspective.png',
      precios: { sealed: 4000 }
    },
    {
      id: 'custom-card-no-era',
      nombre: 'Charizard Custom Edition',
      set: 'Promo Stars',
      rareza: 'Secret Rare',
      categoria: 'psa',
      tipo_discriminador: 'CARTA_INDIVIDUAL',
      tipo: 'Pokémon Fuego',
      certNumber: '99887766',
      // era omitted
      imagenLocal: 'img/charizard-base.png',
      imagenFallbackUrl: 'img/charizard-base.png',
      precios: { raw: 100, psa8: 200, psa9: 500, psa10: 1500 }
    }
  ];

  for (const prod of testProducts) {
    Store.data.currentPdpProduct = prod;
    Store.data.pdpSelectedCondition = 'psa10';
    Store.data.pdpInspectorMode = 'front';
    Store.data.pdpSealedAngle = 'frontal';
    Store.data.pdpQuantity = 1;

    let html = null;
    assert.doesNotThrow(() => {
      html = PDPView.render();
    }, `PDPView.render() threw unhandled error on product "${prod.id}"`);

    assert.ok(typeof html === 'string', `render() must return string for "${prod.id}"`);
    assert.ok(html.length > 100, `render() HTML output must not be empty for "${prod.id}"`);
    assert.ok(html.includes(prod.nombre), `render() must contain product name for "${prod.id}"`);

    // Sealed products missing era must gracefully fallback to 'VINTAGE'
    if (prod.tipo_discriminador === 'PRODUCTO_SELLADO') {
      assert.ok(
        html.includes('Era VINTAGE • Display Sellado'),
        `Sealed product "${prod.id}" missing era must fallback to 'Era VINTAGE • Display Sellado'`
      );
    }
  }
});
