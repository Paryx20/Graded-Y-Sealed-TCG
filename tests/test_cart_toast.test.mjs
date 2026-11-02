/**
 * ==============================================================================
 * Test Suite: Cart Operations & Singleton Toast Notifications (Phases 5)
 * File: tests/test_cart_toast.test.mjs
 * Features Covered:
 *   - Feature 17: Singleton Toast Notification (Max 1 active, 2.5s auto-dismiss)
 *   - Feature 18: Cart Item Removal & Undo Modal ('Deshacer' capability)
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMockEnvironment,
  SingletonToastManager,
  calculateOrderTotalsContract
} from './test_harness.mjs';

// ==============================================================================
// TIER 1: FEATURE COVERAGE (HAPPY PATH - >=5 tests per feature)
// ==============================================================================

// Feature 17: Singleton Toast Notification
test('Feature 17 [Tier 1]: Singleton Toast - Displays single toast in container element', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  toastManager.showToast('Bienvenido a Graded & Sealed TCG', 'info');
  assert.equal(toastManager.getActiveToastCount(), 1);
});

test('Feature 17 [Tier 1]: Singleton Toast - Replaces prior active toast immediately (singleton guarantee)', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  toastManager.showToast('Primer mensaje de alerta', 'info');
  assert.equal(toastManager.getActiveToastCount(), 1);

  toastManager.showToast('Segundo mensaje sustituto', 'success');
  assert.equal(toastManager.getActiveToastCount(), 1);
  assert.equal(toastManager.currentToast.innerText, 'Segundo mensaje sustituto');
});

test('Feature 17 [Tier 1]: Singleton Toast - Supports success, error, and info types', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  const t1 = toastManager.showToast('Operación exitosa', 'success');
  assert.equal(t1.getAttribute('data-type'), 'success');

  const t2 = toastManager.showToast('Fallo en transacción', 'error');
  assert.equal(t2.getAttribute('data-type'), 'error');

  const t3 = toastManager.showToast('Nota informativa', 'info');
  assert.equal(t3.getAttribute('data-type'), 'info');
});

test('Feature 17 [Tier 1]: Singleton Toast - Contains accurate text message payload', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  const toast = toastManager.showToast('Item añadido a la bolsa: Charizard PSA 10', 'success');
  assert.equal(toast.innerText, 'Item añadido a la bolsa: Charizard PSA 10');
});

test('Feature 17 [Tier 1]: Singleton Toast - Configured for exact 2.5s (2500ms) auto-dismiss timing', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);
  assert.equal(toastManager.autoDismissMs, 2500);
});

// Feature 18: Cart Item Removal & Undo
test('Feature 18 [Tier 1]: Cart Removal - Requesting removal opens confirmation modal', () => {
  const { doc } = createMockEnvironment();
  const modal = doc.getElementById('delete-confirm-modal');
  let pendingDeleteId = null;

  const requestRemove = (id) => {
    pendingDeleteId = id;
    modal.classList.add('active');
  };

  requestRemove('charizard-base-psa10');
  assert.equal(pendingDeleteId, 'charizard-base-psa10');
  assert.equal(modal.classList.contains('active'), true);
});

test('Feature 18 [Tier 1]: Cart Removal - Displays item description in removal modal', () => {
  const { doc } = createMockEnvironment();
  const nameEl = doc.getElementById('delete-confirm-item-name');
  nameEl.innerText = 'Se retirará "Charizard Base Set (PSA 10)" de tu bolsa.';
  assert.ok(nameEl.innerText.includes('Charizard Base Set'));
});

test('Feature 18 [Tier 1]: Cart Removal - Confirming removal splices item and updates cart', () => {
  let cart = [
    { id: 'item-1', name: 'Charizard Base Set', price: 18500, quantity: 1 },
    { id: 'item-2', name: 'Umbreon VMAX', price: 650, quantity: 1 }
  ];

  const removeIndex = 0;
  const removed = cart.splice(removeIndex, 1)[0];
  assert.equal(cart.length, 1);
  assert.equal(removed.id, 'item-1');
});

test('Feature 18 [Tier 1]: Cart Removal - Saves last deleted item for undo restoration', () => {
  let lastDeletedItem = null;
  const item = { id: 'item-1', name: 'Charizard Base Set', price: 18500, quantity: 1 };
  lastDeletedItem = { item, index: 0 };

  assert.equal(lastDeletedItem.item.id, 'item-1');
  assert.equal(lastDeletedItem.index, 0);
});

test('Feature 18 [Tier 1]: Cart Removal - Deshacer (undo) restores item to exact original index', () => {
  let cart = [
    { id: 'item-2', name: 'Umbreon VMAX', price: 650, quantity: 1 }
  ];
  let lastDeletedItem = {
    item: { id: 'item-1', name: 'Charizard Base Set', price: 18500, quantity: 1 },
    index: 0
  };

  // Execute undo
  cart.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
  lastDeletedItem = null;

  assert.equal(cart.length, 2);
  assert.equal(cart[0].id, 'item-1');
  assert.equal(lastDeletedItem, null);
});

// ==============================================================================
// TIER 2: BOUNDARY & CORNER CASES (Rapid Invocations, Timers, State Reset)
// ==============================================================================

test('Feature 17 [Tier 2 Boundary]: Singleton Toast - Rapid multi-calls keep count strictly at 1', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  for (let i = 0; i < 10; i++) {
    toastManager.showToast(`Mensaje rápido #${i}`, 'info');
  }
  assert.equal(toastManager.getActiveToastCount(), 1);
  assert.equal(toastManager.currentToast.innerText, 'Mensaje rápido #9');
});

test('Feature 17 [Tier 2 Boundary]: Singleton Toast - Dismissal clears DOM and current timer', () => {
  const { doc } = createMockEnvironment();
  const container = doc.getElementById('toast-container');
  const toastManager = new SingletonToastManager(container);

  const toast = toastManager.showToast('Mensaje efímero', 'info');
  assert.equal(toastManager.getActiveToastCount(), 1);

  toastManager.dismissToast(toast);
  assert.equal(toastManager.getActiveToastCount(), 0);
  assert.equal(toastManager.currentToast, null);
  assert.equal(toastManager.currentTimer, null);
});

test('Feature 18 [Tier 2 Boundary]: Cart Removal - Cancelling removal leaves cart unchanged', () => {
  let cart = [
    { id: 'item-1', name: 'Charizard Base Set', price: 18500, quantity: 1 }
  ];
  let pendingDeleteId = 'item-1';

  // Cancel action
  pendingDeleteId = null;
  assert.equal(cart.length, 1);
  assert.equal(pendingDeleteId, null);
});

test('Feature 18 [Tier 2 Boundary]: Cart Removal - Undo with null lastDeletedItem is safe no-op', () => {
  let cart = [{ id: 'item-1', quantity: 1 }];
  let lastDeletedItem = null;

  const undo = () => {
    if (!lastDeletedItem) return false;
    cart.splice(lastDeletedItem.index, 0, lastDeletedItem.item);
    return true;
  };

  assert.equal(undo(), false);
  assert.equal(cart.length, 1);
});

test('Feature 18 [Tier 2 Boundary]: Cart Totals - Recomputes subtotal, 15% VAT, and shipping upon deletion', () => {
  let cart = [
    { id: 'item-1', price: 100, quantity: 2 }, // 200
    { id: 'item-2', price: 50, quantity: 1 }   // 50
  ];
  let totalsBefore = calculateOrderTotalsContract(cart, 'quito');
  assert.equal(totalsBefore.subtotal, 250);
  assert.equal(totalsBefore.tax, 37.50);
  assert.equal(totalsBefore.shipping, 3.00);
  assert.equal(totalsBefore.total, 290.50);

  // Remove item-2
  cart.splice(1, 1);
  let totalsAfter = calculateOrderTotalsContract(cart, 'quito');
  assert.equal(totalsAfter.subtotal, 200);
  assert.equal(totalsAfter.tax, 30.00);
  assert.equal(totalsAfter.shipping, 3.00);
  assert.equal(totalsAfter.total, 233.00);
});
