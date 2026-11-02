# Specification Mining & Architecture Report — Phases 4 to 7
**Project:** Graded & Sealed TCG — E-commerce Platform  
**Mining Agent:** teamwork_spec_miner (`spec_miner_survey_3`)  
**Parent Orchestrator:** `7697e516-910f-4bbf-b2ad-e3d882af43c1`  
**Date:** 2026-11-01T22:21:00Z  

---

## 1. Observation

Direct examination of the authoritative specification files (`PLAN_DE_TRABAJO.md` and `ORIGINAL_REQUEST.md`), alongside the existing source code, revealed the following factual baseline:

1. **`ORIGINAL_REQUEST.md` (Lines 11-40):**
   - **R1 (Phase 4):** Generate transparent-background images of Team Rocket booster box (`img/sealed/`), format Pokémon card images (Raichu GX front & official back in `img/cards/`). 3D card inspector with 'Frontal' (holographic shimmer), 'Reverso y Bordes' (`rotateY(180deg)` + 50/50 centering overlay), 'Slab PSA' (acrylic slab + top certification label). Conditional PDP logic hiding PSA selector/3D controls for `PRODUCTO_SELLADO` and showing them for `CARTA_INDIVIDUAL`. Quantity selector (`- [ 1 ] +`, min 1). Accessible PSA modal.
   - **R2 (Phase 5):** Unified mandatory checkout eliminating guest checkout; password field for account creation. Ecuadorian Module 10 validation for Cédula/RUC; phone prefix (+593). Dexie.js persistence in `usuarios` and `ordenes_compra` with active session in `state.js`. Credit card validation using Luhn's algorithm, triggering simulated error `#DECLINED-SEC-054` on card numbers ending in `'0000'`. 15% VAT and flat shipping ($3 Quito, $5 National, $0 Pickup). Singleton toast notification (max 1 active toast, 2.5s auto-dismiss). Cart removal confirmation modal with 'Deshacer' (undo).
   - **R3 (Phase 6):** `js/services/pokemon-api.js` with failover cascade: `pokemontcg.io` (primary) -> `tcgdex.net` (secondary) -> in-memory local catalogue (offline). Decoupled `#search-results` view with 400ms search input debounce, skeleton loader indicators, and zero-results state.
   - **R4 (Phase 7):** Reactive `#profile` view querying Dexie.js for active user: "Mis Datos Personales" tab (editable name, phone, saved address), "Mis Últimas Compras" tab (order thumbnails, date, payment method, logistic status, `[Ver Tracking en Vivo]` redirecting to `#tracking` with accurate order context), `[Cerrar Sesión]` clearing session and redirecting to `#home`.
   - Update `PLAN_DE_TRABAJO.md` marking all checklist items under FASE 4, 5, 6, 7 with `[X]`.

2. **`PLAN_DE_TRABAJO.md` (Lines 47-93):**
   - Fases 4, 5, 6, 7 are currently marked as pending (`[ ]`).
   - Line 48: Conditional logic based on `tipo_item`:
     - If `PRODUCTO_SELLADO`: Hide PSA grade selector and 3D rotation controls; display factory details and packaging photos.
     - If `CARTA_INDIVIDUAL`: Enable PSA grades, quotation chart, and 3D technical viewer.
   - Line 70: Tarjetas validadas con Luhn; terminación `'0000'` dispara error `#DECLINED-SEC-054`.
   - Line 71: Tarifa plana: $3.00 (Quito) / $5.00 (Nacional) / $0.00 (Retiro en local).
   - Line 73: Singleton Toast: Máximo un toast activo en pantalla con auto-cierre en 2.5s.
   - Line 79-84: `js/services/pokemon-api.js` con failover (pokemontcg.io -> tcgdex.net -> catálogo local) y `#search-results` con debounce de 400ms.

3. **Current Implementation Files:**
   - **`js/state.js` (Lines 118-124):** Only computes 2 shipping rates ($5.00 courier, $0.00 pickup). Missing Quito $3.00 flat rate in default configuration.
   - **`js/state.js` (Lines 126-150):** `isValidEcuadorianId` validates 10 digits for Cédula, but does not handle 13-digit natural RUC (`cedula + '001'`).
   - **`js/views/pdp.js` (Lines 141-260):** Renders PSA grade selectors and 3D buttons unconditionally for all products. Lacks conditional branching for `product.categoria === 'sealed'` or `product.tipo_discriminador === 'PRODUCTO_SELLADO'`.
   - **`js/views/checkout.js` (Lines 500-606):** Allows guest checkout without password. Does NOT enforce account creation at checkout. Card validation only checks `cardNum.endsWith('0000')`, lacking the actual Luhn algorithm check. Orders are only saved to localStorage (`Store.data.orders`), completely bypassing Dexie.js `GradedSealedDB.ordenes_compra` and `GradedSealedDB.usuarios`.
   - **`js/app.js` (Lines 489-524):** `showToast` appends toasts without removing prior active toasts (not a singleton) and uses a 3.8s timeout (`setTimeout(..., 3800)`) instead of the required 2.5s (`2500ms`).
   - **`js/services/pokemon-api.js`:** Does not exist in the repository yet.
   - **`#search-results` route:** Does not exist; search currently redirects to `#catalog?q=...`.
   - **Asset Folders:** `img/cards/` and `img/sealed/` exist as directories but contain no files. The raw user-provided source images are located in the user upload folder:
     - Card back: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570186168_80295ed8.jpg`
     - Team Rocket box: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570203846_69580a5b.jpg`
     - Raichu GX front: `C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793570244974_7f34fc1b.jpg`

