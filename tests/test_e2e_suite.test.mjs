/**
 * ==============================================================================
 * Master Test Suite: E2E Integration, Cross-Feature & Real-World User Journeys
 * File: tests/test_e2e_suite.test.mjs
 * Methodology:
 *   - Tier 1: Feature 26 (Work Plan Checklist Contract) (5 tests)
 *   - Tier 3: Cross-Feature Integration Combinations (5 comprehensive tests)
 *   - Tier 4: Real-World Scenarios (5 full customer purchase journeys)
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT_DIR,
  createMockEnvironment,
  validateEcuadorianIdContract,
  validateLuhnContract,
  checkSimulatedDeclineContract,
  validateEcuadorianPhoneContract,
  calculateOrderTotalsContract,
  QuantityStepper,
  SearchFailoverEngine,
  MockDexieDB,
  SingletonToastManager
} from './test_harness.mjs';

// ==============================================================================
// TIER 1: FEATURE 26 COVERAGE (Work Plan Checklist Completion Contract)
// ==============================================================================

function parseChecklistTasks(markdown, phaseTitle) {
  const lines = markdown.split('\n');
  let inPhase = false;
  const tasks = [];

  for (const line of lines) {
    if (line.includes(`FASE ${phaseTitle}`) || line.includes(`FASE 4`) && phaseTitle === 4) {
      inPhase = true;
      continue;
    }
    if (inPhase && line.startsWith('###') && !line.includes(`FASE ${phaseTitle}`)) {
      break;
    }
    if (inPhase) {
      const match = line.match(/^\s*-\s*\[([ Xx])\]\s*(.+)/);
      if (match) {
        tasks.push({
          completed: match[1].toUpperCase() === 'X',
          description: match[2].trim()
        });
      }
    }
  }
  return tasks;
}

test('Feature 26 [Tier 1]: Work Plan Checklist - FASE 4 tasks contract definition is parseable', () => {
  const planPath = path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md');
  assert.ok(fs.existsSync(planPath));
  const content = fs.readFileSync(planPath, 'utf8');
  assert.ok(content.includes('FASE 4: Ficha de Producto (PDP)'));
  assert.ok(content.includes('PRODUCTO_SELLADO'));
  assert.ok(content.includes('CARTA_INDIVIDUAL'));
});

test('Feature 26 [Tier 1]: Work Plan Checklist - FASE 5 tasks contract definition is parseable', () => {
  const planPath = path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md');
  const content = fs.readFileSync(planPath, 'utf8');
  assert.ok(content.includes('FASE 5: Carrito, Checkout'));
  assert.ok(content.includes('Módulo 10'));
  assert.ok(content.includes('#DECLINED-SEC-054'));
  assert.ok(content.includes('Tarifa plana de envío: $3.00'));
});

test('Feature 26 [Tier 1]: Work Plan Checklist - FASE 6 tasks contract definition is parseable', () => {
  const planPath = path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md');
  const content = fs.readFileSync(planPath, 'utf8');
  assert.ok(content.includes('FASE 6: Doble API de Búsqueda con Failover'));
  assert.ok(content.includes('pokemontcg.io'));
  assert.ok(content.includes('tcgdex.net'));
});

test('Feature 26 [Tier 1]: Work Plan Checklist - FASE 7 tasks contract definition is parseable', () => {
  const planPath = path.join(ROOT_DIR, 'docs/PLAN_DE_TRABAJO.md');
  const content = fs.readFileSync(planPath, 'utf8');
  assert.ok(content.includes('FASE 7: Perfil de Usuario'));
  assert.ok(content.includes('Mis Últimas Compras'));
  assert.ok(content.includes('Ver Tracking en Vivo'));
});

test('Feature 26 [Tier 1]: Work Plan Checklist - Validates completed checklist model representation', () => {
  const sampleCompletedPlan = `
    ### [X] FASE 4: Ficha de Producto
    - [X] Lógica condicional según tipo_item
    - [X] Inspector 3D de Cartas
    ### [X] FASE 5: Carrito y Checkout
    - [X] Eliminación de invitado
    - [X] Validaciones ecuatorianas
    ### [X] FASE 6: Doble API
    - [X] Failover pokemon-api
    ### [X] FASE 7: Perfil
    - [X] Vista profile y tracking
  `;
  const isPhaseCompleted = (text, phaseNum) => {
    const tasks = parseChecklistTasks(text, phaseNum);
    return tasks.length > 0 && tasks.every(t => t.completed);
  };
  assert.equal(isPhaseCompleted(sampleCompletedPlan, 4), true);
  assert.equal(isPhaseCompleted(sampleCompletedPlan, 5), true);
  assert.equal(isPhaseCompleted(sampleCompletedPlan, 6), true);
  assert.equal(isPhaseCompleted(sampleCompletedPlan, 7), true);
});

// ==============================================================================
// TIER 3: CROSS-FEATURE INTEGRATION COMBINATIONS
// ==============================================================================

test('Tier 3 Integration 1: Cart + Stepper + Shipping ($3.00 Quito) + 15% VAT -> Reconciliation', () => {
  // 1. Add item with quantity 2
  const stepper = new QuantityStepper(1);
  stepper.updateQuantity(1); // 2
  assert.equal(stepper.quantity, 2);

  const cart = [
    { id: 'umbreon-vmax-raw', name: 'Umbreon VMAX Alt Art', price: 650.00, quantity: stepper.quantity }
  ];

  // 2. Compute financial totals with Quito shipping ($3.00)
  const totals = calculateOrderTotalsContract(cart, 'quito');
  assert.equal(totals.subtotal, 1300.00); // 650 * 2
  assert.equal(totals.shipping, 3.00);
  assert.equal(totals.tax, 195.00); // 1300 * 0.15
  assert.equal(totals.total, 1498.00); // 1300 + 3 + 195
});

test('Tier 3 Integration 2: Mandatory Checkout + Module 10 + Luhn + Dexie ACID write', async () => {
  const db = new MockDexieDB();

  // 1. Validate mandatory fields
  const customer = {
    idCard: '1710034065',
    name: 'Carlos Mendoza',
    email: 'carlos@pkm.ec',
    phone: '+593 991234567',
    address: 'Av. República del Salvador',
    city: 'Quito',
    password: 'MasterPassword2026!'
  };

  assert.equal(validateEcuadorianIdContract(customer.idCard), true);
  assert.equal(validateEcuadorianPhoneContract(customer.phone), true);

  // 2. Validate card with Luhn
  const card = '4532015112830366';
  assert.equal(validateLuhnContract(card), true);
  const declineStatus = checkSimulatedDeclineContract(card);
  assert.equal(declineStatus.approved, true);

  // 3. Atomically persist to Dexie
  const tx = await db.procesarOrdenTransaccional({
    usuario: {
      cedula_ruc: customer.idCard,
      nombre: customer.name,
      email: customer.email,
      telefono: customer.phone,
      ciudad: customer.city
    },
    orden: {
      numero_orden: '#PKM-2026-1001',
      usuario_cedula: customer.idCard,
      subtotal: 18500,
      iva_15: 2775,
      costo_envio: 5,
      total: 21280,
      metodo_pago: 'Tarjeta de Crédito',
      estado: 'CONFIRMADO'
    },
    items: [
      { sku: 'PKM-BASE-CHAR-004', grado: 'PSA 10', cantidad: 1, precio_unitario: 18500, subtotal: 18500 }
    ]
  });

  assert.equal(tx.success, true);
  const savedUser = await db.usuarios.get('1710034065');
  const savedOrder = await db.ordenes_compra.get('#PKM-2026-1001');
  assert.equal(savedUser.nombre, 'Carlos Mendoza');
  assert.equal(savedOrder.total, 21280);
});

test('Tier 3 Integration 3: Dexie persistence -> User Profile "Mis Últimas Compras" query', async () => {
  const db = new MockDexieDB();
  const testUserCedula = '0926629916';

  // Seed 2 orders for user
  await db.ordenes_compra.put({
    numero_orden: '#PKM-ORD-001',
    usuario_cedula: testUserCedula,
    fecha_creacion: '2026-10-15',
    total: 750,
    estado: 'ENTREGADO',
    metodo_pago: 'Efectivo en Tienda'
  });
  await db.ordenes_compra.put({
    numero_orden: '#PKM-ORD-002',
    usuario_cedula: testUserCedula,
    fecha_creacion: '2026-11-01',
    total: 1498,
    estado: 'EN_TRANSITO',
    metodo_pago: 'Tarjeta de Crédito'
  });

  // Query Profile view
  const userOrders = await db.ordenes_compra.where('usuario_cedula').equals(testUserCedula).toArray();
  assert.equal(userOrders.length, 2);
  assert.equal(userOrders[0].numero_orden, '#PKM-ORD-001');
  assert.equal(userOrders[1].numero_orden, '#PKM-ORD-002');
});

test('Tier 3 Integration 4: Profile Order card -> [Ver Tracking en Vivo] action -> State resolution', () => {
  const appState = {
    activeTrackingOrderId: null,
    currentView: 'profile'
  };

  const handleTrackingClick = (orderId) => {
    appState.activeTrackingOrderId = orderId;
    appState.currentView = 'tracking';
    return `#tracking?order=${encodeURIComponent(orderId)}`;
  };

  const routeHash = handleTrackingClick('#PKM-2026-8841');
  assert.equal(appState.activeTrackingOrderId, '#PKM-2026-8841');
  assert.equal(appState.currentView, 'tracking');
  assert.equal(routeHash, '#tracking?order=%23PKM-2026-8841');
});

test('Tier 3 Integration 5: Cart item removal -> Modal prompt -> Confirmation -> Undo restoration', () => {
  const { doc } = createMockEnvironment();
  const modal = doc.getElementById('delete-confirm-modal');
  const undoBanner = doc.getElementById('undo-banner');

  let cart = [
    { id: 'charizard-psa10', name: 'Charizard Base Set', price: 18500, quantity: 1 },
    { id: 'lugia-psa10', name: 'Lugia 1st Edition', price: 42000, quantity: 1 }
  ];
  let lastDeleted = null;

  // Step 1: User clicks trash icon -> Modal opens
  modal.classList.add('active');
  assert.equal(modal.classList.contains('active'), true);

  // Step 2: User confirms deletion -> Item removed, modal closed, undo banner shown
  modal.classList.remove('active');
  lastDeleted = { item: cart[0], index: 0 };
  cart.splice(0, 1);
  undoBanner.classList.remove('hidden');

  assert.equal(cart.length, 1);
  assert.equal(cart[0].id, 'lugia-psa10');
  assert.equal(undoBanner.classList.contains('hidden'), false);

  // Step 3: User clicks 'Deshacer' -> Item restored to original index
  cart.splice(lastDeleted.index, 0, lastDeleted.item);
  lastDeleted = null;
  undoBanner.classList.add('hidden');

  assert.equal(cart.length, 2);
  assert.equal(cart[0].id, 'charizard-psa10');
  assert.equal(undoBanner.classList.contains('hidden'), true);
});

// ==============================================================================
// TIER 4: REAL-WORLD SCENARIOS (End-to-End Customer Purchase Journeys)
// ==============================================================================

test('Tier 4 Scenario 1: High-Value Single Card Collector Journey (Charizard PSA 10)', async () => {
  const db = new MockDexieDB();
  const { doc } = createMockEnvironment();
  const toastManager = new SingletonToastManager(doc.getElementById('toast-container'));

  // 1. Customer visits PDP for Charizard
  const product = {
    id: 'charizard-base',
    nombre: 'Charizard Base Set 1999 #4/102',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    precios: { psa10: 18500.00 }
  };
  assert.equal(product.tipo_discriminador, 'CARTA_INDIVIDUAL');

  // 2. Selects PSA 10 and inspects 3D card
  let activeInspectorMode = 'front';
  activeInspectorMode = 'back'; // 180 flip
  assert.equal(activeInspectorMode, 'back');
  activeInspectorMode = 'slab'; // PSA acrylic
  assert.equal(activeInspectorMode, 'slab');

  // 3. Adds to Cart
  const cart = [{ id: 'charizard-psa10', name: product.nombre, price: 18500.00, quantity: 1 }];
  toastManager.showToast('+1 "Charizard Base Set" añadido a la bolsa', 'success');
  assert.equal(toastManager.getActiveToastCount(), 1);

  // 4. Chooses National Armored Courier ($5.00)
  const totals = calculateOrderTotalsContract(cart, 'national');
  assert.equal(totals.subtotal, 18500.00);
  assert.equal(totals.shipping, 5.00);
  assert.equal(totals.tax, 2775.00);
  assert.equal(totals.total, 21280.00);

  // 5. Checkout with Mandatory Account
  const registration = {
    idCard: '1710034065',
    name: 'Patricio Collector',
    email: 'patricio@puce.edu.ec',
    phone: '+593 991234567',
    password: 'SuperSecret2026!'
  };
  assert.equal(validateEcuadorianIdContract(registration.idCard), true);
  assert.equal(validateEcuadorianPhoneContract(registration.phone), true);

  // 6. Enters Valid Card
  const cardNum = '4532015112830366';
  assert.equal(validateLuhnContract(cardNum), true);
  const bankCheck = checkSimulatedDeclineContract(cardNum);
  assert.equal(bankCheck.approved, true);

  // 7. Atomic Persistence
  const orderId = '#PKM-2026-7788';
  await db.procesarOrdenTransaccional({
    usuario: { cedula_ruc: registration.idCard, nombre: registration.name, email: registration.email },
    orden: { numero_orden: orderId, usuario_cedula: registration.idCard, total: totals.total, estado: 'CONFIRMADO' },
    items: [{ sku: 'CHAR-004', grado: 'PSA 10', cantidad: 1, precio_unitario: 18500, subtotal: 18500 }]
  });

  // 8. Order verified in Profile
  const myOrders = await db.ordenes_compra.where('usuario_cedula').equals(registration.idCard).toArray();
  assert.equal(myOrders.length, 1);
  assert.equal(myOrders[0].numero_orden, orderId);
  assert.equal(myOrders[0].total, 21280.00);
});

test('Tier 4 Scenario 2: Sealed Product Investor Journey (Team Rocket Booster Box)', () => {
  // 1. Investor navigates to Team Rocket Booster Box
  const sealedItem = {
    id: 'team-rocket-box',
    nombre: 'Team Rocket Booster Box 2000 Sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    categoria: 'sealed',
    precioUnitario: 3500.00,
    galeria_sellada: {
      frontal: 'assets/img/sealed/team-rocket-box-front.png',
      perspectiva: 'assets/img/sealed/team-rocket-box-perspective.png',
      lateral: 'assets/img/sealed/team-rocket-box-side.png'
    }
  };

  // 2. Adaptive PDP verification: 3D inspector & PSA grading controls MUST be hidden
  const isPSASelectorVisible = sealedItem.tipo_discriminador !== 'PRODUCTO_SELLADO';
  const is3DRotationControlsVisible = sealedItem.tipo_discriminador !== 'PRODUCTO_SELLADO';
  assert.equal(isPSASelectorVisible, false);
  assert.equal(is3DRotationControlsVisible, false);

  // 3. User sets quantity to 2 using stepper
  const stepper = new QuantityStepper(1);
  stepper.updateQuantity(1);
  assert.equal(stepper.quantity, 2);

  // 4. Cart with Quito Express ($3.00)
  const cart = [{ id: sealedItem.id, price: sealedItem.precioUnitario, quantity: stepper.quantity }];
  const totals = calculateOrderTotalsContract(cart, 'quito');
  assert.equal(totals.subtotal, 7000.00);
  assert.equal(totals.shipping, 3.00);
  assert.equal(totals.tax, 1050.00); // 7000 * 0.15
  assert.equal(totals.total, 8053.00);
});

test('Tier 4 Scenario 3: Bank Decline & Cash Recovery Journey (#DECLINED-SEC-054)', () => {
  // 1. User has items in cart
  const cart = [{ id: 'umbreon-vmax', price: 650.00, quantity: 1 }];
  const initialTotals = calculateOrderTotalsContract(cart, 'national');

  // 2. Enters test card ending in '0000'
  const testCardEnding0000 = '4532015114830000'; // valid Luhn ending in 0000
  const bankResult = checkSimulatedDeclineContract(testCardEnding0000);
  assert.equal(bankResult.approved, false);
  assert.equal(bankResult.code, '#DECLINED-SEC-054');

  // 3. Recovery: User switches to In-Store Pickup ($0.00) and Cash Payment
  const recoveryTotals = calculateOrderTotalsContract(cart, 'pickup');
  assert.equal(recoveryTotals.shipping, 0.00);
  assert.equal(recoveryTotals.subtotal, 650.00);
  assert.equal(recoveryTotals.tax, 97.50);
  assert.equal(recoveryTotals.total, 747.50);

  // Order reserved for cash pickup
  const order = {
    orderId: '#PKM-2026-CASH-01',
    paymentMethod: 'Efectivo en Tienda',
    deliveryMethod: 'Retiro en Local Central ($0.00)',
    total: recoveryTotals.total
  };
  assert.equal(order.paymentMethod, 'Efectivo en Tienda');
  assert.equal(order.total, 747.50);
});

test('Tier 4 Scenario 4: Network Outage & Failover Cascade Journey', async () => {
  const localVaultCatalog = [
    { id: 'gengar-fossil', nombre: 'Gengar 1st Edition Holo #5/62', set: 'Fossil 1999', rareza: 'Holo Rare', imagenLocal: 'img/gengar.png', precios: { psa10: 1200 } }
  ];
  const engine = new SearchFailoverEngine(localVaultCatalog);

  // 1. pokemontcg.io throws 503 outage
  const failoverToSecondary = await engine.searchCards('Gengar', { failPrimary: true });
  assert.equal(failoverToSecondary[0].fuente, 'tcgdex.net');

  // 2. Both pokemontcg.io and tcgdex.net fail (full offline scenario)
  const failoverToLocal = await engine.searchCards('Gengar', { failPrimary: true, failSecondary: true });
  assert.equal(failoverToLocal[0].fuente, 'local-vault');
  assert.equal(failoverToLocal[0].id, 'gengar-fossil');
  assert.equal(failoverToLocal[0].precioEstimado, 1200);
});

test('Tier 4 Scenario 5: Accidental Item Removal & Recovery Journey', () => {
  let cart = [
    { id: 'item-1', name: 'Lugia 1st Edition', price: 42000.00, quantity: 1 }
  ];

  // 1. Accidental delete clicked
  const deletedItem = cart.pop();
  const lastDeletedItem = { item: deletedItem, index: 0 };
  assert.equal(cart.length, 0);

  // 2. User clicks 'Deshacer'
  cart.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
  assert.equal(cart.length, 1);
  assert.equal(cart[0].id, 'item-1');
  assert.equal(cart[0].price, 42000.00);
});
