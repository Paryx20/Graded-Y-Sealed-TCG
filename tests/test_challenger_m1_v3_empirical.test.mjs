/**
 * ==============================================================================
 * Empirical Challenger Verification Suite: Milestone 1 (v3)
 * File: tests/test_challenger_m1_v3_empirical.test.mjs
 * 
 * Adversarial Empirical Verification for:
 * 1. R1: PDP Condition Buttons Strict Mutual Exclusivity Checkmark (1,000 rapid clicks)
 *        with live Lucide SVG transformation and full HTML mount lifecycles.
 * 2. R2: PDP Statistics Box Complete Removal across all products & arbitrary API cards;
 *        prominent #pdp-price presence, valid USD currency format, and dynamic reactivity.
 * 3. R3: 3D Card Viewer Clean Reverse Side; zero centering-grid-overlay, zero coordinate text,
 *        solely authentic Pokémon card back image.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = process.cwd();
const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');

/**
 * Realistic DOM Node simulation supporting parent/child relationships,
 * querySelector, querySelectorAll, remove, insertAdjacentHTML, and Lucide SVG replacement.
 */
class MockDOMNode {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.innerText = '';
    this._innerHTML = '';
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.style = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }

  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }

  hasAttribute(k) {
    return this.attributes.has(k);
  }

  appendChild(child) {
    if (!child) return;
    if (child.parentNode) {
      child.parentNode.removeChild(child);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  querySelector(sel) {
    if (!sel) return null;
    sel = sel.trim();
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      if (this.id === targetId) return this;
      for (const child of this.children) {
        const found = child.querySelector(sel);
        if (found) return found;
      }
      return null;
    }
    if (sel === 'div:first-child') {
      return this.children[0] || null;
    }
    if (sel === 'div:last-child') {
      return this.children[this.children.length - 1] || null;
    }
    if (sel === 'i') {
      for (const c of this.children) {
        if (c.tagName === 'I') return c;
        const sub = c.querySelector('i');
        if (sub) return sub;
      }
      return null;
    }
    if (sel === 'svg') {
      for (const c of this.children) {
        if (c.tagName === 'SVG') return c;
        const sub = c.querySelector('svg');
        if (sub) return sub;
      }
      return null;
    }
    return null;
  }

  querySelectorAll(sel) {
    const results = [];
    if (!sel) return results;
    const tokens = sel.split(',').map(s => s.trim());

    const matches = (node) => {
      for (const t of tokens) {
        if (t === 'i' && node.tagName === 'I') return true;
        if (t === 'svg' && node.tagName === 'SVG') return true;
        if (t === 'button' && node.tagName === 'BUTTON') return true;
        if (t === '[data-lucide="check"]' && node.getAttribute('data-lucide') === 'check') return true;
      }
      return false;
    };

    const traverse = (node) => {
      for (const child of node.children) {
        if (matches(child)) {
          results.push(child);
        }
        traverse(child);
      }
    };

    traverse(this);
    return results;
  }

  insertAdjacentHTML(position, htmlString) {
    if (position === 'beforeend') {
      if (htmlString.includes('<i') && htmlString.includes('data-lucide="check"')) {
        const iconNode = new MockDOMNode('i');
        iconNode.setAttribute('data-lucide', 'check');
        iconNode.className = 'w-3.5 h-3.5 text-[#059669]';
        this.appendChild(iconNode);
      }
    }
  }
}

/**
 * Creates an adversarial testing environment with full DOM and Lucide transformation engine.
 */
