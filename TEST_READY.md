# TEST_READY — Certification & Automated Test Suite Delivery (R1–R4)

**Date:** 2026-11-02T20:10:00Z  
**Project:** Graded & Sealed TCG E-commerce Platform Enhancement (Requirements R1 through R4)  
**Track Lead:** E2E Testing Track Lead (`test_writer_e2e`)  
**Runner Engine:** Node.js native test runner (`node:test`, `node:assert/strict`) — Node v24.21.0  
**Test Suite File:** `tests/e2e_requirements_r1_to_r4.test.mjs`  
**Overall Suite Status:** **READY (46 comprehensive opaque-box test specifications authored, verified, and executable)**

---

## 1. Test Execution Command

To execute the authoritative R1–R4 E2E test suite:

```powershell
node --test tests/e2e_requirements_r1_to_r4.test.mjs
```

To run all test suites across the project:

```powershell
node --test tests/*.test.mjs
```

---

## 2. Test Counts by Tier & Methodology

The master test suite `tests/e2e_requirements_r1_to_r4.test.mjs` enforces the 4-tier opaque-box methodology:

| Tier | Tier Name | Standard | Target Features | Tests | Baseline Status (Pre-Implementation) | Target Status (Milestone 5) |
|---|---|---|---|:---:|---|---|
| **Tier 1** | Feature Coverage (Happy Path) | >= 5 tests per requirement | R1 (Google Sign-In), R2 (Anonymous Tracking), R3 (Catalog Images), R4 (Humanized Copy) | **20** | 3 Pass / 17 Fail (Implementation Pending) | **20 / 20 PASS** |
| **Tier 2** | Boundary & Corner Cases | >= 5 tests per requirement | R1 (Empty/UTF-8/Esc), R2 (Injection/Trim/Not-Found), R3 (Space URI/Fallback/Sync), R4 (Phone/Toasts/Decline) | **20** | 6 Pass / 14 Fail (Implementation Pending) | **20 / 20 PASS** |
| **Tier 3** | Cross-Feature Interactions | Pairwise cross-subsystem workflows | Auth ↔ Profile ↔ Tracking; Catalog ↔ PDP Gallery ↔ Cart ↔ Undo; Checkout Cédula ↔ Rejection Alert ↔ In-Store Pickup | **3** | 2 Pass / 1 Fail (Implementation Pending) | **3 / 3 PASS** |
| **Tier 4** | Real-World Scenarios | Complete end-to-end user lifecycles | Collector Onboarding & Purchase; Anonymous Tracking Visitor; Payment Security Decline Recovery | **3** | 1 Pass / 2 Fail (Implementation Pending) | **3 / 3 PASS** |
| **TOTAL** | **Full Master E2E Suite** | **Comprehensive Opaque-Box Coverage** | **All 4 Enhancement Requirements (R1 - R4)** | **46** | **12 Pass / 34 Fail (Implementation Pending)** | **46 / 46 PASS (100%)** |

---

## 3. Requirement & Feature Checklist

### R1. Dynamic Google Sign-In Modal
- [x] **TC-T1-R1-01**: Google Sign-In click opens interactive modal (`#google-signin-modal`) instead of silent auto-login.
- [x] **TC-T1-R1-02**: Submitting custom name and email establishes dynamic user session in `Store.data.currentUser`.
- [x] **TC-T1-R1-03**: Navbar user indicator (`#nav-user-label`) updates to display dynamic first name.
- [x] **TC-T1-R1-04**: Dynamic session persists to `localStorage.gstcg_user` with `authProvider: 'google'`.
- [x] **TC-T1-R1-05**: Quick account selector (`selectGoogleQuickAccount`) populates and submits dynamic credentials.
- [x] **TC-T2-R1-01**: Empty name or email input is rejected with friendly Spanish error.
- [x] **TC-T2-R1-02**: Whitespace-only name and email inputs are trimmed and rejected.
- [x] **TC-T2-R1-03**: Malformed email format is rejected.
- [x] **TC-T2-R1-04**: UTF-8 Latin names with accents and hyphens (`María José Peña-Herrera`) are preserved accurately.
- [x] **TC-T2-R1-05**: Modal dismissal via Escape key or close button leaves existing session intact.

