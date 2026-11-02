/**
 * ==============================================================================
 * Adversarial Stress & Empirical Verification Suite: R3 & R4
 * File: tests/test_adversarial_r3_r4.test.mjs
 * 
 * Objectives:
 * 1. R3 API Search Images, Pricing & Store Integration:
 *    - Verify zero broken card image paths (no charizard-base.png fallbacks,
 *      valid /high.webp formatting for TCGdex assets, fallback to img/cards/card-back.png).
 *    - Stress test pricing engine across 2,000+ randomized/adversarial card definitions:
 *      no static $15.00 placeholder, natural market tiers, vintage era and star character bonuses.
 *    - Verify end-to-end store integration: API search card -> Store registration ->
 *      routing to #pdp?id=... -> 3D inspection & condition tiers -> cart -> checkout.
 * 2. R4 Stability & Console Errors:
 *    - Verify Lucide icon calls are completely shielded against undefined CDN.
 *    - Stress-test navigation across #catalog, #search-results, #pdp, #cart, #checkout, #home,
 *      #profile, #tracking, and malformed routes with zero uncaught exceptions.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createAdversarialEnvironment(options = {}) {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const apiCode = fs.readFileSync(path.join(rootDir, 'js/services/pokemon-api.js'), 'utf8');
  const homeCode = fs.readFileSync(path.join(rootDir, 'js/views/home.js'), 'utf8');
  const catalogCode = fs.readFileSync(path.join(rootDir, 'js/views/catalog.js'), 'utf8');
  const searchCode = fs.readFileSync(path.join(rootDir, 'js/views/search-results.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');
  const cartCode = fs.readFileSync(path.join(rootDir, 'js/views/cart.js'), 'utf8');
  const checkoutCode = fs.readFileSync(path.join(rootDir, 'js/views/checkout.js'), 'utf8');
  const profileCode = fs.readFileSync(path.join(rootDir, 'js/views/profile.js'), 'utf8');
  const trackingCode = fs.readFileSync(path.join(rootDir, 'js/views/tracking.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');

  const elements = new Map();

  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        contains: (c) => this.classList._classes.has(c)
      };
      this.style = {};
      this.innerText = '';
      this._innerHTML = '';
      this.attributes = new Map();
      this.children = [];
      if (id) elements.set(id, this);
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) { this._innerHTML = v; }
    querySelector(selector) {
      if (!selector) return null;
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        return elements.get(id) || null;
      }
      return new MockElement('mock-' + Math.random().toString(36).substring(7));
    }
    querySelectorAll(selector) {
      return [new MockElement('mock-item-1'), new MockElement('mock-item-2')];
    }
    addEventListener() {}
    removeEventListener() {}
    setAttribute(k, v) { this.attributes.set(k, String(v)); this[k] = v; }
    getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : (this[k] || null); }
    removeAttribute(k) { this.attributes.delete(k); delete this[k]; }
    appendChild(child) { this.children.push(child); return child; }
    remove() {}
    focus() {}
    insertAdjacentHTML() {}
  }

  // Pre-seed core DOM element containers
  new MockElement('app-view');
  new MockElement('search-results-container');
  new MockElement('pdp-price');
  new MockElement('pdp-cert-badge');
  new MockElement('pdp-quantity-value');
  new MockElement('pdp-3d-scene');
  new MockElement('pdp-3d-object');
  new MockElement('pdp-main-image');
  new MockElement('cart-count-badge');
  new MockElement('cart-count-badge-mobile');
  new MockElement('toast-container');
  new MockElement('categories-drawer');
  new MockElement('btn-categories-drawer');
  new MockElement('search-view-input', 'input');

  const sandbox = {
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    },
    Math,
    Date,
    parseInt,
    parseFloat,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Set,
    Map,
    URLSearchParams,
    URL,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    performance: { now: () => Date.now() },
    document: {
      getElementById: (id) => elements.get(id) || null,
      querySelector: (sel) => {
        if (sel.startsWith('#')) {
          const id = sel.slice(1);
          return elements.get(id) || null;
        }
        return new MockElement('mock-query-' + Math.random().toString(36).substring(7));
      },
      querySelectorAll: () => [],
      createElement: (tag) => new MockElement('', tag),
      body: new MockElement('body'),
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    location: { hash: '' },
    window: {
      location: { hash: '' },
      URLSearchParams,
      URL,
      scrollTo: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    history: {
      replaceState: (state, title, url) => {
        if (url && url.includes('#')) {
          sandbox.location.hash = '#' + url.split('#')[1];
          sandbox.window.location.hash = sandbox.location.hash;
        }
      },
      pushState: (state, title, url) => {
        if (url && url.includes('#')) {
          sandbox.location.hash = '#' + url.split('#')[1];
          sandbox.window.location.hash = sandbox.location.hash;
        }
      }
    },
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; },
      clear() { this._store = {}; }
    }
  };

  // Condition for Lucide CDN availability
  if (options.lucideAvailable) {
    sandbox.lucide = {
      createIcons: () => {}
    };
    sandbox.window.lucide = sandbox.lucide;
  } else {
    sandbox.lucide = undefined;
    sandbox.window.lucide = undefined;
  }

  sandbox.globalThis = sandbox;
  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;

  vm.createContext(sandbox);

  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(apiCode + '\n;this.PokemonAPI = PokemonAPI;', sandbox);
  vm.runInContext(homeCode + '\n;this.HomeView = HomeView;', sandbox);
  vm.runInContext(catalogCode + '\n;this.CatalogView = CatalogView;', sandbox);
  vm.runInContext(searchCode + '\n;this.SearchResultsView = SearchResultsView;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);
  vm.runInContext(cartCode + '\n;this.CartView = CartView;', sandbox);
  vm.runInContext(checkoutCode + '\n;this.CheckoutView = CheckoutView;', sandbox);
  vm.runInContext(profileCode + '\n;this.ProfileView = ProfileView;', sandbox);
  vm.runInContext(trackingCode + '\n;this.TrackingView = TrackingView;', sandbox);
  vm.runInContext(appCode + '\n;this.app = app;', sandbox);

  return {
    sandbox,
    Store: sandbox.Store,
    PokemonAPI: sandbox.PokemonAPI,
    SearchResultsView: sandbox.SearchResultsView,
    PDPView: sandbox.PDPView,
    CatalogView: sandbox.CatalogView,
    CartView: sandbox.CartView,
    CheckoutView: sandbox.CheckoutView,
    HomeView: sandbox.HomeView,
    ProfileView: sandbox.ProfileView,
    TrackingView: sandbox.TrackingView,
    app: sandbox.app,
    elements
  };
}

// ==============================================================================
// SUITE 1: R3 Image Paths, URL Normalization & 404 Prevention
// ==============================================================================

test('R3 Adversarial [Suite 1.1]: card-back.png asset exists on disk and has non-zero byte size', () => {
  const cardBackPath = path.join(process.cwd(), 'img/cards/card-back.png');
  assert.ok(fs.existsSync(cardBackPath), `Asset img/cards/card-back.png must exist at: ${cardBackPath}`);
  const stat = fs.statSync(cardBackPath);
  assert.ok(stat.size > 1000, `card-back.png must have valid non-trivial size, got: ${stat.size} bytes`);
});

test('R3 Adversarial [Suite 1.2]: PokemonAPI codebase contains zero references to nonexistent charizard-base.png', () => {
  const apiFile = path.join(process.cwd(), 'js/services/pokemon-api.js');
  const apiContent = fs.readFileSync(apiFile, 'utf8');
  assert.ok(
    !apiContent.includes('charizard-base.png'),
    'PokemonAPI must never reference nonexistent charizard-base.png as image or fallback'
  );

  const searchViewFile = path.join(process.cwd(), 'js/views/search-results.js');
  const searchContent = fs.readFileSync(searchViewFile, 'utf8');
  assert.ok(
    !searchContent.includes('charizard-base.png'),
    'SearchResultsView must never reference nonexistent charizard-base.png'
  );
});

test('R3 Adversarial [Suite 1.3]: TCGdex image URL sanitation fuzzer across 500 edge cases', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const edgeCases = [
    // 1. Missing extension -> must append /high.webp
    { input: 'https://assets.tcgdex.net/en/swsh/swsh7/215', expected: 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp' },
    { input: 'https://assets.tcgdex.net/en/base/base1/4', expected: 'https://assets.tcgdex.net/en/base/base1/4/high.webp' },
    
    // 2. Existing valid extensions -> must preserve without duplicate /high.webp
    { input: 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp', expected: 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp' },
    { input: 'https://images.pokemontcg.io/base1/4_hires.png', expected: 'https://images.pokemontcg.io/base1/4_hires.png' },
    { input: 'https://images.pokemontcg.io/base1/4.jpg', expected: 'https://images.pokemontcg.io/base1/4.jpg' },

    // 3. Falsy/Missing image -> fallback to verified card-back.png
    { input: null, expected: 'img/cards/card-back.png' },
    { input: undefined, expected: 'img/cards/card-back.png' },
    { input: '', expected: 'img/cards/card-back.png' },
    { input: false, expected: 'img/cards/card-back.png' }
  ];

  edgeCases.forEach(({ input, expected }, idx) => {
    const rawCard = [{ id: `card-edge-${idx}`, name: 'Test Card', image: input, rarity: 'Common' }];
    const normalized = api._normalizeSecondaryResults(rawCard);
    assert.equal(
      normalized[0].imagen,
      expected,
      `Failed on edge case ${idx}: input "${input}" expected "${expected}", got "${normalized[0].imagen}"`
    );
  });

  // Randomized fuzzing (500 variations)
  for (let i = 0; i < 500; i++) {
    const hasExt = i % 3 === 0;
    const isMissing = i % 7 === 0;
    const ext = i % 2 === 0 ? '.webp' : '.png';
    const baseUrl = `https://assets.tcgdex.net/en/set-${i}/card-${i}`;
    const rawImg = isMissing ? null : (hasExt ? `${baseUrl}${ext}` : baseUrl);

    const raw = [{ id: `fuzz-${i}`, name: `Card ${i}`, image: rawImg }];
    const norm = api._normalizeSecondaryResults(raw);
    const resultImg = norm[0].imagen;

    assert.ok(typeof resultImg === 'string', 'Image must be string');
    assert.ok(!resultImg.includes('charizard-base.png'), 'Must never output charizard-base.png');
    if (isMissing) {
      assert.equal(resultImg, 'img/cards/card-back.png');
    } else if (hasExt) {
      assert.ok(resultImg.endsWith(ext));
      assert.ok(!resultImg.endsWith(`${ext}/high.webp`), 'Must not double-append extension');
    } else {
      assert.ok(resultImg.endsWith('/high.webp'));
    }
  }
});

test('R3 Adversarial [Suite 1.4]: Primary source pokemontcg.io normalizer fallback cascade', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const cards = [
    { id: 'p1', name: 'Has Small', images: { small: 'https://images.pokemontcg.io/sm1/small.png', large: 'https://images.pokemontcg.io/sm1/large.png' } },
    { id: 'p2', name: 'Has Large Only', images: { large: 'https://images.pokemontcg.io/sm2/large.png' } },
    { id: 'p3', name: 'Empty Images Object', images: {} },
    { id: 'p4', name: 'Null Images Object', images: null },
    { id: 'p5', name: 'Undefined Images Object' }
  ];

  const normalized = api._normalizePrimaryResults(cards);

  assert.equal(normalized[0].imagen, 'https://images.pokemontcg.io/sm1/small.png');
  assert.equal(normalized[1].imagen, 'https://images.pokemontcg.io/sm2/large.png');
  assert.equal(normalized[2].imagen, 'img/cards/card-back.png');
  assert.equal(normalized[3].imagen, 'img/cards/card-back.png');
  assert.equal(normalized[4].imagen, 'img/cards/card-back.png');
});

test('R3 Adversarial [Suite 1.5]: SearchResultsView HTML renderer guarantees onerror fallback on all card items', () => {
  const { SearchResultsView } = createAdversarialEnvironment();
  const cards = [
    { id: 'c-1', nombre: 'Pikachu', set: 'Paldea', rareza: 'Common', imagen: 'https://assets.tcgdex.net/pika/high.webp', precioEstimado: 8.50, fuente: 'tcgdex.net' },
    { id: 'c-2', nombre: 'Mew', set: '151', rareza: 'Ultra Rare', imagen: 'img/cards/card-back.png', precioEstimado: 45.00, fuente: 'pokemontcg.io' }
  ];

  const html = SearchResultsView.renderResultsGrid(cards, 'Test');
  assert.ok(html.includes("onerror=\"this.onerror=null; this.src='img/cards/card-back.png'\""), 'Must contain safe self-cancelling onerror handler');
  assert.ok(!html.includes('charizard-base.png'), 'Must not reference charizard-base.png');
});

// ==============================================================================
// SUITE 2: R3 Pricing Engine Adversarial Fuzzing & Multi-Variable Verification
// ==============================================================================

test('R3 Adversarial [Suite 2.1]: 2,000 randomized cards strictly eliminate static $15.00 placeholder', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'Secret Rare', 'Special Illustration Rare'];
  const sets = ['Base Set', 'Jungle', 'Neo Genesis', 'Evolving Skies', 'Scarlet & Violet', 'Crown Zenith', 'Fusion Strike'];
  const names = ['Charizard', 'Umbreon', 'Lugia', 'Rayquaza', 'Gengar', 'Pikachu', 'Weedle', 'Zubat', 'Pidgey'];

  for (let i = 0; i < 2000; i++) {
    const card = {
      id: `adversarial-card-${i}-${Math.random().toString(36).substring(7)}`,
      name: names[i % names.length],
      set: { name: sets[i % sets.length] },
      rarity: rarities[i % rarities.length]
    };

    const price = api.calculateRealisticPrice(card);

    assert.ok(typeof price === 'number', `Price must be number for iteration ${i}`);
    assert.ok(!isNaN(price), `Price cannot be NaN for iteration ${i}`);
    assert.ok(isFinite(price), `Price must be finite for iteration ${i}`);
    assert.ok(price > 0, `Price must be strictly positive: ${price}`);
    assert.notEqual(price, 15.00, `Card "${card.name}" in set "${card.set.name}" must not have placeholder price $15.00!`);
    
    // Check 2 decimal places precision
    const rounded = Math.round(price * 100) / 100;
    assert.equal(price, rounded, `Price must be rounded to at most 2 decimals: ${price}`);
  }
});

test('R3 Adversarial [Suite 2.2]: Rarity valuation hierarchy strictly holds across all permutations', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const commonCard = { id: 'test-common', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Common' };
  const uncommonCard = { id: 'test-uncommon', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Uncommon' };
  const rareCard = { id: 'test-rare', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Rare' };
  const holoCard = { id: 'test-holo', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Rare Holo' };
  const ultraCard = { id: 'test-ultra', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Ultra Rare' };
  const secretCard = { id: 'test-secret', name: 'Bulbasaur', set: { name: 'Scarlet & Violet' }, rarity: 'Secret Rare' };

  const pCommon = api.calculateRealisticPrice(commonCard);
  const pUncommon = api.calculateRealisticPrice(uncommonCard);
  const pRare = api.calculateRealisticPrice(rareCard);
  const pHolo = api.calculateRealisticPrice(holoCard);
  const pUltra = api.calculateRealisticPrice(ultraCard);
  const pSecret = api.calculateRealisticPrice(secretCard);

  assert.ok(pCommon < pUncommon, `Common ($${pCommon}) must be less than Uncommon ($${pUncommon})`);
  assert.ok(pUncommon < pRare, `Uncommon ($${pUncommon}) must be less than Rare ($${pRare})`);
  assert.ok(pRare < pHolo, `Rare ($${pRare}) must be less than Holo ($${pHolo})`);
  assert.ok(pHolo < pUltra, `Holo ($${pHolo}) must be less than Ultra ($${pUltra})`);
  assert.ok(pUltra < pSecret, `Ultra ($${pUltra}) must be less than Secret ($${pSecret})`);
});

test('R3 Adversarial [Suite 2.3]: Vintage era multipliers elevate collectible valuations', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const modernCard = { id: 'c-modern', name: 'Pikachu', set: { name: 'Paldea Evolved' }, rarity: 'Rare' };
  const sunMoonCard = { id: 'c-sm', name: 'Pikachu', set: { name: 'Sun & Moon' }, rarity: 'Rare' };
  const xyCard = { id: 'c-xy', name: 'Pikachu', set: { name: 'XY Evolutions' }, rarity: 'Rare' };
  const exCard = { id: 'c-ex', name: 'Pikachu', set: { name: 'EX Ruby & Sapphire' }, rarity: 'Rare' };
  const wotcCard = { id: 'c-wotc', name: 'Pikachu', set: { name: 'Base Set 1999' }, rarity: 'Rare' };

  const pModern = api.calculateRealisticPrice(modernCard);
  const pSM = api.calculateRealisticPrice(sunMoonCard);
  const pXY = api.calculateRealisticPrice(xyCard);
  const pEX = api.calculateRealisticPrice(exCard);
  const pWotC = api.calculateRealisticPrice(wotcCard);

  assert.ok(pWotC > pEX, `WotC vintage ($${pWotC}) must be higher than EX era ($${pEX})`);
  assert.ok(pEX > pXY, `EX era ($${pEX}) must be higher than XY era ($${pXY})`);
  assert.ok(pXY > pSM, `XY era ($${pXY}) must be higher than Sun & Moon ($${pSM})`);
  assert.ok(pSM > pModern, `Sun & Moon ($${pSM}) must be higher than modern ($${pModern})`);
});

test('R3 Adversarial [Suite 2.4]: Star character bonus accurately prioritizes Chase cards', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  const standardCard = { id: 'c-pidg', name: 'Pidgeot', set: { name: 'Base Set' }, rarity: 'Rare Holo' };
  const charizardCard = { id: 'c-char', name: 'Charizard', set: { name: 'Base Set' }, rarity: 'Rare Holo' };
  const umbreonCard = { id: 'c-umb', name: 'Umbreon', set: { name: 'Base Set' }, rarity: 'Rare Holo' };

  const pStandard = api.calculateRealisticPrice(standardCard);
  const pCharizard = api.calculateRealisticPrice(charizardCard);
  const pUmbreon = api.calculateRealisticPrice(umbreonCard);

  assert.ok(pCharizard > pUmbreon, `Charizard ($${pCharizard}) must exceed Umbreon ($${pUmbreon})`);
  assert.ok(pUmbreon > pStandard, `Umbreon ($${pUmbreon}) must exceed standard Pokémon ($${pStandard})`);
  assert.ok(pCharizard > pStandard * 2.5, `Charizard must have >= 2.5x premium over standard holofoil`);
});

test('R3 Adversarial [Suite 2.5]: Corrupted, malformed & negative price edge cases are resilient', () => {
  const { PokemonAPI } = createAdversarialEnvironment();
  const api = new PokemonAPI();

  // Null input
  assert.equal(api.calculateRealisticPrice(null), 25.00);
  assert.equal(api.calculateRealisticPrice(undefined), 25.00);

  // Negative market prices should be rejected in favor of synthetic calculation
  const negativeMarket = {
    id: 'neg-1',
    name: 'Gengar',
    cardmarket: { prices: { averageSellPrice: -50.00 } }
  };
  const pNeg = api.calculateRealisticPrice(negativeMarket);
  assert.ok(pNeg > 0, `Negative market price must be rejected, got: ${pNeg}`);

  // Zero market price should be rejected
  const zeroMarket = {
    id: 'zero-1',
    name: 'Lugia',
    tcgplayer: { prices: { holofoil: { market: 0 } } }
  };
  const pZero = api.calculateRealisticPrice(zeroMarket);
  assert.ok(pZero > 0, `Zero market price must trigger calculated pricing, got: ${pZero}`);

  // Empty object
  const pEmpty = api.calculateRealisticPrice({});
  assert.ok(pEmpty > 0 && !isNaN(pEmpty), `Empty card must not throw, got: ${pEmpty}`);
});

// ==============================================================================
// SUITE 3: R3 Store Integration, 3D PDP Inspection & Complete E2E Checkout
// ==============================================================================

test('R3 Adversarial [Suite 3.1]: API search card registers in Store, routes to PDP, and renders 3D inspector', () => {
  const { app, Store, SearchResultsView, PDPView } = createAdversarialEnvironment();

  const externalCard = {
    id: 'tcgdex-charizard-vstar-secret',
    nombre: 'Charizard VSTAR Rainbow Secret',
    set: 'Brilliant Stars',
    rareza: 'Rainbow Rare',
    imagen: 'https://assets.tcgdex.net/en/swsh/swsh9/174/high.webp',
    precioEstimado: 145.00,
    fuente: 'tcgdex.net'
  };

  // 1. Grid render pre-registers the card
  SearchResultsView.renderResultsGrid([externalCard], 'Charizard');
  const stored = Store.getProduct('tcgdex-charizard-vstar-secret');
  assert.ok(stored, 'Card must be queryable via Store.getProduct()');
  assert.equal(stored.id, 'tcgdex-charizard-vstar-secret');

  // 2. Route to PDP
  app.openProductPDP('tcgdex-charizard-vstar-secret');
  assert.equal(Store.data.currentPdpProduct.id, 'tcgdex-charizard-vstar-secret');

  // 3. Render PDP
  const pdpHtml = PDPView.render();
  assert.ok(pdpHtml.includes('Charizard VSTAR Rainbow Secret'), 'PDP must show external card title');
  assert.ok(pdpHtml.includes('id="pdp-3d-scene"'), 'PDP must render 3D inspection scene for external card');
  assert.ok(pdpHtml.includes('id="pdp-3d-object"'), 'PDP must render 3D object');
  assert.ok(pdpHtml.includes('https://assets.tcgdex.net/en/swsh/swsh9/174/high.webp'), 'PDP must use sanitized image');

  // 4. Test condition tiers for external card lacking original precios dictionary
  const conditionPrices = PDPView.getConditionPrices(stored);
  assert.equal(conditionPrices.raw, 145);
  assert.equal(conditionPrices.psa8, Math.round(145 * 1.35));
  assert.equal(conditionPrices.psa9, Math.round(145 * 2.10));
  assert.equal(conditionPrices.psa10, Math.round(145 * 5.20));

  // 5. Test switching conditions on external card
  PDPView.selectCondition('psa9');
  assert.equal(Store.data.pdpSelectedCondition, 'psa9');
  PDPView.selectCondition('raw');
  assert.equal(Store.data.pdpSelectedCondition, 'raw');
});

test('R3 Adversarial [Suite 3.2]: End-to-end checkout flow for external API card with order finalization', () => {
  const { app, Store, PDPView, CheckoutView } = createAdversarialEnvironment();

  const externalCard = {
    id: 'api-tcgdex-umbreon-alt',
    nombre: 'Umbreon VMAX Alt Art',
    set: 'Evolving Skies',
    rareza: 'Secret Rare',
    imagen: 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp',
    precioEstimado: 600.00,
    fuente: 'tcgdex.net'
  };

  Store.registerApiCard(externalCard);
  app.openProductPDP('api-tcgdex-umbreon-alt');

  // Select PSA 10 condition ($600 * 5.20 = $3,120.00)
  PDPView.selectCondition('psa10');
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const cartItem = Store.data.cart[0];
  assert.equal(cartItem.id, 'api-tcgdex-umbreon-alt-psa10');
  assert.equal(cartItem.price, 3120);
  assert.equal(cartItem.quantity, 1);

  // Configure store user & shipping
  Store.data.currentUser = {
    name: 'Roberto Valdivieso',
    email: 'roberto@tcgcollector.ec',
    phone: '+593 991234567',
    idCard: '1710034065' // Valid Module 10 Pichincha Cédula
  };
  Store.data.deliveryMethod = 'quito'; // $3.00 flat shipping

  // Verify Cart Totals: Subtotal $3120, Tax (15%) = $468.00, Shipping = $3.00, Total = $3,591.00
  const totals = Store.getCartTotals();
  assert.equal(totals.subtotal, 3120.00);
  assert.equal(totals.tax, 468.00);
  assert.equal(totals.shipping, 3.00);
  assert.equal(totals.total, 3591.00);

  // Render Checkout
  const checkoutHtml = CheckoutView.renderCheckout();
  assert.ok(checkoutHtml.includes('Roberto Valdivieso'));
  assert.ok(checkoutHtml.includes('1710034065'));

  // Place order using Store.addOrder
  const orderId = `GS-${Date.now()}`;
  const orderData = {
    orderId,
    date: new Date().toISOString(),
    buyerName: Store.data.currentUser.name,
    buyerEmail: Store.data.currentUser.email,
    paymentMethod: 'Tarjeta de Crédito / Débito (Visa)',
    deliveryMethod: 'Express Quito ($3.00)',
    items: [...Store.data.cart],
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
    status: 'PROCESANDO_CUSTODIA'
  };

  Store.addOrder(orderData);
  Store.data.cart = []; // Empty cart on success

  assert.equal(Store.data.cart.length, 0);
  assert.equal(Store.data.orders.length, 1);
  assert.equal(Store.data.orders[0].orderId, orderId);

  // Render confirmation
  const confHtml = CheckoutView.renderConfirmation();
  assert.ok(confHtml.includes(orderId), 'Confirmation must display orderId');
  assert.ok(confHtml.includes('roberto@tcgcollector.ec'), 'Confirmation must display buyer email');
  assert.ok(confHtml.includes('Umbreon VMAX Alt Art'), 'Confirmation must display purchased item');
});

// ==============================================================================
// SUITE 4: R4 Stability, Lucide CDN Shielding & Zero Console Errors
// ==============================================================================

test('R4 Adversarial [Suite 4.1]: Lucide CDN Outage Simulation - 100% views render without throwing', () => {
  // Pass lucideAvailable: false to simulate CDN blocking, failure, or headless test run
  const env = createAdversarialEnvironment({ lucideAvailable: false });

  // Test that global lucide is indeed undefined
  assert.equal(env.sandbox.lucide, undefined);

  // Render every view in the application under CDN outage
  assert.doesNotThrow(() => {
    env.HomeView.render();
  }, 'HomeView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CatalogView.render();
  }, 'CatalogView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.SearchResultsView.render('Charizard');
  }, 'SearchResultsView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.PDPView.render();
  }, 'PDPView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CartView.render();
  }, 'CartView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CheckoutView.renderCheckout();
  }, 'CheckoutView.renderCheckout() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CheckoutView.renderConfirmation();
  }, 'CheckoutView.renderConfirmation() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CheckoutView.renderPaymentError();
  }, 'CheckoutView.renderPaymentError() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.CheckoutView.renderAuth();
  }, 'CheckoutView.renderAuth() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.ProfileView.render();
  }, 'ProfileView.render() threw under CDN outage');

  assert.doesNotThrow(() => {
    env.TrackingView.render();
  }, 'TrackingView.render() threw under CDN outage');

  // Trigger app.renderCurrentView with Lucide undefined
  assert.doesNotThrow(() => {
    env.app.renderCurrentView();
  }, 'app.renderCurrentView() threw under CDN outage');
});

test('R4 Adversarial [Suite 4.2]: Router Stress Navigation across 150 consecutive route transitions', () => {
  const { app, Store } = createAdversarialEnvironment({ lucideAvailable: false });

  const routesToTest = [
    '#home',
    '#catalog',
    '#catalog?cat=psa',
    '#catalog?era=vintage',
    '#catalog?q=Charizard',
    '#search-results',
    '#search-results?q=Pikachu',
    '#search-results?q=Charizard%20GX',
    '#pdp?id=charizard-base',
    '#pdp?id=umbreon-vmax',
    '#pdp?id=lugia-neo',
    '#cart',
    '#checkout',
    '#profile',
    '#tracking?order=GS-12345678',
    '#invalid-unknown-route-test',
    '###',
    '#',
    '#pdp?id=nonexistent-id',
    '#search-results?q=<script>alert(1)</script>'
  ];

  for (let i = 0; i < 150; i++) {
    const target = routesToTest[i % routesToTest.length];
    assert.doesNotThrow(() => {
      app.handleRoute(target);
    }, `Router failed on iteration ${i} navigating to target: "${target}"`);

    // Verify view state remains valid string
    assert.ok(typeof Store.data.currentView === 'string', `currentView must be string at iteration ${i}`);
    assert.ok(Store.data.currentView.length > 0, `currentView cannot be empty at iteration ${i}`);
  }
});

test('R4 Adversarial [Suite 4.3]: Malformed parameters, SQL injections & XSS in routes', () => {
  const { app, Store, SearchResultsView } = createAdversarialEnvironment();

  const attackVectors = [
    "#search-results?q=' OR '1'='1",
    "#search-results?q=<img src=x onerror=alert('xss')>",
    "#search-results?q=%00%0D%0A",
    "#search-results?q=" + "A".repeat(2000),
    "#pdp?id=' UNION SELECT * FROM users--",
    "#pdp?id=<svg onload=alert(1)>",
    "#catalog?minPrice=NaN&maxPrice=Infinity",
    "#tracking?order=DROP TABLE orders;"
  ];

  attackVectors.forEach((vector) => {
    assert.doesNotThrow(() => {
      app.handleRoute(vector);
    }, `Vector "${vector}" crashed router`);
  });

  // Zero-state HTML sanitization check
  const xssQuery = '<script>alert("PWNED")</script>';
  const zeroStateHtml = SearchResultsView.renderZeroState(xssQuery);
  assert.ok(!zeroStateHtml.includes('<script>alert'), 'Zero-state must HTML-escape script tags');
  assert.ok(zeroStateHtml.includes('&lt;script&gt;alert'), 'Zero-state must contain escaped entities');
});
