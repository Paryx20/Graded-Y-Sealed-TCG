# Handoff Report — Milestone 2 Exploration (R1: Tracking & R2: Google Auth)

**Mission**: Formulate the exact, comprehensive implementation strategy for Requirement R1 (Differentiated Live Order Tracking Simulation) and Requirement R2 (Universal Google Sign-In Integration).  
**Author**: explorer_m2_1  
**Recipient**: orchestrator (d0559baa-cd30-4455-b406-13994e294aca) / worker_m2  

---

## 1. Observation

### 1.1 Baseline Test Suite Execution
- **Command**: `node --test tests/*.test.mjs`
- **Output**: 356 passed, 0 failed, duration ~3.05s.
- **Critical Test Invariants Observed**:
  - `tests/challenger_stress_r4_r5_r6.test.mjs` lines 407–474:
    * Invariant 1: Clean session with empty orders renders active simulated timeline `#GS-2026-9481`, courier `Servientrega Blindado • Bóveda G&S`, and tracking number `GUI-EC-948102-PSA`.
    * Invariant 2: Tracking view contains **ZERO** manual simulation control buttons (prohibits phrases like "Avanzar paso", "Simular despacho", "Paso siguiente", etc.).
    * Invariant 3: Placing a real order updates tracking with real purchase details and overrides the simulation.
  - `tests/test_google_auth_profile.test.mjs` lines 102–186:
    * Invariant 1: Unauthenticated session contains **ZERO** hardcoded mock identity data (guest inputs must have `value=""`).
    * Invariant 2: Pure JS `decodeJwtResponse` handles base64url, UTF-8 accented characters, and invalid tokens gracefully without throwing.
    * Invariant 3: Dual-mode GIS initialization mounts official `google.accounts.id.renderButton` when client ID is valid, or Material Design button `#btn-google-fallback` (`Continuar con Google`) when unconfigured or offline.
    * Invariant 4: `app.logoutUser()` purges session storage, calls `google.accounts.id.disableAutoSelect()`, and resets `#nav-user-label` to "Mi Cuenta".

---

### 1.2 Direct Codebase Observations — Requirement R1 (Tracking Simulation & Differentiation)
- **`js/views/tracking.js`**:
  1. *Absence of Simulation Timer and Lifecycle Hooks*:
     - Lines 14–276: `TrackingView` contains no `afterRender()` method, no timer property, and zero `setTimeout`/`setInterval` calls.
     - When navigating to `#tracking`, Stage 2 ("2. Autenticación PSA" in `#GS-2026-9481` or "2. En Preparación" in `getDefaultStages`) remains in status `'active'` indefinitely. It never transitions to completed (`✓`), and Stage 3 never activates dynamically.
  2. *Unconditional Courier Truck Display*:
     - Line 164: `<i data-lucide="truck" class="w-3.5 h-3.5 text-slate-500"></i> <span>Guía: ${trackingNumber}</span>` renders unconditionally for every order, even if the customer chose in-store pickup ("Retiro en Local Físico").
     - Line 174: `<p class="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1.5"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#059669]"></i> <span>Courier: <strong>${courierName}</strong> • Estimada: <strong>${estimatedDelivery}</strong></span></p>` unconditionally shows courier transit information.
     - Lines 80–117: `getDefaultStages(order)` returns hardcoded courier stages ("3. En Camino / Despacho", "Transporte Blindado", "Valija de seguridad") regardless of delivery method.
     - *Missing Local Pickup Card*: The view contains no branch for "Retiro en Local / Bóveda Quito" displaying the physical address (Av. República del Salvador N34-183), opening hours (Lun-Sáb 09:00 - 18:00), or mandatory Cédula presentation requirement.
- **`js/views/checkout.js`**:
  - Lines 150–185: Users can select 3 delivery options (`courier` $5.00, `quito` $3.00, `pickup` $0.00).
  - Lines 710–768: `processPayment()` sets `metodo_entrega: Store.data.deliveryMethod`, but:
    * Line 715: Unconditionally assigns `courierName: 'Servientrega Blindado • Bóveda G&S'` even when `Store.data.deliveryMethod === 'pickup'`.
    * Line 716: Unconditionally assigns `estimatedDelivery: '2 a 3 días hábiles (Entrega Garantizada)'`.
    * Lines 737–766: Unconditionally populates `stages` with courier stages ("3. En Camino / Despacho" / "Transporte Blindado").
- **`js/app.js`**:
  - Lines 162–169: `renderCurrentView()` only calls `afterRender()` for `pdp`, `search-results`, and `profile`. It does NOT call `TrackingView.afterRender()`.

