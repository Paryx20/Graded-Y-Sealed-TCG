/**
 * Imágenes de cartas: URL real de images.pokemontcg.io, carga diferida,
 * tamaño definido y respaldo local (card-back.png) si falla la descarga.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const FALLBACK = 'assets/img/cards/card-back.png';
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function loadGlobals(files, names) {
  const sandbox = { console, window: undefined, module: undefined };
  vm.createContext(sandbox);
  for (const f of files) vm.runInContext(read(f), sandbox);
  vm.runInContext(`globalThis.__out = { ${names.join(', ')} };`, sandbox);
  return sandbox.__out;
}

// Bloques <img ...> de una plantilla
const imgTags = code => code.match(/<img[\s\S]*?\/?>/g) || [];

test('Cada carta del catálogo usa una imagen de images.pokemontcg.io con respaldo local', () => {
  const { POKEMON_CARDS_CATALOG_10 } = loadGlobals(['js/data.js'], ['POKEMON_CARDS_CATALOG_10']);
  assert.equal(POKEMON_CARDS_CATALOG_10.length, 10);
  for (const card of POKEMON_CARDS_CATALOG_10) {
    assert.match(card.imagenLocal, /^https:\/\/images\.pokemontcg\.io\/[\w-]+\/\w+\.png$/, `${card.id}: imagen de la API`);
    assert.equal(card.imagenFallbackUrl, FALLBACK, `${card.id}: respaldo local`);
  }
  assert.ok(fs.statSync(path.join(ROOT, FALLBACK)).size > 0, 'card-back.png debe existir');
});

test('Ningún producto apunta a la carpeta img/ que ya no existe', () => {
  const { PRODUCTS, LEGACY_FIXTURE_PRODUCTS } = loadGlobals(['js/data.js'], ['PRODUCTS', 'LEGACY_FIXTURE_PRODUCTS']);
  const all = [...PRODUCTS, ...Object.values(LEGACY_FIXTURE_PRODUCTS)];
  for (const p of all) {
    assert.ok(!/^img\//.test(p.imagenLocal), `${p.id}: imagenLocal no debe empezar por img/`);
    assert.ok(!/^img\//.test(p.imagenFallbackUrl || ''), `${p.id}: imagenFallbackUrl no debe empezar por img/`);
  }
  assert.ok(!read('js/views/home.js').includes('src="img/'), 'home.js no debe usar rutas img/');
});

test('Las miniaturas de cartas cargan en diferido, con tamaño y respaldo', () => {
  const views = ['js/views/catalog.js', 'js/views/cart.js', 'js/views/profile.js', 'js/views/tracking.js', 'js/app.js'];
  for (const file of views) {
    const tags = imgTags(read(file));
    assert.ok(tags.length > 0, `${file} debe tener imágenes`);
    for (const tag of tags) {
      assert.ok(tag.includes('loading="lazy"'), `${file}: falta loading="lazy" en ${tag}`);
      assert.match(tag, /width="\d+"/, `${file}: falta width`);
      assert.match(tag, /height="\d+"/, `${file}: falta height`);
      assert.ok(tag.includes('this.onerror=null;'), `${file}: falta onerror con respaldo`);
    }
  }
});

test('La ficha de producto usa la versión _hires sin carga diferida', () => {
  const { PDPView } = loadGlobals(['js/views/pdp.js'], ['PDPView']);
  assert.equal(PDPView.hiresImage('https://images.pokemontcg.io/sv6/188.png'), 'https://images.pokemontcg.io/sv6/188_hires.png');
  assert.equal(PDPView.hiresImage('https://images.pokemontcg.io/sv6/188_hires.png'), 'https://images.pokemontcg.io/sv6/188_hires.png');
  assert.equal(PDPView.hiresImage('assets/img/packs/booster-team-rocket.png'), 'assets/img/packs/booster-team-rocket.png');

  const card = { id: 'x', nombre: 'Eevee', imagenLocal: 'https://images.pokemontcg.io/sv6/188.png', imagenFallbackUrl: FALLBACK };
  for (const mode of ['front', 'slab']) {
    const html = PDPView.renderInspectorStage(card, 'psa10', mode);
    assert.ok(html.includes('src="https://images.pokemontcg.io/sv6/188_hires.png"'), `${mode}: usa _hires`);
    assert.ok(html.includes('width="245"') && html.includes('height="342"'), `${mode}: tamaño definido`);
    assert.ok(html.includes(`this.src='${FALLBACK}'`), `${mode}: respaldo local`);
  }
});

test('Una bolsa guardada con rutas viejas recupera las imágenes del catálogo actual', () => {
  const saved = JSON.stringify([
    { id: 'gengar-scarlet-violet-psa10', imageLocal: 'assets/img/cards/gengar-holo-scarlet.png', imageFallback: 'assets/img/cards/gengar-holo-scarlet.png', quantity: 1 },
    { id: 'etb-crown-zenith', imageLocal: 'img/sealed/etb-crown-zenith.svg', imageFallback: 'img/sealed/etb-crown-zenith.svg', quantity: 1 },
    { id: 'api-card-raw', imageLocal: 'img/vieja.png', imageFallback: 'img/vieja.png', quantity: 1 }
  ]);
  const sandbox = {
    console,
    localStorage: { getItem: k => (k === 'gstcg_cart' ? saved : null), setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + '\n' + read('js/state.js') + '\nglobalThis.__Store = Store;', sandbox);
  const Store = sandbox.__Store;
  Store.init();
  const [gengar, etb, api] = Store.data.cart;
  assert.equal(gengar.imageLocal, 'https://images.pokemontcg.io/sv3pt5/94.png');
  assert.equal(gengar.imageFallback, FALLBACK);
  assert.equal(etb.imageLocal, 'assets/img/sealed/etb-crown-zenith/frontal.svg');
  assert.equal(api.imageLocal, FALLBACK);
});

test('Supabase solo sustituye la imagen de una carta por otra URL externa', () => {
  const code = read('js/state.js');
  assert.ok(code.includes("product.tipo_discriminador === 'CARTA_INDIVIDUAL'"));
  assert.ok(/\^https:\\\/\\\/.*row\.imagen_url/.test(code), 'debe exigir https:// para cartas');
});
