/**
 * ==============================================================================
 * Empirical Adversarial Challenger Test Suite: Requirements R1 & R2
 * File: tests/test_challenger_m1_adversarial.test.mjs
 * 
 * Focus:
 * 1. R1 3D Card Drag Interaction:
 *    - Physical pointer/mouse/touch drag in 3D perspective
 *    - Continuous 360° Euler rotation (front/back faces visible, endless spin)
 *    - Vertical tilt strict clamp [-40deg, +40deg] & immediate unclamping on reversal
 *    - Transition: none during active drag, restoration with momentum flick on release
 *    - Holographic sheen tracking (--holo-x, --holo-y) under extreme coordinates
 *    - Multi-touch, rapid flicks, negative drags, non-primary mouse buttons
 * 
 * 2. R2 Dynamic Condition Pricing:
 *    - Immediate DOM update of #pdp-price across all 4 grading tiers
 *    - 3D rotation preservation (zero destructive re-renders, rotation maintained)
 *    - Defensive tier calculation when product.precios is missing or partial
 *    - Accurate cart addition capturing selected grade, SKU, and dynamic price
 *    - Sealed product immunity from card grading condition changes
 *    - Toast notifications and accessibility indicators
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createAdversarialEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const listeners = new Map();
  const sceneStyles = {};
  const cardStyles = { transform: '', transition: '' };
  const sceneClassList = new Set(['card-3d-scene']);
  const capturedPointers = new Set();

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
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(val) { this._innerHTML = val; }

    setAttribute(k, v) { this.attributes.set(k, v); }
    getAttribute(k) { return this.attributes.get(k); }

    querySelector(sel) {
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
      // no-op for mock
    }
  }

  const mockSceneElement = {
    id: 'pdp-3d-scene',
    classList: {
      add: (cls) => sceneClassList.add(cls),
      remove: (cls) => sceneClassList.delete(cls),
      contains: (cls) => sceneClassList.has(cls)
    },
    getBoundingClientRect: () => ({ left: 50, top: 50, width: 400, height: 600, right: 450, bottom: 650 }),
    style: {
      setProperty(key, val) { sceneStyles[key] = String(val); },
      getPropertyValue(key) { return sceneStyles[key] || ''; },
      _styles: sceneStyles
    },
    addEventListener: (type, fn, opts) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (listeners.has(type)) {
        const arr = listeners.get(type).filter(f => f !== fn);
        listeners.set(type, arr);
      }
    },
    setPointerCapture: (id) => capturedPointers.add(id),
    releasePointerCapture: (id) => capturedPointers.delete(id),
    dispatch(type, eventObj = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach(h => h(eventObj));
    }
  };

  const mockCardElement = {
    id: 'pdp-3d-object',
    style: cardStyles
  };

  const priceEl = new MockDOMElement('pdp-price', 'span');
  priceEl.innerText = '$18,500.00 USD';

  const certBadgeEl = new MockDOMElement('pdp-cert-badge', 'span');
  certBadgeEl.innerText = 'PSA 10 GEM MT • #48291034';

  const qtyEl = new MockDOMElement('pdp-quantity-value', 'span');
  qtyEl.innerText = '1';

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

  const elements = new Map([
    ['pdp-3d-scene', mockSceneElement],
    ['pdp-3d-object', mockCardElement],
    ['pdp-price', priceEl],
    ['pdp-cert-badge', certBadgeEl],
    ['pdp-quantity-value', qtyEl]
  ]);

  const cartHistory = [];
  const toastHistory = [];
  let fullReRenderCount = 0;
  let simulatedTime = 1000;

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    performance: { now: () => simulatedTime },
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
    PRODUCTS: sandbox.PRODUCTS,
    mockScene: mockSceneElement,
    mockCard: mockCardElement,
    priceEl,
    certBadgeEl,
    qtyEl,
    radiogroup,
    sceneStyles,
    cardStyles,
    sceneClassList,
    capturedPointers,
    cartHistory,
    toastHistory,
    getFullReRenderCount: () => fullReRenderCount,
    advanceTime: (ms) => { simulatedTime += ms; },
    setTime: (t) => { simulatedTime = t; }
  };
}

// Helper to extract rotateX and rotateY floats from inline transform
function parseTransforms(transformStr) {
  const rotXMatch = transformStr.match(/rotateX\((-?\d+\.?\d*)deg\)/);
  const rotYMatch = transformStr.match(/rotateY\((-?\d+\.?\d*)deg\)/);
  return {
    rotX: rotXMatch ? parseFloat(rotXMatch[1]) : 0,
    rotY: rotYMatch ? parseFloat(rotYMatch[1]) : 0
  };
}

/* ==============================================================================
 * SUITE 1: REQUIREMENT R1 — 3D CARD DRAG INTERACTION & 360° EULER ROTATION
 * ============================================================================== */

