# Test Infrastructure & Dual-Track Verification Methodology — Graded & Sealed TCG E-commerce (R1–R4)

## 1. Overview & Dual-Track Test Architecture

This document formalizes the automated, opaque-box test infrastructure and verification methodology for the **Graded & Sealed TCG E-commerce Platform Enhancement (Requirements R1 through R4)**.

The testing architecture operates on a **Dual-Track Workflow**:
- **Track A (Implementation Track)**: Independent milestone implementation executed by specialized workers (`worker_m1` for R3 Catalog Assets, `worker_m2` for R1 Google Sign-In Modal, `worker_m3` for R2 Anonymous Order Tracking, and `worker_m4` for R4 Humanized Copy).
- **Track B (Testing Track)**: Authoritative, independent test suite authored by the E2E Test Writer in `tests/e2e_requirements_r1_to_r4.test.mjs`, derived strictly from `ORIGINAL_REQUEST.md` and `PROJECT.md` contracts prior to and in parallel with implementation.

The test infrastructure runs on the **Node.js native test runner** (`node:test` and `node:assert/strict`) supported on **Node.js v24+**. It requires zero external npm packages, third-party frameworks, or build compilers.

### 1.1 Project Directory Layout

```
Pagina_e-commerce/
├── tests/
│   ├── test_harness.mjs                 # Lightweight DOM emulation, contract oracles, Dexie ACID mock
│   ├── e2e_requirements_r1_to_r4.test.mjs # Master 4-tier E2E suite for R1–R4 (46 test cases)
│   ├── test_validations.test.mjs        # Module 10, Luhn, #DECLINED-SEC-054, Phone, VAT, Shipping
│   ├── test_pdp.test.mjs                # Product Detail Page & 3D card inspect modes
│   ├── test_cart_toast.test.mjs         # Singleton Toast (2500ms) & Cart Undo
│   ├── test_profile_orders.test.mjs     # User profile, persistence & tracking links
│   └── test_e2e_suite.test.mjs          # Legacy master E2E integration suite
├── js/
│   ├── app.js                           # App router, navbar, toast alerts, Google auth controller (R1)
│   ├── state.js                         # Reactive Store, session persistence, order lookups (R1, R2)
│   ├── data.js                          # Product catalog & asset mappings (R3)
│   ├── views/
│   │   ├── tracking.js                  # Order tracking & anonymous search state (R2, R4)
│   │   ├── checkout.js                  # Checkout flow, validations & error recovery (R4)
│   │   ├── profile.js                   # Authenticated profile view (R1, R4)
│   │   ├── catalog.js                   # Catalog grid & filters (R3)
│   │   └── pdp.js                       # 3D inspector & sealed product gallery (R3)
├── img/
│   ├── cards/
│   │   ├── gengar-holo-scarlet.png      # Gengar Holo asset (R3)
│   │   ├── mewto-holo-rare.png          # Mewtwo Holo asset (R3)
│   │   └── mimikyu-rare.png             # Mimikyu Shiny asset (R3)
│   └── sealed/
│       └── Paquete fossil.png           # Fossil booster pack asset (R3)
├── TEST_INFRA.md                        # Test architecture and dual-track guide (this file)
└── TEST_READY.md                        # Test readiness certification & coverage report
```

---

## 2. 4-Tier Opaque-Box Testing Methodology

The master test suite `tests/e2e_requirements_r1_to_r4.test.mjs` enforces a comprehensive 4-tier verification protocol:

```
┌───────────────────────────────────────────────────────────────┐
│        Tier 4: Real-World Scenarios (End-to-End User Journeys)│
│        - Collector Onboarding & Purchase                      │
│        - Anonymous Visitor Tracking Query                     │
│        - Bank Security Decline & Cash Recovery                │
├───────────────────────────────────────────────────────────────┤
│        Tier 3: Cross-Feature Interactions (Pairwise Workflows)│
│        - Dynamic Auth ↔ Profile ↔ Tracking                    │
│        - Catalog ↔ PDP Gallery ↔ Cart ↔ Undo                  │
│        - Checkout Cédula ↔ Rejection Alert ↔ In-Store Pickup  │
├───────────────────────────────────────────────────────────────┤
│        Tier 2: Boundary & Corner Cases (Adversarial Stress)   │
│        - Whitespace, empty inputs, regex failures             │
│        - Accented characters (UTF-8), Escape key modal close  │
│        - Malformed tracking codes, sanitized XSS payloads     │
│        - Space in filename URI, image onerror fallbacks       │
├───────────────────────────────────────────────────────────────┤
│        Tier 1: Feature Coverage (Happy Path Contract Tests)   │
│        - R1: Dynamic Google Sign-In Modal (>= 5 tests)        │
│        - R2: Anonymous Default Order Tracking (>= 5 tests)    │
│        - R3: Catalog Image Updates in data.js (>= 5 tests)    │
│        - R4: Humanized UI Copy and Tone (>= 5 tests)          │
└───────────────────────────────────────────────────────────────┘
```