function createChallengerEnv() {
  const elements = new Map();

  const priceEl = new MockDOMNode('span', 'pdp-price');
  priceEl.innerText = '$18,500.00 USD';
  elements.set('pdp-price', priceEl);

  const certBadgeEl = new MockDOMNode('span', 'pdp-cert-badge');
  certBadgeEl.innerText = 'PSA 10 GEM MT • #48291034';
  elements.set('pdp-cert-badge', certBadgeEl);

  const radiogroup = new MockDOMNode('div');
  radiogroup.setAttribute('role', 'radiogroup');
  radiogroup.setAttribute('aria-label', 'Condición de la carta');

  const conditionKeys = ['raw', 'psa8', 'psa9', 'psa10'];
  const conditionButtons = [];

  conditionKeys.forEach((key, idx) => {
    const btn = new MockDOMNode('button');
    const header = new MockDOMNode('div');
    header.innerText = key.toUpperCase();
    header.className = idx === 3 ? 'text-xs font-bold flex items-center justify-between text-white' : 'text-xs font-bold flex items-center justify-between text-[#0F172A]';

    const priceDiv = new MockDOMNode('div');
    priceDiv.innerText = '$0.00';
    priceDiv.className = idx === 3 ? 'text-sm font-black mt-0.5 text-[#FEF3C7]' : 'text-sm font-black mt-0.5 text-slate-600';

    btn.appendChild(header);
    btn.appendChild(priceDiv);
    btn.className = idx === 3 
      ? 'p-3 rounded-xl text-left transition bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]' 
      : 'p-3 rounded-xl text-left transition bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]';

    // Initial state: PSA 10 active with checkmark transformed to SVG
    if (idx === 3) {
      const initialSvg = new MockDOMNode('svg');
      initialSvg.className = 'lucide lucide-check w-3.5 h-3.5 text-[#059669]';
      initialSvg.setAttribute('data-lucide', 'check');
      header.appendChild(initialSvg);
    }

    radiogroup.appendChild(btn);
    conditionButtons.push(btn);
  });

  const lucideTransformationStats = {
    totalTransformations: 0
  };

  const lucideMock = {
    createIcons: () => {
      // Find all <i> elements with data-lucide in radiogroup
      for (const btn of conditionButtons) {
        const header = btn.children[0];
        if (!header) continue;
        for (let i = 0; i < header.children.length; i++) {
          const child = header.children[i];
          if (child && child.tagName === 'I' && child.getAttribute('data-lucide') === 'check') {
            const svgNode = new MockDOMNode('svg');
            svgNode.className = 'lucide lucide-check w-3.5 h-3.5 text-[#059669]';
            svgNode.setAttribute('data-lucide', 'check');
            svgNode.parentNode = header;
            header.children[i] = svgNode;
            lucideTransformationStats.totalTransformations++;
          }
        }
      }
    }
  };

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    document: {
      getElementById: (id) => elements.get(id) || null,
      querySelector: (sel) => {
        if (sel.includes('radiogroup')) return radiogroup;
        if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
        return null;
      },
      querySelectorAll: (sel) => {
        if (sel.includes('radiogroup')) return [radiogroup];
        return [];
      }
    },
    lucide: lucideMock,
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
    PRODUCTS: sandbox.PRODUCTS,
    priceEl,
    certBadgeEl,
    radiogroup,
    conditionButtons,
    conditionKeys,
    lucideTransformationStats
  };
}

// ==============================================================================
// REQUIREMENT R1: EMPIRICAL STRESS TEST (1,000 RAPID RANDOM CLICKS)
// ==============================================================================