test('R1 Adversarial [1.1]: Pointer drag lifecycle rigorously transitions styles and captures pointer', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard, sceneClassList, capturedPointers } = env;
  PDPView.afterRender();

  // 1. Initial State
  assert.equal(PDPView._card3D.isDragging, false);
  assert.equal(sceneClassList.has('is-dragging'), false);

  // 2. Pointer Down (Primary Button)
  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 200, pointerId: 42, type: 'pointerdown' });
  assert.equal(PDPView._card3D.isDragging, true, 'isDragging must be true on pointerdown');
  assert.equal(mockCard.style.transition, 'none', 'transition must be none during active drag');
  assert.ok(sceneClassList.has('is-dragging'), 'Scene must receive is-dragging CSS class');
  assert.ok(capturedPointers.has(42), 'Pointer must be captured');

  // 3. Pointer Move
  mockScene.dispatch('pointermove', { clientX: 150, clientY: 220, pointerId: 42, type: 'pointermove' });
  const t1 = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t1.rotY - 27.50) < 0.01, `Expected rotY ~27.50, got: ${t1.rotY}`);
  assert.ok(Math.abs(t1.rotX - (-7.00)) < 0.01, `Expected rotX ~-7.00, got: ${t1.rotX}`);

  // 4. Pointer Up
  mockScene.dispatch('pointerup', { pointerId: 42, type: 'pointerup' });
  assert.equal(PDPView._card3D.isDragging, false, 'isDragging must be false after pointerup');
  assert.equal(mockCard.style.transition, 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)', 'Smooth transition must be restored');
  assert.equal(sceneClassList.has('is-dragging'), false, 'is-dragging class must be removed');
  assert.equal(capturedPointers.has(42), false, 'Pointer capture must be released');
});

test('R1 Adversarial [1.2]: Continuous endless 360° rotation across multiple revolutions (+1080° and -1080°)', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard } = env;
  PDPView.afterRender();

  // Drag in positive horizontal direction past 1, 2, and 3 full revolutions
  mockScene.dispatch('pointerdown', { button: 0, clientX: 0, clientY: 100, pointerId: 1 });
  
  // 360 degrees = ~654.55 px
  mockScene.dispatch('pointermove', { clientX: 654.55, clientY: 100, pointerId: 1 });
  let t = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t.rotY - 360.00) < 0.1, `Expected ~360deg, got: ${t.rotY}`);

  // 720 degrees = ~1309.09 px
  mockScene.dispatch('pointermove', { clientX: 1309.09, clientY: 100, pointerId: 1 });
  t = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t.rotY - 720.00) < 0.1, `Expected ~720deg, got: ${t.rotY}`);

  // 1080 degrees (3 full spins) = ~1963.64 px
  mockScene.dispatch('pointermove', { clientX: 1963.64, clientY: 100, pointerId: 1 });
  t = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t.rotY - 1080.00) < 0.1, `Expected ~1080deg, got: ${t.rotY}`);

  mockScene.dispatch('pointerup', { pointerId: 1 });

  // Now perform reverse negative spin: 4 full counter-clockwise revolutions (-1440 degrees)
  mockScene.dispatch('pointerdown', { button: 0, clientX: 0, clientY: 100, pointerId: 2 });
  // Dragging left by 2618.18 px reduces rotY by 1440 deg: 1080 - 1440 = -360 deg
  mockScene.dispatch('pointermove', { clientX: -2618.18, clientY: 100, pointerId: 2 });
  t = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t.rotY - (-360.00)) < 0.2, `Expected -360deg, got: ${t.rotY}`);

  mockScene.dispatch('pointerup', { pointerId: 2 });
});