---

## 2. Logic Chain

1. **Phase 4 Visual Assets & PDP:**
   - Because `img/sealed/` and `img/cards/` are currently empty, transparent multi-angle imagery for the Team Rocket Booster Box (front, perspective, side) and card assets (Raichu GX and card back) must be generated/placed into those directories.
   - Because `pdp.js` currently renders the 3D controls and PSA grading selector unconditionally, browsing to a sealed product (such as `booster-team-rocket` or `booster-box-fossil-1999`) presents an invalid UX where sealed packs appear to have PSA 10 slab options. Introducing `if (product.categoria === 'sealed' || product.tipo_discriminador === 'PRODUCTO_SELLADO')` will toggle the view to display factory specifications (gramaje, quantity of packs, unweighed/weighed status) and packaging photo angles, while hiding PSA grades and 3D flip controls.
   - For single cards (`CARTA_INDIVIDUAL`), the 3D inspector must use the formatted card back image alongside the existing SVG and 50/50 centering grid overlay (`rotateY(180deg)`), with interactive holographic shimmer on hover/move, and encapsulated in `.psa-acrylic-slab`.

2. **Phase 5 Checkout & Business Logic:**
   - The user request explicitly demands eliminating guest checkout. Therefore, checkout form fields must include Name, Cédula/RUC (Module 10 verified), Phone (+593), Address, City, and a mandatory Password field.
   - Upon clicking "Proceder al Pago", the transaction must:
     a. Validate Cédula/RUC via Module 10.
     b. Validate Phone (+593 + 9 digits).
     c. Validate credit card with the Luhn algorithm. If invalid, reject. If valid but ending in `'0000'`, reject with `#DECLINED-SEC-054`.
     d. Calculate 15% VAT on subtotal: `Math.round(subtotal * 0.15 * 100) / 100`.
     e. Apply flat shipping fee based on user selection: In-store Pickup = `$0.00`, Local Express (Quito) = `$3.00`, National Blindado = `$5.00`.
     f. Atomically persist user to Dexie.js `usuarios` table (insert or update).
     g. Persist order to Dexie.js `ordenes_compra` and lines to `items_orden`.
     h. Set `Store.data.currentUser` and update session state.
   - Singleton Toast: `app.showToast` must check if an active toast already exists in DOM; if so, immediately remove it and clear pending timeouts before creating the new toast. The auto-dismiss duration must be exactly 2500ms.
   - Item removal confirmation modal: Must prompt the user and, on confirmation, store `{ item, index }` in `Store.data.lastDeletedItem`, display an "Undo" / "Deshacer" notification/banner, and restore the item upon request.

3. **Phase 6 Failover Search Service & View:**
   - Network queries to public APIs can fail due to rate limits or connectivity. Hence, `js/services/pokemon-api.js` must implement a 3-tier cascade:
     1. Primary: `pokemontcg.io/v2/cards?q=name:*${query}*` (timeout 4s).
     2. Secondary: `tcgdex.net/v2/en/cards?name=${query}` (timeout 4s).
     3. Fallback: Local search over `PRODUCTS` / `GradedSealedDB.productos`.
   - The decoupled `#search-results` route must render a search view where keystrokes are debounced by 400ms. While awaiting results, animated skeleton cards (`animate-pulse`) must be displayed. If no results match, an informative zero-state must appear with suggestions.

4. **Phase 7 User Profile & Work Plan Tracking:**
   - The `#profile` view must directly query Dexie.js:
     - "Mis Datos Personales": Edits name, phone, city, address, validated against Module 10, updating `GradedSealedDB.usuarios` and `Store.data.currentUser`.
     - "Mis Últimas Compras": Queries `GradedSealedDB.ordenes_compra` where `usuario_cedula === currentUser.idCard`. Displays past orders with thumbnails, date, payment method, and logistic status.
     - Each past order has a `[Ver Tracking en Vivo]` button that sets `activeTrackingOrderId` and redirects to `#tracking?order=${order.numero_orden}`.
     - `[Cerrar Sesión]` resets session state and redirects to `#home`.
   - Finally, `PLAN_DE_TRABAJO.md` must have all checklist tasks under FASES 4, 5, 6, and 7 updated to `[X]`.

---

## 3. Caveats

- **Scope Boundary:** As a Specification Miner, this agent operates strictly in read-only analysis mode on the codebase. No production source files or work plan checklist markers are modified during this turn.
- **RUC Scope:** In Ecuador, a natural person's RUC is formed by the 10-digit Cédula followed by `001`. Public and private legal entity RUCs (third digit 6 or 9) utilize Module 11. The specification explicitly focuses on Module 10 validation; handling natural RUCs (`length === 13 && endsWith('001')`) via Module 10 on the first 10 digits covers collector e-commerce requirements without violating Module 10 constraints.
- **External API Connectivity:** Public endpoints `pokemontcg.io` and `tcgdex.net` may experience intermittent latency or CORS restrictions depending on runtime environment. The failover cascade guarantees offline availability via the local catalogue.

