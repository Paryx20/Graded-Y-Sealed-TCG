# Handoff Report: Investigation of R1 (Dynamic Google Sign-In) & R2 (Anonymous Default Order Tracking)

**Agent**: explorer_survey_1  
**Working Directory**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\.agents\teamwork\explorer_survey_1\`  
**Target Milestone**: Survey / Architecture Investigation  
**Authoritative Request**: `.agents/teamwork/ORIGINAL_REQUEST.md` (Requirements R1 & R2)

---

## Executive Summary

The investigation successfully mapped all source files, DOM elements, lifecycle handlers, and data structures governing Google Sign-In (R1) and Order Tracking (R2). Hardcoded credentials (`Patrick Mora`, `patrickmora2006@gmail.com`) are currently isolated in `js/app.js` (lines 545–567), and preloaded tracking personal data (`Patricio Mora (Coleccionista Verificado)`, order `#GS-2026-9481`) exists in `js/views/tracking.js` (lines 15–78) and `js/state.js` (lines 104–170). Concrete, drop-in replacement contracts for an interactive Google Account Selector modal in `index.html` / `js/app.js` and an anonymous search interface in `js/views/tracking.js` are established below, along with a migration plan for legacy test assertions that enforced previous mock behaviors.

---

## 1. Component Investigation: R1 — Dynamic Google Sign-In Modal

### 1.1 Where Google Sign-In is Triggered & Mounted

The application uses Google Identity Services (GIS) with an automated client-side fallback button when no external Google Cloud client ID is configured. Four mount points exist across three views:

| View | Template Location | Container Element ID | Calling Lifecycle Hook |
| :--- | :--- | :--- | :--- |
| **Profile (`#profile`)** | `js/views/profile.js:20` | `<div id="google-signin-container">` | `ProfileView.afterRender()` (`js/views/profile.js:283`) |
| **Checkout (`#checkout`)** | `js/views/checkout.js:64` | `<div id="google-signin-container-checkout">` | `CheckoutView.afterCheckoutRender()` (`js/views/checkout.js:492`) |
| **Auth Login (`#auth`)** | `js/views/checkout.js:429` | `<div id="google-signin-container-auth-login">` | `CheckoutView.afterAuthRender()` (`js/views/checkout.js:483`) |
| **Auth Register (`#auth`)** | `js/views/checkout.js:473` | `<div id="google-signin-container-auth-register">` | `CheckoutView.afterAuthRender()` (`js/views/checkout.js:484`) |

Navbar Navigation (`index.html:121`):
```html
<button type="button" id="btn-nav-account" onclick="app.handleNavAccountClick()">
  <i data-lucide="user" class="w-4 h-4 text-[#FEF3C7]"></i>
  <span id="nav-user-label" class="hidden sm:inline">Mi Cuenta</span>
</button>
```
When clicked (`js/app.js:396–402`):
- If `Store.data.currentUser` exists: routes to `#profile`.
- If `Store.data.currentUser` is `null`: routes to `#auth`.

### 1.2 The Hardcoded Google Authentication Logic

In `js/app.js` (lines 457–508), `initGoogleSignIn(containerId)` renders a Material Design Google button when GIS is unconfigured or offline:
```html
<button 
  type="button" 
  id="btn-google-fallback"
  onclick="app.handleSimulatedGoogleLogin()" 
  class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 touch-target"
  aria-label="Continuar con cuenta de Google"
>
  <!-- Google 4-color SVG icon -->
  <span>Continuar con Google</span>
</button>
```

When clicked, it directly invokes `handleSimulatedGoogleLogin()` in `js/app.js` (lines 545–567):
```javascript
handleSimulatedGoogleLogin() {
  const simulatedUser = {
    id: 'google-oauth2-10829574102948',
    name: 'Patrick Mora',
    email: 'patrickmora2006@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    authProvider: 'google',
    idCard: '',
    phone: '',
    city: '',
    address: ''
  };

  Store.data.currentUser = simulatedUser;
  Store.saveUserSession();
  this.updateNavbarUserUI();
  this.showToast(`¡Sesión iniciada con Google como ${simulatedUser.name}!`, 'success');
  if (Store.data.currentView === 'auth') {
    window.location.hash = '#profile';
  } else {
    this.renderCurrentView();
  }
}
```

