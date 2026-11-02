import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const rootDir = process.cwd();

// 1. Verify R1 & R2
const pdpCode = fs.readFileSync(path.join(rootDir, 'js/views/pdp.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8');
const stateCode = fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8');

const ctx = {
  console,
  Math,
  Date,
  parseInt,
  window: {},
  document: {
    getElementById: () => null,
    querySelector: () => null
  }
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(dataCode + '\n; globalThis.PRODUCTS = PRODUCTS; globalThis.APP_CONFIG = APP_CONFIG;', ctx);
vm.runInContext(stateCode + '\n; globalThis.Store = Store;', ctx);
vm.runInContext(pdpCode + '\n; globalThis.PDPView = PDPView;', ctx);

ctx.Store.data.currentPdpProduct = ctx.PRODUCTS[0];
const pdpHtml = ctx.PDPView.render();

console.log('=== R1 & R2 VERIFICATION ===');
assert.equal(pdpHtml.includes('pdp-chart-container'), false, 'pdp-chart-container must NOT exist');
assert.equal(pdpHtml.includes('pdp-interactive-chart'), false, 'pdp-interactive-chart must NOT exist');
assert.equal(pdpHtml.includes('Historial de Mercado Actual'), false, 'Historial de Mercado must NOT exist');
assert.equal(pdpHtml.includes('id="pdp-price"'), true, 'id="pdp-price" MUST exist');
console.log('PASS: R2 chart removed, price visible');

console.log('=== R3 VERIFICATION ===');
assert.equal(pdpHtml.includes('centering-grid-overlay'), false, 'centering-grid-overlay must NOT exist');
assert.equal(pdpHtml.includes('EJE X'), false, 'EJE X must NOT exist');
assert.equal(pdpHtml.includes('EJE Y'), false, 'EJE Y must NOT exist');
assert.equal(pdpHtml.includes('img/cards/card-back.png'), true, 'card-back.png MUST be rendered');

const stylesCss = fs.readFileSync(path.join(rootDir, 'css/styles.css'), 'utf8');
assert.ok(stylesCss.includes('.centering-grid-overlay {'), 'styles.css must have .centering-grid-overlay rule');
assert.ok(stylesCss.includes('display: none !important;'), 'styles.css must hide centering-grid-overlay');
console.log('PASS: R3 clean card back, grid hidden');

console.log('=== R4 VERIFICATION ===');
const srvCode = fs.readFileSync(path.join(rootDir, 'js/views/search-results.js'), 'utf8');
vm.runInContext(srvCode + '\n; globalThis.SearchResultsView = SearchResultsView;', ctx);

const blaineCard = {
  id: 'gym2-2',
  nombre: "Blaine's Charizard",
  set: 'Gym Challenge',
  rareza: 'Holo Rare',
  precioEstimado: 174.53
};

const searchHtml = ctx.SearchResultsView.renderResultsGrid([blaineCard], "Blaine's Charizard");
assert.ok(searchHtml.includes("SearchResultsView.handleCardAction('gym2-2')"), 'handleCardAction with gym2-2 must be called');
assert.ok(!searchHtml.includes("openQuoteModal('Blaine's"), 'No syntax error apostrophe');
console.log('PASS: R4 safe action navigation without apostrophe syntax errors');

console.log('=== R5 VERIFICATION ===');
const trackingCode = fs.readFileSync(path.join(rootDir, 'js/views/tracking.js'), 'utf8');
vm.runInContext(trackingCode + '\n; globalThis.TrackingView = TrackingView;', ctx);
const trackingHtml = ctx.TrackingView.render();

assert.ok(trackingHtml.includes('#GS-2026-9481'), 'Must include simulated order #GS-2026-9481');
assert.ok(trackingHtml.includes('GUI-EC-948102-PSA'), 'Must include simulated tracking number GUI-EC-948102-PSA');
assert.ok(trackingHtml.includes('Servientrega Blindado • Bóveda G&S'), 'Must include courier');
assert.ok(trackingHtml.includes('Autenticación PSA'), 'Must include active stage Autenticación PSA');
assert.ok(!trackingHtml.includes('Avanzar etapa'), 'Must NOT have manual controls');
assert.ok(!trackingHtml.includes('Simular paso'), 'Must NOT have simulation control buttons');
console.log('PASS: R5 preloaded active tracking simulation with zero manual controls');

console.log('=== R6 VERIFICATION ===');
const profileCode = fs.readFileSync(path.join(rootDir, 'js/views/profile.js'), 'utf8');
vm.runInContext(profileCode + '\n; globalThis.ProfileView = ProfileView;', ctx);
ctx.Store.data.currentUser = null;
const guestProfileHtml = ctx.ProfileView.render();

assert.ok(!guestProfileHtml.includes('1710034065'), 'Must NOT include hardcoded mock ID');
assert.ok(!guestProfileHtml.includes('0991234567'), 'Must NOT include hardcoded mock phone');
assert.ok(!guestProfileHtml.includes('Av. República del Salvador'), 'Must NOT include hardcoded mock address');
assert.ok(guestProfileHtml.includes('id="google-signin-container"'), 'Must have Google Sign-In container');
console.log('PASS: R6 mock data eliminated and Google Sign-In container present');

console.log('\nALL 6 REQUIREMENTS VERIFIED INDEPENDENTLY WITH ZERO ERRORS.');
