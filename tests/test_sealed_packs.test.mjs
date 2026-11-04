/**
 * Sobres individuales: fotos de producto generadas con IA en assets/img/packs/
 * (WebP 800x1200) con un placeholder SVG como respaldo si falla la carga.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const PLACEHOLDER = 'assets/img/packs/placeholder-sobre.svg';
const PACK_IDS = [
  'booster-pack-base-1999',
  'booster-pack-fossil-1999',
  'booster-pack-team-rocket-1999',
  'booster-pack-151-2023',
  'booster-pack-prismatic-evolutions-2025'
];
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function loadProducts() {
  const sandbox = { console, window: undefined, module: undefined };
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js'), sandbox);
  vm.runInContext('globalThis.__out = PRODUCTS;', sandbox);
  return sandbox.__out;
}

test('Los 5 sobres existen como producto sellado con imágenes WebP en assets/img/packs/', () => {
  const products = loadProducts();
  for (const id of PACK_IDS) {
    const pack = products.find(p => p.id === id);
    assert.ok(pack, `${id} debe estar en el catálogo`);
    assert.equal(pack.tipo_discriminador, 'PRODUCTO_SELLADO');
    assert.equal(pack.categoria, 'sealed');
    assert.equal(pack.imagenLocal, `assets/img/packs/${id}-frontal.webp`);
    assert.deepEqual(Object.keys(pack.galeria_sellada), ['frontal']);
    for (const src of Object.values(pack.galeria_sellada)) {
      assert.match(src, /^assets\/img\/packs\/[a-z0-9-]+\.webp$/, `${id}: ${src}`);
    }
    assert.equal(pack.imagenFallbackUrl, PLACEHOLDER);
    assert.ok(pack.precioUnitario > 0 && pack.precios.sealed === pack.precioUnitario);
  }
});

test('El placeholder del sobre existe y los certificados no se repiten', () => {
  assert.ok(fs.statSync(path.join(ROOT, PLACEHOLDER)).size > 0);
  const certs = loadProducts().map(p => p.certNumber).filter(Boolean);
  assert.equal(new Set(certs).size, certs.length);
});

test('Cada sobre tiene su foto WebP ligera en disco', () => {
  for (const id of PACK_IDS) {
    const file = path.join(ROOT, 'assets/img/packs', `${id}-frontal.webp`);
    assert.ok(fs.existsSync(file), `${id}-frontal.webp debe existir`);
    assert.ok(fs.statSync(file).size < 300 * 1024, `${id}-frontal.webp debe pesar menos de 300 KB`);
  }
});

// Booster Box con fotos de producto generadas con IA (docs/prompts-gemini-booster-box.md)
const BOX_DIRS = {
  'booster-box-fossil-1999': 'booster-box-fossil-1999',
  'booster-box-base-1999': 'booster-box-base-1999',
  'booster-bundle-151-2023': 'booster-box-151-2023'
};

test('Las 3 Booster Box tienen los 4 ángulos en WebP y la perspectiva como foto principal', () => {
  const products = loadProducts();
  for (const [id, dir] of Object.entries(BOX_DIRS)) {
    const box = products.find(p => p.id === id);
    assert.ok(box, `${id} debe estar en el catálogo`);
    assert.equal(box.categoria, 'sealed');
    assert.deepEqual(Object.keys(box.galeria_sellada).sort(), ['frontal', 'lateral', 'perspectiva', 'superior']);
    assert.equal(box.imagenLocal, `assets/img/sealed/${dir}/perspectiva.webp`);
    for (const src of Object.values(box.galeria_sellada)) {
      assert.match(src, new RegExp(`^assets/img/sealed/${dir}/[a-z]+\.webp$`));
      const size = fs.statSync(path.join(ROOT, src)).size;
      assert.ok(size > 10 * 1024 && size < 300 * 1024, `${src} debe ser un WebP optimizado (${size} bytes)`);
    }
  }
});

test('Las Booster Box tienen precio, contenido y certificado propios', () => {
  const products = loadProducts();
  const boxes = Object.keys(BOX_DIRS).map(id => products.find(p => p.id === id));
  assert.equal(new Set(boxes.map(b => b.certNumber)).size, boxes.length);
  assert.equal(new Set(products.map(p => p.certNumber)).size, products.length, 'certificados únicos en todo el catálogo');
  for (const box of boxes) {
    assert.ok(box.precioUnitario > 0);
    assert.ok(box.detalles_sellados.cantidad_sobres_interior > 0);
    assert.equal(box.historialBase.length, 12);
  }
});