---

### 1.3 Direct Codebase Observations — Requirement R2 (Universal Google Sign-In Integration)
- **`Captura 2 (media_1793634228982_2f8039b1.jpg)`**:
  - Auth portal (`#auth`) shows only standard email/password inputs and "Acceder a mi Cuenta". The Google Sign-In button is completely missing.
- **`js/views/checkout.js`**:
  - Lines 376–459: `CheckoutView.renderAuth()` renders `#auth`:
    * Tab `login` (lines 404–416): Contains only `auth-email`, `auth-password`, and submit button. Contains NO Google Sign-In container.
    * Tab `register` (lines 418–454): Contains registration fields and submit button. Contains NO Google Sign-In container.
  - Lines 43–60: `CheckoutView.renderCheckout()` renders quick login sidebar when `!Store.data.currentUser`:
    * Contains only `login-email-checkout`, `login-pass-checkout`, and "Iniciar Sesión y Precargar". Contains NO Google Sign-In container.
  - `CheckoutView` does not define `afterAuthRender()`, `afterCheckoutRender()`, or `afterRender()`.
- **`js/app.js`**:
  - Lines 162–169: `renderCurrentView()` does not invoke any post-render hooks for `view === 'auth'` or `view === 'checkout'`.
  - Lines 433–485: `initGoogleSignIn(containerId = 'google-signin-container')` has a default container ID but can take any container ID.
  - Lines 518–535: `handleSimulatedGoogleLogin()` creates user `Patrick Mora` (`patrickmora2006@gmail.com`), sets `Store.data.currentUser`, updates the navbar, and calls `this.renderCurrentView()`.

---

## 2. Logic Chain

### 2.1 Logic Chain for Requirement R1 (Accelerated Differentiated Tracking)
1. **Observation**: Stage 2 in `#tracking` is static; users see no progression unless they manually refresh or place orders, and manual simulation buttons are strictly prohibited by tests.
2. **Requirement**: Acelerar la progresión temporal de la simulación de despacho para que el hito de preparación se complete rápidamente con su indicador de check y continúe fluido hacia la siguiente etapa; para "Retiro en Local / Bóveda Quito", suprimir la animación del camión y mostrar disponibilidad para retiro presencial, dirección, horarios y cédula; para "Envío a Domicilio", mostrar avance del transporte blindado.
3. **Timer Architecture**:
   - In `TrackingView`, add:
     * `_simulationTimer = null`
     * `clearSimulationTimer()`: clears any active timeout to prevent race conditions and memory leaks.
     * `afterRender()`: calls `clearSimulationTimer()`, then `initSimulationTimer()`.
   - `initSimulationTimer()`:
     * Inspects active order (`order.stages[1]`). If `order.stages[1].status === 'active'`:
     * Schedules a non-blocking `setTimeout(..., 2000)` (~2 seconds):
       1. Advances `order.stages[1].status = 'completed'` (displays checkmark `✓` icon `<i data-lucide="check"></i>`).
       2. Advances `order.stages[2].status = 'active'` (displays pulsing package icon `<i data-lucide="package" class="animate-pulse"></i>`).
       3. Sets order status:
          - If pickup: `order.status = 'Listo para Retiro en Bóveda'`.
          - If delivery: `order.status = 'En Camino / Despacho Blindado'`.
       4. Persists in `Store` via `Store.saveOrders()`.
       5. Performs smooth DOM update via `this.updateStagesDOM(order)`:
          - Updates `#tracking-status-badge`
          - Updates `#tracking-timeline-container` inner HTML
          - Calls `lucide.createIcons()`
          - Emits feedback toast notification
