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
    setTimeout,
    clearTimeout,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    lucide: { createIcons: () => {} }
  };
  context.globalThis = context;
  vm.createContext(context);

  // Load production modules in dependency order
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/data.js'), 'utf8') + '\n; globalThis.APP_CONFIG = APP_CONFIG; globalThis.PRODUCTS = PRODUCTS;', context);
  win.APP_CONFIG = context.APP_CONFIG;
  win.setTimeout = setTimeout;
  win.clearTimeout = clearTimeout;
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/state.js'), 'utf8') + '\n; globalThis.Store = Store;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/profile.js'), 'utf8') + '\n; globalThis.ProfileView = ProfileView;', context);
  vm.runInContext(fs.readFileSync(path.join(rootDir, 'js/views/checkout.js'), 'utf8') + '\n; globalThis.CheckoutView = CheckoutView;', context);
  context.HomeView = { render: () => '<div id="home-view">Home</div>' };
  context.CatalogView = { render: () => '<div id="catalog-view">Catalog</div>' };
  context.CartView = { render: () => '<div id="cart-view">Cart</div>' };
  context.TrackingView = { render: () => '<div id="tracking-view">Tracking</div>' };
  context.PDPView = { render: () => '<div id="pdp-view">PDP</div>', afterRender: () => {} };
  win.HomeView = context.HomeView;
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
  const { app, doc, elementsById, win, context } = createGoogleAuthSandbox();
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
  context.APP_CONFIG.GOOGLE_CLIENT_ID = '1234567890-testclient.apps.googleusercontent.com';
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
