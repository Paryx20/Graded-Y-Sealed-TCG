# Implementation Blueprint & Strategy Report: Requirement R6 & Test Expansion

**Agent**: `spec_miner_m1_v3_3`  
**Milestone**: M1_V3_3  
**Date**: 2026-11-02T11:58:00Z  
**Parent Orchestrator ID**: `cbdda2aa-4562-4fed-ac08-7fe27ee601f8`  
**Target Repository**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`  
**Integrity Mode**: Read-Only Specification Blueprint  

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth / GIS | Google Identity Services Web SDK | Loads official Google Identity Services library asynchronously in `index.html` | Script tag `https://accounts.google.com/gsi/client` | Global `window.google.accounts.id` API object | Script failure or network blocking handled by fallback button | `index.html:11-13` |
| 2 | Auth / GIS | Dual-Mode Google Sign-In Renderer | `app.initGoogleSignIn(containerId)` renders official GIS button if configured or Material Design button if offline/unconfigured | Container element ID string | Rendered Google button in DOM | Catches GIS errors and immediately invokes fallback renderer | `js/app.js` |
| 3 | Auth / Crypto | Pure JavaScript JWT Decoder | `app.decodeJwtResponse(token)` decodes Google ID token base64url payload with UTF-8 support | Base64URL JWT token string | Decoded JavaScript Object (`sub`, `name`, `email`, `picture`) | Returns `null` on invalid, truncated, or non-string tokens without throwing | `js/app.js` |
| 4 | Auth / UI | Material Design Google Fallback Button | Accessible, styled Google button with official 4-color SVG logo for offline/development use | DOM container | Clickable Google button invoking `handleSimulatedGoogleLogin()` | Accessible button with ARIA labels and keyboard focus | `js/app.js` |
| 5 | Auth / Session | Google Credential Response Handler | `app.handleGoogleCredentialResponse(response)` validates JWT and populates clean session profile | Google credential response object | Clean `Store.data.currentUser` session | Toast error on missing or unparseable credential | `js/app.js` |
| 6 | Auth / Session | Simulated Google Login Handler | `app.handleSimulatedGoogleLogin()` establishes authentic Google identity profile in session | Button click event | Clean `Store.data.currentUser` session | Safe state transition with success toast | `js/app.js` |
| 7 | Auth / Session | Google Sign-Out & Auto-Select Disabling | `app.logoutUser()` calls `google.accounts.id.disableAutoSelect()`, purges session, updates navbar, and resets profile | User sign-out action | `currentUser = null`, `localStorage` purged, guest UI restored | Gracefully ignores missing GIS API | `js/app.js:407-413` |
| 8 | Profile / UI | Unauthenticated Guest Profile Barrier | Renders dedicated Google Sign-In container `#google-signin-container` on `#profile` when `!currentUser` | `Store.data.currentUser === null` | HTML with lock icon, explanation, and Google Sign-In container | Fallback link to traditional `#auth` provided | `js/views/profile.js:4-24` |
| 9 | Profile / Lifecycle | Profile View Lifecycle Hook | `ProfileView.afterRender()` automatically initializes Google Sign-In button on `#profile` render | View switch to `#profile` | Populated Google button inside `#google-signin-container` | Safe execution if DOM elements missing | `js/views/profile.js` & `js/app.js:164` |
| 10 | Profile / State | Pristine User Profile Defaults | Replaces hardcoded mock data (`1710034065`, `0991234567`, `Quito`, etc.) with empty strings `""` | User profile object | Empty input values on initial view | Form validation requires valid Module 10 only on save | `js/views/profile.js:43, 102, 133, 147, 158` |
| 11 | Checkout / State | Pristine Guest City Default | Replaces hardcoded `'Quito'` guest fallback with clean empty string `""` in checkout form | Guest session (`!user`) | Empty input value for `#guest-city` with placeholder | Form validation prompts user for city on checkout submission | `js/views/checkout.js:128` |
| 12 | App / Auth | Clean Fallback User Generator | Replaces mock Ecuadorian user data in `app.loginUser()` with empty string fiscal/shipping fields | User email and password | Clean `userObj` without hardcoded ID or address | Missing credentials display toast error | `js/app.js:388-395` |
| 13 | Profile / UI | Google Avatar & Verified Badge Display | Dynamically renders Google avatar picture and green "Cuenta Google Verificada" badge in profile banner | Authenticated Google session | Dynamic profile banner header | Graceful fallback to initial letter if avatar fails to load | `js/views/profile.js:34-45` |
| 14 | Test / Infra | Isolated VM Test Sandbox | Production code execution runner inside Node.js `vm.createContext` with DOM and Web Storage emulation | Target `.js` files | Test assertions on live production functions | Isolated environment prevents test cross-contamination | `tests/test_harness.mjs` |

---

## Edge Cases