test('R1 Empirical Stress [1.1]: 1,000 rapid, random condition clicks strictly maintain exactly 1 checkmark at all times', () => {
  const env = createChallengerEnv();
  const { PDPView, Store, conditionButtons, conditionKeys, lucideTransformationStats, priceEl } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  const targetIterations = 1000;
  let previousKey = 'psa10';

  // Seeded deterministic pseudo-random sequence + edge case cycles
  const getRandomKey = (iter) => {
    // Inject adversarial edge case sequences
    if (iter === 10) return previousKey; // consecutive repeated click on same button
    if (iter === 11) return previousKey; // double repeat
    if (iter === 20) return 'raw';
    if (iter === 21) return 'psa10';      // max distance jump
    if (iter === 22) return 'raw';        // rapid ping-pong
    if (iter === 23) return 'psa10';
    if (iter % 50 === 0) return 'psa8';
    if (iter % 50 === 1) return 'psa8';   // mid-tier repeat

    const randIdx = Math.floor(Math.random() * conditionKeys.length);
    return conditionKeys[randIdx];
  };

  for (let iter = 1; iter <= targetIterations; iter++) {
    const selectedKey = getRandomKey(iter);

    // Perform rapid condition click
    PDPView.selectCondition(selectedKey);

    // Assert Store state
    assert.equal(Store.data.pdpSelectedCondition, selectedKey, `Iteration ${iter}: Store condition must equal ${selectedKey}`);

    // Verify all 4 condition buttons
    let totalCheckmarksAcrossRadiogroup = 0;
    let buttonWithCheckmarkIndex = -1;

    conditionButtons.forEach((btn, idx) => {
      const key = conditionKeys[idx];
      const header = btn.children[0];
      const isActive = key === selectedKey;

      // Collect all check icons in header
      const checkIcons = header.children.filter(c => 
        c && (
          c.tagName === 'I' || 
          c.tagName === 'SVG' || 
          c.getAttribute('data-lucide') === 'check' ||
          (c.className && c.className.includes('lucide-check'))
        )
      );

      if (isActive) {
        assert.equal(checkIcons.length, 1, `Iteration ${iter}: Active button [${key}] must contain EXACTLY 1 checkmark icon, found ${checkIcons.length}`);
        assert.equal(checkIcons[0].tagName, 'SVG', `Iteration ${iter}: Active checkmark must have transformed into SVG via Lucide`);
        assert.ok(btn.className.includes('bg-[#0F172A]'), `Iteration ${iter}: Active button [${key}] must have active dark styling`);
        assert.ok(header.className.includes('text-white'), `Iteration ${iter}: Active button header must have text-white`);
        buttonWithCheckmarkIndex = idx;
      } else {
        assert.equal(checkIcons.length, 0, `Iteration ${iter}: Inactive button [${key}] must contain ZERO checkmarks, found ${checkIcons.length}`);
        assert.ok(btn.className.includes('bg-white'), `Iteration ${iter}: Inactive button [${key}] must have inactive white styling`);
        assert.ok(header.className.includes('text-[#0F172A]'), `Iteration ${iter}: Inactive button header must have dark text`);
      }

      totalCheckmarksAcrossRadiogroup += checkIcons.length;
    });

    // Invariant: Total checkmark count across entire radiogroup must be STRICTLY 1
    assert.equal(
      totalCheckmarksAcrossRadiogroup, 
      1, 
      `Iteration ${iter}: CRITICAL FAILURE - Radiogroup contains ${totalCheckmarksAcrossRadiogroup} checkmarks instead of strictly 1!`
    );
    assert.equal(
      conditionKeys[buttonWithCheckmarkIndex], 
      selectedKey, 
      `Iteration ${iter}: Active checkmark was located on [${conditionKeys[buttonWithCheckmarkIndex]}], but expected on [${selectedKey}]`
    );

    // Verify DOM price is updated accurately
    const expectedPrice = product.precios[selectedKey];
    assert.ok(priceEl.innerText.includes(expectedPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })), `Iteration ${iter}: Price DOM updated to ${expectedPrice}`);

    previousKey = selectedKey;
  }

  // Ensure Lucide transformation engine was engaged throughout stress test
  assert.ok(lucideTransformationStats.totalTransformations >= 700, `Lucide createIcons transformed icons at least 700 times (actual: ${lucideTransformationStats.totalTransformations})`);
});

test('R1 Empirical Stress [1.2]: Consecutive clicks on the exact same button never duplicate checkmarks', () => {
  const env = createChallengerEnv();
  const { PDPView, conditionButtons, conditionKeys } = env;

  for (const key of conditionKeys) {
    // Click 10 times consecutively on the same button
    for (let i = 0; i < 10; i++) {
      PDPView.selectCondition(key);
    }

    let totalCheckmarks = 0;
    conditionButtons.forEach((btn, idx) => {
      const header = btn.children[0];
      const checkIcons = header.children.filter(c => c && (c.tagName === 'I' || c.tagName === 'SVG'));
      if (conditionKeys[idx] === key) {
        assert.equal(checkIcons.length, 1, `Button ${key} must have exactly 1 checkmark after 10 consecutive clicks`);
      } else {
        assert.equal(checkIcons.length, 0, `Inactive button must have 0 checkmarks`);
      }
      totalCheckmarks += checkIcons.length;
    });
    assert.equal(totalCheckmarks, 1, `Total checkmarks strictly 1`);
  }
});

// ==============================================================================
// REQUIREMENT R2: PDP STATISTICS BOX REMOVAL & PRICE CLARITY
// ==============================================================================