### 2.1 Tier 1: Feature Coverage (Happy Path)
- **Standard**: At least 5 distinct test cases per requirement (20+ tests total).
- **Scope**: Verifies that every feature fulfills its primary specification contract when provided standard inputs.
- **Requirements Covered**:
  - **R1 (Dynamic Google Sign-In)**: Modal markup exists, controller methods (`openGoogleSignInModal`, `closeGoogleSignInModal`, `submitGoogleSignInModal`) work, dynamic user session establishes in `Store`, navbar `#nav-user-label` reflects first name, quick account picker functions.
  - **R2 (Anonymous Order Tracking)**: Navigating to `#tracking` with empty session renders empty search state; 0 occurrences of "Patricio Mora" or preloaded order; entering valid code resolves order stages; active session order auto-populates.
  - **R3 (Catalog Visual Assets)**: `gengar-scarlet-violet` links to `img/cards/gengar-holo-scarlet.png`; `mewtwo-151` links to `img/cards/mewto-holo-rare.png`; `mimikyu-paldean` links to `img/cards/mimikyu-rare.png`; `booster-box-fossil-1999` links to `img/sealed/Paquete fossil.png`; physical files exist on disk with non-zero size.
  - **R4 (Humanized UI Copy)**: Cart removal banner uses natural Spanish ("Producto retirado de tu bolsa", "Deshacer"); security badges avoid intimidating acronyms ("Pago Seguro y Protegido"); cédula validation guides without "Módulo 10"; payment decline explains clearly without "Diagnóstico de la Operación"; tracking stages use collector language ("Pago Confirmado", "Empaque Seguro").

### 2.2 Tier 2: Boundary & Corner Cases (Adversarial Stress)
- **Standard**: At least 5 tests per requirement targeting edge conditions, formatting variations, and defensive fallbacks (20+ tests total).
- **Scope**:
  - **R1 Boundaries**: Empty name/email rejection, whitespace trimming, malformed email format, UTF-8 preservation for Latin names with accents and hyphens (`María José Peña-Herrera`), modal cancellation via Escape key without state mutation.
  - **R2 Boundaries**: Empty tracking code submission prompt, nonexistent code search feedback ("Código no encontrado"), script tag / SQL injection sanitization, whitespace tolerance in tracking codes, direct URL hash queries (`#tracking?code=...`).
  - **R3 Boundaries**: Space in filename handling (`Paquete fossil.png`), image loading failure triggering `onerror` fallback to `imagenFallbackUrl`, seed database synchronization in `js/db/db-client.js`, multi-angle sealed gallery switching, normalized forward-slash paths.
  - **R4 Boundaries**: Phone validation edge formats (+593 mobile vs local), non-punitive ID reminder for store pickup, singleton toast 2500ms auto-dismiss without DOM accumulation, immediate decline recovery guidance, complete elimination of robotic phrases ("1-clic", "tamper-evident", "¡Hito completado!").

### 2.3 Tier 3: Cross-Feature Interactions (Pairwise Workflows)
- **Standard**: Multi-module integration tests verifying state handoffs across subsystem boundaries (>= 3 comprehensive tests).
- **Scope**:
  - **Flow 1 (Auth + Profile + Tracking)**: Anonymous navigation -> Zero personal data leaked -> Dynamic Google Sign-In -> Profile verification -> Order placement -> Tracking association with new dynamic user.
  - **Flow 2 (Catalog PDP + Multi-Angle Gallery + Cart + Undo)**: Fossil booster PDP inspection -> 3-angle gallery view -> Add to cart -> Cart thumbnail rendering -> Item removal -> Humanized undo banner -> Restoration.
  - **Flow 3 (Checkout Validation + Empathetic Error Recovery + Cash Pickup)**: Cédula error guidance -> Number correction -> Card decline (`#DECLINED-SEC-054`) -> Reassuring recovery alert -> Switch to In-Store Pickup ($0 shipping) + Cash -> Successful order completion.

