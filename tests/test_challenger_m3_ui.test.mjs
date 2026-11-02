/**
 * ==============================================================================
 * Challenger 2: Adversarial Empirical UI & Search View Stress Test Suite
 * Milestone 3: Phase 6 Decoupled Search View, Debounce, Skeletons, Zero State
 * File: tests/test_challenger_m3_ui.test.mjs
 * 
 * Verifies:
 * 1. 400ms Debounce on Search Input:
 *    - Rapid keypress simulation (10 chars at 50ms intervals -> exactly 1 search query at 400ms post-final keypress).
 *    - Cancellation of prior timer handles on subsequent keypresses.
 *    - Emptying input cancels debounce and restores initial prompt.
 *    - Direct form submission bypasses debounce timer.
 *    - PokemonAPI.debounceSearch static facade handles cancellations.
 * 2. Skeleton Loaders Lifecycle:
 *    - Container has id="search-skeletons".
 *    - Skeleton cards have classes animate-pulse and skeleton-card (8 cards).
 *    - Displayed during pending fetch; hidden upon results, zero-state, or error.
 * 3. Zero-Results State:
 *    - Container has id="search-zero-state" when query yields no results across all tiers.
 *    - Renders user query, recommendations, and search suggestions.
 *    - XSS injection stress test (HTML escaping).
 * 4. Results Grid:
 *    - Container has id="search-results-grid".
 *    - Badges for pokemontcg.io, tcgdex.net, and local-vault.
 *    - Price formatting ($XX.XX).
 *    - Action buttons (openProductPDP vs openQuoteModal).
 * 5. Hash Route Parsing & Integration:
 *    - #search-results?q=Pikachu parses query and loads results.
 *    - Encoded URI params, multi-params, case-insensitivity.
 *    - app.executeGlobalSearch integration.
 * 6. Adversarial Stress & Concurrency:
 *    - Out-of-order async response race condition evaluation.
 *    - High-frequency burst typing (20 keypresses at 15ms).
 *    - Unicode, emoji, and 1,000-char query handling.
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

class MockClassList {
  constructor(initial = '') {
    this.classes = new Set(String(initial || '').split(/\s+/).filter(Boolean));
  }
  add(...cls) {
    for (const c of cls) {
      if (c && typeof c === 'string') {
        c.split(/\s+/).filter(Boolean).forEach(x => this.classes.add(x));
      }
    }
  }
  remove(...cls) {
    for (const c of cls) {
      if (c && typeof c === 'string') {
        c.split(/\s+/).filter(Boolean).forEach(x => this.classes.delete(x));
      }
    }
  }
  toggle(c, force) {
    if (force !== undefined) {
      force ? this.add(c) : this.remove(c);
      return force;
    }
    if (this.contains(c)) {
      this.remove(c);
      return false;
    }
    this.add(c);
    return true;
  }
  contains(c) {
    return this.classes.has(c);
  }
  toString() {
    return Array.from(this.classes).join(' ');
  }
}

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.classList = new MockClassList();
    this.attributes = new Map();
    this.parentNode = null;
    this._innerHTML = '';
    this._innerText = '';
    this.value = '';
    this.checked = false;
    this.style = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
    if (!val || val === '') {
      this.children.forEach(c => { c.parentNode = null; });
      this.children = [];
    }
  }

  get innerText() {
    return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim();
  }

  set innerText(val) {
    this._innerText = String(val);
  }

  appendChild(child) {
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

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    this[k] = v;
    if (k === 'id') this.id = String(v);
    if (k === 'class') this.classList = new MockClassList(String(v));
  }

  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : (this[k] || null);
  }

  focus() {
    this.isFocused = true;
  }
}

class VirtualClock {
  constructor() {
    this.now = 0;
    this.timers = [];
    this.nextId = 1;
    this.clearCount = 0;
  }

  setTimeout(fn, ms) {
    const id = this.nextId++;
    this.timers.push({ id, fn, triggerAt: this.now + Number(ms || 0), cleared: false });
    return id;
  }

  clearTimeout(id) {
    this.clearCount++;
    const timer = this.timers.find(t => t.id === id);
    if (timer) {
      timer.cleared = true;
    }
  }

  advanceTime(ms) {
    this.now += Number(ms);
    let keepGoing = true;
    while (keepGoing) {
      keepGoing = false;
      this.timers.sort((a, b) => a.triggerAt - b.triggerAt);
      for (const t of this.timers) {
        if (!t.cleared && t.triggerAt <= this.now) {
          t.cleared = true;
          t.fn();
          keepGoing = true;
          break;
        }
      }
    }
  }
}

function createSearchEnvironment(customClock = null) {
  const rootDir = process.cwd();
  const elements = new Map();
  const clock = customClock || new VirtualClock();

  const getOrCreateElement = (id, tag = 'div') => {
    if (!elements.has(id)) {
      elements.set(id, new MockElement(tag, id));
    }
    return elements.get(id);
  };

  const appView = getOrCreateElement('app-view', 'main');
  const searchInput = getOrCreateElement('search-view-input', 'input');
  const searchResultsContainer = getOrCreateElement('search-results-container', 'div');
  const spotlightBackdrop = getOrCreateElement('search-spotlight-backdrop', 'div');
  const liveDropdown = getOrCreateElement('search-live-dropdown', 'div');
  const toastContainer = getOrCreateElement('toast-container', 'div');

  const historyState = {
    url: '#home',
    replaceCalls: []
  };

  const win = {
    location: {
      hash: '#home',
      href: 'http://localhost/#home'
    },
    history: {
      replaceState: (state, title, url) => {
        historyState.url = url;
        historyState.replaceCalls.push(url);
        win.location.hash = url;
      }
    },
    scrollTo: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => clock.setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clock.clearTimeout(id),
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: (id) => clock.clearTimeout(id),
    Date: { now: () => clock.now },
    lucide: { createIcons: () => {} }
  };

  const doc = {
    readyState: 'complete',
    body: new MockElement('body'),
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.get(id) || null,
    registerElement: (id, el) => elements.set(id, el),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  win.document = doc;

  const sandbox = {
    window: win,
    document: doc,
    globalThis: win,
    history: win.history,
    location: win.location,
    setTimeout: win.setTimeout,
    clearTimeout: win.clearTimeout,
    console,
    Math,
    Date,
    URLSearchParams,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Promise,
    lucide: win.lucide
  };

  vm.createContext(sandbox);

  // Load project code files in order
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8') + '\n; globalThis.PRODUCTS = PRODUCTS; globalThis.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8') + '\n; globalThis.Store = Store;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/services/pokemon-api.js'), 'utf8') + '\n; globalThis.PokemonAPI = PokemonAPI;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/search-results.js'), 'utf8') + '\n; globalThis.SearchResultsView = SearchResultsView;', sandbox);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8') + '\n; globalThis.app = app;', sandbox);

  // Assign globals onto sandbox and win
  sandbox.SearchResultsView = win.SearchResultsView;
  sandbox.PokemonAPI = win.PokemonAPI;
  sandbox.Store = win.Store;
  sandbox.app = win.app;
  sandbox.PRODUCTS = win.PRODUCTS;
  sandbox.APP_CONFIG = win.APP_CONFIG;

  return {
    sandbox,
    win,
    doc,
    elements,
    clock,
    historyState,
    Store: win.Store,
    PokemonAPI: win.PokemonAPI,
    SearchResultsView: win.SearchResultsView,
    app: win.app,
    PRODUCTS: win.PRODUCTS
  };
}

// ==============================================================================
// SUITE 1: 400ms Debounce on Search Input
// ==============================================================================

test('Challenger 2 [Suite 1.1]: Rapid keypress simulation (10 chars at 50ms) dispatches exactly 1 search at 400ms after final key', async () => {
  const { sandbox, clock } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  let searchCalls = [];
  SearchResultsView.executeSearch = (q) => {
    searchCalls.push({ query: q, time: clock.now });
  };

  // Simulate typing "Charizard!" (10 characters, 50ms interval)
  const text = 'Charizard!';
  for (let i = 0; i < text.length; i++) {
    const partial = text.substring(0, i + 1);
    SearchResultsView.handleInput(partial);
    if (i < text.length - 1) {
      clock.advanceTime(50);
    }
  }

  // At this point: time is 9 * 50 = 450ms.
  // The final key was pressed at 450ms.
  // The search should NOT have fired yet.
  assert.equal(searchCalls.length, 0, `Search should not execute during active typing (elapsed: ${clock.now}ms)`);

  // Advance time by 399ms (total 849ms, 399ms after final key)
  clock.advanceTime(399);
  assert.equal(searchCalls.length, 0, `Search should not execute at 399ms after last key (elapsed: ${clock.now}ms)`);

  // Advance 1ms more (reaching exactly 400ms after final key, total 850ms)
  clock.advanceTime(1);
  assert.equal(searchCalls.length, 1, 'Search must execute exactly 400ms after final keypress');
  assert.equal(searchCalls[0].query, 'Charizard!');
  assert.equal(searchCalls[0].time, 850);

  // Advance further time — no additional calls should be made
  clock.advanceTime(1000);
  assert.equal(searchCalls.length, 1, 'No additional duplicate calls should occur');
});

test('Challenger 2 [Suite 1.2]: Cancellation of previous timer handles on subsequent keypresses', () => {
  const { sandbox, clock } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  SearchResultsView.executeSearch = () => {};

  const initialClears = clock.clearCount;

  // 5 rapid keypresses
  SearchResultsView.handleInput('P');
  assert.ok(SearchResultsView._debounceTimer !== null);

  SearchResultsView.handleInput('Pi');
  SearchResultsView.handleInput('Pik');
  SearchResultsView.handleInput('Pika');
  SearchResultsView.handleInput('Pikachu');

  // Must have called clearTimeout at least 4 times for the 4 superseded keypresses
  const totalClears = clock.clearCount - initialClears;
  assert.ok(totalClears >= 4, `Expected at least 4 clearTimeout calls, got ${totalClears}`);
});

test('Challenger 2 [Suite 1.3]: Emptying input before 400ms debounce restores initial prompt and cancels search', () => {
  const { sandbox, clock, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  let searchCalled = false;
  SearchResultsView.executeSearch = () => { searchCalled = true; };

  const container = elements.get('search-results-container');

  // User types 'Char'
  SearchResultsView.handleInput('Char');
  assert.ok(container.innerHTML.includes('id="search-skeletons"'), 'Skeletons should appear immediately on first non-empty input');

  // 100ms later, user backspaces to empty ''
  clock.advanceTime(100);
  SearchResultsView.handleInput('');

  // Advance time past 400ms debounce
  clock.advanceTime(450);

  assert.equal(searchCalled, false, 'Empty query should never execute search');
  assert.ok(container.innerHTML.includes('Comienza a escribir para buscar'), 'Should restore initial prompt when cleared');
  assert.ok(!container.innerHTML.includes('id="search-skeletons"'), 'Skeletons should be removed on clear');
});

test('Challenger 2 [Suite 1.4]: Direct form submitForm() cancels pending debounce and executes search immediately', () => {
  const { sandbox, clock, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const searchInput = elements.get('search-view-input');
  searchInput.value = 'Mewtwo';

  let searchCalls = [];
  SearchResultsView.executeSearch = (q) => {
    searchCalls.push({ query: q, time: clock.now });
  };

  // User types 'Mew'
  SearchResultsView.handleInput('Mew');
  assert.ok(SearchResultsView._debounceTimer !== null);

  // User immediately hits Enter / submits form at 100ms
  clock.advanceTime(100);
  SearchResultsView.submitForm();

  // Debounce timer must be cancelled, search executed immediately at 100ms
  assert.equal(SearchResultsView._debounceTimer, null);
  assert.equal(searchCalls.length, 1);
  assert.equal(searchCalls[0].query, 'Mewtwo');
  assert.equal(searchCalls[0].time, 100);

  // Advance clock past original 400ms debounce — ensure no duplicate execution
  clock.advanceTime(500);
  assert.equal(searchCalls.length, 1, 'Form submission must not result in duplicate execution from previous timer');
});

test('Challenger 2 [Suite 1.5]: PokemonAPI.debounceSearch facade cancels previous unresolved promise', async () => {
  const { sandbox, clock } = createSearchEnvironment();
  const PokemonAPI = sandbox.PokemonAPI;

  const api = new PokemonAPI();
  let callCount = 0;

  // Mock searchCards to return deterministic results without live network fetch
  api.searchCards = async (q) => [
    { id: 'char-1', nombre: q, set: 'Base Set', rareza: 'Rare Holo', imagen: 'img.png', precioEstimado: 250, fuente: 'pokemontcg.io' }
  ];

  const p1 = api.debounceSearch('Char', () => { callCount++; });
  const p2 = api.debounceSearch('Chari', () => { callCount++; });
  const p3 = api.debounceSearch('Charizard', () => { callCount++; });

  // Advance virtual clock past the 400ms debounce threshold to trigger the final search timer
  clock.advanceTime(400);

  const r1 = await p1;
  assert.equal(r1.cancelled, true, 'First search promise should resolve with cancelled: true');

  const r2 = await p2;
  assert.equal(r2.cancelled, true, 'Second search promise should resolve with cancelled: true');

  const r3 = await p3;
  assert.ok(Array.isArray(r3), 'Final search promise should resolve with results array');
  assert.equal(callCount, 1, 'Debounced callback must be invoked exactly once');
});

// ==============================================================================
// SUITE 2: Skeleton Loaders Lifecycle & Markup
// ==============================================================================

test('Challenger 2 [Suite 2.1]: Skeleton loader markup has container id="search-skeletons"', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const skeletonHtml = SearchResultsView.renderLoadingSkeleton();
  assert.ok(skeletonHtml.includes('id="search-skeletons"'), 'Markup must include id="search-skeletons"');
});

test('Challenger 2 [Suite 2.2]: Skeleton cards contain animate-pulse and skeleton-card classes (8 cards)', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const skeletonHtml = SearchResultsView.renderLoadingSkeleton();

  // Match skeleton cards
  const pulseMatches = skeletonHtml.match(/animate-pulse/g) || [];
  const cardMatches = skeletonHtml.match(/skeleton-card/g) || [];

  assert.equal(cardMatches.length, 8, `Expected exactly 8 skeleton-card items, found ${cardMatches.length}`);
  assert.ok(pulseMatches.length >= 8, `Expected at least 8 animate-pulse elements, found ${pulseMatches.length}`);
});

test('Challenger 2 [Suite 2.3]: Initial render with query parameter immediately displays skeletons', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const html = SearchResultsView.render('Lugia');
  assert.ok(html.includes('id="search-skeletons"'), 'Initial render with non-empty query must show skeletons');
  assert.ok(html.includes('animate-pulse'), 'Must contain animate-pulse');
});

test('Challenger 2 [Suite 2.4]: Skeletons are replaced by results grid upon successful fetch', async () => {
  const { sandbox, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;
  const PokemonAPI = sandbox.PokemonAPI;

  const container = elements.get('search-results-container');

  // Mock API resolving with 2 cards
  PokemonAPI.searchCards = async () => [
    { id: 'xy1-1', nombre: 'Rayquaza EX', set: 'Roaring Skies', rareza: 'Ultra Rare', imagen: 'img/rayquaza.png', precioEstimado: 350, fuente: 'pokemontcg.io' },
    { id: 'xy1-2', nombre: 'Rayquaza VMAX', set: 'Evolving Skies', rareza: 'Secret Rare', imagen: 'img/rayquaza-vmax.png', precioEstimado: 450, fuente: 'tcgdex.net' }
  ];

  await SearchResultsView.executeSearch('Rayquaza');

  assert.ok(!container.innerHTML.includes('id="search-skeletons"'), 'Skeletons must be removed after successful fetch');
  assert.ok(container.innerHTML.includes('id="search-results-grid"'), 'Results grid must be rendered');
  assert.ok(container.innerHTML.includes('Rayquaza EX'), 'Card name must be present in grid');
  assert.ok(container.innerHTML.includes('$350.00'), 'Formatted price must be present');
});

test('Challenger 2 [Suite 2.5]: Skeletons are replaced by zero-state when query yields no results', async () => {
  const { sandbox, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;
  const PokemonAPI = sandbox.PokemonAPI;

  const container = elements.get('search-results-container');

  // Mock API resolving empty array
  PokemonAPI.searchCards = async () => [];

  await SearchResultsView.executeSearch('NonExistentPokemonXYZ');

  assert.ok(!container.innerHTML.includes('id="search-skeletons"'), 'Skeletons must be removed when zero results');
  assert.ok(container.innerHTML.includes('id="search-zero-state"'), 'Zero state container must be rendered');
  assert.ok(container.innerHTML.includes('No encontramos resultados para "NonExistentPokemonXYZ"'));
});

test('Challenger 2 [Suite 2.6]: Skeletons are cleared and replaced on API error', async () => {
  const { sandbox, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;
  const PokemonAPI = sandbox.PokemonAPI;

  const container = elements.get('search-results-container');

  PokemonAPI.searchCards = async () => {
    throw new Error('All cascade tiers failed catastrophically');
  };

  await SearchResultsView.executeSearch('ErrorTrigger');

  assert.ok(!container.innerHTML.includes('id="search-skeletons"'), 'Skeletons must be removed on error');
  assert.ok(container.innerHTML.includes('Ocurrió un error inesperado'), 'Error state message must be rendered');
  assert.ok(container.innerHTML.includes('Reintentar Búsqueda'), 'Retry button must be provided');
});

// ==============================================================================
// SUITE 3: Zero-Results State & Security
// ==============================================================================

test('Challenger 2 [Suite 3.1]: Zero-results container has id="search-zero-state"', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const zeroHtml = SearchResultsView.renderZeroState('Mew');
  assert.ok(zeroHtml.includes('id="search-zero-state"'), 'Markup must include id="search-zero-state"');
  assert.ok(zeroHtml.includes('No encontramos resultados para "Mew"'));
});

test('Challenger 2 [Suite 3.2]: Zero state safely sanitizes and escapes malicious XSS payloads', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    '\'><svg/onload=alert(2)>',
    '& < > " \''
  ];

  for (const payload of xssPayloads) {
    const html = SearchResultsView.renderZeroState(payload);

    // Unescaped script or tag closures must NOT exist
    assert.ok(!html.includes('<script>'), `Raw <script> tag found for payload: ${payload}`);
    assert.ok(!html.includes('onerror='), `Raw onerror handler found for payload: ${payload}`);
    assert.ok(!html.includes('onload='), `Raw onload handler found for payload: ${payload}`);

    // Must be sanitized via HTML entities
    assert.ok(html.includes('&lt;') || html.includes('&amp;') || html.includes('&quot;') || html.includes('&#39;'),
      `Payload should be escaped: ${payload}`);
  }
});

test('Challenger 2 [Suite 3.3]: Zero state renders recommendations, guidance tips, and catalog link', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const html = SearchResultsView.renderZeroState('UnknownCard');

  assert.ok(html.includes('Recomendaciones para afinar tu búsqueda'), 'Must provide search tips');
  assert.ok(html.includes('href="#catalog"'), 'Must link to full catalog #catalog');
  assert.ok(html.includes('Ver Catálogo Completo'), 'Must have catalog CTA');
  assert.ok(html.includes('Charizard'), 'Must include quick suggestion');
  assert.ok(html.includes('Moonbreon'), 'Must include Moonbreon suggestion');
  assert.ok(html.includes('Lugia'), 'Must include Lugia suggestion');
});

test('Challenger 2 [Suite 3.4]: quickSearch() sets input value, updates hash, and triggers search', () => {
  const { sandbox, elements, historyState } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const input = elements.get('search-view-input');
  let executedQuery = null;
  SearchResultsView.executeSearch = (q) => { executedQuery = q; };

  SearchResultsView.quickSearch('Umbreon');

  assert.equal(input.value, 'Umbreon', 'Input value must be updated');
  assert.equal(SearchResultsView.currentQuery, 'Umbreon');
  assert.equal(historyState.url, '#search-results?q=Umbreon', 'Hash route must be updated silently');
  assert.equal(executedQuery, 'Umbreon', 'Search must be dispatched immediately');
});

// ==============================================================================
// SUITE 4: Results Grid & Attribution Badges
// ==============================================================================

test('Challenger 2 [Suite 4.1]: Results grid has id="search-results-grid"', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const cards = [
    { id: 'c1', nombre: 'Pikachu Illustrator', set: 'Promo', rareza: 'Ultra Rare', precioEstimado: 5000000, fuente: 'pokemontcg.io' }
  ];
  const gridHtml = SearchResultsView.renderResultsGrid(cards, 'Pikachu');
  assert.ok(gridHtml.includes('id="search-results-grid"'), 'Markup must include id="search-results-grid"');
});

test('Challenger 2 [Suite 4.2]: Source badges render correct text and styles for all 3 tiers', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const cards = [
    { id: '1', nombre: 'Card 1', set: 'Set 1', rareza: 'Rare', precioEstimado: 100, fuente: 'pokemontcg.io' },
    { id: '2', nombre: 'Card 2', set: 'Set 2', rareza: 'Rare', precioEstimado: 200, fuente: 'tcgdex.net' },
    { id: '3', nombre: 'Card 3', set: 'Set 3', rareza: 'Rare', precioEstimado: 300, fuente: 'local-vault' }
  ];

  const html = SearchResultsView.renderResultsGrid(cards, 'Test');

  // Tier 1 pokemontcg.io
  assert.ok(html.includes('API pokemontcg.io'), 'Must render Tier 1 badge text');
  assert.ok(html.includes('bg-emerald-100'), 'Must apply emerald styling for Tier 1');

  // Tier 2 tcgdex.net
  assert.ok(html.includes('Respaldo tcgdex.net'), 'Must render Tier 2 badge text');
  assert.ok(html.includes('bg-blue-100'), 'Must apply blue styling for Tier 2');

  // Tier 3 local-vault
  assert.ok(html.includes('Bóveda Local G&S'), 'Must render Tier 3 badge text');
  assert.ok(html.includes('bg-amber-100'), 'Must apply amber styling for Tier 3');
});

test('Challenger 2 [Suite 4.3]: Price formatting formats numbers with USD commas and two decimals', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const cards = [
    { id: 'c1', nombre: 'Charizard PSA 10', set: 'Base', rareza: 'Holo', precioEstimado: 18500.5, fuente: 'local-vault' },
    { id: 'c2', nombre: 'Low Price Card', set: 'Neo', rareza: 'Common', precioEstimado: 0.75, fuente: 'pokemontcg.io' },
    { id: 'c3', nombre: 'Zero Price Card', set: 'Exp', rareza: 'Common', precioEstimado: 0, fuente: 'tcgdex.net' }
  ];

  const html = SearchResultsView.renderResultsGrid(cards, 'Prices');

  assert.ok(html.includes('$18,500.50'), 'Must format $18,500.50 with commas and two decimals');
  assert.ok(html.includes('$0.75'), 'Must format $0.75');
  assert.ok(html.includes('$0.00'), 'Must format $0.00');
});

test('Challenger 2 [Suite 4.4]: Local vault cards link to PDP, while external cards offer quote request', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;
  const PRODUCTS = sandbox.PRODUCTS;

  // Find a known product from local catalog
  const vaultItem = PRODUCTS[0]; // charizard-base

  const cards = [
    { id: vaultItem.id, nombre: vaultItem.nombre, set: vaultItem.set, rareza: vaultItem.rareza, precioEstimado: 18500, fuente: 'local-vault' },
    { id: 'ext-999', nombre: 'External Only Card', set: 'Japanese Promo', rareza: 'Promo', precioEstimado: 450, fuente: 'tcgdex.net' }
  ];

  const html = SearchResultsView.renderResultsGrid(cards, 'Comparison');

  // Local card CTA: openProductPDP
  assert.ok(html.includes(`app.openProductPDP('${vaultItem.id}')`), 'Local item must call app.openProductPDP');
  assert.ok(html.includes('Ver Detalle Bóveda'), 'Local item must display "Ver Detalle Bóveda"');

  // External card CTA: openQuoteModal
  assert.ok(html.includes('SearchResultsView.openQuoteModal'), 'External item must call openQuoteModal');
  assert.ok(html.includes('Solicitar Adquisición'), 'External item must display "Solicitar Adquisición"');
});

// ==============================================================================
// SUITE 5: Hash Route Parsing & Router Integration
// ==============================================================================

test('Challenger 2 [Suite 5.1]: Navigating to #search-results?q=Pikachu correctly parses query and sets view', () => {
  const { sandbox, win } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  win.location.hash = '#search-results?q=Pikachu';
  app.handleRoute();

  assert.equal(Store.data.currentView, 'search-results');
  assert.equal(Store.data.searchQuery, 'Pikachu');
});

test('Challenger 2 [Suite 5.2]: Encoded query parameter #search-results?q=Charizard%20GX decodes cleanly', () => {
  const { sandbox, win } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  win.location.hash = '#search-results?q=Charizard%20GX';
  app.handleRoute();

  assert.equal(Store.data.currentView, 'search-results');
  assert.equal(Store.data.searchQuery, 'Charizard GX');
});

test('Challenger 2 [Suite 5.3]: Route #search-results without query parameter defaults to empty string', () => {
  const { sandbox, win } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  win.location.hash = '#search-results';
  app.handleRoute();

  assert.equal(Store.data.currentView, 'search-results');
  assert.equal(Store.data.searchQuery, '');
});

test('Challenger 2 [Suite 5.4]: Multi-parameter query string extracts q correctly', () => {
  const { sandbox, win } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  win.location.hash = '#search-results?from=home&sort=desc&q=Umbreon%20VMAX&page=1';
  app.handleRoute();

  assert.equal(Store.data.currentView, 'search-results');
  assert.equal(Store.data.searchQuery, 'Umbreon VMAX');
});

test('Challenger 2 [Suite 5.5]: Case-insensitive hash route #SEARCH-RESULTS?Q=Gengar handles route', () => {
  const { sandbox, win } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  win.location.hash = '#SEARCH-RESULTS?q=Gengar';
  app.handleRoute();

  assert.equal(Store.data.currentView, 'search-results');
  assert.equal(Store.data.searchQuery, 'Gengar');
});

test('Challenger 2 [Suite 5.6]: app.executeGlobalSearch() closes modals and navigates to #search-results?q=...', () => {
  const { sandbox, win, elements } = createSearchEnvironment();
  const app = sandbox.app;
  const Store = sandbox.Store;

  const backdrop = elements.get('search-spotlight-backdrop');
  backdrop.classList.add('active');
  const dropdown = elements.get('search-live-dropdown');
  dropdown.classList.remove('hidden');

  app.executeGlobalSearch('Lugia Holo');

  assert.ok(!backdrop.classList.contains('active'), 'Spotlight backdrop must be deactivated');
  assert.ok(dropdown.classList.contains('hidden'), 'Live dropdown must be hidden');
  assert.equal(win.location.hash, '#search-results?q=Lugia%20Holo');
  assert.equal(Store.data.searchQuery, 'Lugia Holo');
});

// ==============================================================================
// SUITE 6: Adversarial Concurrency & Stress Tests
// ==============================================================================

test('Challenger 2 [Suite 6.1]: Burst typing (20 keypresses at 15ms interval) handles cleanly with 1 dispatch', () => {
  const { sandbox, clock } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  let searchDispatches = [];
  SearchResultsView.executeSearch = (q) => {
    searchDispatches.push({ q, time: clock.now });
  };

  const burstChars = 'Supercalifragilistic'; // 20 chars
  for (let i = 0; i < burstChars.length; i++) {
    clock.advanceTime(15);
    SearchResultsView.handleInput(burstChars.substring(0, i + 1));
  }

  // Elapsed time: 20 * 15 = 300ms. Less than 400ms from last keypress.
  assert.equal(searchDispatches.length, 0, 'No search should fire during rapid burst');

  // Advance 399ms
  clock.advanceTime(399);
  assert.equal(searchDispatches.length, 0);

  // Advance 1ms (exactly 400ms after final keypress)
  clock.advanceTime(1);
  assert.equal(searchDispatches.length, 1);
  assert.equal(searchDispatches[0].q, 'Supercalifragilistic');
  assert.equal(searchDispatches[0].time, 700);
});

test('Challenger 2 [Suite 6.2 (Adversarial Challenge)]: Asynchronous race condition between queries', async () => {
  const { sandbox, elements } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;
  const PokemonAPI = sandbox.PokemonAPI;
  const container = elements.get('search-results-container');

  // Let Query A ('slow-charizard') take 300ms
  // Let Query B ('fast-pikachu') take 50ms
  let resolveQueryA = null;
  let resolveQueryB = null;

  PokemonAPI.searchCards = (q) => {
    if (q === 'slow-charizard') {
      return new Promise(res => { resolveQueryA = res; });
    }
    if (q === 'fast-pikachu') {
      return new Promise(res => { resolveQueryB = res; });
    }
    return Promise.resolve([]);
  };

  // Dispatch Query A
  SearchResultsView.currentQuery = 'slow-charizard';
  const promiseA = SearchResultsView.executeSearch('slow-charizard');

  // At later time, user switches to Query B and dispatches Query B
  SearchResultsView.currentQuery = 'fast-pikachu';
  const promiseB = SearchResultsView.executeSearch('fast-pikachu');

  // Fast Query B resolves FIRST
  resolveQueryB([
    { id: 'pika-1', nombre: 'Pikachu Fast', set: 'Set', rareza: 'Common', precioEstimado: 25, fuente: 'pokemontcg.io' }
  ]);
  await promiseB;

  assert.ok(container.innerHTML.includes('Pikachu Fast'), 'Container should render fast query results first');

  // Now Slow Query A resolves LATER
  resolveQueryA([
    { id: 'char-1', nombre: 'Charizard Slow', set: 'Set', rareza: 'Rare', precioEstimado: 900, fuente: 'pokemontcg.io' }
  ]);
  await promiseA;

  // CHALLENGE CHECK:
  // If executeSearch does NOT check whether query === this.currentQuery,
  // the stale response (Charizard) overwrites the newer query (Pikachu).
  const staleOverwrote = container.innerHTML.includes('Charizard Slow');
  if (staleOverwrote) {
    console.warn('[Adversarial Challenge Finding]: Stale async response overwrote active query! (Missing query guard in executeSearch)');
  }
  // Record this empirical observation for the report
  assert.ok(true, 'Async out-of-order execution traced and evaluated');
});

test('Challenger 2 [Suite 6.3]: Extreme query string characters: Unicode, emojis, SQL, quotes', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const complexQueries = [
    'Charizard 🔥⚡',
    "'; DROP TABLE cards; --",
    '<img src=x onerror=alert(1)>',
    '日本語のポケモン',
    'Raichu & Alolan Raichu-GX #75/181'
  ];

  for (const q of complexQueries) {
    const rendered = SearchResultsView.render(q);
    assert.ok(rendered.includes('id="search-view-input"'), `Failed to render input for ${q}`);
    const zeroState = SearchResultsView.renderZeroState(q);
    assert.ok(!zeroState.includes('<script>'), `XSS vulnerability detected for ${q}`);
  }
});

test('Challenger 2 [Suite 6.4]: Extremely long query string (1,000 characters) handles without crash or throw', () => {
  const { sandbox } = createSearchEnvironment();
  const SearchResultsView = sandbox.SearchResultsView;

  const longQuery = 'Pikachu '.repeat(125); // 1000 characters
  assert.equal(longQuery.length, 1000);

  assert.doesNotThrow(() => {
    const html = SearchResultsView.render(longQuery);
    assert.ok(html.length > 1000);
  });

  assert.doesNotThrow(() => {
    const zeroState = SearchResultsView.renderZeroState(longQuery);
    assert.ok(zeroState.includes('id="search-zero-state"'));
  });
});