### 1.3 State Storage & Navbar Reactivity
- Session State: Stored in `Store.data.currentUser` (`js/state.js:4`) and persisted in `localStorage.getItem('gstcg_user')` (`js/state.js:74`).
- UI Update: `app.updateNavbarUserUI()` (`js/app.js:591–608`):
  - Changes `#nav-user-label` text to the first word of `user.name` (`user.name.split(' ')[0]`).
  - Adds highlight classes `border-[#D97706]`, `bg-[#FEF3C7]/15`, `text-[#FEF3C7]` to `#btn-nav-account`.
  - When logged out (`app.logoutUser()`), reverts `#nav-user-label` to `"Mi Cuenta"` and removes highlight classes.

### 1.4 Recommended Implementation Contract for R1

#### 1.4.1 DOM Component in `index.html` (Modal Backdrop & Dialog)
Place after `#delete-confirm-modal` (around line 480):
```html
<div 
  id="google-signin-modal" 
  class="modal-backdrop fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4" 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="google-modal-title" 
  aria-hidden="true"
  onclick="if (event.target === this) app.closeGoogleSignInModal()"
>
  <div class="modal-content bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl">
    <div class="flex items-center justify-between pb-4 border-b border-slate-100">
      <div class="flex items-center gap-2.5">
        <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <div>
          <h2 id="google-modal-title" class="text-base font-black text-[#0F172A] tracking-tight">Acceder con Google</h2>
          <p class="text-xs text-slate-500">Selecciona o ingresa tu cuenta para continuar</p>
        </div>
      </div>
      <button 
        type="button" 
        onclick="app.closeGoogleSignInModal()" 
        class="p-1.5 text-slate-400 hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition"
        aria-label="Cerrar modal de acceso Google"
      >
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <form id="google-signin-form" onsubmit="event.preventDefault(); app.submitGoogleSignInModal();" class="mt-4 space-y-3.5">
      <div>
        <label for="google-modal-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nombre Completo: *</label>
        <input 
          type="text" 
          id="google-modal-name" 
          placeholder="Ej. Andrés Morales" 
          class="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white focus:border-[#D97706] transition" 
          required 
        />
      </div>

      <div>
        <label for="google-modal-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico de Google: *</label>
        <input 
          type="email" 
          id="google-modal-email" 
          placeholder="nombre@gmail.com" 
          class="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white focus:border-[#D97706] transition" 
          required 
        />
      </div>

      <!-- Quick Account Selector (suggested demo accounts for 1-click convenience) -->
      <div class="pt-1">
        <span class="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">O elige una cuenta sugerida:</span>
        <div class="grid grid-cols-1 gap-1.5" id="google-quick-accounts">
          <button 
            type="button" 
            onclick="app.selectGoogleQuickAccount('Carlos Mendoza', 'carlos.mendoza@gmail.com')"
            class="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition"
          >
            <div class="w-7 h-7 rounded-full bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center font-bold text-xs flex-shrink-0">C</div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-bold text-[#0F172A] block leading-tight">Carlos Mendoza</span>
              <span class="text-[10px] text-slate-400 block truncate leading-tight">carlos.mendoza@gmail.com</span>
            </div>
          </button>
          <button 
            type="button" 
            onclick="app.selectGoogleQuickAccount('Ana Lucía Bermeo', 'ana.bermeo@gmail.com')"
            class="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition"
          >
            <div class="w-7 h-7 rounded-full bg-[#E11D48] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">A</div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-bold text-[#0F172A] block leading-tight">Ana Lucía Bermeo</span>
              <span class="text-[10px] text-slate-400 block truncate leading-tight">ana.bermeo@gmail.com</span>
            </div>
          </button>
        </div>
      </div>

      <p id="google-modal-error" class="hidden text-xs text-[#E11D48] font-semibold bg-rose-50 border border-rose-200 rounded-lg p-2" role="alert"></p>

      <div class="mt-5 pt-2 flex items-center gap-3">
        <button 
          type="button" 
          onclick="app.closeGoogleSignInModal()" 
          class="flex-1 py-2.5 px-4 border border-slate-300 hover:bg-slate-100 text-[#0F172A] text-xs font-bold rounded-xl transition touch-target"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          id="btn-confirm-google-login"
          class="flex-1 py-2.5 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold rounded-xl transition shadow touch-target flex items-center justify-center gap-2"
        >
          <span>Acceder</span>
          <i data-lucide="arrow-right" class="w-3.5 h-3.5 text-[#FEF3C7]"></i>
        </button>
      </div>
    </form>
  </div>
</div>
```

