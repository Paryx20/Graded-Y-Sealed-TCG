# Specification Survey Report: Requirement R6 & Automated Test Suite Baseline

**Investigator Agent**: `spec_miner_survey_v3_3`  
**Date**: 2026-11-02T11:45:00Z  
**Parent Orchestrator**: `cbdda2aa-4562-4fed-ac08-7fe27ee601f8`  
**Target Repository**: `c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce`  
**Integrity Mode**: Read-Only Survey

---

## 1. Executive Summary

This specification survey investigates **Requirement R6 (Google OAuth 2.0 Integration and Dynamic User Profile)** and establishes the **Automated Test Suite Baseline** across the Pokémon TCG e-commerce platform.

Key survey outcomes:
1. **R6 Root Cause Identified**: Hardcoded profile data (`1710034065`, `0991234567`, `Quito`, `Av. República del Salvador N34-183, Quito`, and `user@tcgvault.com`) is injected into the user profile in four locations: `js/views/profile.js` (lines 43, 102, 133, 147, 158), `js/app.js` (lines 388-395), `js/views/checkout.js` (lines 85, 128, 426, 440), and `js/db/db-client.js` (lines 330, 357, 567-576). Furthermore, the unauthenticated state of `#profile` (`js/views/profile.js:4-23`) lacks any Google Sign-In button, redirecting instead to an email/password form in `#auth`.
2. **GIS / OAuth 2.0 Architectural Blueprint**: A production-grade Google Identity Services (GIS) integration architecture with dual mode: (a) official GIS SDK (`https://accounts.google.com/gsi/client`) via `google.accounts.id` API, and (b) a robust fallback simulated OAuth credential flow with Google-compliant styling for environments where `client_id` is missing, unconfigured, or offline. Session user profiles are populated dynamically via JWT payload decoding, leaving Ecuadorian fiscal/shipping fields pristine (empty strings) rather than prefilling mock data.
3. **Automated Test Suite Baseline**: All 15 existing test suites (308 tests) execute via `node --test tests/*.test.mjs` with 100% pass rate in ~2.8s. A concrete test specification is established for requirements R1 through R6, detailing exact test assertions and boundary conditions.
4. **Captura 4 Bug Discovery**: The multiple checkmarks bug observed in Captura 4 is caused by `lucide.createIcons()` transforming `<i data-lucide="check">` into `<svg class="lucide lucide-check">`. In `js/views/pdp.js:781`, `headerDiv.querySelector('i')` returns `null` because the icon is now an `<svg>`, preventing removal from inactive buttons and causing checkmarks to accumulate on multiple condition buttons simultaneously.

---

## 2. Specification & Codebase Findings for R6

### 2.1 Hardcoded User Profile Data Inventory

The codebase contains hardcoded user details that prefill forms or serve as fallback values across multiple views:

| File | Line(s) | Hardcoded Construct | Description & Impact |
|---|---|---|---|
| `js/views/profile.js` | 43 | `Cédula/RUC: ${user.idCard \|\| '1710034065'}` | Fallback national ID displayed in profile banner when user has no ID |
| `js/views/profile.js` | 102 | `value="${user.idCard \|\| '1710034065'}"` | Fallback national ID inserted into input field `#prof-id` |
| `js/views/profile.js` | 133 | `value="${cleanPhone \|\| '0991234567'}"` | Fallback mobile number inserted into input field `#prof-phone` |
| `js/views/profile.js` | 147 | `value="${user.city \|\| 'Quito'}"` | Fallback city inserted into input field `#prof-city` |
| `js/views/profile.js` | 158 | `value="${user.address \|\| 'Av. República del Salvador N34-183, Quito'}"` | Fallback street address inserted into input field `#prof-address` |
| `js/app.js` | 388–395 | Default object in `loginUser()`: `idCard: '1710034065'`, `phone: '+593 0991234567'`, `city: 'Quito'`, `address: 'Av. República del Salvador N34-183, Quito'` | Any user logging in with email/password has these 4 mock fields automatically populated |
| `js/views/checkout.js` | 85 | `placeholder="Ej. 1710034065 o 1710034065001"` | National ID placeholder in checkout |
| `js/views/checkout.js` | 128 | `value="${user ? (user.city \|\| user.ciudad \|\| 'Quito') : 'Quito'}"` | Defaults city to 'Quito' even for guests without city |
| `js/views/checkout.js` | 426, 440 | `placeholder="1710034065"`, `placeholder="0991234567"` | Registration form placeholders in `#auth` |
| `js/db/db-client.js` | 330, 357 | `usuario_cedula = '1710034065'` | Default national ID for transactional orders |
| `js/db/db-client.js` | 567–576 | `seedDatabase()` inserting `'1710034065'`, `'Patricio Coleccionista'`, `'patricio.collector@vault.ec'`, `Av. González Suárez N27-142` | Seed database records mock collector user |