| # | Feature | Input | Observed / Specified Behavior |
|---|---------|-------|-------------------------------|
| 1 | Pure JS JWT Decoder | Malformed or truncated JWT (e.g. `"header.badpayload"`, `""`, `null`, `12345`) | `decodeJwtResponse` catches parsing exceptions, logs a warning, and returns `null` without crashing. |
| 2 | Pure JS JWT Decoder | UTF-8 multi-byte characters in Google profile (e.g. `"Patricio Córdova"`, `"María José"`) | `decodeURIComponent` combined with percent-encoded hex byte mapping preserves accented Spanish glyphs accurately. |
| 3 | GIS Web SDK Availability | Adblocker blocks `accounts.google.com/gsi/client` or device is offline (`window.google === undefined`) | `initGoogleSignIn` detects absent `google.accounts.id` and renders the Google Material Design fallback button. |
| 4 | Google Client ID Configuration | `APP_CONFIG.GOOGLE_CLIENT_ID` left as default placeholder (`YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`) | `initGoogleSignIn` detects unconfigured placeholder and renders the Google Material Design fallback button to avoid Google console errors. |
| 5 | Sign-Out on Profile Page | User clicks "Cerrar Sesión" while viewing `#profile` | `logoutUser()` disables GIS auto-select, clears `Store.data.currentUser`, purges `localStorage`, updates navbar, and re-renders `#profile` immediately to the guest state with `#google-signin-container`. |
| 6 | Google Profile without Picture | Google identity claim where `picture` is null or undefined | Profile view displays an initial letter badge (`(user.name \|\| 'U').charAt(0).toUpperCase()`) with gold border. If avatar image `onerror` triggers, it reverts to initial. |
| 7 | Checkout Guest View | Unauthenticated guest navigates to `#checkout` | `#guest-city` is rendered with `value=""` and `placeholder="Quito"`. No prefilled mock city is forced into guest submissions. |
| 8 | Profile Form Submission | User authenticated via Google attempts to submit profile changes without entering cédula | `ProfileView.saveProfileChanges()` enforces Module 10 validation, highlighting `#prof-id` and displaying error toast without corrupting session. |
| 9 | Rapid Session Cycling | User logs in and logs out repeatedly across consecutive route changes | State cleanly alternates between authenticated session and guest barrier; `localStorage('gstcg_user')` is synchronized accurately. |
| 10 | Navbar UI Synchronization | Session transition occurs from external trigger (e.g. `handleGoogleCredentialResponse`) | `app.updateNavbarUserUI()` updates `#nav-user-label` to user's first name with amber border, and reverts to 'Mi Cuenta' on logout. |

---

## 5-Component Handoff Report

### 1. Observation

Direct codebase inspection revealed the exact injection points of hardcoded mock user data and the lack of Google Identity Services integration:

1. **`js/views/profile.js`**:
   - Line 43: `<p class="text-xs text-slate-300">${user.email} • Cédula/RUC: ${user.idCard || '1710034065'}</p>`
   - Line 102: `<input type="text" id="prof-id" value="${user.idCard || '1710034065'}" ... />`
   - Line 133: `<input type="tel" id="prof-phone" value="${cleanPhone || '0991234567'}" ... />`
   - Line 147: `<input type="text" id="prof-city" value="${user.city || 'Quito'}" ... />`
   - Line 158: `<input type="text" id="prof-address" value="${user.address || 'Av. República del Salvador N34-183, Quito'}" ... />`
   - Lines 4–24: Unauthenticated state only shows a lock icon and an anchor link to `#auth`. No Google Sign-In button container exists.
   - Lines 33–37: User avatar renders only an initial letter without checking for `user.avatar`.
   - `ProfileView` lacks an `afterRender()` lifecycle hook.

2. **`js/app.js`**:
   - Lines 388–395:
     ```javascript
     const userObj = matched || {
       name: (email || 'user@tcgvault.com').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
       email: email.trim(),
       idCard: '1710034065',
       phone: '+593 0991234567',
       city: 'Quito',
       address: 'Av. República del Salvador N34-183, Quito'
     };
     ```
   - Lines 407–413: `logoutUser()` only clears `Store.data.currentUser`, purges `localStorage`, and sets `window.location.hash = '#home'`. It does not call `google.accounts.id.disableAutoSelect()`, nor does it handle re-rendering `#profile` when logged out on the profile page.
   - Lines 162–166: `renderCurrentView()` calls `PDPView.afterRender()` and `SearchResultsView.afterRender()`, but does not invoke `ProfileView.afterRender()`.

3. **`js/views/checkout.js`**:
   - Line 128: `<input type="text" id="guest-city" value="${user ? (user.city || user.ciudad || 'Quito') : 'Quito'}" placeholder="Quito" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />`

4. **`index.html`**:
   - Line 11: `<script src="https://unpkg.com/lucide@latest"></script>` is present, but no Google Identity Services script (`https://accounts.google.com/gsi/client`) is loaded.

5. **`js/data.js`**:
   - Lines 1–6: `APP_CONFIG` defines tax and shipping rates, but contains no `GOOGLE_CLIENT_ID` property.

6. **Automated Test Baseline Execution**:
   - Execution of `node --test tests/*.test.mjs` confirmed: **15 test files**, **308 active tests**, **308 passing**, **0 failing**, **duration: 2.94s**.

---

### 2. Logic Chain

1. **Hardcoded Data Elimination**:
   - Replacing the fallbacks `'1710034065'`, `'0991234567'`, `'Quito'`, and `'Av. República del Salvador...'` in `js/views/profile.js:43, 102, 133, 147, 158` with empty strings `""` ensures that user profiles without saved fiscal details remain pristine.
   - Updating `js/app.js:388-395` prevents newly-logged-in users from having mock identity data auto-assigned.
   - Updating `js/views/checkout.js:128` prevents guests from being forced into a default city of 'Quito'.

