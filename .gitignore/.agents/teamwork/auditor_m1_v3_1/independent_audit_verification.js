// Independent Forensic Auditor Empirical Verification Script
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '../../..');

console.log('================================================================');
console.log('FORENSIC AUDITOR INDEPENDENT EMPIRICAL INTEGRITY CHECK');
console.log('================================================================');

// 1. Check Condition Checkmark Mutual Exclusivity
console.log('\n[CHECK 1] PDP Condition Checkmarks Mutual Exclusivity');
{
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');

  let iconsInButtons = [[], [], [], []];
  const keys = ['raw', 'psa8', 'psa9', 'psa10'];

  const radiogroup = {
    querySelectorAll: (sel) => {
      return [0, 1, 2, 3].map(i => {
        const btnObj = {
          className: '',
          querySelector: (s) => {
            if (s === 'div:first-child') {
              return {
                className: '',
                children: iconsInButtons[i],
                querySelectorAll: (q) => [...iconsInButtons[i]],
                querySelector: (q) => iconsInButtons[i][0] || null,
                insertAdjacentHTML: (pos, html) => {
                  if (html.includes('data-lucide="check"')) {
                    const icon = {
                      tagName: 'I',
                      attr: 'check',
                      remove() {
                        const idx = iconsInButtons[i].indexOf(this);
                        if (idx !== -1) iconsInButtons[i].splice(idx, 1);
                      }
                    };
                    iconsInButtons[i].push(icon);
                  }
                }
              };
            }
            if (s === 'div:last-child') return { className: '' };
            return null;
          }
        };
        return btnObj;
      });
    }
  };

  const sandbox = {
    console, Math, Date, parseInt, parseFloat,
    document: {
      getElementById: (id) => ({ innerText: '', setAttribute: () => {} }),
      querySelector: (sel) => sel.includes('radiogroup') ? radiogroup : null
    },
    lucide: {
      createIcons: () => {
        // transform I to SVG
        for (let i = 0; i < 4; i++) {
          iconsInButtons[i] = iconsInButtons[i].map(icon => ({
            tagName: 'SVG',
            className: 'lucide lucide-check',
            attr: 'check',
            remove() {
              const idx = iconsInButtons[i].indexOf(this);
              if (idx !== -1) iconsInButtons[i].splice(idx, 1);
            }
          }));
        }
      }
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    app: { showToast: () => {}, renderCurrentView: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '; this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '; this.PDPView = PDPView;', sandbox);

  // Switch sequentially across 100 iterations
  for (let iter = 0; iter < 100; iter++) {
    const k = keys[iter % keys.length];
    sandbox.PDPView.selectCondition(k);
    const activeIdx = keys.indexOf(k);
    for (let i = 0; i < 4; i++) {
      if (i === activeIdx) {
        assert.strictEqual(iconsInButtons[i].length, 1, `Expected 1 icon on active button ${k}`);
      } else {
        assert.strictEqual(iconsInButtons[i].length, 0, `Expected 0 icons on inactive button ${keys[i]}`);
      }
    }
  }
  console.log('  -> PASS: Verified strict mutual exclusivity of checkmarks across 100 sequential/cyclic switches with Lucide SVG transformation.');
}

// 2. Check 12-Month Market Chart Removal & Price Clarity
console.log('\n[CHECK 2] PDP 12-Month Market Chart Removal & Price Clarity');
{
  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');

  const sandbox = {
    console, Math, Date, parseInt, parseFloat,
    document: { getElementById: () => null },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '; this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '; this.PDPView = PDPView;', sandbox);

  const html = sandbox.PDPView.render();
  assert.strictEqual(html.includes('id="pdp-interactive-chart"'), false, 'pdp-interactive-chart must be eliminated');
  assert.strictEqual(html.includes('Historial de Mercado Actual'), false, 'Market history title must be eliminated');
  assert.strictEqual(html.includes('id="pdp-chart-container"'), false, 'pdp-chart-container must be eliminated');
  assert.strictEqual(html.includes('id="pdp-price"'), true, 'pdp-price must be prominently displayed');
  console.log('  -> PASS: 12-month market chart and history box are completely eliminated; #pdp-price is prominently rendered.');
}

// 3. Check 3D Viewer Reverse Face Cleanliness
console.log('\n[CHECK 3] 3D Viewer Reverse Face Cleanliness');
{
  const pdpCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/pdp.js'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'css/styles.css'), 'utf8');
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');

  const sandbox = {
    console, Math, Date, parseInt, parseFloat,
    document: { getElementById: () => null },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '; this.Store = Store;', sandbox);
  vm.runInContext(pdpCode + '; this.PDPView = PDPView;', sandbox);

  const product = sandbox.PRODUCTS[0];
  const backHtml = sandbox.PDPView.renderInspectorStage(product, 'psa10', 'back');
  assert.strictEqual(backHtml.includes('centering-grid-overlay'), false, 'centering-grid-overlay must not exist in back stage');
  assert.strictEqual(backHtml.includes('EJE X'), false, 'EJE X label must not exist');
  assert.strictEqual(backHtml.includes('EJE Y'), false, 'EJE Y label must not exist');
  assert.strictEqual(backHtml.includes('50.0%'), false, '50.0% coordinate text must not exist');
  assert.strictEqual(backHtml.includes('BORDES OK'), false, 'BORDES OK must not exist');
  assert.strictEqual(backHtml.includes('src="img/cards/card-back.png"'), true, 'Must display authentic card back image');

  // Verify CSS fallback suppression
  assert.strictEqual(stylesCss.includes('.centering-grid-overlay {\n  display: none !important;\n}'), true, 'CSS must enforce display: none !important');
  // Verify physical image file
  const cardBackPath = path.join(ROOT_DIR, 'img/cards/card-back.png');
  assert.strictEqual(fs.existsSync(cardBackPath), true, 'Physical asset card-back.png exists');
  assert.ok(fs.statSync(cardBackPath).size > 100000, 'Physical asset card-back.png is non-empty high-res');
  console.log('  -> PASS: 3D viewer reverse face contains solely clean card back artwork without grid lines or coordinate labels.');
}

// 4. Check API Search Action Navigation and Apostrophe Handling
console.log('\n[CHECK 4] API Search Action Navigation & Apostrophe Handling');
{
  const searchCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/search-results.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');

  let registeredCard = null;
  let openedProductPdpId = null;

  const sandbox = {
    console, Math, Date, parseInt, parseFloat,
    Store: {
      data: { apiCardsCache: {} },
      registerApiCard: (c) => { registeredCard = c; }
    },
    app: {
      openProductPDP: (id) => { openedProductPdpId = id; }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(searchCode + '; this.SearchResultsView = SearchResultsView;', sandbox);

  const testCardWithApostrophe = {
    id: 'gym2-2',
    nombre: "Blaine's Charizard",
    set: 'Gym Challenge',
    rareza: 'Holo Rare',
    imagen: 'https://images.pokemontcg.io/gym2/2.png',
    precioEstimado: 174.53
  };

  sandbox.SearchResultsView.results = [testCardWithApostrophe];
  const gridHtml = sandbox.SearchResultsView.renderResultsGrid([testCardWithApostrophe], "Blaine's Charizard");

  // Check that the onclick does not interpolate raw unescaped string causing SyntaxError
  assert.strictEqual(gridHtml.includes("SearchResultsView.handleCardAction('gym2-2')"), true, 'Must call handleCardAction with clean cardId');
  assert.strictEqual(gridHtml.includes("openQuoteModal('Blaine's"), false, 'Must not contain broken apostrophe syntax in JS handler');

  // Trigger handleCardAction
  sandbox.SearchResultsView.handleCardAction('gym2-2');
  assert.strictEqual(registeredCard.id, 'gym2-2');
  assert.strictEqual(openedProductPdpId, 'gym2-2');
  console.log('  -> PASS: API Search results handle cards with apostrophes cleanly and route to PDP.');
}

// 5. Check Preloaded Live Tracking Simulation & Zero Manual Controls
console.log('\n[CHECK 5] Preloaded Live Tracking Simulation & Zero Manual Controls');
{
  const trackingCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/tracking.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');

  const sandbox = {
    console, Math, Date, parseInt, parseFloat,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '; this.Store = Store;', sandbox);
  vm.runInContext(trackingCode + '; this.TrackingView = TrackingView;', sandbox);

  // Fresh session with no prior orders
  sandbox.Store.data.orders = [];
  const trackingHtml = sandbox.TrackingView.render();

  assert.strictEqual(trackingHtml.includes('No tienes pedidos activos en curso'), false, 'Empty order placeholder must be eliminated');
  assert.strictEqual(trackingHtml.includes('Avanzar paso'), false, 'Must not contain manual advance button');
  assert.strictEqual(trackingHtml.includes('Simular despacho'), false, 'Must not contain manual simulate button');
  assert.strictEqual(trackingHtml.includes('ORDEN #GS-2026-9481'), true, 'Must display simulated order ID #GS-2026-9481');
  assert.strictEqual(trackingHtml.includes('GUI-EC-948102-PSA'), true, 'Must display tracking guide GUI-EC-948102-PSA');
  assert.strictEqual(trackingHtml.includes('Servientrega Blindado'), true, 'Must display courier name');
  assert.strictEqual(trackingHtml.includes('Autenticación PSA'), true, 'Must render active custody milestone');
  console.log('  -> PASS: Live tracking simulation is active by default with zero manual simulation controls.');
}

// 6. Check Google Identity Services Integration, JWT Decoding & Mock Data Elimination
console.log('\n[CHECK 6] Google OAuth 2.0 Integration & Dynamic Profile');
{
  const profileCode = fs.readFileSync(path.join(ROOT_DIR, 'js/views/profile.js'), 'utf8');
  const appCode = fs.readFileSync(path.join(ROOT_DIR, 'js/app.js'), 'utf8');
  const stateCode = fs.readFileSync(path.join(ROOT_DIR, 'js/state.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(ROOT_DIR, 'js/data.js'), 'utf8');

  const sandbox = {
    console, Math, Date, parseInt, parseFloat, JSON, Buffer, setTimeout, clearTimeout,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    document: {
      getElementById: (id) => ({ innerHTML: '', innerText: '', classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }),
      querySelector: () => null,
      createElement: () => ({ setAttribute: () => {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }),
      addEventListener: () => {}
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    lucide: { createIcons: () => {} },
    HomeView: { render: () => '<div>Home</div>' },
    location: { hash: '#profile' }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(dataCode + '; this.PRODUCTS = PRODUCTS; this.APP_CONFIG = APP_CONFIG;', sandbox);
  vm.runInContext(stateCode + '; this.Store = Store;', sandbox);
  vm.runInContext(profileCode + '; this.ProfileView = ProfileView;', sandbox);
  vm.runInContext(appCode + '; this.app = app;', sandbox);

  // Unauthenticated guest profile
  sandbox.Store.data.currentUser = null;
  const guestHtml = sandbox.ProfileView.render();
  assert.strictEqual(guestHtml.includes('1710034065'), false, 'No hardcoded cédula 1710034065');
  assert.strictEqual(guestHtml.includes('0991234567'), false, 'No hardcoded phone 0991234567');
  assert.strictEqual(guestHtml.includes('Av. República del Salvador'), false, 'No hardcoded address');
  assert.strictEqual(guestHtml.includes('id="google-signin-container"'), true, 'Renders google sign in container');

  // Pure JS JWT decoding
  const testPayload = {
    sub: 'google-test-id-12345',
    name: 'Patricio Córdova',
    email: 'patricio@bovedatcg.ec',
    picture: 'https://lh3.googleusercontent.com/test-pic'
  };
  const b64 = Buffer.from(JSON.stringify(testPayload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const syntheticJwt = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${b64}.signature`;

  const decoded = sandbox.app.decodeJwtResponse(syntheticJwt);
  assert.strictEqual(decoded.sub, 'google-test-id-12345');
  assert.strictEqual(decoded.name, 'Patricio Córdova');
  assert.strictEqual(decoded.email, 'patricio@bovedatcg.ec');

  // Handle credential response
  sandbox.app.handleGoogleCredentialResponse({ credential: syntheticJwt });
  assert.strictEqual(sandbox.Store.data.currentUser.name, 'Patricio Córdova');
  assert.strictEqual(sandbox.Store.data.currentUser.authProvider, 'google');
  assert.strictEqual(sandbox.Store.data.currentUser.idCard, '');
  assert.strictEqual(sandbox.Store.data.currentUser.address, '');

  // Sign out
  sandbox.app.logoutUser();
  assert.strictEqual(sandbox.Store.data.currentUser, null, 'User must be null after logout');

  console.log('  -> PASS: Mock data eliminated; GIS JWT decoding and dynamic user profile authenticate and sign out cleanly.');
}

console.log('\n================================================================');
console.log('ALL FORENSIC CHECKS PASSED: 100% CLEAN');
console.log('================================================================\n');
