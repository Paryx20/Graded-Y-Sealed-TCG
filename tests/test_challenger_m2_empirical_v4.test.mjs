/**
 * ==============================================================================
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 2 (R1–R6, FOCUSING ON R3, R4, R5, R6)
 * File: tests/test_challenger_m2_empirical_v4.test.mjs
 * 
 * Challenger Mission:
 * Adversarial test harnesses, stress tests, and boundary checks to verify:
 *   1. R3: Authentic PSA Slab redesign (acrylic frame with 4 corner notches
 *          .psa-notch-tl/tr/bl/br, molded logo .psa-molded-logo, white paper label
 *          with characteristic red border, barcode, cert number,
 *          PROFESSIONAL SPORTS AUTHENTICATOR, exact <span>PSA</span> token,
 *          GEM MT 10 grade, and removal of overlay sticker).
 *   2. R4: Multi-criteria category search & vault fallback (searching card names
 *          like "charizard" or "greninja" never blocks results even when category
 *          filter is active; case-insensitivity, whitespace, fuzzing).
 *   3. R5: Modernized category drawer microinteractions (.drawer-cat-btn, 1px borders,
 *          subtle gradients, distinct colored badges across all 6 category links).
 *   4. R6: Supabase architecture and normal market catalog:
 *          - PostgreSQL DDL syntax in js/db/schema.sql (12 tables, composite PK,
 *            foreign keys, indexes, RLS policies).
 *          - Hybrid failover in js/db/db-client.js with simulated offline/unconfigured.
 *          - Mathematical price invariants for all 10 cards: price >= 5.00 && price <= 80.00
 *            across ALL grades (Raw, PSA 8, PSA 9, PSA 10).
 *          - PLAN_DE_TRABAJO.md FASE 8 [X] on header and all 5 checklist items.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to create mock DOM elements
function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
    },
    style: {},
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    removeAttribute(k) { delete this.attributes[k]; },
    innerHTML: '',
    innerText: '',
    value: '',
    children: [],
    appendChild(child) { this.children.push(child); return child; },
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        if (this.id === targetId) return this;
        for (const ch of this.children) {
          if (ch.id === targetId) return ch;
          const found = ch.querySelector ? ch.querySelector(sel) : null;
          if (found) return found;
        }
      }
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {}
  };
}

// Sandbox builder loading core application modules
function createTestRuntime() {
  const elements = new Map();

  const getOrCreate = (id) => {
    if (!elements.has(id)) {
      elements.set(id, createMockElement(id));
    }
    return elements.get(id);
  };

  const documentMock = {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
      return null;
    },
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: createMockElement('body', 'body')
  };

  const storage = new Map();
  const localStorageMock = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear()
  };

  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    URLSearchParams,
    scrollTo: () => {},
    document: documentMock,
    window: null,
    globalThis: null,
    localStorage: localStorageMock,
    location: { hash: '#home' },
    Event: class { constructor(type) { this.type = type; } },
    lucide: { createIcons: () => {} }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const context = vm.createContext(sandbox);

  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode + '\n; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS; globalThis.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10; globalThis.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;', context);

  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  vm.runInContext(stateCode + '\n; globalThis.Store = Store;', context);

  const homeCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/home.js'), 'utf8');
  vm.runInContext(homeCode + '\n; globalThis.HomeView = HomeView;', context);

  const trackingCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/tracking.js'), 'utf8');
  vm.runInContext(trackingCode + '\n; globalThis.TrackingView = TrackingView;', context);

  const checkoutCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/checkout.js'), 'utf8');
  vm.runInContext(checkoutCode + '\n; globalThis.CheckoutView = CheckoutView;', context);

  const catalogCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/catalog.js'), 'utf8');
  vm.runInContext(catalogCode + '\n; globalThis.CatalogView = CatalogView;', context);

  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  vm.runInContext(pdpCode + '\n; globalThis.PDPView = PDPView;', context);

  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');
  vm.runInContext(appCode + '\n; globalThis.app = app;', context);

  return { context, sandbox, elements };
}

// ==============================================================================
// CHALLENGE 1: R3 AUTHENTIC PSA SLAB REDESIGN EMPIRICAL VERIFICATION
// ==============================================================================

test('R3 Challenger [1.1]: PSA slab markup renders all structural components across ALL 10 catalog cards', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView, POKEMON_CARDS_CATALOG_10 } = sandbox;

  assert.equal(POKEMON_CARDS_CATALOG_10.length, 10, 'Must have 10 cards in catalog');

  for (const card of POKEMON_CARDS_CATALOG_10) {
    const slabHtml = PDPView.renderInspectorStage(card, 'psa10', 'slab');

    // 1. Acrylic frame & inner well
    assert.ok(slabHtml.includes('psa-acrylic-slab'), `${card.id}: Must have .psa-acrylic-slab`);
    assert.ok(slabHtml.includes('psa-inner-well'), `${card.id}: Must have .psa-inner-well`);

    // 2. 4 Structural corner notches
    assert.ok(slabHtml.includes('psa-notch-tl'), `${card.id}: Must have top-left notch .psa-notch-tl`);
    assert.ok(slabHtml.includes('psa-notch-tr'), `${card.id}: Must have top-right notch .psa-notch-tr`);
    assert.ok(slabHtml.includes('psa-notch-bl'), `${card.id}: Must have bottom-left notch .psa-notch-bl`);
    assert.ok(slabHtml.includes('psa-notch-br'), `${card.id}: Must have bottom-right notch .psa-notch-br`);

    // 3. Molded acrylic PSA logo
    assert.ok(slabHtml.includes('psa-molded-logo'), `${card.id}: Must have .psa-molded-logo`);
    assert.ok(slabHtml.includes('>PSA<'), `${card.id}: Molded logo must contain PSA text`);

    // 4. White paper label & red border frame
    assert.ok(slabHtml.includes('psa-official-label'), `${card.id}: Must have .psa-official-label`);
    assert.ok(slabHtml.includes('psa-flip-label'), `${card.id}: Must have .psa-flip-label`);

    // 5. Official typography header & exact <span>PSA</span>
    assert.ok(slabHtml.includes('PROFESSIONAL SPORTS AUTHENTICATOR'), `${card.id}: Must have official header`);
    assert.ok(slabHtml.includes('<span>PSA</span>'), `${card.id}: Must have exact <span>PSA</span> without inner attributes`);

    // 6. Barcode, Cert Code, Grade
    assert.ok(slabHtml.includes('psa-barcode'), `${card.id}: Must have .psa-barcode`);
    assert.ok(slabHtml.includes('#' + card.certNumber), `${card.id}: Must display cert number #${card.certNumber}`);
    assert.ok(slabHtml.includes('GRADO'), `${card.id}: Must display GRADO label`);
    assert.ok(slabHtml.includes('GEM MT 10'), `${card.id}: Must display GEM MT 10 grade label for psa10`);

    // 7. Strictly eliminate artificial overlays & centering grids
    assert.ok(!slabHtml.includes('centering-grid-overlay'), `${card.id}: Centering grid overlay must be absent`);
    assert.ok(!slabHtml.includes('PSA HOLOGRAM SEAL'), `${card.id}: Overlay sticker plastered on art must be removed`);
    assert.ok(!slabHtml.includes('50.0%'), `${card.id}: No coordinate percentage text on slab`);
  }
});

test('R3 Challenger [1.2]: Boundary test - card with missing metadata renders safely without undefined or broken text interpolation', () => {
  const { sandbox } = createTestRuntime();
  const { PDPView } = sandbox;

  const sparseCard = {
    id: 'sparse-test-card',
    nombre: 'Charizard Test',
    // set, rareza, numeroCarta omitted
    categoria: 'psa',
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    certNumber: '99998888',
    precios: { raw: 10, psa8: 15, psa9: 20, psa10: 40 }
  };

  const slabHtml = PDPView.renderInspectorStage(sparseCard, 'psa10', 'slab');
  assert.ok(!slabHtml.includes('undefined'), 'Slab HTML must not render undefined');
  assert.ok(!slabHtml.includes('>null<'), 'Slab HTML must not render >null< in text nodes');
  assert.ok(!slabHtml.includes('NaN'), 'Slab HTML must not render NaN');
  assert.ok(slabHtml.includes('psa-acrylic-slab'));
  assert.ok(slabHtml.includes('#99998888'));
  assert.ok(slabHtml.includes('GEM MT 10'));
});

test('R3 Challenger [1.3]: CSS inspection verifies authentic physical PSA slab styling', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');

  // Verify acrylic frame styling
  assert.ok(css.includes('.psa-acrylic-slab'), 'CSS must define .psa-acrylic-slab');
  assert.ok(css.includes('backdrop-filter: blur(10px)'), 'Acrylic must use backdrop blur');
  assert.ok(css.includes('border: 3px solid rgba(255, 255, 255, 0.7)'), 'Acrylic must have beveled border');

  // Verify white paper label with red frame
  assert.ok(css.includes('.psa-flip-label'), 'CSS must define .psa-flip-label');
  assert.ok(css.includes('border: 2.5px solid #D8232A'), 'Label must have authentic PSA red border');
  assert.ok(css.includes('background: #FFFFFF'), 'Label must have white paper background');

  // Verify 4 corner notches
  assert.ok(css.includes('.psa-notch'), 'CSS must define .psa-notch');
  assert.ok(css.includes('.psa-notch-tl'), 'CSS must define .psa-notch-tl');
  assert.ok(css.includes('.psa-notch-tr'), 'CSS must define .psa-notch-tr');
  assert.ok(css.includes('.psa-notch-bl'), 'CSS must define .psa-notch-bl');
  assert.ok(css.includes('.psa-notch-br'), 'CSS must define .psa-notch-br');

  // Verify molded logo styling
  assert.ok(css.includes('.psa-molded-logo'), 'CSS must define .psa-molded-logo');
  assert.ok(css.includes('text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.8)'), 'Molded logo must have 3D embossed text-shadow');

  // Verify barcode styling
  assert.ok(css.includes('.psa-barcode'), 'CSS must define .psa-barcode');
  assert.ok(css.includes('repeating-linear-gradient'), 'Barcode must use repeating linear gradient');
});

// ==============================================================================
// CHALLENGE 2: R4 MULTI-CRITERIA CATEGORY SEARCH & VAULT FALLBACK FUZZING
// ==============================================================================

test('R4 Challenger [2.1]: matchesCategory handles single cards and sealed products with semantic compatibility', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const pikachu = Store.getProduct('pikachu-crown-zenith');
  const eevee = Store.getProduct('eevee-twilight');
  const boosterBox = Store.getProduct('booster-team-rocket');

  // Valid cards
  assert.equal(CatalogView.matchesCategory(pikachu, 'all'), true);
  assert.equal(CatalogView.matchesCategory(pikachu, 'psa'), true);
  assert.equal(CatalogView.matchesCategory(pikachu, 'raw'), true); // Has precios.raw
  assert.equal(CatalogView.matchesCategory(pikachu, 'sealed'), false);

  assert.equal(CatalogView.matchesCategory(eevee, 'all'), true);
  assert.equal(CatalogView.matchesCategory(eevee, 'raw'), true);
  assert.equal(CatalogView.matchesCategory(eevee, 'psa'), true); // Has precios.psa10
  assert.equal(CatalogView.matchesCategory(eevee, 'sealed'), false);

  assert.equal(CatalogView.matchesCategory(boosterBox, 'all'), true);
  assert.equal(CatalogView.matchesCategory(boosterBox, 'sealed'), true);
  assert.equal(CatalogView.matchesCategory(boosterBox, 'raw'), false); // Raw cleanly excludes sealed

  // Boundary inputs: null, undefined, empty object
  assert.equal(CatalogView.matchesCategory(null, 'all'), false);
  assert.equal(CatalogView.matchesCategory(undefined, 'psa'), false);
  assert.equal(CatalogView.matchesCategory({}, 'raw'), false);
});

test('R4 Challenger [2.1b]: Empirical Forensic Audit: Category bleed on boosterBox under PSA filter', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const boosterBox = Store.getProduct('booster-team-rocket');
  // Las cajas selladas tienen precios psa heredados, pero no deben aparecer en Slabs PSA
  const matchesPsa = CatalogView.matchesCategory(boosterBox, 'psa');
  assert.equal(matchesPsa, false, 'booster-team-rocket must not leak into the PSA category');
});

test('R4 Challenger [2.2]: Fuzzing queries across categories - vault fallback activates without blocking card names', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const cardQueries = ['greninja', 'pikachu', 'eevee', 'gengar', 'mimikyu', 'mewtwo', 'lucario', 'raichu', 'blastoise'];

  // Under 'sealed' category where NONE of these individual cards are tagged sealed,
  // searching for each card name MUST activate vault fallback and return results.
  for (const query of cardQueries) {
    Store.data.catalogFilters.category = 'sealed';
    Store.data.catalogFilters.searchQuery = query;

    const results = CatalogView.getFilteredProducts();
    assert.ok(results.length > 0, `Query "${query}" in category "sealed" must NOT be blocked (got 0 results)`);
    assert.equal(CatalogView.isVaultFallback, true, `Vault fallback must be active for query "${query}"`);
    assert.ok(
      results.some(c => c.nombre.toLowerCase().includes(query) || (c.set && c.set.toLowerCase().includes(query))),
      `Result for "${query}" must match card name or set`
    );
  }
});

test('R4 Challenger [2.3]: Hostile input fuzzing: whitespace, case-insensitivity, exotic casing, partial substrings', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const hostileCases = [
    { input: '   charizard   ', expectedSubstr: 'charizard' },
    { input: '\t\t  greninja \n  ', expectedSubstr: 'greninja' },
    { input: '   PIKACHU\r\n', expectedSubstr: 'pikachu' },
    { input: 'GrEnInJa', expectedSubstr: 'greninja' },
    { input: 'EEVEE', expectedSubstr: 'eevee' },
    { input: 'mEwTwO', expectedSubstr: 'mewtwo' },
    { input: 'pika', expectedSubstr: 'pikachu' },
    { input: 'geng', expectedSubstr: 'gengar' },
    { input: 'blast', expectedSubstr: 'blastoise' },
    { input: 'paldean', expectedSubstr: 'paldean' },
    { input: 'twilight', expectedSubstr: 'twilight' },
    { input: 'zenith', expectedSubstr: 'zenith' },
    { input: '151', expectedSubstr: '151' }
  ];

  for (const tc of hostileCases) {
    Store.data.catalogFilters.category = 'all';
    Store.data.catalogFilters.searchQuery = tc.input;

    const results = CatalogView.getFilteredProducts();
    assert.ok(results.length > 0, `Hostile input "${JSON.stringify(tc.input)}" should match at least 1 card`);
    assert.ok(
      results.some(c => 
        c.nombre.toLowerCase().includes(tc.expectedSubstr) || 
        (c.set && c.set.toLowerCase().includes(tc.expectedSubstr))
      ),
      `Input "${tc.input}" did not match expected substring "${tc.expectedSubstr}"`
    );
  }
});

test('R4 Challenger [2.4]: Nonexistent query returns 0 items safely with isVaultFallback = false and no exceptions', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  const bogusQueries = [
    'nonexistent_pokemon_99999',
    'xyz_impossible_card_alpha_beta',
    '@@@@####$$$$%%%%^^^^&&&&'
  ];

  for (const q of bogusQueries) {
    Store.data.catalogFilters.category = 'all';
    Store.data.catalogFilters.searchQuery = q;

    const results = CatalogView.getFilteredProducts();
    assert.equal(results.length, 0, `Bogus query "${q}" must return 0 items`);
    assert.equal(CatalogView.isVaultFallback, false, `isVaultFallback must be false when no card matches`);
  }
});

test('R4 Challenger [2.5]: Multi-criteria price range filter combined with text search', () => {
  const { sandbox } = createTestRuntime();
  const { CatalogView, Store } = sandbox;

  // Search "charizard" with minPrice $8 and maxPrice $12 (Charizard ex raw is $10)
  Store.data.catalogFilters.category = 'all';
  Store.data.catalogFilters.condition = 'raw';
  Store.data.catalogFilters.searchQuery = 'charizard';
  Store.data.catalogFilters.minPrice = '8';
  Store.data.catalogFilters.maxPrice = '12';

  const results = CatalogView.getFilteredProducts();
  assert.ok(results.length > 0, 'Should find Charizard within $8-$12 raw range');
  results.forEach(c => {
    assert.ok(c.precios.raw >= 8 && c.precios.raw <= 12, `Price $${c.precios.raw} must be within $8-$12`);
  });

  // Now set price range too high for Charizard raw ($50 - $100)
  Store.data.catalogFilters.minPrice = '50';
  Store.data.catalogFilters.maxPrice = '100';
  const emptyResults = CatalogView.getFilteredProducts();
  assert.equal(emptyResults.length, 0, 'Charizard raw ($10) must not match $50-$100 range');
});

test('R4 Challenger [2.6]: Router hash navigation synchronizes search query and category filters without locking', () => {
  const { sandbox } = createTestRuntime();
  const { app, Store } = sandbox;

  // 1. Route #catalog?q=greninja sets searchQuery and normalizes category
  sandbox.location.hash = '#catalog?q=greninja';
  app.handleRoute();
  assert.equal(Store.data.catalogFilters.searchQuery, 'greninja');
  assert.equal(Store.data.catalogFilters.category, 'all');

  // 2. Route #catalog?cat=psa&q=charizard updates category and query simultaneously
  sandbox.location.hash = '#catalog?cat=psa&q=charizard';
  app.handleRoute();
  assert.equal(Store.data.catalogFilters.category, 'psa');
  assert.equal(Store.data.catalogFilters.searchQuery, 'charizard');

  // 3. Category switch preserves active search query for multi-criteria search
  sandbox.location.hash = '#catalog?cat=raw';
  app.handleRoute();
  assert.equal(Store.data.catalogFilters.category, 'raw');
  assert.equal(Store.data.catalogFilters.searchQuery, 'charizard');

  // 4. Explicit empty query clears search query
  sandbox.location.hash = '#catalog?q=';
  app.handleRoute();
  assert.equal(Store.data.catalogFilters.searchQuery, '');
});

// ==============================================================================
// CHALLENGE 3: R5 MODERNIZED CATEGORY DRAWER MICROINTERACTIONS EMPIRICAL VERIFICATION
// ==============================================================================

test('R5 Challenger [3.1]: Drawer markup in index.html contains exactly 6 category buttons with badges and microinteractions', () => {
  const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

  // Verify drawer dialog container
  assert.ok(html.includes('id="categories-drawer"'), 'Must have #categories-drawer');
  assert.ok(html.includes('Categorías de Bóveda'), 'Must have drawer title');

  // Extract all drawer buttons
  const btnMatches = html.match(/class="[^"]*drawer-cat-btn[^"]*"/g) || [];
  assert.equal(btnMatches.length, 6, `Drawer must have exactly 6 .drawer-cat-btn elements (found ${btnMatches.length})`);

  // Verify all 6 specific navigation links exist
  const expectedLinks = [
    { href: '#catalog', text: '1. Ver Todo el Catálogo', badge: 'Todos', badgeColor: 'bg-white/10' },
    { href: '#catalog?cat=psa', text: '2. Slabs Certificados PSA', badge: 'Grado 8-10', badgeColor: 'bg-amber-500/15' },
    { href: '#catalog?cat=raw', text: '3. Cartas Sueltas / Raw', badge: 'Near Mint', badgeColor: 'bg-emerald-500/15' },
    { href: '#catalog?cat=sealed', text: '4. Cajas y Sobres Sellados Vintage', badge: '1999 WotC', badgeColor: 'bg-rose-500/15' },
    { href: '#catalog?era=vintage', text: '5. Era Clásica WotC 1999-2002', badge: 'Base/Neo', badgeColor: 'bg-orange-500/15' },
    { href: '#catalog?era=modern', text: '6. Era Moderna &amp; Alt Arts', badge: 'Secret Rare', badgeColor: 'bg-sky-500/15' }
  ];

  for (const item of expectedLinks) {
    assert.ok(html.includes(`href="${item.href}"`), `Drawer must include link to ${item.href}`);
    assert.ok(html.includes(item.text), `Drawer must contain category title: ${item.text}`);
    assert.ok(html.includes(item.badge), `Drawer must contain category badge: ${item.badge}`);
    assert.ok(html.includes(item.badgeColor), `Drawer badge for ${item.badge} must have color style ${item.badgeColor}`);
  }

  // Verify each button has 1px border, gradient, and hover microinteraction classes
  for (const btnClass of btnMatches) {
    assert.ok(btnClass.includes('border'), 'Each button must have 1px border class');
    assert.ok(btnClass.includes('bg-gradient-to-r'), 'Each button must have subtle gradient class');
    assert.ok(btnClass.includes('hover:translate-x-1'), 'Each button must have hover:translate-x-1');
  }
});

test('R5 Challenger [3.2]: CSS rules in css/styles.css define .drawer-cat-btn microinteractions', () => {
  const css = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');

  assert.ok(css.includes('.drawer-cat-btn'), 'CSS must declare .drawer-cat-btn');
  assert.ok(css.includes('transform 0.2s cubic-bezier'), 'Must declare smooth cubic-bezier transition');
  assert.ok(css.includes('.drawer-cat-btn:hover'), 'CSS must declare .drawer-cat-btn:hover');
  assert.ok(css.includes('transform: translateX(4px)'), 'Hover must translate right 4px');
  assert.ok(css.includes('rgba(217, 119, 6, 0.15)'), 'Hover must add subtle amber glow shadow');
});

// ==============================================================================
// CHALLENGE 4: R6 SUPABASE ARCHITECTURE & NORMAL MARKET CATALOG EMPIRICAL VERIFICATION
// ==============================================================================

test('R6 Challenger [4.1]: PostgreSQL DDL in js/db/schema.sql defines all 12 entities, composite PK, FKs, indexes, and RLS', () => {
  const sql = fs.readFileSync(path.join(ROOT_DIR, 'js/db/schema.sql'), 'utf8');

  // 1. Verify all 12 entities
  const tables = [
    'usuarios',
    'direcciones_envio',
    'categorias_producto',
    'sets_expansiones',
    'productos',
    'detalles_cartas',
    'detalles_sellados',
    'certificaciones_psa',
    'historial_precios',
    'metodos_pago_tokenizados',
    'ordenes_compra',
    'items_orden'
  ];

  tables.forEach(t => {
    assert.ok(sql.includes(`CREATE TABLE IF NOT EXISTS ${t}`), `Table ${t} missing from schema.sql`);
  });

  // 2. Composite Primary Key on items_orden
  assert.ok(
    sql.includes('PRIMARY KEY (numero_orden, sku, grado)'),
    'items_orden must have composite primary key (numero_orden, sku, grado)'
  );

  // 3. Foreign key constraints
  assert.ok(sql.includes('REFERENCES usuarios(cedula_ruc)'), 'Must reference usuarios(cedula_ruc)');
  assert.ok(sql.includes('REFERENCES categorias_producto(slug_categoria)'), 'Must reference categorias_producto');
  assert.ok(sql.includes('REFERENCES sets_expansiones(codigo_set)'), 'Must reference sets_expansiones');
  assert.ok(sql.includes('REFERENCES productos(sku)'), 'Must reference productos(sku)');
  assert.ok(sql.includes('REFERENCES ordenes_compra(numero_orden)'), 'Must reference ordenes_compra(numero_orden)');

  // 4. B-Tree Indexes
  const expectedIndexes = [
    'idx_direcciones_usuario',
    'idx_productos_categoria',
    'idx_productos_set',
    'idx_productos_tipo',
    'idx_certificaciones_sku',
    'idx_certificaciones_grado',
    'idx_historial_sku_grado',
    'idx_ordenes_usuario',
    'idx_ordenes_fecha',
    'idx_items_orden_sku'
  ];

  expectedIndexes.forEach(idx => {
    assert.ok(sql.includes(idx), `Index ${idx} must be defined in schema.sql`);
  });

  // 5. Row Level Security on ALL 12 tables
  tables.forEach(t => {
    assert.ok(sql.includes(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`), `RLS must be enabled on table ${t}`);
  });

  // 6. RLS Policies
  assert.ok(sql.includes('CREATE POLICY "Public Read Categorias"'), 'Public read policy for categorias');
  assert.ok(sql.includes('CREATE POLICY "Public Read Productos"'), 'Public read policy for productos');
  assert.ok(sql.includes('CREATE POLICY "Public Read Certificaciones PSA"'), 'Public read policy for certificaciones');
  assert.ok(sql.includes('CREATE POLICY "Public Read Ordenes"'), 'Public read policy for ordenes');
  assert.ok(sql.includes('CREATE POLICY "Public Insert Ordenes"'), 'Public insert policy for ordenes');
  assert.ok(sql.includes('CREATE POLICY "Public Read Items Orden"'), 'Public read policy for items orden');
  assert.ok(sql.includes('CREATE POLICY "Public Insert Items Orden"'), 'Public insert policy for items orden');

  // 7. Balanced parentheses & basic syntax check
  let openParen = 0;
  for (const char of sql) {
    if (char === '(') openParen++;
    if (char === ')') openParen--;
  }
  assert.equal(openParen, 0, 'Parentheses in schema.sql must be perfectly balanced');
});

test('R6 Challenger [4.2]: Hybrid failover in js/db/db-client.js handles unconfigured, offline, and error conditions gracefully', async () => {
  const dbUrl = pathToFileURL(path.resolve(ROOT_DIR, 'js/db/db-client.js')).href;
  const dbClientModule = await import(dbUrl);
  const { GradedSealedDB, procesarOrdenTransaccional } = dbClientModule.default || dbClientModule;

  assert.ok(GradedSealedDB, 'GradedSealedDB instance must be exported');
  assert.ok(typeof procesarOrdenTransaccional === 'function', 'procesarOrdenTransaccional must be exported');

  // Test Case 4.2.1: In default test environment without SUPABASE_URL configured,
  // database must be active on fallback (dexie or localstorage) without crashing.
  assert.ok(
    GradedSealedDB.activeBackend === 'localstorage' || GradedSealedDB.activeBackend === 'dexie',
    `Active backend in unconfigured environment must be localstorage or dexie (got: ${GradedSealedDB.activeBackend})`
  );

  // Test Case 4.2.2: Execute transactional order in offline/unconfigured environment
  const testOrderPayload = {
    usuario: {
      cedula_ruc: '1710034065',
      nombre: 'Empirical Challenger User',
      email: 'challenger.empirical@vault.ec',
      telefono: '+593 99 123 4567',
      ciudad: 'Quito',
      direccion_principal: 'Av. Amazonas N21-100'
    },
    orden: {
      numero_orden: 'GS-TEST-EMPIRICAL-001',
      subtotal: 48.00,
      impuesto_iva: 7.20,
      tarifa_envio: 5.00,
      total: 60.20,
      metodo_pago: 'Tarjeta de Crédito / Débito',
      metodo_entrega: 'courier'
    },
    items: [
      {
        sku: 'PKM-CZ-PIKA-160',
        grado: 'PSA 10',
        cantidad: 1,
        precio_unitario: 48.00,
        subtotal: 48.00
      }
    ]
  };

  const result = await procesarOrdenTransaccional(testOrderPayload);
  assert.equal(result.success, true, 'Transaction must succeed on local fallback');
  assert.equal(result.orderId, 'GS-TEST-EMPIRICAL-001');

  // Test Case 4.2.3: Configured Supabase with simulated network error
  // Inject mock failing supabase client
  const originalSupabase = GradedSealedDB.supabaseClient;
  GradedSealedDB.supabaseClient = {
    from: () => ({
      upsert: async () => {
        throw new Error('Simulated network timeout: Supabase cloud unreachable (504 Gateway Timeout)');
      }
    })
  };

  const failoverPayload = {
    usuario: { cedula_ruc: '1710034065', nombre: 'Failover Tester' },
    orden: { numero_orden: 'GS-TEST-FAILOVER-002', subtotal: 10, impuesto_iva: 1.5, tarifa_envio: 3, total: 14.5, metodo_pago: 'Tarjeta' },
    items: [{ sku: 'PKM-PF-CHAR-054', grado: 'RAW', cantidad: 1, precio_unitario: 10, subtotal: 10 }]
  };

  // Must NOT throw when Supabase network fails — local transaction must complete cleanly
  const failoverResult = await procesarOrdenTransaccional(failoverPayload);
  assert.equal(failoverResult.success, true, 'Transaction must complete successfully even when Supabase throws network error');

  // Restore client
  GradedSealedDB.supabaseClient = originalSupabase;
});

test('R6 Challenger [4.3]: Mathematical verification of price invariants for all 10 Pokémon cards ($5.00 to $80.00 USD)', () => {
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(dataCode + '\n; globalThis.cards = POKEMON_CARDS_CATALOG_10;', context);
  const cards = context.cards;

  assert.equal(cards.length, 10, 'Catalog must contain exactly 10 cards');

  const requiredGrades = ['raw', 'psa8', 'psa9', 'psa10'];

  for (const card of cards) {
    assert.ok(card.id, 'Card must have id');
    assert.ok(card.nombre, 'Card must have nombre');
    assert.ok(card.precios, `Card ${card.id} must define precios object`);

    for (const grade of requiredGrades) {
      const price = card.precios[grade];

      // Type checks
      assert.equal(typeof price, 'number', `${card.id} [${grade}] price must be a number`);
      assert.ok(Number.isFinite(price), `${card.id} [${grade}] price must be finite`);
      assert.ok(!Number.isNaN(price), `${card.id} [${grade}] price must not be NaN`);

      // Mathematical boundary check: price strictly between $5.00 and $80.00 USD
      assert.ok(
        price >= 5.00 && price <= 80.00,
        `PRICE INVARIANT VIOLATION: Card ${card.id} grade ${grade} price ($${price}) outside normal market bounds [$5.00, $80.00]`
      );
    }

    // Monotonic grading hierarchy check: raw <= psa8 <= psa9 <= psa10
    assert.ok(
      card.precios.raw <= card.precios.psa8,
      `Monotonic violation for ${card.id}: raw ($${card.precios.raw}) > psa8 ($${card.precios.psa8})`
    );
    assert.ok(
      card.precios.psa8 <= card.precios.psa9,
      `Monotonic violation for ${card.id}: psa8 ($${card.precios.psa8}) > psa9 ($${card.precios.psa9})`
    );
    assert.ok(
      card.precios.psa9 <= card.precios.psa10,
      `Monotonic violation for ${card.id}: psa9 ($${card.precios.psa9}) > psa10 ($${card.precios.psa10})`
    );
  }
});

test('R6 Challenger [4.4]: DB client seed data contains 10 Pokémon cards and 40 certifications strictly within $5.00 to $80.00', () => {
  const dbClientCode = fs.readFileSync(path.join(ROOT_DIR, 'js/db/db-client.js'), 'utf8');

  // Verify the 10 real-market SKUs exist in db-client.js
  const expectedSkus = [
    'PKM-CZ-PIKA-160',
    'PKM-PF-CHAR-054',
    'PKM-TM-EEV-188',
    'PKM-SV-GEN-057',
    'PKM-TM-GREN-106',
    'PKM-PF-MIM-097',
    'PKM-151-MEW-059',
    'PKM-CZ-LUC-291',
    'PKM-LL-RAI-029',
    'PKM-151-BLAS-009'
  ];

  for (const sku of expectedSkus) {
    assert.ok(dbClientCode.includes(sku), `db-client.js must include SKU ${sku}`);
  }

  // Regex extract all 40 certification records for these 10 SKUs
  const certRegex = /numero_certificacion:\s*'([^']+)',\s*producto_sku:\s*'([^']+)',\s*grado:\s*'([^']+)',.*?precio:\s*([0-9.]+)/g;
  let match;
  let normalCertCount = 0;

  while ((match = certRegex.exec(dbClientCode)) !== null) {
    const certNum = match[1];
    const sku = match[2];
    const grade = match[3];
    const price = parseFloat(match[4]);

    if (expectedSkus.includes(sku)) {
      normalCertCount++;
      assert.ok(
        price >= 5.00 && price <= 80.00,
        `Certification ${certNum} for ${sku} (${grade}) price $${price} is outside bounds [$5.00, $80.00]`
      );
    }
  }

  assert.equal(normalCertCount, 40, `Must verify exactly 40 certification records for the 10 Pokémon cards (found ${normalCertCount})`);
});

test('R6 Challenger [4.5]: PLAN_DE_TRABAJO.md marks FASE 8 with [X] on the header and all 5 checklist items', () => {
  const plan = fs.readFileSync(path.join(ROOT_DIR, 'PLAN_DE_TRABAJO.md'), 'utf8');

  // Verify header line
  assert.ok(
    plan.includes('### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real'),
    'PLAN_DE_TRABAJO.md line 94 header must be marked with [X]'
  );
  assert.ok(
    !plan.includes('### [ ] FASE 8'),
    'FASE 8 must not be unmarked'
  );

  // Verify all 5 checklist items
  const expectedChecklistItems = [
    '- [X] Extraer el modelo de datos a un archivo `js/db/schema.sql` compatible con PostgreSQL.',
    '- [X] Importar el cliente de Supabase por CDN en `index.html`.',
    '- [X] Crear `js/db/supabase-config.js` para inicializar el cliente con la URL y anon_key.',
    '- [X] Refactorizar `js/db/db-client.js` para que las consultas y mutaciones (lectura de catálogo, inserción de usuarios y órdenes) apunten a Supabase en lugar de IndexedDB.',
    '- [X] Configurar Políticas de Seguridad de Filas (RLS) en Supabase para permitir lecturas públicas del catálogo e inserciones seguras de órdenes.'
  ];

  for (const item of expectedChecklistItems) {
    assert.ok(plan.includes(item), `PLAN_DE_TRABAJO.md must contain checked item: ${item}`);
  }
});