#### 1.4.2 Controller Methods in `js/app.js`
1. `app.openGoogleSignInModal()`:
   - Sets `#google-signin-modal` class to `.active` and `aria-hidden="false"`.
   - Focuses `#google-modal-name`.
   - Clears any previous error text in `#google-modal-error`.
2. `app.closeGoogleSignInModal()`:
   - Removes `.active` from `#google-signin-modal` and sets `aria-hidden="true"`.
3. `app.selectGoogleQuickAccount(name, email)`:
   - Populates `#google-modal-name` and `#google-modal-email`.
   - Automatically calls `app.submitGoogleSignInModal()`.
4. `app.submitGoogleSignInModal()`:
   - Reads inputs: `const name = document.getElementById('google-modal-name').value.trim();` and `const email = document.getElementById('google-modal-email').value.trim();`.
   - Validates non-empty and email format. If invalid, displays error in `#google-modal-error`.
   - Calls `app.handleSimulatedGoogleLogin(name, email)`.
   - Calls `app.closeGoogleSignInModal()`.
5. `app.handleSimulatedGoogleLogin(name, email)`:
   - **Signature**: `handleSimulatedGoogleLogin(name, email)`
   - If called without valid `name` or `email` (e.g. initial button click without modal):
     Opens the modal via `this.openGoogleSignInModal()`.
   - If called with `name` and `email`:
     Constructs dynamic user:
     ```javascript
     const googleUser = {
       id: `google-user-${Date.now()}`,
       name: name,
       email: email,
       avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=FEF3C7&bold=true`,
       authProvider: 'google',
       idCard: '',
       phone: '',
       city: '',
       address: ''
     };
     Store.data.currentUser = googleUser;
     Store.saveUserSession();
     this.updateNavbarUserUI();
     this.showToast(`¡Sesión iniciada con Google como ${googleUser.name}!`, 'success');
     if (Store.data.currentView === 'auth') {
       window.location.hash = '#profile';
     } else {
       this.renderCurrentView();
     }
     ```
   - Wire Escape key in `app.init()` (`js/app.js:8–24`) to close `#google-signin-modal`.

---

## 2. Component Investigation: R2 — Anonymous Default Order Tracking

### 2.1 Where Personal Data & Preloaded Orders Exist

Currently, `TrackingView` always displays order `#GS-2026-9481` with buyer `'Patricio Mora (Coleccionista Verificado)'` when no order is active:

1. `js/views/tracking.js` (lines 15–78):
   ```javascript
   getSimulatedOrder() {
     if (typeof Store !== 'undefined' && typeof Store.getPreloadedSimulatedOrder === 'function') {
       return Store.getPreloadedSimulatedOrder();
     }
     return {
       orderId: '#GS-2026-9481',
       numero_orden: '#GS-2026-9481',
       date: '02 Nov 2026, 09:15',
       buyerName: 'Patricio Mora (Coleccionista Verificado)',
       buyerEmail: 'coleccionista.paryx@bovedatcg.ec',
       deliveryMethod: 'Courier Nacional Blindado Especializado',
       trackingNumber: 'GUI-EC-948102-PSA',
       ...
   ```
