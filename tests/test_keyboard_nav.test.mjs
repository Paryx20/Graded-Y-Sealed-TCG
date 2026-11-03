/**
 * Test Suite: Navegación por teclado (objetivo 6)
 * File: tests/test_keyboard_nav.test.mjs
 *
 * Diálogos con trampa de foco, Esc y retorno del foco (js/app.js),
 * enlace "Saltar al contenido" y visor 3D girable con flechas (js/views/pdp.js).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = process.cwd();
const read = file => fs.readFileSync(path.join(rootDir, file), 'utf8');

// DOM mínimo: elementos enfocables que registran document.activeElement
function createDom() {
  const doc = { activeElement: null, referrer: '' };

  const makeClassList = () => ({
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    toggle(c, force) { (force ?? !this.classes.has(c)) ? this.classes.add(c) : this.classes.delete(c); },
    contains(c) { return this.classes.has(c); }
  });

  const el = (id, extra = {}) => {
    const node = {
      id,
      children: [],
      parent: null,
      dataset: {},
      attributes: new Map(),
      listeners: new Map(),
      classList: makeClassList(),
      isConnected: true,
      setAttribute(k, v) { this.attributes.set(k, String(v)); },
      getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; },
      hasAttribute(k) { return this.attributes.has(k); },
      removeAttribute(k) { this.attributes.delete(k); },
      addEventListener(type, fn) {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type).push(fn);
      },
      dispatch(type, event) { (this.listeners.get(type) || []).forEach(fn => fn(event)); },
      focus() { doc.activeElement = this; },
      contains(other) {
        for (let n = other; n; n = n.parent) if (n === this) return true;
        return false;
      },
      closest() { return null; },
      append(...kids) { kids.forEach(k => { k.parent = this; this.children.push(k); }); return this; },
      all() { return this.children.flatMap(c => [c, ...c.all()]); },
      querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
      querySelectorAll(sel) {
        const nodes = this.all();
        if (sel === 'h1') return nodes.filter(n => n.tag === 'h1');
        if (sel === 'button') return nodes.filter(n => n.tag === 'button');
        if (sel.startsWith('button[aria-label=')) {
          const label = sel.match(/"(.*)"/)[1];
          return nodes.filter(n => n.tag === 'button' && n.getAttribute('aria-label') === label);
        }
        if (sel === '[onclick]') return nodes.filter(n => n.hasAttribute('onclick'));
        if (sel.startsWith('.')) return nodes.filter(n => n.cls === sel.slice(1));
        // Selector de getFocusable
        return nodes.filter(n => n.tag === 'button' || n.tag === 'a');
      },
      ...extra
    };
    return node;
  };

  return { doc, el };
}

function setupApp() {
  const { doc, el } = createDom();
  const body = el('body');
  doc.body = body;
  doc.activeElement = body;

  const opener = el('opener', { tag: 'button' });
  const psaClose = el('psa-close', { tag: 'button' });
  psaClose.setAttribute('aria-label', 'Cerrar guía PSA');
  const psaOk = el('psa-ok', { tag: 'button' });
  const psaModal = el('psa-guide-modal').append(psaClose, psaOk);

  const delCancel = el('del-cancel', { tag: 'button' });
  const delConfirm = el('del-confirm', { tag: 'button' });
  const delModal = el('delete-confirm-modal').append(delCancel, delConfirm);

  const payContent = el('pay-content', { tag: 'div', cls: 'modal-content' });
  payContent.setAttribute('tabindex', '-1');
  const payModal = el('payment-modal').append(payContent);

  const heading = el('heading', { tag: 'h1' });
  const plusBtn = el('', { tag: 'button' });
  plusBtn.setAttribute('onclick', "app.updateCartQuantity('x', 1)");
  const main = el('app-view').append(heading, plusBtn);

  const skipLink = el('skip');
  const windowListeners = new Map();

  const elements = new Map([
    ['psa-guide-modal', psaModal],
    ['delete-confirm-modal', delModal],
    ['payment-modal', payModal],
    ['app-view', main]
  ]);

  Object.assign(doc, {
    getElementById: id => elements.get(id) || null,
    querySelector: sel => (sel === '.skip-link' ? skipLink : null),
    querySelectorAll: () => [],
    addEventListener: () => {}
  });

  const sandbox = {
    console, Math, Date, parseInt, URLSearchParams, URL, setTimeout, clearTimeout,
    document: doc,
    window: {
      addEventListener: (type, fn) => {
        if (!windowListeners.has(type)) windowListeners.set(type, []);
        windowListeners.get(type).push(fn);
      },
      location: { hash: '', search: '', origin: 'http://localhost' }
    },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    lucide: { createIcons: () => {} }
  };
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + '\n;this.PRODUCTS = PRODUCTS;', sandbox);
  vm.runInContext(read('js/state.js') + '\n;this.Store = Store;', sandbox);
  vm.runInContext(read('js/app.js') + '\n;this.app = app;', sandbox);

  const app = sandbox.app;
  // Solo se enlazan los listeners de teclado; init() completo necesita Supabase
  Object.assign(app, {
    updateNavbarUserUI() {}, updateCartBadge() {}, setupSearchSpotlight() {}, handleRoute() {}
  });
  sandbox.Store.loadCatalogFromServer = () => Promise.resolve(true);
  app.init();

  const keydown = (key, extra = {}) => {
    const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    (windowListeners.get('keydown') || []).forEach(fn => fn(event));
    return event;
  };

  return { app, doc, opener, psaModal, psaClose, psaOk, delModal, delCancel, payModal, payContent, heading, plusBtn, skipLink, keydown };
}

test('Diálogo PSA: al abrir enfoca "Cerrar" y Esc devuelve el foco al botón que lo abrió', () => {
  const { app, doc, opener, psaModal, psaClose, keydown } = setupApp();
  opener.focus();
  app.openPSAGuideModal();
  assert.equal(doc.activeElement, psaClose);
  assert.equal(psaModal.getAttribute('aria-hidden'), 'false');

  keydown('Escape');
  assert.equal(psaModal.classList.contains('active'), false);
  assert.equal(doc.activeElement, opener);
});

test('Trampa de foco: Tab en el último control vuelve al primero y Shift+Tab al revés', () => {
  const { app, doc, opener, psaClose, psaOk, keydown } = setupApp();
  opener.focus();
  app.openPSAGuideModal();

  psaOk.focus();
  const forward = keydown('Tab');
  assert.equal(forward.defaultPrevented, true);
  assert.equal(doc.activeElement, psaClose);

  const back = keydown('Tab', { shiftKey: true });
  assert.equal(back.defaultPrevented, true);
  assert.equal(doc.activeElement, psaOk);
});

test('Trampa de foco: si el foco escapó del diálogo, Tab lo regresa adentro', () => {
  const { app, doc, opener, psaClose, keydown } = setupApp();
  opener.focus();
  app.openPSAGuideModal();
  opener.focus();
  keydown('Tab');
  assert.equal(doc.activeElement, psaClose);
});

test('Eliminar del carrito: el diálogo enfoca "Cancelar" y Esc lo cierra devolviendo el foco', () => {
  const { app, doc, opener, delModal, delCancel, keydown } = setupApp();
  // "opener" hace de botón "Eliminar" del ítem
  opener.focus();
  app.openDialog('delete-confirm-modal');
  assert.equal(doc.activeElement, delCancel);

  keydown('Escape');
  assert.equal(delModal.classList.contains('active'), false);
  assert.equal(doc.activeElement, opener);
});

test('Esc con dos diálogos abiertos cierra solo el superior', () => {
  const { app, psaModal, delModal, keydown } = setupApp();
  app.openPSAGuideModal();
  app.openDialog('delete-confirm-modal');
  keydown('Escape');
  assert.equal(delModal.classList.contains('active'), false);
  assert.equal(psaModal.classList.contains('active'), true);
  keydown('Escape');
  assert.equal(psaModal.classList.contains('active'), false);
});

test('Pago en curso: el diálogo bloqueado no se cierra con Esc y Tab no sale de él', () => {
  const { app, doc, payModal, payContent, keydown } = setupApp();
  payModal.dataset.locked = '1';
  app.openDialog('payment-modal', '.modal-content');
  assert.equal(doc.activeElement, payContent);

  keydown('Escape');
  assert.equal(payModal.classList.contains('active'), true);
  const tab = keydown('Tab');
  assert.equal(tab.defaultPrevented, true);
  assert.equal(doc.activeElement, payContent);

  delete payModal.dataset.locked;
  app.closeDialog('payment-modal');
  assert.equal(payModal.classList.contains('active'), false);
  assert.equal(doc.body.classList.contains('overflow-hidden'), false);
});

test('Saltar al contenido: no navega y enfoca el h1 de la vista', () => {
  const { doc, heading, skipLink } = setupApp();
  const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  skipLink.dispatch('click', event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(doc.activeElement, heading);
  assert.equal(heading.getAttribute('tabindex'), '-1');
});

test('Re-render: el foco vuelve al control con el mismo onclick, o al h1 si ya no existe', () => {
  const { app, doc, plusBtn, heading } = setupApp();
  plusBtn.focus();
  const key = app.getFocusKey(doc.getElementById('app-view'));
  assert.deepEqual({ ...key }, { onclick: "app.updateCartQuantity('x', 1)" });

  doc.activeElement = doc.body;
  app.restoreFocus(key);
  assert.equal(doc.activeElement, plusBtn);

  app.restoreFocus({ onclick: "app.updateCartQuantity('borrado', 1)" });
  assert.equal(doc.activeElement, heading);
});

function setupPDP() {
  const sandbox = {
    console, Math, Date, parseInt,
    document: { getElementById: id => (id === 'pdp-3d-object' ? { style: {} } : null) },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    app: { renderCurrentView() {}, showToast() {}, refreshIcons() {} }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('js/data.js') + '\n;this.PRODUCTS = PRODUCTS;', sandbox);
  vm.runInContext(read('js/state.js') + '\n;this.Store = Store;', sandbox);
  vm.runInContext(read('js/views/pdp.js') + '\n;this.PDPView = PDPView;', sandbox);
  const PDPView = sandbox.PDPView;
  PDPView._card3D = { mode: 'front', rotX: 0, rotY: 0 };
  return PDPView;
}

const key = k => ({ key: k, prevented: false, preventDefault() { this.prevented = true; } });

test('Visor 3D: flechas izquierda/derecha giran en Y y evitan el scroll', () => {
  const PDPView = setupPDP();
  const right = key('ArrowRight');
  PDPView.handleCard3DKey(right);
  assert.equal(PDPView._card3D.rotY, 15);
  assert.equal(right.prevented, true);
  PDPView.handleCard3DKey(key('ArrowLeft'));
  PDPView.handleCard3DKey(key('ArrowLeft'));
  assert.equal(PDPView._card3D.rotY, -15);
});

test('Visor 3D: flechas arriba/abajo inclinan en X con límite de ±40°', () => {
  const PDPView = setupPDP();
  PDPView.handleCard3DKey(key('ArrowUp'));
  assert.equal(PDPView._card3D.rotX, -10);
  for (let i = 0; i < 10; i++) PDPView.handleCard3DKey(key('ArrowDown'));
  assert.equal(PDPView._card3D.rotX, 40);
});

test('Visor 3D: Inicio restablece la posición y otras teclas no se interceptan', () => {
  const PDPView = setupPDP();
  PDPView.handleCard3DKey(key('ArrowRight'));
  PDPView.handleCard3DKey(key('ArrowUp'));
  PDPView.handleCard3DKey(key('Home'));
  assert.equal(PDPView._card3D.rotX, 0);
  assert.equal(PDPView._card3D.rotY, 0);

  const tab = key('Tab');
  PDPView.handleCard3DKey(tab);
  assert.equal(tab.prevented, false, 'Tab debe seguir moviendo el foco fuera del visor');
});

test('Visor 3D: la escena es enfocable y describe sus controles de teclado', () => {
  const pdp = read('js/views/pdp.js');
  assert.match(pdp, /id="pdp-3d-scene"\s+tabindex="0"/);
  assert.match(pdp, /aria-label="Carta en 3D\. Usa las flechas/);
});

test('Modales cerrados quedan fuera del orden de Tab (visibility: hidden)', () => {
  const css = read('css/styles.css');
  assert.match(css, /\.modal-backdrop \{[^}]*visibility: hidden/);
  assert.match(css, /\.modal-backdrop\.active \{[^}]*visibility: visible/);
});