4. **Pickup vs Delivery Differentiation**:
   - Helper: `const isPickup = order.metodo_entrega === 'pickup' || (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));`
   - If `isPickup`:
     * Header Guide Tag: `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#059669]"></i> <span>Código de Retiro: ${trackingNumber}</span>`
     * Header Subtitle: `<i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#E11D48]"></i> <span>Punto de Retiro: <strong>Bóveda Central Quito</strong> • Horario: <strong>Lun-Sáb 09:00 - 18:00</strong></span>`
     * Suppress all truck icons (`data-lucide="truck"`) and transit animations.
     * Render Dedicated Vault Pickup Card ("Tarjeta de Retiro Seguro en Bóveda Central Quito"):
       - Dirección: `Av. República del Salvador N34-183 y Moscú, Edificio Bóveda Central, Piso 2, Quito`
       - Horario de Atención: `Lunes a Sábado: 09:00 - 18:00 (Previa Cita o Inmediata)`
       - Requisitos Obligatorios: `1) Cédula de Identidad original del titular registrado (${order.buyerName || 'Coleccionista'}), 2) Comprobante / Código de orden.`
   - If `!isPickup` (Delivery):
     * Header Guide Tag: `<i data-lucide="truck" class="w-3.5 h-3.5 text-slate-500"></i> <span>Guía: ${trackingNumber}</span>`
     * Subtitle: `Courier: <strong>${courierName}</strong> • Estimada: <strong>${estimatedDelivery}</strong>`
     * Render Armored Courier In-Transit Card:
       - Visual security track with moving/pulsing truck icon (`<i data-lucide="truck" class="w-5 h-5 text-amber-400 animate-bounce"></i>`).
       - Details: `Transporte Blindado Especializado • Monitoreo Satelital GPS & Custodia Armada en Ruta`.
5. **Checkout Order Record Sync**:
   - In `CheckoutView.processPayment()`:
     * When `Store.data.deliveryMethod === 'pickup'`:
       - `trackingCode = 'RET-UIO-' + randomNum`
       - `courierName = 'Retiro Presencial en Bóveda Central Quito'`
       - `estimatedDelivery = 'Listo para retiro inmediato en Bóveda'`
       - `stages = pickupStages` (Stage 3: "3. Listo para Retiro en Bóveda", Stage 4: "4. Retirado en Bóveda")
     * When `Store.data.deliveryMethod !== 'pickup'`:
       - `trackingCode = 'GUI-EC-' + randomNum + '-PSA'`
       - `courierName = 'Servientrega Blindado • Bóveda G&S'`
       - `estimatedDelivery = '2 a 3 días hábiles (Entrega Garantizada)'`
       - `stages = deliveryStages` (Stage 3: "3. En Camino / Despacho", Stage 4: "4. Entregado")

---

### 2.2 Logic Chain for Requirement R2 (Universal Google Sign-In Integration)
1. **Observation**: Google OAuth SDK (`index.html`) and logic (`app.js`) already exist, but neither `#auth` (login/register) nor `#checkout` render containers for Google Sign-In, and `app.js` does not invoke post-render hooks for those views.
2. **Requirement**: Implement the Google Sign-In button visibly and functionally in the "Iniciar Sesión" tab, the "Crear Cuenta / Registrarse" tab within `#auth`, and during Checkout. Use the official GIS SDK with interactive fallback if client ID is unconfigured, updating session state and navbar without console errors.
3. **Container Identification**:
   - `#auth` Login Tab: `<div id="google-signin-container-auth-login" class="flex justify-center min-h-[44px]"></div>`
   - `#auth` Register Tab: `<div id="google-signin-container-auth-register" class="flex justify-center min-h-[44px]"></div>`
   - `#checkout` Quick Login: `<div id="google-signin-container-checkout" class="flex justify-center min-h-[44px]"></div>`
4. **Lifecycle Hooks in `CheckoutView`**:
   - `afterAuthRender()`: Calls `app.initGoogleSignIn(this.authTab === 'login' ? 'google-signin-container-auth-login' : 'google-signin-container-auth-register')`.
   - `afterCheckoutRender()`: If `!Store.data.currentUser`, calls `app.initGoogleSignIn('google-signin-container-checkout')`.
   - `afterRender()`: Dispatches to `afterAuthRender()` or `afterCheckoutRender()` based on `Store.data.currentView`.
5. **Hook Invocation in `js/app.js`**:
   - In `renderCurrentView()`:
     ```javascript
     if (view === 'auth' && typeof CheckoutView !== 'undefined') {
       if (typeof CheckoutView.afterAuthRender === 'function') CheckoutView.afterAuthRender();
     } else if (view === 'checkout' && typeof CheckoutView !== 'undefined') {
       if (typeof CheckoutView.afterCheckoutRender === 'function') CheckoutView.afterCheckoutRender();
     }
     ```
6. **Authentication & Session Synchronization**:
   - When a user logs in via Google (either official GIS response or simulated login):
     * `Store.data.currentUser` is set with verified fields (`authProvider: 'google'`).
     * `Store.saveUserSession()` writes to `localStorage`.
     * `app.updateNavbarUserUI()` updates `#nav-user-label` with user's name and applies amber border.
     * Route resolution:
       - If on `#auth`: redirect to `#profile` (`window.location.hash = '#profile'`).
       - If on `#checkout`: re-render checkout view (`this.renderCurrentView()`), which immediately replaces the quick login sidebar with the verified session card and prefills `guest-name`, `guest-email`, etc.!
       - If on `#profile`: re-render profile view.