test('R1 Adversarial [1.3]: Vertical tilt is strictly clamped at [-40deg, +40deg] under extreme pointer excursions', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard } = env;
  PDPView.afterRender();

  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 300, pointerId: 1 });

  // Extreme upward drags (-1000px, -50000px)
  mockScene.dispatch('pointermove', { clientX: 100, clientY: -700, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotX, 40.00, 'Upward drag must clamp at +40deg');

  mockScene.dispatch('pointermove', { clientX: 100, clientY: -50000, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotX, 40.00, 'Extreme upward drag must clamp at +40deg');

  // Extreme downward drags (+1000px, +50000px)
  mockScene.dispatch('pointermove', { clientX: 100, clientY: 1300, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotX, -40.00, 'Downward drag must clamp at -40deg');

  mockScene.dispatch('pointermove', { clientX: 100, clientY: 50000, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotX, -40.00, 'Extreme downward drag must clamp at -40deg');

  // Reversal test: Moving back towards center immediately unclamps
  // startY was 300; moving to clientY = 320 means dy = +20 -> rotX = -(20 * 0.35) = -7.00 deg
  mockScene.dispatch('pointermove', { clientX: 100, clientY: 320, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotX, -7.00, 'Reversal must immediately unclamp tilt');

  mockScene.dispatch('pointerup', { pointerId: 1 });
});

test('R1 Adversarial [1.4]: High-velocity momentum flick applies clamped inertial boost; slow release has no momentum', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard, setTime, advanceTime } = env;
  PDPView.afterRender();

  // Test A: High velocity flick to the right (dx = +150px in 15ms -> vx = 10 px/ms)
  setTime(1000);
  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  
  advanceTime(15);
  mockScene.dispatch('pointermove', { clientX: 250, clientY: 100, pointerId: 1 });
  
  // Before release: rotY = 150 * 0.55 = 82.50 deg
  const preReleaseRotY = parseTransforms(mockCard.style.transform).rotY;
  assert.equal(preReleaseRotY, 82.50);

  // On release: momentum should be Math.min(60, vx * 80) = +60 deg
  mockScene.dispatch('pointerup', { pointerId: 1 });
  const postReleaseRotY = parseTransforms(mockCard.style.transform).rotY;
  assert.equal(postReleaseRotY, 82.50 + 60.00, 'Must apply maximum momentum clamp of +60deg');

  // Test B: Slow release (dx = +10px in 200ms -> vx = 0.05 px/ms < 0.15 threshold)
  setTime(2000);
  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 2 });
  
  advanceTime(200);
  mockScene.dispatch('pointermove', { clientX: 110, clientY: 100, pointerId: 2 });
  const slowPreRotY = parseTransforms(mockCard.style.transform).rotY;

  mockScene.dispatch('pointerup', { pointerId: 2 });
  const slowPostRotY = parseTransforms(mockCard.style.transform).rotY;
  assert.equal(slowPostRotY, slowPreRotY, 'Slow release under threshold (0.15) must not add momentum');
});

test('R1 Adversarial [1.5]: Touch events (touchstart, touchmove, touchend) support single-finger & multi-touch gracefully', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard } = env;
  PDPView.afterRender();

  let prevented = false;
  // Multi-touch simulation: 2 fingers touch down simultaneously
  mockScene.dispatch('touchstart', {
    touches: [
      { clientX: 200, clientY: 300 },
      { clientX: 250, clientY: 350 }
    ],
    type: 'touchstart',
    cancelable: true,
    preventDefault: () => { prevented = true; }
  });

  assert.equal(PDPView._card3D.isDragging, true, 'Touchstart must initialize dragging');
  assert.equal(PDPView._card3D.startX, 200, 'First touch clientX must be tracked as startX');

  // Multi-touch move: primary finger moves dx = +60, dy = -30
  mockScene.dispatch('touchmove', {
    touches: [
      { clientX: 260, clientY: 270 },
      { clientX: 310, clientY: 320 }
    ],
    type: 'touchmove',
    cancelable: true,
    preventDefault: () => { prevented = true; }
  });

  const t = parseTransforms(mockCard.style.transform);
  assert.equal(t.rotY, 60 * 0.55); // 33.00 deg
  assert.equal(t.rotX, 30 * 0.35); // 10.50 deg

  // Touchend: user lifts fingers
  mockScene.dispatch('touchend', { type: 'touchend' });
  assert.equal(PDPView._card3D.isDragging, false, 'Touchend must end drag session');
});