2. `js/state.js` (lines 110–127):
   ```javascript
   getPreloadedSimulatedOrder() {
     return {
       orderId: '#GS-2026-9481',
       numero_orden: '#GS-2026-9481',
       date: '02 Nov 2026, 09:15',
       buyerName: 'Patricio Mora (Coleccionista Verificado)',
       buyerEmail: 'coleccionista.paryx@bovedatcg.ec',
       ...
   ```
3. `Store.getOrderById(orderId)` in `js/state.js` (lines 97–108):
   ```javascript
   getOrderById(orderId) {
     if (this.data.orders && this.data.orders.length > 0) {
       if (!orderId) return this.data.orders[0];
       const found = this.data.orders.find(o => o.orderId === orderId);
       if (found) return found;
     }
     // FALLBACK HAZARD: Returns simulated order when orders is empty!
     if (orderId === '#GS-2026-9481' || !this.data.orders || this.data.orders.length === 0) {
       return this.getPreloadedSimulatedOrder();
     }
     return this.data.orders[0] || null;
   }
   ```
4. `TrackingView.render()` in `js/views/tracking.js` (lines 357–365):
   ```javascript
   render() {
     const orders = (typeof Store !== 'undefined' && Store.data && Store.data.orders) ? Store.data.orders : [];
     let order = (typeof Store !== 'undefined' && Store.getOrderById)
       ? Store.getOrderById(Store.data.activeTrackingOrderId)
       : null;

     if (!order) {
       order = this.getSimulatedOrder(); // <-- FORCES PRELOADED ORDER
     }
   ```
5. `TrackingView.initSimulationTimer()` in `js/views/tracking.js` (lines 94–101):
   Kicks off a 2-second timeout advancing Stage 2 to Stage 3 on whatever order is active or simulated.

### 2.2 Routing & Navigation Behavior

- Route Handler in `js/app.js` (lines 106–115):
  ```javascript
  if (route === 'tracking') {
    const orderParam = params.get('order');
    if (orderParam) {
      Store.data.activeTrackingOrderId = orderParam;
    }
    Store.data.currentView = 'tracking';
    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  ```
- Trigger Points that pass `orderId`:
  - Checkout finalization: `Store.addOrder(orderRecord)` sets `Store.data.activeTrackingOrderId = orderRecord.orderId`.
  - Confirmation view: `<button onclick="app.openOrderTracking('${order.orderId}')">`.
  - Profile order history: `<button onclick="app.openOrderTracking('${order.orderId}')">`.
  - Direct URL: `#tracking?order=#GS-2026-9481`.

### 2.3 Recommended Implementation Contract for R2

#### 2.3.1 Resolving the Active Order in `TrackingView.render()`
```javascript
render() {
  const orders = (typeof Store !== 'undefined' && Store.data && Store.data.orders) ? Store.data.orders : [];
  
  // 1. Try resolving order by activeTrackingOrderId, OR first order in current session
  let order = null;
  if (Store.data.activeTrackingOrderId) {
    order = Store.getOrderById(Store.data.activeTrackingOrderId);
  } else if (orders.length > 0) {
    order = orders[0];
    Store.data.activeTrackingOrderId = order.orderId;
  }

  // 2. If no active order exists in the session, render Anonymous Empty Search State!
  if (!order) {
    return this.renderEmptySearchState();
  }

  // 3. Otherwise, render Order Detail View
  return this.renderOrderDetail(order, orders);
}
```

