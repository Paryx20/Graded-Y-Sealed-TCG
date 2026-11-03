const app = {
  init() {
    Store.init();
    this.updateNavbarUserUI();
    if (Store.data.currentUser) {
      Store.syncOrdersFromServer().then(() => {
        if (['profile', 'tracking', 'checkout'].includes(Store.data.currentView)) this.renderCurrentView();
      });
    }
    this.updateCartBadge();
    this.setupSearchSpotlight();

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const psaModal = document.getElementById('psa-guide-modal');
        if (psaModal && psaModal.classList.contains('active')) {
          this.closePSAGuideModal();
        }
        const delModal = document.getElementById('delete-confirm-modal');
        if (delModal) delModal.classList.remove('active');
        const payModal = document.getElementById('payment-modal');
        if (payModal && !payModal.dataset.locked) payModal.classList.remove('active');
        const spotlight = document.getElementById('search-spotlight-backdrop');
        if (spotlight) spotlight.classList.remove('active');
        const liveSearch = document.getElementById('search-live-dropdown');
        if (liveSearch) liveSearch.classList.add('hidden');
      }
    });

    const psaModal = document.getElementById('psa-guide-modal');
    if (psaModal && typeof psaModal.addEventListener === 'function') {
      psaModal.addEventListener('click', (e) => {
        if (e.target === psaModal) {
          this.closePSAGuideModal();
        }
      });
    }

    const container = document.getElementById('app-view');
    if (container) container.setAttribute('aria-busy', 'true');
    Store.loadCatalogFromServer().finally(() => {
      if (container) container.removeAttribute('aria-busy');
      this.handleRoute();
    });
  },

  // Cada vista es una página HTML independiente
  PAGES: {
    home: 'index.html',
    catalog: 'pages/catalogo.html',
    pdp: 'pages/producto.html',
    cart: 'pages/carrito.html',
    checkout: 'pages/checkout.html',
    confirmation: 'pages/confirmacion.html',
    error: 'pages/pago-rechazado.html',
    auth: 'pages/login.html',
    profile: 'pages/perfil.html',
    tracking: 'pages/seguimiento.html',
    'search-results': 'pages/busqueda.html'
  },

  url(route, params) {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return (this.PAGES[route] || this.PAGES.home) + (qs ? `?${qs}` : '');
  },

  go(route, params) {
    window.location.href = this.url(route, params);
  },

  handleRoute() {
    const route = (document.body && document.body.dataset.page) || 'home';
    const params = new URLSearchParams(window.location.search);

    if (route === 'pdp') {
      const prodId = params.get('id');
      const found = prodId && Store.getProduct ? Store.getProduct(prodId) : null;
      if (found) {
        Store.data.currentPdpProduct = found;
        Store.data.pdpSelectedCondition = found.condicionPrincipal === 'psa9' ? 'psa9' : 'psa10';
        Store.data.pdpQuantity = 1;
        Store.data.pdpInspectorMode = 'front';
      }
    }

    if (route === 'catalog') {
      const catParam = params.get('cat');
      const eraParam = params.get('era');
      const qParam = (params.get('q') || '').trim();
      Store.data.catalogFilters.category = catParam || 'all';
      Store.data.catalogFilters.era = catParam ? 'all' : (eraParam || 'all');
      // La búsqueda solo se aplica cuando viene en la URL (?q=)
      Store.data.catalogFilters.searchQuery = qParam;
      Store.data.searchQuery = qParam;
      const searchInput = document.getElementById('global-search');
      if (searchInput) searchInput.value = qParam;
    }

    if (route === 'search-results') {
      Store.data.searchQuery = params.get('q') || '';
      const searchInput = document.getElementById('global-search');
      if (searchInput) searchInput.value = Store.data.searchQuery;
    }

    if (route === 'tracking' || route === 'confirmation') {
      const orderParam = params.get('order');
      if (orderParam) Store.data.activeTrackingOrderId = orderParam;
    }

    if (route === 'profile' && params.get('tab') === 'orders') {
      Store.data.profileActiveTab = 'orders';
    }

    if (route === 'auth' && params.get('tab') === 'register') {
      CheckoutView.authTab = 'register';
    }

    Store.data.currentView = route;
    this.renderCurrentView();
  },

  updateCategoryNav() {
    const view = Store.data.currentView;
    const f = Store.data.catalogFilters;
    let key = '';
    if (view === 'catalog' && !f.searchQuery) {
      if (f.category !== 'all') key = `cat:${f.category}`;
      else if (f.era !== 'all') key = `era:${f.era}`;
      else key = 'all';
    }
    document.querySelectorAll('[data-page-link]').forEach(link => {
      const current = link.dataset.pageLink === view;
      link.classList.toggle('text-white', current);
      link.classList.toggle('bg-[#1E293B]', current);
      if (current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-nav]').forEach(link => {
      const active = link.dataset.nav === key;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  },

  renderCurrentView() {
    const container = document.getElementById('app-view');
    if (!container) return;
    this.updateCategoryNav();

    const view = Store.data.currentView;
    let html = '';

    if (view === 'home') {
      html = HomeView.render();
    } else if (view === 'catalog') {
      html = CatalogView.render();
    } else if (view === 'pdp') {
      html = PDPView.render();
    } else if (view === 'cart') {
      html = CartView.render();
    } else if (view === 'checkout') {
      html = CheckoutView.renderCheckout();
    } else if (view === 'confirmation') {
      html = CheckoutView.renderConfirmation();
    } else if (view === 'error') {
      html = CheckoutView.renderPaymentError();
    } else if (view === 'auth') {
      html = CheckoutView.renderAuth();
    } else if (view === 'profile') {
      html = ProfileView.render();
    } else if (view === 'tracking') {
      html = TrackingView.render();
    } else if (view === 'search-results') {
      html = (typeof SearchResultsView !== 'undefined' && SearchResultsView.render)
        ? SearchResultsView.render(Store.data.searchQuery || '')
        : '<div class="p-8 text-center text-slate-500 font-bold">Cargando motor de búsqueda...</div>';
    } else {
      html = HomeView.render();
    }

    container.innerHTML = html;
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    if (view === 'pdp') {
      PDPView.afterRender();
    } else if (view === 'search-results' && typeof SearchResultsView !== 'undefined' && SearchResultsView.afterRender) {
      SearchResultsView.afterRender();
    } else if (view === 'profile' && typeof ProfileView !== 'undefined' && ProfileView.afterRender) {
      ProfileView.afterRender();
    } else if (view === 'tracking' && typeof TrackingView !== 'undefined' && TrackingView.afterRender) {
      TrackingView.afterRender();
    } else if (view === 'auth' && typeof CheckoutView !== 'undefined') {
      if (typeof CheckoutView.afterAuthRender === 'function') {
        CheckoutView.afterAuthRender();
      } else if (typeof CheckoutView.afterRender === 'function') {
        CheckoutView.afterRender();
      }
    } else if (view === 'checkout' && typeof CheckoutView !== 'undefined') {
      if (typeof CheckoutView.afterCheckoutRender === 'function') {
        CheckoutView.afterCheckoutRender();
      } else if (typeof CheckoutView.afterRender === 'function') {
        CheckoutView.afterRender();
      }
    }
  },

  openProductPDP(productId) {
    this.go('pdp', { id: productId });
  },

  openOrderTracking(orderId) {
    this.go('tracking', { order: orderId });
  },

  addToCart(id, name, condition, price, imageLocal, imageFallback, qty = 1) {
    const units = Math.max(1, parseInt(qty, 10) || 1);
    const existing = Store.data.cart.find(c => c.id === id);
    const { sku, grade } = Store.parseCartItemId(id);
    const stock = Store.getStock(sku, grade);
    if (stock !== null && (existing ? existing.quantity : 0) + units > stock) {
      this.showToast(stock === 0
        ? `"${name}" está agotado en este grado.`
        : `Solo quedan ${stock} unidades de "${name}" en este grado.`, 'error');
      return;
    }
    if (existing) {
      existing.quantity += units;
    } else {
      Store.data.cart.push({
        id,
        name,
        condition,
        price,
        quantity: units,
        imageLocal: imageLocal || 'assets/img/cards/card-back.png',
        imageFallback: imageFallback || 'assets/img/cards/card-back.png'
      });
    }

    Store.saveCart();
    this.updateCartBadge();
    if (Store.data.currentView === 'cart') {
      this.renderCurrentView();
    }
    this.showToast(`+${units} "${name}" añadido a la bolsa`, 'success');
  },

  updateCartQuantity(id, delta) {
    const item = Store.data.cart.find(c => c.id === id);
    if (!item) return;

    if (item.quantity + delta <= 0) {
      this.requestRemoveItem(id);
      return;
    }
    const { sku, grade } = Store.parseCartItemId(id);
    const stock = Store.getStock(sku, grade);
    if (delta > 0 && stock !== null && item.quantity + delta > stock) {
      this.showToast(`Solo hay ${stock} unidades disponibles de "${item.name}".`, 'error');
      return;
    }

    item.quantity += delta;
    Store.saveCart();
    this.updateCartBadge();
    this.renderCurrentView();
  },

  requestRemoveItem(id) {
    const item = Store.data.cart.find(c => c.id === id);
    if (!item) return;

    Store.data.pendingDeleteItemId = id;
    const modal = document.getElementById('delete-confirm-modal');
    const nameEl = document.getElementById('delete-confirm-item-name');
    if (nameEl) {
      nameEl.innerText = `Se retirará "${item.name} (${item.condition})" de tu bolsa.`;
    }
    if (modal) {
      modal.classList.add('active');
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }
  },

  cancelRemoveItem() {
    Store.data.pendingDeleteItemId = null;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('active');
  },

  confirmRemoveItem() {
    const id = Store.data.pendingDeleteItemId;
    Store.data.pendingDeleteItemId = null;
    const modal = document.getElementById('delete-confirm-modal');
    if (modal) modal.classList.remove('active');
    if (!id) return;

    const idx = Store.data.cart.findIndex(c => c.id === id);
    if (idx === -1) return;

    const removed = Store.data.cart[idx];
    Store.data.lastDeletedItem = { item: removed, index: idx };
    Store.data.cart.splice(idx, 1);
    Store.saveCart();

    this.updateCartBadge();
    this.renderCurrentView();

    const banner = document.getElementById('undo-banner');
    const text = document.getElementById('undo-text');
    if (banner && text) {
      text.innerText = `Ítem "${removed.name}" eliminado de la bolsa.`;
      banner.classList.remove('hidden');
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }
  },

  undoLastDeletion() {
    if (!Store.data.lastDeletedItem) return;
    const { item, index } = Store.data.lastDeletedItem;
    Store.data.cart.splice(index, 0, item);
    Store.data.lastDeletedItem = null;
    Store.saveCart();

    const banner = document.getElementById('undo-banner');
    if (banner) banner.classList.add('hidden');

    this.updateCartBadge();
    this.renderCurrentView();
    this.showToast(`Ítem "${item.name}" restaurado a la bolsa`, 'success');
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.innerText = Store.getCartCount();
    }
  },

  openPSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) {
      if (typeof document !== 'undefined' && document.activeElement) {
        this._psaModalTrigger = document.activeElement;
      }
      modal.classList.add('active');
      if (typeof modal.setAttribute === 'function') {
        modal.setAttribute('aria-hidden', 'false');
      }
      if (typeof document !== 'undefined' && document.body && document.body.classList) {
        document.body.classList.add('overflow-hidden');
      }
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
      const closeBtn = (typeof modal.querySelector === 'function') ? (modal.querySelector('button[aria-label="Cerrar guía PSA"]') || modal.querySelector('button')) : null;
      if (closeBtn && typeof closeBtn.focus === 'function') {
        closeBtn.focus();
      }
    }
  },

  closePSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) {
      modal.classList.remove('active');
      if (typeof modal.setAttribute === 'function') {
        modal.setAttribute('aria-hidden', 'true');
      }
    }
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.remove('overflow-hidden');
    }
    if (this._psaModalTrigger && typeof this._psaModalTrigger.focus === 'function') {
      this._psaModalTrigger.focus();
      this._psaModalTrigger = null;
    }
  },

  handleNavAccountClick() {
    this.go(Store.data.currentUser ? 'profile' : 'auth');
  },

  async loginUser(email, password, redirectHome = true) {
    const emailMsg = Validators.email(email);
    if (emailMsg || !password) {
      this.showToast(emailMsg || 'Ingresa tu contraseña.', 'error');
      return false;
    }

    try {
      const user = await SupabaseAPI.login(email, password);
      this.startSession(user);
      this.showToast(`¡Bienvenido a la bóveda, ${user.name}!`, 'success');
      if (redirectHome) {
        this.go('profile');
      }
      return true;
    } catch (err) {
      this.showToast(err.message, 'error');
      return false;
    }
  },

  // Guarda la sesión y trae desde Supabase el historial de órdenes del usuario
  async startSession(user) {
    Store.data.currentUser = user;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    await Store.syncOrdersFromServer();
    if (['profile', 'checkout', 'tracking'].includes(Store.data.currentView)) {
      this.renderCurrentView();
    }
  },

  logoutUser() {
    Store.data.currentUser = null;
    Store.data.orders = [];
    Store.data.activeTrackingOrderId = null;
    Store.saveUserSession();
    Store.saveOrders();
    this.updateNavbarUserUI();
    this.showToast('Sesión cerrada correctamente.', 'info');
    if (Store.data.currentView === 'profile') {
      this.renderCurrentView();
    } else {
      this.go('home');
    }
  },

  updateNavbarUserUI() {
    const label = document.getElementById('nav-user-label');
    const btn = document.getElementById('btn-nav-account');
    const user = Store.data.currentUser;

    if (user) {
      const shortName = user.name.split(' ')[0];
      if (label) label.innerText = shortName;
      if (btn) {
        btn.classList.add('border-[#D97706]', 'bg-[#FEF3C7]/15', 'text-[#FEF3C7]');
      }
    } else {
      if (label) label.innerText = 'Mi Cuenta';
      if (btn) {
        btn.classList.remove('border-[#D97706]', 'bg-[#FEF3C7]/15', 'text-[#FEF3C7]');
      }
    }
  },

  setupSearchSpotlight() {
    const searchInput = document.getElementById('global-search');
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const container = document.getElementById('search-container');
    const dropdown = document.getElementById('search-live-dropdown');

    if (!searchInput || !backdrop) return;

    const openSpotlight = () => {
      backdrop.classList.add('active');
      if (container) container.classList.add('focused');
      this.renderLiveSearchDropdown(searchInput.value);
    };

    const closeSpotlight = () => {
      backdrop.classList.remove('active');
      if (container) container.classList.remove('focused');
      if (dropdown) dropdown.classList.add('hidden');
    };

    searchInput.addEventListener('focus', openSpotlight);
    searchInput.addEventListener('input', (e) => {
      this.renderLiveSearchDropdown(e.target.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.blur();
        closeSpotlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        closeSpotlight();
        this.executeGlobalSearch(searchInput.value);
      }
    });

    backdrop.addEventListener('click', () => {
      searchInput.blur();
      closeSpotlight();
    });
  },

  renderLiveSearchDropdown(rawQuery) {
    const dropdown = document.getElementById('search-live-dropdown');
    if (!dropdown) return;

    const q = (rawQuery || '').toLowerCase().trim();
    const matches = PRODUCTS.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.set.toLowerCase().includes(q) ||
      p.tipo.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-500">
          No se encontraron piezas para "${rawQuery}".
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = `
      <div class="p-2 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>Resultados en Bóveda</span>
        <span>${matches.length} coincidencias</span>
      </div>
      <div class="divide-y divide-slate-100">
        ${matches.map(card => `
          <div onclick="app.selectSpotlightProduct('${card.id}')" class="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg transition group">
            <div class="flex items-center gap-3">
              <img 
                src="${card.imagenLocal}" 
                alt="${card.nombre}" 
                class="w-9 h-12 object-contain bg-[#F8FAFC] border border-slate-200 rounded p-0.5" 
                onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
              />
              <div>
                <h4 class="text-xs font-extrabold text-[#0F172A] group-hover:text-[#BE123C] transition">${card.nombre}</h4>
                <span class="text-xs text-slate-500">${card.set} • ${card.rareza}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-[#0F172A]">$${Number((card.precios && (card.precios.psa10 || card.precios.raw)) || card.precioEstimado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span class="block text-xs text-[#B45309] font-bold">PSA 10</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="p-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <button type="button" onclick="app.executeGlobalSearch('${q.replace(/'/g, '')}')" class="font-extrabold text-[#BE123C] hover:text-[#9F1239] flex items-center gap-1">
          <i data-lucide="cpu" class="w-3.5 h-3.5"></i>
          <span>Búsqueda Multifuente en Tiempo Real →</span>
        </button>
        <a href="${this.url('catalog', { q })}" class="text-slate-500 hover:text-slate-800 font-semibold text-xs">
          Catálogo Tradicional
        </a>
      </div>
    `;
    dropdown.classList.remove('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  },

  selectSpotlightProduct(cardId) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const dropdown = document.getElementById('search-live-dropdown');
    if (backdrop) backdrop.classList.remove('active');
    if (dropdown) dropdown.classList.add('hidden');
    this.openProductPDP(cardId);
  },

  executeGlobalSearch(query) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const dropdown = document.getElementById('search-live-dropdown');
    if (backdrop) backdrop.classList.remove('active');
    if (dropdown) dropdown.classList.add('hidden');

    const cleanQ = (query || '').trim();
    Store.data.searchQuery = cleanQ;
    Store.data.catalogFilters.searchQuery = cleanQ;
    this.go('search-results', { q: cleanQ });
  },

  _activeToastTimeout: null,

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Strict singleton: clear pending timer and existing toast
    if (this._activeToastTimeout) {
      clearTimeout(this._activeToastTimeout);
      this._activeToastTimeout = null;
    }
    container.innerHTML = '';

    const toast = document.createElement('div');
    toast.setAttribute('data-type', type);
    toast.className = 'pointer-events-auto bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border-l-4 flex items-center gap-2.5 transition-all transform translate-y-2 opacity-0';

    let icon = 'info';
    if (type === 'success') {
      toast.classList.add('border-[#059669]');
      icon = 'check-circle';
    } else if (type === 'error') {
      toast.classList.add('border-[#E11D48]');
      icon = 'alert-circle';
    } else {
      toast.classList.add('border-[#D97706]');
    }

    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });
    } else {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }

    // Auto-dismiss after exactly 2.5 seconds (2500ms)
    this._activeToastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
        this._activeToastTimeout = null;
      }, 200);
    }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