---

## 4. Conclusion

The platform architecture is solidly designed around Dexie.js, Tailwind CSS, and Vanilla JS, but Phases 4 through 7 require specific gap closures:
1. **Phase 4:** Assets in `img/sealed/` and `img/cards/`, adaptive PDP logic checking `tipo_item`/`categoria` to toggle between sealed packaging mode and PSA 3D card inspection mode.
2. **Phase 5:** Mandatory user creation during checkout, Module 10 + Luhn algorithm + `#DECLINED-SEC-054` error code, 15% VAT, tri-tier shipping ($0/$3/$5), Dexie.js persistence for users and orders, singleton toast (max 1 active, 2.5s timer), and cart removal undo.
3. **Phase 6:** `pokemon-api.js` failover service and decoupled `#search-results` route with 400ms debounce and skeleton loaders.
4. **Phase 7:** Reactive `#profile` view reading Dexie.js orders and updating personal information, tracking deep-link, session logout, and updating `PLAN_DE_TRABAJO.md` checkmarks `[X]`.

---

## 5. Verification Method

To independently verify the mined specifications and subsequent implementations:
1. **Cédula / RUC Module 10 Validation:**
   - Valid Cédula: `'1710034065'` -> Returns `true`.
   - Valid Natural RUC: `'1710034065001'` -> Returns `true`.
   - Invalid Cédula (wrong checksum): `'1710034066'` -> Returns `false`.
   - Invalid Province (`> 24`): `'2510034065'` -> Returns `false`.
   - Invalid Third Digit (`>= 6`): `'1760034065'` -> Returns `false`.
2. **Credit Card Luhn & Decline Code:**
   - Valid Visa/Mastercard (e.g. `'49927398716'` or valid 16-digit card): Passes Luhn.
   - Card ending in `'0000'` (e.g. `'4111111111110000'`): Triggers simulated decline error `#DECLINED-SEC-054`.
3. **VAT & Shipping Formula:**
   - Order with Subtotal = `$100.00`, Quito Shipping = `$3.00`:
     - VAT 15% = `$15.00`
     - Total = `$118.00`
   - Order with Subtotal = `$18,500.00`, National Shipping = `$5.00`:
     - VAT 15% = `$2,775.00`
     - Total = `$21,280.00`
   - Order with Pickup = `$0.00`:
     - Total = `$100.00 + $15.00 + $0.00 = $115.00`
4. **Toast Singleton:**
   - Trigger `app.showToast('First')` followed immediately by `app.showToast('Second')`:
   - Inspect `#toast-container`: Exactly 1 toast element present.
   - Wait 2.5s: Toast element auto-removed.
5. **Failover Cascade:**
   - In browser console or test harness, block `pokemontcg.io`: Query succeeds via `tcgdex.net`. Block both: Query succeeds via local in-memory catalogue.
6. **Dexie.js Table Verification:**
   - In browser DevTools -> Application -> Storage -> IndexedDB -> `GradedSealedDB`:
   - Check `usuarios` table has registered user.
   - Check `ordenes_compra` table has new order record with matching `usuario_cedula`.

---

## 6. Mathematical Algorithms & Edge Case Specifications

### Algorithm 1: Ecuadorian ID / Cédula & Natural RUC (Module 10)
```javascript
function isValidEcuadorianIdOrRuc(idString) {
  if (!idString || typeof idString !== 'string') return false;
  const clean = idString.trim().replace(/\D/g, '');

  let cedula = clean;
  if (clean.length === 13) {
    if (!clean.endsWith('001')) return false;
    cedula = clean.substring(0, 10);
  } else if (clean.length !== 10) {
    return false;
  }

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || (provincia > 24 && provincia !== 30)) return false;

  const tercerDigito = parseInt(cedula.charAt(2), 10);
  if (tercerDigito >= 6) return false; // Persona natural

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let prod = parseInt(cedula.charAt(i), 10) * coeficientes[i];
    if (prod >= 10) prod -= 9;
    suma += prod;
  }

  const residuo = suma % 10;
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
  return digitoVerificador === parseInt(cedula.charAt(9), 10);
}
```

### Algorithm 2: Credit Card Luhn Algorithm (Mod 10 Check) & Error Trigger
```javascript
function validateCreditCard(cardNumber) {
  const clean = (cardNumber || '').toString().replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) {
    return { valid: false, code: 'INVALID_LENGTH', message: 'Número de tarjeta inválido' };
  }

  // Check simulated failure condition
  if (clean.endsWith('0000')) {
    return { 
      valid: false, 
      simulatedDecline: true, 
      code: '#DECLINED-SEC-054', 
      message: 'Transacción denegada por el banco (#DECLINED-SEC-054)' 
    };
  }

  // Standard Luhn verification
  let sum = 0;
  let alternate = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  if (sum % 10 !== 0) {
    return { valid: false, code: 'LUHN_FAILED', message: 'Dígito de verificación de tarjeta incorrecto' };
  }

  return { valid: true, code: 'APPROVED', message: 'Tarjeta válida' };
}
```

