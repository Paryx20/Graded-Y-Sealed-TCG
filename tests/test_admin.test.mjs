/**
 * Panel de inventario (pages/admin.html + js/views/admin.js + RPC de js/db/admin_rpc.sql).
 * Se prueba con un cliente Supabase simulado: el permiso real lo valida el servidor.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function element(id) {
  return {
    id, textContent: '', innerHTML: '', value: '', className: '', disabled: false,
    classList: { _s: new Set(), toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    focus() {}
  };
}

const PRODUCTS = [
  { sku: 'pikachu-1', nombre: 'Pikachu', categoria: 'raw', tipo: 'CARTA_INDIVIDUAL', set: 'Base', imagen: '', activo: true,
    grados: [{ grado: 'raw', precio: 10, stock: 5 }, { grado: 'psa8', precio: 16, stock: 1 }, { grado: 'psa9', precio: 24, stock: 2 }, { grado: 'psa10', precio: 45, stock: 2 }] },
  { sku: 'box-151', nombre: 'Booster Box 151', categoria: 'sealed', tipo: 'PRODUCTO_SELLADO', set: '151', imagen: '', activo: false,
    grados: [{ grado: 'sealed', precio: 300, stock: 3 }] }
];

function load(rpcImpl) {
  const calls = [];
  const elements = new Map();
  const sandbox = {
    console,
    sessionStorage: { _m: new Map(), getItem(k) { return this._m.get(k) ?? null; }, setItem(k, v) { this._m.set(k, v); }, removeItem(k) { this._m.delete(k); } },
    SupabaseConfig: {
      getClient: () => ({
        rpc: async (fn, args) => {
          calls.push({ fn, args });
          try { return { data: await rpcImpl(fn, args), error: null }; }
          catch (e) { return { data: null, error: { message: e.message } }; }
        }
      })
    },
    document: {
      getElementById: id => { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
      querySelector: () => null
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(read('js/db/supabase-api.js') + '\n;\n' + read('js/views/admin.js') +
    '\nglobalThis.__out = { SupabaseAPI, AdminView };', sandbox);
  return { ...sandbox.__out, calls, elements, sandbox };
}

test('Los métodos de admin llaman a las RPC correctas con el token', async () => {
  const { SupabaseAPI, calls } = load(async () => ({}));
  await SupabaseAPI.adminListProducts('tok');
  await SupabaseAPI.adminUpdateGrade('tok', 'pikachu-1', 'raw', 12.5, 4);
  await SupabaseAPI.adminSetActive('tok', 'pikachu-1', false);
  assert.deepEqual(calls.map(c => c.fn), ['admin_listar_productos', 'admin_actualizar_grado', 'admin_cambiar_activo']);
  assert.deepEqual({ ...calls[1].args }, { p_token: 'tok', p_sku: 'pikachu-1', p_grado: 'raw', p_precio: 12.5, p_stock: 4 });
  assert.deepEqual({ ...calls[2].args }, { p_token: 'tok', p_sku: 'pikachu-1', p_activo: false });
});

test('NO_AUTORIZADO del servidor se traduce y el panel vuelve al formulario', async () => {
  const { AdminView, elements, sandbox } = load(async (fn) => {
    if (fn === 'iniciar_sesion') return { nombre: 'Cliente', email: 'c@x.ec', cedula_ruc: '1', token_sesion: 'tok-cliente' };
    throw new Error('NO_AUTORIZADO');
  });
  const ok = await AdminView.login('c@x.ec', 'secreto123');
  assert.equal(ok, false);
  assert.equal(elements.get('admin-login-error').textContent, 'Acceso no autorizado.');
  assert.equal(AdminView.token, null);
  assert.equal(sandbox.sessionStorage.getItem('gstcg_admin'), null, 'el token se descarta');
  assert.ok(elements.get('admin-panel').classList.contains('hidden'), 'el panel queda oculto');
});

test('Un administrador ve el inventario completo, incluidos los ocultos', async () => {
  const { AdminView, elements } = load(async (fn) => {
    if (fn === 'iniciar_sesion') return { nombre: 'Admin', email: 'a@x.ec', cedula_ruc: '2', token_sesion: 'tok-admin' };
    if (fn === 'admin_listar_productos') return PRODUCTS;
    return null;
  });
  assert.equal(await AdminView.login('a@x.ec', 'secreto123'), true);
  const rows = elements.get('admin-rows').innerHTML;
  assert.ok(rows.includes('data-sku="pikachu-1"') && rows.includes('data-sku="box-151"'));
  assert.ok(rows.includes('Oculto'), 'muestra el estado oculto');
  assert.match(elements.get('admin-summary').textContent, /2 de 2 productos · 1 ocultos/);
});

test('Validación de precio y stock antes de enviar', () => {
  const { AdminView } = load(async () => null);
  assert.equal(AdminView.validateGrade('10.5', '3'), null);
  assert.match(AdminView.validateGrade('0', '3'), /precio/);
  assert.match(AdminView.validateGrade('', '3'), /precio/);
  assert.match(AdminView.validateGrade('5', '-1'), /stock/);
  assert.match(AdminView.validateGrade('5', '1.5'), /stock/);
});

test('Recalcular PSA desde Raw usa los multiplicadores de la tienda', () => {
  const { AdminView } = load(async () => null);
  assert.deepEqual({ ...AdminView.psaFromRaw(10) }, { psa8: 16, psa9: 24, psa10: 45 });
  assert.equal(AdminView.psaFromRaw('abc'), null);
});

test('Filtros del panel: búsqueda, categoría y stock bajo', () => {
  const { AdminView } = load(async () => null);
  AdminView.products = PRODUCTS;
  assert.equal(AdminView.filterProducts(PRODUCTS, { search: 'box', category: 'all', lowStock: false }).length, 1);
  assert.equal(AdminView.filterProducts(PRODUCTS, { search: '', category: 'sealed', lowStock: false })[0].sku, 'box-151');
  assert.deepEqual(AdminView.filterProducts(PRODUCTS, { search: '', category: 'all', lowStock: true }).map(p => p.sku), ['pikachu-1']);
});

test('La página del panel no está enlazada desde la tienda y no se indexa', () => {
  const html = read('pages/admin.html');
  assert.match(html, /<meta name="robots" content="noindex,nofollow/);
  assert.ok(!html.includes('js/app.js'), 'no carga la lógica de la tienda');
  const pages = ['index.html', ...fs.readdirSync(path.join(ROOT, 'pages')).filter(f => f.endsWith('.html') && f !== 'admin.html').map(f => `pages/${f}`)];
  for (const page of pages) assert.ok(!read(page).includes('admin.html'), `${page} no enlaza al panel`);
  for (const file of ['js/app.js', 'js/state.js']) assert.ok(!read(file).includes('admin.html'), `${file} no enlaza al panel`);
});

test('Las funciones SQL de admin exigen el rol en el servidor', () => {
  const sql = read('js/db/admin_rpc.sql');
  for (const fn of ['admin_listar_productos', 'admin_actualizar_grado', 'admin_cambiar_activo']) {
    const body = sql.slice(sql.indexOf(`function public.${fn}`));
    assert.ok(body.slice(0, 600).includes('_exigir_admin(p_token)'), `${fn} valida el rol`);
  }
  assert.match(sql, /rol = 'ADMIN'/);
  assert.match(sql, /revoke all on function public\._exigir_admin/);
  assert.ok(!/@[a-z0-9-]+\.[a-z]{2,}/i.test(sql.replace(/'<correo>'/, '')), 'no hay correos reales en el SQL');
});