test('R1 Adversarial [1.6]: Non-primary mouse buttons (middle click, right click) are strictly ignored', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard } = env;
  PDPView.afterRender();

  // Right Click (button = 2)
  mockScene.dispatch('pointerdown', { button: 2, clientX: 100, clientY: 100, pointerId: 1 });
  assert.equal(PDPView._card3D.isDragging, false);
  mockScene.dispatch('pointermove', { clientX: 300, clientY: 100, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotY, 0.00);

  // Middle Click (button = 1)
  mockScene.dispatch('pointerdown', { button: 1, clientX: 100, clientY: 100, pointerId: 1 });
  assert.equal(PDPView._card3D.isDragging, false);
  mockScene.dispatch('pointermove', { clientX: 300, clientY: 100, pointerId: 1 });
  assert.equal(parseTransforms(mockCard.style.transform).rotY, 0.00);
});

test('R1 Adversarial [1.7]: Holographic sheen coordinates (--holo-x, --holo-y) maintain [0%, 100%] bounds under 1,000 randomized stresses', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, sceneStyles } = env;
  PDPView.afterRender();

  // Test exact center: scene is left: 50, top: 50, width: 400, height: 600
  // Center is clientX = 250, clientY = 350
  mockScene.dispatch('pointermove', { clientX: 250, clientY: 350 });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');

  // Test extreme coordinates
  mockScene.dispatch('pointermove', { clientX: -99999, clientY: -99999 });
  assert.equal(sceneStyles['--holo-x'], '0.0%');
  assert.equal(sceneStyles['--holo-y'], '0.0%');

  mockScene.dispatch('pointermove', { clientX: 999999, clientY: 999999 });
  assert.equal(sceneStyles['--holo-x'], '100.0%');
  assert.equal(sceneStyles['--holo-y'], '100.0%');

  // Malformed / NaN coordinates must be rejected safely
  mockScene.dispatch('pointermove', { clientX: NaN, clientY: NaN });
  assert.equal(sceneStyles['--holo-x'], '100.0%', 'NaN must not alter existing valid sheen value');

  // Randomized stress: 1,000 iterations
  for (let i = 0; i < 1000; i++) {
    const rx = (Math.random() - 0.5) * 5000;
    const ry = (Math.random() - 0.5) * 5000;
    mockScene.dispatch('pointermove', { clientX: rx, clientY: ry });
    
    const xVal = parseFloat(sceneStyles['--holo-x']);
    const yVal = parseFloat(sceneStyles['--holo-y']);
    assert.ok(xVal >= 0 && xVal <= 100, `Holo X out of bounds: ${xVal}%`);
    assert.ok(yVal >= 0 && yVal <= 100, `Holo Y out of bounds: ${yVal}%`);
  }
});

test('R1 Adversarial [1.8]: Pointercancel gracefully terminates drag session and restores smooth transition', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard, sceneClassList } = env;
  PDPView.afterRender();

  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  assert.equal(PDPView._card3D.isDragging, true);

  mockScene.dispatch('pointercancel', { pointerId: 1, type: 'pointercancel' });
  assert.equal(PDPView._card3D.isDragging, false, 'pointercancel must cancel drag');
  assert.equal(sceneClassList.has('is-dragging'), false);
  assert.equal(mockCard.style.transition, 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)');
});

test('R1 Adversarial [1.9]: Repeated afterRender() calls abort previous listeners without handler duplication', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard } = env;

  // Call afterRender 5 times in a row
  PDPView.afterRender();
  PDPView.afterRender();
  PDPView.afterRender();
  PDPView.afterRender();
  PDPView.afterRender();

  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  mockScene.dispatch('pointermove', { clientX: 200, clientY: 100, pointerId: 1 });
  mockScene.dispatch('pointerup', { pointerId: 1 });

  // If listeners had multiplied and accumulated deltas 5 times, rotY would be 5 * 55 = 275deg
  // With AbortController / clean replacement, rotY should be ~55deg
  const t = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(t.rotY - 55.00) < 1.0, `Expected rotY ~55deg, got: ${t.rotY}`);
});