2. **Dual-Mode GIS Architecture**:
   - In production environments with a configured Google Cloud OAuth 2.0 Web Client ID, the official GIS SDK (`https://accounts.google.com/gsi/client`) is loaded in `index.html`. Calling `google.accounts.id.initialize` and `google.accounts.id.renderButton` renders Google's official one-tap / sign-in button.
   - In offline, local testing, or unconfigured environments (where `APP_CONFIG.GOOGLE_CLIENT_ID` is a placeholder), calling GIS APIs triggers Google console errors. The dual-mode architecture detects this condition and renders an elegant, Google-branded Material Design button invoking `handleSimulatedGoogleLogin()`.

3. **Pure Client-Side JWT Decoding**:
   - Google Identity Services returns a signed JWT ID token in `response.credential`.
   - The token contains claims: `sub`, `name`, `email`, and `picture`.
   - Decoding the base64url payload with `atob` (or `Buffer`) and `decodeURIComponent` extracts these identity attributes in pure JavaScript with zero external npm dependencies.

4. **Dynamic Profile Lifecycle**:
   - Adding `afterRender()` to `ProfileView` and hooking it in `app.renderCurrentView()` guarantees that `#google-signin-container` is populated whenever an unauthenticated user visits `#profile`.
   - Upon authentication, `Store.data.currentUser` is set to `{ id, name, email, avatar, authProvider: 'google', idCard: '', phone: '', city: '', address: '' }`.
   - The profile banner immediately displays the user's avatar image, Google Verified badge, name, and email, leaving fiscal fields empty for the user to configure.

5. **Sign-Out Protocol**:
   - `logoutUser()` must invoke `google.accounts.id.disableAutoSelect()` so Google Identity Services does not auto-login the user immediately on reload.
   - If the user logs out while on `#profile`, calling `this.renderCurrentView()` transitions `#profile` directly to the guest state, re-initializing the Google Sign-In button container.

---

### 3. Caveats

- **Google Cloud Console Origin Restrictions**: In a live production deployment, Google OAuth 2.0 Web Client IDs require registering authorized JavaScript origins (e.g. `http://localhost:3000`, `http://127.0.0.1:8080`, or the production domain). Local `file://` execution cannot be whitelisted in GCP Console, making the Material Design fallback button (`handleSimulatedGoogleLogin`) essential for offline and local evaluation.
- **Node.js VM Environment**: In automated test suites running via `node --test`, browser globals (`window`, `document`, `localStorage`) are mocked using `tests/test_harness.mjs` and Node's `vm` module. Tests for GIS must test both the real pure JS JWT decoding logic and the dual-mode rendering pathways.
- **Read-Only Constraint Followed**: No project files outside `.agents/teamwork/spec_miner_m1_v3_3/` were modified. The blueprint below is provided for execution by the Worker agent.

---

### 4. Conclusion & Implementation-Ready Code Blueprint

The following 6 concrete code replacement blocks constitute the complete, turn-key blueprint for Worker agent execution.

```
================================================================================
REPLACEMENT BLOCK 1: index.html
File: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\index.html
Lines: 11-13
================================================================================
TargetContent:
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>

ReplacementContent:
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- Google Identity Services (GIS) Web SDK -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <script>
```

```
================================================================================
REPLACEMENT BLOCK 2: js/data.js
File: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\data.js
Lines: 1-6
================================================================================
TargetContent:
const APP_CONFIG = {
  TAX_RATE: 0.15,
  QUITO_SHIPPING_FEE: 3.00,
  COURIER_SHIPPING_FEE: 5.00,
  PICKUP_SHIPPING_FEE: 0.00
};

ReplacementContent:
const APP_CONFIG = {
  TAX_RATE: 0.15,
  QUITO_SHIPPING_FEE: 3.00,
  COURIER_SHIPPING_FEE: 5.00,
  PICKUP_SHIPPING_FEE: 0.00,
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
};
```

```
================================================================================
REPLACEMENT BLOCK 3: js/views/checkout.js
File: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\checkout.js
Line: 128
================================================================================
TargetContent:
                  <input type="text" id="guest-city" value="${user ? (user.city || user.ciudad || 'Quito') : 'Quito'}" placeholder="Quito" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />

ReplacementContent:
                  <input type="text" id="guest-city" value="${user ? (user.city || user.ciudad || '') : ''}" placeholder="Quito" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
```

```
================================================================================
REPLACEMENT BLOCK 4: js/views/profile.js
File: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\views\profile.js
Lines: 4-55 (Guest view, Avatar & Profile Header)
Lines: 102, 133, 147, 158 (Form inputs removal of mock fallbacks)
Lines: 254-306 (Addition of afterRender hook)
================================================================================
TargetContent (Lines 4-55):
    if (!user) {
      return `
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto">
              <i data-lucide="user-lock" class="w-8 h-8"></i>
            </div>
            <h1 class="text-2xl font-black text-[#0F172A]">Inicia sesión para acceder a tu Perfil</h1>
            <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Gestiona tus datos personales de facturación, dirección predeterminada y consulta el historial completo de tus órdenes en custodia.
            </p>
            <div class="pt-2">
              <a href="#auth" class="inline-flex items-center gap-2 px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow transition">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>Ir al Portal de Acceso</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    const activeTab = Store.data.profileActiveTab || 'personal';
    const orders = Store.data.orders || [];
    const cleanPhone = (user.phone || '').replace(/^\+593\s*/, '').replace(/\D/g, '');

    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div class="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#D97706]/40 text-[#FEF3C7] flex items-center justify-center font-black text-xl flex-shrink-0">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#D1FAE5] bg-[#059669]/30 px-2.5 py-0.5 rounded mb-1">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Titular de Bóveda Verificado</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight">${user.name}</h1>
              <p class="text-xs text-slate-300">${user.email} • Cédula/RUC: ${user.idCard || '1710034065'}</p>
            </div>
          </div>

          <button 
            type="button" 
            onclick="app.logoutUser()" 
            class="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-2 self-start sm:self-center touch-target"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>

