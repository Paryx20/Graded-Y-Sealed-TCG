/**
 * Independent Verification & Adversarial Stress Test Script for Milestone 3
 * Reviewer 2 (reviewer_m3_2)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = 'c:\\Users\\patri\\Desktop\\PUCE TAREAS\\IHC\\Pagina_e-commerce';

// Helper to load project files in a sandboxed Node environment
function loadScript(filePath, extraContext = {}) {
  const fullPath = path.resolve(ROOT_DIR, filePath);
  let code = fs.readFileSync(fullPath, 'utf8');
  if (filePath.includes('data.js')) {
    code += '\n;globalThis.PRODUCTS = typeof PRODUCTS !== "undefined" ? PRODUCTS : []; globalThis.APP_CONFIG = typeof APP_CONFIG !== "undefined" ? APP_CONFIG : {};';
  }
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URLSearchParams,
    AbortController,
    DOMException,
    fetch: globalThis.fetch,
    ...extraContext
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

// Load PRODUCTS from js/data.js
const dataCtx = loadScript('js/data.js');
const PRODUCTS = dataCtx.PRODUCTS;

// Load PokemonAPI from js/services/pokemon-api.js
const apiCtx = loadScript('js/services/pokemon-api.js', { PRODUCTS });
const PokemonAPI = apiCtx.PokemonAPI;

// Load SearchResultsView from js/views/search-results.js
const viewCtx = loadScript('js/views/search-results.js', { PRODUCTS, PokemonAPI });
const SearchResultsView = viewCtx.SearchResultsView;

console.log('[Setup] Loaded PokemonAPI & SearchResultsView successfully.');

// ==============================================================================
// 1. FAILOVER RESILIENCE IN PokemonAPI
// ==============================================================================

test('Resilience 1: Empty or whitespace query returns empty array immediately', async () => {
  const api = new PokemonAPI(PRODUCTS);
  const r1 = await api.searchCards('');
  const r2 = await api.searchCards('   ');
  const r3 = await api.searchCards(null);
  const r4 = await api.searchCards(undefined);
  assert.deepEqual([...r1], []);
  assert.deepEqual([...r2], []);
  assert.deepEqual([...r3], []);
  assert.deepEqual([...r4], []);
});

test('Resilience 2: HTTP 404 from pokemontcg.io fails over to tcgdex.net', async () => {
  let primaryCalled = false;
  let secondaryCalled = false;

  const mockFetch = async (url, opts) => {
    if (url.includes('pokemontcg.io')) {
      primaryCalled = true;
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
    }
    if (url.includes('tcgdex.net')) {
      secondaryCalled = true;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'tcg-char-1',
            name: 'Charizard EX',
            set: { name: '151' },
            rarity: 'Double Rare',
            image: 'https://assets.tcgdex.net/en/sv/sv03.5/006'
          }
        ]
      };
    }
    throw new Error('Unknown URL: ' + url);
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  const results = await api.searchCards('Charizard');
  assert.ok(primaryCalled, 'Primary source was called');
  assert.ok(secondaryCalled, 'Secondary source was called after 404');
  assert.equal(results.length, 1);
  assert.equal(results[0].fuente, 'tcgdex.net');
  assert.equal(results[0].nombre, 'Charizard EX');
  assert.equal(results[0].imagen, 'https://assets.tcgdex.net/en/sv/sv03.5/006/high.webp');
});

test('Resilience 3: HTTP 500 Server Error from pokemontcg.io fails over to tcgdex.net', async () => {
  let primaryCalled = false;
  let secondaryCalled = false;

  const mockFetch = async (url, opts) => {
    if (url.includes('pokemontcg.io')) {
      primaryCalled = true;
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };
    }
    if (url.includes('tcgdex.net')) {
      secondaryCalled = true;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'tcg-pik-1',
            name: 'Pikachu',
            set: { name: 'Crown Zenith' },
            rarity: 'Secret Rare',
            image: 'https://assets.tcgdex.net/en/swsh/swsh12.5/160.png'
          }
        ]
      };
    }
    throw new Error('Unknown URL: ' + url);
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  const results = await api.searchCards('Pikachu');
  assert.ok(primaryCalled);
  assert.ok(secondaryCalled);
  assert.equal(results.length, 1);
  assert.equal(results[0].fuente, 'tcgdex.net');
  assert.equal(results[0].nombre, 'Pikachu');
});

test('Resilience 4: Network Offline / Fetch Error from pokemontcg.io fails over to tcgdex.net', async () => {
  let primaryCalled = false;
  let secondaryCalled = false;

  const mockFetch = async (url, opts) => {
    if (url.includes('pokemontcg.io')) {
      primaryCalled = true;
      throw new TypeError('Failed to fetch: Network offline / DNS resolution error');
    }
    if (url.includes('tcgdex.net')) {
      secondaryCalled = true;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'tcg-lugia-1',
            name: 'Lugia V',
            set: { name: 'Silver Tempest' },
            rarity: 'Ultra Rare',
            image: 'https://assets.tcgdex.net/en/swsh/swsh12/138.png'
          }
        ]
      };
    }
    throw new Error('Unknown URL: ' + url);
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  const results = await api.searchCards('Lugia');
  assert.ok(primaryCalled);
  assert.ok(secondaryCalled);
  assert.equal(results.length, 1);
  assert.equal(results[0].fuente, 'tcgdex.net');
  assert.equal(results[0].nombre, 'Lugia V');
});

test('Resilience 5: Timeout (AbortController 4s) on primary switches to secondary', async () => {
  let primaryAborted = false;
  let secondaryCalled = false;

  const mockFetch = async (url, opts) => {
    if (url.includes('pokemontcg.io')) {
      return new Promise((resolve, reject) => {
        if (opts.signal) {
          opts.signal.addEventListener('abort', () => {
            primaryAborted = true;
            reject(new DOMException('The operation was aborted due to timeout', 'AbortError'));
          });
        }
      });
    }
    if (url.includes('tcgdex.net')) {
      secondaryCalled = true;
      return {
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'tcg-mew-1',
            name: 'Mew VMAX',
            set: { name: 'Fusion Strike' },
            rarity: 'Secret Rare',
            image: 'img/mew.png'
          }
        ]
      };
    }
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);
  // Shorten timeout for test speed
  api.timeoutMs = 50;

  const results = await api.searchCards('Mew');
  assert.ok(primaryAborted, 'Primary was aborted via AbortController');
  assert.ok(secondaryCalled, 'Secondary was called after primary timeout');
  assert.equal(results.length, 1);
  assert.equal(results[0].fuente, 'tcgdex.net');
  assert.equal(results[0].nombre, 'Mew VMAX');
});

test('Resilience 6: Both external APIs unreachable falls back to in-memory local vault catalog', async () => {
  const mockFetch = async (url) => {
    throw new TypeError('Network down: ' + url);
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  // Search for Charizard
  const results = await api.searchCards('Charizard');
  assert.ok(results.length > 0, 'Found items in local catalog');
  assert.equal(results[0].fuente, 'local-vault');
  assert.equal(results[0].id, 'charizard-base');
  assert.equal(results[0].precioEstimado, 18500);

  // Search for Umbreon
  const resultsUmbreon = await api.searchCards('Umbreon');
  assert.ok(resultsUmbreon.length > 0);
  assert.equal(resultsUmbreon[0].fuente, 'local-vault');
  assert.equal(resultsUmbreon[0].id, 'umbreon-vmax');
  assert.equal(resultsUmbreon[0].precioEstimado, 1350);
});

test('Resilience 7: Both external APIs unreachable and unmatched query returns empty array', async () => {
  const mockFetch = async () => {
    throw new TypeError('Network down');
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  const results = await api.searchCards('NonExistentDigimonXYZ');
  assert.deepEqual([...results], []);
});

test('Resilience 8: Special characters and URL safety in queries', async () => {
  let requestedUrl = '';
  const mockFetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: [] })
    };
  };

  const localApiCtx = loadScript('js/services/pokemon-api.js', {
    fetch: mockFetch,
    PRODUCTS
  });
  const api = new localApiCtx.PokemonAPI(PRODUCTS);

  await api.searchCards('Raichu & Alolan Raichu GX #123?');
  assert.ok(requestedUrl.includes('Raichu%20%26%20Alolan%20Raichu%20GX%20%23123%3F'), 'Properly URI encoded');
});

// ==============================================================================
// 2. SEARCH INPUT DEBOUNCE, SKELETONS, AND ZERO-RESULTS STATE IN SearchResultsView
// ==============================================================================

test('Debounce 1: Rapid keystrokes cancel prior timers and fire only the final keystroke', async () => {
  let searchCallCount = 0;
  let lastSearchedQuery = null;

  const mockApi = {
    searchCards: async (q) => {
      searchCallCount++;
      lastSearchedQuery = q;
      return [];
    }
  };

  // Create mock DOM environment
  const mockContainer = { innerHTML: '' };
  const mockInput = { value: '', focus: () => {} };
  const mockDoc = {
    getElementById: (id) => {
      if (id === 'search-results-container') return mockContainer;
      if (id === 'search-view-input') return mockInput;
      return null;
    }
  };

  const viewSandbox = loadScript('js/views/search-results.js', {
    document: mockDoc,
    PokemonAPI: mockApi,
    PRODUCTS,
    history: { replaceState: () => {} },
    location: { hash: '' }
  });
  const SRV = viewSandbox.SearchResultsView;

  // Simulate rapid typing: C -> Ch -> Cha -> Char -> Charizard in intervals of 50ms
  SRV.handleInput('C');
  await new Promise(r => setTimeout(r, 50));
  SRV.handleInput('Ch');
  await new Promise(r => setTimeout(r, 50));
  SRV.handleInput('Cha');
  await new Promise(r => setTimeout(r, 50));
  SRV.handleInput('Char');
  await new Promise(r => setTimeout(r, 50));
  SRV.handleInput('Charizard');

  // Verify that during rapid typing, searchCards has NOT yet been called
  assert.equal(searchCallCount, 0, 'No search triggered during rapid typing');

  // Wait 450ms for debounce timer to fire
  await new Promise(r => setTimeout(r, 450));

  assert.equal(searchCallCount, 1, 'Only one search fired after debounce');
  assert.equal(lastSearchedQuery, 'Charizard', 'Final query was searched');
});

test('Skeletons 2: Skeletons are rendered during pending fetch and completely removed when results arrive', async () => {
  let resolveSearch;
  const mockApi = {
    searchCards: async () => new Promise(res => { resolveSearch = res; })
  };

  const mockContainer = { innerHTML: '' };
  const mockDoc = {
    getElementById: (id) => {
      if (id === 'search-results-container') return mockContainer;
      return null;
    }
  };

  const viewSandbox = loadScript('js/views/search-results.js', {
    document: mockDoc,
    PokemonAPI: mockApi,
    PRODUCTS
  });
  const SRV = viewSandbox.SearchResultsView;

  // Trigger search
  const searchPromise = SRV.executeSearch('Charizard');

  // Check that while search is pending, skeletons are rendered
  assert.ok(mockContainer.innerHTML.includes('id="search-skeletons"'), 'Skeletons container present during loading');
  assert.ok(mockContainer.innerHTML.includes('skeleton-card'), 'Skeleton card items present');
  assert.ok(mockContainer.innerHTML.includes('animate-pulse'), 'Pulse animation present');

  // Resolve search with results
  resolveSearch([
    {
      id: 'charizard-base',
      nombre: 'Charizard Base Set',
      set: 'Base Set',
      rareza: 'Holo Rare',
      imagen: 'img/charizard.png',
      precioEstimado: 18500,
      fuente: 'local-vault'
    }
  ]);

  await searchPromise;

  // Check that skeletons are completely removed and results grid is rendered
  assert.ok(!mockContainer.innerHTML.includes('id="search-skeletons"'), 'Skeletons removed after results arrive');
  assert.ok(mockContainer.innerHTML.includes('id="search-results-grid"'), 'Results grid rendered');
  assert.ok(mockContainer.innerHTML.includes('Charizard Base Set'), 'Card title rendered');
});

test('Skeletons 3: Skeletons are completely removed when search returns zero results', async () => {
  const mockApi = {
    searchCards: async () => []
  };

  const mockContainer = { innerHTML: '' };
  const mockDoc = {
    getElementById: (id) => {
      if (id === 'search-results-container') return mockContainer;
      return null;
    }
  };

  const viewSandbox = loadScript('js/views/search-results.js', {
    document: mockDoc,
    PokemonAPI: mockApi,
    PRODUCTS
  });
  const SRV = viewSandbox.SearchResultsView;

  await SRV.executeSearch('MissingNo');

  // Verify skeletons are removed and zero-state is rendered
  assert.ok(!mockContainer.innerHTML.includes('id="search-skeletons"'), 'Skeletons removed on zero results');
  assert.ok(mockContainer.innerHTML.includes('id="search-zero-state"'), 'Zero-state container rendered');
  assert.ok(mockContainer.innerHTML.includes('No encontramos resultados para "MissingNo"'));
});

test('Zero-results state 4: Provides helpful UI suggestions and quick search actions', () => {
  const SRV = SearchResultsView;
  const zeroHtml = SRV.renderZeroState('UnobtainiumCard');

  assert.ok(zeroHtml.includes('id="search-zero-state"'));
  assert.ok(zeroHtml.includes('No encontramos resultados para "UnobtainiumCard"'));
  // Recommendations box
  assert.ok(zeroHtml.includes('Recomendaciones para afinar tu búsqueda:'));
  assert.ok(zeroHtml.includes('Verifica la ortografía'));
  assert.ok(zeroHtml.includes('Busca por número de carta o set'));
  assert.ok(zeroHtml.includes('Prueba con términos genéricos'));
  // Action buttons
  assert.ok(zeroHtml.includes("SearchResultsView.quickSearch('Charizard')"));
  assert.ok(zeroHtml.includes("SearchResultsView.quickSearch('Umbreon')"));
  assert.ok(zeroHtml.includes("SearchResultsView.quickSearch('Lugia')"));
  assert.ok(zeroHtml.includes('href="#catalog"'));
});

test('Security 5: XSS sanitization in search input and zero-state display', () => {
  const SRV = SearchResultsView;
  const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
  const zeroHtml = SRV.renderZeroState(xssPayload);

  assert.ok(!zeroHtml.includes('<script>'), 'Raw script tags are escaped');
  assert.ok(!zeroHtml.includes('<img src=x onerror='), 'Raw onerror tags are escaped');
  assert.ok(zeroHtml.includes('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'));
});
