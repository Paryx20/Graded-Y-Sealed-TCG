import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

console.log('Running PDP Adaptive & 3D Inspector verification from:', rootDir);

// 1. Verify files exist
const files = [
  'img/cards/card-back.png',
  'img/cards/raichu-gx.png',
  'img/sealed/team-rocket-box-front.png',
  'img/sealed/team-rocket-box-perspective.png',
  'img/sealed/team-rocket-box-side.png'
];

for (const f of files) {
  const full = path.join(rootDir, f);
  assert.ok(fs.existsSync(full), `Missing file: ${f}`);
  const stat = fs.statSync(full);
  assert.ok(stat.size > 10000, `File ${f} is too small: ${stat.size} bytes`);
  console.log(`[PASS] Asset verified: ${f} (${stat.size.toLocaleString()} bytes)`);
}

// 2. Load data.js and pdp.js in sandbox
const sandbox = {
  console,
  Math,
  Store: { data: {} },
  app: {
    renderCurrentView() {},
    showToast() {},
    addToCart(id, name, label, price, img, fallback, qty) {
      sandbox._cartAdded = { id, name, label, price, img, fallback, qty };
    }
  }
};
vm.createContext(sandbox);

const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
vm.runInContext(dataCode + '\n;globalThis.PRODUCTS = PRODUCTS;', sandbox);

const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');
vm.runInContext(pdpCode + '\n;globalThis.PDPView = PDPView;', sandbox);

const { PDPView, Store, PRODUCTS } = sandbox;
assert.ok(PDPView, 'PDPView must exist in sandbox');
assert.ok(Array.isArray(PRODUCTS), 'PRODUCTS array must exist');

// 3. Test Card Product Render (CARTA_INDIVIDUAL)
const card = PRODUCTS.find(p => p.id === 'raichu-gx') || PRODUCTS.find(p => p.id === 'charizard-base');
assert.ok(card, 'Card product must be found');
assert.equal(card.tipo_discriminador, 'CARTA_INDIVIDUAL');

Store.data.currentPdpProduct = card;
Store.data.pdpInspectorMode = 'front';
Store.data.pdpSelectedCondition = 'psa10';
Store.data.pdpQuantity = 1;

let cardHtml = PDPView.render();
assert.ok(cardHtml.includes('card-3d-scene'), 'Should render card 3D scene');
assert.ok(cardHtml.includes('holo-sheen-layer'), 'Should render holographic sheen layer');
assert.ok(cardHtml.includes('Seleccionar Condición / Grado PSA:'), 'Should render PSA selector');
assert.ok(cardHtml.includes('pdp-interactive-chart'), 'Should render market trend chart');
assert.ok(cardHtml.includes('Reverso y Bordes'), 'Should render 3D mode controls');
assert.ok(!cardHtml.includes('sealed-factory-specs'), 'Card should NOT render factory specs');
console.log('[PASS] CARTA_INDIVIDUAL frontal mode renders 3D scene, holo sheen, PSA selector, and chart');

// 4. Test Card Back mode (rotateY 180deg + card-back.png + 50/50 centering)
Store.data.pdpInspectorMode = 'back';
let cardBackHtml = PDPView.render();
assert.ok(cardBackHtml.includes('is-flipped-y'), 'Should apply is-flipped-y class');
assert.ok(cardBackHtml.includes('img/cards/card-back.png'), 'Should render official card back image');
assert.ok(cardBackHtml.includes('centering-grid-overlay'), 'Should render centering grid overlay');
assert.ok(cardBackHtml.includes('EJE X: 50.0% / 50.0%'), 'Should display EJE X crosshair');
assert.ok(cardBackHtml.includes('EJE Y: 50.0% / 50.0%'), 'Should display EJE Y crosshair');
console.log('[PASS] CARTA_INDIVIDUAL back mode renders rotateY(180deg), official card-back.png, and 50/50 centering overlay');

// 5. Test Card Slab mode
Store.data.pdpInspectorMode = 'slab';
let cardSlabHtml = PDPView.render();
assert.ok(cardSlabHtml.includes('psa-acrylic-slab'), 'Should render psa-acrylic-slab');
assert.ok(cardSlabHtml.includes('PROFESSIONAL SPORTS AUTHENTICATOR'), 'Should render PSA header label');
assert.ok(cardSlabHtml.includes('psa-barcode'), 'Should render PSA barcode');
assert.ok(cardSlabHtml.includes('GRADO'), 'Should render PSA grade box');
console.log('[PASS] CARTA_INDIVIDUAL slab mode renders psa-acrylic-slab with authentic PSA label & barcode');