test('R1 Adversarial [1.10]: Rapid back-and-forth high-frequency jitter (sub-10ms events) does not cause NaN velocity', () => {
  const env = createAdversarialEnvironment();
  const { PDPView, mockScene, mockCard, advanceTime, setTime } = env;
  PDPView.afterRender();

  setTime(1000);
  mockScene.dispatch('pointerdown', { button: 0, clientX: 200, clientY: 200, pointerId: 1 });

  // Rapid jitter at 2ms intervals
  for (let i = 0; i < 20; i++) {
    advanceTime(2);
    const jitterX = 200 + (i % 2 === 0 ? 5 : -5);
    mockScene.dispatch('pointermove', { clientX: jitterX, clientY: 200, pointerId: 1 });
  }

  assert.equal(isNaN(PDPView._card3D.velocityX), false, 'Velocity must never be NaN under high-frequency jitter');
  assert.equal(isFinite(PDPView._card3D.velocityX), true, 'Velocity must be finite');

  mockScene.dispatch('pointerup', { pointerId: 1 });
  assert.equal(isNaN(parseTransforms(mockCard.style.transform).rotY), false, 'Transform rotY must not be NaN');
});


/* ==============================================================================
 * SUITE 2: REQUIREMENT R2 — DYNAMIC CONDITION PRICING & STATE PRESERVATION
 * ============================================================================== */

test('R2 Adversarial [2.1]: Rapid switching between all 4 conditions updates #pdp-price immediately without DOM destruction', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, priceEl, certBadgeEl, radiogroup, getFullReRenderCount } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;
  // Product pricing: raw: 750, psa8: 1800, psa9: 4850, psa10: 18500

  const conditions = [
    { key: 'raw', expectedPrice: '$750.00 USD', badgeTitle: 'Sin Gradear (Raw NM)' },
    { key: 'psa8', expectedPrice: '$1,800.00 USD', badgeTitle: 'PSA 8 NM-MT' },
    { key: 'psa9', expectedPrice: '$4,850.00 USD', badgeTitle: 'PSA 9 MINT' },
    { key: 'psa10', expectedPrice: '$18,500.00 USD', badgeTitle: 'PSA 10 GEM MT' }
  ];

  // Cycle through conditions 3 times rapidly
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const cond of conditions) {
      PDPView.selectCondition(cond.key);

      assert.equal(Store.data.pdpSelectedCondition, cond.key);
      assert.equal(priceEl.innerText, cond.expectedPrice, `Expected ${cond.expectedPrice}, got: ${priceEl.innerText}`);
      assert.ok(certBadgeEl.innerText.includes(cond.badgeTitle), `Badge must include ${cond.badgeTitle}`);
      assert.equal(getFullReRenderCount(), 0, 'Must NOT trigger destructive full view re-renders');
    }
  }

  // Verify radiogroup button styles on last selection (psa10)
  const buttons = radiogroup.querySelectorAll('button');
  assert.equal(buttons.length, 4);
  assert.ok(buttons[3].className.includes('bg-[#0F172A]'), 'PSA 10 button must be active');
  assert.ok(buttons[0].className.includes('bg-white'), 'Raw button must be inactive');
});

test('R2 Adversarial [2.2]: Condition switching preserves non-zero 3D card rotation state and continues drag seamlessly', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, mockScene, mockCard } = env;
  PDPView.afterRender();

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  // 1. User drags card to rotY = 135deg, rotX = 25deg
  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 200, pointerId: 1 });
  // dx = +245.45 px -> rotY = 135.00 deg
  // dy = -71.43 px -> rotX = +25.00 deg
  mockScene.dispatch('pointermove', { clientX: 345.45, clientY: 128.57, pointerId: 1 });
  mockScene.dispatch('pointerup', { pointerId: 1 });

  const initialT = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(initialT.rotY - 135.00) < 0.2);
  assert.ok(Math.abs(initialT.rotX - 25.00) < 0.2);

  // 2. User switches conditions multiple times: raw -> psa8 -> psa9 -> psa10
  PDPView.selectCondition('raw');
  PDPView.selectCondition('psa8');
  PDPView.selectCondition('psa9');
  PDPView.selectCondition('psa10');

  // 3. Verify card transform did NOT reset to 0 or flip
  const postSelectT = parseTransforms(mockCard.style.transform);
  assert.equal(postSelectT.rotY, initialT.rotY, '3D rotation rotY must remain completely unchanged');
  assert.equal(postSelectT.rotX, initialT.rotX, '3D rotation rotX must remain completely unchanged');

  // 4. User initiates a second drag gesture: should rotate smoothly from 135deg
  mockScene.dispatch('pointerdown', { button: 0, clientX: 200, clientY: 200, pointerId: 2 });
  mockScene.dispatch('pointermove', { clientX: 250, clientY: 200, pointerId: 2 }); // dx = +50 -> +27.5 deg
  mockScene.dispatch('pointerup', { pointerId: 2 });

  const secondDragT = parseTransforms(mockCard.style.transform);
  assert.ok(Math.abs(secondDragT.rotY - (initialT.rotY + 27.50)) < 0.5, 'Second drag must accumulate on top of preserved angle');
});