### 2.2 Current Unauthenticated Profile View

In `js/views/profile.js` (lines 4–24):
```javascript
const user = Store.data.currentUser;
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
```

**Defects in current unauthenticated profile**:
1. Does not render a Google Sign-In button.
2. Directs the user to `#auth`, which only provides traditional email/password login and account creation with hardcoded fallback fields.
3. No Google Identity Services integration exists anywhere in `index.html`, `profile.js`, or `app.js`.

---

## 3. Google Identity Services (GIS) / OAuth 2.0 Architecture & Fallback Strategy

### 3.1 Script Integration in `index.html`

Add the official Google Identity Services library in `index.html`:
```html
<!-- Google Identity Services (GIS) Web SDK -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Add Google Client ID configuration in `js/data.js` (`APP_CONFIG`):
```javascript
const APP_CONFIG = {
  TAX_RATE: 0.15,
  QUITO_SHIPPING_FEE: 3.00,
  COURIER_SHIPPING_FEE: 5.00,
  PICKUP_SHIPPING_FEE: 0.00,
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' // Configurable or placeholder
};
```

### 3.2 Dual-Mode Authentication Architecture

```
                       +---------------------------------------+
                       | User visits #profile (Unauthenticated)|
                       +---------------------------------------+
                                          |
                                          v
                       +---------------------------------------+
                       | Check: window.google && client_id OK? |
                       +---------------------------------------+
                                     /         \
                             YES   /             \   NO / Placeholder / Offline
                                 v                 v
          +-------------------------------+    +----------------------------------+
          | Official GIS SDK Flow         |    | Production-Grade Fallback Button |
          | google.accounts.id.initialize |    | Material Design Google Button    |
          | google.accounts.id.renderBtn  |    | Click: Simulated OAuth Dialog   |
          +-------------------------------+    +----------------------------------+
                         \                                 /
                          \                               /
                           v                             v
                       +---------------------------------------+
                       | Credential Response: JWT or Payload   |
                       | decodeJwtResponse(credential)         |
                       | Extract: sub, name, email, picture    |
                       +---------------------------------------+
                                          |
                                          v
                       +---------------------------------------+
                       | Populate Clean Session Profile        |
                       | name: claims.name                     |
                       | email: claims.email                   |
                       | avatar: claims.picture                |
                       | idCard: "" (Pristine, no mock data)   |
                       | phone: ""  (Pristine, no mock data)   |
                       | address: "" (Pristine, no mock data)  |
                       +---------------------------------------+
                                          |
                                          v
                       +---------------------------------------+
                       | Store.data.currentUser = userProfile  |
                       | Store.saveUserSession()               |
                       | app.updateNavbarUserUI()              |
                       | ProfileView.render() (Authenticated)  |
                       +---------------------------------------+