#### 2.3.2 Empty Search State Template (`renderEmptySearchState`)
```javascript
renderEmptySearchState() {
  return `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm text-center space-y-6">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto shadow-inner">
          <i data-lucide="package-search" class="w-8 h-8 text-[#059669]"></i>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Rastreo de Envíos Blindados &amp; Custodia PSA</h1>
          <p class="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Ingresa tu número de orden o código de guía para consultar el estado de tu pedido en tiempo real, desde la autenticación en bóveda hasta la entrega final.
          </p>
        </div>

        <form id="tracking-search-form" onsubmit="event.preventDefault(); TrackingView.handleTrackingSearch();" class="max-w-md mx-auto space-y-3">
          <div class="relative flex items-center">
            <input 
              type="text" 
              id="tracking-search-input" 
              placeholder="Ej. #GS-2026-9481 o GUI-EC-948102-PSA" 
              class="w-full pl-4 pr-11 py-3 text-xs sm:text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white focus:border-[#D97706] transition"
              required 
            />
            <button 
              type="submit" 
              id="btn-search-tracking"
              class="absolute right-1.5 p-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg transition"
              aria-label="Buscar orden"
            >
              <i data-lucide="search" class="w-4 h-4 text-[#FEF3C7]"></i>
            </button>
          </div>
          <p id="tracking-search-error" class="hidden text-xs text-[#E11D48] font-semibold bg-rose-50 border border-rose-200 rounded-xl p-2.5" role="alert"></p>
        </form>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-left">
          <div class="p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200/60">
            <span class="text-xs font-bold text-[#0F172A] block mb-1 flex items-center gap-1.5">
              <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#059669]"></i>
              <span>Autenticación PSA</span>
            </span>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Verificamos cada pieza en nuestra cámara de seguridad climatizada.
            </p>
          </div>

          <div class="p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200/60">
            <span class="text-xs font-bold text-[#0F172A] block mb-1 flex items-center gap-1.5">
              <i data-lucide="truck" class="w-3.5 h-3.5 text-[#D97706]"></i>
              <span>Transporte Blindado</span>
            </span>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Despacho con valija de seguridad y custodia garantizada en mano.
            </p>
          </div>

          <div class="p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200/60">
            <span class="text-xs font-bold text-[#0F172A] block mb-1 flex items-center gap-1.5">
              <i data-lucide="store" class="w-3.5 h-3.5 text-[#E11D48]"></i>
              <span>Retiro en Bóveda</span>
            </span>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              Entrega presencial en nuestra sala privada en Quito contra cédula.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}
