# Test Infrastructure & Methodology — Graded & Sealed TCG E-commerce (Phases 4-7)

## 1. Overview & Test Architecture

This document describes the automated opaque-box test infrastructure designed for Phases 4 through 7 of the Graded & Sealed TCG e-commerce platform.

The test suite is built exclusively using the **Node.js native test runner** (`node:test` and `node:assert/strict`) supported on **Node.js v24+**. It requires zero external npm packages, compilers, or third-party test harnesses, ensuring instant reproducibility and deterministic execution in any standard runtime environment.

### 1.1 Architecture & Directory Layout

```
Pagina_e-commerce/
├── tests/
│   ├── test_harness.mjs             # Environment simulator, DOM mocks, contract oracles, Dexie ACID mock
│   ├── test_validations.test.mjs    # Features 9-15: Module 10, Luhn, #DECLINED-SEC-054, Phone, VAT, Shipping
│   ├── test_pdp.test.mjs            # Features 1-8: Visual assets, 3D inspector modes, tipo_item logic, stepper, PSA modal
│   ├── test_search_failover.test.mjs# Features 19-20: 3-tier cascade, 400ms debounce, skeletons, zero-state
│   ├── test_cart_toast.test.mjs     # Features 17-18: Singleton toast (2.5s), cart removal undo, totals calculation
│   ├── test_profile_orders.test.mjs # Features 16, 21-25: Dexie persistence, user profile, order history, tracking link, logout
│   └── test_e2e_suite.test.mjs      # Feature 26 + Tier 3 cross-feature combinations + Tier 4 end-to-end user journeys
├── TEST_INFRA.md                    # Test architecture and runner documentation (this file)
└── TEST_READY.md                    # Test readiness certification and pass/fail summary
```

---

## 2. 4-Tier Testing Methodology

The test suite enforces a rigorous 4-tier opaque-box validation methodology covering all 26 platform features:

### Tier 1: Feature Coverage (Happy Path)
- **Standard**: At least 5 distinct test cases per feature for every one of the 26 inventoried features (130+ tests).
- **Scope**: Exercises the primary contract of each feature under standard, expected operating inputs.
- **Authoritative Source**: `ORIGINAL_REQUEST.md` and `PROJECT.md` Feature Inventory (Features 1 through 26).

### Tier 2: Boundary & Corner Cases (Adversarial & Fault Tolerance)
- **Standard**: Targeted stress testing of domain edges, formatting constraints, timing bounds, and API errors.
- **Scope**:
  - Ecuadorian Cédula (10 digits) & natural RUC (13 digits ending in '001') Module 10 validation.
  - Invalid province codes, 3rd digit bounds, negative checksums, alphanumeric injections.
  - Phone format (+593 prefix enforcement, length boundaries).
  - Luhn card formula checks, cards ending in '0000' triggering `#DECLINED-SEC-054`.
  - Exact 15% VAT calculation and half-cent roundings.
  - Flat shipping fees ($0.00 pickup, $3.00 Quito, $5.00 National).
  - Singleton toast behavior (max 1 active toast) and exactly 2500ms auto-dismiss.
  - Quantity stepper lower bound clamping at 1.
  - 400ms search input debounce timing.
  - 3-tier failover cascade: `pokemontcg.io` -> `tcgdex.net` -> local catalogue.

### Tier 3: Cross-Feature Integration Combinations
- **Standard**: Multi-module workflows testing contract handoffs between subsystems.
- **Scope**:
  - Cart operations + Quantity Stepper + Shipping selection + VAT 15% -> Checkout order summary.
  - Mandatory Checkout + Module 10 + Luhn + Dexie transactional persistence (`usuarios`, `ordenes_compra`, `items_orden`).
  - Dexie persistence -> User Profile "Mis Últimas Compras" query -> Order thumbnails, dates, logistic status.
  - Profile Order card -> [Ver Tracking en Vivo] deep link resolution (`#tracking?order=<id>`).
  - Cart item deletion -> Confirmation modal -> Functional 'Deshacer' (undo) -> State restoration.

### Tier 4: Real-World Scenarios (End-to-End User Journeys)
- **Standard**: Complete lifecycle journeys emulating actual collector behavior.
- **Scope**:
  - *Journey 1 (Single Card Collector)*: Home -> Search -> 3D Card Inspector (Holo shimmer, 180° back 50/50, Slab PSA) -> PSA 10 select -> Cart -> Mandatory account checkout -> Credit card payment -> Dexie persistence -> Profile history -> Live tracking.
  - *Journey 2 (Sealed Box Investor)*: Catalog -> Team Rocket Booster Box -> Sealed PDP (PSA and 3D hidden, multi-angle gallery, factory specs) -> Add 2 units -> Quito express shipping ($3.00) -> Checkout -> Order confirmed.
  - *Journey 3 (Bank Decline & Cash Recovery)*: Checkout card ending in '0000' -> `#DECLINED-SEC-054` error view -> Switch to In-store pickup ($0.00) + Cash -> Order successfully placed -> Cart cleared.
  - *Journey 4 (Network Outage & API Failover)*: Search card while primary API is down -> Transparent failover to secondary API -> If secondary fails, offline local catalogue fallback.
  - *Journey 5 (Accidental Deletion & Recovery)*: Cart deletion -> Undo restoration -> Checkout continuity.

---

## 3. Test Runner & Execution Guide

### 3.1 Prerequisites
- **Node.js**: Version 24.0.0 or higher.
- **Dependencies**: None. Uses native `node:test` and `node:assert/strict`.

### 3.2 Running the Full Test Suite
To run all test suites matching `tests/*.test.mjs`:

```powershell
cmd /c "node --test tests/*.test.mjs"
```

### 3.3 Running Specific Test Suites
To run an individual test suite:

```powershell
# Validations & Financial Rules (Tier 1 & Tier 2)
cmd /c "node --test tests/test_validations.test.mjs"

# Product Detail Page & 3D Inspector (Tier 1 & Tier 2)
cmd /c "node --test tests/test_pdp.test.mjs"

# Failover Search Subsystem (Tier 1 & Tier 2)
cmd /c "node --test tests/test_search_failover.test.mjs"

# Cart & Singleton Toast (Tier 1 & Tier 2)
cmd /c "node --test tests/test_cart_toast.test.mjs"

# User Profile, Dexie & Tracking (Tier 1 & Tier 2)
cmd /c "node --test tests/test_profile_orders.test.mjs"

# Master Suite (Tier 1 Checklist, Tier 3 Cross-Feature, Tier 4 Real-World Journeys)
cmd /c "node --test tests/test_e2e_suite.test.mjs"
```

---

## 4. Expected Output Derivation & Verification

Every test case derives its expected values from:
1. **Mathematical specifications**: Ecuadorian Module 10 formula, Luhn formula, 15% VAT rounded to 2 decimals.
2. **Documented business rules**: Flat shipping tiers ($0, $3, $5), simulated decline code `#DECLINED-SEC-054`, 2500ms toast auto-dismiss, quantity minimum bound 1, 400ms debounce.
3. **Database schema**: Dexie.js 12 stores specified in `js/db/schema.js`.
4. **Interface contracts**: Formally listed in `PROJECT.md` § Interface Contracts.
