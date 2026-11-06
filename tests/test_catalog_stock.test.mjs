/**
 * Catálogo con stock por grado y separación de buscadores:
 *  - Slabs PSA / Raw / Sellados / Todo solo muestran lo que tiene stock en sus grados.
 *  - Sin conexión (stock desconocido) no se oculta nada.
 *  - La bolsa toma el precio vigente de la base de datos.
 *  - Enter en la navbar busca en la tienda; "Explorar cartas" no vende ni muestra precios.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function memoryStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k)
  };
}

function load({ withApp = false } = {}) {
  const navigations = [];
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    URLSearchParams,
    localStorage: memoryStorage(),
    document: {
      addEventListener() {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    window: { location: { href: '' } }
  };
  sandbox.window.location = {
    set href(v) { navigations.push(v); },
    get href() { return navigations[navigations.length - 1] || ''; }
  };
  vm.createContext(sandbox);
  const files = ['js/data.js', 'js/state.js', 'js/views/catalog.js', 'js/views/search-results.js'];
  if (withApp) files.push('js/app.js');
  const appStub = withApp ? '' : `
    const app = {
      url: (route, params) => route + (params ? '?' + new URLSearchParams(params).toString() : ''),
      refreshIcons() {}, showToast() {}, openDialog() {}, closeDialog() {}
    };`;
  vm.runInContext(files.map(read).join('\n;\n') + appStub + `
    globalThis.__out = { PRODUCTS, Store, CatalogView, SearchResultsView, app };`, sandbox);
  return { ...sandbox.__out, navigations };
}

const firstCard = PRODUCTS => PRODUCTS.find(p => p.tipo_discriminador === 'CARTA_INDIVIDUAL' && p.precios.raw && p.precios.psa10);
const firstSealed = PRODUCTS => PRODUCTS.find(p => p.categoria === 'sealed');

test('Una carta sin stock PSA no aparece en Slabs PSA pero sí en Raw', () => {
  const { PRODUCTS, CatalogView } = load();
  const card = firstCard(PRODUCTS);
  card.stock = { raw: 3, psa8: 0, psa9: 0, psa10: 0 };
  assert.equal(CatalogView.matchesCategory(card, 'psa'), false);
  assert.equal(CatalogView.matchesCategory(card, 'raw'), true);
  assert.equal(CatalogView.matchesCategory(card, 'all'), true);
  assert.deepEqual([...CatalogView.availableGrades(card)], ['raw']);
});

test('Una carta solo con stock en slab no aparece en Raw y muestra el grado PSA disponible', () => {
  const { PRODUCTS, CatalogView } = load();
  const card = firstCard(PRODUCTS);
  card.stock = { raw: 0, psa8: 0, psa9: 2, psa10: 0 };
  assert.equal(CatalogView.matchesCategory(card, 'raw'), false);
  assert.equal(CatalogView.matchesCategory(card, 'psa'), true);
  const opt = CatalogView.getDisplayOption(card, 'psa');
  assert.equal(opt.grade, 'psa9');
  assert.equal(opt.price, card.precios.psa9);
});

test('Lo agotado en todos sus grados no aparece en "Todo" ni en el listado filtrado', () => {
  const { PRODUCTS, Store, CatalogView } = load();
  const card = firstCard(PRODUCTS);
  const sealed = firstSealed(PRODUCTS);
  card.stock = { raw: 0, psa8: 0, psa9: 0, psa10: 0 };
  sealed.stock = { sealed: 0 };
  Store.data.catalogFilters.category = 'all';
  const ids = CatalogView.getFilteredProducts().map(p => p.id);
  assert.ok(!ids.includes(card.id), 'la carta agotada no se lista');
  assert.ok(!ids.includes(sealed.id), 'el sellado agotado no se lista');
  Store.data.catalogFilters.category = 'sealed';
  assert.ok(!CatalogView.getFilteredProducts().some(p => p.id === sealed.id));
});

test('Sin conexión (stock desconocido) no se oculta ningún producto', () => {
  const { PRODUCTS, Store, CatalogView } = load();
  PRODUCTS.forEach(p => { delete p.stock; });
  Store.data.catalogFilters.category = 'all';
  assert.equal(CatalogView.getFilteredProducts().length, PRODUCTS.length);
});

test('El filtro de energía solo ofrece tipos con stock', () => {
  const { PRODUCTS, CatalogView } = load();
  const type = PRODUCTS.find(p => p.tipo && p.tipo_discriminador === 'CARTA_INDIVIDUAL').tipo;
  PRODUCTS.forEach(p => {
    p.stock = p.tipo === type ? { raw: 0, psa8: 0, psa9: 0, psa10: 0, sealed: 0 } : { raw: 1, psa8: 1, psa9: 1, psa10: 1, sealed: 1 };
  });
  assert.ok(!CatalogView.availableTypes().includes(type));
});

test('El filtro por letra ya no existe', () => {
  const { Store, CatalogView } = load();
  assert.equal('letter' in Store.data.catalogFilters, false);
  assert.equal(typeof CatalogView.setLetter, 'undefined');
  assert.ok(!CatalogView.render().includes('catalog-letter-filter'));
});

test('La bolsa toma el precio vigente de la base de datos', () => {
  const { PRODUCTS, Store } = load();
  const card = firstCard(PRODUCTS);
  Store.data.cart = [{ id: `${card.id}-raw`, name: card.nombre, price: card.precios.raw, quantity: 1 }];
  card.precios.raw = Math.round((card.precios.raw + 5) * 100) / 100;
  const changed = Store.repriceCart();
  assert.deepEqual([...changed], [card.nombre]);
  assert.equal(Store.data.cart[0].price, card.precios.raw);
  assert.equal(Store.repriceCart().length, 0, 'sin cambios la segunda vez');
});

test('Explorar cartas no muestra precios ni botones de compra', () => {
  const { SearchResultsView } = load();
  const cards = [
    { id: 'base1-4', nombre: 'Charizard', set: 'Base', rareza: 'Rare Holo', imagen: 'https://images.pokemontcg.io/base1/4.png', precioEstimado: 350, fuente: 'pokemontcg.io' },
    { id: 'swsh7-215', nombre: 'Umbreon VMAX', set: 'Evolving Skies', rareza: 'Secret Rare', imagen: 'x.webp', precioEstimado: 99, fuente: 'tcgdex.net' }
  ];
  SearchResultsView.results = cards;
  const html = SearchResultsView.renderResultsGrid(cards, 'char');
  assert.ok(html.includes('id="search-results-grid"'));
  assert.ok(!html.includes('$350'), 'sin precio estimado');
  assert.ok(!/addToCart|Añadir a la bolsa|registerApiCard/.test(html), 'sin compra');
  assert.ok(html.includes('#4'), 'muestra el número de carta');
  assert.ok(SearchResultsView.render('').includes('no forman parte de nuestro inventario'));
});

test('Explorar cartas enlaza a la tienda solo si la carta está en stock', () => {
  const { PRODUCTS, SearchResultsView } = load();
  const card = PRODUCTS.find(p => p.tipo_discriminador === 'CARTA_INDIVIDUAL' && /#\s*\d+/.test(p.nombre));
  const number = card.nombre.match(/#\s*0*(\d+)/)[1];
  const baseName = card.nombre.split(' ').slice(0, 1).join(' ');
  const apiCard = { id: `set1-${number}`, nombre: baseName, set: 'TCG Set', rareza: 'Rare', imagen: 'x.png', fuente: 'tcgdex.net' };
  card.stock = { raw: 1, psa8: 0, psa9: 0, psa10: 0 };
  assert.equal(SearchResultsView.findStoreMatch(apiCard)?.id, card.id, 'mismo nombre y número: es la carta de la tienda');
  assert.equal(SearchResultsView.findStoreMatch({ ...apiCard, id: 'set1-999' }), null, 'otro número no se confunde');
  card.stock = { raw: 0, psa8: 0, psa9: 0, psa10: 0 };
  const other = SearchResultsView.findStoreMatch(apiCard);
  assert.ok(!other || other.id !== card.id, 'una carta agotada no se ofrece');
});

test('Enter en el buscador de la navbar busca en el catálogo de la tienda', () => {
  const { app, navigations } = load({ withApp: true });
  app.executeGlobalSearch('pikachu');
  assert.equal(navigations.at(-1), 'pages/catalogo.html?q=pikachu');
});