---

## 3. Caveats

1. **Automated Test Constraints & Invariants**:
   - `tests/challenger_stress_r4_r5_r6.test.mjs` strictly asserts that `#tracking` contains **ZERO** manual simulation buttons. The accelerated progression timer MUST remain entirely automatic via `setTimeout` in `afterRender()`, without creating "Avanzar paso" or "Simular" buttons.
   - For simulated order `#GS-2026-9481`, existing test assertions expect strings like `ORDEN #GS-2026-9481`, `GUI-EC-948102-PSA`, `Servientrega Blindado • Bóveda G&S`, and `Autenticación PSA`. The simulated order must preserve these delivery defaults initially before the timer progresses.
   - Unauthenticated guest checkout tests enforce that `guest-city` must be rendered with `value=""`. We must not introduce default city strings for guest checkout.
2. **Timer Cancellation Discipline**:
   - Whenever the view changes away from `#tracking` (in `app.handleRoute()`), `TrackingView.clearSimulationTimer()` must be called to guarantee no orphan background timers execute.
3. **Read-Only Explorer Boundaries**:
   - As an explorer agent, no project source files have been altered directly. All technical strategies, before/after code snippets, and verification plans are provided for the implementation worker.

---

## 4. Conclusion & Concrete Implementation Strategy

### 4.1 Exact Code Strategy for `js/views/tracking.js`

#### Code Snippet A: Add Timer Properties & Methods to `TrackingView`
```javascript
// Add to TrackingView object:
  _simulationTimer: null,

  clearSimulationTimer() {
    if (this._simulationTimer) {
      clearTimeout(this._simulationTimer);
      this._simulationTimer = null;
    }
  },

  afterRender() {
    this.clearSimulationTimer();
    this.initSimulationTimer();
  },

  initSimulationTimer() {
    let order = (typeof Store !== 'undefined' && Store.getOrderById)
      ? Store.getOrderById(Store.data.activeTrackingOrderId)
      : null;

    if (!order) {
      order = this.getSimulatedOrder();
    }

    if (!order || !Array.isArray(order.stages) || order.stages.length < 3) {
      return;
    }

    // Check if Stage 2 is currently in active state
    const stage2 = order.stages[1];
    if (stage2 && stage2.status === 'active') {
      this._simulationTimer = setTimeout(() => {
        // 1. Transition Stage 2 to completed
        stage2.status = 'completed';
        if (!stage2.date || stage2.date.includes('Est')) {
          stage2.date = 'Completado hace unos momentos';
        }

        // 2. Transition Stage 3 to active
        if (order.stages[2]) {
          order.stages[2].status = 'active';
        }

        // 3. Update order overall status
        const isPickup = order.metodo_entrega === 'pickup' || 
                         (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
        order.status = isPickup 
          ? 'Listo para Retiro en Bóveda' 
          : 'En Camino / Despacho Blindado';

        // 4. Persist in Store if in orders list
        if (typeof Store !== 'undefined' && typeof Store.saveOrders === 'function') {
          Store.saveOrders();
        }

        // 5. Fluid DOM update without page reload
        this.updateStagesDOM(order);
      }, 2000);
    }
  },

  updateStagesDOM(order) {
    const statusBadge = document.getElementById('tracking-status-badge');
    if (statusBadge) {
      statusBadge.innerText = order.status;
    }

    const timelineContainer = document.getElementById('tracking-timeline-container');
    if (timelineContainer) {
      timelineContainer.innerHTML = this.renderTimelineStages(order.stages);
    }

    const transitSection = document.getElementById('tracking-transit-section');
    if (transitSection) {
      const isPickup = order.metodo_entrega === 'pickup' || 
                       (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
      transitSection.innerHTML = isPickup 
        ? this.renderPickupCard(order) 
        : this.renderArmoredTransitCard(order);
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    if (typeof app !== 'undefined' && typeof app.showToast === 'function') {
      const isPickup = order.metodo_entrega === 'pickup' || 
                       (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
      app.showToast(
        isPickup 
          ? '¡Hito completado! Tu orden está lista para retiro en Bóveda Central Quito.' 
          : '¡Hito completado! Tu orden ha sido despachada en transporte blindado.',
        'success'
      );
    }
  },
```

