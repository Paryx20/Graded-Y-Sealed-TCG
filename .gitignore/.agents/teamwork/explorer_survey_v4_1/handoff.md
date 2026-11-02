# Handoff Report — Survey Explorer (Phase v4)
**Mission**: Investigation of Requirement R1 (Tracking Simulation & Local Pickup Differentiation) and Requirement R2 (Google Sign-In / OAuth Integration).
**Author**: explorer_survey_v4_1
**Recipient**: orchestrator_2 (d0559baa-cd30-4455-b406-13994e294aca)

---

## 1. Observation

### 1.1 Reference Images Inspection
- **Captura 1 (`media_1793634163224_5524a750.jpg`)**:
  - Displays `#tracking` view with order `#PKM-2026-37319` in stage 2: "En Preparación / En Custodia".
  - Delivery metadata reads: `Entrega: Envío a Domicilio ($5.00) • Courier: Servientrega Blindado • Bóveda G&S • Estimada: 04 Nov 2026 (Entrega Garantizada en Mano) • Guía: GUI-EC-948102-PSA` with a truck icon (`lucide="truck"`).
  - Four timeline cards:
    1. `1. Orden Recibida` (green circle with checkmark `✓`, "Pago Verificado TLS 256-bit").
    2. `2. En Preparación` (active yellow border card, dark circle icon, "Sellado UV en Bóveda").
    3. `3. En Camino / Despacho` (inactive card, grey circle "3", "Transporte Blindado").
    4. `4. Entregado` (inactive card, grey circle "4", "Custodia contra Documento").
  - Included items card shows "Charizard Base Set 1999 #4/102" and "Booster Pack Team Rocket".

- **Captura 2 (`media_1793634228982_2f8039b1.jpg`)**:
  - Displays `#auth` portal: "Portal de Coleccionistas • Graded & Sealed".
  - Two tabs: "Iniciar Sesión" (active) and "Crear Cuenta".
  - The form contains only `Correo Electrónico`, `Contraseña`, and red button `Acceder a mi Cuenta`.
  - **CRITICAL DEFECT DIRECTLY OBSERVED**: There is **NO Google Sign-In button** in the view. It is completely missing from both the "Iniciar Sesión" tab and the "Crear Cuenta" tab.

---

### 1.2 Codebase Observations — Requirement R1 (Tracking Simulation & Modal Differentiations)
- **`js/views/tracking.js`**:
  - Lines 14–78: `TrackingView.getSimulatedOrder()` returns order `#GS-2026-9481`, courier `'Servientrega Blindado • Bóveda G&S'`, tracking number `'GUI-EC-948102-PSA'`, and delivery method `'Courier Nacional Blindado Especializado'`.
  - Lines 80–117: `TrackingView.getDefaultStages(order)` returns four static stages with fixed titles:
    * `1. Orden Recibida`
    * `2. En Preparación` (marked `'active'` unless delivered/in-transit)
    * `3. En Camino / Despacho` (`subtitle: 'Transporte Blindado'`, `'detail: Embalaje con precinto tamper-evident en valija de seguridad'`)
    * `4. Entregado`
  - Lines 156–243: `TrackingView.render()`:
    * Header bar displays `Guía: ${trackingNumber}` with `<i data-lucide="truck"></i>` unconditionally (line 164).
    * Subtitle displays `Courier: <strong>${courierName}</strong> • Estimada: <strong>${estimatedDelivery}</strong>` unconditionally (line 174).
    * Timeline steps display stage 3 as "En Camino / Despacho" with subtitle "Transporte Blindado" unconditionally.
    * **NO DYNAMIC TIMER**: There is zero progression logic, zero `setTimeout`/`setInterval`, and no `afterRender()` method in `tracking.js`. Stage 2 stays static indefinitely.