### R2. Anonymous Default Order Tracking
- [x] **TC-T1-R2-01**: Navigating to `#tracking` with a clean session renders empty search state.
- [x] **TC-T1-R2-02**: Clean `#tracking` view contains zero occurrences of "Patricio Mora", "Patrick Mora", or preloaded email.
- [x] **TC-T1-R2-03**: Submitting valid order code into `#tracking-search-input` queries and renders order stages.
- [x] **TC-T1-R2-04**: Active session order auto-populates `#tracking` immediately after checkout.
- [x] **TC-T1-R2-05**: Empty search state suppresses automated timeline progression timers.
- [x] **TC-T2-R2-01**: Submitting empty tracking code prompts user without crashing.
- [x] **TC-T2-R2-02**: Nonexistent tracking code search displays clear friendly banner without leaking other orders.
- [x] **TC-T2-R2-03**: Hostile script injection payloads are safely sanitized without XSS execution.
- [x] **TC-T2-R2-04**: Tracking code with leading and trailing whitespace is trimmed properly.
- [x] **TC-T2-R2-05**: Direct URL hash navigation with invalid query falls back to empty search safely.

### R3. Catalog Image Updates in data.js
- [x] **TC-T1-R3-01**: Product `gengar-scarlet-violet` in `js/data.js` links to `img/cards/gengar-holo-scarlet.png`.
- [x] **TC-T1-R3-02**: Product `mewtwo-151` in `js/data.js` links to `img/cards/mewto-holo-rare.png`.
- [x] **TC-T1-R3-03**: Product `mimikyu-paldean` in `js/data.js` links to `img/cards/mimikyu-rare.png`.
- [x] **TC-T1-R3-04**: Product `booster-box-fossil-1999` in `js/data.js` links to `img/sealed/Paquete fossil.png`.
- [x] **TC-T1-R3-05**: All four image assets physically exist on disk with non-zero size.
- [x] **TC-T3-R3-01**: Asset path containing space (`Paquete fossil.png`) renders properly in DOM attributes.
- [x] **TC-T3-R3-02**: Simulated image load failure triggers `onerror` fallback gracefully in catalog and PDP.
- [x] **TC-T3-R3-03**: Product database synchronization in `js/db/db-client.js` matches the new asset paths.
- [x] **TC-T3-R3-04**: Sealed product gallery handles switching between multi-angle views without broken source.
- [x] **TC-T3-R3-05**: Visual asset paths use normalized forward slashes regardless of OS environment.

### R4. Humanized UI Copy and Tone
- [x] **TC-T1-R4-01**: Cart removal banner says "Producto retirado de tu bolsa" with clean "Deshacer" button.
- [x] **TC-T1-R4-02**: Checkout security badges present consumer reassurance without "TLS 256-bit" or "PCI-DSS".
- [x] **TC-T1-R4-03**: Cédula validation errors guide customer without exposing "Módulo 10" algorithm name.
- [x] **TC-T1-R4-04**: Payment error screen offers empathetic explanation without "Diagnóstico de la Operación".
- [x] **TC-T1-R4-05**: Tracking stages use friendly collector status copy without "cadena de custodia" or "¡Hito completado!".
- [x] **TC-T2-R4-01**: Ecuadorian phone number accepts standard mobile and provides helpful format guidance.
- [x] **TC-T2-R4-02**: In-store pickup instructions remind customer to present ID without harsh command.
- [x] **TC-T2-R4-03**: Singleton toast dismisses reliably within 2500ms without leaving ghost elements.
- [x] **TC-T2-R4-04**: Card decline code `#DECLINED-SEC-054` offers immediate action to switch payment method.
- [x] **TC-T2-R4-05**: Absence of English untranslated fragments ("1-clic", "tamper-evident") across all user alerts.

### Cross-Feature & Real-World User Journeys
- [x] **TC-T3-01**: Dynamic Google Auth + User Profile + Anonymous Tracking Flow.
- [x] **TC-T3-02**: Catalog Image Assets + PDP Multi-Angle Gallery + Cart + Undo Flow.
- [x] **TC-T3-03**: Checkout Cédula Validation + Humanized Card Rejection + Cash Pickup Recovery.
- [x] **TC-T4-01**: Collector Dynamic Onboarding & First Order Journey.
- [x] **TC-T4-02**: Anonymous Visitor Tracking Protection Journey.
- [x] **TC-T4-03**: Payment Decline Recovery & Safe Completion Journey.