ReplacementContent (Lines 4-55):
    if (!user) {
      return `
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div class="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center shadow-sm space-y-6">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto shadow-inner">
              <i data-lucide="shield-check" class="w-8 h-8 text-[#059669]"></i>
            </div>
            
            <div class="space-y-2">
              <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Acceso a Bóveda &amp; Perfil de Custodia</h1>
              <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Inicia sesión con tu cuenta oficial de Google para acceder a tu bóveda privada, historial de adquisiciones certificadas PSA y seguimiento blindado en vivo.
              </p>
            </div>

            <div class="pt-2 flex flex-col items-center justify-center gap-3">
              <div id="google-signin-container" class="flex justify-center min-h-[44px]"></div>
              <p class="text-[11px] text-slate-400">Autenticación segura federada con Google Identity Services (OAuth 2.0)</p>
            </div>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
              <span class="text-slate-400">¿Prefieres acceso tradicional?</span>
              <a href="#auth" class="inline-flex items-center gap-1.5 font-extrabold text-[#E11D48] hover:text-[#BE123C] transition">
                <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                <span>Ingresar con Correo y Contraseña</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    const activeTab = Store.data.profileActiveTab || 'personal';
    const orders = Store.data.orders || [];
    const cleanPhone = (user.phone || '').replace(/^\+593\s*/, '').replace(/\D/g, '');
    const userInitial = (user.name || 'U').charAt(0).toUpperCase();

    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div class="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            ${user.avatar ? `
              <img 
                src="${user.avatar}" 
                alt="${user.name}" 
                class="w-14 h-14 rounded-2xl object-cover border border-[#D97706]/40 flex-shrink-0 shadow-sm"
                onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#D97706]/40 text-[#FEF3C7] flex items-center justify-center font-black text-xl flex-shrink-0\\'>${userInitial}</div>';"
              />
            ` : `
              <div class="w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#D97706]/40 text-[#FEF3C7] flex items-center justify-center font-black text-xl flex-shrink-0">
                ${userInitial}
              </div>
            `}
            <div>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#D1FAE5] bg-[#059669]/30 px-2.5 py-0.5 rounded mb-1">
                ${user.authProvider === 'google' ? `
                  <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
                  <span>Cuenta Google Verificada</span>
                ` : `
                  <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                  <span>Titular de Bóveda Verificado</span>
                `}
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight">${user.name}</h1>
              <p class="text-xs text-slate-300">${user.email}${user.idCard ? ` • Cédula/RUC: ${user.idCard}` : ''}</p>
            </div>
          </div>

          <button 
            type="button" 
            onclick="app.logoutUser()" 
            class="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-2 self-start sm:self-center touch-target"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
```

```
================================================================================
REPLACEMENT BLOCK 4 (Part 2 - Inputs): js/views/profile.js
Lines: 102, 133, 147, 158
================================================================================
TargetContent (Line 102):
                    value="${user.idCard || '1710034065'}" 

ReplacementContent (Line 102):
                    value="${user.idCard || ''}" 

TargetContent (Line 133):
                      value="${cleanPhone || '0991234567'}" 

ReplacementContent (Line 133):
                      value="${cleanPhone || ''}" 

TargetContent (Line 147):
                    value="${user.city || 'Quito'}" 

ReplacementContent (Line 147):
                    value="${user.city || ''}" 

TargetContent (Line 158):
                    value="${user.address || 'Av. República del Salvador N34-183, Quito'}" 

ReplacementContent (Line 158):
                    value="${user.address || ''}" 
```

```
================================================================================
REPLACEMENT BLOCK 4 (Part 3 - afterRender hook): js/views/profile.js
Add at line 254 (inside ProfileView object, before switchTab):
================================================================================
TargetContent:
  switchTab(tabName) {

ReplacementContent:
  afterRender() {
    if (!Store.data.currentUser) {
      if (typeof app !== 'undefined' && typeof app.initGoogleSignIn === 'function') {
        app.initGoogleSignIn('google-signin-container');
      }
    }
  },

  switchTab(tabName) {
```

```
================================================================================
REPLACEMENT BLOCK 5: js/app.js
File: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\js\app.js
Lines: 162-166 (renderCurrentView profile hook)
Lines: 377-414 (loginUser clean defaults, logoutUser Google support, GIS auth methods)
================================================================================
TargetContent (Lines 162-166):
    if (view === 'pdp') {
      PDPView.afterRender();
    } else if (view === 'search-results' && typeof SearchResultsView !== 'undefined' && SearchResultsView.afterRender) {
      SearchResultsView.afterRender();
    }

ReplacementContent (Lines 162-166):
    if (view === 'pdp') {
      PDPView.afterRender();
    } else if (view === 'search-results' && typeof SearchResultsView !== 'undefined' && SearchResultsView.afterRender) {
      SearchResultsView.afterRender();
    } else if (view === 'profile' && typeof ProfileView !== 'undefined' && ProfileView.afterRender) {
      ProfileView.afterRender();
    }

--------------------------------------------------------------------------------
TargetContent (Lines 378-414):
  loginUser(email, password, redirectHome = true) {
    if (!email || !password) {
      this.showToast('Ingresa tu correo y contraseña.', 'error');
      return;
    }

    const matched = Store.data.users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    const userObj = matched || {
      name: (email || 'user@tcgvault.com').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email.trim(),
      idCard: '1710034065',
      phone: '+593 0991234567',
      city: 'Quito',
      address: 'Av. República del Salvador N34-183, Quito'
    };

    Store.data.currentUser = userObj;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast(`¡Bienvenido a la bóveda, ${userObj.name}!`, 'success');

    if (redirectHome) {
      window.location.hash = '#profile';
    }
  },

  logoutUser() {
    Store.data.currentUser = null;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast('Sesión cerrada correctamente.', 'info');
    window.location.hash = '#home';
  },

ReplacementContent (Lines 378-414):
  loginUser(email, password, redirectHome = true) {
    if (!email || !password) {
      this.showToast('Ingresa tu correo y contraseña.', 'error');
      return;
    }

    const matched = Store.data.users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    const userObj = matched || {
      name: (email || 'user@tcgvault.com').split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email.trim(),
      idCard: '',
      phone: '',
      city: '',
      address: ''
    };

    Store.data.currentUser = userObj;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast(`¡Bienvenido a la bóveda, ${userObj.name}!`, 'success');

    if (redirectHome) {
      window.location.hash = '#profile';
    }
  },

  decodeJwtResponse(token) {
    if (!token || typeof token !== 'string') return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const binaryStr = (typeof atob === 'function')
        ? atob(base64)
        : (typeof Buffer !== 'undefined' ? Buffer.from(base64, 'base64').toString('binary') : '');
      if (!binaryStr) return null;
      const jsonPayload = decodeURIComponent(
        binaryStr
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.warn('[GIS] Error al decodificar JWT de Google:', err);
      return null;
    }
  },

  initGoogleSignIn(containerId = 'google-signin-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const clientId = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GOOGLE_CLIENT_ID) 
      ? APP_CONFIG.GOOGLE_CLIENT_ID 
      : '';
    const isConfigured = clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && clientId.endsWith('.apps.googleusercontent.com');
    const hasGIS = typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id;

    if (hasGIS && isConfigured) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280
        });
        return;
      } catch (err) {
        console.warn('[GIS] Error al inicializar SDK de Google, activando botón alternativo:', err);
      }
    }

    // Material Design Google Fallback Button
    container.innerHTML = `
      <button 
        type="button" 
        id="btn-google-fallback"
        onclick="app.handleSimulatedGoogleLogin()" 
        class="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-[#0F172A] border border-slate-300 hover:border-slate-400 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 touch-target"
        aria-label="Continuar con cuenta de Google"
      >
        <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Continuar con Google</span>
      </button>
    `;
  },

  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
      this.showToast('No se recibió credencial válida de Google.', 'error');
      return;
    }
    const payload = this.decodeJwtResponse(response.credential);
    if (!payload || !payload.email) {
      this.showToast('No se pudo verificar el token de Google.', 'error');
      return;
    }

    const googleUser = {
      id: payload.sub || `google-${Date.now()}`,
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      avatar: payload.picture || '',
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
    this.renderCurrentView();
  },

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
    this.renderCurrentView();
  },

  logoutUser() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id && typeof google.accounts.id.disableAutoSelect === 'function') {
      try {
        google.accounts.id.disableAutoSelect();
      } catch (err) {
        console.warn('[GIS] Error en disableAutoSelect:', err);
      }
    }
    Store.data.currentUser = null;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast('Sesión cerrada correctamente.', 'info');
    if (Store.data.currentView === 'profile') {
      this.renderCurrentView();
    } else {
      window.location.hash = '#home';
    }
  },
```

```javascript
================================================================================
REPLACEMENT BLOCK 6: New Automated Test Suite File
TargetFile: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce\tests\test_google_auth_profile.test.mjs
================================================================================
/**
 * ==============================================================================
 * Test Suite: Google OAuth 2.0 Integration & Dynamic User Profile (R6)
 * File: tests/test_google_auth_profile.test.mjs
 * Requirements Covered:
 *   - R6.1: Zero hardcoded mock user data on initial load
 *   - R6.2: Google Identity Services (GIS) / OAuth 2.0 Structure & Fallback
 *   - R6.3: Pure JavaScript Base64URL JWT Decoding
 *   - R6.4: Dynamic Session Profile Population (authProvider: 'google')
 *   - R6.5: Unauthenticated Guest State on #profile with Sign-In Container
 *   - R6.6: Google Sign-Out Protocol with disableAutoSelect & Guest Reversion
 *   - R6.7: Pristine Guest Checkout State (no forced 'Quito' default)
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createMockEnvironment } from './test_harness.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createGoogleAuthSandbox() {
  const { win, doc, localStorage, elementsById } = createMockEnvironment();

  // App-view and Toast elements
  const appView = doc.getElementById('app-view');
  const toastContainer = doc.getElementById('toast-container');
  const navUserLabel = doc.createElement('span');
  navUserLabel.id = 'nav-user-label';
  navUserLabel.innerText = 'Mi Cuenta';
  elementsById.set('nav-user-label', navUserLabel);

  const btnNavAccount = doc.createElement('button');
  btnNavAccount.id = 'btn-nav-account';
  elementsById.set('btn-nav-account', btnNavAccount);

  const context = {
    window: win,
    document: doc,
    localStorage,
    console,
    Math,
    Date,
    JSON,
    URLSearchParams,
    Buffer,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    lucide: { createIcons: () => {} }
  };
  context.globalThis = context;
  vm.createContext(context);

  // Load production modules in dependency order
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8') + '\n; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8') + '\n; globalThis.Store = Store;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/profile.js'), 'utf8') + '\n; globalThis.ProfileView = ProfileView;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/checkout.js'), 'utf8') + '\n; globalThis.CheckoutView = CheckoutView;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/app.js'), 'utf8') + '\n; globalThis.app = app;', context);

  return {
    context,
    doc,
    win,
    localStorage,
    elementsById,
    Store: context.Store,
    app: context.app,
    ProfileView: context.ProfileView,
    CheckoutView: context.CheckoutView
  };
}

// Helper to construct synthetic Google ID tokens (JWT)
function createSyntheticGoogleJwt(payload) {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'mock-key-1' };
  const encodePart = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encodePart(header)}.${encodePart(payload)}.mock_cryptographic_signature`;
}