- **`js/views/checkout.js`**:
  - Lines 150–185: Checkout offers 3 delivery radio options:
    * `courier` -> `$5.00` ("Envío Nacional Blindado")
    * `quito` -> `$3.00` ("Local Express (Quito)")
    * `pickup` -> `$0.00` ("Retiro en Local Físico")
  - Lines 520–534: `CheckoutView.setDelivery(method)` stores the selection in `Store.data.deliveryMethod` (`'pickup'`, `'quito'`, `'courier'`).
  - Lines 686–691: `processPayment()` sets `deliveryLabel`:
    * `'Retiro en Local Central ($0.00)'` when `Store.data.deliveryMethod === 'pickup'`.
    * `'Local Express Quito ($3.00)'` when `Store.data.deliveryMethod === 'quito'`.
    * `'Envío Nacional Blindado ($5.00)'` otherwise.
  - Lines 710–766: Order record creation sets:
    * `metodo_entrega: Store.data.deliveryMethod`
    * `deliveryMethod: deliveryLabel`
    * `courierName: 'Servientrega Blindado • Bóveda G&S'` (unconditionally set even for pickup!)
    * `stages`: unconditionally assigns delivery stages with "3. En Camino / Despacho" and "Transporte Blindado".
- **`js/app.js`**:
  - Lines 122–169: `renderCurrentView()`:
    * When `view === 'tracking'`, `TrackingView.render()` is called and injected into `#app-view`.
    * No `afterRender()` is called for `tracking`.
- **Existing Test Suite**:
  - `tests/challenger_stress_r4_r5_r6.test.mjs` lines 407–474 and `tests/test_profile_orders.test.mjs` lines 431–460 enforce:
    1. Zero manual simulation buttons (no "Avanzar paso", "Simular despacho", "Paso siguiente").
    2. Simulated order `#GS-2026-9481` renders courier `Servientrega Blindado • Bóveda G&S` and tracking code `GUI-EC-948102-PSA`.

---

### 1.3 Codebase Observations — Requirement R2 (Google Sign-In / OAuth Integration)
- **`index.html`**:
  - Line 13: The official Google Identity Services SDK script is loaded:
    `<script src="https://accounts.google.com/gsi/client" async defer></script>`.
- **`js/app.js`**:
  - Lines 409–431: `decodeJwtResponse(token)` decodes standard JWT payloads safely with base64 and UTF-8 URI decoding.
  - Lines 433–485: `initGoogleSignIn(containerId = 'google-signin-container')`:
    * If `APP_CONFIG.GOOGLE_CLIENT_ID` is set and valid, calls `window.google.accounts.id.initialize(...)` and `window.google.accounts.id.renderButton(...)`.
    * If unconfigured or offline, renders the fallback button:
      `<button type="button" id="btn-google-fallback" onclick="app.handleSimulatedGoogleLogin()" ...>`.
  - Lines 487–535:
    * `handleGoogleCredentialResponse(response)` creates user from Google token, saves to `Store.data.currentUser`, updates navbar with `updateNavbarUserUI()`, and re-renders view.
    * `handleSimulatedGoogleLogin()` creates simulated user (`Patrick Mora`, `patrickmora2006@gmail.com`), saves session, updates navbar, and re-renders view.
- **`js/views/checkout.js`**:
  - Lines 376–459: `CheckoutView.renderAuth()` renders `#auth`:
    * Tab `login`: only email, password, and submit button.
    * Tab `register`: only manual registration inputs.
    * Neither tab contains a container or button for Google Sign-In!
  - Lines 43–60: `CheckoutView.renderCheckout()` renders quick login sidebar when `!Store.data.currentUser`:
    * Contains only email, password, and submit button. No Google Sign-In button.
  - `CheckoutView` lacks any `afterRender` or `afterAuthRender` hook.
- **`js/app.js` `renderCurrentView()`**:
  - Lines 162–168: `afterRender()` is ONLY called for `pdp`, `search-results`, and `profile`.
  - It is NOT called when `view === 'auth'` or `view === 'checkout'`.

---

## 2. Logic Chain