---

## 4. Discovered Implementation Defects & Escalations to Track A Workers

Running the master test suite against the pre-implementation codebase identified the following concrete implementation defects and missing features, escalated to Track A milestone workers:

### Escalation 1: Milestone 1 (`worker_m1`) — Catalog Assets in `js/data.js`
- **Defects Discovered**:
  - `gengar-scarlet-violet` currently specifies placeholder `img/gengar-vmax.png` instead of `img/cards/gengar-holo-scarlet.png`.
  - `mewtwo-151` specifies `img/mewtwo-base.png` instead of `img/cards/mewto-holo-rare.png`.
  - `mimikyu-paldean` specifies `img/umbreon-vmax.png` instead of `img/cards/mimikyu-rare.png`.
  - `booster-box-fossil-1999` specifies `img/sealed/team-rocket-box-front.png` instead of `img/sealed/Paquete fossil.png`.
- **Target Files**: `js/data.js`, `js/db/db-client.js`.
- **Test Failures to Resolve**: `TC-T1-R3-01`, `TC-T1-R3-02`, `TC-T1-R3-03`, `TC-T1-R3-04`, `TC-T3-R3-01`, `TC-T3-R3-02`.

### Escalation 2: Milestone 2 (`worker_m2`) — Dynamic Google Sign-In in `js/app.js` & `index.html`
- **Defects Discovered**:
  - `app.handleSimulatedGoogleLogin()` in `js/app.js:545` hardcodes `name: 'Patrick Mora'`, `email: 'patrickmora2006@gmail.com'`.
  - Missing `#google-signin-modal` dialog markup in `index.html`.
  - Missing controller methods: `app.openGoogleSignInModal()`, `app.closeGoogleSignInModal()`, `app.selectGoogleQuickAccount()`, `app.submitGoogleSignInModal()`.
- **Target Files**: `index.html`, `js/app.js`.
- **Test Failures to Resolve**: `TC-T1-R1-01` through `TC-T1-R1-05`, `TC-T2-R1-01` through `TC-T2-R1-05`, `TC-T3-01`, `TC-T4-01`.

### Escalation 3: Milestone 3 (`worker_m3`) — Anonymous Tracking in `js/views/tracking.js` & `js/state.js`
- **Defects Discovered**:
  - `TrackingView.render()` falls back to `getSimulatedOrder()` which hardcodes `buyerName: 'Patricio Mora (Coleccionista Verificado)'` and `#GS-2026-9481`.
  - Clean sessions navigating to `#tracking` expose personal data to public visitors.
  - Missing empty search view and manual tracking code lookup handler `TrackingView.handleTrackingSearch()`.
- **Target Files**: `js/views/tracking.js`, `js/state.js`.
- **Test Failures to Resolve**: `TC-T1-R2-01`, `TC-T1-R2-02`, `TC-T1-R2-03`, `TC-T2-R2-01` through `TC-T2-R2-05`, `TC-T4-02`.

### Escalation 4: Milestone 4 (`worker_m4`) — Humanized UI Copy & Tone
- **Defects Discovered**:
  - `index.html:327`: Contains robotic `Ítem eliminado de la bolsa.` and `[Deshacer acción]`.
  - `js/views/checkout.js`: Exposes `Módulo 10` in cédula validation, displays technical badges `TLS 256-bit`, `PCI-DSS`, and harsh diagnostic headers `Diagnóstico de la Operación`.
  - `js/views/tracking.js`: Contains forensic terms `cadena de custodia`, `tamper-evident`, and developer toast `¡Hito completado!`.
- **Target Files**: `index.html`, `js/views/checkout.js`, `js/views/tracking.js`.
- **Test Failures to Resolve**: `TC-T1-R4-01` through `TC-T1-R4-05`, `TC-T2-R4-02`, `TC-T2-R4-05`.

---

## 5. Certification Sign-off

The authoritative 4-tier E2E test suite `tests/e2e_requirements_r1_to_r4.test.mjs` is verified, deterministic, and fully operational. It is certified ready to serve as the regression and compliance verification gate for implementation Milestones M1 through M5.