```

#### 2.3.3 Code Lookup & Search Processing (`handleTrackingSearch`)
```javascript
handleTrackingSearch() {
  const inputEl = document.getElementById('tracking-search-input');
  const errorEl = document.getElementById('tracking-search-error');
  if (!inputEl) return;
  const rawTerm = inputEl.value.trim();
  if (!rawTerm) return;

  const term = rawTerm.toUpperCase();
  const orders = Store.data.orders || [];

  // 1. Search current session orders
  let match = orders.find(o => {
    const oId = (o.orderId || o.numero_orden || '').toUpperCase();
    const tNum = (o.trackingNumber || '').toUpperCase();
    return oId === term || oId === ('#' + term) || ('#' + oId) === term || tNum === term;
  });

  // 2. Fallback check for simulated order code (if user searches demo code #GS-2026-9481 or GUI-EC-948102-PSA)
  if (!match && (term === '#GS-2026-9481' || term === 'GS-2026-9481' || term === 'GUI-EC-948102-PSA')) {
    match = this.getSimulatedOrder();
    // Ensure buyer name reflects authenticated user or clean anonymous label
    match.buyerName = (Store.data.currentUser && Store.data.currentUser.name) 
      ? Store.data.currentUser.name 
      : 'Coleccionista Verificado';
    match.buyerEmail = (Store.data.currentUser && Store.data.currentUser.email)
      ? Store.data.currentUser.email
      : 'cliente@bovedatcg.ec';
  }

  if (match) {
    if (errorEl) errorEl.classList.add('hidden');
    Store.data.activeTrackingOrderId = match.orderId;
    app.renderCurrentView();
  } else {
    if (errorEl) {
      errorEl.innerText = 'No se encontró ningún pedido con el código ingresado. Verifica tu número de orden o guía e intenta nuevamente.';
      errorEl.classList.remove('hidden');
    }
  }
}
```

#### 2.3.4 Anonymizing Mock Data in `js/state.js` & `js/views/tracking.js`
In both `js/state.js` (`getPreloadedSimulatedOrder()`) and `js/views/tracking.js` (`getSimulatedOrder()`):
- Replace `buyerName: 'Patricio Mora (Coleccionista Verificado)'` with:
  `buyerName: (this.data && this.data.currentUser && this.data.currentUser.name) ? this.data.currentUser.name : 'Coleccionista Verificado'`
- Replace `buyerEmail: 'coleccionista.paryx@bovedatcg.ec'` with:
  `buyerEmail: (this.data && this.data.currentUser && this.data.currentUser.email) ? this.data.currentUser.email : 'cliente@bovedatcg.ec'`
- In `Store.getOrderById(orderId)`:
  Remove the fallback that returns simulated order when `!this.data.orders || this.data.orders.length === 0`. Only return `getPreloadedSimulatedOrder()` if `orderId === '#GS-2026-9481'`.

#### 2.3.5 Simulation Timer Safety
In `TrackingView.initSimulationTimer()`:
If `!order`, return immediately without starting a timer (preventing phantom timers on the empty search view).

---

## 3. Humanized UI Copy & Tone Recommendations (Alignment with R4)

In accordance with R4, all technical, robotic, and filler phrases across auth and tracking must be replaced with clear, natural Spanish:

| Context / Element | Current Robotic / Technical Copy | Proposed Humanized Spanish Copy |
| :--- | :--- | :--- |
| **Auth Subtitle** | `Autenticación segura federada con Google Identity Services (OAuth 2.0)` | `Acceso rápido y seguro con tu cuenta de Google` |
| **Auth Title** | `Acceso a Bóveda & Perfil de Custodia` | `Tu Bóveda y Perfil de Coleccionista` |
| **Auth Modal Helper** | `Para continuar a Graded & Sealed TCG` | `Selecciona o ingresa tu cuenta para continuar` |
| **Stage 1 Subtitle** | `Pago Verificado TLS 256-bit` | `Pago confirmado exitosamente` |
| **Stage 1 Detail** | `Fondos verificados y orden registrada en la cadena de custodia.` | `Tu pago fue aprobado y tu pedido ya está registrado en nuestra bóveda.` |
| **Stage 2 Subtitle** | `Sellado UV & Inspección Óptica` | `Inspección técnica y autenticación PSA` |
| **Stage 2 Detail** | `Validación de microimpresión, hologramas y encapsulado acrílico.` | `Revisión experta de hologramas, sellos y estado de tu carta certificada.` |
| **Stage 3 Subtitle** | `Asignado a Transporte Especial` | `En camino con transporte seguro` |
| **Stage 3 Detail** | `Embalaje con precinto tamper-evident en valija de seguridad.` | `Empacado con sellos de alta seguridad para proteger tu pieza de colección.` |
| **Stage 4 Subtitle** | `Custodia contra Cédula y Firma` | `Entrega en mano con documento de identidad` |
| **Stage 4 Detail** | `Recepción formal por el titular con documento de identidad.` | `Entrega personal y segura al titular de la compra presentando su cédula.` |
| **Courier Badge** | `GPS Activo • Valija Nivel IV` | `Transporte blindado en ruta` |
| **Empty State Header**| *(None — previously dumped simulated order)* | `Rastreo de Envíos Blindados & Custodia PSA` |
| **Empty State Search**| *(None — previously lacked search input)* | `Ingresa tu número de orden o código de guía...` |
| **Search Error Alert**| *(None)* | `No se encontró ningún pedido con el código ingresado. Verifica tu número de orden o guía e intenta nuevamente.` |

---

## 4. Legacy Test Suite Impact Analysis

Our survey identified four test suites that contain assertions reflecting the earlier milestones. Implementers and testers should be aware of these assertions:

1. **`tests/challenger_stress_r4_r5_r6.test.mjs`** (Line 407):
   ```javascript
   test('R5 Adversarial [2.1]: Clean session with empty orders renders active simulated timeline #GS-2026-9481')
   ```
   *Conflict*: Asserts that `TrackingView.render()` with empty orders displays `#GS-2026-9481` and asserts `!html.includes('No tienes pedidos...')`.
   *Action*: Update this test to assert that empty orders now render the empty tracking search state (`#tracking-search-form`, `#tracking-search-input`) without preloaded personal data, fulfilling R2.