### 2.1 Logic Chain for Requirement R1 (Tracking Simulation & Differentiation)
1. **Observation**: The current tracking view renders static stages where Stage 2 is permanently `'active'` with no timer, and all orders display courier truck icons regardless of delivery method.
2. **Requirement Mandate**: Acelerar la progresión temporal de la simulación de despacho para que el hito de preparación se complete rápidamente con su indicador de check y continúe fluido hacia la siguiente etapa; para "Envío a Domicilio" mostrar avance de transporte blindado; para "Retiro en Local / Bóveda Quito" suprimir animación de camión y mostrar estado de preparación y disponibilidad para retiro presencial, detallando horarios y requisitos de cédula.
3. **Timing Mechanism Design**:
   - In `tracking.js`, create `TrackingView.afterRender()` and `TrackingView.initSimulationTimer(order)`:
     * When the user opens `#tracking`, check if the active order's Stage 2 is in status `'active'`.
     * Start a non-blocking timeout of 1800ms–2200ms (fast, engaging, and fluid):
       - Stage 2 transitions from `'active'` to `'completed'`, replacing the pulsing package icon with the green checkmark (`<i data-lucide="check"></i>`).
       - Stage 3 transitions from `'pending'` to `'active'`.
       - If `isPickup`: Stage 3 displays "Listo para Retiro Presencial en Bóveda Central Quito".
       - If `isDelivery`: Stage 3 displays "En Camino / Despacho Blindado".
       - Update the in-memory/Store order record so the state persists across re-renders.
       - Provide smooth DOM updates and call `lucide.createIcons()`.
     * To prevent memory leaks or zombie timers when switching views, clear any active timer in `app.js` `handleRoute()` or upon unmounting `#tracking`.
4. **Delivery Method Differentiation Design**:
   - Detect pickup modal via:
     `const isPickup = order.metodo_entrega === 'pickup' || (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));`
   - If `isPickup`:
     * **Header Tag**: Replace `<i data-lucide="truck"></i> Guía: ${trackingNumber}` with `<i data-lucide="store"></i> Código de Retiro: ${order.trackingNumber || 'RET-UIO-9481'}`.
     * **Header Subtitle**: Replace Courier line with:
       `<i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#E11D48]"></i> Punto de Retiro: <strong>Bóveda Central Quito (Av. República del Salvador N34-183)</strong> • Horario: <strong>09:00 a 18:00</strong>`.
     * **Timeline Stages**:
       - Stage 1: `1. Orden Recibida` (Pago Verificado TLS 256-bit) -> `completed` (check `✓`).
       - Stage 2: `2. En Preparación en Bóveda` (Sellado UV & Autenticación Acrílica) -> completes rapidly to `completed` (check `✓`).
       - Stage 3: `3. Listo para Retiro Presencial` (Disponible en Bóveda Central Quito) -> `active`.
         * Detail: `Disponible para entrega en ventanilla de seguridad. Presentar cédula de identidad original y comprobante de orden.`
       - Stage 4: `4. Entregado en Ventanilla` (Custodia Transferida contra Cédula) -> `pending`.
     * **Visual Box**: Render a dedicated "Tarjeta de Retiro Seguro en Bóveda Quito":
       - Dirección: Av. República del Salvador N34-183 y Suiza, Edificio Bóveda Central, Piso 2, Quito.
       - Horario de Atención: Lunes a Viernes de 09:00 a 18:00 | Sábados de 10:00 a 14:00.
       - Requisitos Obligatorios: 1) Cédula de Identidad original del titular registrado (`${order.buyerName}`), 2) Código de orden alfanumérico.
     * **Truck Suppression**: Suppress all truck icons (`lucide="truck"`), transit route bars, and delivery courier text.
   - If `isDelivery` ("Envío a Domicilio" / `courier` / `quito`):
     * Stage 3 remains "3. En Camino / Despacho" (Transporte Blindado).
     * Render an animated armored truck component (`lucide="truck"` with CSS pulse/transit glide along a security route track).
     * Retain designated courier metadata (Servientrega Blindado, tracking guide).
   - In `checkout.js` `processPayment()`:
     * When `Store.data.deliveryMethod === 'pickup'`: set `courierName: 'Retiro en Bóveda Central Quito'`, `trackingNumber: 'RET-UIO-' + randomNum`, and generate pickup-specific stages.