### Algorithm 3: Ecuadorian VAT (15%) & Financial Totals
```javascript
function calculateOrderTotals(cartItems, deliveryMethod) {
  const subtotal = cartItems.reduce((acc, item) => {
    const unitPrice = Number(item.price || item.precio_unitario || 0);
    const qty = parseInt(item.quantity || item.cantidad || 1, 10);
    return acc + (unitPrice * qty);
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const taxRate = 0.15; // 15% IVA vigente en Ecuador
  const tax = Math.round(roundedSubtotal * taxRate * 100) / 100;

  let shipping = 5.00;
  if (deliveryMethod === 'pickup' || deliveryMethod === 'retiro') {
    shipping = 0.00;
  } else if (deliveryMethod === 'quito' || deliveryMethod === 'local_express') {
    shipping = 3.00;
  } else {
    shipping = 5.00; // Nacional blindado
  }

  const total = Math.round((roundedSubtotal + tax + shipping) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    taxRate,
    tax,
    shipping,
    total
  };
}
```

### Algorithm 4: Dual Search API Failover Cascade
```javascript
async function searchPokemonCardsWithFailover(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim();

  // Tier 1: pokemontcg.io (Primary)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"*${encodeURIComponent(q)}*"&pageSize=12`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        return data.data.map(c => ({
          id: c.id,
          nombre: c.name,
          set: c.set?.name || 'Expansion',
          rareza: c.rarity || 'Coleccionable',
          imagen: c.images?.small || c.images?.large,
          precioEstimado: c.cardmarket?.prices?.averageSellPrice || 10.00,
          fuente: 'pokemontcg.io'
        }));
      }
    }
  } catch (errPrimary) {
    console.warn('[PokemonAPI] Primary source failed, switching to backup (tcgdex.net)...', errPrimary);
  }

  // Tier 2: tcgdex.net (Secondary backup)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(q)}`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.slice(0, 12).map(c => ({
          id: c.id,
          nombre: c.name,
          set: c.set?.name || 'TCG Set',
          rareza: c.rarity || 'Rare',
          imagen: c.image ? `${c.image}/high.webp` : 'img/charizard-base.png',
          precioEstimado: 15.00,
          fuente: 'tcgdex.net'
        }));
      }
    }
  } catch (errSecondary) {
    console.warn('[PokemonAPI] Backup source failed, falling back to local vault catalogue...', errSecondary);
  }

  // Tier 3: In-Memory Local Vault Catalog (Offline Fallback)
  const localList = (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []).filter(p => 
    p.nombre.toLowerCase().includes(q.toLowerCase()) ||
    p.set.toLowerCase().includes(q.toLowerCase()) ||
    (p.tipo && p.tipo.toLowerCase().includes(q.toLowerCase()))
  );

  return localList.map(p => ({
    id: p.id,
    nombre: p.nombre,
    set: p.set,
    rareza: p.rareza,
    imagen: p.imagenLocal || p.imagenFallbackUrl,
    precioEstimado: p.precios ? (p.precios.psa10 || p.precios.raw) : 50.00,
    fuente: 'local-vault'
  }));
}
```

### Algorithm 5: Singleton Toast Notification
```javascript
let activeToastTimeout = null;

function showSingletonToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // Clear existing timer and toast immediately
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
    activeToastTimeout = null;
  }
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border-l-4 flex items-center gap-2.5 transition-all transform translate-y-0 opacity-100';

  let icon = 'info';
  if (type === 'success') {
    toast.classList.add('border-[#059669]');
    icon = 'check-circle';
  } else if (type === 'error') {
    toast.classList.add('border-[#E11D48]');
    icon = 'alert-circle';
  } else {
    toast.classList.add('border-[#D97706]');
  }

  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i><span>${message}</span>`;
  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  // Exactly 2500ms auto-dismiss
  activeToastTimeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
      activeToastTimeout = null;
    }, 200);
  }, 2500);
}
```

---