// 6. Test Sealed Product Render (PRODUCTO_SELLADO)
const sealed = PRODUCTS.find(p => p.id === 'booster-team-rocket');
assert.ok(sealed, 'Team Rocket booster box must be found');
assert.equal(sealed.tipo_discriminador, 'PRODUCTO_SELLADO');

Store.data.currentPdpProduct = sealed;
Store.data.pdpSealedAngle = 'frontal';
let sealedHtml = PDPView.render();

// Strict assertions on hidden elements
assert.ok(!sealedHtml.includes('Seleccionar Condición / Grado PSA:'), 'Sealed MUST HIDE PSA condition selector');
assert.ok(!sealedHtml.includes('card-3d-scene'), 'Sealed MUST HIDE 3D card scene');
assert.ok(!sealedHtml.includes('pdp-interactive-chart'), 'Sealed MUST HIDE 12-month quotation chart');
assert.ok(!sealedHtml.includes('Frontal Completo'), 'Sealed MUST HIDE 3D flip buttons');

// Strict assertions on displayed elements
assert.ok(sealedHtml.includes('pdp-sealed-stage'), 'Sealed MUST render sealed stage viewport');
assert.ok(sealedHtml.includes('img/sealed/team-rocket-box-front.png'), 'Sealed MUST render front angle image');
assert.ok(sealedHtml.includes('sealed-factory-specs'), 'Sealed MUST render factory specifications');
assert.ok(sealedHtml.includes('Wizards of the Coast'), 'Sealed specs must mention Wizards of the Coast');
assert.ok(sealedHtml.includes('750g'), 'Sealed specs must mention gramaje (750g)');
assert.ok(sealedHtml.includes('36 Sobres'), 'Sealed specs must mention 36 Sobres');
assert.ok(sealedHtml.includes('Sin pesar'), 'Sealed specs must mention Sin pesar / Unweighed');
console.log('[PASS] PRODUCTO_SELLADO hides PSA selector and 3D controls, displays multi-angle gallery and factory specs');

// 7. Test Sealed Angle Switching
PDPView.setSealedAngle('perspectiva');
assert.equal(Store.data.pdpSealedAngle, 'perspectiva');
let sealedPersp = PDPView.render();
assert.ok(sealedPersp.includes('img/sealed/team-rocket-box-perspective.png'), 'Should switch to perspective image');

PDPView.setSealedAngle('lateral');
assert.equal(Store.data.pdpSealedAngle, 'lateral');
let sealedSide = PDPView.render();
assert.ok(sealedSide.includes('img/sealed/team-rocket-box-side.png'), 'Should switch to side profile image');
console.log('[PASS] Sealed angle switching toggles between frontal, perspectiva, and lateral');

// 8. Test Quantity Stepper
Store.data.pdpQuantity = 1;
PDPView.updateQuantity(-1);
assert.equal(Store.data.pdpQuantity, 1, 'Quantity should not decrease below 1');
PDPView.updateQuantity(2);
assert.equal(Store.data.pdpQuantity, 3, 'Quantity should increment to 3');
PDPView.updateQuantity(-1);
assert.equal(Store.data.pdpQuantity, 2, 'Quantity should decrement to 2');
console.log('[PASS] Quantity stepper increments and decrements, strictly clamped at minimum 1');

// 9. Test AddToCart for Sealed Product
PDPView.addToCart();
assert.ok(sandbox._cartAdded, 'Item must be passed to app.addToCart');
assert.equal(sandbox._cartAdded.name, sealed.nombre);
assert.equal(sandbox._cartAdded.label, 'Sellado de Fábrica (Caja Intacta)');
assert.equal(sandbox._cartAdded.price, 3500);
assert.equal(sandbox._cartAdded.qty, 2);
console.log('[PASS] addToCart integrates sealed product with unit price and proper condition label');

console.log('\n*** ALL 9 VERIFICATION CHECKS PASSED PERFECTLY! ***');