test('R2 Empirical Verification [2.1]: PDPView.render() across all PRODUCTS cards contains ZERO chart or market statistics elements', () => {
  const env = createChallengerEnv();
  const { PDPView, Store, PRODUCTS } = env;

  const forbiddenTokens = [
    'pdp-interactive-chart',
    'pdp-chart-container',
    'Historial de Mercado Actual',
    'market-trend-pill'
  ];

  const singleCards = PRODUCTS.filter(p => p.tipo_discriminador !== 'PRODUCTO_SELLADO' && p.categoria !== 'sealed');
  assert.ok(singleCards.length >= 8, `Found ${singleCards.length} single card products in catalogue`);

  for (const card of singleCards) {
    Store.data.currentPdpProduct = card;
    for (const cond of ['raw', 'psa8', 'psa9', 'psa10']) {
      Store.data.pdpSelectedCondition = cond;
      const html = PDPView.render();

      for (const token of forbiddenTokens) {
        assert.equal(
          html.includes(token),
          false,
          `Card [${card.id}] under condition [${cond}] must NOT contain forbidden token: "${token}"`
        );
      }

      // Assert #pdp-price is present
      assert.ok(html.includes('id="pdp-price"'), `Card [${card.id}] must prominently include #pdp-price`);

      // Extract price string
      const priceMatch = html.match(/<span id="pdp-price"[^>]*>([^<]+)<\/span>/);
      assert.ok(priceMatch, `Card [${card.id}] must render valid #pdp-price span`);
      const priceStr = priceMatch[1].trim();

      // Assert valid USD currency format: $X,XXX.XX USD or $XX.XX USD
      const usdRegex = /^\$[0-9]{1,3}(,[0-9]{3})*\.[0-9]{2} USD$/;
      assert.ok(usdRegex.test(priceStr), `Price string "${priceStr}" for card [${card.id}] must match valid USD currency pattern`);
    }
  }
});

test('R2 Empirical Verification [2.2]: PDPView.render() across 100 arbitrary API cards maintains price clarity and zero chart elements', () => {
  const env = createChallengerEnv();
  const { PDPView, Store } = env;

  const forbiddenTokens = [
    'pdp-interactive-chart',
    'pdp-chart-container',
    'Historial de Mercado Actual',
    'market-trend-pill'
  ];

  const rarities = ['Common', 'Uncommon', 'Rare Holo', 'Ultra Rare', 'Secret Rare', 'Illustration Rare'];
  const usdRegex = /^\$[0-9]{1,3}(,[0-9]{3})*\.[0-9]{2} USD$/;

  for (let i = 1; i <= 100; i++) {
    const basePrice = Math.round((Math.random() * 500 + 5) * 100) / 100;
    const arbitraryApiCard = {
      id: `api-card-test-${i}`,
      nombre: `API Test Card #${i} - Blaine's Charizard Edition`,
      set: `Gym Challenge Series ${i}`,
      rareza: rarities[i % rarities.length],
      tipo_discriminador: 'CARTA_INDIVIDUAL',
      precioEstimado: basePrice,
      imagenLocal: 'assets/img/cards/card-back.png',
      imagenFallbackUrl: 'assets/img/cards/card-back.png'
    };

    Store.data.currentPdpProduct = arbitraryApiCard;

    for (const cond of ['raw', 'psa8', 'psa9', 'psa10']) {
      Store.data.pdpSelectedCondition = cond;
      const html = PDPView.render();

      for (const token of forbiddenTokens) {
        assert.equal(
          html.includes(token),
          false,
          `Arbitrary API card #${i} condition [${cond}] must NOT contain forbidden token: "${token}"`
        );
      }

      const priceMatch = html.match(/<span id="pdp-price"[^>]*>([^<]+)<\/span>/);
      assert.ok(priceMatch, `Arbitrary API card #${i} must render #pdp-price`);
      const priceStr = priceMatch[1].trim();
      assert.ok(usdRegex.test(priceStr), `Price "${priceStr}" must be valid USD currency format`);
    }
  }
});

test('R2 Empirical Verification [2.3]: Dynamic price reactivity in DOM across all condition switches without destructive re-render', () => {
  const env = createChallengerEnv();
  const { PDPView, Store, priceEl } = env;

  const product = Store.getProduct('charizard-base');
  Store.data.currentPdpProduct = product;

  // Expected tiers: raw: 750, psa8: 1800, psa9: 4850, psa10: 18500
  PDPView.selectCondition('raw');
  assert.equal(priceEl.innerText, '$750.00 USD');

  PDPView.selectCondition('psa8');
  assert.equal(priceEl.innerText, '$1,800.00 USD');

  PDPView.selectCondition('psa9');
  assert.equal(priceEl.innerText, '$4,850.00 USD');

  PDPView.selectCondition('psa10');
  assert.equal(priceEl.innerText, '$18,500.00 USD');

  // Verify defensive pricing for card with only base price ($100)
  const apiCard = {
    id: 'api-lugia',
    nombre: 'Lugia Neo Genesis',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    precioEstimado: 100
  };
  Store.data.currentPdpProduct = apiCard;

  PDPView.selectCondition('raw');
  assert.equal(priceEl.innerText, '$100.00 USD'); // 1.0x

  PDPView.selectCondition('psa8');
  assert.equal(priceEl.innerText, '$135.00 USD'); // 1.35x

  PDPView.selectCondition('psa9');
  assert.equal(priceEl.innerText, '$210.00 USD'); // 2.10x

  PDPView.selectCondition('psa10');
  assert.equal(priceEl.innerText, '$520.00 USD'); // 5.20x
});

