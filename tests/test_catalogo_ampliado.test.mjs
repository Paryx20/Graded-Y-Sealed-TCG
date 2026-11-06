/**
 * Catálogo ampliado: 25 cartas más con imagen real de images.pokemontcg.io,
 * copia local de respaldo y precio real de TCGplayer (PSA estimado con multiplicadores).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function loadData() {
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + `
    globalThis.__out = { POKEMON_CARDS_CATALOG_10, POKEMON_CARDS_EXTRA, PRODUCTS, PRECIOS_FECHA, PRECIOS_FUENTE, MULTIPLICADORES_PSA, preciosDesdeRaw };`, sandbox);
  return sandbox.__out;
}

test('Hay 30 cartas extra y 40 cartas en total, todas con ID único', () => {
  const { POKEMON_CARDS_CATALOG_10, POKEMON_CARDS_EXTRA, PRODUCTS } = loadData();
  assert.equal(POKEMON_CARDS_CATALOG_10.length, 10);
  assert.equal(POKEMON_CARDS_EXTRA.length, 30);
  const cards = PRODUCTS.filter(p => p.tipo_discriminador === 'CARTA_INDIVIDUAL');
  assert.equal(cards.length, 40);
  const ids = PRODUCTS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length, 'los IDs del catálogo no se repiten');
  const certs = cards.map(p => p.certNumber);
  assert.equal(new Set(certs).size, certs.length, 'los números de certificado no se repiten');
});

test('Cada carta nueva tiene imagen de la API, respaldo local y datos completos', () => {
  const { POKEMON_CARDS_EXTRA } = loadData();
  for (const card of POKEMON_CARDS_EXTRA) {
    assert.match(card.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${card.id}: kebab-case`);
    assert.ok(card.pokemon && card.nombre.startsWith(card.pokemon), `${card.id}: el nombre empieza por el Pokémon`);
    assert.match(card.imagenLocal, /^https:\/\/images\.pokemontcg\.io\/[\w-]+\/\w+\.png$/, `${card.id}: imagen de la API`);
    assert.equal(card.imagenFallbackUrl, `assets/img/cards/${card.id}.png`);
    const file = path.join(ROOT, card.imagenFallbackUrl);
    assert.ok(fs.existsSync(file), `${card.imagenFallbackUrl} debe existir`);
    assert.ok(fs.statSync(file).size < 300 * 1024, `${card.imagenFallbackUrl} debe pesar menos de 300 KB`);
    assert.ok(['psa', 'raw'].includes(card.categoria), `${card.id}: categoría de carta`);
    for (const key of ['set', 'rareza', 'tipo', 'era', 'descripcion', 'tendencia12m']) {
      assert.ok(card[key], `${card.id}: falta ${key}`);
    }
    assert.equal(card.historialBase.length, 12);
  }
});

test('Los precios PSA salen del precio Raw real con los multiplicadores', () => {
  const { POKEMON_CARDS_CATALOG_10, POKEMON_CARDS_EXTRA, MULTIPLICADORES_PSA, PRECIOS_FECHA, PRECIOS_FUENTE, preciosDesdeRaw } = loadData();
  assert.match(PRECIOS_FECHA, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(PRECIOS_FUENTE, 'TCGplayer');
  assert.deepEqual({ ...MULTIPLICADORES_PSA }, { psa8: 1.6, psa9: 2.4, psa10: 4.5 });
  assert.deepEqual({ ...preciosDesdeRaw(10) }, { raw: 10, psa8: 16, psa9: 24, psa10: 45 });

  // Redondeo half-up en centavos, igual que round() de PostgreSQL (64.05 × 4.5 = 288.225 → 288.23)
  assert.equal(preciosDesdeRaw(64.05).psa10, 288.23);
  assert.equal(preciosDesdeRaw(28.83).psa10, 129.74);
  const halfUp = (raw, m) => Math.round(Math.round(raw * 100) * Math.round(m * 10) / 10) / 100;
  for (const card of [...POKEMON_CARDS_CATALOG_10, ...POKEMON_CARDS_EXTRA]) {
    const { raw, psa8, psa9, psa10 } = card.precios;
    assert.ok(raw > 0, `${card.id}: raw positivo`);
    assert.equal(psa8, halfUp(raw, 1.6), `${card.id}: psa8`);
    assert.equal(psa9, halfUp(raw, 2.4), `${card.id}: psa9`);
    assert.equal(psa10, halfUp(raw, 4.5), `${card.id}: psa10`);
  }
});

test('El seed de Supabase incluye las 25 cartas nuevas con el mismo precio Raw', () => {
  const { POKEMON_CARDS_EXTRA } = loadData();
  const seed = read('js/db/seed_catalogo.sql');
  for (const card of POKEMON_CARDS_EXTRA) {
    assert.ok(seed.includes(`'${card.id}'`), `${card.id} debe estar en seed_catalogo.sql`);
    assert.ok(seed.includes(`('${card.id}', 'raw', null, ${card.precios.raw}, `), `${card.id}: precio raw ${card.precios.raw} en el seed`);
    assert.ok(seed.includes(`('${card.id}', 'psa10', '${card.certNumber}', ${card.precios.psa10}, `), `${card.id}: precio psa10 en el seed`);
  }
});

test('La ficha de producto indica el origen del precio solo en cartas de la bóveda', () => {
  const sandbox = { console, Store: { data: {} } };
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + '\n' + read('js/views/pdp.js') + '\nglobalThis.__out = { PDPView, PRODUCTS };', sandbox);
  const { PDPView, PRODUCTS } = sandbox.__out;
  const card = PRODUCTS.find(p => p.id === 'squirtle-151');
  const note = PDPView.renderPriceSourceNote(card);
  assert.ok(note.includes('TCGplayer'));
  assert.ok(note.includes('estimados'));
  assert.equal(PDPView.renderPriceSourceNote({ id: 'api-xy1-1', nombre: 'API' }), '');
  assert.equal(PDPView.renderPriceSourceNote(PRODUCTS.find(p => p.categoria === 'sealed')), '');
});