test('R2 Adversarial [2.3]: Defensive pricing engine deterministically calculates 1.0x, 1.35x, 2.10x, 5.20x tiers for malformed cards', () => {
  const env = createAdversarialEnvironment();
  const { PDPView } = env;

  // Case A: Card with only precioEstimado = 200 (no precios object)
  const cardOnlyEstimado = { id: 'c1', nombre: 'Test Card A', precioEstimado: 200 };
  const pricesA = PDPView.getConditionPrices(cardOnlyEstimado);
  assert.equal(pricesA.raw, 200, 'raw tier = 1.0x (200)');
  assert.equal(pricesA.psa8, 270, 'psa8 tier = 1.35x (270)');
  assert.equal(pricesA.psa9, 420, 'psa9 tier = 2.10x (420)');
  assert.equal(pricesA.psa10, 1040, 'psa10 tier = 5.20x (1040)');

  // Case B: Card with only partial precios dictionary (only raw = 300)
  const cardPartialRaw = { id: 'c2', nombre: 'Test Card B', precios: { raw: 300 } };
  const pricesB = PDPView.getConditionPrices(cardPartialRaw);
  assert.equal(pricesB.raw, 300);
  assert.equal(pricesB.psa8, Math.round(300 * 1.35)); // 405
  assert.equal(pricesB.psa9, Math.round(300 * 2.10)); // 630
  assert.equal(pricesB.psa10, Math.round(300 * 5.20)); // 1560

  // Case C: Card with only PSA 10 price = 5200 (reverse calculates base = 1000)
  const cardPartialPSA10 = { id: 'c3', nombre: 'Test Card C', precios: { psa10: 5200 } };
  const pricesC = PDPView.getConditionPrices(cardPartialPSA10);
  assert.equal(pricesC.raw, 1000);
  assert.equal(pricesC.psa8, 1350);
  assert.equal(pricesC.psa9, 2100);
  assert.equal(pricesC.psa10, 5200);

  // Case D: Card with only precioUnitario = 50
  const cardUnitario = { id: 'c4', nombre: 'Test Card D', precioUnitario: 50 };
  const pricesD = PDPView.getConditionPrices(cardUnitario);
  assert.equal(pricesD.raw, 50);
  assert.equal(pricesD.psa8, 68);
  assert.equal(pricesD.psa9, 105);
  assert.equal(pricesD.psa10, 260);

  // Case E: Null / undefined card safe fallback
  const pricesNull = PDPView.getConditionPrices(null);
  assert.equal(typeof pricesNull.raw, 'number');
  assert.equal(typeof pricesNull.psa10, 'number');
  assert.ok(pricesNull.psa10 > pricesNull.raw);
});

test('R2 Adversarial [2.4]: Cart addition captures exact selected condition grade, dynamic price, and SKU', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, cartHistory } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  // Select PSA 9 and quantity 3
  PDPView.selectCondition('psa9');
  Store.data.pdpQuantity = 3;

  PDPView.addToCart();

  assert.equal(cartHistory.length, 1);
  const item = cartHistory[0];
  assert.equal(item.sku, 'charizard-base-psa9', 'SKU must incorporate selected condition grade');
  assert.equal(item.name, product.nombre);
  assert.equal(item.label, 'PSA 9 MINT', 'Condition label must match grade full title');
  assert.equal(item.price, 4850, 'Price must match PSA 9 price ($4,850)');
  assert.equal(item.qty, 3, 'Quantity must match pdpQuantity');

  // Verify pdpQuantity resets to 1 after addition
  assert.equal(Store.data.pdpQuantity, 1, 'Quantity must reset to 1 after adding to cart');
});