2. **`tests/test_profile_orders.test.mjs`** (Line 431):
   ```javascript
   test('Feature 24 [R5]: Preloaded Live Tracking Simulation on Empty Orders')
   ```
   *Conflict*: Asserts that a clean session displays `ORDEN #GS-2026-9481`.
   *Action*: Update to verify the new anonymous search interface for empty sessions.
3. **`tests/test_google_auth_profile.test.mjs`** (Line 249):
   ```javascript
   test('R6.4 [Dynamic Session]: handleSimulatedGoogleLogin establishes authentic Patrick Mora session')
   ```
   *Conflict*: Calls `handleSimulatedGoogleLogin()` with no arguments and asserts `user.name === 'Patrick Mora'`.
   *Action*: Update to test dynamic parameters `handleSimulatedGoogleLogin('Andrés Morales', 'andres@gmail.com')` or interaction with the modal, and verify `Store.data.currentUser.name === 'Andrés Morales'`.
4. **`tests/test_challenger_m2_r1_r2.test.mjs`** (Line 685) & **`tests/challenger_stress_r4_r5_r6.test.mjs`** (Line 654):
   *Conflict*: Hardcoded checks for `user.name === 'Patrick Mora'`.
   *Action*: Update to test dynamic user input.

---

## 5. Handoff Protocol Specification (5 Components)

### 5.1 Observation

- **Exact Code Locations for Google Auth Hardcoding**:
  - `js/app.js:548`: `name: 'Patrick Mora',`
  - `js/app.js:549`: `email: 'patrickmora2006@gmail.com',`
  - `js/app.js:496`: `onclick="app.handleSimulatedGoogleLogin()"` inside fallback button template.
  - Mount containers: `google-signin-container` (`js/views/profile.js:20`), `google-signin-container-checkout` (`js/views/checkout.js:64`), `google-signin-container-auth-login` (`js/views/checkout.js:429`), `google-signin-container-auth-register` (`js/views/checkout.js:473`).
- **Exact Code Locations for Order Tracking Mock Preloading**:
  - `js/views/tracking.js:23`: `buyerName: 'Patricio Mora (Coleccionista Verificado)',`
  - `js/views/tracking.js:24`: `buyerEmail: 'coleccionista.paryx@bovedatcg.ec',`
  - `js/views/tracking.js:364`: `if (!order) { order = this.getSimulatedOrder(); }`
  - `js/state.js:115`: `buyerName: 'Patricio Mora (Coleccionista Verificado)',`
  - `js/state.js:104`: `if (orderId === '#GS-2026-9481' || !this.data.orders || this.data.orders.length === 0) return this.getPreloadedSimulatedOrder();`
- **Execution Test Command & Result**:
  - Ran `node --test tests/test_google_auth_profile.test.mjs`: 18 tests passed (0 failed).
  - Ran `node --test tests/test_challenger_m2_r1_r2.test.mjs`: 20 tests passed (0 failed).

### 5.2 Logic Chain

1. **From Observation to R1 Solution**:
   - GIS initialization in `initGoogleSignIn()` renders the fallback button when no external client ID exists (`isConfigured` is false).
   - Currently, clicking this button immediately invokes `handleSimulatedGoogleLogin()`, creating a session with `'Patrick Mora'`.
   - By creating `#google-signin-modal` in `index.html` with inputs for name and email, and updating `initGoogleSignIn` or `handleSimulatedGoogleLogin` to open this modal when clicked, users are prompted to enter or select their own account credentials.
   - Submitting the modal extracts user input, sets `Store.data.currentUser`, updates `localStorage`, calls `app.updateNavbarUserUI()`, and redirects appropriately, fulfilling R1 acceptance criteria.