#### Code Snippet B: Render Differentiation (Pickup vs Delivery)
```javascript
  renderPickupCard(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-xs">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <i data-lucide="shield-check" class="w-6 h-6"></i>
          </div>
          <div class="flex-1 space-y-2">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Retiro Seguro en Bóveda Central Quito
              </span>
              <h3 class="text-base font-black text-[#0F172A] mt-1">Listo para retiro presencial en Bóveda</h3>
              <p class="text-xs text-slate-600 mt-0.5">
                Tu pieza certificada se encuentra resguardada en caja fuerte climatizada y lista para entrega en sala privada.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div class="p-3 bg-white border border-emerald-100 rounded-xl">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Dirección de Retiro:</span>
                <strong class="text-[#0F172A] block mt-0.5">Av. República del Salvador N34-183 y Moscú</strong>
                <span class="text-slate-500 text-[11px] block">Edificio Bóveda Central, Piso 2, Quito</span>
              </div>

              <div class="p-3 bg-white border border-emerald-100 rounded-xl">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Horario de Atención:</span>
                <strong class="text-[#0F172A] block mt-0.5">Lunes a Sábado: 09:00 - 18:00</strong>
                <span class="text-slate-500 text-[11px] block">Entrega inmediata en ventanilla de seguridad</span>
              </div>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 text-amber-700 flex-shrink-0"></i>
              <span><strong>Requisito Obligatorio:</strong> Presentar Cédula de Identidad original del titular registrado (<strong>${order.buyerName || 'Coleccionista'}</strong>) o código QR de orden.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderArmoredTransitCard(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-[#0F172A] text-white rounded-2xl shadow-md border border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <i data-lucide="truck" class="w-5 h-5 animate-pulse"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-[#FEF3C7]">Transporte Blindado Especializado en Tránsito</h3>
              <span class="text-[11px] text-slate-400">${order.courierName || 'Servientrega Blindado • Bóveda G&S'}</span>
            </div>
          </div>
          <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg self-start sm:self-center">
            GPS Activo • Valija Nivel IV
          </span>
        </div>

        <div class="pt-4 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Bóveda Central Quito</span>
            <span class="font-mono text-amber-400 font-bold">En Ruta de Entrega</span>
            <span>${order.buyerName || 'Destinatario'}</span>
          </div>
          <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
            <div class="bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-400 h-full w-2/3 rounded-full relative">
              <div class="absolute right-0 top-0 bottom-0 w-2 bg-white animate-ping"></div>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 pt-1">
            Entrega blindada con protocolo de seguridad personal y verificación contra documento de identidad.
          </p>
        </div>
      </div>
    `;
  },
```

#### Code Snippet C: `getDefaultStages(order)` Branching
```javascript
  getDefaultStages(order) {
    const orderDate = order?.date || '02 Nov 2026';
    const status = (order?.status || order?.estado || '').toUpperCase();
    
    const isDelivered = status.includes('ENTREGADO') || status.includes('RETIRADO');
    const isInTransit = isDelivered || status.includes('TRANSITO') || status.includes('CAMINO') || status.includes('DESPACHADO') || status.includes('LISTO');
    const isPickup = order?.metodo_entrega === 'pickup' || 
                     (order?.deliveryMethod && /retiro/i.test(order.deliveryMethod));

    if (isPickup) {
      return [
        {
          title: '1. Orden Recibida',
          subtitle: 'Pago Verificado TLS 256-bit',
          date: orderDate,
          status: 'completed',
          detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
        },
        {
          title: '2. En Preparación',
          subtitle: 'Sellado UV en Bóveda',
          date: orderDate,
          status: isInTransit ? 'completed' : 'active',
          detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
        },
        {
          title: '3. Listo para Retiro en Bóveda',
          subtitle: 'Bóveda Central Quito • Sala Privada',
          date: isInTransit ? 'Disponible Ahora' : 'Programado (24h)',
          status: isDelivered ? 'completed' : (isInTransit ? 'active' : 'pending'),
          detail: 'Disponible para entrega en ventanilla de seguridad. Presentar cédula original.'
        },
        {
          title: '4. Retirado en Bóveda',
          subtitle: 'Custodia Transferida contra Cédula',
          date: isDelivered ? 'Retiro completado' : 'Pendiente de retiro',
          status: isDelivered ? 'completed' : 'pending',
          detail: 'Recepción formal por el titular con documento de identidad original.'
        }
      ];
    }

    return [
      {
        title: '1. Orden Recibida',
        subtitle: 'Pago Verificado TLS 256-bit',
        date: orderDate,
        status: 'completed',
        detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
      },
      {
        title: '2. En Preparación',
        subtitle: 'Sellado UV en Bóveda',
        date: orderDate,
        status: isInTransit ? 'completed' : 'active',
        detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
      },
      {
        title: '3. En Camino / Despacho',
        subtitle: 'Transporte Blindado',
        date: isInTransit ? (isDelivered ? 'Completado' : 'En tránsito') : 'Programado (24-48h)',
        status: isDelivered ? 'completed' : (isInTransit ? 'active' : 'pending'),
        detail: 'Embalaje con precinto tamper-evident en valija de seguridad.'
      },
      {
        title: '4. Entregado',
        subtitle: 'Custodia contra Documento',
        date: isDelivered ? 'Recepción confirmada' : 'Pendiente de entrega',
        status: isDelivered ? 'completed' : 'pending',
        detail: 'Recepción formal por el titular con documento de identidad.'
      }
    ];
  },
