import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT_DIR = 'c:/Users/patri/Desktop/PUCE TAREAS/IHC/Pagina_e-commerce';

// Helper to evaluate browser JS files in a mock browser VM
function loadBrowserScript(relPath, context = {}) {
  const code = fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URLSearchParams,
    AbortController,
    fetch: globalThis.fetch,
    Math,
    Date,
    JSON,
    Number,
    String,
    Array,
    Object,
    ...context
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

const mockProducts = [
  {
    id: 'charizard-base',
    nombre: 'Charizard Base Set 1999 #4/102',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'CARTA_INDIVIDUAL',
    imagenLocal: 'img/charizard-base.png',
    precios: { psa10: 18500, psa9: 3200, raw: 750 }
  },
  {
    id: 'umbreon-vmax',
    nombre: 'Umbreon VMAX Moonbreon Alt Art #215',
    set: 'Evolving Skies 2021',
    rareza: 'Secret Rare',
    tipo: 'CARTA_INDIVIDUAL',
    imagenLocal: 'img/umbreon-vmax.png',
    precios: { psa10: 1350, raw: 650 }
  },
  {
    id: 'team-rocket-box',
    nombre: 'Booster Box Team Rocket 2000 (1st Edition)',
    set: 'Team Rocket',
    rareza: 'Sealed Product',
    tipo: 'PRODUCTO_SELLADO',
    imagenLocal: 'img/sealed/team-rocket-box-front.png',
    precios: { psa10: 24000, raw: 24000 }
  }
];

// ==============================================================================
// 1. DIRECT VERIFICATION OF js/services/pokemon-api.js
// ==============================================================================

test('PokemonAPI: Loads properly from production source file', () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  assert.ok(env.PokemonAPI, 'PokemonAPI must be defined on window/globalThis');
  assert.equal(typeof env.PokemonAPI.searchCards, 'function', 'Static searchCards must exist');
  assert.equal(typeof env.PokemonAPI.debounceSearch, 'function', 'Static debounceSearch must exist');
});

test('PokemonAPI: Tier 1 primary source normalization and schema', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  const mockPrimaryData = [
    {
      id: 'base1-4',
      name: 'Charizard',
      set: { name: 'Base' },
      rarity: 'Rare Holo',
      images: { small: 'https://images.pokemontcg.io/base1/4.png', large: 'https://images.pokemontcg.io/base1/4_hires.png' },
      cardmarket: { prices: { averageSellPrice: 285.50 } }
    }
  ];

  const results = await mockApi.searchCards('Charizard', { primaryData: mockPrimaryData });
  assert.equal(results.length, 1);
  const card = results[0];
  assert.equal(card.id, 'base1-4');
  assert.equal(card.nombre, 'Charizard');
  assert.equal(card.set, 'Base');
  assert.equal(card.rareza, 'Rare Holo');
  assert.equal(card.imagen, 'https://images.pokemontcg.io/base1/4.png');
  assert.equal(card.precioEstimado, 285.50);
  assert.equal(card.fuente, 'pokemontcg.io');
});

test('PokemonAPI: Automatic failover from Tier 1 to Tier 2 when primary fails', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  const mockSecondaryData = [
    {
      id: 'swsh7-215',
      name: 'Umbreon VMAX',
      set: { name: 'Evolving Skies' },
      rarity: 'Secret Rare',
      image: 'https://assets.tcgdex.net/en/swsh/swsh7/215',
      precioEstimado: 450.00
    }
  ];

  const results = await mockApi.searchCards('Umbreon', {
    failPrimary: true,
    secondaryData: mockSecondaryData
  });

  assert.equal(results.length, 1);
  const card = results[0];
  assert.equal(card.fuente, 'tcgdex.net');
  assert.equal(card.nombre, 'Umbreon VMAX');
  assert.equal(card.set, 'Evolving Skies');
  assert.equal(card.rareza, 'Secret Rare');
  assert.equal(card.imagen, 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp');
  assert.equal(card.precioEstimado, 450.00);
});

test('PokemonAPI: Automatic failover to Tier 3 Local Vault when both Tier 1 and Tier 2 fail', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  const results = await mockApi.searchCards('Charizard', {
    failPrimary: true,
    failSecondary: true
  });

  assert.equal(results.length, 1);
  const card = results[0];
  assert.equal(card.fuente, 'local-vault');
  assert.equal(card.id, 'charizard-base');
  assert.equal(card.nombre, 'Charizard Base Set 1999 #4/102');
  assert.equal(card.precioEstimado, 18500);
});

test('PokemonAPI: Returns empty array on unmatched query across all tiers', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  const results = await mockApi.searchCards('CompletelyBogusNonExistentPokemonNameXYZ', {
    failPrimary: true,
    failSecondary: true
  });

  assert.equal(results.length, 0);
});

test('PokemonAPI: Empty or whitespace query exits immediately without network calls', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  const r1 = await mockApi.searchCards('');
  assert.equal(r1.length, 0);
  const r2 = await mockApi.searchCards('   \t\n  ');
  assert.equal(r2.length, 0);
  const r3 = await mockApi.searchCards(null);
  assert.equal(r3.length, 0);
  const r4 = await mockApi.searchCards(undefined);
  assert.equal(r4.length, 0);
});

