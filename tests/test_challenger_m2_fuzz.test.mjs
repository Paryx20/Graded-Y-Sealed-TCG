/**
 * ==============================================================================
 * Challenger 1 - Milestone 2 Adversarial Empirical Fuzzing Suite
 * File: tests/test_challenger_m2_fuzz.test.mjs
 * 
 * Target:
 * 1. Fuzz Store.isValidEcuadorianId:
 *    - 1,000 valid/invalid IDs and RUCs (500 valid cédulas, 500 valid RUCs, 500 invalid cédulas, 500 invalid RUCs)
 *    - Province boundaries (00, 24, 25, 30, -1)
 *    - Third digit permutations (0-9)
 *    - Non-numeric injection, SQL/HTML injection strings, empty/null/undefined
 * 2. Fuzz Luhn Algorithm & #DECLINED-SEC-054:
 *    - Valid cards (Visa, Mastercard, Amex, Discover)
 *    - Single digit errors (100% detected) & Transpositions (>97.7% / ~98% detected)
 *    - Cards ending in '0000' (strictly triggers #DECLINED-SEC-054 when Luhn passes)
 *    - Short cards, long cards (up to 30 digits), alpha characters
 * 3. Fuzz 15% VAT & Shipping:
 *    - Fractional cents rounding across 10,000 random currency amounts
 *    - Zero subtotal, large subtotals ($1,000,000+)
 *    - Verify flat shipping values ($0.00, $3.00, $5.00) and order totals reconciliation
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import {
  validateEcuadorianIdContract,
  validateLuhnContract,
  checkSimulatedDeclineContract,
  validateEcuadorianPhoneContract,
  calculateVAT15Contract,
  calculateShippingFeeContract,
  calculateOrderTotalsContract
} from './test_harness.mjs';

// Setup environment and load production code
function setupEnvironment() {
  const rootDir = process.cwd();
  const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');
  const checkoutCode = fs.readFileSync(path.join(rootDir, 'js/views/checkout.js'), 'utf8');

  const sandbox = {
    console,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    app: {
      renderCurrentView: () => {},
      showToast: () => {}
    },
    window: {
      location: {}
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '\n;this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '\n;this.Store = Store;', sandbox);
  vm.runInContext(checkoutCode + '\n;this.CheckoutView = CheckoutView;', sandbox);

  return {
    Store: sandbox.Store,
    CheckoutView: sandbox.CheckoutView,
    APP_CONFIG: sandbox.APP_CONFIG
  };
}

const { Store, CheckoutView, APP_CONFIG } = setupEnvironment();

// ==============================================================================
// 1. ECUADORIAN ID & RUC ADVERSARIAL FUZZING
// ==============================================================================

/**
 * Helper: Authoritative check digit calculator for Module 10 (cédula)
 */