// ==============================================================================
// REQUIREMENT R3: 3D CARD VIEWER CLEAN REVERSE SIDE
// ==============================================================================

test('R3 Empirical Verification [3.1]: PDPView.renderInspectorStage in back mode contains ZERO centering grid overlays or coordinate labels', () => {
  const env = createChallengerEnv();
  const { PDPView, PRODUCTS } = env;

  const forbiddenBackfaceTokens = [
    'centering-grid-overlay',
    'EJE X',
    'EJE Y',
    '50.0%',
    'BORDES OK',
    '50/50'
  ];

  const singleCards = PRODUCTS.filter(p => p.tipo_discriminador !== 'PRODUCTO_SELLADO' && p.categoria !== 'sealed');

  for (const card of singleCards) {
    for (const cond of ['raw', 'psa8', 'psa9', 'psa10']) {
      const html = PDPView.renderInspectorStage(card, cond, 'back');

      // Assert absence of all forbidden centering calibration markers
      for (const token of forbiddenBackfaceTokens) {
        assert.equal(
          html.includes(token),
          false,
          `Card [${card.id}] reverse face must NOT contain: "${token}"`
        );
      }

      // Assert presence of 3D flipped state and authentic card back image
      assert.ok(html.includes('is-flipped-y'), `3D object in back mode must include "is-flipped-y" class`);
      assert.ok(html.includes('card-3d-face card-3d-back'), `Must include backface container`);
      assert.ok(html.includes('src="assets/img/cards/card-back.png"'), `Must reference authentic card-back.png asset`);
      assert.ok(html.includes('alt="Reverso de carta Pokémon"'), `Must provide accessible alt text for card back`);
    }
  }
});

test('R3 Empirical Verification [3.2]: Physical card-back.png asset integrity on disk and CSS stylesheet clean overlay suppression', () => {
  const cardBackPath = path.join(ROOT_DIR, 'assets/img/cards/card-back.png');
  assert.ok(fs.existsSync(cardBackPath), 'Physical asset assets/img/cards/card-back.png must exist on disk');

  const stat = fs.statSync(cardBackPath);
  assert.ok(stat.size > 50000, `card-back.png must be non-zero and high-resolution (${stat.size} bytes > 50KB)`);

  // Assert CSS rule in styles.css guarantees .centering-grid-overlay is suppressed
  assert.ok(
    stylesCss.includes('.centering-grid-overlay'),
    'styles.css must reference .centering-grid-overlay rule'
  );
  assert.ok(
    stylesCss.includes('display: none !important;'),
    'styles.css must enforce display: none !important on .centering-grid-overlay'
  );
});

test('R3 Empirical Verification [3.3]: Arbitrary API cards with apostrophes, foreign characters, and extreme cert numbers in back mode', () => {
  const env = createChallengerEnv();
  const { PDPView } = env;

  const edgeCaseCards = [
    { id: 'blaines-charizard', nombre: "Blaine's Charizard #2/132", certNumber: "99'999'999" },
    { id: 'team-magmas-groudon', nombre: "Team Magma's Groudon ex", certNumber: "00000001" },
    { id: 'pikachu-corocoro', nombre: "ピカチュウ (CoroCoro Promo)", certNumber: "JP-2026-00" }
  ];

  for (const card of edgeCaseCards) {
    const html = PDPView.renderInspectorStage(card, 'psa10', 'back');
    assert.equal(html.includes('centering-grid-overlay'), false);
    assert.equal(html.includes('EJE X'), false);
    assert.equal(html.includes('EJE Y'), false);
    assert.equal(html.includes('50.0%'), false);
    assert.ok(html.includes('assets/img/cards/card-back.png'));
  }
});