### 2.4 Tier 4: Real-World Scenarios (End-to-End User Journeys)
- **Standard**: Realistic, multi-step customer journeys modeling authentic collector behavior (>= 3 complete journeys).
- **Scope**:
  - **Journey 1 (Collector Dynamic Onboarding & Purchase)**: Homepage arrival -> Dynamic Google account selection -> Browsing updated catalog assets -> PSA 10 card selection -> Frictionless checkout -> Live tracking verification.
  - **Journey 2 (Anonymous Tracking Visitor with External Receipt)**: Visitor with external invoice navigating directly to `#tracking` -> Zero prior data exposure -> Manual tracking code query -> Order timeline stage progression -> Satellite status card rendering.
  - **Journey 3 (Payment Decline Recovery & Safe Completion)**: Credit card rejected due to simulated security limit -> Empathetic reassurance without scary diagnostic headers -> Seamless switch to store pickup with cash -> Final order confirmation.

---

## 3. Authoritative Specification Oracles & Output Derivation

For every test case in `tests/e2e_requirements_r1_to_r4.test.mjs`, expected outputs are derived from authoritative specification contracts:

| Feature / Domain | Authoritative Source | Reference Oracle / Ground Truth Contract |
|---|---|---|
| **R1 Google Auth** | `ORIGINAL_REQUEST.md` § R1, `PROJECT.md` § Interface Contracts | `app.openGoogleSignInModal()` renders `#google-signin-modal`; dynamic `handleSimulatedGoogleLogin(name, email)` establishes `{ id, name, email, authProvider: 'google' }` in `Store` and `localStorage`. |
| **R2 Anonymous Tracking** | `ORIGINAL_REQUEST.md` § R2, `PROJECT.md` § R2-F1..F5 | `TrackingView.render()` returns empty search state when `Store.data.orders` is empty and `activeTrackingOrderId` is null; exactly 0 occurrences of "Patricio Mora". |
| **R3 Catalog Images** | `ORIGINAL_REQUEST.md` § R3, `PROJECT.md` § R3-F1..F5 | Exact asset paths: `img/cards/gengar-holo-scarlet.png`, `img/cards/mewto-holo-rare.png`, `img/cards/mimikyu-rare.png`, `img/sealed/Paquete fossil.png`. Verified on physical filesystem. |
| **R4 Humanized Copy** | `ORIGINAL_REQUEST.md` § R4, `explorer_survey_3/handoff.md` § 3 | R4 32-term copy dictionary: "Producto retirado de tu bolsa", "Deshacer", "Pago Seguro y Protegido", "Tu banco no autorizó el pago", "Pago Confirmado", "Empaque Seguro". |
| **Cédula / RUC Check** | Ecuadorian Civil Registry specification | Module 10 algorithm (`validateEcuadorianIdContract` in `tests/test_harness.mjs`). |
| **Card Validation** | ISO/IEC 7812 | Luhn algorithm (`validateLuhnContract` in `tests/test_harness.mjs`). |
| **Simulated Decline** | Platform specification | Cards ending in `0000` trigger `#DECLINED-SEC-054` (`checkSimulatedDeclineContract`). |
| **Financial Calculations** | Ecuadorian Tax Authority (SRI) | Exact 15% VAT calculation (`calculateVAT15Contract`) and flat shipping ($0, $3, $5). |

---

## 4. Test Runner & Execution Guide

### 4.1 Prerequisites
- **Node.js**: v24.0.0 or higher.
- **Dependencies**: Zero external npm dependencies. Native `node:test` and `node:assert/strict`.

### 4.2 Executing the R1–R4 E2E Test Suite
To run the master 4-tier E2E test suite:

```powershell
node --test tests/e2e_requirements_r1_to_r4.test.mjs
```

### 4.3 Executing All Project Test Suites
To run all test suites across the repository:

```powershell
node --test tests/*.test.mjs
```

---

## 5. Dual-Track Status & Handoff Protocol

- **Track A (Implementation)**:
  - Milestone 1 (`worker_m1`): Updating `js/data.js` and `js/db/db-client.js`.
  - Milestone 2 (`worker_m2`): Implementing dynamic Google modal in `index.html` and `js/app.js`.
  - Milestone 3 (`worker_m3`): Implementing anonymous default tracking in `js/views/tracking.js`.
  - Milestone 4 (`worker_m4`): Applying humanized copy across touchpoints.
- **Track B (Test Authoring)**:
  - Authored independent 4-tier test suite in `tests/e2e_requirements_r1_to_r4.test.mjs`.
  - Created `TEST_INFRA.md` (this document) and `TEST_READY.md`.
  - Evaluated baseline execution and escalated discovered implementation gaps to Track A workers.
