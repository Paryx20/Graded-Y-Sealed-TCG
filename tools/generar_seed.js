/**
 * Genera js/db/seed_catalogo.sql a partir del catálogo de js/data.js, para que
 * la base de datos y la web tengan exactamente los mismos productos.
 *
 * Uso (desde la raíz del proyecto):  node tools/generar_seed.js
 *
 * Para añadir productos nuevos a una base que ya tiene datos (sin pisar el inventario):
 *   node tools/generar_seed.js --solo id1,id2 --salida js/db/seed-nuevos.sql
 * genera solo esos productos con "on conflict do nothing".
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
global.window = global;
eval(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';global.__PRODUCTS = PRODUCTS;');
const argValue = flag => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const only = (argValue('--solo') || '').split(',').map(x => x.trim()).filter(Boolean);
const outFile = argValue('--salida') || 'js/db/seed_catalogo.sql';
const products = only.length ? global.__PRODUCTS.filter(p => only.includes(p.id)) : global.__PRODUCTS;
if (only.length && products.length !== only.length) {
  const missing = only.filter(id => !products.some(p => p.id === id));
  throw new Error('No existen en js/data.js: ' + missing.join(', '));
}
const tail = only.length ? '\non conflict do nothing;' : ';';

// Stock inicial de la bóveda por grado
const STOCK = { raw: 6, psa8: 3, psa9: 2, psa10: 2, sealed: 2, sobre: 5 };
// Historial de 12 meses: dic-2025 a nov-2026
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2025, 11 + i, 1));
  return d.toISOString().slice(0, 10);
});

const q = v => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isSealed = p => p.tipo_discriminador === 'PRODUCTO_SELLADO' || p.categoria === 'sealed' || p.condicionPrincipal === 'sealed';
const localExists = img => img && !/^https?:/.test(img) && fs.existsSync(path.join(ROOT, img));
const image = p => (localExists(p.imagenLocal) ? p.imagenLocal : (/^https?:/.test(p.imagenFallbackUrl || '') ? p.imagenFallbackUrl : p.imagenLocal));

const sets = new Map();
products.forEach(p => {
  const year = parseInt((p.set.match(/(19|20)\d{2}/) || ['2024'])[0], 10);
  sets.set(slug(p.set), { name: p.set, era: p.era === 'vintage' ? 'vintage' : 'modern', year });
});

const out = [];
out.push('-- Generado por tools/generar_seed.js a partir de js/data.js. No editar a mano.');
out.push('');
if (!only.length) out.push(`insert into categorias_producto (slug_categoria, nombre_categoria, descripcion, orden) values
  ('psa', 'Slabs certificados PSA', 'Cartas encapsuladas y graduadas por PSA', 1),
  ('raw', 'Cartas raw', 'Cartas sin graduar en condición Near Mint', 2),
  ('sealed', 'Sellados', 'Cajas y sobres sellados de fábrica', 3);`);
if (!only.length) out.push('');
out.push('insert into sets_expansiones (codigo_set, nombre_set, era, anio_lanzamiento) values');
out.push([...sets].map(([code, s]) => `  (${q(code)}, ${q(s.name)}, ${q(s.era)}, ${s.year})`).join(',\n') + tail);
out.push('');

const prodRows = [];
const cardRows = [];
const sealedRows = [];
const gradeRows = [];
const historyRows = [];

products.forEach(p => {
  const sealed = isSealed(p);
  const category = sealed ? 'sealed' : (p.categoria === 'raw' ? 'raw' : 'psa');
  prodRows.push(`  (${q(p.id)}, ${q(p.nombre)}, '${sealed ? 'PRODUCTO_SELLADO' : 'CARTA_INDIVIDUAL'}', '${category}', ${q(slug(p.set))}, ${q(p.descripcion)}, ${q(image(p))}, ${p.rendimientoAnual || 'null'})`);

  if (sealed) {
    const d = p.detalles_sellados || {};
    sealedRows.push(`  (${q(p.id)}, ${d.gramaje_gramos || 'null'}, ${d.cantidad_sobres_interior || 1}, true, ${d.es_pesado_verificado ? 'true' : 'false'}, ${q(d.estado || 'Sellado de fábrica')})`);
    const price = p.precioUnitario || p.precios.sealed;
    gradeRows.push(`  (${q(p.id)}, 'sealed', null, ${price}, ${p.esSobre ? STOCK.sobre : STOCK.sealed})`);
    (p.historialBase || []).forEach((ratio, i) => historyRows.push(`  (${q(p.id)}, 'sealed', '${MONTHS[i]}', ${(price * ratio).toFixed(2)})`));
  } else {
    const number = (p.nombre.match(/#(\S+)/) || [])[1] || null;
    cardRows.push(`  (${q(p.id)}, ${q(number)}, ${q(p.rareza)}, ${q(p.tipo)})`);
    const cert = parseInt(p.certNumber, 10);
    const certs = { psa10: cert, psa9: cert + 100, psa8: cert + 200 };
    ['raw', 'psa8', 'psa9', 'psa10'].forEach(g => {
      if (!p.precios[g]) return;
      gradeRows.push(`  (${q(p.id)}, '${g}', ${certs[g] ? q(String(certs[g])) : 'null'}, ${p.precios[g]}, ${STOCK[g]})`);
    });
    (p.historialBase || []).forEach((ratio, i) => historyRows.push(`  (${q(p.id)}, 'psa10', '${MONTHS[i]}', ${(p.precios.psa10 * ratio).toFixed(2)})`));
  }
});

// Solo se escriben las secciones con filas; con --solo cada insert ignora lo que ya existe
function section(header, rows) {
  if (!rows.length) return;
  out.push(header);
  out.push(rows.join(',\n') + tail);
  out.push('');
}
section('insert into productos (sku, nombre, tipo_discriminador, slug_categoria, codigo_set, descripcion, imagen_url, rendimiento_anual) values', prodRows);
section('insert into detalles_cartas (producto_sku, numero_carta, rareza, tipo_energia) values', cardRows);
section('insert into detalles_sellados (producto_sku, gramaje_gramos, cantidad_sobres_interior, tiene_celofan, es_pesado_verificado, estado_sellado) values', sealedRows);
section('insert into certificaciones_psa (producto_sku, grado, numero_certificacion, precio, stock_disponible) values', gradeRows);
section('insert into historial_precios (producto_sku, grado, mes, precio_usd) values', historyRows);

fs.writeFileSync(path.join(ROOT, outFile), out.join('\n'));
console.log(`${outFile}: ${products.length} productos, ${gradeRows.length} grados, ${historyRows.length} precios históricos`);