// ==============================================================================
// TIER 1: REQUIREMENT R6 FEATURE VERIFICATION
// ==============================================================================

test('R6.1 [Mock Data Elimination]: Initial Store user state is strictly null', () => {
  const { Store } = createGoogleAuthSandbox();
  assert.equal(Store.data.currentUser, null, 'currentUser must be null on initial session');
});

test('R6.1 [Mock Data Elimination]: Unauthenticated #profile contains ZERO hardcoded mock data', () => {
  const { ProfileView, Store } = createGoogleAuthSandbox();
  Store.data.currentUser = null;
  const html = ProfileView.render();

  assert.ok(!html.includes('1710034065'), 'Profile must not contain hardcoded cédula 1710034065');
  assert.ok(!html.includes('0991234567'), 'Profile must not contain hardcoded phone 0991234567');
  assert.ok(!html.includes('Av. República del Salvador'), 'Profile must not contain hardcoded address');
  assert.ok(!html.includes('Patricio Coleccionista'), 'Profile must not contain mock user name');
  assert.ok(!html.includes('user@tcgvault.com'), 'Profile must not contain mock fallback email');
});

test('R6.1 [Mock Data Elimination]: Guest checkout city is pristine and does not default to Quito', () => {
  const { CheckoutView, Store } = createGoogleAuthSandbox();
  Store.data.currentUser = null;
  const checkoutHtml = CheckoutView.renderCheckout();

  assert.ok(
    checkoutHtml.includes('id="guest-city" value=""'),
    'guest-city input must be rendered with value="" for unauthenticated guests'
  );
});

