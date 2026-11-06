/**
 * Panel de inventario (pages/admin.html): precio y stock por grado y visibilidad
 * de cada producto. El permiso lo valida el servidor (rol ADMIN en admin_rpc.sql);
 * esta página solo muestra lo que las funciones RPC devuelven.
 */
const AdminView = {
  STORAGE_KEY: 'gstcg_admin',
  PSA_MULTIPLIERS: { psa8: 1.6, psa9: 2.4, psa10: 4.5 },
  GRADE_LABELS: { raw: 'Raw', psa8: 'PSA 8', psa9: 'PSA 9', psa10: 'PSA 10', sealed: 'Sellado' },
  LOW_STOCK: 1,

  token: null,
  products: [],
  filters: { search: '', category: 'all', lowStock: false },

  escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  // Devuelve null si es válido o el mensaje de error
  validateGrade(price, stock) {
    const p = Number(price);
    if (price === '' || price === null || !Number.isFinite(p) || p <= 0) return 'El precio debe ser mayor que 0.';
    const s = Number(stock);
    if (stock === '' || stock === null || !Number.isInteger(s) || s < 0) return 'El stock debe ser un número entero mayor o igual a 0.';
    return null;
  },

  // Precios PSA a partir del Raw con los multiplicadores de la tienda
  psaFromRaw(raw) {
    const r = Number(raw);
    if (!Number.isFinite(r) || r <= 0) return null;
    const out = {};
    Object.entries(this.PSA_MULTIPLIERS).forEach(([g, m]) => { out[g] = Math.round(r * m * 100) / 100; });
    return out;
  },

  isLowStock(product) {
    return (product.grados || []).some(g => Number(g.stock) <= this.LOW_STOCK);
  },

  filterProducts(products = this.products, filters = this.filters) {
    const q = (filters.search || '').toLowerCase().trim();
    return products.filter(p => {
      if (filters.category !== 'all' && p.categoria !== filters.category) return false;
      if (filters.lowStock && !this.isLowStock(p)) return false;
      if (q && !(`${p.nombre} ${p.sku}`.toLowerCase().includes(q))) return false;
      return true;
    });
  },

  inputId(sku, grade, field) {
    return `adm-${sku}-${grade}-${field}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  renderRow(p) {
    const sku = this.escape(p.sku);
    const grades = (p.grados || []).map(g => {
      const grade = this.escape(g.grado);
      const priceId = this.inputId(p.sku, g.grado, 'precio');
      const stockId = this.inputId(p.sku, g.grado, 'stock');
      const low = Number(g.stock) <= this.LOW_STOCK;
      return `
        <fieldset class="admin-grade flex items-end gap-2" data-grade="${grade}">
          <legend class="text-xs font-semibold text-slate-700 mb-1">${this.escape(this.GRADE_LABELS[g.grado] || g.grado)}</legend>
          <div>
            <label for="${priceId}" class="block text-[11px] text-slate-600">Precio (USD)</label>
            <input id="${priceId}" data-field="precio" type="number" min="0.01" step="0.01" inputmode="decimal"
              value="${this.escape(g.precio)}" class="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label for="${stockId}" class="block text-[11px] text-slate-600">Stock</label>
            <input id="${stockId}" data-field="stock" type="number" min="0" step="1" inputmode="numeric"
              value="${this.escape(g.stock)}" class="w-16 rounded-md border px-2 py-1.5 text-sm ${low ? 'border-[#B45309] bg-[#FEF3C7]/40' : 'border-slate-300'}" />
          </div>
        </fieldset>`;
    }).join('');

    const isCard = p.tipo !== 'PRODUCTO_SELLADO' && (p.grados || []).some(g => g.grado === 'raw');
    const img = p.imagen
      ? `<img src="${this.escape(p.imagen)}" alt="" width="40" height="56" loading="lazy" class="w-10 h-14 object-contain bg-slate-50 border border-slate-200 rounded" onerror="this.style.visibility='hidden'" />`
      : '<span class="w-10 h-14 bg-slate-100 border border-slate-200 rounded inline-block" aria-hidden="true"></span>';

    return `
      <tr data-sku="${sku}" class="${p.activo ? '' : 'bg-slate-50 text-slate-500'}">
        <td class="px-3 py-3 align-top">
          <div class="flex items-start gap-3 min-w-[14rem]">
            ${img}
            <div>
              <p class="font-medium text-[#0F172A]">${this.escape(p.nombre)}</p>
              <p class="text-xs text-slate-600">${this.escape(p.set || '')}</p>
              <p class="text-[11px] text-slate-500 font-mono">${sku}</p>
            </div>
          </div>
        </td>
        <td class="px-3 py-3 align-top">
          <div class="flex flex-wrap gap-x-5 gap-y-3">${grades || '<span class="text-xs text-slate-500">Sin grados</span>'}</div>
        </td>
        <td class="px-3 py-3 align-top">
          <button type="button" data-action="toggle" aria-pressed="${p.activo ? 'true' : 'false'}"
            aria-label="${p.activo ? 'Ocultar' : 'Mostrar'} ${this.escape(p.nombre)} en la tienda"
            class="inline-flex items-center gap-1.5 text-xs font-medium rounded-md border px-2.5 py-1.5 min-h-[32px] ${p.activo ? 'border-[#047857] text-[#047857]' : 'border-slate-400 text-slate-600'}">
            <i data-lucide="${p.activo ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5" aria-hidden="true"></i>
            ${p.activo ? 'Visible' : 'Oculto'}
          </button>
        </td>
        <td class="px-3 py-3 align-top">
          <div class="flex flex-col items-stretch gap-2 min-w-[9rem]">
            <button type="button" data-action="save"
              class="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-md px-3 py-2 disabled:opacity-60">
              Guardar cambios
            </button>
            ${isCard ? `<button type="button" data-action="recalc"
              class="text-xs font-medium text-[#0F172A] border border-slate-300 hover:border-[#0F172A] rounded-md px-3 py-2">
              Recalcular PSA desde Raw
            </button>` : ''}
          </div>
        </td>
      </tr>`;
  },

  renderRows() {
    const tbody = document.getElementById('admin-rows');
    if (!tbody) return;
    const list = this.filterProducts();
    tbody.innerHTML = list.length
      ? list.map(p => this.renderRow(p)).join('')
      : '<tr><td colspan="4" class="px-3 py-8 text-center text-sm text-slate-600">No hay productos que coincidan con los filtros.</td></tr>';
    const summary = document.getElementById('admin-summary');
    if (summary) {
      const hidden = this.products.filter(p => !p.activo).length;
      summary.textContent = `${list.length} de ${this.products.length} productos · ${hidden} ocultos`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  setStatus(message, type = 'info') {
    const el = document.getElementById('admin-status');
    if (!el) return;
    el.textContent = message;
    el.className = `text-sm min-h-[1.25rem] mb-3 ${type === 'error' ? 'text-[#BE123C]' : 'text-[#047857]'}`;
  },

  saveToken(token) {
    this.token = token;
    try {
      if (token) sessionStorage.setItem(this.STORAGE_KEY, token);
      else sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) { /* almacenamiento bloqueado: el token queda solo en memoria */ }
  },

  showPanel(visible) {
    const login = document.getElementById('admin-login');
    const panel = document.getElementById('admin-panel');
    const logout = document.getElementById('admin-logout');
    if (login) login.classList.toggle('hidden', visible);
    if (panel) panel.classList.toggle('hidden', !visible);
    if (logout) logout.classList.toggle('hidden', !visible);
  },

  // Sin permiso o con la sesión caducada se vuelve al formulario sin dar más detalles
  handleAuthError(err) {
    if (err && (err.code === 'NO_AUTORIZADO' || err.code === 'SESION_INVALIDA')) {
      this.saveToken(null);
      this.products = [];
      this.showPanel(false);
      const msg = document.getElementById('admin-login-error');
      if (msg) msg.textContent = 'Acceso no autorizado.';
      return true;
    }
    return false;
  },

  async loadProducts() {
    this.products = await SupabaseAPI.adminListProducts(this.token);
    this.showPanel(true);
    this.renderRows();
  },

  async login(email, password) {
    const msg = document.getElementById('admin-login-error');
    if (msg) msg.textContent = '';
    if (!email || !password) {
      if (msg) msg.textContent = 'Escribe tu correo y tu contraseña.';
      return false;
    }
    try {
      const user = await SupabaseAPI.login(email, password);
      this.saveToken(user && user.token);
      await this.loadProducts();
      const title = document.getElementById('admin-panel-title');
      if (title && title.focus) title.focus();
      return true;
    } catch (err) {
      if (!this.handleAuthError(err) && msg) msg.textContent = err.message || 'No se pudo iniciar sesión.';
      return false;
    }
  },

  logout() {
    this.saveToken(null);
    this.products = [];
    this.showPanel(false);
    const email = document.getElementById('admin-email');
    if (email && email.focus) email.focus();
  },

  readRowGrades(row) {
    return Array.from(row.querySelectorAll('.admin-grade')).map(fs => ({
      grado: fs.getAttribute('data-grade'),
      precio: fs.querySelector('[data-field="precio"]').value.trim(),
      stock: fs.querySelector('[data-field="stock"]').value.trim()
    }));
  },

  async saveRow(sku, row) {
    const product = this.products.find(p => p.sku === sku);
    if (!product) return;
    const edited = this.readRowGrades(row);
    for (const g of edited) {
      const error = this.validateGrade(g.precio, g.stock);
      if (error) {
        this.setStatus(`${product.nombre} (${this.GRADE_LABELS[g.grado] || g.grado}): ${error}`, 'error');
        const input = row.querySelector(`[data-grade="${g.grado}"] [data-field="${error.startsWith('El precio') ? 'precio' : 'stock'}"]`);
        if (input && input.focus) input.focus();
        return;
      }
    }
    const changed = edited.filter(g => {
      const old = (product.grados || []).find(o => o.grado === g.grado) || {};
      return Number(old.precio) !== Number(g.precio) || Number(old.stock) !== Number(g.stock);
    });
    if (!changed.length) {
      this.setStatus(`${product.nombre}: no hay cambios que guardar.`);
      return;
    }
    try {
      for (const g of changed) {
        const saved = await SupabaseAPI.adminUpdateGrade(this.token, sku, g.grado, Number(g.precio), Number(g.stock));
        const target = product.grados.find(o => o.grado === g.grado);
        if (target) {
          target.precio = saved && saved.precio != null ? Number(saved.precio) : Number(g.precio);
          target.stock = saved && saved.stock != null ? Number(saved.stock) : Number(g.stock);
        }
      }
      this.setStatus(`${product.nombre}: cambios guardados.`);
      this.renderRows();
    } catch (err) {
      if (!this.handleAuthError(err)) this.setStatus(err.message || 'No se pudieron guardar los cambios.', 'error');
    }
  },

  async toggleActive(sku) {
    const product = this.products.find(p => p.sku === sku);
    if (!product) return;
    try {
      await SupabaseAPI.adminSetActive(this.token, sku, !product.activo);
      product.activo = !product.activo;
      this.setStatus(`${product.nombre}: ${product.activo ? 'visible en la tienda' : 'oculto en la tienda'}.`);
      this.renderRows();
      const btn = document.querySelector(`tr[data-sku="${sku}"] [data-action="toggle"]`);
      if (btn && btn.focus) btn.focus();
    } catch (err) {
      if (!this.handleAuthError(err)) this.setStatus(err.message || 'No se pudo cambiar la visibilidad.', 'error');
    }
  },

  recalcRow(row) {
    const rawInput = row.querySelector('[data-grade="raw"] [data-field="precio"]');
    const prices = rawInput ? this.psaFromRaw(rawInput.value) : null;
    if (!prices) {
      this.setStatus('Escribe primero un precio Raw válido.', 'error');
      return;
    }
    Object.entries(prices).forEach(([grade, price]) => {
      const input = row.querySelector(`[data-grade="${grade}"] [data-field="precio"]`);
      if (input) input.value = price.toFixed(2);
    });
    this.setStatus('Precios PSA recalculados. Pulsa "Guardar cambios" para aplicarlos.');
  },

  init() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('admin-login-submit');
      if (btn) btn.disabled = true;
      await this.login(document.getElementById('admin-email').value.trim(), document.getElementById('admin-password').value);
      document.getElementById('admin-password').value = '';
      if (btn) btn.disabled = false;
    });

    document.getElementById('admin-logout').addEventListener('click', () => this.logout());

    document.getElementById('admin-search').addEventListener('input', (e) => {
      this.filters.search = e.target.value;
      this.renderRows();
    });
    document.getElementById('admin-category').addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.renderRows();
    });
    document.getElementById('admin-low-stock').addEventListener('change', (e) => {
      this.filters.lowStock = e.target.checked;
      this.renderRows();
    });

    document.getElementById('admin-rows').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const row = btn.closest('tr[data-sku]');
      const sku = row && row.getAttribute('data-sku');
      if (!sku) return;
      const action = btn.getAttribute('data-action');
      if (action === 'save') {
        btn.disabled = true;
        this.saveRow(sku, row).finally(() => { btn.disabled = false; });
      } else if (action === 'toggle') {
        this.toggleActive(sku);
      } else if (action === 'recalc') {
        this.recalcRow(row);
      }
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    let saved = null;
    try { saved = sessionStorage.getItem(this.STORAGE_KEY); } catch (e) { saved = null; }
    if (saved) {
      this.token = saved;
      this.loadProducts().catch(err => {
        if (!this.handleAuthError(err)) this.setStatus(err.message || 'No se pudo cargar el inventario.', 'error');
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.AdminView = AdminView;
  if (typeof document !== 'undefined' && document.getElementById && document.getElementById('admin-login-form')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => AdminView.init());
    else AdminView.init();
  }
}