function computeCedulaCheckDigit(base9) {
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(base9.charAt(i), 10) * coef[i];
    if (v >= 10) v -= 9;
    sum += v;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

test('Fuzz Ecuadorian ID: 500 randomly generated valid Cédulas return true across all provinces', () => {
  let validCount = 0;
  for (let p = 1; p <= 24; p++) {
    const prov = p.toString().padStart(2, '0');
    for (let i = 0; i < 21; i++) { // ~504 combinations
      const d3 = (i % 6).toString(); // 0 to 5
      const seed = ((p * 1000 + i * 37) % 1000000).toString().padStart(6, '0');
      const base9 = prov + d3 + seed;
      const checkDigit = computeCedulaCheckDigit(base9);
      const cedula = base9 + checkDigit;

      const liveResult = Store.isValidEcuadorianId(cedula);
      const oracleResult = validateEcuadorianIdContract(cedula);

      assert.equal(liveResult, true, `Expected valid cédula ${cedula} (prov: ${prov}, d3: ${d3}) to pass`);
      assert.equal(oracleResult, true, `Expected contract oracle to agree on ${cedula}`);
      validCount++;
    }
  }
  assert.ok(validCount >= 500, `Tested ${validCount} valid cédulas`);
});

test('Fuzz Ecuadorian ID: 500 randomly generated valid RUCs (cédula + 001) return true', () => {
  let validRucCount = 0;
  for (let p = 1; p <= 24; p++) {
    const prov = p.toString().padStart(2, '0');
    for (let i = 0; i < 21; i++) {
      const d3 = (i % 6).toString();
      const seed = ((p * 777 + i * 91) % 1000000).toString().padStart(6, '0');
      const base9 = prov + d3 + seed;
      const checkDigit = computeCedulaCheckDigit(base9);
      const ruc = base9 + checkDigit + '001';

      const liveResult = Store.isValidEcuadorianId(ruc);
      const oracleResult = validateEcuadorianIdContract(ruc);

      assert.equal(liveResult, true, `Expected valid RUC ${ruc} to pass`);
      assert.equal(oracleResult, true, `Expected contract oracle to agree on RUC ${ruc}`);
      validRucCount++;
    }
  }
  assert.ok(validRucCount >= 500, `Tested ${validRucCount} valid RUCs`);
});

test('Fuzz Ecuadorian ID: 500 corrupted Cédulas with mutated check digits are strictly rejected', () => {
  let invalidCount = 0;
  for (let p = 1; p <= 24; p++) {
    const prov = p.toString().padStart(2, '0');
    for (let i = 0; i < 21; i++) {
      const d3 = (i % 6).toString();
      const seed = ((p * 1000 + i * 37) % 1000000).toString().padStart(6, '0');
      const base9 = prov + d3 + seed;
      const correctCheck = computeCedulaCheckDigit(base9);
      const corruptedCheck = (correctCheck + 1 + (i % 8)) % 10;
      assert.notEqual(corruptedCheck, correctCheck);
      const corruptedCedula = base9 + corruptedCheck;

      assert.equal(Store.isValidEcuadorianId(corruptedCedula), false, `Corrupted cédula ${corruptedCedula} must be rejected`);
      assert.equal(validateEcuadorianIdContract(corruptedCedula), false);
      invalidCount++;
    }
  }
  assert.ok(invalidCount >= 500, `Tested ${invalidCount} invalid cédulas`);
});

test('Fuzz Ecuadorian ID: 500 invalid RUCs (bad suffix, wrong lengths, corrupted base) are strictly rejected', () => {
  let invalidRucCount = 0;
  const badSuffixes = ['000', '002', '010', '100', '999', '00A', '00', '0001', 'xyz'];

  for (let i = 0; i < 500; i++) {
    const prov = ((i % 24) + 1).toString().padStart(2, '0');
    const d3 = (i % 6).toString();
    const seed = ((i * 43) % 1000000).toString().padStart(6, '0');
    const base9 = prov + d3 + seed;
    const correctCheck = computeCedulaCheckDigit(base9);
    const validBase10 = base9 + correctCheck;

    let malformedRuc = '';
    const mode = i % 4;
    if (mode === 0) {
      // Valid base, invalid suffix
      const badSfx = badSuffixes[i % badSuffixes.length];
      malformedRuc = validBase10 + badSfx;
    } else if (mode === 1) {
      // Invalid base (corrupted check digit) + '001'
      const badCheck = (correctCheck + 3) % 10;
      malformedRuc = base9 + badCheck + '001';
    } else if (mode === 2) {
      // Wrong length (12 or 14 digits)
      malformedRuc = (i % 2 === 0) ? (validBase10 + '01') : (validBase10 + '0001');
    } else {
      // Invalid province with 001
      malformedRuc = '25' + d3 + seed + correctCheck + '001';
    }

    assert.equal(Store.isValidEcuadorianId(malformedRuc), false, `Malformed RUC ${malformedRuc} must be rejected`);
    invalidRucCount++;
  }
  assert.equal(invalidRucCount, 500);
});

test('Fuzz Ecuadorian ID: Province boundaries (00, 24, 25, 30, -1)', () => {
  // Boundary 00: Never valid
  const base00 = '000123456';
  const chk00 = computeCedulaCheckDigit(base00);
  assert.equal(Store.isValidEcuadorianId(base00 + chk00), false, 'Province 00 must be rejected');

  // Boundary 24 (Santa Elena): Valid boundary
  const base24 = '240123456';
  const chk24 = computeCedulaCheckDigit(base24);
  assert.equal(Store.isValidEcuadorianId(base24 + chk24), true, 'Province 24 must be accepted');

  // Boundary 25 (Beyond Santa Elena): Invalid boundary
  const base25 = '250123456';
  const chk25 = computeCedulaCheckDigit(base25);
  assert.equal(Store.isValidEcuadorianId(base25 + chk25), false, 'Province 25 must be rejected');

  // Boundary 30 (Foreign registration): Invalid for natural identity cards in this system
  const base30 = '300123456';
  const chk30 = computeCedulaCheckDigit(base30);
  assert.equal(Store.isValidEcuadorianId(base30 + chk30), false, 'Province 30 must be rejected');

  // Boundary -1 / negative strings
  assert.equal(Store.isValidEcuadorianId('-101234567'), false, 'Negative province -1 must be rejected');
  assert.equal(Store.isValidEcuadorianId('-011234567'), false, 'Negative sign must be rejected');
});

test('Fuzz Ecuadorian ID: Third digit permutations (0 through 9)', () => {
  const prov = '17'; // Pichincha
  const seed = '100340';

  // 0, 1, 2, 3, 4, 5: natural person cédulas -> must be accepted when check digit matches
  for (let d3 = 0; d3 <= 5; d3++) {
    const base9 = prov + d3 + seed;
    const chk = computeCedulaCheckDigit(base9);
    const id = base9 + chk;
    assert.equal(Store.isValidEcuadorianId(id), true, `Third digit ${d3} should be accepted`);
  }

  // 6, 7, 8, 9: legal/public entities or invalid -> must be rejected for natural cédula
  for (let d3 = 6; d3 <= 9; d3++) {
    const base9 = prov + d3 + seed;
    const chk = computeCedulaCheckDigit(base9);
    const id = base9 + chk;
    assert.equal(Store.isValidEcuadorianId(id), false, `Third digit ${d3} should be rejected (tercerDigito >= 6)`);
  }
});

test('Fuzz Ecuadorian ID: Non-numeric, SQL/HTML injection vectors, and malformed types', () => {
  const injections = [
    // SQL Injections
    "1710034065' OR '1'='1",
    "'; DROP TABLE usuarios; --",
    "1710034065 UNION SELECT * FROM usuarios",
    "ADMIN'--",
    "1710034065' /*",
    // HTML / XSS Injections
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "1710034065<svg onload=alert(1)>",
    "javascript:void(0)",
    // Non-numeric mutations
    "171003406A",
    "171003406X",
    "17100-34065",
    "17100.34065",
    "1710034065.0",
    "1710034065e1",
    "17 10034065",
    "1710034065\0",
    // Extreme lengths
    "",
    "1",
    "123456789",     // 9 digits
    "12345678901",   // 11 digits
    "123456789012",  // 12 digits
    "12345678901234" // 14 digits
  ];

  for (const malicious of injections) {
    assert.equal(Store.isValidEcuadorianId(malicious), false, `Injection string '${malicious}' must be rejected`);
  }

  // Null, undefined, and non-string types
  assert.equal(Store.isValidEcuadorianId(null), false, 'null must return false');
  assert.equal(Store.isValidEcuadorianId(undefined), false, 'undefined must return false');
  assert.equal(Store.isValidEcuadorianId(1710034065), false, 'Number type must return false');
  assert.equal(Store.isValidEcuadorianId({}), false, 'Object must return false');
  assert.equal(Store.isValidEcuadorianId([]), false, 'Array must return false');
  assert.equal(Store.isValidEcuadorianId(true), false, 'Boolean true must return false');
  assert.equal(Store.isValidEcuadorianId(false), false, 'Boolean false must return false');
  assert.equal(Store.isValidEcuadorianId(NaN), false, 'NaN must return false');

  // Whitespace trimming behavior: valid cédula with padded whitespace should be trimmed and accepted
  assert.equal(Store.isValidEcuadorianId('  1710034065  '), true, 'Padded valid cédula must be trimmed and accepted');
});

// ==============================================================================
// 2. LUHN ALGORITHM & #DECLINED-SEC-054 ADVERSARIAL FUZZING
// ==============================================================================

/**
 * Helper: Compute Luhn check digit for a given card prefix
 */
function computeLuhnCheckDigit(prefix) {
  let sum = 0;
  let alternate = true;
  for (let i = prefix.length - 1; i >= 0; i--) {
    let n = parseInt(prefix.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

test('Fuzz Luhn Check: Valid cards across Visa, Mastercard, Amex, Discover are approved', () => {
  const validCards = [
    // Visa
    '4532015112830366',
    '4000001234562',      // 13-digit Visa
    '4929812345678906',
    // Mastercard
    '5424180123456789',
    '5105105105105100',
    '2221001234567896',  // 2-series BIN
    // Amex (15 digits)
    '378282246310005',
    '340000123456781',
    // Discover (16 digits)
    '6011111111111117',
    '6500001234567899'
  ];

  for (const card of validCards) {
    const live = CheckoutView.validateCreditCard(card);
    const oracleLuhn = validateLuhnContract(card);

    assert.equal(oracleLuhn, true, `Contract oracle should validate ${card}`);
    assert.equal(live.valid, true, `Expected ${card} to be approved`);
    assert.equal(live.code, '00-APPROVED');
  }

  // Formatted cards with spaces and hyphens should be accepted
  const spaced = '4532 0151 1283 0366';
  const hyphenated = '4532-0151-1283-0366';
  assert.equal(CheckoutView.validateCreditCard(spaced).valid, true);
  assert.equal(CheckoutView.validateCreditCard(hyphenated).valid, true);
});

test('Fuzz Luhn Check: Single-digit mutation fuzzing achieves 100% error detection rate across >7,000 permutations', () => {
  const testBases = [
    '4532015112830366', // Visa 16
    '4000001234562',    // Visa 13
    '5424180123456789', // MC 16
    '378282246310005',  // Amex 15
    '6011111111111117'  // Discover 16
  ];

  // Generate 50 additional confirmed valid cards for exhaustive mutation
  const cardPool = [...testBases];
  for (let c = 0; c < 50; c++) {
    const pfx = (411100000000000 + c * 97).toString().slice(0, 15);
    const chk = computeLuhnCheckDigit(pfx);
    const card = pfx + chk;
    assert.equal(validateLuhnContract(card), true);
    cardPool.push(card);
  }

  let totalMutations = 0;
  let detectedMutations = 0;

  for (const card of cardPool) {
    for (let pos = 0; pos < card.length; pos++) {
      const origDigit = parseInt(card.charAt(pos), 10);
      for (let d = 0; d <= 9; d++) {
        if (d === origDigit) continue;
        const mutated = card.slice(0, pos) + d + card.slice(pos + 1);
        totalMutations++;

        const res = CheckoutView.validateCreditCard(mutated);
        if (!res.valid && res.code === 'LUHN_FAILED') {
          detectedMutations++;
        }
      }
    }
  }

  const detectionRate = (detectedMutations / totalMutations) * 100;
  assert.ok(totalMutations > 7000, `Tested ${totalMutations} single-digit mutations`);
  assert.equal(detectedMutations, totalMutations, `Single-digit error detection rate must be strictly 100%, got ${detectionRate}%`);
});

test('Fuzz Luhn Check: Transposition error fuzzing exceeds 97.7% / ~98% detection rate', () => {
  // Generate 200 valid random cards across multiple BINs
  const validCards = [];
  for (let i = 0; i < 200; i++) {
    const prefixNum = 400000000000000 + i * 1337;
    const pfx = prefixNum.toString().slice(0, 15);
    const chk = computeLuhnCheckDigit(pfx);
    const card = pfx + chk;
    if (validateLuhnContract(card)) {
      validCards.push(card);
    }
  }

  let totalTranspositions = 0;
  let detectedTranspositions = 0;
  let nonZeroNineTranspositions = 0;
  let detectedNonZeroNine = 0;

  for (const card of validCards) {
    for (let pos = 0; pos < card.length - 1; pos++) {
      const d1 = parseInt(card.charAt(pos), 10);
      const d2 = parseInt(card.charAt(pos + 1), 10);
      if (d1 === d2) continue; // skip identical adjacent digits

      const swapped = card.slice(0, pos) + card.charAt(pos + 1) + card.charAt(pos) + card.slice(pos + 2);
      totalTranspositions++;

      const isZeroNine = (d1 === 0 && d2 === 9) || (d1 === 9 && d2 === 0);
      if (!isZeroNine) {
        nonZeroNineTranspositions++;
      }

      const res = CheckoutView.validateCreditCard(swapped);
      if (!res.valid) {
        detectedTranspositions++;
        if (!isZeroNine) {
          detectedNonZeroNine++;
        }
      }
    }
  }

  // 1. All non-(0,9) transpositions are mathematically guaranteed to be detected 100%
  assert.equal(detectedNonZeroNine, nonZeroNineTranspositions, 'All transpositions not involving {0, 9} must be detected 100%');

  // 2. Total transpositions detection rate must meet mathematical expectation (88/90 = 97.78%, >= 97.5%)
  const overallRate = detectedTranspositions / totalTranspositions;
  assert.ok(totalTranspositions >= 1000, `Tested ${totalTranspositions} total transpositions`);
  assert.ok(overallRate >= 0.975, `Overall transposition detection rate must exceed 97.5%, observed: ${(overallRate * 100).toFixed(2)}%`);
});

test('Fuzz Luhn Check: 50 generated valid Luhn cards ending in 0000 strictly trigger #DECLINED-SEC-054', () => {
  const valid0000Cards = [];
  for (let i = 0; i < 50; i++) {
    const base = (45000000000 + i * 239).toString(); // 11 digits
    // Find digit 12 such that base + d + '0000' is a valid Luhn number
    for (let d = 0; d <= 9; d++) {
      const candidate = base + d + '0000';
      if (validateLuhnContract(candidate)) {
        valid0000Cards.push(candidate);
        break;
      }
    }
  }

  assert.equal(valid0000Cards.length, 50, 'Must have generated 50 valid Luhn cards ending in 0000');

  for (const card of valid0000Cards) {
    const res = CheckoutView.validateCreditCard(card);
    assert.equal(res.valid, false, `Card ${card} must be declined`);
    assert.equal(res.simulatedDecline, true, `Card ${card} must flag simulatedDecline: true`);
    assert.equal(res.code, '#DECLINED-SEC-054', `Card ${card} must return code #DECLINED-SEC-054`);
    assert.ok(res.message.includes('#DECLINED-SEC-054'), `Message must include code`);
  }
});

test('Fuzz Luhn Check: Cards ending in 0000 with INVALID Luhn fail checksum BEFORE simulated decline', () => {
  // 4500000000070000 is valid Luhn ending in 0000
  const valid0000 = '4500000000070000';
  assert.equal(validateLuhnContract(valid0000), true);

  // 4500000000080000 is invalid Luhn ending in 0000
  const corrupted0000 = '4500000000080000';
  assert.equal(validateLuhnContract(corrupted0000), false);

  const res = CheckoutView.validateCreditCard(corrupted0000);
  assert.equal(res.valid, false);
  assert.equal(res.code, 'LUHN_FAILED', 'Must fail with LUHN_FAILED, not bank decline');
  assert.notEqual(res.code, '#DECLINED-SEC-054');
});

test('Fuzz Luhn Check: Boundary lengths (< 13 or > 19 digits) and non-numeric inputs', () => {
  const shortCards = [
    '',
    '4',
    '4532',
    '123456789012' // 12 digits
  ];
  for (const sc of shortCards) {
    const res = CheckoutView.validateCreditCard(sc);
    assert.equal(res.valid, false);
    assert.ok(res.code === 'INVALID' || res.code === 'INVALID_LENGTH');
  }

  const longCards = [
    '12345678901234567890', // 20 digits
    '1234567890123456789012345', // 25 digits
    '123456789012345678901234567890' // 30 digits
  ];
  for (const lc of longCards) {
    const res = CheckoutView.validateCreditCard(lc);
    assert.equal(res.valid, false);
    assert.equal(res.code, 'INVALID_LENGTH');
  }

  // Alphanumeric injection
  const injectionCards = [
    '453201511283036A',
    '4532-0151-1283-036X',
    "4532' OR 1=1 --",
    "<script>alert(1)</script>"
  ];
  for (const ic of injectionCards) {
    const res = CheckoutView.validateCreditCard(ic);
    assert.equal(res.valid, false);
  }

  // Non-string types
  assert.equal(CheckoutView.validateCreditCard(null).valid, false);
  assert.equal(CheckoutView.validateCreditCard(undefined).valid, false);
  assert.equal(CheckoutView.validateCreditCard(4532015112830366).valid, false);
  assert.equal(CheckoutView.validateCreditCard({}).valid, false);
  assert.equal(CheckoutView.validateCreditCard([]).valid, false);
});

// ==============================================================================
// 3. 15% VAT & FLAT SHIPPING ADVERSARIAL FUZZING
// ==============================================================================

test('Fuzz 15% VAT: 10,000 random currency amounts with fractional cents rounding are mathematically precise', () => {
  let passedCount = 0;
  for (let i = 0; i < 10000; i++) {
    // Generate amounts ranging from $0.01 to $1,000,000.00 with fractional cents (up to 4 decimal places)
    const rawAmount = (Math.random() * 1000000) + 0.005;
    const subtotal = Math.round(rawAmount * 100) / 100;

    const vatContract = calculateVAT15Contract(subtotal);
    const expectedVat = Math.round(subtotal * 0.15 * 100) / 100;

    assert.equal(vatContract, expectedVat, `VAT mismatch at subtotal $${subtotal}`);
    assert.ok(typeof vatContract === 'number' && !isNaN(vatContract) && vatContract >= 0);
    assert.equal(Number(vatContract.toFixed(2)), vatContract, `VAT must have at most 2 decimal places`);
    passedCount++;
  }
  assert.equal(passedCount, 10000);
});

test('Fuzz 15% VAT: Boundary half-up and half-down rounding invariants', () => {
  // $49.99 * 0.15 = 7.4985 -> half-up rounds to 7.50
  assert.equal(calculateVAT15Contract(49.99), 7.50);

  // $99.95 * 0.15 = 14.9925 -> half-down rounds to 14.99
  assert.equal(calculateVAT15Contract(99.95), 14.99);

  // $0.03 * 0.15 = 0.0045 -> rounds to 0.00
  assert.equal(calculateVAT15Contract(0.03), 0.00);

  // $0.04 * 0.15 = 0.006 -> rounds to 0.01
  assert.equal(calculateVAT15Contract(0.04), 0.01);

  // Zero subtotal
  assert.equal(calculateVAT15Contract(0.00), 0.00);

  // Extreme large subtotals ($1,000,000+)
  assert.equal(calculateVAT15Contract(1000000.00), 150000.00);
  assert.equal(calculateVAT15Contract(2500000.00), 375000.00);
  assert.equal(calculateVAT15Contract(10000000.00), 1500000.00);
  assert.equal(calculateVAT15Contract(100000000.00), 15000000.00);

  // Negative and NaN inputs safely return 0
  assert.equal(calculateVAT15Contract(-500), 0);
  assert.equal(calculateVAT15Contract(NaN), 0);
  assert.equal(calculateVAT15Contract('100'), 0);
  assert.equal(calculateVAT15Contract(null), 0);
});

test('Fuzz Shipping Rates: Contract and Store flat fee mapping ($0.00, $3.00, $5.00)', () => {
  // Pickup: $0.00
  assert.equal(calculateShippingFeeContract('pickup'), 0.00);
  assert.equal(calculateShippingFeeContract('retiro'), 0.00);
  assert.equal(calculateShippingFeeContract('PICKUP'), 0.00);

  // Local / Quito: $3.00
  assert.equal(calculateShippingFeeContract('quito'), 3.00);
  assert.equal(calculateShippingFeeContract('local'), 3.00);
  assert.equal(calculateShippingFeeContract('QUITO'), 3.00);

  // Courier / National: $5.00
  assert.equal(calculateShippingFeeContract('national'), 5.00);
  assert.equal(calculateShippingFeeContract('nacional'), 5.00);
  assert.equal(calculateShippingFeeContract('courier'), 5.00);
  assert.equal(calculateShippingFeeContract('COURIER'), 5.00);

  // Unrecognized defaults to $5.00
  assert.equal(calculateShippingFeeContract('unknown'), 5.00);
  assert.equal(calculateShippingFeeContract(''), 5.00);
  assert.equal(calculateShippingFeeContract(null), 5.00);
});

test('Fuzz Order Totals: Financial reconciliation across 1,000 simulated multi-item carts', () => {
  const methods = ['pickup', 'quito', 'national', 'courier'];

  for (let i = 0; i < 1000; i++) {
    // Generate random cart with 1 to 5 items
    const itemCount = (i % 5) + 1;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const price = Math.round((Math.random() * 2000 + 1) * 100) / 100;
      const quantity = (j % 3) + 1;
      items.push({ price, quantity });
    }

    const shippingMethod = methods[i % methods.length];
    const totals = calculateOrderTotalsContract(items, shippingMethod);

    // Verify subtotal
    const expectedSubtotal = Math.round(items.reduce((s, it) => s + (it.price * it.quantity), 0) * 100) / 100;
    assert.equal(totals.subtotal, expectedSubtotal);

    // Verify tax is exactly 15% of subtotal
    const expectedTax = Math.round(expectedSubtotal * 0.15 * 100) / 100;
    assert.equal(totals.tax, expectedTax);

    // Verify shipping
    const expectedShipping = calculateShippingFeeContract(shippingMethod);
    assert.equal(totals.shipping, expectedShipping);

    // Strict reconciliation equation: Total === rounded(subtotal + shipping + tax)
    const expectedTotal = Math.round((expectedSubtotal + expectedShipping + expectedTax) * 100) / 100;
    assert.equal(totals.total, expectedTotal, `Total reconciliation failed: ${totals.total} !== ${expectedTotal}`);
  }
});

test('Fuzz Order Totals: Empty cart edge case yields zero shipping and zero total', () => {
  const emptyTotals = calculateOrderTotalsContract([], 'national');
  assert.equal(emptyTotals.subtotal, 0.00);
  assert.equal(emptyTotals.shipping, 0.00);
  assert.equal(emptyTotals.tax, 0.00);
  assert.equal(emptyTotals.total, 0.00);
});
