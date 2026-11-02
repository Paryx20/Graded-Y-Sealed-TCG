## 2026-11-02T00:07:48Z
You are Worker for Milestone 2: Phase 5 Cart, Mandatory Checkout & Ecuadorian Validations (teamwork_worker).
Your working directory is: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\worker_m2\
Your parent is: 7697e516-910f-4bbf-b2ad-e3d882af43c1

MANDATORY: Read ORIGINAL_REQUEST.md first:
c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\ORIGINAL_REQUEST.md

Also read PROJECT.md and survey handoffs:
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\orchestrator_1\PROJECT.md
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\spec_miner_survey_3\handoff.md (Contains exact algorithms for Module 10, Luhn, VAT 15%, shipping, singleton toast, and Dexie persistence!)
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_1\handoff.md
- c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\TEST_READY.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive File Ownership:
- `js/state.js`
- `js/data.js` (APP_CONFIG shipping rates)
- `js/views/checkout.js`
- `js/views/cart.js`
- `js/app.js` (showToast singleton refactor and cart removal / undo helpers)
- `js/db/db-client.js` (if any adjustments needed for Dexie transaction)

Mission:
Implement all Requirement R2 / Phase 5 features according to PLAN_DE_TRABAJO.md and ORIGINAL_REQUEST.md:

1. Unified Mandatory Checkout & Account Creation in `js/views/checkout.js`:
   - Replace guest checkout with mandatory registration requiring account creation.
   - Add a mandatory password field ("Contraseña para tu cuenta Graded & Sealed") with confirmation or validation.
   - Capture customer details: Full Name, Cédula/RUC, Telephone, Shipping Address, City, Email, Password.

2. Ecuadorian Validations in `js/state.js` & `js/views/checkout.js`:
   - Refactor `Store.isValidEcuadorianId(idString)`:
     * Support 10-digit Cédula and 13-digit natural RUC (`length === 13 && endsWith('001')`).
     * Validate province code (01 to 24, or 30).
     * Validate third digit (< 6 for natural persons).
     * Apply Module 10 algorithm with alternating coefficients [2, 1, 2, 1, 2, 1, 2, 1, 2], subtracting 9 if product >= 10, checksum digit comparison.
   - Telephone validation: Ensure phone number begins with `+593` prefix followed by 9 digits (e.g. `+593 9XXXXXXXX` or `+593 09XXXXXXXX`).

3. Credit Card Luhn Validation & Simulated Error in `js/views/checkout.js`:
   - Implement authentic Luhn's algorithm (Mod 10 doubling algorithm) for credit card validation.
   - Trigger simulated error `#DECLINED-SEC-054` if the card number ends in `'0000'`, displaying clear bank decline messaging and redirecting or presenting the decline state.

4. 15% VAT & Tri-Tier Flat Shipping in `js/data.js`, `js/state.js`, and `js/views/checkout.js`:
   - Add `QUITO_SHIPPING_FEE: 3.00` to `APP_CONFIG`.
   - Update `Store.getCartTotals()` to calculate:
     * Subtotal
     * 15% VAT on subtotal: `Math.round(subtotal * 0.15 * 100) / 100`
     * Flat shipping options:
       - Retiro en Tienda / Pickup: `$0.00`
       - Local Express (Quito): `$3.00`
       - Envío Nacional Blindado: `$5.00`
     * Total = subtotal + 15% VAT + shipping.

5. Dexie.js ACID Persistence & Active Session State:
   - On successful checkout payment:
     * Persist or update user in Dexie `usuarios` table (with cédula, name, phone, email, address, city, password).
     * Persist order in Dexie `ordenes_compra` table (with `numero_orden`, `usuario_cedula`, `fecha_creacion`, `subtotal`, `iva_15`, `costo_envio`, `total`, `metodo_pago`, `estado_logistico: 'CONFIRMADO'`, `items`).
     * Persist order items in `items_orden`.
     * Maintain active session state in `Store.data.currentUser` and `state.js` (saving to localStorage as active session cache).

6. Singleton Toast Notification in `js/app.js`:
   - Refactor `showToast(message, type = 'info')`:
     * Strict singleton: If a toast is currently active in DOM, immediately dismiss/remove it and clear any pending timeouts.
     * At most 1 active toast visible in `#toast-container` at any time.
     * Auto-dismiss after exactly 2.5 seconds (`2500ms`).

7. Cart Item Removal Confirmation & Undo in `js/views/cart.js` and `js/app.js`:
   - Prompt confirmation modal (`#delete-confirm-modal`) before removing an item.
   - On confirmation, remove item, store in `Store.data.lastDeletedItem`, and show '#undo-banner'.
   - Functional 'Deshacer' (undo) restores the removed item back to its original index in `Store.data.cart` and updates cart badge and totals.

8. Testing & Verification:
   - Run tests: `cmd /c "node --test tests/*.test.mjs"`.
   - Ensure `tests/test_validations.test.mjs` and `tests/test_cart_toast.test.mjs` pass 100% (and total tests pass with 0 failures).
