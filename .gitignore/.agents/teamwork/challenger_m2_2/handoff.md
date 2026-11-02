# Milestone 2 Empirical Challenge Report: UI & State Lifecycles

**Date**: 2026-11-02T00:29:40Z  
**Author**: Challenger 2 (Milestone 2 - UI & State Lifecycles)  
**Agent ID**: `challenger_m2_2`  
**Parent ID**: `7697e516-910f-4bbf-b2ad-e3d882af43c1`  
**Empirical Verdict**: **CONFIRM**

---

## 1. Observation

### O1. Toast Singleton Implementation & DOM Invariant
- **File**: `js/app.js`, Lines 528-586:
  ```javascript
  _activeToastTimeout: null,

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Strict singleton: clear pending timer and existing toast
    if (this._activeToastTimeout) {
      clearTimeout(this._activeToastTimeout);
      this._activeToastTimeout = null;
    }
    container.innerHTML = '';
  ...
    // Auto-dismiss after exactly 2.5 seconds (2500ms)
    this._activeToastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
        this._activeToastTimeout = null;
      }, 200);
    }, 2500);
  }
  ```
- **Empirical Execution**:
  * 100 rapid sequential calls (`for (let i = 0; i < 100; i++) app.showToast(...)`): `#toast-container` maintained strictly 1 child at all 100 evaluation checkpoints.
  * At clock advance `2490ms`: Toast was present in DOM (`container.children.length === 1`), `opacity-0` was `false`.
  * At clock advance `2510ms`: Auto-dismiss timer (2500ms) fired, applying `opacity-0` and `translate-y-2` dismissal classes.
  * At clock advance `2710ms` (post 200ms exit transition): Toast was completely detached from DOM (`container.children.length === 0`).

### O2. Cart Removal Confirmation & Undo Flow
- **File**: `js/app.js`, Lines 234-297:
  * `requestRemoveItem(id)`: Sets `Store.data.pendingDeleteItemId = id`, populates `#delete-confirm-item-name`, and activates `#delete-confirm-modal` by adding `.active`. Does not splice cart.
  * `confirmRemoveItem()`: Closes modal, splices target item from `Store.data.cart`, records `{ item: removed, index: idx }` into `Store.data.lastDeletedItem`, updates `#cart-badge`, and removes `.hidden` from `#undo-banner`.
  * `undoLastDeletion()`: Restores deleted item to its original index via `Store.data.cart.splice(index, 0, item)`, resets `Store.data.lastDeletedItem = null`, and adds `.hidden` to `#undo-banner`.
- **Empirical Execution**:
  * Middle item removal (index 1 of 3): Confirmed removal spliced item, stored index 1 in `lastDeletedItem`, and displayed banner. Calling `undoLastDeletion()` restored the item to index 1, recovering the original 3-item array structure `['item-0', 'item-1', 'item-2']`.
  * Emptied cart scenario (cart with 1 item deleted): Cart emptied to length 0. Calling `undoLastDeletion()` restored cart to 1 item at index 0.
  * Double undo idempotency: A second invocation of `undoLastDeletion()` with `lastDeletedItem === null` executed safely as a no-op without mutating state.

### O3. Mandatory Account Registration & Checkout Flow
- **File**: `js/views/checkout.js`, Lines 621-794:
  * Password Validation (Lines 626-631):
    ```javascript
    if (!Store.data.currentUser && (!password || password.length < 8)) {
      app.showToast('Ingresa una contraseña de al menos 8 caracteres para tu cuenta Graded & Sealed.', 'error');
      if (passwordInput && typeof passwordInput.focus === 'function') passwordInput.focus();
      return;
    }
    ```
  * Ecuadorian Cédula Module 10 Check (Lines 633-641): Rejects if `!Store.isValidEcuadorianId(idCard)`.
  * Telephone Format Check (Lines 643-650): Rejects if `!Store.isValidEcuadorianPhone(formattedPhone)`.
  * Credit Card Luhn & Bank Decline `#DECLINED-SEC-054` (Lines 655-671, 507-515):
    ```javascript
    if (clean.endsWith('0000')) {
      return {
        valid: false,
        simulatedDecline: true,
        code: '#DECLINED-SEC-054',
        message: 'Transacción denegada por el banco emisor (Límites o 3D Secure) (#DECLINED-SEC-054)'
      };
    }
    ```
    Triggers simulated decline, sets `window.location.hash = '#error'`, shows error toast, and aborts order placement.
  * Successful Order Finalization (Lines 673-794): Creates order with 15% VAT and flat shipping ($0.00 pickup, $3.00 Quito, $5.00 national), saves user record with `has_account: true` and `auth_tier: 'verified_collector'` into `Store.data.currentUser`, clears `Store.data.cart`, and sets `window.location.hash = '#confirmation'`.
