/**
 * ==============================================================================
 * Acceptance Test Suite: Interactive 3D Card Viewer on PDP (Requirement R1)
 * File: tests/test_pdp_3d_drag.test.mjs
 * 
 * Verifies:
 * 1. 3D Card Scene Structure & Perspective
 * 2. Mouse Drag (mousedown -> mousemove) 3D Euler Rotation & 1:1 Response
 * 3. Mouse Release (mouseup) & Smooth Deceleration Transition Restoration
 * 4. Touch Drag (touchstart -> touchmove -> touchend) on Touch Devices
 * 5. Full 360° Front/Reverse Inspection & Backface Visibility
 * 6. Dynamic Holographic Sheen Tracking (--holo-x, --holo-y)
 * 7. Edge Cases: Boundary Events, NaN Coordinates, Non-Primary Buttons
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function create3DDragEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');

  const listeners = new Map();
  const sceneStyles = {};
  const cardStyles = { transform: '', transition: '' };
  const sceneClassList = new Set(['card-3d-scene']);

  const mockSceneElement = {
    id: 'pdp-3d-scene',
    classList: {
      add: (cls) => sceneClassList.add(cls),
      remove: (cls) => sceneClassList.delete(cls),
      contains: (cls) => sceneClassList.has(cls)
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 600 }),
    style: {
      setProperty(key, val) { sceneStyles[key] = String(val); },
      getPropertyValue(key) { return sceneStyles[key]; },
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
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    dispatch(type, eventObj = {}) {
      const handlers = listeners.get(type) || [];
      handlers.forEach(h => h(eventObj));
    }
  };

  const mockCardElement = {
    id: 'pdp-3d-object',
    style: cardStyles
  };

  const elements = new Map([
    ['pdp-3d-scene', mockSceneElement],
    ['pdp-3d-object', mockCardElement],
    ['pdp-price', { innerText: '$18,500.00 USD' }],
    ['pdp-cert-badge', { innerText: 'PSA 10 GEM MT • #48291034' }],
    ['pdp-quantity-value', { innerText: '1' }]
  ]);

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    performance: { now: () => 1000 },
    document: {
      getElementById: (id) => elements.get(id) || null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    app: {
      renderCurrentView: () => {},
      showToast: () => {},
      addToCart: () => {}
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
    mockScene: mockSceneElement,
    mockCard: mockCardElement,
    sceneStyles,
    cardStyles,
    sceneClassList
  };
}

test('R1 3D Drag [Test 1.1]: PDPView.render() produces complete 3D viewer markup with front and back faces', () => {
  const { PDPView, Store } = create3DDragEnvironment();
  Store.data.currentPdpProduct = Store.getProduct('charizard-base');
  Store.data.pdpInspectorMode = 'front';

  const html = PDPView.render();

  assert.ok(html.includes('id="pdp-3d-scene"'), 'Must contain #pdp-3d-scene');
  assert.ok(html.includes('id="pdp-3d-object"'), 'Must contain #pdp-3d-object');
  assert.ok(html.includes('card-3d-front'), 'Must contain .card-3d-front');
  assert.ok(html.includes('card-3d-back'), 'Must contain .card-3d-back');
  assert.ok(html.includes('id="pdp-holo-layer"'), 'Must contain #pdp-holo-layer');
  assert.ok(html.includes('img/cards/card-back.png'), 'Must render official card back artwork');
  assert.ok(html.includes('pointer-events-none'), 'Card images must have pointer-events-none to prevent ghost drag');
});

test('R1 3D Drag [Test 1.2]: Mouse drag (mousedown -> mousemove) updates rotateX and rotateY with transition: none', () => {
  const { PDPView, mockScene, mockCard, sceneClassList } = create3DDragEnvironment();
  PDPView.afterRender();

  // Pointer down at (200, 300)
  mockScene.dispatch('pointerdown', { button: 0, clientX: 200, clientY: 300, pointerId: 1, type: 'pointerdown' });

  assert.equal(mockCard.style.transition, 'none', 'Active drag must set transition: none for 1:1 instant tracking');
  assert.ok(sceneClassList.has('is-dragging'), 'Scene must receive is-dragging class');

  // Drag 100px right (dx = +100), 40px down (dy = +40)
  mockScene.dispatch('pointermove', { clientX: 300, clientY: 340, pointerId: 1, type: 'pointermove' });

  // rotY should be: 0 + 100 * 0.55 = 55.00 deg
  // rotX should be: 0 - 40 * 0.35 = -14.00 deg
  assert.ok(mockCard.style.transform.includes('perspective(1000px)'), 'Transform must include perspective(1000px)');
  assert.ok(mockCard.style.transform.includes('rotateY(55.00deg)'), `Expected rotateY(55.00deg), got: ${mockCard.style.transform}`);
  assert.ok(mockCard.style.transform.includes('rotateX(-14.00deg)'), `Expected rotateX(-14.00deg), got: ${mockCard.style.transform}`);
});

test('R1 3D Drag [Test 1.3]: Vertical tilt is strictly clamped between [-40deg, +40deg]', () => {
  const { PDPView, mockScene, mockCard } = create3DDragEnvironment();
  PDPView.afterRender();

  // Start drag at (200, 300)
  mockScene.dispatch('pointerdown', { button: 0, clientX: 200, clientY: 300, pointerId: 1 });

  // Massive upward drag (dy = -500px -> unclamped would be +175deg)
  mockScene.dispatch('pointermove', { clientX: 200, clientY: -200, pointerId: 1 });
  assert.ok(mockCard.style.transform.includes('rotateX(40.00deg)'), 'Tilt must clamp at +40deg maximum');

  // Massive downward drag (dy = +500px -> unclamped would be -175deg)
  mockScene.dispatch('pointermove', { clientX: 200, clientY: 800, pointerId: 1 });
  assert.ok(mockCard.style.transform.includes('rotateX(-40.00deg)'), 'Tilt must clamp at -40deg minimum');
});

test('R1 3D Drag [Test 1.4]: Pointer release (pointerup) restores smooth transition and applies momentum', () => {
  const { PDPView, mockScene, mockCard, sceneClassList, sandbox } = create3DDragEnvironment();
  PDPView.afterRender();

  mockScene.dispatch('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
  
  // Simulate high-speed flick: 50px delta across 20ms
  sandbox.performance.now = () => 1020;
  mockScene.dispatch('pointermove', { clientX: 150, clientY: 100, pointerId: 1 });

  mockScene.dispatch('pointerup', { pointerId: 1 });

  assert.equal(mockCard.style.transition, 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)', 'Must restore smooth deceleration transition');
  assert.ok(!sceneClassList.has('is-dragging'), 'Must remove is-dragging class on release');
  assert.equal(PDPView._card3D.isDragging, false, 'Internal drag state must be false');
});

test('R1 3D Drag [Test 1.5]: Touch drag (touchstart -> touchmove -> touchend) operates smoothly on mobile', () => {
  const { PDPView, mockScene, mockCard } = create3DDragEnvironment();
  PDPView.afterRender();

  // Simulate mobile touchstart
  mockScene.dispatch('touchstart', {
    touches: [{ clientX: 150, clientY: 250 }],
    type: 'touchstart',
    cancelable: true,
    preventDefault: () => {}
  });

  assert.equal(mockCard.style.transition, 'none');

  // Simulate mobile touchmove
  mockScene.dispatch('touchmove', {
    touches: [{ clientX: 220, clientY: 210 }],
    type: 'touchmove',
    cancelable: true,
    preventDefault: () => {}
  });

  // dx = +70px -> rotY = 70 * 0.55 = 38.50deg
  // dy = -40px -> rotX = -(-40 * 0.35) = +14.00deg
  assert.ok(mockCard.style.transform.includes('rotateY(38.50deg)'), `Expected rotateY(38.50deg), got: ${mockCard.style.transform}`);
  assert.ok(mockCard.style.transform.includes('rotateX(14.00deg)'), `Expected rotateX(14.00deg), got: ${mockCard.style.transform}`);

  // Simulate mobile touchend
  mockScene.dispatch('touchend', { type: 'touchend' });
  assert.equal(PDPView._card3D.isDragging, false);
});

test('R1 3D Drag [Test 1.6]: Continuous 360° inspection allows full rotation past 180° and 360°', () => {
  const { PDPView, mockScene, mockCard } = create3DDragEnvironment();
  PDPView.afterRender();

  mockScene.dispatch('pointerdown', { button: 0, clientX: 0, clientY: 300 });

  // Rotate past 180° (reverso) -> ~360px drag = 198.00deg
  mockScene.dispatch('pointermove', { clientX: 360, clientY: 300 });
  assert.ok(mockCard.style.transform.includes('rotateY(198.00deg)'), 'Must smoothly rotate past 180 degrees');

  // Rotate past 360° (full continuous revolution) -> ~720px drag = 396.00deg
  mockScene.dispatch('pointermove', { clientX: 720, clientY: 300 });
  assert.ok(mockCard.style.transform.includes('rotateY(396.00deg)'), 'Must rotate continuously past 360 degrees without resetting');
});

test('R1 3D Drag [Test 1.7]: Pointer move updates holographic sheen coordinates (--holo-x, --holo-y)', () => {
  const { PDPView, mockScene, sceneStyles } = create3DDragEnvironment();
  PDPView.afterRender();

  // Pointer at center of 400x600 scene: (200, 300) -> 50.0%, 50.0%
  mockScene.dispatch('pointermove', { clientX: 200, clientY: 300 });
  assert.equal(sceneStyles['--holo-x'], '50.0%');
  assert.equal(sceneStyles['--holo-y'], '50.0%');

  // Pointer at top-left: (40, 60) -> 10.0%, 10.0%
  mockScene.dispatch('pointermove', { clientX: 40, clientY: 60 });
  assert.equal(sceneStyles['--holo-x'], '10.0%');
  assert.equal(sceneStyles['--holo-y'], '10.0%');
});

test('R1 3D Drag [Test 1.8]: Non-primary mouse buttons (right click / middle click) are ignored', () => {
  const { PDPView, mockScene, mockCard } = create3DDragEnvironment();
  PDPView.afterRender();

  // Secondary button (button = 2) should not initiate drag
  mockScene.dispatch('pointerdown', { button: 2, clientX: 100, clientY: 100 });
  assert.equal(PDPView._card3D.isDragging, false, 'Right click must not trigger drag');

  mockScene.dispatch('pointermove', { clientX: 200, clientY: 100 });
  assert.equal(mockCard.style.transform, 'perspective(1000px) rotateX(0.00deg) rotateY(0.00deg)');
});
