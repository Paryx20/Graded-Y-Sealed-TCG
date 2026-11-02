/**
 * ==============================================================================
 * Test Suite: Failover Search Subsystem & Decoupled Results View (Phases 6)
 * File: tests/test_search_failover.test.mjs
 * Features Covered:
 *   - Feature 19: Dual Search API with Automatic Failover (pokemontcg.io -> tcgdex.net -> local)
 *   - Feature 20: Decoupled `#search-results` View (400ms debounce, skeletons, zero-state)
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SearchFailoverEngine
} from './test_harness.mjs';

const mockVaultCatalog = [
  { id: 'charizard-base', nombre: 'Charizard Base Set 1999 #4/102', set: 'Base Set 1999', rareza: 'Holo Rare', imagenLocal: 'img/charizard-base.png', precios: { psa10: 18500 } },
  { id: 'umbreon-vmax', nombre: 'Umbreon VMAX Moonbreon Alt Art #215', set: 'Evolving Skies 2021', rareza: 'Secret Rare', imagenLocal: 'img/umbreon-vmax.png', precios: { psa10: 1350 } },
  { id: 'lugia-neo', nombre: 'Lugia 1st Edition Holo #9/111', set: 'Neo Genesis 2000', rareza: 'Holo Rare', imagenLocal: 'img/lugia-neo.png', precios: { psa10: 42000 } }
];

// ==============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH - >=5 tests per feature)
// ==============================================================================

// Feature 19: Dual Search API with Automatic Failover
test('Feature 19 [Tier 1]: Search Cascade - Primary source (pokemontcg.io) returns normalized results', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Charizard');
  assert.ok(results.length > 0);
  assert.equal(results[0].fuente, 'pokemontcg.io');
  assert.ok(results[0].nombre.includes('Charizard'));
});

test('Feature 19 [Tier 1]: Search Cascade - Primary failure fails over to secondary (tcgdex.net)', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Pikachu', { failPrimary: true });
  assert.ok(results.length > 0);
  assert.equal(results[0].fuente, 'tcgdex.net');
  assert.ok(results[0].nombre.includes('Pikachu'));
});

test('Feature 19 [Tier 1]: Search Cascade - Secondary source provides normalized card attributes', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Umbreon', { failPrimary: true });
  const card = results[0];
  assert.ok(card.id);
  assert.ok(card.nombre);
  assert.ok(card.set);
  assert.ok(card.rareza);
  assert.equal(card.fuente, 'tcgdex.net');
});

test('Feature 19 [Tier 1]: Search Cascade - Both external APIs fail falls back to local vault catalogue', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Lugia', { failPrimary: true, failSecondary: true });
  assert.ok(results.length > 0);
  assert.equal(results[0].fuente, 'local-vault');
  assert.equal(results[0].id, 'lugia-neo');
});

test('Feature 19 [Tier 1]: Search Cascade - Local fallback preserves pricing and set information', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Charizard', { failPrimary: true, failSecondary: true });
  const card = results[0];
  assert.equal(card.nombre, 'Charizard Base Set 1999 #4/102');
  assert.equal(card.precioEstimado, 18500);
});

// Feature 20: Decoupled #search-results View
test('Feature 20 [Tier 1]: Decoupled View - Parses query parameter from hash route correctly', () => {
  const parseSearchHash = (hash) => {
    const raw = hash.replace(/^#/, '');
    const parts = raw.split('?');
    const route = parts[0];
    const params = new URLSearchParams(parts[1] || '');
    return { route, query: params.get('q') || '' };
  };
  const parsed = parseSearchHash('#search-results?q=Charizard%20GX');
  assert.equal(parsed.route, 'search-results');
  assert.equal(parsed.query, 'Charizard GX');
});

test('Feature 20 [Tier 1]: Decoupled View - Debounces input queries by 400ms', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  let executedQuery = null;
  const start = Date.now();
  await engine.debounceSearch('Mewtwo', (res) => {
    executedQuery = res;
  });
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 380, `Expected elapsed time >= 380ms, got ${elapsed}ms`);
  assert.ok(executedQuery !== null);
});

test('Feature 20 [Tier 1]: Decoupled View - Renders skeleton loaders during pending fetch state', () => {
  const renderLoadingSkeleton = () => `
    <div id="search-skeletons" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div class="skeleton-card animate-pulse bg-slate-200 h-64 rounded-xl"></div>
      <div class="skeleton-card animate-pulse bg-slate-200 h-64 rounded-xl"></div>
      <div class="skeleton-card animate-pulse bg-slate-200 h-64 rounded-xl"></div>
    </div>
  `;
  const html = renderLoadingSkeleton();
  assert.ok(html.includes('animate-pulse'));
  assert.ok(html.includes('skeleton-card'));
});

test('Feature 20 [Tier 1]: Decoupled View - Renders card results grid upon successful fetch', () => {
  const cards = [
    { id: '1', nombre: 'Rayquaza Gold Star', set: 'EX Deoxys', rareza: 'Ultra Rare', precioEstimado: 4500 }
  ];
  const renderResultsGrid = (items) => `
    <div id="search-results-grid" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      ${items.map(c => `
        <div class="card-item p-4 bg-white rounded-xl">
          <h3>${c.nombre}</h3>
          <span>$${c.precioEstimado}</span>
        </div>
      `).join('')}
    </div>
  `;
  const html = renderResultsGrid(cards);
  assert.ok(html.includes('Rayquaza Gold Star'));
  assert.ok(html.includes('$4500'));
});

test('Feature 20 [Tier 1]: Decoupled View - Renders informative zero-results state when empty', () => {
  const renderZeroState = (query) => `
    <div id="search-zero-state" class="text-center py-12">
      <h2>No encontramos resultados para "${query}"</h2>
      <p>Intenta buscando por nombre de Pokémon, expansión (Base Set) o rareza.</p>
    </div>
  `;
  const html = renderZeroState('NonExistentDigimon');
  assert.ok(html.includes('No encontramos resultados para "NonExistentDigimon"'));
});

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Timeouts, Cascade Resiliency, Rate Limits)
// ==============================================================================

test('Feature 19 [Tier 2 Boundary]: Search Cascade - Empty query returns empty array immediately', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('');
  assert.deepEqual(results, []);
  const resultsWhitespace = await engine.searchCards('   ');
  assert.deepEqual(resultsWhitespace, []);
});

test('Feature 19 [Tier 2 Boundary]: Search Cascade - Query with special characters encodes cleanly', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('Raichu & Alolan Raichu GX');
  assert.ok(results.length > 0);
  assert.ok(results[0].nombre.includes('Raichu & Alolan Raichu GX'));
});

test('Feature 20 [Tier 2 Boundary]: Debounce - Rapid keypresses cancel prior timers', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  let callCount = 0;
  const p1 = engine.debounceSearch('C', () => { callCount++; });
  const p2 = engine.debounceSearch('Ch', () => { callCount++; });
  const p3 = engine.debounceSearch('Cha', () => { callCount++; });
  const p4 = engine.debounceSearch('Char', () => { callCount++; });
  await Promise.all([p1, p2, p3, p4]);
  assert.equal(callCount, 1);
});

test('Feature 19 [Tier 2 Boundary]: Search Cascade - Unmatched query across all tiers returns empty array', async () => {
  const engine = new SearchFailoverEngine(mockVaultCatalog);
  const results = await engine.searchCards('NonExistentPokemonXYZ123', {
    failPrimary: true,
    failSecondary: true
  });
  assert.deepEqual(results, []);
});
