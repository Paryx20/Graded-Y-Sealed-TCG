/**
 * ==============================================================================
 * Acceptance Test Suite: API Search Integration, Images, Realistic Pricing & Store Flow (Requirement R3)
 * File: tests/test_api_search_integration.test.mjs
 * 
 * Verifies:
 * 1. TCGdex Image Sanitation (/high.webp formatting & verified card-back fallback)
 * 2. Multi-variable realistic market price engine (rarity, vintage era, popularity, hash)
 * 3. Elimination of fixed $15.00 placeholder prices across diverse search results
 * 4. Store.registerApiCard caching and normalized schema compliance
 * 5. Store.getProduct resolution across local PRODUCTS and apiCardsCache
 * 6. SearchResultsView navigation to PDP via app.openProductPDP
 * 7. End-to-end store flow: API card discovery -> PDP 3D inspection -> cart addition
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function createSearchIntegrationEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const apiCode = fs.readFileSync(path.join(rootDir, 'js/services/pokemon-api.js'), 'utf8');
  const searchCode = fs.readFileSync(path.join(rootDir, 'js/views/search-results.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8');

  const elements = new Map();
  const cartHistory = [];
  const toastHistory = [];

  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.classList = {
        add: () => {},
        remove: () => {},
        contains: () => false
      };
      this.style = {};
      this.innerText = '';
      this._innerHTML = '';
      if (id) elements.set(id, this);
    }
    get innerHTML() { return this._innerHTML; }
    set innerHTML(v) { this._innerHTML = v; }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    addEventListener() {}
    removeEventListener() {}
    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k] || null; }
    removeAttribute(k) { delete this[k]; }
    appendChild(child) { return child; }
    remove() {}
  }

  // Pre-populate core view containers
  new MockElement('app-view');
  new MockElement('search-results-container');
  new MockElement('cart-count-badge');
  new MockElement('cart-count-badge-mobile');
  new MockElement('toast-container');

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    Array,
    Object,
    String,
    Number,
    Boolean,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    document: {
      getElementById: (id) => elements.get(id) || null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => new MockElement('', tag),
      body: new MockElement('body'),
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    location: { hash: '' },
    window: {
      location: { hash: '' },
      scrollTo: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    history: {
      replaceState: () => {},
      pushState: () => {}
    },
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); },
      removeItem(k) { delete this._store[k]; }
    }
  };

  sandbox.globalThis = sandbox;
  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(apiCode + '\n;this.PokemonAPI = PokemonAPI;', sandbox);
  vm.runInContext(searchCode + '\n;this.SearchResultsView = SearchResultsView;', sandbox);
  vm.runInContext(pdpCode + '\n;this.PDPView = PDPView;', sandbox);
  vm.runInContext(appCode + '\n;this.app = app;', sandbox);

  return {
    sandbox,
    Store: sandbox.Store,
    PokemonAPI: sandbox.PokemonAPI,
    SearchResultsView: sandbox.SearchResultsView,
    PDPView: sandbox.PDPView,
    app: sandbox.app,
    elements
  };
}

test('R3 API Search [Test 3.1]: TCGdex image normalizer formats /high.webp and replaces broken fallbacks', () => {
  const { PokemonAPI } = createSearchIntegrationEnvironment();
  const api = new PokemonAPI();

  const rawCards = [
    {
      id: 'swsh7-215',
      name: 'Umbreon VMAX',
      image: 'https://assets.tcgdex.net/en/swsh/swsh7/215', // Lacks extension
      rarity: 'Secret Rare'
    },
    {
      id: 'base1-4',
      name: 'Charizard',
      image: 'https://images.pokemontcg.io/base1/4.png', // Already has .png extension
      rarity: 'Rare Holo'
    },
    {
      id: 'promo-no-img',
      name: 'Card Without Artwork',
      image: undefined, // Missing artwork
      rarity: 'Promo'
    }
  ];

  const normalized = api._normalizeSecondaryResults(rawCards);

  // Assert artwork-first sorting: cards with artwork appear first
  assert.equal(normalized[0].id, 'swsh7-215');
  assert.equal(normalized[1].id, 'base1-4');
  assert.equal(normalized[2].id, 'promo-no-img');

  // Assert /high.webp appended
  assert.equal(normalized[0].imagen, 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp');

  // Assert existing extension preserved
  assert.equal(normalized[1].imagen, 'https://images.pokemontcg.io/base1/4.png');

  // Assert fallback to verified local asset, NEVER nonexistent charizard-base.png
  assert.equal(normalized[2].imagen, 'img/cards/card-back.png');
  assert.ok(!JSON.stringify(normalized).includes('charizard-base.png'), 'Must never reference nonexistent charizard-base.png');
});

test('R3 API Search [Test 3.2]: Multi-variable pricing algorithm eliminates static $15.00 placeholder', () => {
  const { PokemonAPI } = createSearchIntegrationEnvironment();
  const api = new PokemonAPI();

  const testCards = [
    { id: 'c1', name: 'Pikachu', set: { name: 'Crown Zenith' }, rarity: 'Common' },
    { id: 'c2', name: 'Caterpie', set: { name: 'Base Set' }, rarity: 'Common' },
    { id: 'c3', name: 'Charizard Holo', set: { name: 'Base Set' }, rarity: 'Rare Holo' },
    { id: 'c4', name: 'Umbreon VMAX Alt Art', set: { name: 'Evolving Skies' }, rarity: 'Secret Rare' },
    { id: 'c5', name: 'Lugia 1st Edition', set: { name: 'Neo Genesis' }, rarity: 'Rare Holo' },
    { id: 'c6', name: 'Rattata', set: { name: 'Paldea Evolved' }, rarity: 'Common' },
    { id: 'c7', name: 'Gengar EX', set: { name: 'Phantom Forces' }, rarity: 'Ultra Rare' },
    { id: 'c8', name: 'Mew Secret', set: { name: 'Fusion Strike' }, rarity: 'Hyper Rare' }
  ];

  const prices = testCards.map(c => api.calculateRealisticPrice(c));

  // None of the cards should evaluate to the static $15.00 placeholder
  prices.forEach((p, idx) => {
    assert.notEqual(p, 15.00, `Card ${testCards[idx].name} must not have placeholder price 15.00`);
    assert.ok(typeof p === 'number' && p > 0, `Price must be positive number: ${p}`);
  });

  // Verify natural market valuation hierarchy
  const pCharizard = api.calculateRealisticPrice(testCards[2]);
  const pCommonModern = api.calculateRealisticPrice(testCards[5]);
  const pUmbreonSecret = api.calculateRealisticPrice(testCards[3]);

  assert.ok(pCharizard > 200, `Vintage Charizard Holo must reflect high collectible value (> $200), got: $${pCharizard}`);
  assert.ok(pUmbreonSecret > 100, `Umbreon Secret Rare must reflect premium valuation (> $100), got: $${pUmbreonSecret}`);
  assert.ok(pCommonModern < 10, `Modern Common must reflect low value (< $10), got: $${pCommonModern}`);
});

test('R3 API Search [Test 3.3]: Direct API market fields (cardmarket, tcgplayer) take precedence when available', () => {
  const { PokemonAPI } = createSearchIntegrationEnvironment();
  const api = new PokemonAPI();

  const cardWithCardmarket = {
    id: 'cm-1',
    name: 'Special Art Pikachu',
    cardmarket: { prices: { averageSellPrice: 64.50 } }
  };

  const cardWithTcgplayer = {
    id: 'tcg-1',
    name: 'Rayquaza VMAX',
    tcgplayer: { prices: { holofoil: { market: 182.75 } } }
  };

  assert.equal(api.calculateRealisticPrice(cardWithCardmarket), 64.50);
  assert.equal(api.calculateRealisticPrice(cardWithTcgplayer), 182.75);
});

test('R3 API Search [Test 3.4]: Store.registerApiCard normalizes external cards and creates full product schema', () => {
  const { Store } = createSearchIntegrationEnvironment();

  const apiCard = {
    id: 'tcgdex-gengar-alt',
    nombre: 'Gengar VMAX Alt Art',
    set: 'Fusion Strike',
    rareza: 'Special Illustration Rare',
    imagen: 'https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp',
    precioEstimado: 120.00,
    fuente: 'tcgdex.net'
  };

  const product = Store.registerApiCard(apiCard);

  assert.ok(product, 'Must return normalized product');
  assert.equal(product.id, 'tcgdex-gengar-alt');
  assert.equal(product.nombre, 'Gengar VMAX Alt Art');
  assert.equal(product.categoria, 'psa');
  assert.equal(product.tipo_discriminador, 'CARTA_INDIVIDUAL');
  assert.ok(product.certNumber && product.certNumber.length >= 8, 'Must generate certNumber');

  // Verify deterministic condition pricing tiers
  assert.equal(product.precios.raw, 120);
  assert.equal(product.precios.psa8, Math.round(120 * 1.35));
  assert.equal(product.precios.psa9, Math.round(120 * 2.10));
  assert.equal(product.precios.psa10, Math.round(120 * 5.20));

  // Verify caching in Store.data.apiCardsCache
  assert.equal(Store.data.apiCardsCache['tcgdex-gengar-alt'], product);
  assert.equal(Store.getProduct('tcgdex-gengar-alt'), product);
});

test('R3 API Search [Test 3.5]: SearchResultsView pre-registers cards and routes to PDP on selection', () => {
  const { SearchResultsView, Store } = createSearchIntegrationEnvironment();

  const searchCards = [
    {
      id: 'api-mew-v',
      nombre: 'Mew V',
      set: 'Fusion Strike',
      rareza: 'Ultra Rare',
      imagen: 'https://assets.tcgdex.net/en/swsh/swsh8/69/high.webp',
      precioEstimado: 35.00,
      fuente: 'tcgdex.net'
    }
  ];

  const html = SearchResultsView.renderResultsGrid(searchCards, 'Mew');

  // Verify pre-registration in Store
  const registered = Store.getProduct('api-mew-v');
  assert.ok(registered, 'Card must be pre-registered into Store upon results grid rendering');

  // Verify card thumbnail is clickable and calls app.openProductPDP
  assert.ok(html.includes("app.openProductPDP('api-mew-v')"), 'Card thumbnail/details must trigger openProductPDP');

  // Verify image does not use charizard-base.png
  assert.ok(!html.includes('charizard-base.png'));
  assert.ok(html.includes('img/cards/card-back.png'));
});

test('R3 API Search [Test 3.6]: app.openProductPDP loads API-discovered card with 3D viewer and renders view', () => {
  const { app, Store, PDPView } = createSearchIntegrationEnvironment();

  const apiCard = {
    id: 'api-charizard-vstar',
    nombre: 'Charizard VSTAR',
    set: 'Brilliant Stars',
    rareza: 'Ultra Rare',
    imagen: 'https://assets.tcgdex.net/en/swsh/swsh9/18/high.webp',
    precioEstimado: 45.00,
    fuente: 'tcgdex.net'
  };

  Store.registerApiCard(apiCard);
  app.openProductPDP('api-charizard-vstar');

  assert.equal(Store.data.currentPdpProduct.id, 'api-charizard-vstar');
  assert.equal(Store.data.pdpSelectedCondition, 'psa10');
  assert.equal(Store.data.pdpInspectorMode, 'front');

  // Render PDP view
  const pdpHtml = PDPView.render();
  assert.ok(pdpHtml.includes('Charizard VSTAR'));
  assert.ok(pdpHtml.includes('id="pdp-3d-scene"'));
  assert.ok(pdpHtml.includes('id="pdp-price"'));
  assert.ok(pdpHtml.includes(`$${(45 * 5.20).toFixed(2)} USD`));
});

test('R3 API Search [Test 3.7]: Complete end-to-end checkout flow for API-discovered card', () => {
  const { app, Store, PDPView } = createSearchIntegrationEnvironment();

  const apiCard = {
    id: 'api-rayquaza-vmax',
    nombre: 'Rayquaza VMAX',
    set: 'Evolving Skies',
    rareza: 'Secret Rare',
    imagen: 'https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp',
    precioEstimado: 80.00,
    fuente: 'tcgdex.net'
  };

  Store.registerApiCard(apiCard);
  app.openProductPDP('api-rayquaza-vmax');

  // Select PSA 9 (80 * 2.10 = 168) and set quantity to 1
  PDPView.selectCondition('psa9');
  Store.data.pdpQuantity = 1;

  PDPView.addToCart();

  assert.equal(Store.data.cart.length, 1);
  const item = Store.data.cart[0];
  assert.equal(item.id, 'api-rayquaza-vmax-psa9');
  assert.equal(item.name, 'Rayquaza VMAX');
  assert.equal(item.price, 168);
  assert.equal(item.quantity, 1);
});

test('R4 API Search [Test 3.8]: Action button on cards with apostrophes (Blaine\'s Charizard) avoids syntax errors and navigates to PDP', () => {
  const { SearchResultsView, Store } = createSearchIntegrationEnvironment();

  const blainesCharizard = {
    id: 'gym2-2',
    nombre: "Blaine's Charizard",
    set: 'Gym Challenge',
    rareza: 'Holo Rare',
    imagen: 'https://images.pokemontcg.io/gym2/2.png',
    precioEstimado: 174.53,
    fuente: 'pokemontcg.io'
  };

  const html = SearchResultsView.renderResultsGrid([blainesCharizard], "Blaine's Charizard");

  // Verify HTML contains safe action call without raw string interpolation syntax errors
  assert.ok(html.includes("SearchResultsView.handleCardAction('gym2-2')"), 'Must call handleCardAction with clean cardId');
  assert.ok(!html.includes("SearchResultsView.openQuoteModal('Blaine's"), 'Must never contain unescaped apostrophe in onclick JS string');

  // Execute handleCardAction
  SearchResultsView.handleCardAction('gym2-2');

  // Verify navigation and registration in Store
  assert.equal(Store.data.currentPdpProduct.id, 'gym2-2');
  assert.equal(Store.data.currentPdpProduct.nombre, "Blaine's Charizard");
  assert.equal(Store.data.currentPdpProduct.precios.raw, Math.round(174.53));
  assert.equal(Store.data.pdpSelectedCondition, 'psa10');
});

test('R4 API Search [Test 3.9]: Store.registerApiCard persists to localStorage and rehydrates on Store.init()', () => {
  const { Store, sandbox } = createSearchIntegrationEnvironment();

  const apiCard = {
    id: 'gym2-2',
    nombre: "Blaine's Charizard",
    set: 'Gym Challenge',
    rareza: 'Holo Rare',
    imagen: 'https://images.pokemontcg.io/gym2/2.png',
    precioEstimado: 174.53,
    fuente: 'pokemontcg.io'
  };

  Store.registerApiCard(apiCard);

  // Verify localStorage contains cached card
  const rawCache = sandbox.localStorage.getItem('gstcg_api_cards_cache');
  assert.ok(rawCache, 'gstcg_api_cards_cache must be saved in localStorage');
  const parsed = JSON.parse(rawCache);
  assert.ok(parsed['gym2-2'], 'Cached object must contain gym2-2');

  // Reset in-memory cache and rehydrate via Store.init()
  Store.data.apiCardsCache = {};
  Store.init();

  assert.ok(Store.data.apiCardsCache['gym2-2'], 'Cache must be rehydrated from localStorage');
  assert.equal(Store.getProduct('gym2-2').nombre, "Blaine's Charizard");
});

test('R4 API Search [Test 3.10]: openQuoteModal backward-compatible alias delegates to handleCardAction', () => {
  const { SearchResultsView, Store } = createSearchIntegrationEnvironment();

  const apiCard = {
    id: 'gym2-2',
    nombre: "Blaine's Charizard",
    set: 'Gym Challenge',
    rareza: 'Holo Rare',
    precioEstimado: 174.53
  };

  SearchResultsView.results = [apiCard];

  // Call legacy alias
  SearchResultsView.openQuoteModal("Blaine's Charizard", "Gym Challenge", 174.53, 'gym2-2');

  assert.equal(Store.data.currentPdpProduct.id, 'gym2-2');
  assert.equal(Store.data.currentPdpProduct.nombre, "Blaine's Charizard");
});

