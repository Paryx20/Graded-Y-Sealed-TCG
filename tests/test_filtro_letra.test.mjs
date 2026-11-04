/**
 * Filtro del catálogo por la primera letra del nombre del Pokémon.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function createRuntime() {
  const replaced = [];
  const sandbox = {
    console,
    URLSearchParams,
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
    location: { pathname: '/pages/catalogo.html', search: '' },
    history: { replaceState: (_s, _t, url) => replaced.push(url) },
    app: { url: () => 'pages/catalogo.html', refreshIcons() {}, renderCurrentView() {}, showToast() {} },
    Store: {
      data: {
        catalogFilters: {
          category: 'all', era: 'all', edition: 'all', type: 'all', minPrice: '', maxPrice: '',
          sortBy: 'featured', searchQuery: '', onlyFavorites: false, letter: 'all'
        }
      },
      isFavorite: () => false
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + '\n' + read('js/views/catalog.js') + '\nglobalThis.__out = { CatalogView, PRODUCTS };', sandbox);
  return { ...sandbox.__out, Store: sandbox.Store, replaced };
}

test('Una letra deja solo las cartas cuyo Pokémon empieza por ella', () => {
  const { CatalogView, Store } = createRuntime();
  Store.data.catalogFilters.letter = 'C';
  const list = CatalogView.getFilteredProducts();
  assert.ok(list.length >= 3, 'hay varias cartas con C');
  for (const card of list) {
    assert.equal(CatalogView.initialOf(card), 'C', `${card.nombre} empieza por C`);
    assert.notEqual(card.categoria, 'sealed', 'los sellados no entran en el filtro por letra');
  }
  const names = list.map(c => c.pokemon || c.nombre);
  assert.ok(names.some(n => n.startsWith('Charmander')));
  assert.ok(names.some(n => n.startsWith('Charizard')));
});

test('"Todas" muestra el catálogo completo, sellados incluidos', () => {
  const { CatalogView, Store, PRODUCTS } = createRuntime();
  Store.data.catalogFilters.letter = 'Z';
  assert.ok(CatalogView.getFilteredProducts().length < PRODUCTS.length);
  CatalogView.setLetter('all');
  assert.equal(Store.data.catalogFilters.letter, 'all');
  assert.equal(CatalogView.getFilteredProducts().length, PRODUCTS.length);
});

test('setLetter actualiza la URL con ?letra= y rechaza valores no válidos', () => {
  const { CatalogView, Store, replaced } = createRuntime();
  CatalogView.setLetter('M');
  assert.equal(Store.data.catalogFilters.letter, 'M');
  assert.equal(replaced.at(-1), '/pages/catalogo.html?letra=M');
  CatalogView.setLetter('<script>');
  assert.equal(Store.data.catalogFilters.letter, 'all');
  assert.equal(replaced.at(-1), '/pages/catalogo.html');
});

test('La barra de letras es accesible: grupo con nombre, aria-pressed y letras vacías deshabilitadas', () => {
  const { CatalogView, Store } = createRuntime();
  Store.data.catalogFilters.letter = 'P';
  const html = CatalogView.renderLetterFilter();
  assert.ok(html.includes('role="group"'));
  assert.ok(html.includes('aria-labelledby="catalog-letter-label"'));

  const buttons = html.match(/<button[\s\S]*?<\/button>/g);
  assert.equal(buttons.length, 27, 'botón Todas + 26 letras');
  const pressed = buttons.filter(b => b.includes('aria-pressed="true"'));
  assert.equal(pressed.length, 1);
  assert.ok(pressed[0].includes('data-letter="P"'));

  const available = CatalogView.availableLetters();
  assert.ok(!available.has('Q'), 'no hay Pokémon con Q en el catálogo');
  const q = buttons.find(b => b.includes('data-letter="Q"'));
  assert.ok(q.includes('disabled'));
  assert.ok(q.includes('aria-label="Letra Q: sin cartas"'));
  const a = buttons.find(b => b.includes('data-letter="A"'));
  assert.ok(!a.includes('disabled'));
});

test('El título cambia con la letra y resetFilters la limpia', () => {
  const { CatalogView, Store } = createRuntime();
  Store.data.catalogFilters.letter = 'S';
  assert.equal(CatalogView.getActiveTitle(), 'Pokémon que empiezan por «S»');
  CatalogView.resetFilters();
  assert.equal(Store.data.catalogFilters.letter, 'all');
});

test('Las letras disponibles cubren al menos 18 iniciales con las 35 cartas', () => {
  const { CatalogView } = createRuntime();
  assert.ok(CatalogView.availableLetters().size >= 18, `letras: ${[...CatalogView.availableLetters()].join('')}`);
});

test('El filtro de tipo ofrece todos los tipos presentes en el inventario', () => {
  const { CatalogView } = createRuntime();
  const types = CatalogView.availableTypes();
  for (const t of ['Agua', 'Dragón', 'Eléctrico', 'Fuego', 'Lucha', 'Planta', 'Psíquico']) {
    assert.ok(types.includes(t), `falta el tipo ${t}`);
  }
});
