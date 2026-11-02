import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

console.log('=== FORENSIC INTEGRITY AUDIT STRESS TEST (Milestone 1 Iteration 2) ===\n');

const rootDir = process.cwd();
const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');
const cssCode = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
const htmlCode = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

// 1. FORENSIC TEST 1: CSS WebKit Prefixes
console.log('1. Checking CSS WebKit Vendor Prefixes...');
assert.ok(cssCode.includes('-webkit-perspective: 1000px;'), 'Missing -webkit-perspective: 1000px');
assert.ok(cssCode.includes('perspective: 1000px;'), 'Missing standard perspective: 1000px');
assert.ok(cssCode.includes('-webkit-transform-style: preserve-3d;'), 'Missing -webkit-transform-style: preserve-3d');
assert.ok(cssCode.includes('transform-style: preserve-3d;'), 'Missing standard transform-style: preserve-3d');
assert.ok(cssCode.includes('-webkit-transition: -webkit-transform'), 'Missing -webkit-transition: -webkit-transform');
assert.ok(cssCode.includes('-webkit-transform: rotateY(180deg);'), 'Missing -webkit-transform: rotateY(180deg)');
assert.ok(cssCode.includes('-webkit-backface-visibility: hidden;'), 'Missing -webkit-backface-visibility: hidden');
console.log('   [PASS] All WebKit vendor prefixes verified.');

// 2. FORENSIC TEST 2: Modal Backdrop Dismissal & Accessibility in HTML
console.log('2. Checking Modal Backdrop Dismissal & Accessibility...');
assert.ok(htmlCode.includes('id="psa-guide-modal"'), 'Missing #psa-guide-modal');
assert.ok(htmlCode.includes('onclick="if (event.target === this) app.closePSAGuideModal()"'), 'Missing backdrop click dismiss on #psa-guide-modal');
assert.ok(htmlCode.includes('role="dialog"'), 'Missing role="dialog"');
assert.ok(htmlCode.includes('aria-modal="true"'), 'Missing aria-modal="true"');
assert.ok(htmlCode.includes('aria-hidden="true"'), 'Missing aria-hidden="true"');
console.log('   [PASS] Modal backdrop click dismiss and accessibility attributes verified.');

// 3. FORENSIC TEST 3: Touch & Coordinate Clamping in PDPView
console.log('3. Stress Testing Touch Events & Coordinate Clamping...');
const sceneStyles = {};
const sandbox = {
  console,
  Math,
  Date,
  parseInt,
  isNaN,
  document: {
    getElementById: (id) => {
      if (id === 'pdp-3d-scene') {
        return {
          id: 'pdp-3d-scene',
          getBoundingClientRect: () => ({ left: 50, top: 100, width: 200, height: 400 }),
          style: {
            setProperty: (k, v) => { sceneStyles[k] = v; }
          }
        };
      }
      return null;
    }
  },
  Store: { data: {} }
};
vm.createContext(sandbox);
vm.runInContext(dataCode + '\n;globalThis.PRODUCTS = PRODUCTS;', sandbox);
vm.runInContext(stateCode + '\n;globalThis.Store = Store;', sandbox);
vm.runInContext(pdpCode + '\n;globalThis.PDPView = PDPView;', sandbox);

const PDPView = sandbox.PDPView;

// Mouse move within bounds
PDPView.handleHoloMove({ clientX: 150, clientY: 300 });
assert.equal(sceneStyles['--holo-x'], '50.0%');
assert.equal(sceneStyles['--holo-y'], '50.0%');

// Touch move with e.touches
PDPView.handleHoloMove({ touches: [{ clientX: 100, clientY: 200 }] });
assert.equal(sceneStyles['--holo-x'], '25.0%');
assert.equal(sceneStyles['--holo-y'], '25.0%');

// Touch end with e.changedTouches
PDPView.handleHoloMove({ touches: [], changedTouches: [{ clientX: 200, clientY: 400 }] });
assert.equal(sceneStyles['--holo-x'], '75.0%');
assert.equal(sceneStyles['--holo-y'], '75.0%');

// Extreme out-of-bounds coordinates (Negative clamp to 0.0%)
PDPView.handleHoloMove({ clientX: -999, clientY: -500 });
assert.equal(sceneStyles['--holo-x'], '0.0%');
assert.equal(sceneStyles['--holo-y'], '0.0%');