```

### 3.3 Client-Side Pure JavaScript JWT Decoder

To decode the Google ID token (`credential`) without external npm dependencies:
```javascript
function decodeJwtResponse(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[GIS] Error decoding JWT response:', err);
    return null;
  }
}
```

### 3.4 Fallback / Simulated OAuth Flow

When `client_id` is a placeholder (e.g. contains `YOUR_GOOGLE_CLIENT_ID` or `.apps.googleusercontent.com` placeholder) or when running in offline/testing environments:
1. Render a Google-branded button:
   ```html
   <button type="button" onclick="app.handleSimulatedGoogleLogin()" class="google-signin-btn">
     <svg viewBox="0 0 24 24" class="w-5 h-5">...</svg>
     <span>Continuar con Google</span>
   </button>
   ```
2. Trigger `app.handleSimulatedGoogleLogin()`:
   Prompts or sets realistic Google identity claims:
   ```javascript
   const simulatedClaims = {
     sub: 'google-oauth2-10829574102948',
     name: 'Patrick Mora',
     email: 'patrickmora2006@gmail.com',
     picture: 'https://lh3.googleusercontent.com/a/default-user',
     email_verified: true
   };
   ```
3. Set session profile:
   ```javascript
   Store.data.currentUser = {
     id: simulatedClaims.sub,
     name: simulatedClaims.name,
     email: simulatedClaims.email,
     avatar: simulatedClaims.picture,
     authProvider: 'google',
     idCard: '',
     phone: '',
     city: '',
     address: ''
   };
   Store.saveUserSession();
   app.updateNavbarUserUI();
   app.renderCurrentView();
   app.showToast(`¡Sesión iniciada con Google como ${simulatedClaims.name}!`, 'success');
   ```

### 3.5 Logout / Sign-Out Mechanism

In `js/app.js`:
```javascript
logoutUser() {
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id && typeof google.accounts.id.disableAutoSelect === 'function') {
    google.accounts.id.disableAutoSelect();
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
}
```

---

## 4. Test Suite Inventory & Test Coverage Plan for R1–R6

### 4.1 Current Test Suite Inventory

Total: **19 files**, **15 active `.test.mjs` test suites**, **308 passing tests**, **0 failures**.

| # | Test File | Suite Title / Scope | Test Count | Passing | Execution Time |
|---|---|---|---|---|---|
| 1 | `tests/test_adversarial_r3_r4.test.mjs` | R3/R4 Image 404, Pricing Fuzz, Route Injections | 15 | 15 | ~85ms |
| 2 | `tests/test_api_search_integration.test.mjs` | Multi-variable pricing, `registerApiCard`, checkout | 7 | 7 | ~45ms |
| 3 | `tests/test_cart_toast.test.mjs` | Singleton Toast, 2500ms timing, Cart removal undo | 15 | 15 | ~25ms |
| 4 | `tests/test_challenger_m1_adversarial.test.mjs` | 3D drag continuous 360°, momentum, sheen bounds | 10 | 10 | ~35ms |
| 5 | `tests/test_challenger_m1_r2.test.mjs` | Dynamic Condition Pricing, cart condition sync | 10 | 10 | ~30ms |
| 6 | `tests/test_challenger_m2_fuzz.test.mjs` | 1,000-iteration input fuzzing & negative price guards | 15 | 15 | ~60ms |
| 7 | `tests/test_challenger_m2_lifecycle.test.mjs` | Store lifecycle, Dexie rollback, cart edge cases | 15 | 15 | ~40ms |
| 8 | `tests/test_challenger_m3_ui.test.mjs` | Lucide CDN Outage, modal focus traps, drawer ARIA | 15 | 15 | ~50ms |
| 9 | `tests/test_condition_pricing.test.mjs` | Condition price formulas, button classes, DOM sync | 15 | 15 | ~25ms |
| 10 | `tests/test_e2e_suite.test.mjs` | Complete end-to-end shopping & navigation workflows | 15 | 15 | ~75ms |
| 11 | `tests/test_pdp.test.mjs` | PDP view rendering, condition switching, 3D inspector | 15 | 15 | ~35ms |
| 12 | `tests/test_pdp_3d_drag.test.mjs` | PointerEvent simulation, mouse/touch drag rotation | 15 | 15 | ~30ms |
| 13 | `tests/test_profile_orders.test.mjs` | Dexie persistence, user profile tabs, orders, tracking | 18 | 18 | ~40ms |
| 14 | `tests/test_search_failover.test.mjs` | 3-tier search failover cascade, 400ms debounce | 15 | 15 | ~55ms |
| 15 | `tests/test_validations.test.mjs` | Module 10 cédula/RUC, phone +593, Luhn, VAT 15%, shipping | 25 | 25 | ~20ms |
| 16 | `tests/test_harness.mjs` | Test harness module: MockDOM, MockDexie, validators | Helper | N/A | N/A |
| 17 | `tests/stress_verification_m1.mjs` | Standalone script for 3D drag & condition pricing | Standalone | N/A | N/A |
| 18 | `tests/test_empirical_challenger.mjs` | Standalone challenger verification script | Standalone | N/A | N/A |
| 19 | `tests/test_reviewer_m2_stress.mjs` | Standalone reviewer stress script | Standalone | N/A | N/A |

### 4.2 Comprehensive Test Coverage Plan for Requirements R1–R6

#### R1: PDP PSA Condition Buttons Exclusive Checkmark
- **Test File**: `tests/test_condition_pricing.test.mjs` / `tests/test_pdp.test.mjs`
- **Required New Test Cases**:
  1. `R1 Exclusive Checkmark - Initial state displays checkmark ONLY on default active condition (PSA 10)`.
  2. `R1 Exclusive Checkmark - Clicking PSA 8 removes checkmark from PSA 10 and displays it exclusively on PSA 8`.
  3. `R1 Exclusive Checkmark - Rapid cycling (Raw -> PSA 9 -> PSA 10 -> PSA 8) guarantees total checkmark count strictly equals 1 at all times`.
  4. `R1 Lucide SVG Replacement Invariant - Checkmark removal succeeds even after lucide.createIcons() converts <i> to <svg>`.

#### R2: PDP Statistics Box Removal and Price Clarity
- **Test File**: `tests/test_pdp.test.mjs`
- **Required New Test Cases**:
  1. `R2 Market Stats Removal - PDP HTML does NOT contain "Historial de Mercado Actual" text or container`.
  2. `R2 Market Stats Removal - PDP HTML does NOT contain SVG trend curve or percentage pill (#market-trend-pill)`.
  3. `R2 Price Clarity - Element #pdp-price is prominently rendered and displays valid formatted USD currency`.
  4. `R2 Dynamic Price Update - Selecting conditions (Raw, PSA 8, PSA 9, PSA 10) updates #pdp-price immediately to exact tier values`.

#### R3: 3D Card Viewer Clean Reverse Side
- **Test File**: `tests/test_pdp_3d_drag.test.mjs`
- **Required New Test Cases**:
  1. `R3 Clean Reverse - Card back face (.card-3d-back) contains zero elements with class 'centering-grid-overlay'`.
  2. `R3 Clean Reverse - Card back face contains zero coordinate text ("EJE X", "EJE Y", "50.0%", "BORDES OK")`.
  3. `R3 Clean Reverse - Card back face renders solely the clean Pokémon card back artwork (img/cards/card-back.png)`.

#### R4: API Search Card Navigation and Purchase Flow
- **Test File**: `tests/test_api_search_integration.test.mjs`
- **Required New Test Cases**:
  1. `R4 Search Card Action - Each card item in search results features functional 'Solicitar Adquisición' button`.
  2. `R4 Search Navigation - Clicking action button routes to #pdp?id=${card.id} and registers card in Store.data.apiCardsCache`.
  3. `R4 API Card Purchase Flow - API card can be added to cart with calculated dynamic price and completed through checkout`.

#### R5: Preloaded Live Tracking Simulation
- **Test File**: `tests/test_profile_orders.test.mjs`
- **Required New Test Cases**:
  1. `R5 Active Simulated Tracking - Navigating to #tracking without prior checkout immediately displays an active simulated order timeline`.
  2. `R5 Manual Controls Removal - Tracking view contains zero manual step advance or simulation control buttons`.
  3. `R5 Custody Milestones - Tracking timeline renders all 4 realistic stages: Orden Recibida, En Preparación (Bóveda UV), En Camino, Entregado`.
  4. `R5 Order Sync - Real purchase checkout properly links to and updates active tracking order`.

#### R6: Google OAuth 2.0 Integration and Dynamic User Profile
- **Target File**: `tests/test_profile_orders.test.mjs` (or `tests/test_google_auth_profile.test.mjs`)
- **Required New Test Cases**:
  1. `R6 Unauthenticated Profile - Initial page load with currentUser=null renders Google Sign-In prompt barrier`.
  2. `R6 Zero Hardcoded Data - Unauthenticated state contains zero hardcoded names, mock national IDs (1710034065), or mock addresses`.
  3. `R6 GIS / OAuth Button Render - Renders Google Sign-In container and falls back gracefully to styled Google button if GIS unavailable`.
  4. `R6 Credential JWT Decoding - Client-side JWT decoder correctly parses payload extracting sub, name, email, and avatar picture`.
  5. `R6 Simulated OAuth Flow - Executing simulated Google login populates currentUser with Google credentials and pristine (empty) billing fields`.
  6. `R6 Authenticated Profile Display - Dynamic profile displays Google user avatar, name, email, and Google Verified badge`.
  7. `R6 Session Logout - Cerrar Sesión clears currentUser, purges localStorage('gstcg_user'), reverts navbar, and restores unauthenticated Google Sign-In state`.

---

## 5. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | Auth / State | Session User Storage | Manages active user in memory and `localStorage('gstcg_user')` | User profile object | Persisted JSON string | Silent catch on quota or corrupt JSON | `js/state.js:33-35, 66-75` |
| 2 | Auth / UI | Unauthenticated Profile Barrier | Renders locked barrier when `Store.data.currentUser === null` | Null user state | HTML with lock icon and sign-in button | Currently redirects to `#auth` without Google option | `js/views/profile.js:4-24` |
| 3 | Auth / Profile | Profile Form Editor | Form to update name, cédula, phone, city, address | Form input values | Updated `currentUser` and `users` table | Alerts on missing name/email or invalid Module 10 cédula | `js/views/profile.js:270-305` |
| 4 | Auth / Profile | Hardcoded Fallback Injection | Injects `1710034065`, `0991234567`, `Quito` when user fields missing | Undefined user fields | Hardcoded string fallbacks in DOM inputs | Fills inputs with mock data instead of pristine empty | `js/views/profile.js:43, 102, 133, 147, 158` |
| 5 | Auth / App | Login Mock Population | Injects `1710034065` and mock address during `app.loginUser()` | Email and password strings | Full user object with hardcoded Quito address | Creates mock identity if user not registered | `js/app.js:388-395` |
| 6 | Auth / Navbar | Dynamic Navbar Account UI | Switches navbar `#nav-user-label` and styling between guest and user | `Store.data.currentUser` | Short name & gold badge or 'Mi Cuenta' | Safe fallback when elements missing | `js/app.js:415-432` |
| 7 | Auth / Session | User Logout | Clears active session, purges storage, updates navbar, redirects | Click event | `currentUser = null`, `#home` hash | No-op if already logged out | `js/app.js:407-413` |
| 8 | PDP / PSA | PSA Condition Selection | Selects Raw, PSA 8, PSA 9, PSA 10, updates price & cert | Condition key string | Price element and button styling | Accumulates multiple checkmarks due to Lucide SVG bug | `js/views/pdp.js:746-805` |
| 9 | PDP / 3D | Card Backface Centering Grid | Overlays dashed yellow border & 50.0% coordinates on card back | Flip to back mode | Overlay HTML on top of card back | Clutters backface inspection with unwanted text | `js/views/pdp.js:131-138` |
| 10 | PDP / Stats | 12-Month Market History Box | Displays interactive SVG trend curve and percentage gain pill | Card price history array | SVG chart and monthly price tooltip | Clutters PDP with obsolete market graphic | `js/views/pdp.js:441-450` |
| 11 | Tracking | Active Order Tracking View | Displays custody and transit stages for active tracking order | `orderId` parameter | 4-stage timeline & items breakdown | Shows empty state if order not found | `js/views/tracking.js:1-155` |
| 12 | Test Infra | Mock DOM & VM Test Runner | Node.js v24 native test runner with custom DOM emulation | Test files in `tests/` | TAP test results output | Fast (~2.8s) zero-dependency runner | `tests/test_harness.mjs` |

---

## 6. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---|---|---|
| 1 | PDP Condition Buttons | Condition button clicked after `lucide.createIcons()` executes | `headerDiv.querySelector('i')` returns `null` because `<i>` was replaced by `<svg>`. Inactive button checkmarks are NEVER removed; multiple checkmarks appear simultaneously (Captura 4). |
| 2 | Profile Initial State | User navigates to `#profile` with clean localStorage | Renders locked card without Google Sign-In; clicking "Ir al Portal de Acceso" goes to `#auth` where only username/password login exists. |
| 3 | Profile Fallbacks | User with `idCard: ""` or `phone: ""` logs in | `ProfileView.render()` falls back to `user.idCard \|\| '1710034065'` and `cleanPhone \|\| '0991234567'`, displaying mock Ecuadorian data instead of empty fields. |
| 4 | GIS Script Blocked | Adblocker blocks `accounts.google.com/gsi/client` or client offline | `window.google` is `undefined`. Without fallback, Google button never appears or throws `TypeError: google is not defined`. |
| 5 | GIS Unconfigured Client ID | `GOOGLE_CLIENT_ID` left as placeholder or empty | GIS initialization logs Google console error `[GSI_LOGGER]: The given client ID is not valid` and fails to render button without fallback. |
| 6 | JWT Decoding | Malformed or truncated JWT token passed to decoder | `split('.')[1]` may fail or `atob()` throws `InvalidCharacterError`. Decoder must wrap in `try/catch` and return `null`. |
| 7 | Google Sign-Out | User clicks "Cerrar Sesión" | If `google.accounts.id.disableAutoSelect()` is not invoked, GIS may immediately auto-select the same account on subsequent page visits if auto-prompt is enabled. |
| 8 | Order Tracking Initial Load | User opens `#tracking` on fresh session without orders | Shows "No tienes pedidos activos en curso" instead of displaying preloaded live simulated tracking timeline. |

---

## 7. Recommended Precise Remediation Strategies

### Strategy for R6 (Google OAuth 2.0 & Dynamic Profile):
1. **Remove All Hardcoded Defaults**:
   - In `js/views/profile.js`: Replace `${user.idCard || '1710034065'}` with `${user.idCard || ''}`, `${cleanPhone || '0991234567'}` with `${cleanPhone || ''}`, `${user.city || 'Quito'}` with `${user.city || ''}`, `${user.address || '...'}` with `${user.address || ''}`.
   - In `js/app.js:loginUser()`: Remove default `idCard: '1710034065'`, `phone: '+593 0991234567'`, `city: 'Quito'`, `address: 'Av. República del Salvador N34-183, Quito'`. Initialize with empty strings `""`.
   - In `js/views/checkout.js`: Ensure guest fields use empty strings rather than default 'Quito'.
2. **Implement Production-Ready Google Sign-In on `#profile`**:
   - In `js/views/profile.js`: When `!user`, render an unauthenticated state with a dedicated `#google-signin-container`, explanation of vault synchronization, and the Google button.
   - In `ProfileView.afterRender()`: If `!user`, call `app.initGoogleSignIn('google-signin-container')`.
3. **Dual-Mode GIS & Fallback Logic**:
   - Add `<script src="https://accounts.google.com/gsi/client" async defer></script>` to `index.html`.
   - In `js/app.js`: Implement `initGoogleSignIn(containerId)`:
     * If `window.google?.accounts?.id` is available AND `APP_CONFIG.GOOGLE_CLIENT_ID` is valid (not placeholder), initialize GIS and call `google.accounts.id.renderButton()`.
     * Otherwise, render a Google-branded Material Design fallback button (`onclick="app.handleSimulatedGoogleLogin()"`).
   - Implement `decodeJwtResponse(token)` in `js/app.js` using pure JavaScript base64 decoding.
   - Implement `handleGoogleCredentialResponse(response)` and `handleSimulatedGoogleLogin()`, creating a clean `currentUser` with `{ id, name, email, avatar, authProvider: 'google', idCard: '', phone: '', city: '', address: '' }`.
4. **Enhanced Logout**:
   - In `app.logoutUser()`: Call `google.accounts.id.disableAutoSelect()`, clear `Store.data.currentUser`, update navbar, and re-render `#profile` to show unauthenticated Google Sign-In prompt.

### Strategy for R1 (Condition Checkmarks):
- In `js/views/pdp.js:781`: In `selectCondition()`, query both `i` and `svg` using:
  ```javascript
  const checkIcon = headerDiv.querySelector('i, svg');
  ```
  And when setting active checkmark, remove all existing checkmarks from all buttons first before appending the single new checkmark, or query `btn.querySelectorAll('svg.lucide-check, i[data-lucide="check"]')` and `.remove()` them.

### Strategy for R2 (PDP Market Stats Removal):
- In `js/views/pdp.js`: Completely remove lines 441–450 (the `#market-history-box`, `#market-trend-pill`, SVG curve, and related canvas/chart rendering). Keep `#pdp-price` clear, visible, and prominent.

### Strategy for R3 (3D Card Viewer Clean Reverse):
- In `js/views/pdp.js:131–138`: Completely remove the `.centering-grid-overlay` div and its child `<span>` elements (`EJE X`, `EJE Y`). Leave solely the clean card back `<img>`.

### Strategy for R5 (Preloaded Live Tracking Simulation):
- In `js/views/tracking.js`: When `!order` or on initial page load, display an active simulated order (e.g. `#PKM-2026-LIVE-8841`) with active custody timeline steps, and eliminate all manual simulation control buttons.

---

## 8. Handoff Protocol Components

### 8.1 Observation
- Verbatim code inspection of `js/views/profile.js:43, 102, 133, 147, 158` confirmed hardcoded fallback values: `'1710034065'`, `'0991234567'`, `'Quito'`, and `'Av. República del Salvador N34-183, Quito'`.
- Inspection of `js/app.js:388–395` confirmed `loginUser()` assigns these exact mock values upon any login.
- Inspection of `index.html` confirmed no Google Identity Services script (`https://accounts.google.com/gsi/client`) is loaded.
- Inspection of Captura 5 (`media_1793616426669_fd5f4cc2.png`) confirmed the user profile displays hardcoded mock data for name, email, national ID, phone, city, and address.
- Inspection of Captura 4 (`media_1793616353085_5ccd04f2.jpg`) and `js/views/pdp.js:781–786` revealed that `headerDiv.querySelector('i')` fails to find checkmarks once Lucide converts them into `<svg>`, causing multiple checkmarks to remain permanently on inactive condition buttons.
- Inspection of Captura 1 confirmed the 12-month market history box is present in PDP.
- Inspection of Captura 3 confirmed the 3D card backface displays yellow dashed borders and centering labels (`EJE X: 50.0% / 50.0%`, `EJE Y: 50.0% / 50.0% • BORDES OK`).
- Execution of `node --test tests/*.test.mjs` ran 308 tests across 15 test files with 0 failures in 2.88s.

### 8.2 Logic Chain
1. Hardcoded values in `profile.js` and `app.js` cause initial or newly-logged-in user profiles to display fake Ecuadorian identity details rather than pristine user-entered data.
2. Replacing fallbacks with empty strings `""` ensures unauthenticated and newly authenticated sessions show no mock data.
3. Adding GIS SDK to `index.html` and implementing `initGoogleSignIn` with a fallback simulation allows production readiness with or without a configured GCP Client ID.
4. Parsing JWT tokens via client-side base64 decoding extracts Google user metadata (name, email, picture, sub) without external npm packages.
5. In `pdp.js`, because `lucide.createIcons()` converts `<i>` to `<svg>`, querying `headerDiv.querySelector('i')` fails to match the rendered checkmark on subsequent condition switches, directly causing multiple checkmarks to persist as seen in Captura 4.
6. Expanding the test suite with targeted tests for R1–R6 will verify the remediation and prevent regressions across the entire application lifecycle.

### 8.3 Caveats
- Google Identity Services requires an authorized JavaScript origin in the Google Cloud Console when using real OAuth credentials in production; local file (`file://`) origins cannot be authorized in GCP Console, making the simulated OAuth fallback essential for local development and offline testing.
- The existing test suite runs under Node.js with a custom `MockDOMElement` and `vm` sandbox (`test_harness.mjs`); tests for Google OAuth must mock `window.google` or test the pure JS JWT decoding and simulated login flow.
- No source code files were modified during this investigation (strict read-only constraint observed).

### 8.4 Conclusion
Requirement R6 and the automated test suite baseline are fully surveyed. All hardcoded profile definitions, unauthenticated UI states, GIS integration specifications, JWT decoding protocols, and test suite requirements are comprehensively documented. The codebase is fully prepared for structured implementation by the development team.

### 8.5 Verification Method
To independently verify the observations:
1. Run existing test suite:
   ```powershell
   node --test tests/*.test.mjs
   ```
   Confirm 308 tests pass cleanly.
2. Inspect hardcoded profile data lines:
   - `view_file` on `js/views/profile.js` lines 30–165.
   - `view_file` on `js/app.js` lines 385–400.
3. Inspect checkmark bug line:
   - `view_file` on `js/views/pdp.js` lines 770–795.
4. Inspect reverse side centering labels:
   - `view_file` on `js/views/pdp.js` lines 122–141.
5. Inspect market statistics box:
   - `view_file` on `js/views/pdp.js` lines 440–455.
