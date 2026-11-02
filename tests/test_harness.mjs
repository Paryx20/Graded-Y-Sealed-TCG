/**
 * ==============================================================================
 * Test Harness & Simulation Environment for Graded & Sealed TCG E-commerce
 * File: tests/test_harness.mjs
 * Description: Lightweight, zero-dependency Node.js v24 test harness providing:
 *              1. DOM & Web Storage environment emulation.
 *              2. Authoritative specification contract oracles (Module 10, Luhn, VAT, etc.)
 *              3. Dexie.js ACID mock persistence engine for 'usuarios' & 'ordenes_compra'.
 *              4. 3-Tier Search Failover simulation engine with 400ms debounce.
 *              5. Singleton Toast notification manager with 2500ms timer emulation.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * -----------------------------------------------------------------------------
 * 1. MOCK DOM & WEB API ENVIRONMENT
 * -----------------------------------------------------------------------------
 */
export class MockDOMElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = new MockClassList(className);
    this.attributes = new Map();
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.parentNode = null;
    this._innerHTML = '';
    this._innerText = '';
    this.value = '';
    this.checked = false;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
  }

  get innerText() {
    return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim();
  }

  set innerText(val) {
    this._innerText = String(val);
  }

  setAttribute(name, val) {
    this.attributes.set(name, String(val));
    if (name === 'id') this.id = String(val);
    if (name === 'class') {
      this.className = String(val);
      this.classList = new MockClassList(this.className);
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  querySelector(selector) {
    const sel = selector.trim();
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  querySelectorAll(selector) {
    const results = [];
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.classList.contains(cls)) results.push(this);
    }
    for (const child of this.children) {
      results.push(...child.querySelectorAll(selector));
    }
    return results;
  }
}

class MockClassList {
  constructor(initial = '') {
    this._classes = new Set(initial.split(/\s+/).filter(Boolean));
  }

  add(...classes) {
    for (const c of classes) {
      if (c) this._classes.add(c);
    }
  }

  remove(...classes) {
    for (const c of classes) {
      this._classes.delete(c);
    }
  }

  toggle(cls, force) {
    if (force !== undefined) {
      if (force) this.add(cls);
      else this.remove(cls);
      return force;
    }
    if (this._classes.has(cls)) {
      this.remove(cls);
      return false;
    } else {
      this.add(cls);
      return true;
    }
  }

  contains(cls) {
    return this._classes.has(cls);
  }

  toString() {
    return Array.from(this._classes).join(' ');
  }
}

export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }
}