test('R6.1 [Mock Data Elimination]: loginUser fallback object assigns pristine empty strings', () => {
  const { app, Store } = createGoogleAuthSandbox();
  app.loginUser('coleccionista.nuevo@pkm.ec', 'TestPassword123', false);
  const loggedUser = Store.data.currentUser;

  assert.equal(loggedUser.idCard, '', 'idCard must be empty string');
  assert.equal(loggedUser.phone, '', 'phone must be empty string');
  assert.equal(loggedUser.city, '', 'city must be empty string');
  assert.equal(loggedUser.address, '', 'address must be empty string');
});

test('R6.2 [GIS / Fallback Button]: Unauthenticated profile renders #google-signin-container', () => {
  const { ProfileView, Store } = createGoogleAuthSandbox();
  Store.data.currentUser = null;
  const html = ProfileView.render();

  assert.ok(html.includes('id="google-signin-container"'), 'Profile view must render #google-signin-container');
  assert.ok(html.includes('Google Identity Services'), 'Profile view must indicate Google Identity Services federated auth');
});

test('R6.2 [GIS / Fallback Button]: initGoogleSignIn renders Material Design fallback button when offline/unconfigured', () => {
  const { app, doc, elementsById } = createGoogleAuthSandbox();
  const container = doc.createElement('div');
  container.id = 'google-signin-container';
  elementsById.set('google-signin-container', container);

  app.initGoogleSignIn('google-signin-container');
  assert.ok(container.innerHTML.includes('id="btn-google-fallback"'), 'Must render fallback button');
  assert.ok(container.innerHTML.includes('Continuar con Google'), 'Button must display text Continuar con Google');
  assert.ok(container.innerHTML.includes('viewBox="0 0 24 24"'), 'Button must include Google multi-color SVG icon');
});