2. **From Observation to R2 Solution**:
   - Currently, when `Store.data.orders` is empty and `Store.data.activeTrackingOrderId` is null, `TrackingView.render()` and `Store.getOrderById()` immediately load `#GS-2026-9481` with buyer `'Patricio Mora (Coleccionista Verificado)'`.
   - By altering `TrackingView.render()` to check whether an active or session order exists, and if not, branching to `renderEmptySearchState()`, visitors will see an empty search interface awaiting a tracking code.
   - By providing `handleTrackingSearch()` to check `Store.data.orders` (and optionally the demo code `#GS-2026-9481` with anonymized buyer details), visitors can look up orders on demand without exposing any individual's personal data by default, fulfilling R2 acceptance criteria.

### 5.3 Caveats

1. **Legacy Test Invariants**: As documented in Section 4, legacy test files written for prior phases explicitly check for `'Patrick Mora'` and `#GS-2026-9481`. These tests will need to be transitioned to test the dynamic behavior specified in `ORIGINAL_REQUEST.md`.
2. **Database Fallback**: In production, orders are saved to Dexie.js (`GradedSealedDB.ordenes_compra`). The tracking search should query `Store.data.orders` in memory first, and if not found, can asynchronously query Dexie or display the friendly error message.
3. **Timer Progression Scope**: The automatic 2-second stage progression (`initSimulationTimer`) should only execute when an active order is present; it must be suppressed on the empty search view.

### 5.4 Conclusion

R1 and R2 can be cleanly implemented without external dependencies or breaking the core application architecture:
1. **R1**: Add `#google-signin-modal` in `index.html`; wire fallback button to `app.openGoogleSignInModal()`; add `openGoogleSignInModal()`, `closeGoogleSignInModal()`, `submitGoogleSignInModal()`, and dynamic `handleSimulatedGoogleLogin(name, email)` in `js/app.js`.
2. **R2**: Update `TrackingView.render()` in `js/views/tracking.js` to render `renderEmptySearchState()` when `order` is null; add `handleTrackingSearch()` for code lookup; sanitize mock buyer names in `js/state.js` and `js/views/tracking.js`; ensure `initSimulationTimer()` only runs when an active order is being viewed.
3. **R4**: Update technical and robotic phrases across modal and tracking steps to natural Spanish.

### 5.5 Verification Method

1. **Automated Unit & Integration Tests**:
   - Run `node --test tests/test_google_auth_profile.test.mjs`
   - Run `node --test tests/test_challenger_m2_r1_r2.test.mjs`
   - Run `node --test tests/test_production_r1_to_r6.test.mjs`
2. **Dynamic Google Modal Checks**:
   - Inspect `#google-signin-modal` in `index.html`.
   - In DOM environment: Mount `google-signin-container`, click `#btn-google-fallback`, verify modal receives `.active`.
   - Fill `#google-modal-name` with `"Lucía Morales"` and `#google-modal-email` with `"lucia@gmail.com"`, submit `#google-signin-form`.
   - Assert `Store.data.currentUser.name === "Lucía Morales"` and `#nav-user-label` text is `"Lucía"`.
3. **Anonymous Tracking Checks**:
   - In clean session (`Store.data.orders = []; Store.data.activeTrackingOrderId = null;`):
   - Call `TrackingView.render()`.
   - Assert `html.includes('tracking-search-form')` and `html.includes('tracking-search-input')`.
   - Assert `!html.includes('Patrick Mora')` and `!html.includes('Patricio Mora')`.
   - Execute `TrackingView.handleTrackingSearch()` with invalid code -> verify error message.
   - Execute `TrackingView.handleTrackingSearch()` with `#GS-2026-9481` or placed order -> verify timeline renders with anonymized/dynamic buyer name.