```

---

### 4.2 Exact Code Strategy for `js/views/checkout.js`

#### Code Snippet A: Adding Google Sign-In Containers to Auth Tabs
In `CheckoutView.renderAuth()`:
```html
          <!-- Inside Tab Iniciar Sesión, below the password field or below the submit button: -->
          ${isLogin ? `
            <form onsubmit="event.preventDefault(); CheckoutView.submitLogin();" class="space-y-4">
              <div>
                <label for="auth-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                <input type="email" id="auth-email" placeholder="tu.correo@ejemplo.com" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label for="auth-password" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña: *</label>
                <input type="password" id="auth-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <button type="submit" class="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-extrabold rounded-xl transition shadow touch-target">
                Acceder a mi Cuenta
              </button>
            </form>

            <div class="relative my-4">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
              <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-slate-400 font-bold">o continúa con</span></div>
            </div>
            <div id="google-signin-container-auth-login" class="flex justify-center min-h-[44px]"></div>
          ` : `
            <form onsubmit="event.preventDefault(); CheckoutView.submitRegister();" class="space-y-3.5">
              ...
              <button type="submit" class="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-extrabold rounded-xl transition shadow touch-target">
                Registrar mi Cuenta
              </button>
            </form>

            <div class="relative my-4">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
              <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-slate-400 font-bold">o regístrate en 1-clic con</span></div>
            </div>
            <div id="google-signin-container-auth-register" class="flex justify-center min-h-[44px]"></div>
          `}
```

#### Code Snippet B: Adding Google Sign-In Container to Checkout Sidebar
In `CheckoutView.renderCheckout()`:
```html
            ${user ? `
              <div class="mt-4 space-y-3">
                <p class="text-xs text-slate-600">Tus datos de perfil se han precargado automáticamente para esta orden.</p>
                ...
              </div>
            ` : `
              <div class="mt-3 space-y-3">
                <p class="text-xs text-slate-600">Para garantizar la autenticidad y custodia certificada, <strong>toda compra requiere registro obligatorio</strong>. Si ya tienes cuenta, inicia sesión aquí:</p>
                <form onsubmit="event.preventDefault(); CheckoutView.handleQuickLogin();" class="mt-2 space-y-3">
                  <div>
                    <label for="login-email-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico:</label>
                    <input type="email" id="login-email-checkout" placeholder="tu.correo@ejemplo.com" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                  </div>
                  <div>
                    <label for="login-pass-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña:</label>
                    <input type="password" id="login-pass-checkout" placeholder="••••••••" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                  </div>
                  <button type="submit" class="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg transition touch-target">
                    Iniciar Sesión y Precargar
                  </button>
                </form>

                <div class="relative my-3">
                  <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
                  <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-slate-400 font-bold">o con tu cuenta</span></div>
                </div>
                <div id="google-signin-container-checkout" class="flex justify-center min-h-[44px]"></div>
              </div>
            `}
```

#### Code Snippet C: Lifecycle Methods in `CheckoutView`
```javascript
  afterAuthRender() {
    if (typeof app !== 'undefined' && typeof app.initGoogleSignIn === 'function') {
      const containerId = this.authTab === 'login'
        ? 'google-signin-container-auth-login'
        : 'google-signin-container-auth-register';
      app.initGoogleSignIn(containerId);
    }
  },

  afterCheckoutRender() {
    if (!Store.data.currentUser) {
      if (typeof app !== 'undefined' && typeof app.initGoogleSignIn === 'function') {
        app.initGoogleSignIn('google-signin-container-checkout');
      }
    }
  },

  afterRender() {
    if (Store.data.currentView === 'auth') {
      this.afterAuthRender();
    } else if (Store.data.currentView === 'checkout') {
      this.afterCheckoutRender();
    }
  },