## 7. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Phase 4 | Team Rocket Box Multi-Angle Imagery | Transparent product imagery for booster box in front, 3/4 perspective, and side angles | Graphic source files | PNG files in `img/sealed/` | Falls back to generic placeholder if file missing | ORIGINAL_REQUEST.md line 12 |
| 2 | Phase 4 | Pokémon Card Assets | High-resolution front (Raichu GX) and official card back images | Image sources in `.user_uploaded/` | PNG files in `img/cards/` | Falls back to online pokemontcg.io hires URL | ORIGINAL_REQUEST.md line 12 |
| 3 | Phase 4 | 3D Card Inspector - Frontal View | Vertical 3D perspective display with interactive mouse-follow holographic shimmer | Mouse move coords `(e.clientX, e.clientY)` | CSS radial-gradient variables `--holo-x`, `--holo-y` | Defaults to 50% 50% if mouse leaves scene | PLAN_DE_TRABAJO.md line 52 |
| 4 | Phase 4 | 3D Card Inspector - Reverso y Bordes | 180° Y-axis rotation displaying official blue back and 50/50 centering overlay grid | Button click 'Reverso y Bordes' | `.card-3d-object.is-flipped-y` (`transform: rotateY(180deg)`) | CSS backface-visibility hidden prevents glitch | PLAN_DE_TRABAJO.md line 53 |
| 5 | Phase 4 | 3D Card Inspector - Slab PSA | Encapsulates card in acrylic slab border with top PSA certification label, barcode, and cert number | Button click 'Slab PSA' | `.psa-acrylic-slab` container markup | Renders cert fallback if product lacks cert code | PLAN_DE_TRABAJO.md line 54 |
| 6 | Phase 4 | Adaptive PDP Conditional Logic | Conditionally hides PSA selector and 3D controls for sealed products; displays factory packaging specs | `product.categoria === 'sealed'` or `tipo_item === 'PRODUCTO_SELLADO'` | Mutated PDP DOM structure | If type unknown, defaults to single card view | PLAN_DE_TRABAJO.md lines 48-50 |
| 7 | Phase 4 | PDP Quantity Stepper | Stepper selector (`- [ 1 ] +`) with lower bound of 1 unit | Click `+` or `-` | Updates `Store.data.pdpQuantity` | Ignores clicks if quantity is 1 and decrement clicked | PLAN_DE_TRABAJO.md line 55 |
| 8 | Phase 4 | PSA Educational Modal | Accessible modal explaining PSA grading standards (Raw vs PSA 10) | Click "¿Qué es un Grado PSA?" / Esc key | `#psa-guide-modal.active` | Closes on backdrop click or Escape | PLAN_DE_TRABAJO.md line 56 |
| 9 | Phase 5 | Mandatory Account Creation Checkout | Replaces guest checkout; captures name, cédula/RUC, phone, address, and password | User input fields | Registered user object | Rejects submission if password or fields missing | ORIGINAL_REQUEST.md line 19 |
| 10 | Phase 5 | Ecuadorian Module 10 Validator | Algorithm verifying province (01-24), third digit (<6), alternating weights [2,1], mod 10 | 10-digit Cédula or 13-digit RUC (ends in 001) | Boolean validity flag | Highlights input in red and displays error text | PLAN_DE_TRABAJO.md line 63 |
| 11 | Phase 5 | Phone Number Prefix Validator | Ensures phone begins with +593 followed by 9 digits | Phone input string | Formatted phone `+593 09XXXXXXXX` | Rejects non-Ecuadorian length/prefix | PLAN_DE_TRABAJO.md line 63 |
| 12 | Phase 5 | Credit Card Luhn Check | Mod 10 doubling algorithm verifying card numbers | 13-19 digit card number | Boolean valid flag | Displays card error toast and blocks payment | ORIGINAL_REQUEST.md line 22 |
| 13 | Phase 5 | Bank Simulation Decline `#DECLINED-SEC-054` | Card numbers ending in `'0000'` deliberately fail with simulated bank decline | Card ending in `'0000'` | Error toast `#DECLINED-SEC-054` & redirect `#error` | Terminates payment flow into error state | ORIGINAL_REQUEST.md line 22 |
| 14 | Phase 5 | 15% VAT Breakdown | Computes exact 15% tax on order subtotal | Subtotal amount | 15% VAT rounded to 2 decimal places | Rounding precision handles fractional cents | PLAN_DE_TRABAJO.md line 72 |
| 15 | Phase 5 | Tri-Tier Flat Shipping | Implements $0.00 (In-Store Pickup), $3.00 (Quito Local), $5.00 (National Blindado) | Shipping radio selection | Shipping fee applied to total | Defaults to $5.00 national courier | PLAN_DE_TRABAJO.md line 71 |
| 16 | Phase 5 | Dexie.js ACID Persistence | Inserts user into `usuarios` and order into `ordenes_compra` & `items_orden` | Checkout submission | IndexedDB records committed | Rolls back transaction on error | PLAN_DE_TRABAJO.md lines 66-68 |
| 17 | Phase 5 | Singleton Toast System | Displays at most 1 toast on screen; dismisses prior active toasts immediately; 2.5s auto-close | Message string & type | Animated toast element | Replaces previous toast without accumulation | PLAN_DE_TRABAJO.md line 73 |
| 18 | Phase 5 | Cart Removal Confirmation & Undo | Modal prompt before removing items, plus 'Deshacer' banner to restore deleted item | Trash button click | Modal prompt -> Undo state | Canceling modal keeps item in cart | PLAN_DE_TRABAJO.md line 74 |
| 19 | Phase 6 | Dual Failover Search API | Automatic fallback from `pokemontcg.io` to `tcgdex.net` to local catalog | Search query string | Array of normalized card objects | Gracefully cascades on timeout or HTTP failure | PLAN_DE_TRABAJO.md lines 79-82 |
| 20 | Phase 6 | Decoupled `#search-results` View | Dedicated SPA view with 400ms debounce, skeletons, and zero-results state | Route `#search-results?q=...` | Decoupled search results view | Displays zero-results view if no cards match | PLAN_DE_TRABAJO.md line 83 |
| 21 | Phase 7 | Reactive `#profile` View | Tabbed profile connected to Dexie.js (`usuarios`, `ordenes_compra`) | Active user session | Rendered profile tabs | Prompts login if no active user session | PLAN_DE_TRABAJO.md lines 88-90 |
| 22 | Phase 7 | "Mis Datos Personales" Editor | Edits user name, phone (+593), and address; persists to Dexie.js and state | Form submit | Updated user record in Dexie | Rejects invalid Cédula/RUC | PLAN_DE_TRABAJO.md line 89 |
| 23 | Phase 7 | "Mis Últimas Compras" Order History | Queries active user's orders with thumbnails, date, payment method, and status | `currentUser.idCard` | Order cards list | Shows friendly empty state if 0 orders | PLAN_DE_TRABAJO.md line 90 |
| 24 | Phase 7 | Live Tracking Deep Link | `[Ver Tracking en Vivo]` button redirects to `#tracking` with exact order context | Click on order tracking button | Navigates to `#tracking?order=...` | Falls back to latest order if ID not found | PLAN_DE_TRABAJO.md line 91 |
| 25 | Phase 7 | Session Logout | `[Cerrar Sesión]` clears active session in state/localStorage and redirects to `#home` | Click logout button | Session cleared, nav to `#home` | Resets navigation badge to 'Mi Cuenta' | PLAN_DE_TRABAJO.md line 92 |
| 26 | Phase 7 | Work Plan Checklist Completion | Marks all checklist items under FASE 4, 5, 6, 7 with `[X]` | Implementation completion | Updated `PLAN_DE_TRABAJO.md` | Ensures full tracking traceability | ORIGINAL_REQUEST.md line 39 |