test('R2 Adversarial [2.5]: Sealed products are completely immune to condition grading selection', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, cartHistory } = env;

  const sealedBox = Store.getProduct('booster-team-rocket');
  Store.data.currentPdpProduct = sealedBox;
  
  // Attempt to select condition psa8 in state
  Store.data.pdpSelectedCondition = 'psa8';
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(cartHistory.length, 1);
  const item = cartHistory[0];
  assert.equal(item.sku, 'booster-team-rocket-sealed', 'Sealed product SKU must always end in -sealed');
  assert.equal(item.label, 'Sellado de Fábrica (Caja Intacta)', 'Sealed product must use factory seal label');
  assert.equal(item.price, sealedBox.precioUnitario, 'Sealed product must use unit price, ignoring condition state');
});

test('R2 Adversarial [2.6]: Toast notification fires with accurate condition label and price formatting on selection', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, toastHistory } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  PDPView.selectCondition('raw');
  assert.equal(toastHistory.length, 1);
  assert.equal(toastHistory[0].type, 'info');
  assert.ok(toastHistory[0].msg.includes('RAW'));
  assert.ok(toastHistory[0].msg.includes('$750.00'));

  PDPView.selectCondition('psa10');
  assert.equal(toastHistory.length, 2);
  assert.ok(toastHistory[1].msg.includes('PSA10'));
  assert.ok(toastHistory[1].msg.includes('$18,500.00'));
});

test('R2 Adversarial [2.7]: Repeated selection of the same condition is strictly idempotent', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, priceEl, radiogroup } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  // Click PSA 10 50 times
  for (let i = 0; i < 50; i++) {
    PDPView.selectCondition('psa10');
  }

  assert.equal(Store.data.pdpSelectedCondition, 'psa10');
  assert.equal(priceEl.innerText, '$18,500.00 USD');

  // Verify that only one checkmark icon exists in the active button
  const buttons = radiogroup.querySelectorAll('button');
  const psa10Header = buttons[3].querySelector('div:first-child');
  const checkIcons = psa10Header.children.filter(c => c.tagName === 'I');
  assert.equal(checkIcons.length, 1, 'Idempotency: exactly 1 check icon should exist');
});

test('R2 Adversarial [2.8]: PDPView.updateQuantity clamps between [1, 10] under extreme delta inputs', () => {
  const env = createAdversarialEnvironment();
  const { Store, PDPView, qtyEl } = env;

  // Extreme positive delta
  const q1 = PDPView.updateQuantity(999);
  assert.equal(q1, 10);
  assert.equal(Store.data.pdpQuantity, 10);
  assert.equal(qtyEl.innerText, '10');

  // Extreme negative delta
  const q2 = PDPView.updateQuantity(-999);
  assert.equal(q2, 1);
  assert.equal(Store.data.pdpQuantity, 1);
  assert.equal(qtyEl.innerText, '1');

  // String delta
  const q3 = PDPView.updateQuantity('3');
  assert.equal(q3, 4);

  // Non-numeric / NaN input
  const q4 = PDPView.updateQuantity('invalid_delta');
  assert.equal(q4, undefined, 'Invalid delta returns undefined');
  assert.equal(Store.data.pdpQuantity, 4, 'Invalid delta leaves quantity unchanged');
});

test('R2 Adversarial [2.9]: String and float pricing representations in getConditionPrices evaluate safely', () => {
  const env = createAdversarialEnvironment();
  const { PDPView } = env;

  // Float base price with fractions: 99.95
  const cardFloat = { id: 'c-float', nombre: 'Float Card', precioEstimado: 99.95 };
  const prices = PDPView.getConditionPrices(cardFloat);

  assert.equal(Number.isInteger(prices.raw), true, 'All condition tiers must be integer prices');
  assert.equal(Number.isInteger(prices.psa8), true);
  assert.equal(Number.isInteger(prices.psa9), true);
  assert.equal(Number.isInteger(prices.psa10), true);

  assert.equal(prices.raw, 100);
  assert.equal(prices.psa8, Math.round(99.95 * 1.35)); // 135
  assert.equal(prices.psa9, Math.round(99.95 * 2.10)); // 210
  assert.equal(prices.psa10, Math.round(99.95 * 5.20)); // 520
});

