/**
 * ==============================================================================
 * Challenger 2: Adversarial Empirical Verification Suite
 * Milestone 1: Phase 4 Visual Assets & Adaptive 3D PDP
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import vm from 'node:vm';

// Helper: Inspect PNG binary structure
function inspectPng(filePath) {
  assert.ok(fs.existsSync(filePath), `File must exist: ${filePath}`);
  const stat = fs.statSync(filePath);
  assert.ok(stat.size > 0, `File must not be empty: ${filePath}`);

  const buf = fs.readFileSync(filePath);
  const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const isPng = buf.subarray(0, 8).equals(pngMagic);
  assert.ok(isPng, `File must have valid PNG magic bytes: ${filePath}`);

  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  let hasTrns = false;
  const idatChunks = [];
  let offset = 8;

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf[offset + 16];
      colorType = buf[offset + 17];
    } else if (type === 'tRNS') {
      hasTrns = true;
    } else if (type === 'IDAT') {
      idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  assert.ok(width > 0 && height > 0, `Invalid dimensions ${width}x${height} in ${filePath}`);

  // Decompress IDAT to verify readability
  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);
  assert.ok(decompressed.length > 0, `IDAT chunks must successfully decompress in ${filePath}`);

  // Check transparency if RGBA (colorType === 6)
  let minAlpha = 255;
  let transparentPixels = 0;
  if (colorType === 6) {
    const bytesPerPixel = 4;
    const scanlineLength = 1 + width * bytesPerPixel;
    for (let y = 0; y < height; y++) {
      const lineStart = y * scanlineLength + 1;
      for (let x = 0; x < width; x++) {
        const a = decompressed[lineStart + x * bytesPerPixel + 3];
        if (a < minAlpha) minAlpha = a;
        if (a < 250) transparentPixels++;
      }
    }
  }

  return {
    filePath,
    size: stat.size,
    width,
    height,
    aspectRatio: height / width,
    colorType,
    hasAlpha: colorType === 6 || colorType === 4 || hasTrns,
    minAlpha,
    transparentPixels,
    totalPixels: width * height
  };
}

// ------------------------------------------------------------------------------
// Group 1: Visual Asset Binary Verification
// ------------------------------------------------------------------------------
test('Visual Assets: Sealed Team Rocket Box - Front angle binary & transparency', () => {
  const meta = inspectPng('img/sealed/team-rocket-box-front.png');
  assert.equal(meta.colorType, 6, 'Front image must be RGBA (colorType 6)');
  assert.ok(meta.hasAlpha, 'Front image must possess an alpha channel');
  assert.equal(meta.minAlpha, 0, 'Front image must contain fully transparent background pixels (minAlpha === 0)');
  assert.ok(meta.transparentPixels > 1000, 'Front image must contain substantial transparent pixels');
});

test('Visual Assets: Sealed Team Rocket Box - Perspective 3/4 angle binary & transparency', () => {
  const meta = inspectPng('img/sealed/team-rocket-box-perspective.png');
  assert.equal(meta.colorType, 6, 'Perspective image must be RGBA (colorType 6)');
  assert.ok(meta.hasAlpha, 'Perspective image must possess an alpha channel');
  assert.equal(meta.minAlpha, 0, 'Perspective image must contain fully transparent background pixels (minAlpha === 0)');
  assert.ok(meta.transparentPixels > 10000, 'Perspective image must contain substantial transparent pixels');
});

test('Visual Assets: Sealed Team Rocket Box - Side angle binary & transparency', () => {
  const meta = inspectPng('img/sealed/team-rocket-box-side.png');
  assert.equal(meta.colorType, 6, 'Side image must be RGBA (colorType 6)');
  assert.ok(meta.hasAlpha, 'Side image must possess an alpha channel');
  assert.equal(meta.minAlpha, 0, 'Side image must contain fully transparent background pixels (minAlpha === 0)');
  assert.ok(meta.transparentPixels > 1000, 'Side image must contain substantial transparent pixels');
});

test('Visual Assets: Card Back - Aspect ratio (~1:1.39 to 1:1.4) and decompression', () => {
  const meta = inspectPng('img/cards/card-back.png');
  // Card aspect ratio: height / width should be between 1.39 and 1.40
  assert.ok(
    meta.aspectRatio >= 1.385 && meta.aspectRatio <= 1.405,
    `Card back aspect ratio must be ~1.39 - 1.40 (height / width). Got: ${meta.aspectRatio.toFixed(4)}`
  );
});

test('Visual Assets: Raichu GX - Aspect ratio (~1:1.39 to 1:1.4) and decompression', () => {
  const meta = inspectPng('img/cards/raichu-gx.png');
  assert.ok(
    meta.aspectRatio >= 1.385 && meta.aspectRatio <= 1.405,
    `Raichu GX aspect ratio must be ~1.39 - 1.40 (height / width). Got: ${meta.aspectRatio.toFixed(4)}`
  );
});

// ------------------------------------------------------------------------------
// Group 2: Conditional DOM Invariants across all PRODUCTS
// ------------------------------------------------------------------------------

function setupRuntime() {
  const dataCode = fs.readFileSync('js/data.js', 'utf8');
  const stateCode = fs.readFileSync('js/state.js', 'utf8');
  const pdpCode = fs.readFileSync('js/views/pdp.js', 'utf8');

  const ctx = {
    console,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    document: {
      getElementById: () => null
    },
    window: {},
    app: {
      renderCurrentView: () => {},
      openPSAGuideModal: () => {},
      addToCart: () => {}
    }
  };

  vm.createContext(ctx);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', ctx);
  vm.runInContext(stateCode + '; this.Store = Store;', ctx);
  vm.runInContext(pdpCode + '; this.PDPView = PDPView;', ctx);

  return {
    PRODUCTS: ctx.PRODUCTS,
    Store: ctx.Store,
    PDPView: ctx.PDPView
  };
}

test('DOM Invariants: All Sealed Products NEVER render PSA selector or 3D flip, and ALWAYS render sealed specs & angles', () => {
  const { PRODUCTS, Store, PDPView } = setupRuntime();

  const sealedProducts = PRODUCTS.filter(
    p => p.tipo_discriminador === 'PRODUCTO_SELLADO' || p.categoria === 'sealed'
  );

  assert.ok(sealedProducts.length > 0, 'There must be at least one sealed product in catalogue');

  for (const product of sealedProducts) {
    Store.data.currentPdpProduct = product;
    Store.data.pdpSelectedCondition = 'psa10';
    Store.data.pdpInspectorMode = 'front';
    Store.data.pdpSealedAngle = 'frontal';
    Store.data.pdpQuantity = 1;

    const html = PDPView.render();

    // Invariant 1: NEVER produces PSA grading selectors
    const hasPsaSelector = html.includes('Seleccionar Condición / Grado PSA:') ||
      html.includes('role="radiogroup" aria-label="Condición de la carta"') ||
      html.includes('PDPView.selectCondition');
    assert.strictEqual(
      hasPsaSelector,
      false,
      `Sealed product "${product.id}" must NEVER render PSA grading selector`
    );

    // Invariant 2: NEVER produces 3D flip buttons
    const has3DFlipButtons = html.includes('aria-label="Modos del inspector de carta"') ||
      html.includes("PDPView.setInspectorMode('back')") ||
      html.includes('Reverso y Bordes');
    assert.strictEqual(
      has3DFlipButtons,
      false,
      `Sealed product "${product.id}" must NEVER render 3D flip buttons`
    );

    // Invariant 3: ALWAYS renders #sealed-factory-specs
    const hasSealedSpecs = html.includes('id="sealed-factory-specs"');
    assert.strictEqual(
      hasSealedSpecs,
      true,
      `Sealed product "${product.id}" must ALWAYS render #sealed-factory-specs`
    );

    // Invariant 4: ALWAYS renders sealed angle buttons
    const hasAngleButtons = html.includes('aria-label="Ángulos del empaque sellado"') &&
      html.includes("PDPView.setSealedAngle('frontal')") &&
      html.includes("PDPView.setSealedAngle('perspectiva')") &&
      html.includes("PDPView.setSealedAngle('lateral')");
    assert.strictEqual(
      hasAngleButtons,
      true,
      `Sealed product "${product.id}" must ALWAYS render sealed angle buttons (frontal, perspectiva, lateral)`
    );
  }
});

test('DOM Invariants: All PSA/Raw Cards ALWAYS render PSA selector & 3D flip, and NEVER render sealed specs or angle buttons', () => {
  const { PRODUCTS, Store, PDPView } = setupRuntime();

  const cardProducts = PRODUCTS.filter(
    p => p.categoria === 'psa' || p.categoria === 'raw'
  );

  assert.ok(cardProducts.length > 0, 'There must be cards in catalogue');

  for (const product of cardProducts) {
    Store.data.currentPdpProduct = product;
    Store.data.pdpSelectedCondition = 'psa10';
    Store.data.pdpInspectorMode = 'front';
    Store.data.pdpSealedAngle = 'frontal';
    Store.data.pdpQuantity = 1;

    const html = PDPView.render();

    // Invariant 1: ALWAYS produces PSA grading selectors
    const hasPsaSelector = html.includes('Seleccionar Condición / Grado PSA:') &&
      html.includes('role="radiogroup" aria-label="Condición de la carta"') &&
      html.includes('PDPView.selectCondition');
    assert.strictEqual(
      hasPsaSelector,
      true,
      `Card product "${product.id}" must ALWAYS render PSA grading selector`
    );

    // Invariant 2: ALWAYS produces 3D flip buttons
    const has3DFlipButtons = html.includes('aria-label="Modos del inspector de carta"') &&
      html.includes("PDPView.setInspectorMode('back')") &&
      html.includes('Reverso y Bordes');
    assert.strictEqual(
      has3DFlipButtons,
      true,
      `Card product "${product.id}" must ALWAYS render 3D flip buttons`
    );

    // Invariant 3: NEVER renders #sealed-factory-specs
    const hasSealedSpecs = html.includes('id="sealed-factory-specs"');
    assert.strictEqual(
      hasSealedSpecs,
      false,
      `Card product "${product.id}" must NEVER render #sealed-factory-specs`
    );

    // Invariant 4: NEVER renders sealed angle buttons
    const hasAngleButtons = html.includes('aria-label="Ángulos del empaque sellado"') ||
      html.includes('PDPView.setSealedAngle');
    assert.strictEqual(
      hasAngleButtons,
      false,
      `Card product "${product.id}" must NEVER render sealed angle buttons`
    );
  }
});

// ------------------------------------------------------------------------------
// Group 3: Adversarial Edge Cases & Stress Scenarios
// ------------------------------------------------------------------------------

test('Adversarial: State pollution cannot force 3D card scene onto sealed product', () => {
  const { PRODUCTS, Store, PDPView } = setupRuntime();
  const sealed = PRODUCTS.find(p => p.id === 'booster-team-rocket');

  Store.data.currentPdpProduct = sealed;
  // Maliciously inject inspector modes meant for cards
  Store.data.pdpInspectorMode = 'back';
  let html = PDPView.render();
  assert.strictEqual(html.includes('id="pdp-3d-scene"'), false);
  assert.strictEqual(html.includes('id="sealed-factory-specs"'), true);

  Store.data.pdpInspectorMode = 'slab';
  html = PDPView.render();
  assert.strictEqual(html.includes('psa-acrylic-slab'), false);
  assert.strictEqual(html.includes('id="sealed-factory-specs"'), true);
});

test('Adversarial: Malformed sealed product without metadata defaults gracefully without crash', () => {
  const { Store, PDPView } = setupRuntime();
  const minimalSealed = {
    id: 'adversarial-sealed-test',
    nombre: 'Mock Minimal Sealed Pack',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    set: 'Test Set',
    rareza: 'Rare',
    era: 'vintage',
    imagenLocal: 'img/sealed/team-rocket-box-front.png',
    imagenFallbackUrl: 'img/sealed/team-rocket-box-perspective.png',
    precios: { sealed: 1200 }
  };

  Store.data.currentPdpProduct = minimalSealed;
  Store.data.pdpSealedAngle = 'perspectiva';
  const html = PDPView.render();

  assert.ok(html.includes('id="sealed-factory-specs"'), 'Must render factory specs with fallback defaults');
  assert.ok(html.includes('aria-label="Ángulos del empaque sellado"'), 'Must render angle buttons');
  assert.strictEqual(html.includes('Seleccionar Condición / Grado PSA:'), false);
});

test('Adversarial: Quantity Stepper boundaries and clamping', () => {
  const { Store, PDPView } = setupRuntime();
  
  Store.data.pdpQuantity = 1;
  PDPView.updateQuantity(-1); // should not drop below 1
  assert.strictEqual(Store.data.pdpQuantity, 1, 'Quantity cannot drop below 1');

  PDPView.updateQuantity(1);
  assert.strictEqual(Store.data.pdpQuantity, 2, 'Quantity increments to 2');

  Store.data.pdpQuantity = 10;
  PDPView.updateQuantity(1); // should not exceed 10
  assert.strictEqual(Store.data.pdpQuantity, 10, 'Quantity cannot exceed 10');
});

test('Adversarial: HTML contains PSA guide modal definition and accessible triggers', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.ok(
    indexHtml.includes('id="psa-guide-modal"') || indexHtml.includes('psa-guide-modal'),
    'index.html must contain PSA Guide Modal'
  );
  assert.ok(
    indexHtml.includes('¿Qué es un Grado PSA?') || indexHtml.includes('Guía de Gradación PSA'),
    'index.html must contain PSA Guide Modal title'
  );
});