---

### 2.2 Logic Chain for Requirement R2 (Google Sign-In / OAuth Integration)
1. **Observation**: `index.html` loads the Google SDK, `app.js` has `initGoogleSignIn()` and `decodeJwtResponse()`, but `CheckoutView.renderAuth()` and `CheckoutView.renderCheckout()` do not render any Google button or container. Furthermore, `app.js` never invokes `afterRender()` for `auth` or `checkout`.
2. **Requirement Mandate**: Implement the Google Sign-In button visibly and functionally in both the "Iniciar Sesión" and "Crear Cuenta / Registrarse" tabs in `#auth`, as well as during Checkout. Support interactive fallback/simulation when no Client ID is configured, updating global session state and navbar cleanly without console errors.
3. **Integration Architecture**:
   - In `js/views/checkout.js`:
     * In `renderAuth()`:
       - Tab "Iniciar Sesión":
         Add an OAuth divider (`──────── o continúa con ────────`) and `<div id="google-signin-auth-container" class="flex justify-center min-h-[44px]"></div>`.
       - Tab "Crear Cuenta":
         Add an OAuth divider (`──────── o regístrate en 1-clic con ────────`) and `<div id="google-signin-register-container" class="flex justify-center min-h-[44px]"></div>`.
     * In `renderCheckout()`:
       - In the guest account sidebar (`!Store.data.currentUser`):
         Add an OAuth divider and `<div id="google-signin-checkout-container" class="flex justify-center min-h-[44px]"></div>` with prompt "Inicia sesión con Google para precargar tus datos de facturación".
     * Add lifecycle methods to `CheckoutView`:
       - `afterAuthRender()`: invokes `app.initGoogleSignIn(isLogin ? 'google-signin-auth-container' : 'google-signin-register-container')`.
       - `afterCheckoutRender()`: if `!Store.data.currentUser`, invokes `app.initGoogleSignIn('google-signin-checkout-container')`.
   - In `js/app.js`:
     * In `renderCurrentView()`:
       ```javascript
       if (view === 'auth' && typeof CheckoutView !== 'undefined' && CheckoutView.afterAuthRender) {
         CheckoutView.afterAuthRender();
       } else if (view === 'checkout' && typeof CheckoutView !== 'undefined' && CheckoutView.afterCheckoutRender) {
         CheckoutView.afterCheckoutRender();
       }
       ```
     * In `initGoogleSignIn(containerId)`:
       Ensure `containerId` is targeted accurately and fallback buttons render with the standard Google SVG and proper touch targets.
     * In `handleSimulatedGoogleLogin()` and `handleGoogleCredentialResponse(response)`:
       - Update `Store.data.currentUser` with clean profile fields.
       - Save to `localStorage` via `Store.saveUserSession()`.
       - Update navbar via `app.updateNavbarUserUI()`.
       - Context-aware view routing:
         * If current view is `auth`: navigate to `#profile`.
         * If current view is `checkout`: stay on `#checkout` and re-render `CheckoutView.renderCheckout()`, which now displays the verified session card and preloaded billing fields!
         * If current view is `profile`: re-render `ProfileView.render()`.
       - Show feedback toast: `¡Sesión iniciada con Google como ${user.name}!`.

---

## 3. Caveats
1. **Preservation of Existing Invariants in Tests**:
   - `tests/challenger_stress_r4_r5_r6.test.mjs` strictly asserts that `#tracking` contains ZERO manual simulation control buttons (such as "Avanzar paso", "Simular despacho", etc.). Therefore, simulation progression MUST BE AUTOMATED (timer-driven) and NOT introduce manual advance buttons.
   - For simulated order `#GS-2026-9481`, existing test assertions look for strings like `ORDEN #GS-2026-9481`, `GUI-EC-948102-PSA`, `Servientrega Blindado • Bóveda G&S`, and `Autenticación PSA`. The default simulated order must maintain these strings while supporting the automated accelerated timer.
   - For guest checkout tests, `guest-city` must continue to have `value=""` on initial unauthenticated load.