// Extreme out-of-bounds coordinates (Positive clamp to 100.0%)
PDPView.handleHoloMove({ clientX: 9999, clientY: 9999 });
assert.equal(sceneStyles['--holo-x'], '100.0%');
assert.equal(sceneStyles['--holo-y'], '100.0%');

// Non-numeric / NaN input should be safely ignored without modifying style
sceneStyles['--holo-x'] = 'TEST';
PDPView.handleHoloMove({ clientX: NaN, clientY: 100 });
assert.equal(sceneStyles['--holo-x'], 'TEST', 'NaN clientX should be safely rejected');
console.log('   [PASS] Touch events and coordinate clamping [0%, 100%] verified.');

// 4. FORENSIC TEST 4: Quantity Delta Clamping & Sanitization
console.log('4. Stress Testing Quantity Delta Clamping...');
sandbox.Store.data.pdpQuantity = 1;

// Decrement below 1 clamped to 1
PDPView.updateQuantity(-1);
assert.equal(sandbox.Store.data.pdpQuantity, 1, 'Quantity cannot decrement below 1');

PDPView.updateQuantity(-100);
assert.equal(sandbox.Store.data.pdpQuantity, 1, 'Large negative decrement clamped to 1');

// Increment within bounds
PDPView.updateQuantity(4);
assert.equal(sandbox.Store.data.pdpQuantity, 5, '1 + 4 = 5');

// Exceeding 10 clamped to 10
PDPView.updateQuantity(20);
assert.equal(sandbox.Store.data.pdpQuantity, 10, 'Large increment clamped to max 10');

// String delta sanitized
PDPView.updateQuantity('-3');
assert.equal(sandbox.Store.data.pdpQuantity, 7, 'String "-3" parsed and subtracted');

// Invalid non-numeric delta rejected safely
PDPView.updateQuantity('not-a-number');
assert.equal(sandbox.Store.data.pdpQuantity, 7, 'Invalid delta leaves quantity unchanged');

// Undefined quantity recovered defensively to clamped value
sandbox.Store.data.pdpQuantity = undefined;
PDPView.updateQuantity(2);
assert.equal(sandbox.Store.data.pdpQuantity, 3, 'Undefined quantity recovers as (1 + 2) = 3');
console.log('   [PASS] Quantity delta clamping [1, 10] and sanitization verified.');

// 5. FORENSIC TEST 5: Era Safe Fallback
console.log('5. Stress Testing Era Safe Fallback in Sealed PDP...');
const malformedSealed = {
  id: 'sealed-without-era',
  nombre: 'Booster Box Sin Era',
  categoria: 'sealed',
  tipo_discriminador: 'PRODUCTO_SELLADO',
  tipo_item: 'PRODUCTO_SELLADO',
  rareza: 'Ultra Rare',
  set: 'Test Set',
  precios: { sealed: 500 }
  // era is intentionally undefined!
};

sandbox.Store.data.currentPdpProduct = malformedSealed;
sandbox.Store.data.pdpSealedAngle = 'frontal';
let htmlOutput = '';
assert.doesNotThrow(() => {
  htmlOutput = PDPView.render();
}, 'PDPView.render() threw error when product.era was undefined!');
assert.ok(htmlOutput.includes('Era VINTAGE'), 'Should safely fallback undefined era to "vintage" -> "Era VINTAGE"');
console.log('   [PASS] Era safe fallback verified.');

// 6. FORENSIC TEST 6: Inspection of tests/test_pdp.test.mjs
console.log('6. Checking tests/test_pdp.test.mjs Integrity...');
const testPdpContent = fs.readFileSync(path.join(rootDir, 'tests/test_pdp.test.mjs'), 'utf8');
assert.ok(testPdpContent.includes("fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8')"), 'Test must load real pdp.js');
assert.ok(testPdpContent.includes('this.PDPView = PDPView;'), 'Test sandbox must export real PDPView');

// Ensure no fake mock functions exist in test_pdp
const prohibitedMocks = [
  'const setMode =',
  'const renderFrontFace =',
  'const computeHoloCoords =',
  'const shouldShowPSASelector =',
  'const clampCoord ='
];
prohibitedMocks.forEach(mock => {
  assert.ok(!testPdpContent.includes(mock), `Found prohibited facade mock: ${mock}`);
});
console.log('   [PASS] Zero facade mocks detected in tests/test_pdp.test.mjs.');

console.log('\n*** ALL FORENSIC EMPIRICAL STRESS CHECKS PASSED WITH ZERO INTEGRITY VIOLATIONS! ***');