```

#### Code Snippet D: Pickup Differentiation in `processPayment()`
In `CheckoutView.processPayment()`:
```javascript
      const isPickupOrder = Store.data.deliveryMethod === 'pickup';
      const trackingCode = isPickupOrder
        ? `RET-UIO-${Math.floor(100000 + Math.random() * 900000)}`
        : `GUI-EC-${Math.floor(100000 + Math.random() * 900000)}-PSA`;
      const courierName = isPickupOrder
        ? 'Retiro Presencial en Bóveda Central Quito'
        : 'Servientrega Blindado • Bóveda G&S';
      const estimatedDelivery = isPickupOrder
        ? 'Listo para retiro inmediato en Bóveda'
        : '2 a 3 días hábiles (Entrega Garantizada)';
      const initialStatus = isPickupOrder
        ? 'En Preparación / Listo para Retiro'
        : 'En Preparación / En Custodia';

      const orderRecord = {
        numero_orden: orderId,
        orderId,
        trackingNumber: trackingCode,
        courierName,
        estimatedDelivery,
        usuario_cedula: idCard,
        buyerName: name,
        buyerId: idCard,
        buyerEmail: email,
        buyerPhone: formattedPhone,
        fecha_creacion: now.toISOString(),
        date: formattedDate,
        subtotal,
        iva_15: tax,
        tax,
        costo_envio: shipping,
        shipping,
        total,
        metodo_pago: methodLabel,
        paymentMethod: methodLabel,
        metodo_entrega: Store.data.deliveryMethod,
        deliveryMethod: deliveryLabel,
        estado: 'CONFIRMADO',
        status: initialStatus,
        estado_logistico: 'CONFIRMADO',
        stages: isPickupOrder ? [
          {
            title: '1. Orden Recibida',
            subtitle: 'Pago Verificado TLS 256-bit',
            date: formattedDate,
            status: 'completed',
            detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
          },
          {
            title: '2. En Preparación',
            subtitle: 'Sellado UV & Autenticación Bóveda',
            date: formattedDate,
            status: 'active',
            detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
          },
          {
            title: '3. Listo para Retiro en Bóveda',
            subtitle: 'Bóveda Central Quito • Sala de Entrega Privada',
            date: 'Inmediata (Horario Bóveda)',
            status: 'pending',
            detail: 'Disponible para retiro en ventanilla de seguridad. Presentar cédula de identidad original.'
          },
          {
            title: '4. Retirado en Bóveda',
            subtitle: 'Custodia Transferida contra Cédula',
            date: 'Pendiente de retiro',
            status: 'pending',
            detail: 'Recepción formal por el titular con documento de identidad original.'
          }
        ] : [
          {
            title: '1. Orden Recibida',
            subtitle: 'Pago Verificado TLS 256-bit',
            date: formattedDate,
            status: 'completed',
            detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
          },
          {
            title: '2. En Preparación',
            subtitle: 'Sellado UV & Autenticación Bóveda',
            date: formattedDate,
            status: 'active',
            detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
          },
          {
            title: '3. En Camino / Despacho',
            subtitle: 'Transporte Blindado',
            date: 'Programado (24-48h)',
            status: 'pending',
            detail: 'Embalaje con precinto tamper-evident en valija de seguridad.'
          },
          {
            title: '4. Entregado',
            subtitle: 'Custodia contra Documento',
            date: 'Pendiente de entrega',
            status: 'pending',
            detail: 'Recepción formal por el titular con documento de identidad.'
          }
        ],
        items: [...Store.data.cart]
      };
```

---

### 4.3 Exact Code Strategy for `js/app.js`

#### Code Snippet A: In `renderCurrentView()` (Lifecycle Invocations)
```javascript
    if (view === 'pdp') {
      PDPView.afterRender();
    } else if (view === 'search-results' && typeof SearchResultsView !== 'undefined' && SearchResultsView.afterRender) {
      SearchResultsView.afterRender();
    } else if (view === 'profile' && typeof ProfileView !== 'undefined' && ProfileView.afterRender) {
      ProfileView.afterRender();
    } else if (view === 'tracking' && typeof TrackingView !== 'undefined' && TrackingView.afterRender) {
      TrackingView.afterRender();
    } else if (view === 'auth' && typeof CheckoutView !== 'undefined') {
      if (typeof CheckoutView.afterAuthRender === 'function') {
        CheckoutView.afterAuthRender();
      } else if (typeof CheckoutView.afterRender === 'function') {
        CheckoutView.afterRender();
      }
    } else if (view === 'checkout' && typeof CheckoutView !== 'undefined') {
      if (typeof CheckoutView.afterCheckoutRender === 'function') {
        CheckoutView.afterCheckoutRender();
      } else if (typeof CheckoutView.afterRender === 'function') {
        CheckoutView.afterRender();
      }
    }