- **Empirical Execution**:
  * Missing/short password: 0 orders created, `Store.data.currentUser` remained `null`.
  * Invalid Cédula (`1710034069` or `2510034065`): 0 orders created.
  * Invalid Phone (`123456` or excessive digits): 0 orders created.
  * Valid Luhn card ending in `'0000'` (`4532015114830000`): Redirected to `#error`, 0 orders created, cart items preserved.
  * Valid card (`4532015112830366`): Order placed (#PKM-2026-xxxxx), `Store.data.currentUser` populated with active session, cart emptied, routed to `#confirmation`.

### O4. Full Test Suite Execution
- **Command**: `cmd /c "node --test tests/*.test.mjs"`
- **Result Output**:
  ```
  ℹ tests 224
  ℹ suites 0
  ℹ pass 224
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 2645.7201
  ```
  All 224 tests passing across the 9 test suites in `tests/`.

---

## 2. Logic Chain

1. **Premise 1 (Toast Singleton)**: From O1, `app.showToast` cancels prior timer references and clears container innerHTML on every call. In stress testing with 100 rapid calls, the child count remained strictly 1. At 2490ms the toast was visible, at 2510ms the 2500ms auto-dismiss triggered, and at 2710ms the DOM node was detached. Thus, Requirement 1 is fully satisfied.
2. **Premise 2 (Cart Removal & Undo)**: From O2, modal triggering does not prematurely splice cart items; user confirmation splices the item and preserves its exact index in `Store.data.lastDeletedItem`; and `undoLastDeletion()` restores the item to that exact index. Both multi-item cart positions and edge-case emptied carts restore predictably. Thus, Requirement 2 is fully satisfied.
3. **Premise 3 (Mandatory Checkout & Validations)**: From O3, guest checkout is blocked when password is missing or < 8 characters; Ecuadorian Cédula and phone validations reject non-conforming inputs; valid Luhn cards ending in `'0000'` trigger code `#DECLINED-SEC-054` and navigation to `#error`; and valid credentials establish an active session in `Store.data.currentUser` with verified collector tier. Thus, Requirement 3 is fully satisfied.
4. **Premise 4 (Regression & Suite Completeness)**: From O4, all 224 tests in the test suite pass with 0 failures, 0 cancellations, and 0 skips.
5. **Deduction**: Because all specifications were empirically tested and satisfied through direct automated test execution, the implementation is solid and compliant.

---

## 3. Adversarial Analysis & Challenges

### Challenge 1 (Low Risk): Nested Inner Timeout Reference in Toast Dismissal
- **Assumption Challenged**: `app.showToast` assumes that clearing `this._activeToastTimeout` cancels all pending dismissal timers.
- **Attack Scenario**: At t=2500ms, the outer timer fires and schedules an inner 200ms `setTimeout` to physically remove the DOM element. The inner timer ID is not assigned to `this._activeToastTimeout`. If a new toast is fired at t=2510ms, `clearTimeout(this._activeToastTimeout)` does not cancel the inner timer. At t=2700ms, the inner timer fires and executes `this._activeToastTimeout = null`, which sets the new toast's timer reference to `null`.
- **Blast Radius**: Low. The new toast still auto-dismisses when its own 2500ms timer fires; furthermore, `container.innerHTML = ''` ensures no visual DOM stacking occurs. However, intermediate invocations between t=2500ms and t=2700ms experience a temporary reference desync.
- **Mitigation**: Track the inner timeout ID in `this._activeToastDismissTimeout` or cancel both timeouts on `showToast`.

---

## 4. Caveats

- **DOM Emulation**: Testing ran in a Node.js test harness with full W3C-compliant DOM mocks mirroring `index.html`. While all browser-facing event handlers and DOM manipulations were exercised, browser GPU rendering pipelines (e.g. CSS animation hardware acceleration) cannot be verified headlessly.
- **Dexie.js IndexedDB Integration**: In offline headless Node testing, Dexie ACID operations fallback gracefully to in-memory/mock storage. Browser IndexedDB storage was verified via schema and mock tests.

---

## 5. Conclusion

**Verdict**: **CONFIRM**

The UI and State Lifecycles for Milestone 2 (Phase 5 Cart, Mandatory Checkout & Ecuadorian Validations) meet all acceptance criteria:
1. Toast singleton is maintained under 100 rapid calls and honors the 2500ms auto-dismiss lifecycle.
2. Cart item removal presents a confirmation modal and supports reliable, exact-index restoration through `undoLastDeletion()`, including emptied cart scenarios.
3. Mandatory checkout enforces account registration, validates Ecuadorian Cédula (Module 10) and phone (+593), flags simulated card decline `#DECLINED-SEC-054`, and establishes verified active sessions upon approved transactions.

---

## 6. Verification Method

To independently execute and verify this challenge suite:

```bash
# 1. Run Challenger 2 UI & State Lifecycle test suite
cmd /c "node --test tests/test_challenger_m2_lifecycle.test.mjs"

# 2. Run the complete test suite across all Milestone features
cmd /c "node --test tests/*.test.mjs"
```

**Invalidation Conditions**:
- Any test failure among the 13 tests in `tests/test_challenger_m2_lifecycle.test.mjs`.
- Any DOM child count in `#toast-container` exceeding 1 during rapid sequential invocations.
- Failure of `undoLastDeletion()` to restore an item to its original index.
- Successful order placement without a password or with an invalid Ecuadorian Cédula.