export function createMockEnvironment() {
  const elementsById = new Map();
  const root = new MockDOMElement('html');
  const body = new MockDOMElement('body');
  root.appendChild(body);

  const toastContainer = new MockDOMElement('div', 'toast-container');
  body.appendChild(toastContainer);
  elementsById.set('toast-container', toastContainer);

  const appView = new MockDOMElement('main', 'app-view');
  body.appendChild(appView);
  elementsById.set('app-view', appView);

  const cartBadge = new MockDOMElement('span', 'cart-badge');
  body.appendChild(cartBadge);
  elementsById.set('cart-badge', cartBadge);

  const psaModal = new MockDOMElement('div', 'psa-guide-modal');
  body.appendChild(psaModal);
  elementsById.set('psa-guide-modal', psaModal);

  const delModal = new MockDOMElement('div', 'delete-confirm-modal');
  const delName = new MockDOMElement('p', 'delete-confirm-item-name');
  delModal.appendChild(delName);
  body.appendChild(delModal);
  elementsById.set('delete-confirm-modal', delModal);
  elementsById.set('delete-confirm-item-name', delName);

  const undoBanner = new MockDOMElement('div', 'undo-banner');
  const undoText = new MockDOMElement('span', 'undo-text');
  undoBanner.appendChild(undoText);
  body.appendChild(undoBanner);
  elementsById.set('undo-banner', undoBanner);
  elementsById.set('undo-text', undoText);

  const localStorage = new MockLocalStorage();

  const doc = {
    readyState: 'complete',
    body,
    createElement(tag) {
      return new MockDOMElement(tag);
    },
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    registerElement(id, el) {
      elementsById.set(id, el);
    },
    querySelector(selector) {
      if (selector.startsWith('#')) return elementsById.get(selector.slice(1)) || null;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {}
  };

  const win = {
    location: {
      hash: '#home',
      href: 'http://localhost/#home'
    },
    scrollTo() {},
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame(cb) {
      return setTimeout(cb, 0);
    },
    cancelAnimationFrame(id) {
      clearTimeout(id);
    },
    localStorage,
    document: doc,
    lucide: {
      createIcons() {}
    }
  };

  return { win, doc, localStorage, elementsById };
}

/**
 * -----------------------------------------------------------------------------
 * 2. AUTHORITATIVE SPECIFICATION ORACLES (Module 10, Luhn, VAT, Shipping)
 * -----------------------------------------------------------------------------
 */

/**
 * Ecuadorian Cédula (10 digits) & Natural RUC (13 digits ending in '001') Module 10 Algorithm
 */
export function validateEcuadorianIdContract(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Strictly digits only: if there are non-digit characters, reject immediately
  if (!/^\d+$/.test(trimmed)) return false;

  let base10 = '';
  if (trimmed.length === 10) {
    base10 = trimmed;
  } else if (trimmed.length === 13) {
    if (!trimmed.endsWith('001')) return false;
    base10 = trimmed.substring(0, 10);
  } else {
    return false;
  }

  const provincia = parseInt(base10.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(base10.charAt(2), 10);
  if (tercerDigito >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(base10.charAt(i), 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const residuo = suma % 10;
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
  const digitoValidar = parseInt(base10.charAt(9), 10);

  return digitoVerificador === digitoValidar;
}

/**
 * Credit Card Luhn Algorithm
 */
export function validateLuhnContract(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return false;
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let alternate = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let n = parseInt(clean.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Simulated Bank Decline Check: Card ending in '0000' triggers #DECLINED-SEC-054
 */
export function checkSimulatedDeclineContract(cardNumber) {
  if (!cardNumber || typeof cardNumber !== 'string') return { approved: false, error: 'INVALID_INPUT' };
  const clean = cardNumber.replace(/\D/g, '');
  if (!validateLuhnContract(clean)) {
    return { approved: false, error: 'INVALID_LUHN' };
  }
  if (clean.endsWith('0000')) {
    return {
      approved: false,
      code: '#DECLINED-SEC-054',
      message: 'Transacción denegada por el banco emisor (Límites o 3D Secure)'
    };
  }
  return { approved: true, code: '00-APPROVED' };
}

/**
 * Ecuadorian Phone Validation (+593 followed by 9 digits)
 */
export function validateEcuadorianPhoneContract(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  // Match prefix +593 with or without spaces/dashes, followed by 9 digits (usually starts with 9 for mobile)
  const regex = /^\+593[\s-]?[0-9]{9}$/;
  return regex.test(trimmed);
}

/**
 * 15% VAT Calculation with exact half-up rounding
 */
export function calculateVAT15Contract(subtotal) {
  if (typeof subtotal !== 'number' || isNaN(subtotal) || subtotal < 0) return 0;
  return Math.round(subtotal * 0.15 * 100) / 100;
}

/**
 * Flat Shipping Rates Contract:
 * - 'pickup' -> $0.00
 * - 'quito' -> $3.00
 * - 'national' / 'courier' -> $5.00
 */
export function calculateShippingFeeContract(method) {
  const normalized = (method || '').toLowerCase();
  if (normalized === 'pickup' || normalized === 'retiro') return 0.00;
  if (normalized === 'quito' || normalized === 'local') return 3.00;
  if (normalized === 'national' || normalized === 'nacional' || normalized === 'courier') return 5.00;
  return 5.00; // default courier
}

/**
 * Complete Order Financial Breakdown Contract
 */
export function calculateOrderTotalsContract(cartItems, shippingMethod) {
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const shipping = cartItems.length > 0 ? calculateShippingFeeContract(shippingMethod) : 0;
  const tax = calculateVAT15Contract(roundedSubtotal);
  const total = Math.round((roundedSubtotal + shipping + tax) * 100) / 100;
  return { subtotal: roundedSubtotal, shipping, tax, total };
}

/**
 * -----------------------------------------------------------------------------
 * 3. SINGLETON TOAST NOTIFICATION MANAGER
 * -----------------------------------------------------------------------------
 */
export class SingletonToastManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentToast = null;
    this.currentTimer = null;
    this.autoDismissMs = 2500; // exactly 2.5s per specification
  }

  showToast(message, type = 'info', onDismiss) {
    // 1. Singleton enforcement: remove prior active toast immediately
    if (this.currentToast) {
      if (this.currentTimer) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
      this.currentToast.remove();
      this.currentToast = null;
    }

    // 2. Create new toast
    const toast = new MockDOMElement('div', '', 'toast-item');
    toast.setAttribute('data-type', type);
    toast.innerText = message;
    this.container.appendChild(toast);
    this.currentToast = toast;

    // 3. Set exact 2.5s timer
    this.currentTimer = setTimeout(() => {
      this.dismissToast(toast, onDismiss);
    }, this.autoDismissMs);

    return toast;
  }

  dismissToast(toast, onDismiss) {
    if (this.currentToast === toast) {
      this.currentToast.remove();
      this.currentToast = null;
      if (this.currentTimer) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
      if (typeof onDismiss === 'function') onDismiss();
    }
  }

  getActiveToastCount() {
    return this.container.children.length;
  }
}

/**
 * -----------------------------------------------------------------------------
 * 4. QUANTITY STEPPER CONTRACT
 * -----------------------------------------------------------------------------
 */
export class QuantityStepper {
  constructor(initial = 1, min = 1, max = 10) {
    this.quantity = Math.max(min, initial);
    this.min = min;
    this.max = max;
  }

  updateQuantity(delta) {
    const next = this.quantity + delta;
    if (next < this.min) return this.quantity; // Enforce lower bound of 1
    if (next > this.max) return this.quantity;
    this.quantity = next;
    return this.quantity;
  }

  setQuantity(val) {
    if (val < this.min) {
      this.quantity = this.min;
    } else if (val > this.max) {
      this.quantity = this.max;
    } else {
      this.quantity = val;
    }
    return this.quantity;
  }
}

/**
 * -----------------------------------------------------------------------------
 * 5. DUAL SEARCH API WITH AUTOMATIC FAILOVER CASCADE (3-Tier)
 * -----------------------------------------------------------------------------
 */
export class SearchFailoverEngine {
  constructor(localCatalog = []) {
    this.localCatalog = localCatalog;
    this.primaryUrl = 'https://api.pokemontcg.io/v2/cards';
    this.secondaryUrl = 'https://api.tcgdex.net/v2/en/cards';
    this.debounceMs = 400; // 400ms debounce
    this._debounceTimer = null;
  }

  /**
   * 3-Tier Search Cascade Execution
   * Tier 1: pokemontcg.io
   * Tier 2: tcgdex.net
   * Tier 3: in-memory local catalogue
   */
  async searchCards(query, fetchMocks = {}) {
    const q = (query || '').trim();
    if (!q) return [];

    // Tier 1: pokemontcg.io
    try {
      if (fetchMocks.failPrimary) {
        throw new Error('Primary API (pokemontcg.io) HTTP 503 / Timeout');
      }
      const data = fetchMocks.primaryData || [
        { id: 'xy1-1', name: `${q} Holo Rare`, set: { name: 'Base' }, rarity: 'Holo Rare', images: { small: 'img1.png' }, cardmarket: { prices: { averageSellPrice: 120 } } }
      ];
      return data.map(c => ({
        id: c.id,
        nombre: c.name,
        set: c.set?.name || 'Unknown',
        rareza: c.rarity || 'Common',
        imagen: c.images?.small || '',
        precioEstimado: c.cardmarket?.prices?.averageSellPrice || 0,
        fuente: 'pokemontcg.io'
      }));
    } catch (err1) {
      // Cascade to Tier 2: tcgdex.net
      try {
        if (fetchMocks.failSecondary) {
          throw new Error('Secondary API (tcgdex.net) Network unreachable');
        }
        const data2 = fetchMocks.secondaryData || [
          { id: 'tcgdex-1', name: `${q} Alt Art`, set: { name: 'Evolving Skies' }, rarity: 'Secret Rare', image: 'img2.png' }
        ];
        return data2.map(c => ({
          id: c.id,
          nombre: c.name,
          set: c.set?.name || 'Unknown',
          rareza: c.rarity || 'Secret Rare',
          imagen: c.image || '',
          precioEstimado: 150,
          fuente: 'tcgdex.net'
        }));
      } catch (err2) {
        // Fallback to Tier 3: In-memory local catalogue
        const localMatches = this.localCatalog.filter(p =>
          (p.nombre || '').toLowerCase().includes(q.toLowerCase()) ||
          (p.set || '').toLowerCase().includes(q.toLowerCase())
        );
        return localMatches.map(p => ({
          id: p.id,
          nombre: p.nombre,
          set: p.set,
          rareza: p.rareza || 'Vault Asset',
          imagen: p.imagenLocal || '',
          precioEstimado: p.precios?.psa10 || 100,
          fuente: 'local-vault'
        }));
      }
    }
  }

  debounceSearch(query, callback, fetchMocks = {}) {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      if (this._pendingResolve) {
        this._pendingResolve({ cancelled: true });
      }
    }
    return new Promise((resolve) => {
      this._pendingResolve = resolve;
      this._debounceTimer = setTimeout(async () => {
        this._pendingResolve = null;
        const results = await this.searchCards(query, fetchMocks);
        if (typeof callback === 'function') callback(results);
        resolve(results);
      }, this.debounceMs);
    });
  }
}

/**
 * -----------------------------------------------------------------------------
 * 6. DEXIE.JS ACID IN-MEMORY DATABASE MOCK
 * -----------------------------------------------------------------------------
 */
export class MockDexieDB {
  constructor() {
    this.usuarios = new MockTable('usuarios', 'cedula_ruc');
    this.direcciones_envio = new MockTable('direcciones_envio', 'direccion_id');
    this.ordenes_compra = new MockTable('ordenes_compra', 'numero_orden');
    this.items_orden = new MockTable('items_orden', ['numero_orden', 'sku', 'grado']);
  }

  async transaction(mode, tables, txFunc) {
    // In-memory atomic transaction simulation
    return await txFunc();
  }

  async procesarOrdenTransaccional({ usuario, orden, items }) {
    // 1. Upsert user
    await this.usuarios.put(usuario);

    // 2. Insert order
    await this.ordenes_compra.put(orden);

    // 3. Insert line items
    for (const item of items) {
      await this.items_orden.put({
        ...item,
        numero_orden: orden.numero_orden
      });
    }

    return {
      success: true,
      orderId: orden.numero_orden,
      timestamp: new Date().toISOString()
    };
  }
}

class MockTable {
  constructor(name, pkField) {
    this.name = name;
    this.pkField = pkField;
    this.records = new Map();
  }

  _getKey(record) {
    if (Array.isArray(this.pkField)) {
      return this.pkField.map(f => String(record[f] || '')).join('::');
    }
    return String(record[this.pkField] || '');
  }

  async get(key) {
    const k = Array.isArray(key) ? key.join('::') : String(key);
    return this.records.get(k) || undefined;
  }

  async put(record) {
    const k = this._getKey(record);
    this.records.set(k, { ...record });
    return k;
  }

  async add(record) {
    const k = this._getKey(record);
    if (this.records.has(k)) {
      throw new Error(`Key already exists in table ${this.name}: ${k}`);
    }
    this.records.set(k, { ...record });
    return k;
  }

  async update(key, updates) {
    const k = Array.isArray(key) ? key.join('::') : String(key);
    const existing = this.records.get(k);
    if (!existing) return 0;
    this.records.set(k, { ...existing, ...updates });
    return 1;
  }

  async delete(key) {
    const k = Array.isArray(key) ? key.join('::') : String(key);
    return this.records.delete(k);
  }

  async toArray() {
    return Array.from(this.records.values());
  }

  where(field) {
    return {
      equals: (val) => ({
        toArray: async () => {
          const all = Array.from(this.records.values());
          return all.filter(r => r[field] === val);
        },
        first: async () => {
          const all = Array.from(this.records.values());
          return all.find(r => r[field] === val) || undefined;
        }
      })
    };
  }
}

/**
 * -----------------------------------------------------------------------------
 * 7. WORKSPACE SOURCE CODE EVALUATOR
 * -----------------------------------------------------------------------------
 */
export function loadProjectFile(relativePath, context = {}) {
  const fullPath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(fullPath)) return null;

  const code = fs.readFileSync(fullPath, 'utf8');
  const sandbox = {
    ...context,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URLSearchParams,
    Math,
    Date,
    JSON
  };
  vm.createContext(sandbox);
  try {
    vm.runInContext(code, sandbox);
    return sandbox;
  } catch (err) {
    console.warn(`[test_harness] Error evaluating ${relativePath}:`, err.message);
    return null;
  }
}