test('PokemonAPI: Debounce delays execution by 400ms and cancels prior calls', async () => {
  const env = loadBrowserScript('js/services/pokemon-api.js', { PRODUCTS: mockProducts });
  const mockApi = new env.PokemonAPI(mockProducts);

  let executedCount = 0;
  const start = Date.now();

  const p1 = mockApi.debounceSearch('C', () => { executedCount++; }, { failPrimary: true, failSecondary: true });
  const p2 = mockApi.debounceSearch('Ch', () => { executedCount++; }, { failPrimary: true, failSecondary: true });
  const p3 = mockApi.debounceSearch('Charizard', () => { executedCount++; }, { failPrimary: true, failSecondary: true });

  const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
  const elapsed = Date.now() - start;

  assert.ok(elapsed >= 380, `Debounce should wait ~400ms, waited ${elapsed}ms`);
  assert.equal(executedCount, 1, 'Only the final callback should be executed');
  assert.equal(r1.cancelled, true);
  assert.equal(r2.cancelled, true);
  assert.ok(Array.isArray(r3));
  assert.equal(r3[0].id, 'charizard-base');
});

// ==============================================================================
// 2. DIRECT VERIFICATION OF js/views/search-results.js
// ==============================================================================

test('SearchResultsView: Loads properly from production source file', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  assert.ok(env.SearchResultsView, 'SearchResultsView must be defined on window/globalThis');
  assert.equal(typeof env.SearchResultsView.render, 'function');
  assert.equal(typeof env.SearchResultsView.renderLoadingSkeleton, 'function');
  assert.equal(typeof env.SearchResultsView.renderZeroState, 'function');
  assert.equal(typeof env.SearchResultsView.renderResultsGrid, 'function');
});

test('SearchResultsView: render() produces correct skeleton or prompt shell', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  const view = env.SearchResultsView;

  const htmlEmpty = view.render('');
  assert.ok(htmlEmpty.includes('id="search-view-input"'), 'Input element must exist');
  assert.ok(htmlEmpty.includes('id="search-results-container"'), 'Results container must exist');
  assert.ok(htmlEmpty.includes('Comienza a escribir para buscar'), 'Empty query shows prompt');

  const htmlWithQ = view.render('Charizard');
  assert.ok(htmlWithQ.includes('id="search-skeletons"'), 'Populated initial query renders skeleton');
  assert.ok(htmlWithQ.includes('animate-pulse'), 'Skeleton contains animate-pulse class');
});

test('SearchResultsView: renderLoadingSkeleton() contains required classes', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  const skeletonHtml = env.SearchResultsView.renderLoadingSkeleton();
  assert.ok(skeletonHtml.includes('id="search-skeletons"'));
  assert.ok(skeletonHtml.includes('animate-pulse'));
  assert.ok(skeletonHtml.includes('skeleton-card'));
});

test('SearchResultsView: renderZeroState() contains informative elements and escaping', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  const zeroHtml = env.SearchResultsView.renderZeroState('<script>alert("xss")</script>');
  assert.ok(zeroHtml.includes('id="search-zero-state"'));
  assert.ok(zeroHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Query must be sanitized against HTML injection');
  assert.ok(!zeroHtml.includes('<script>'), 'Unescaped script tags must not be rendered');
});

test('SearchResultsView: renderResultsGrid() outputs source badges and pricing', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  const mockCards = [
    {
      id: 'base1-4',
      nombre: 'Charizard Base Set',
      set: 'Base Set',
      rareza: 'Holo Rare',
      imagen: 'img/charizard-base.png',
      precioEstimado: 18500.00,
      fuente: 'local-vault'
    },
    {
      id: 'swsh-001',
      nombre: 'Pikachu Promo',
      set: 'SWSH Promos',
      rareza: 'Promo',
      imagen: 'img/cards/raichu-gx.png',
      precioEstimado: 25.00,
      fuente: 'pokemontcg.io'
    },
    {
      id: 'tcgdex-42',
      nombre: 'Gengar EX',
      set: 'Phantom Forces',
      rareza: 'Ultra Rare',
      imagen: 'img/cards/card-back.png',
      precioEstimado: 85.00,
      fuente: 'tcgdex.net'
    }
  ];

  const gridHtml = env.SearchResultsView.renderResultsGrid(mockCards, 'Pokemon');
  assert.ok(gridHtml.includes('id="search-results-grid"'));
  assert.ok(gridHtml.includes('3 cartas encontradas'));
  assert.ok(gridHtml.includes('Bóveda Local G&S'));
  assert.ok(gridHtml.includes('API pokemontcg.io'));
  assert.ok(gridHtml.includes('Respaldo tcgdex.net'));
  assert.ok(gridHtml.includes('$18,500.00'));
});

// ==============================================================================
// 3. ADVERSARIAL STRESS TESTING: QUOTES & SPECIAL CHARACTERS IN ONCLICK
// ==============================================================================

test('Adversarial: Quotes and apostrophes in card names in card items', () => {
  const env = loadBrowserScript('js/views/search-results.js', { PRODUCTS: mockProducts });
  const trickyCards = [
    {
      id: 'tricky-1',
      nombre: "Lt. Surge's Raichu #28",
      set: "Gym Heroes",
      rareza: "Rare Holo",
      imagen: "img/cards/raichu-gx.png",
      precioEstimado: 75.00,
      fuente: 'pokemontcg.io'
    }
  ];

  const html = env.SearchResultsView.renderResultsGrid(trickyCards, "Surge's");
  assert.ok(html.includes("Lt. Surge&#39;s Raichu #28"));
});