2. **Timer Lifecycle Discipline**:
   - `window.addEventListener('hashchange')` in `app.js` must cancel any pending simulation timers from `tracking.js` so rapid navigation does not cause background state mutations or console errors.
3. **No Code Written to Source**:
   - As an explorer, no modifications have been made to project files; all observations and technical specifications are documented here for the implementation team.

---

## 4. Conclusion
1. **R1 Technical Solution**:
   - Add `TrackingView.afterRender()` and an automated 2-second simulation timer that transitions Stage 2 from `'active'` to `'completed'` with a green checkmark `✓` and elevates Stage 3 to `'active'`.
   - Implement strict conditional branching based on `isPickup`:
     * For "Envío a Domicilio": render active armored transit animation with truck icon and road route track.
     * For "Retiro en Local / Bóveda Quito": completely suppress truck icons and animations; display "Listo para retiro presencial en Bóveda Central Quito", address (Av. República del Salvador N34-183), schedule (Lun-Sáb 09:00 - 18:00), and mandatory ID card requirement.
   - Update `CheckoutView.processPayment()` to populate order records with pickup metadata when `deliveryMethod === 'pickup'`.
2. **R2 Technical Solution**:
   - Add Google Sign-In button containers to both tabs of `#auth` ("Iniciar Sesión" and "Crear Cuenta") and to the `#checkout` guest sidebar.
   - Hook up `afterAuthRender()` and `afterCheckoutRender()` in `app.js` `renderCurrentView()`.
   - Ensure `app.initGoogleSignIn()` initializes official GIS if configured, or the interactive fallback button if unconfigured/offline.
   - Ensure authentication updates `Store.data.currentUser`, updates the navbar (`#nav-user-label`), and handles checkout auto-fill without page reload.

---

## 5. Verification Method

### 5.1 Automated Test Execution
Run the full automated test suite to ensure baseline regression safety:
```powershell
node --test tests/*.test.mjs
```
Expected result: 356+ tests passing with 0 failures.

### 5.2 Verification for Requirement R1
1. Open browser to `#tracking` with default simulated order:
   - Verify Stage 1 is marked completed (green circle with checkmark `✓`).
   - Verify Stage 2 starts active, and within ~2 seconds automatically transitions to completed with a checkmark `✓`.
   - Verify Stage 3 transitions to active with animated armored truck.
   - Verify no manual control buttons exist.
2. Complete a checkout purchase selecting "Retiro en Local Físico ($0.00)":
   - Navigate to `#tracking` for the newly placed order.
   - Verify the header displays "Retiro en Bóveda: RET-UIO-..." with vault/store icon.
   - Verify NO truck icon or truck transit animation is displayed.
   - Verify Stage 3 shows "Listo para retiro presencial en Bóveda", specifying:
     * Address: Av. República del Salvador N34-183 y Suiza, Edificio Bóveda Central, Piso 2, Quito.
     * Schedule: Lunes a Sábado de 09:00 a 18:00.
     * ID requirement: Cédula de Identidad original del titular.

### 5.3 Verification for Requirement R2
1. Open browser to `#auth` tab "Iniciar Sesión":
   - Verify Google Sign-In button (`#btn-google-fallback` or GIS iframe) is visible and styled.
2. Switch to tab "Crear Cuenta":
   - Verify Google Sign-In button is visible and styled for 1-click registration.
3. Navigate to `#checkout` with an item in cart and no active session:
   - Verify Google Sign-In button is visible in the customer/login column.
4. Click "Continuar con Google" in `#auth`:
   - Verify session is established, toast displays welcome message, and navbar shows user name.
5. Click "Continuar con Google" in `#checkout`:
   - Verify checkout page updates to "Sesión Activa - Verificado" and guest billing inputs are pre-filled with user details without navigation away from checkout.