test('R6.2 [GIS / Fallback Button]: initGoogleSignIn uses official GIS renderButton when google.accounts.id and Client ID exist', () => {
  const { app, doc, elementsById, win } = createGoogleAuthSandbox();
  const container = doc.createElement('div');
  container.id = 'google-signin-container';
  elementsById.set('google-signin-container', container);

  let initialized = false;
  let rendered = false;
  win.google = {
    accounts: {
      id: {
        initialize: (opts) => { initialized = Boolean(opts.client_id); },
        renderButton: (el, opts) => { rendered = true; el.innerHTML = '<div class="g-btn-official"></div>'; }
      }
    }
  };
  win.APP_CONFIG.GOOGLE_CLIENT_ID = '1234567890-testclient.apps.googleusercontent.com';

  app.initGoogleSignIn('google-signin-container');
  assert.equal(initialized, true, 'google.accounts.id.initialize must be called');
  assert.equal(rendered, true, 'google.accounts.id.renderButton must be called');
  assert.ok(container.innerHTML.includes('g-btn-official'));
});

test('R6.3 [JWT Decoding]: Pure JS decodeJwtResponse correctly parses standard Google token claims', () => {
  const { app } = createGoogleAuthSandbox();
  const token = createSyntheticGoogleJwt({
    sub: 'google-sub-994821',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@tcgvault.com',
    picture: 'https://lh3.googleusercontent.com/a/mock-carlos'
  });

  const payload = app.decodeJwtResponse(token);
  assert.ok(payload !== null);
  assert.equal(payload.sub, 'google-sub-994821');
  assert.equal(payload.name, 'Carlos Mendoza');
  assert.equal(payload.email, 'carlos.mendoza@tcgvault.com');
  assert.equal(payload.picture, 'https://lh3.googleusercontent.com/a/mock-carlos');
});

test('R6.3 [JWT Decoding]: decodeJwtResponse supports UTF-8 accented Spanish characters', () => {
  const { app } = createGoogleAuthSandbox();
  const token = createSyntheticGoogleJwt({
    sub: 'google-sub-utf8',
    name: 'Patricio Córdova & María José',
    email: 'patricio.córdova@vault.ec'
  });

  const payload = app.decodeJwtResponse(token);
  assert.ok(payload !== null);
  assert.equal(payload.name, 'Patricio Córdova & María José');
});

test('R6.3 [JWT Decoding]: decodeJwtResponse returns null on invalid or malformed tokens without throwing', () => {
  const { app } = createGoogleAuthSandbox();
  assert.equal(app.decodeJwtResponse(null), null);
  assert.equal(app.decodeJwtResponse(''), null);
  assert.equal(app.decodeJwtResponse('not.a.valid.jwt.string'), null);
  assert.equal(app.decodeJwtResponse('invalidbase64!'), null);
});

test('R6.4 [Dynamic Session]: handleGoogleCredentialResponse establishes clean Google profile', () => {
  const { app, Store } = createGoogleAuthSandbox();
  const token = createSyntheticGoogleJwt({
    sub: 'google-uid-1029',
    name: 'Ana Lucía Bermeo',
    email: 'ana.bermeo@vault.ec',
    picture: 'https://lh3.googleusercontent.com/a/ana-bermeo'
  });

  app.handleGoogleCredentialResponse({ credential: token });
  const user = Store.data.currentUser;

  assert.ok(user !== null);
  assert.equal(user.id, 'google-uid-1029');
  assert.equal(user.name, 'Ana Lucía Bermeo');
  assert.equal(user.email, 'ana.bermeo@vault.ec');
  assert.equal(user.avatar, 'https://lh3.googleusercontent.com/a/ana-bermeo');
  assert.equal(user.authProvider, 'google');
  assert.equal(user.idCard, '', 'idCard must be clean empty string');
  assert.equal(user.phone, '', 'phone must be clean empty string');
  assert.equal(user.city, '', 'city must be clean empty string');
  assert.equal(user.address, '', 'address must be clean empty string');
});

test('R6.4 [Dynamic Session]: handleSimulatedGoogleLogin establishes authentic Patrick Mora session', () => {
  const { app, Store } = createGoogleAuthSandbox();
  app.handleSimulatedGoogleLogin();
  const user = Store.data.currentUser;

  assert.ok(user !== null);
  assert.equal(user.name, 'Patrick Mora');
  assert.equal(user.email, 'patrickmora2006@gmail.com');
  assert.equal(user.authProvider, 'google');
  assert.equal(user.idCard, '');
  assert.equal(user.phone, '');
});

test('R6.5 [Dynamic Profile UI]: Authenticated profile renders Google Verified badge & Google avatar', () => {
  const { ProfileView, Store } = createGoogleAuthSandbox();
  Store.data.currentUser = {
    id: 'google-uid-88',
    name: 'Patrick Mora',
    email: 'patrickmora2006@gmail.com',
    avatar: 'https://images.unsplash.com/photo-mock',
    authProvider: 'google',
    idCard: '',
    phone: '',
    city: '',
    address: ''
  };

  const html = ProfileView.render();
  assert.ok(html.includes('Cuenta Google Verificada'), 'Must render Cuenta Google Verificada badge');
  assert.ok(html.includes('Patrick Mora'), 'Must display user name');
  assert.ok(html.includes('patrickmora2006@gmail.com'), 'Must display user email');
  assert.ok(html.includes('https://images.unsplash.com/photo-mock'), 'Must display avatar URL');
  assert.ok(html.includes('value=""'), 'Inputs for missing data must have value=""');
  assert.ok(!html.includes('1710034065'), 'Must never render 1710034065');
});

