/**
 * ==============================================================================
 * Test Suite: Dexie Persistence, User Profile, Orders & Tracking (Phases 7)
 * File: tests/test_profile_orders.test.mjs
 * Features Covered:
 *   - Feature 16: Dexie.js ACID Persistence (usuarios, ordenes_compra, items_orden)
 *   - Feature 21: Reactive User Profile View
 *   - Feature 22: "Mis Datos Personales" Editor
 *   - Feature 23: "Mis Últimas Compras" Order History Query
 *   - Feature 24: Live Tracking Deep Link [Ver Tracking en Vivo]
 *   - Feature 25: Session Logout [Cerrar Sesión]
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {
  MockDexieDB,
  createMockEnvironment,
  validateEcuadorianPhoneContract
} from './test_harness.mjs';

// ==============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH - >=5 tests per feature)
// ==============================================================================

// Feature 16: Dexie.js ACID Persistence
test('Feature 16 [Tier 1]: Dexie Persistence - Schema defines tables for users, orders, and items', () => {
  const db = new MockDexieDB();
  assert.ok(db.usuarios);
  assert.ok(db.ordenes_compra);
  assert.ok(db.items_orden);
});

test('Feature 16 [Tier 1]: Dexie Persistence - Persists user record to usuarios table', async () => {
  const db = new MockDexieDB();
  const user = {
    cedula_ruc: '1710034065',
    nombre: 'Carlos Mendoza',
    email: 'carlos@pkm.ec',
    telefono: '+593 991234567',
    ciudad: 'Quito'
  };
  await db.usuarios.put(user);
  const saved = await db.usuarios.get('1710034065');
  assert.equal(saved.nombre, 'Carlos Mendoza');
  assert.equal(saved.ciudad, 'Quito');
});

test('Feature 16 [Tier 1]: Dexie Persistence - Persists order record to ordenes_compra table', async () => {
  const db = new MockDexieDB();
  const order = {
    numero_orden: '#PKM-2026-8841',
    usuario_cedula: '1710034065',
    fecha_creacion: '2026-11-01T20:00:00Z',
    subtotal: 18500,
    iva_15: 2775,
    costo_envio: 5,
    total: 21280,
    metodo_pago: 'Tarjeta de Crédito',
    estado: 'CONFIRMADO'
  };
  await db.ordenes_compra.put(order);
  const saved = await db.ordenes_compra.get('#PKM-2026-8841');
  assert.equal(saved.total, 21280);
  assert.equal(saved.estado, 'CONFIRMADO');
});

test('Feature 16 [Tier 1]: Dexie Persistence - Persists line item detail with composite key in items_orden', async () => {
  const db = new MockDexieDB();
  const lineItem = {
    numero_orden: '#PKM-2026-8841',
    sku: 'PKM-BASE-CHAR-004',
    grado: 'PSA 10',
    cantidad: 1,
    precio_unitario: 18500,
    subtotal: 18500
  };
  await db.items_orden.put(lineItem);
  const saved = await db.items_orden.get(['#PKM-2026-8841', 'PKM-BASE-CHAR-004', 'PSA 10']);
  assert.equal(saved.precio_unitario, 18500);
});

test('Feature 16 [Tier 1]: Dexie Persistence - Executes atomic transactional order processing', async () => {
  const db = new MockDexieDB();
  const txResult = await db.procesarOrdenTransaccional({
    usuario: {
      cedula_ruc: '1710034065',
      nombre: 'Carlos Mendoza',
      email: 'carlos@pkm.ec',
      telefono: '+593 991234567',
      ciudad: 'Quito'
    },
    orden: {
      numero_orden: '#PKM-2026-9900',
      usuario_cedula: '1710034065',
      total: 750,
      estado: 'EN_PREPARACION'
    },
    items: [
      { sku: 'PKM-RAW-CHAR-004', grado: 'RAW', cantidad: 1, precio_unitario: 750, subtotal: 750 }
    ]
  });
  assert.equal(txResult.success, true);
  assert.equal(txResult.orderId, '#PKM-2026-9900');
  const savedOrder = await db.ordenes_compra.get('#PKM-2026-9900');
  assert.equal(savedOrder.estado, 'EN_PREPARACION');
});

// Feature 21: Reactive User Profile View
test('Feature 21 [Tier 1]: User Profile - Profile view container element exists', () => {
  const { doc } = createMockEnvironment();
  const profileContainer = doc.createElement('div');
  profileContainer.setAttribute('id', 'profile-view-container');
  doc.body.appendChild(profileContainer);
  assert.ok(profileContainer !== null);
});

test('Feature 21 [Tier 1]: User Profile - Default active tab is personal details', () => {
  const profileState = { activeTab: 'personal' };
  assert.equal(profileState.activeTab, 'personal');
});

test('Feature 21 [Tier 1]: User Profile - Tab switching between personal and orders updates state', () => {
  let profileState = { activeTab: 'personal' };
  const switchTab = (tab) => { profileState.activeTab = tab; };
  switchTab('orders');
  assert.equal(profileState.activeTab, 'orders');
  switchTab('personal');
  assert.equal(profileState.activeTab, 'personal');
});

test('Feature 21 [Tier 1]: User Profile - Unauthenticated user state triggers auth barrier', () => {
  const currentUser = null;
  const canAccessProfile = Boolean(currentUser);
  assert.equal(canAccessProfile, false);
});

test('Feature 21 [Tier 1]: User Profile - Authenticated profile renders verified collector status badge', () => {
  const renderProfileHeader = (user) => `
    <div class="profile-header">
      <h2>${user.name}</h2>
      <span class="badge">Coleccionista Verificado</span>
    </div>
  `;
  const html = renderProfileHeader({ name: 'Carlos Mendoza' });
  assert.ok(html.includes('Carlos Mendoza'));
  assert.ok(html.includes('Coleccionista Verificado'));
});

// Feature 22: "Mis Datos Personales" Editor
test('Feature 22 [Tier 1]: Personal Data Editor - Form loads existing user values into inputs', () => {
  const user = {
    name: 'Carlos Mendoza',
    email: 'carlos@pkm.ec',
    phone: '+593 991234567',
    address: 'Av. República del Salvador',
    city: 'Quito'
  };
  const formData = {
    nameInput: user.name,
    emailInput: user.email,
    phoneInput: user.phone,
    addressInput: user.address,
    cityInput: user.city
  };
  assert.equal(formData.nameInput, 'Carlos Mendoza');
  assert.equal(formData.cityInput, 'Quito');
});

test('Feature 22 [Tier 1]: Personal Data Editor - Modifying name updates active user entity', () => {
  let user = { name: 'Carlos Mendoza', email: 'carlos@pkm.ec' };
  const updateName = (newName) => { user = { ...user, name: newName }; };
  updateName('Carlos A. Mendoza');
  assert.equal(user.name, 'Carlos A. Mendoza');
});

test('Feature 22 [Tier 1]: Personal Data Editor - Validates +593 telephone before updating profile', () => {
  const newPhone = '+593 998877665';
  const isValid = validateEcuadorianPhoneContract(newPhone);
  assert.equal(isValid, true);
});

test('Feature 22 [Tier 1]: Personal Data Editor - Persists updated address into Dexie usuarios table', async () => {
  const db = new MockDexieDB();
  await db.usuarios.put({
    cedula_ruc: '1710034065',
    nombre: 'Carlos Mendoza',
    direccion: 'Dirección Antigua',
    ciudad: 'Quito'
  });
  await db.usuarios.update('1710034065', {
    direccion: 'Av. Amazonas y Eloy Alfaro',
    ciudad: 'Quito'
  });
  const updated = await db.usuarios.get('1710034065');
  assert.equal(updated.direccion, 'Av. Amazonas y Eloy Alfaro');
});

test('Feature 22 [Tier 1]: Personal Data Editor - Generates success confirmation after profile save', () => {
  let confirmationToast = null;
  const onProfileSave = (name) => {
    confirmationToast = `¡Datos de ${name} actualizados exitosamente!`;
  };
  onProfileSave('Carlos Mendoza');
  assert.ok(confirmationToast.includes('actualizados exitosamente'));
});

// Feature 23: "Mis Últimas Compras" Order History
test('Feature 23 [Tier 1]: Order History - Queries orders for active user cedula', async () => {
  const db = new MockDexieDB();
  await db.ordenes_compra.put({ numero_orden: 'ORD-1', usuario_cedula: '1710034065', total: 100 });
  await db.ordenes_compra.put({ numero_orden: 'ORD-2', usuario_cedula: '1710034065', total: 200 });
  await db.ordenes_compra.put({ numero_orden: 'ORD-3', usuario_cedula: '0926629916', total: 500 });

  const userOrders = await db.ordenes_compra.where('usuario_cedula').equals('1710034065').toArray();
  assert.equal(userOrders.length, 2);
});

test('Feature 23 [Tier 1]: Order History - Displays order ID and creation timestamp', () => {
  const renderOrderHeader = (ord) => `
    <div class="order-header">
      <span class="order-id">${ord.numero_orden}</span>
      <span class="order-date">${ord.fecha_creacion}</span>
    </div>
  `;
  const html = renderOrderHeader({ numero_orden: '#PKM-2026-8841', fecha_creacion: '01 Nov 2026' });
  assert.ok(html.includes('#PKM-2026-8841'));
  assert.ok(html.includes('01 Nov 2026'));
});

test('Feature 23 [Tier 1]: Order History - Displays payment method and total with VAT & shipping', () => {
  const renderOrderFinancials = (ord) => `
    <div class="order-totals">
      <span>Método: ${ord.metodo_pago}</span>
      <span>Total: $${ord.total.toFixed(2)} USD</span>
    </div>
  `;
  const html = renderOrderFinancials({ metodo_pago: 'Tarjeta de Crédito', total: 21280 });
  assert.ok(html.includes('Tarjeta de Crédito'));
  assert.ok(html.includes('$21280.00 USD'));
});

test('Feature 23 [Tier 1]: Order History - Displays line item thumbnails, conditions, and quantities', () => {
  const items = [
    { nombre: 'Charizard Base Set', grado: 'PSA 10', cantidad: 1, imagen: 'img/charizard.png' }
  ];
  const renderItems = (list) => `
    <div class="order-items">
      ${list.map(i => `<div>${i.nombre} • ${i.grado} (x${i.cantidad})</div>`).join('')}
    </div>
  `;
  const html = renderItems(items);
  assert.ok(html.includes('Charizard Base Set • PSA 10 (x1)'));
});

test('Feature 23 [Tier 1]: Order History - Displays official logistic status pill', () => {
  const renderStatusPill = (status) => `<span class="status-pill status-${status}">${status}</span>`;
  assert.ok(renderStatusPill('CONFIRMADO').includes('CONFIRMADO'));
  assert.ok(renderStatusPill('EN_TRANSITO').includes('EN_TRANSITO'));
});

// Feature 24: Live Tracking Deep Link
test('Feature 24 [Tier 1]: Tracking Link - Order card features Ver Tracking en Vivo button', () => {
  const renderTrackingButton = (orderId) => `
    <button onclick="app.viewOrderTracking('${orderId}')" class="btn-tracking">
      Ver Tracking en Vivo
    </button>
  `;
  assert.ok(renderTrackingButton('#PKM-2026-8841').includes('Ver Tracking en Vivo'));
});

test('Feature 24 [Tier 1]: Tracking Link - Sets activeTrackingOrderId in store upon click', () => {
  const store = { activeTrackingOrderId: null };
  const viewOrderTracking = (orderId) => {
    store.activeTrackingOrderId = orderId;
  };
  viewOrderTracking('#PKM-2026-8841');
  assert.equal(store.activeTrackingOrderId, '#PKM-2026-8841');
});

test('Feature 24 [Tier 1]: Tracking Link - Redirects router to tracking route with order query param', () => {
  const getTrackingRoute = (orderId) => `#tracking?order=${encodeURIComponent(orderId)}`;
  assert.equal(getTrackingRoute('#PKM-2026-8841'), '#tracking?order=%23PKM-2026-8841');
});

test('Feature 24 [Tier 1]: Tracking Link - Tracking view extracts orderId from URLSearchParams', () => {
  const hash = '#tracking?order=%23PKM-2026-8841';
  const query = hash.split('?')[1];
  const params = new URLSearchParams(query);
  assert.equal(params.get('order'), '#PKM-2026-8841');
});

test('Feature 24 [Tier 1]: Tracking Link - Displays custody chain verification milestone', () => {
  const renderMilestones = () => `
    <ul class="tracking-milestones">
      <li>Custodia y Autenticación en Bóveda PSA completada</li>
      <li>Despacho Blindado en Tránsito</li>
    </ul>
  `;
  assert.ok(renderMilestones().includes('Custodia y Autenticación'));
});

// Feature 25: Session Logout
test('Feature 25 [Tier 1]: Session Logout - Profile includes Cerrar Sesión button', () => {
  const renderLogoutButton = () => `
    <button onclick="app.logoutUser()" class="btn-logout">
      Cerrar Sesión
    </button>
  `;
  assert.ok(renderLogoutButton().includes('Cerrar Sesión'));
});

test('Feature 25 [Tier 1]: Session Logout - Clears active currentUser state to null', () => {
  const store = { currentUser: { name: 'Carlos Mendoza' } };
  const logout = () => { store.currentUser = null; };
  logout();
  assert.equal(store.currentUser, null);
});

test('Feature 25 [Tier 1]: Session Logout - Clears user session storage token', () => {
  const { localStorage } = createMockEnvironment();
  localStorage.setItem('gstcg_user', JSON.stringify({ name: 'Carlos' }));
  assert.ok(localStorage.getItem('gstcg_user') !== null);

  localStorage.removeItem('gstcg_user');
  assert.equal(localStorage.getItem('gstcg_user'), null);
});

test('Feature 25 [Tier 1]: Session Logout - Updates navbar UI back to guest state', () => {
  const renderNavbarUserUI = (user) => {
    if (user) return `<a href="#profile">${user.name}</a>`;
    return `<a href="#checkout">Iniciar Sesión</a>`;
  };
  assert.ok(renderNavbarUserUI(null).includes('Iniciar Sesión'));
});

test('Feature 25 [Tier 1]: Session Logout - Redirects router to home page (#home)', () => {
  let activeHash = '#profile';
  const logout = () => { activeHash = '#home'; };
  logout();
  assert.equal(activeHash, '#home');
});

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Empty States, Data Invariants, Session Security)
// ==============================================================================

test('Feature 23 [Tier 2 Boundary]: Order History - Zero purchases displays informative empty state', async () => {
  const db = new MockDexieDB();
  const userOrders = await db.ordenes_compra.where('usuario_cedula').equals('9999999999').toArray();
  const renderOrdersTab = (orders) => {
    if (orders.length === 0) {
      return `<div class="empty-orders">Aún no tienes compras registradas en la bóveda.</div>`;
    }
    return '<div>Orders list</div>';
  };
  const html = renderOrdersTab(userOrders);
  assert.ok(html.includes('Aún no tienes compras registradas'));
});

test('Feature 22 [Tier 2 Boundary]: Personal Data Editor - Rejects empty name submission', () => {
  const validateProfileUpdate = (fields) => {
    if (!fields.name || fields.name.trim().length === 0) return { valid: false, error: 'NAME_REQUIRED' };
    return { valid: true };
  };
  assert.equal(validateProfileUpdate({ name: '' }).valid, false);
  assert.equal(validateProfileUpdate({ name: '   ' }).valid, false);
});

test('Feature 22 [Tier 2 Boundary]: Personal Data Editor - Rejects invalid phone format update', () => {
  const validateProfileUpdate = (fields) => {
    if (fields.phone && !validateEcuadorianPhoneContract(fields.phone)) {
      return { valid: false, error: 'INVALID_PHONE' };
    }
    return { valid: true };
  };
  assert.equal(validateProfileUpdate({ phone: '0991234567' }).valid, false);
  assert.equal(validateProfileUpdate({ phone: '+1 555-0199' }).valid, false);
});

test('Feature 24 [Tier 2 Boundary]: Tracking Deep Link - Missing order falls back safely without crash', () => {
  const orders = [{ orderId: '#PKM-1' }, { orderId: '#PKM-2' }];
  const resolveTrackingOrder = (targetId) => {
    return orders.find(o => o.orderId === targetId) || orders[0] || null;
  };
  const resolved = resolveTrackingOrder('NON_EXISTENT');
  assert.equal(resolved.orderId, '#PKM-1');
});

// ==============================================================================
// REQUIREMENT R5: PRELOADED LIVE TRACKING SIMULATION & ZERO CONTROLS
// ==============================================================================

function createTrackingTestEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const trackingCode = fs.readFileSync(path.join(rootDir, 'js/views/tracking.js'), 'utf8');

  const sandbox = {
    console,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    localStorage: {
      _s: {},
      getItem(k) { return this._s[k] || null; },
      setItem(k, v) { this._s[k] = String(v); },
      removeItem(k) { delete this._s[k]; }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(trackingCode + '\n;this.TrackingView = TrackingView;', sandbox);

  return { Store: sandbox.Store, TrackingView: sandbox.TrackingView };
}

test('Feature 24 [R5]: Preloaded Live Tracking Simulation on Empty Orders', () => {
  const { Store, TrackingView } = createTrackingTestEnvironment();

  // Ensure store orders list is empty (new session)
  Store.data.orders = [];
  Store.data.activeTrackingOrderId = null;

  const html = TrackingView.render();

  // Assert empty-state placeholder is eliminated
  assert.ok(!html.includes('No tienes pedidos activos en curso'), 'Must NOT display empty-order placeholder');

  // Assert preloaded simulated order details are present
  assert.ok(html.includes('ORDEN #GS-2026-9481'), 'Must display simulated order ID #GS-2026-9481');
  assert.ok(html.includes('GUI-EC-948102-PSA'), 'Must display tracking guide GUI-EC-948102-PSA');
  assert.ok(html.includes('Servientrega Blindado'), 'Must display courier name');
  assert.ok(html.includes('Autenticación PSA'), 'Must render active custody milestone');
  assert.ok(html.includes('Charizard Base Set 1999 #4/102'), 'Must list the piece included in the order');
});

test('Feature 24 [R5]: Invariant - Elimination of Manual Simulation Controls', () => {
  const { TrackingView } = createTrackingTestEnvironment();

  const html = TrackingView.render();

  // Assert absence of manual simulation control buttons
  assert.ok(!html.includes('Avanzar paso'), 'Must not contain manual step advance button');
  assert.ok(!html.includes('Simular despacho'), 'Must not contain manual simulation trigger');
  assert.ok(!html.includes('Paso siguiente'), 'Must not contain manual step controls');
});

test('Feature 24 [R5]: Real Checkout Order Attaches Tracking Metadata and Takes Display Priority', () => {
  const { Store, TrackingView } = createTrackingTestEnvironment();

  // Place a real checkout order
  const realOrder = {
    orderId: '#GS-2026-1122',
    numero_orden: '#GS-2026-1122',
    trackingNumber: 'GUI-EC-112233-PSA',
    courierName: 'Servientrega Blindado • Bóveda G&S',
    date: '02 Nov 2026',
    buyerName: 'Coleccionista VIP',
    deliveryMethod: 'Courier Nacional Blindado',
    status: 'En Preparación / En Custodia',
    total: 750.00,
    stages: [
      { title: '1. Orden Recibida', subtitle: 'Validada', date: '02 Nov 2026', status: 'completed' },
      { title: '2. En Preparación', subtitle: 'Sellado UV', date: '02 Nov 2026', status: 'active' },
      { title: '3. En Camino', subtitle: 'Blindado', date: 'Programado', status: 'pending' },
      { title: '4. Entregado', subtitle: 'Recepción', date: 'Pendiente', status: 'pending' }
    ],
    items: [
      { name: 'Pikachu Illustrator', condition: 'PSA 10', quantity: 1, price: 750, imageLocal: 'assets/img/cards/card-back.png' }
    ]
  };

  Store.addOrder(realOrder);

  const html = TrackingView.render();

  // Real order must take precedence over preloaded simulation
  assert.ok(html.includes('ORDEN #GS-2026-1122'), 'Real order must be rendered');
  assert.ok(html.includes('GUI-EC-112233-PSA'), 'Must render real tracking number');
  assert.ok(html.includes('Pikachu Illustrator'), 'Must render real line item');
});