---

## 8. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Module 10 | Cédula with invalid province code `'2510034065'` | Fails immediately (`provincia > 24`); returns `false`. |
| 2 | Module 10 | Cédula with third digit `'6'` (`'1760034065'`) | Fails immediately (`tercerDigito >= 6`); returns `false`. |
| 3 | Module 10 | 13-digit Natural RUC `'1710034065001'` | Extracts first 10 digits, verifies Module 10, verifies `001` suffix; returns `true`. |
| 4 | Module 10 | 13-digit RUC with invalid suffix `'1710034065002'` | Fails because natural RUC must end with `'001'`; returns `false`. |
| 5 | Credit Card | Card ending in `'0000'` (`'4111111111110000'`) | Luhn check passes, but simulated banking rule triggers rejection `#DECLINED-SEC-054` and routes to `#error`. |
| 6 | Credit Card | Card with invalid check digit (`'4111111111111112'`) | Fails Luhn sum mod 10 check; displays error toast and halts payment. |
| 7 | Shipping Rate | Delivery selection `'local_express'` (Quito) | Applies `$3.00` fee instead of national `$5.00` or pickup `$0.00`. |
| 8 | Quantity Stepper | Quantity at 1, user clicks `-` button | Decrement is ignored; quantity remains at 1 (`next < 1` check). |
| 9 | Toast System | User clicks 'Add to Cart' 4 times in 500ms | Only 1 toast visible on screen at any time; previous toasts are purged and the 2.5s timer resets. |
| 10 | Cart Removal | User deletes item and clicks 'Deshacer' | Item is restored at original index in cart, badge count updates, and confirmation banner closes. |
| 11 | PDP Adaptive | Sealed item (`booster-team-rocket`) selected | PSA radio selector and 3D buttons are completely hidden; factory seal specs & pack weight are shown. |
| 12 | Search Failover | `pokemontcg.io` endpoint returns HTTP 429 or network timeout | Service catches error, logs warning, and seamlessly fetches from `tcgdex.net`. |
| 13 | Search Failover | Both `pokemontcg.io` and `tcgdex.net` are unreachable (offline) | Service falls back to filtering local `PRODUCTS` in memory, returning matches without crashing. |
| 14 | Search Input | User types rapidly ("C-h-a-r-i-z-a-r-d") | 400ms debounce fires only once after user pauses; skeleton loaders appear during the fetch. |
| 15 | Profile | User logs out while on `#profile` | Session cleared from `Store` and `localStorage`, navbar updates, and view switches to `#home`. |

---

## 9. Feature Inventory Table

