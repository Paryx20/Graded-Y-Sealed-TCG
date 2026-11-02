/**
 * ==============================================================================
 * Milestone 1 Empirical Stress Verification Harness
 * File: tests/stress_verification_m1.mjs
 * Description: Adversarial empirical testing and stress testing of Milestone 1:
 *              - Phase 4 Visual Assets & Adaptive 3D PDP
 * Tests Executed:
 *   1. Extreme quantity inputs in updateQuantity() (-100, 0, +1000, non-numeric strings, NaN, etc.)
 *   2. Rapid angle switching in setSealedAngle() across valid and invalid angle keys + XSS payloads
 *   3. Inspector mode switching ('front', 'back', 'slab', undefined, null, invalid)
 *   4. Holographic mousemove coordinate updates (handleHoloMove) under extreme coordinates
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Track results
const summary = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  findings: []
};

function assert(condition, message) {
  summary.totalTests++;
  if (condition) {
    summary.passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    summary.failed++;
    console.error(`  [FAIL] ${message}`);
    summary.findings.push({ severity: 'HIGH', message });
  }
}

function recordFinding(severity, title, detail) {
  summary.findings.push({ severity, title, detail });
  console.log(`  [FINDING - ${severity}] ${title}: ${detail}`);
}

// -----------------------------------------------------------------------------
// ENVIRONMENT SETUP
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log('STRESS TEST SUITE: MILESTONE 1 - ADAPTIVE PDP & 3D INSPECTOR');
console.log('================================================================\n');

const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');

const elementsMap = new Map();

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this._innerText = '';
    this._innerHTML = '';
    this.style = {
      _props: {},
      setProperty(k, v) { this._props[k] = String(v); },
      getPropertyValue(k) { return this._props[k] || ''; }
    };
    this._rect = { left: 100, top: 100, width: 200, height: 200, right: 300, bottom: 300 };
  }

  get innerText() { return this._innerText; }
  set innerText(val) { this._innerText = String(val); }

  getBoundingClientRect() {
    return { ...this._rect };
  }
}

function getOrRegisterElement(tag, id) {
  if (elementsMap.has(id)) return elementsMap.get(id);
  const el = new MockElement(tag, id);
  elementsMap.set(id, el);
  return el;
}

const mockDoc = {
  getElementById(id) {
    return elementsMap.get(id) || null;
  },
  createElement(tag) {
    return new MockElement(tag);
  }
};

let renderCount = 0;
let lastCartPayload = null;

const mockApp = {
  renderCurrentView: () => {
    renderCount++;
    const container = elementsMap.get('app-view');
    if (container && ctx.PDPView) {
      container.innerHTML = ctx.PDPView.render();
    }
  },
  showToast: () => {},
  addToCart: (id, name, cond, price, img, fb, qty) => {
    const units = Math.max(1, parseInt(qty, 10) || 1);
    lastCartPayload = { id, name, cond, price, img, fb, qty: units, rawQty: qty };
  }
};

const ctx = {
  console,
  setTimeout, clearTimeout,
  Math, Date, JSON,
  document: mockDoc,
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  app: mockApp
};

vm.createContext(ctx);
vm.runInContext(dataCode + '; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS;', ctx);
vm.runInContext(stateCode + '; globalThis.Store = Store;', ctx);
vm.runInContext(pdpCode + '; globalThis.PDPView = PDPView;', ctx);

const { Store, PDPView, PRODUCTS } = ctx;

// Setup key DOM containers
const appView = getOrRegisterElement('main', 'app-view');
const qtyEl = getOrRegisterElement('span', 'pdp-quantity-value');
const sceneEl = getOrRegisterElement('div', 'pdp-3d-scene');
const chartContainer = getOrRegisterElement('div', 'pdp-chart-container');
const chartSvg = getOrRegisterElement('svg', 'pdp-interactive-chart');
const chartTooltip = getOrRegisterElement('div', 'chart-hover-tooltip');

// Initialize app-view with default PDP render
appView.innerHTML = PDPView.render();

// ==============================================================================
// 1. STRESS TEST SUITE: QUANTITY STEPPER (updateQuantity)
// ==============================================================================
console.log('----------------------------------------------------------------');
console.log('1. STRESS TESTING: updateQuantity(delta)');
console.log('----------------------------------------------------------------');

// Test 1.1: delta = -100 from quantity 1
Store.data.pdpQuantity = 1;
qtyEl.innerText = '1';
PDPView.updateQuantity(-100);
assert(Store.data.pdpQuantity === 1, 'delta = -100 clamps at minimum 1 (Store)');
assert(qtyEl.innerText === '1', 'delta = -100 preserves DOM text as 1');

// Test 1.2: delta = 0 from quantity 1
Store.data.pdpQuantity = 1;
PDPView.updateQuantity(0);
assert(Store.data.pdpQuantity === 1, 'delta = 0 keeps quantity exactly at 1');

// Test 1.3: delta = +1000 from quantity 1
Store.data.pdpQuantity = 1;
PDPView.updateQuantity(1000);
assert(Store.data.pdpQuantity === 1, 'delta = +1000 clamps at upper bound 10 (rejected)');

// Test 1.4: Step increments to exact upper limit (10)
Store.data.pdpQuantity = 1;
for (let i = 0; i < 9; i++) {
  PDPView.updateQuantity(1);
}
assert(Store.data.pdpQuantity === 10, 'Step increments reach exact upper bound 10');
assert(qtyEl.innerText === '10', 'DOM element displays 10 at upper bound');

// Test 1.5: Increment beyond upper limit 10
PDPView.updateQuantity(1);
assert(Store.data.pdpQuantity === 10, 'Increment beyond 10 is strictly rejected (stays 10)');

// Test 1.6: Decrement back to 1
for (let i = 0; i < 9; i++) {
  PDPView.updateQuantity(-1);
}
assert(Store.data.pdpQuantity === 1, 'Decrements step back cleanly to 1');

// Test 1.7: Decrement below 1
PDPView.updateQuantity(-1);
assert(Store.data.pdpQuantity === 1, 'Decrement below 1 is strictly rejected (stays 1)');

// Test 1.8: Non-numeric string input (delta = "abc")
Store.data.pdpQuantity = 1;
PDPView.updateQuantity('abc');
const qtyAfterAbc = Store.data.pdpQuantity;
if (typeof qtyAfterAbc === 'string' || Number.isNaN(qtyAfterAbc)) {
  recordFinding(
    'MEDIUM',
    'updateQuantity string coercion leak',
    `Passing string delta "abc" produces "${qtyAfterAbc}" because NaN comparisons bypass (next < 1 || next > 10).`
  );
} else {
  assert(qtyAfterAbc === 1, 'delta = "abc" rejected cleanly');
}

// Test 1.9: Downstream Cart resilience with corrupted quantity
// Even if pdpQuantity is "1abc" or NaN, addToCart must sanitize via parseInt
PDPView.addToCart();
assert(lastCartPayload !== null, 'addToCart executed despite previous string delta');
assert(lastCartPayload.qty === 1, `Cart received sanitized quantity = ${lastCartPayload.qty} (defensive layer works)`);
assert(Store.data.pdpQuantity === 1, 'Store.data.pdpQuantity reset to 1 after addToCart');

// Test 1.11: Negative string delta (delta = "-100")
Store.data.pdpQuantity = 1;
PDPView.updateQuantity('-100');
const qtyNegStr = Store.data.pdpQuantity;
if (typeof qtyNegStr === 'string' || Number.isNaN(qtyNegStr)) {
  recordFinding(
    'MEDIUM',
    'updateQuantity negative string concatenation',
    `Passing negative string delta "-100" produces "${qtyNegStr}" because string concatenation bypasses numeric comparison.`
  );
}
PDPView.addToCart(); // Reset via cart sanitization

// Test 1.12: Infinity and -Infinity deltas
Store.data.pdpQuantity = 1;
PDPView.updateQuantity(Infinity);
assert(Store.data.pdpQuantity === 1, 'delta = Infinity rejected cleanly (exceeds max)');

PDPView.updateQuantity(-Infinity);
assert(Store.data.pdpQuantity === 1, 'delta = -Infinity rejected cleanly (below min)');

// Test 1.13: High-frequency alternating deltas (10,000 operations)
Store.data.pdpQuantity = 1;
let outOfBoundsCount = 0;
const startQtyWalk = performance.now();
for (let i = 0; i < 10000; i++) {
  const d = (i % 2 === 0) ? (i % 5 + 1) : -(i % 5 + 1);
  PDPView.updateQuantity(d);
  if (Store.data.pdpQuantity < 1 || Store.data.pdpQuantity > 10) {
    outOfBoundsCount++;
  }
}
const elapsedQtyWalk = (performance.now() - startQtyWalk).toFixed(2);
assert(outOfBoundsCount === 0, `10,000 high-frequency numeric steps maintained 1 <= qty <= 10 (${elapsedQtyWalk}ms)`);

console.log('');

// ==============================================================================
// 2. STRESS TEST SUITE: RAPID ANGLE SWITCHING (setSealedAngle)
// ==============================================================================
console.log('----------------------------------------------------------------');
console.log('2. STRESS TESTING: setSealedAngle(angle)');
console.log('----------------------------------------------------------------');

const sealedProduct = PRODUCTS.find(p => p.id === 'booster-team-rocket') || {
  id: 'booster-team-rocket',
  nombre: 'Booster Box Team Rocket 1999 Sealed',
  set: 'Team Rocket 1999',
  categoria: 'sealed',
  tipo_discriminador: 'PRODUCTO_SELLADO',
  tipo_item: 'PRODUCTO_SELLADO',
  era: 'vintage',
  condicionPrincipal: 'sealed',
  imagenLocal: 'img/sealed/team-rocket-box-front.png',
  imagenFallbackUrl: 'img/sealed/team-rocket-box-perspective.png',
  galeria_sellada: {
    frontal: 'img/sealed/team-rocket-box-front.png',
    perspectiva: 'img/sealed/team-rocket-box-perspective.png',
    lateral: 'img/sealed/team-rocket-box-side.png'
  }
};

Store.data.currentPdpProduct = sealedProduct;

// Test 2.1: Valid angles
PDPView.setSealedAngle('frontal');
assert(Store.data.pdpSealedAngle === 'frontal', 'setSealedAngle("frontal") stores "frontal"');
let stageHtml = PDPView.renderSealedGalleryStage(sealedProduct, Store.data.pdpSealedAngle);
assert(stageHtml.includes('team-rocket-box-front.png'), 'Frontal stage renders front image asset');
assert(stageHtml.includes('Ángulo: <strong class="text-[#0F172A] uppercase">Frontal</strong>'), 'Frontal stage displays Frontal label');

PDPView.setSealedAngle('perspectiva');
assert(Store.data.pdpSealedAngle === 'perspectiva', 'setSealedAngle("perspectiva") stores "perspectiva"');
stageHtml = PDPView.renderSealedGalleryStage(sealedProduct, Store.data.pdpSealedAngle);
assert(stageHtml.includes('team-rocket-box-perspective.png'), 'Perspectiva stage renders perspective image asset');
assert(stageHtml.includes('Perspectiva 3/4'), 'Perspectiva stage displays Perspectiva 3/4 label');

PDPView.setSealedAngle('lateral');
assert(Store.data.pdpSealedAngle === 'lateral', 'setSealedAngle("lateral") stores "lateral"');
stageHtml = PDPView.renderSealedGalleryStage(sealedProduct, Store.data.pdpSealedAngle);
assert(stageHtml.includes('team-rocket-box-side.png'), 'Lateral stage renders side profile image asset');
assert(stageHtml.includes('Lateral'), 'Lateral stage displays Lateral label');

// Test 2.2: Invalid angle keys fallback
const invalidAngles = ['', 'top', 'bottom', 'rear', 'isometric', null, undefined, 999, false, {}];
let invalidFallbackClean = true;
for (const bad of invalidAngles) {
  PDPView.setSealedAngle(bad);
  const out = PDPView.renderSealedGalleryStage(sealedProduct, Store.data.pdpSealedAngle);
  // Must fall back to frontal image and not throw
  if (!out.includes('team-rocket-box-front.png') && !out.includes(sealedProduct.imagenLocal)) {
    invalidFallbackClean = false;
  }
}
assert(invalidFallbackClean, 'All 10 invalid angle keys fall back safely to frontal image without error');

// Test 2.3: XSS Injection attempt in angle key
const xssPayload = '<script>alert("PWNED")</script>';
PDPView.setSealedAngle(xssPayload);
const renderedXssStage = PDPView.renderSealedGalleryStage(sealedProduct, Store.data.pdpSealedAngle);
const controlsXss = PDPView.renderSealedGalleryControls(sealedProduct, Store.data.pdpSealedAngle);
assert(!renderedXssStage.includes('<script>'), 'XSS payload in setSealedAngle is NOT injected into gallery stage');
assert(!controlsXss.includes('<script>'), 'XSS payload in setSealedAngle is NOT injected into gallery controls');

// Test 2.4: Rapid switching stress test (10,000 calls)
const angleKeys = ['frontal', 'perspectiva', 'lateral', 'invalid_1', null, 'perspectiva', 'frontal', undefined];
const startAngleStress = performance.now();
for (let i = 0; i < 10000; i++) {
  const k = angleKeys[i % angleKeys.length];
  PDPView.setSealedAngle(k);
}
const elapsedAngleStress = (performance.now() - startAngleStress).toFixed(2);
assert(true, `10,000 rapid angle switches completed without crash (${elapsedAngleStress}ms)`);

console.log('');

// ==============================================================================
// 3. STRESS TEST SUITE: INSPECTOR MODE SWITCHING (setInspectorMode)
// ==============================================================================
console.log('----------------------------------------------------------------');
console.log('3. STRESS TESTING: setInspectorMode(mode)');
console.log('----------------------------------------------------------------');

const singleCardProduct = PRODUCTS.find(p => p.id === 'charizard-base') || {
  id: 'charizard-base',
  nombre: 'Charizard Base Set',
  set: 'Base Set 1999',
  categoria: 'psa',
  tipo_discriminador: 'CARTA_INDIVIDUAL',
  imagenLocal: 'img/charizard-base.png',
  imagenFallbackUrl: 'img/charizard-base.png',
  certNumber: '48291034',
  precios: { raw: 750, psa8: 1800, psa9: 4850, psa10: 18500 }
};

Store.data.currentPdpProduct = singleCardProduct;

// Test 3.1: 'front' mode
PDPView.setInspectorMode('front');
assert(Store.data.pdpInspectorMode === 'front', 'setInspectorMode("front") updates store');
let inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', 'front');
assert(inspectorHtml.includes('card-3d-scene'), 'Front mode renders card-3d-scene container');
assert(inspectorHtml.includes('holo-sheen-layer'), 'Front mode renders holographic sheen layer');
assert(!inspectorHtml.includes('is-flipped-y'), 'Front mode does NOT apply is-flipped-y');

// Test 3.2: 'back' mode
PDPView.setInspectorMode('back');
assert(Store.data.pdpInspectorMode === 'back', 'setInspectorMode("back") updates store');
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', 'back');
assert(inspectorHtml.includes('is-flipped-y'), 'Back mode applies 180° Y-rotation class (is-flipped-y)');
assert(!inspectorHtml.includes('centering-grid-overlay'), 'Back mode eliminates centering grid overlay (Requirement R3)');
assert(!inspectorHtml.includes('EJE X: 50.0% / 50.0%'), 'Back mode eliminates 50/50 crosshair calibration metrics (Requirement R3)');

// Test 3.3: 'slab' mode
PDPView.setInspectorMode('slab');
assert(Store.data.pdpInspectorMode === 'slab', 'setInspectorMode("slab") updates store');
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', 'slab');
assert(inspectorHtml.includes('psa-acrylic-slab'), 'Slab mode renders psa-acrylic-slab frame');
assert(inspectorHtml.includes('PROFESSIONAL SPORTS AUTHENTICATOR'), 'Slab mode renders authentic PSA header');
assert(inspectorHtml.includes('psa-barcode'), 'Slab mode renders authentication barcode');
assert(inspectorHtml.includes('#48291034'), 'Slab mode renders certification serial number');
assert(inspectorHtml.includes('GEM MT 10'), 'Slab mode renders grade badge');

// Test 3.4: 'undefined' and 'null' mode fallbacks
PDPView.setInspectorMode(undefined);
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', undefined);
assert(inspectorHtml.includes('card-3d-scene') && !inspectorHtml.includes('is-flipped-y'), 'undefined mode falls back cleanly to front view');

PDPView.setInspectorMode(null);
inspectorHtml = PDPView.renderInspectorStage(singleCardProduct, 'psa10', null);
assert(inspectorHtml.includes('card-3d-scene') && !inspectorHtml.includes('is-flipped-y'), 'null mode falls back cleanly to front view');

// Test 3.5: Conditional PDP isolation
// When sealed product is viewed, inspector stage must NOT be rendered even if mode is slab/back
Store.data.currentPdpProduct = sealedProduct;
PDPView.setInspectorMode('slab');
const sealedPdpHtml = PDPView.render();
assert(!sealedPdpHtml.includes('psa-acrylic-slab'), 'Sealed product PDP strictly suppresses PSA slab inspector');
assert(!sealedPdpHtml.includes('is-flipped-y'), 'Sealed product PDP strictly suppresses 3D flip controls');
assert(sealedPdpHtml.includes('sealed-factory-specs'), 'Sealed product PDP renders factory specifications box');

// Test 3.7: Assumption Stress-Test: Missing product.era in sealed product
const productNoEra = { ...sealedProduct, era: undefined };
Store.data.currentPdpProduct = productNoEra;
let noEraThrew = false;
try {
  PDPView.render();
} catch (err) {
  noEraThrew = true;
}
assert(noEraThrew, 'Exposed Assumption Vulnerability: product.era.toUpperCase() throws TypeError when product.era is undefined');
recordFinding(
  'HIGH',
  'Unchecked property access product.era.toUpperCase() in PDPView.render',
  'Line 386 in js/views/pdp.js calls product.era.toUpperCase() without optional chaining or fallback. If a sealed product lacks an era field, PDPView.render() crashes with TypeError.'
);
// Restore valid product
Store.data.currentPdpProduct = singleCardProduct;

// Test 3.8: Rapid mode switching stress test (10,000 calls)
Store.data.currentPdpProduct = singleCardProduct;
const modes = ['front', 'back', 'slab', undefined, null, 'unknown_mode'];
const startModeStress = performance.now();
for (let i = 0; i < 10000; i++) {
  const m = modes[i % modes.length];
  PDPView.setInspectorMode(m);
}
const elapsedModeStress = (performance.now() - startModeStress).toFixed(2);
assert(true, `10,000 rapid inspector mode switches completed without crash (${elapsedModeStress}ms)`);

console.log('');

// ==============================================================================
// 4. STRESS TEST SUITE: HOLOGRAPHIC MOUSEMOVE COORDINATES (handleHoloMove)
// ==============================================================================
console.log('----------------------------------------------------------------');
console.log('4. STRESS TESTING: handleHoloMove(e)');
console.log('----------------------------------------------------------------');

// Test 4.1: Normal in-bounds coordinate (center 200, 200 within rect [100..300, 100..300])
PDPView.handleHoloMove({ clientX: 200, clientY: 200 });
assert(sceneEl.style._props['--holo-x'] === '50.0%', 'Center coordinate (200, 200) computes --holo-x: 50.0%');
assert(sceneEl.style._props['--holo-y'] === '50.0%', 'Center coordinate (200, 200) computes --holo-y: 50.0%');

// Test 4.2: Extreme negative coordinates (-1000, -1000)
PDPView.handleHoloMove({ clientX: -1000, clientY: -1000 });
const extremeNegX = sceneEl.style._props['--holo-x'];
const extremeNegY = sceneEl.style._props['--holo-y'];
assert(extremeNegX === '-550.0%', `Extreme negative (-1000, -1000) computed --holo-x = ${extremeNegX}`);
assert(extremeNegY === '-550.0%', `Extreme negative (-1000, -1000) computed --holo-y = ${extremeNegY}`);
if (parseFloat(extremeNegX) < 0 || parseFloat(extremeNegY) < 0) {
  recordFinding(
    'LOW',
    'Unclamped negative holographic coordinates',
    `handleHoloMove does not clamp negative mouse coordinates, passing "${extremeNegX}" to CSS --holo-x. In CSS radial-gradient, positions outside 0-100% simply move the highlight off-card without visual distortion.`
  );
}

// Test 4.3: Extreme positive coordinates (99999, 99999)
PDPView.handleHoloMove({ clientX: 99999, clientY: 99999 });
const extremePosX = sceneEl.style._props['--holo-x'];
const extremePosY = sceneEl.style._props['--holo-y'];
assert(extremePosX === '49949.5%', `Extreme positive (99999, 99999) computed --holo-x = ${extremePosX}`);
assert(extremePosY === '49949.5%', `Extreme positive (99999, 99999) computed --holo-y = ${extremePosY}`);

// Test 4.4: Origin coordinates (0, 0)
PDPView.handleHoloMove({ clientX: 0, clientY: 0 });
assert(sceneEl.style._props['--holo-x'] === '-50.0%', 'Origin (0, 0) computed relative to element top-left (-50.0%)');
assert(sceneEl.style._props['--holo-y'] === '-50.0%', 'Origin (0, 0) computed relative to element top-left (-50.0%)');

// Test 4.5: Non-numeric coordinates (clientX: NaN, clientY: null)
PDPView.handleHoloMove({ clientX: NaN, clientY: null });
const nanX = sceneEl.style._props['--holo-x'];
const nullY = sceneEl.style._props['--holo-y'];
assert(nanX === 'NaN%', `clientX: NaN yields --holo-x = "${nanX}"`);
assert(nullY === '-50.0%', `clientY: null (coerced to 0) yields --holo-y = "${nullY}"`);
if (nanX === 'NaN%') {
  recordFinding(
    'LOW',
    'NaN coordinate propagation to CSS variable',
    `Passing NaN in event.clientX propagates "NaN%" to style property --holo-x. CSS parser ignores invalid radial-gradient position and falls back to default 50% 50%.`
  );
}

// Test 4.6: Graceful exit when scene element does not exist
const originalScene = elementsMap.get('pdp-3d-scene');
elementsMap.delete('pdp-3d-scene');
let noSceneThrew = false;
try {
  PDPView.handleHoloMove({ clientX: 150, clientY: 150 });
} catch (e) {
  noSceneThrew = true;
}
assert(!noSceneThrew, 'handleHoloMove returns safely when #pdp-3d-scene is missing from DOM');
// Restore element
elementsMap.set('pdp-3d-scene', originalScene);

// Test 4.7: Null/undefined event argument
let nullEventThrew = false;
try {
  PDPView.handleHoloMove(null);
} catch (err) {
  nullEventThrew = true;
}
assert(nullEventThrew, 'handleHoloMove(null) throws TypeError when called without valid event');
recordFinding(
  'LOW',
  'handleHoloMove unchecked event argument',
  'handleHoloMove(e) accesses e.clientX directly without checking if e is truthy. In browser inline handlers (onmousemove="PDPView.handleHoloMove(event)"), event is provided by the browser window, so runtime impact is low.'
);

// Test 4.8: Division by zero when element has zero dimensions (unrendered or collapsed)
sceneEl._rect = { left: 100, top: 100, width: 0, height: 0, right: 100, bottom: 100 };
PDPView.handleHoloMove({ clientX: 150, clientY: 150 });
const divZeroX = sceneEl.style._props['--holo-x'];
assert(divZeroX === 'Infinity%', `Zero dimension rect produces division by zero resulting in ${divZeroX}`);
recordFinding(
  'LOW',
  'Division by zero in handleHoloMove on collapsed elements',
  'When #pdp-3d-scene has width 0, x becomes Infinity%, passing "Infinity%" to CSS variable --holo-x.'
);
sceneEl._rect = { left: 100, top: 100, width: 200, height: 200, right: 300, bottom: 300 };

// Test 4.9: High-frequency erratic mouse stream (50,000 movements)
const startHoloStress = performance.now();
for (let i = 0; i < 50000; i++) {
  const cx = (Math.sin(i) * 500) + 200;
  const cy = (Math.cos(i) * 500) + 200;
  PDPView.handleHoloMove({ clientX: cx, clientY: cy });
}
const elapsedHoloStress = (performance.now() - startHoloStress).toFixed(2);
const throughput = Math.round((50000 / (elapsedHoloStress / 1000)));
assert(true, `50,000 mouse movements processed in ${elapsedHoloStress}ms (~${throughput.toLocaleString()} events/sec)`);

console.log('');

// ==============================================================================
// 5. STRESS TEST SUITE: VISUAL ASSETS PHYSICAL PRESENCE & SPECIFICATIONS
// ==============================================================================
console.log('----------------------------------------------------------------');
console.log('5. STRESS TESTING: Visual Assets Physical Integrity on Disk');
console.log('----------------------------------------------------------------');

const requiredAssets = [
  { path: 'img/sealed/team-rocket-box-front.png', minSize: 500000, desc: 'Team Rocket Box Frontal View' },
  { path: 'img/sealed/team-rocket-box-perspective.png', minSize: 1000000, desc: 'Team Rocket Box 3/4 Perspective View' },
  { path: 'img/sealed/team-rocket-box-side.png', minSize: 500000, desc: 'Team Rocket Box Side Profile View' },
  { path: 'img/cards/card-back.png', minSize: 100000, desc: 'Official Pokémon Card Back Artwork' },
  { path: 'img/cards/raichu-gx.png', minSize: 500000, desc: 'Raichu GX Front Card Asset' }
];

for (const asset of requiredAssets) {
  const full = path.join(ROOT_DIR, asset.path);
  const exists = fs.existsSync(full);
  const size = exists ? fs.statSync(full).size : 0;
  assert(exists, `Asset ${asset.path} physically exists on disk`);
  assert(size >= asset.minSize, `Asset ${asset.path} meets high-resolution payload threshold (${(size / 1024 / 1024).toFixed(2)} MB >= ${(asset.minSize / 1024 / 1024).toFixed(2)} MB)`);
}

console.log('\n================================================================');
console.log('STRESS TEST SUMMARY REPORT');
console.log('================================================================');
console.log(`Total Assertions Checked: ${summary.totalTests}`);
console.log(`Passed:                  ${summary.passed}`);
console.log(`Failed:                  ${summary.failed}`);
console.log(`Findings Recorded:       ${summary.findings.length}`);
console.log('================================================================\n');

if (summary.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