```

#### Code Snippet B: In `handleRoute()` (Timer Cleanup)
```javascript
    // In handleRoute(), before switching away from tracking:
    if (typeof TrackingView !== 'undefined' && typeof TrackingView.clearSimulationTimer === 'function') {
      TrackingView.clearSimulationTimer();
    }
```

#### Code Snippet C: In Google Sign-In Callbacks (Post-Auth Navigation)
In `handleGoogleCredentialResponse(response)` and `handleSimulatedGoogleLogin()`:
```javascript
    // After setting currentUser, saving session, and updating navbar:
    if (Store.data.currentView === 'auth') {
      window.location.hash = '#profile';
    } else {
      this.renderCurrentView();
    }
```

---

## 5. Verification Method

### 5.1 Automated Regression Verification
Run the complete automated test suite to ensure that 100% of the 356 existing tests remain completely green:
```powershell
node --test tests/*.test.mjs
```

### 5.2 Dedicated Test Suite for R1 & R2
A dedicated verification test file (e.g. `tests/test_m2_r1_r2.test.mjs`) should verify:
1. **R1 Progression Timer**:
   - Initial render of `#tracking` with `#GS-2026-9481` has Stage 2 active.
   - Advance clock by 2100ms via simulated timer or `initSimulationTimer()`.
   - Verify Stage 2 transitions to `status: 'completed'` (renders check icon `✓`).
   - Verify Stage 3 transitions to `status: 'active'`.
2. **R1 In-Store Pickup Differentiation**:
   - Create an order with `metodo_entrega: 'pickup'`.
   - Set as `activeTrackingOrderId` and render `#tracking`.
   - Verify header displays `Código de Retiro: RET-UIO-...` with shield icon.
   - Verify **ZERO** truck icons (`data-lucide="truck"`) exist in the pickup view.
   - Verify presence of Bóveda Central Quito address (`Av. República del Salvador N34-183`).
   - Verify presence of schedule (`09:00 - 18:00`) and ID card requirement (`Cédula de Identidad`).
3. **R1 Delivery Mode Differentiation**:
   - Create an order with `metodo_entrega: 'courier'`.
   - Render `#tracking`.
   - Verify truck icon and armored transport in-transit tracking animation are present.
4. **R2 Google Sign-In in Auth Login Tab**:
   - Switch `CheckoutView.authTab = 'login'`.
   - Render `CheckoutView.renderAuth()`.
   - Verify `#google-signin-container-auth-login` is present in DOM.
   - Call `CheckoutView.afterAuthRender()`.
   - Verify `#btn-google-fallback` or GIS button is mounted in container.
5. **R2 Google Sign-In in Auth Register Tab**:
   - Switch `CheckoutView.authTab = 'register'`.
   - Render `CheckoutView.renderAuth()`.
   - Verify `#google-signin-container-auth-register` is present in DOM.
   - Call `CheckoutView.afterAuthRender()`.
   - Verify `#btn-google-fallback` or GIS button is mounted in container.
6. **R2 Google Sign-In in Checkout Quick Login Sidebar**:
   - Ensure `Store.data.currentUser = null`.
   - Render `CheckoutView.renderCheckout()`.
   - Verify `#google-signin-container-checkout` is present in DOM.
   - Call `CheckoutView.afterCheckoutRender()`.
   - Verify `#btn-google-fallback` is mounted.
   - Trigger `app.handleSimulatedGoogleLogin()`.
   - Verify `Store.data.currentUser` is set, navbar is updated, and re-rendering `#checkout` displays active session verified card.

---

### 5.3 Invalidation Conditions
This technical strategy would be invalidated if:
1. `tests/challenger_stress_r4_r5_r6.test.mjs` fails due to introduction of manual simulation advance buttons.
2. `tests/test_google_auth_profile.test.mjs` fails due to mock data leaking into initial guest state or `guest-city` not rendering `value=""`.
3. In-store pickup tracking displays courier truck transit animations or courier service strings.
4. Google sign-in container IDs mismatch between view markup and `afterRender` initialization calls.