| # | Feature | Description | Milestone | Source | Acceptance Criteria |
|---|---------|-------------|-----------|--------|---------------------|
| 1 | Booster Box Isolated Assets | 3 isolated transparent PNG images (front, perspective, side) for Team Rocket Booster Box | Phase 4 | ORIGINAL_REQUEST.md:12, PLAN_DE_TRABAJO.md:8 | `img/sealed/` contains transparent images for front, 3/4 perspective, and side views. |
| 2 | Pokémon Card Visual Assets | Raichu GX card front and official Pokémon card back assets | Phase 4 | ORIGINAL_REQUEST.md:12, PLAN_DE_TRABAJO.md:8 | `img/cards/` contains properly formatted front and back card images. |
| 3 | 3D Card Inspector 'Frontal' | Vertical display with CSS holographic shimmer effect following mouse movement | Phase 4 | ORIGINAL_REQUEST.md:13, PLAN_DE_TRABAJO.md:52 | Front view displays dynamic holographic shimmer CSS layer. |
| 4 | 3D Card Inspector 'Reverso y Bordes' | 180° Y-axis rotation showing official back and 50/50 centering overlay grid | Phase 4 | ORIGINAL_REQUEST.md:14, PLAN_DE_TRABAJO.md:53 | Flips card smoothly via `rotateY(180deg)` displaying back and centering grid. |
| 5 | 3D Card Inspector 'Slab PSA' | Encapsulates card in acrylic slab border with authentic top PSA certification label in CSS | Phase 4 | ORIGINAL_REQUEST.md:15, PLAN_DE_TRABAJO.md:54 | 'Slab PSA' view encapsulates card in acrylic slab border with PSA label and barcode. |
| 6 | Adaptive PDP Logic by `tipo_item` | Conditional display hiding PSA selector/3D buttons for sealed items; showing them for individual cards | Phase 4 | ORIGINAL_REQUEST.md:16, PLAN_DE_TRABAJO.md:48-50 | PDP conditionally hides PSA selector and 3D buttons for sealed items, showing factory details. |
| 7 | PDP Quantity Stepper | Quantity selector (`- [ 1 ] +`) with minimum bound of 1 before adding to cart | Phase 4 | ORIGINAL_REQUEST.md:16, PLAN_DE_TRABAJO.md:55 | Quantity selector increments/decrements with minimum value of 1. |
| 8 | PSA Guide Modal | Accessible modal explaining PSA grading criteria and encapsulation | Phase 4 | ORIGINAL_REQUEST.md:16, PLAN_DE_TRABAJO.md:56 | The "¿Qué es un Grado PSA?" modal opens and closes correctly via button and Escape key. |
| 9 | Unified Mandatory Checkout Flow | Eliminates guest checkout; captures user data and password in a single flow | Phase 5 | ORIGINAL_REQUEST.md:19, PLAN_DE_TRABAJO.md:61-64 | Checkout requires account creation (password) and rejects anonymous checkout. |
| 10 | Ecuadorian Module 10 Validator | Validates 10-digit Cédula and 13-digit Natural RUC using official Module 10 algorithm | Phase 5 | ORIGINAL_REQUEST.md:20, PLAN_DE_TRABAJO.md:63 | Rejects invalid Ecuadorian Cédula/RUC with clear feedback. |
| 11 | Ecuadorian Phone Prefix (+593) | Enforces and formats telephone prefix (+593) followed by valid digits | Phase 5 | ORIGINAL_REQUEST.md:20, PLAN_DE_TRABAJO.md:63 | Rejects phone numbers not adhering to Ecuadorian prefix and length. |
| 12 | Dexie.js User & Order Persistence | Commits customer to `usuarios` and order to `ordenes_compra` & `items_orden`, activating session | Phase 5 | ORIGINAL_REQUEST.md:21, PLAN_DE_TRABAJO.md:65-68 | Completed checkout persists records to Dexie.js `usuarios` and `ordenes_compra` tables and sets active session in `state.js`. |
| 13 | Credit Card Luhn Algorithm | Validates credit card number integrity using Luhn checksum | Phase 5 | ORIGINAL_REQUEST.md:22, PLAN_DE_TRABAJO.md:70 | Card validation applies Luhn algorithm, rejecting malformed numbers. |
| 14 | Bank Decline Simulation `#DECLINED-SEC-054` | Rejects credit cards ending in `'0000'` with simulated error code `#DECLINED-SEC-054` | Phase 5 | ORIGINAL_REQUEST.md:22, PLAN_DE_TRABAJO.md:70 | Cards ending in `'0000'` trigger error code `#DECLINED-SEC-054` and route to `#error`. |
| 15 | 15% VAT Calculation | Calculates and renders exact 15% Ecuadorian VAT on subtotal | Phase 5 | ORIGINAL_REQUEST.md:23, PLAN_DE_TRABAJO.md:72 | Orders calculate and display 15% VAT correctly in cart, checkout, and order summaries. |
| 16 | Tri-Tier Flat Shipping Fees | Rates: $0.00 In-store Pickup, $3.00 Quito / Local Express, $5.00 National Blindado | Phase 5 | ORIGINAL_REQUEST.md:23, PLAN_DE_TRABAJO.md:71 | Applies selected shipping flat rate ($0, $3, or $5) accurately to order total. |
| 17 | Singleton Toast Notification System | Ensures at most 1 visible toast at any time, auto-dismissing in 2.5s | Phase 5 | ORIGINAL_REQUEST.md:24, PLAN_DE_TRABAJO.md:73 | Only one toast notification is visible at a time with 2.5s auto-dismiss. |
| 18 | Cart Removal Confirmation & Undo | Modal confirmation before deleting cart item, with 'Deshacer' restoration capability | Phase 5 | ORIGINAL_REQUEST.md:24, PLAN_DE_TRABAJO.md:74 | Removing item presents confirmation modal with functional undo capability. |
| 19 | Failover Search API Service | `js/services/pokemon-api.js` cascading `pokemontcg.io` -> `tcgdex.net` -> local catalog | Phase 6 | ORIGINAL_REQUEST.md:27-30, PLAN_DE_TRABAJO.md:79-82 | Queries `pokemontcg.io`, falls back to `tcgdex.net` on failure, and falls back to offline local catalogue if both fail. |
| 20 | Decoupled `#search-results` Route | Dedicated route with 400ms debounce, skeleton loaders, and friendly zero-results state | Phase 6 | ORIGINAL_REQUEST.md:31, PLAN_DE_TRABAJO.md:83 | Triggers queries with 400ms debounce, displays skeleton loaders during fetch, and presents zero-results message when empty. |
| 21 | Reactive User Profile `#profile` | Dedicated profile view linked to Dexie.js for active user | Phase 7 | ORIGINAL_REQUEST.md:34, PLAN_DE_TRABAJO.md:88 | Renders reactive `#profile` view querying Dexie.js tables for active user. |
| 22 | "Mis Datos Personales" Tab | Form allowing editing of name, phone, and saved shipping address in Dexie.js | Phase 7 | ORIGINAL_REQUEST.md:35, PLAN_DE_TRABAJO.md:89 | Allows editing user details and updates the corresponding record in Dexie.js and session. |
| 23 | "Mis Últimas Compras" Order History | Queries `ordenes_compra` by `usuario_cedula`, rendering past orders with thumbnails and status | Phase 7 | ORIGINAL_REQUEST.md:36, PLAN_DE_TRABAJO.md:90 | Displays past orders for active user with thumbnails, date, payment method, and logistic status. |
| 24 | [Ver Tracking en Vivo] Action | Action button on past orders navigating to `#tracking` with accurate order context | Phase 7 | ORIGINAL_REQUEST.md:37, PLAN_DE_TRABAJO.md:91 | Working `[Ver Tracking en Vivo]` links on each order redirecting to `#tracking` with exact order data. |
| 25 | [Cerrar Sesión] Action | Clears active session state and redirects to `#home` | Phase 7 | ORIGINAL_REQUEST.md:38, PLAN_DE_TRABAJO.md:92 | Logout button clears user session from state and localStorage, navigating to `#home`. |
| 26 | Work Plan Checklist Synchronization | Updates `PLAN_DE_TRABAJO.md` marking all items under FASE 4, 5, 6, 7 with `[X]` | Phase 7 | ORIGINAL_REQUEST.md:39, PLAN_DE_TRABAJO.md:47-93 | In `PLAN_DE_TRABAJO.md`, all checklist items under `FASE 4`, `FASE 5`, `FASE 6`, and `FASE 7` are marked with `[X]`. |