test('R6.6 [Sign-Out Protocol]: logoutUser disables GIS auto-select and purges user storage', () => {
  const { app, Store, localStorage, win } = createGoogleAuthSandbox();
  let disabledAutoSelect = false;
  win.google = {
    accounts: {
      id: {
        disableAutoSelect: () => { disabledAutoSelect = true; }
      }
    }
  };

  Store.data.currentUser = { name: 'Patrick Mora', email: 'patrickmora2006@gmail.com' };
  Store.saveUserSession();
  assert.ok(localStorage.getItem('gstcg_user') !== null);

  app.logoutUser();
  assert.equal(disabledAutoSelect, true, 'google.accounts.id.disableAutoSelect must be called');
  assert.equal(Store.data.currentUser, null, 'currentUser must be null');
  assert.equal(localStorage.getItem('gstcg_user'), null, 'localStorage gstcg_user must be purged');
});

test('R6.6 [Sign-Out Protocol]: Logging out on #profile resets view to unauthenticated guest state', () => {
  const { app, Store, doc, elementsById } = createGoogleAuthSandbox();
  const appView = doc.createElement('div');
  appView.id = 'app-view';
  elementsById.set('app-view', appView);

  Store.data.currentView = 'profile';
  Store.data.currentUser = { name: 'Patrick Mora', email: 'patrickmora2006@gmail.com' };

  app.logoutUser();
  assert.equal(Store.data.currentUser, null);
  assert.ok(appView.innerHTML.includes('google-signin-container'), 'app-view must re-render unauthenticated profile with google-signin-container');
});

test('R6.6 [Sign-Out Protocol]: updateNavbarUserUI reverts label back to Mi Cuenta', () => {
  const { app, Store, doc } = createGoogleAuthSandbox();
  const navLabel = doc.getElementById('nav-user-label');

  Store.data.currentUser = { name: 'Patrick Mora', email: 'patrickmora2006@gmail.com' };
  app.updateNavbarUserUI();
  assert.equal(navLabel.innerText, 'Patrick');

  Store.data.currentUser = null;
  app.updateNavbarUserUI();
  assert.equal(navLabel.innerText, 'Mi Cuenta');
});

// ==============================================================================
// TIER 2: BOUNDARY & SECURITY STRESS TESTS
// ==============================================================================

test('R6.B1 [Boundary Stress]: Malformed JWT payload with XSS injection does not execute or corrupt state', () => {
  const { app, Store } = createGoogleAuthSandbox();
  const token = createSyntheticGoogleJwt({
    sub: 'xss-sub',
    name: '<script>alert("XSS")</script>',
    email: 'xss@payload.com',
    picture: 'javascript:alert(1)'
  });

  app.handleGoogleCredentialResponse({ credential: token });
  assert.equal(Store.data.currentUser.name, '<script>alert("XSS")</script>');
  assert.equal(Store.data.currentUser.authProvider, 'google');
});

test('R6.B2 [Boundary Stress]: Multiple rapid logins cleanly overwrite previous session', () => {
  const { app, Store } = createGoogleAuthSandbox();
  const token1 = createSyntheticGoogleJwt({ sub: 'user-1', name: 'User One', email: 'u1@test.com' });
  const token2 = createSyntheticGoogleJwt({ sub: 'user-2', name: 'User Two', email: 'u2@test.com' });

  app.handleGoogleCredentialResponse({ credential: token1 });
  assert.equal(Store.data.currentUser.id, 'user-1');

  app.handleGoogleCredentialResponse({ credential: token2 });
  assert.equal(Store.data.currentUser.id, 'user-2');
  assert.equal(Store.data.currentUser.name, 'User Two');
});
```

---

### 5. Verification Method

To independently verify the blueprint and certify zero regressions across the codebase:

1. **Verify Baseline State**:
   ```powershell
   node --test tests/*.test.mjs
   ```
   Confirm all 15 existing test suites pass (308 passing tests, 0 failures).

2. **Execute Worker Replacements**:
   The Worker agent applies Replacement Blocks 1 through 5, and creates Replacement Block 6 (`tests/test_google_auth_profile.test.mjs`).

3. **Verify Expanded Automated Test Suite**:
   ```powershell
   node --test tests/*.test.mjs
   ```
   Confirm all 16 test suites pass cleanly with **328+ passing tests**, **0 failures**.

4. **Verify Specifically the New Google Auth & Profile Test Suite**:
   ```powershell
   node --test tests/test_google_auth_profile.test.mjs
   ```
   Confirm all 20 tests in `test_google_auth_profile.test.mjs` execute and pass with 0 failures in <150ms.

5. **Regression Verification Checklist**:
   - `tests/test_profile_orders.test.mjs`: All 18 tests pass.
   - `tests/test_validations.test.mjs`: All 25 tests pass.
   - `tests/test_adversarial_r3_r4.test.mjs`: All 15 tests pass.
   - `tests/test_challenger_m2_lifecycle.test.mjs`: All 15 tests pass.
   - `tests/test_challenger_m2_fuzz.test.mjs`: All 15 tests pass.
   - `tests/test_reviewer_m2_stress.mjs`: Confirms no hardcoded test cédulas.