---

## 10. Work Plan Status & Tracking Checklist

- [ ] **FASE 4: Ficha de Producto (PDP) e Inspector Técnico Adaptativo**
  - [ ] Visual assets in `img/sealed/` (Team Rocket box: front, perspective, side) and `img/cards/` (Raichu GX front, official card back).
  - [ ] Conditional PDP logic according to `tipo_item` (`PRODUCTO_SELLADO` hides PSA selector and 3D buttons; `CARTA_INDIVIDUAL` enables them).
  - [ ] Inspector 3D: 'Frontal' (holographic shimmer), 'Reverso y Bordes' (`rotateY(180deg)` + 50/50 centering overlay), 'Slab PSA' (acrylic slab + top label).
  - [ ] Quantity selector (`- [ 1 ] +`, min 1).
  - [ ] Accessible modal: "¿Qué es un Grado PSA?".
- [ ] **FASE 5: Carrito, Checkout con Registro Obligatorio y Validaciones Ecuatorianas**
  - [ ] Eliminate anonymous guest checkout; unified checkout requiring password.
  - [ ] Capture mandatory data: Name, Cédula/RUC (Module 10), Phone (+593), Address, Password.
  - [ ] Dexie.js persistence in `usuarios` and `ordenes_compra` with session activation in `state.js`.
  - [ ] Card validation with Luhn; ending in `'0000'` triggers `#DECLINED-SEC-054`.
  - [ ] Flat shipping fees: $3.00 (Quito), $5.00 (National), $0.00 (In-Store Pickup).
  - [ ] Exact 15% VAT breakdown.
  - [ ] Singleton toast notification system (max 1 active toast, 2.5s auto-dismiss).
  - [ ] Modal confirmation before deleting cart items with 'Deshacer' (undo).
- [ ] **FASE 6: Doble API de Búsqueda con Failover**
  - [ ] Create `js/services/pokemon-api.js` with failover: `pokemontcg.io` -> `tcgdex.net` -> local catalogue.
  - [ ] Create decoupled `#search-results` view with 400ms debounce, skeleton loaders, and zero-results state.
- [ ] **FASE 7: Perfil de Usuario, Historial "Mis Últimas Compras" y Despliegue**
  - [ ] Reactive `#profile` view connected to Dexie.js.
  - [ ] Tab "Mis Datos Personales" (editing name, phone, saved address).
  - [ ] Tab "Mis Últimas Compras" (querying `ordenes_compra` with thumbnails, date, payment method, status).
  - [ ] Button `[Ver Tracking en Vivo]` on each past order redirecting to `#tracking`.
  - [ ] Button `[Cerrar Sesión]` clearing state and redirecting to `#home`.
  - [ ] Update `PLAN_DE_TRABAJO.md` marking all checklist items under FASE 4, 5, 6, 7 with `[X]`.
