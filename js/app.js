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
      if (e.key === 'Tab' && this._dialogStack.length) {
        this.trapDialogFocus(e);
        return;
      }
      if (e.key !== 'Escape') return;

      // Esc cierra solo la capa superior: diálogo, filtros móviles o buscador
      const topId = this._dialogStack[this._dialogStack.length - 1];
      if (topId) {
        if (topId === 'psa-guide-modal') this.closePSAGuideModal();
        else if (topId === 'delete-confirm-modal') this.cancelRemoveItem();
        else {
          const top = document.getElementById(topId);
          if (!(top && top.dataset && top.dataset.locked)) this.closeDialog(topId);
        }
        return;
      }
      if (this.isExpansionsMenuOpen()) {
        this.closeExpansionsMenu(true);
        return;
      }
      if (typeof CatalogView !== 'undefined' && CatalogView.mobileFiltersOpen && typeof CatalogView.toggleMobileFilters === 'function') {
        CatalogView.toggleMobileFilters();
        return;
      }
      const spotlight = document.getElementById('search-spotlight-backdrop');
      if (spotlight) spotlight.classList.remove('active');
      const liveSearch = document.getElementById('search-live-dropdown');
      if (liveSearch) liveSearch.classList.add('hidden');
    });

    this.setupSkipLink();

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
    Store.loadCatalogFromServer()
      .then(ok => { if (!ok) this.showOfflineNotice(); })
      .finally(() => {
        if (container) container.removeAttribute('aria-busy');
        this.handleRoute();
        this.hideLoader();
        const repriced = Store.data.repricedCartItems || [];
        if (repriced.length) {
          this.showToast(repriced.length === 1
            ? `El precio de "${repriced[0]}" se actualizó en tu bolsa.`
            : `Se actualizó el precio de ${repriced.length} productos de tu bolsa.`, 'info');
          Store.data.repricedCartItems = [];
        }
      });
  },

  // Iconos Lucide decorativos: ocultos para lectores de pantalla y con el mismo grosor
  refreshIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons({ attrs: { 'aria-hidden': 'true', 'stroke-width': 2 } });
    }
  },

  // Supabase no respondió: se muestra el catálogo de respaldo de data.js
  showOfflineNotice() {
    const main = document.getElementById('app-view');
    if (!main || document.getElementById('offline-notice')) return;
    const notice = document.createElement('div');
    notice.id = 'offline-notice';
    notice.setAttribute('role', 'status');
    notice.className = 'bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5';
    notice.innerHTML = `
      <div class="max-w-7xl mx-auto flex items-center gap-2 text-xs sm:text-sm font-medium">
        <i data-lucide="wifi-off" class="w-4 h-4"></i>
        <span>Mostrando el catálogo sin conexión: los precios y el stock pueden no estar actualizados.</span>
      </div>
    `;
    main.parentNode.insertBefore(notice, main);
    this.refreshIcons();
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
    'search-results': 'pages/busqueda.html',
    guide: 'pages/guia.html'
  },

  // Retira la pantalla de carga del home (si se mostró) con un fundido corto
  hideLoader() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const loader = document.getElementById('app-loader');
    if (!loader || loader.dataset.hiding) return;
    loader.dataset.hiding = '1';
    setTimeout(() => {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 500);
    }, 450);
  },

  // ------------------------------------------------ Menú desplegable "Expansiones"

  isExpansionsMenuOpen() {
    const menu = typeof document !== 'undefined' && document.getElementById('expansions-menu');
    return !!(menu && !menu.classList.contains('hidden'));
  },

  renderExpansionsMenu() {
    if (typeof EXPANSIONES === 'undefined') return '';
    const available = p => (typeof CatalogView === 'undefined' || CatalogView.matchesCategory(p, 'all'));
    const current = Store.data.currentView === 'catalog' ? Store.data.catalogFilters.set : null;
    const series = [];
    EXPANSIONES.forEach(exp => {
      const count = PRODUCTS.filter(p => p.expansion === exp.slug && available(p)).length;
      if (!count) return;
      let group = series.find(g => g.name === exp.serie);
      if (!group) series.push(group = { name: exp.serie, items: [] });
      group.items.push({ ...exp, count });
    });
    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
          <p class="text-sm font-bold text-[#0F172A]">Compra por expansión</p>
          <a href="pages/catalogo.html" class="text-xs font-semibold text-[#BE123C] hover:underline">Ver todo el catálogo</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-5">
          ${series.map(g => `
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">${g.name}</p>
              <ul class="space-y-0.5">
                ${g.items.map(e => `
                  <li>
                    <a href="${this.url('catalog', { set: e.slug })}" class="expansion-link ${current === e.slug ? 'is-active' : ''}" ${current === e.slug ? 'aria-current="page"' : ''}>
                      <span class="font-semibold">${e.nombre}</span>
                      <span class="text-xs text-slate-500">${e.anio} · ${e.count} ${e.count === 1 ? 'producto' : 'productos'}</span>
                    </a>
                  </li>`).join('')}
              </ul>
            </div>`).join('')}
        </div>
      </div>
    `;
  },

  toggleExpansionsMenu() {
    if (this.isExpansionsMenuOpen()) this.closeExpansionsMenu(true);
    else this.openExpansionsMenu();
  },

  openExpansionsMenu() {
    const menu = document.getElementById('expansions-menu');
    const toggle = document.getElementById('expansions-toggle');
    if (!menu || !toggle) return;
    menu.innerHTML = this.renderExpansionsMenu();
    menu.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
    const first = menu.querySelector('.expansion-link');
    if (first) first.focus();

    if (!this._expansionsBound) {
      this._expansionsBound = true;
      document.addEventListener('click', (e) => {
        if (!this.isExpansionsMenuOpen()) return;
        const t = document.getElementById('expansions-toggle');
        if (menu.contains(e.target) || (t && t.contains(e.target))) return;
        this.closeExpansionsMenu(false);
      });
      // Flechas arriba/abajo recorren las expansiones; Tab fuera del panel lo cierra
      menu.addEventListener('keydown', (e) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        const links = Array.from(menu.querySelectorAll('.expansion-link'));
        const idx = links.indexOf(document.activeElement);
        let next = idx;
        if (e.key === 'ArrowDown') next = Math.min(links.length - 1, idx + 1);
        if (e.key === 'ArrowUp') next = Math.max(0, idx - 1);
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = links.length - 1;
        if (links[next]) { e.preventDefault(); links[next].focus(); }
      });
      menu.addEventListener('focusout', (e) => {
        const t = document.getElementById('expansions-toggle');
        if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== t) this.closeExpansionsMenu(false);
      });
    }
    this.refreshIcons();
  },

  closeExpansionsMenu(returnFocus) {
    const menu = document.getElementById('expansions-menu');
    const toggle = document.getElementById('expansions-toggle');
    if (menu) menu.classList.add('hidden');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    }
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
        Store.data.pdpSelectedCondition = ['raw', 'psa9'].includes(found.condicionPrincipal) ? found.condicionPrincipal : 'psa10';
        // Si ese grado está agotado se abre la ficha en el primero que tenga stock
        if (typeof CatalogView !== 'undefined' && CatalogView.availableGrades && !CatalogView.isSealedItem(found)) {
          const inStock = CatalogView.availableGrades(found);
          if (inStock.length && !inStock.includes(Store.data.pdpSelectedCondition)) {
            Store.data.pdpSelectedCondition = inStock[inStock.length - 1];
          }
        }
        Store.data.pdpQuantity = 1;
        Store.data.pdpInspectorMode = 'front';
      }
    }

    if (route === 'catalog') {
      const catParam = params.get('cat');
      const eraParam = params.get('era');
      const qParam = (params.get('q') || '').trim();
      const setParam = params.get('set');
      const pageParam = parseInt(params.get('page') || '1', 10);
      Store.data.catalogFilters.category = catParam || 'all';
      Store.data.catalogFilters.era = catParam ? 'all' : (eraParam || 'all');
      Store.data.catalogFilters.set = setParam && typeof EXPANSIONES !== 'undefined' && EXPANSIONES.some(e => e.slug === setParam) ? setParam : 'all';
      Store.data.catalogFilters.page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
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
      // El seguimiento solo abre un pedido concreto si viene en la URL; si no, muestra la lista
      if (route === 'tracking') Store.data.trackingRequestedOrder = orderParam || null;
    }

    if (route === 'profile' && params.get('tab') === 'orders') {
      Store.data.profileActiveTab = 'orders';
    }

    if (route === 'auth' && ['register', 'recover'].includes(params.get('tab'))) {
      CheckoutView.authTab = params.get('tab');
    }

    Store.data.currentView = route;
    this.renderCurrentView();
  },

  updateCategoryNav() {
    const view = Store.data.currentView;
    const f = Store.data.catalogFilters;
    let key = '';
    if (view === 'catalog' && !f.searchQuery) {
      if (f.set && f.set !== 'all') key = 'set';
      else if (f.category !== 'all') key = `cat:${f.category}`;
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
    } else if (view === 'guide' && typeof GuideView !== 'undefined') {
      html = GuideView.render();
    } else if (view === 'search-results') {
      html = (typeof SearchResultsView !== 'undefined' && SearchResultsView.render)
        ? SearchResultsView.render(Store.data.searchQuery || '')
        : '<div class="p-8 text-center text-slate-500 font-bold">Cargando motor de búsqueda...</div>';
    } else {
      html = HomeView.render();
    }

    const focusKey = this.getFocusKey(container);
    container.innerHTML = html;
    this.refreshIcons();

    if (view === 'pdp') {
      PDPView.afterRender();
    } else if ((view === 'home' || !view) && typeof HomeView.afterRender === 'function') {
      HomeView.afterRender();
    } else if (view === 'search-results' && typeof SearchResultsView !== 'undefined' && SearchResultsView.afterRender) {
      SearchResultsView.afterRender();
    } else if (view === 'profile' && typeof ProfileView !== 'undefined' && ProfileView.afterRender) {
      ProfileView.afterRender();
    } else if (view === 'tracking' && typeof TrackingView !== 'undefined' && TrackingView.afterRender) {
      TrackingView.afterRender();
    } else if (view === 'guide' && typeof GuideView !== 'undefined' && GuideView.afterRender) {
      GuideView.afterRender();
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

    if (focusKey) this.restoreFocus(focusKey);
    else if (!this._firstRenderDone) this.focusHeadingAfterNavigation();
    this._firstRenderDone = true;
  },

  // Re-renderizar reemplaza el HTML: se recuerda qué control tenía el foco para devolvérselo
  getFocusKey(container) {
    if (typeof document === 'undefined') return null;
    const el = document.activeElement;
    if (!el || el === container || typeof container.contains !== 'function' || !container.contains(el)) return null;
    if (el.id) return { id: el.id };
    const onclick = el.getAttribute && el.getAttribute('onclick');
    if (onclick) return { onclick };
    return { heading: true };
  },

  restoreFocus(key) {
    let el = null;
    if (key.id) el = document.getElementById(key.id);
    else if (key.onclick) el = this.findByOnclick(key.onclick);
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
    else this.focusViewHeading();
  },

  findByOnclick(code) {
    const main = document.getElementById('app-view');
    if (!main || typeof main.querySelectorAll !== 'function') return null;
    return Array.from(main.querySelectorAll('[onclick]')).find(el => el.getAttribute('onclick') === code) || null;
  },

  // Al llegar desde otra página del sitio, el foco empieza en el encabezado de la vista
  focusHeadingAfterNavigation() {
    if (typeof document === 'undefined' || !document.referrer || window.location.hash) return;
    try {
      if (new URL(document.referrer).origin !== window.location.origin) return;
    } catch (_) {
      return;
    }
    const active = document.activeElement;
    if (active && active !== document.body) return;
    this.focusViewHeading();
  },

  openProductPDP(productId) {
    this.go('pdp', { id: productId });
  },

  openOrderTracking(orderId) {
    this.go('tracking', { order: orderId });
  },

  toggleFavorite(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    const name = product ? product.nombre : 'La pieza';
    const added = Store.toggleFavorite(productId);
    document.querySelectorAll(`[data-favorite-id="${productId}"]`).forEach(btn => {
      btn.setAttribute('aria-pressed', added ? 'true' : 'false');
      btn.setAttribute('aria-label', `${added ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${name}`);
    });
    if (!added && Store.data.currentView === 'catalog' && Store.data.catalogFilters.onlyFavorites) {
      CatalogView.refreshGridOnly();
    }
    this.showToast(added ? `"${name}" guardado en favoritos` : `"${name}" quitado de favoritos`, added ? 'success' : 'info');
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
    if (modal) this.openDialog('delete-confirm-modal');
  },

  cancelRemoveItem() {
    Store.data.pendingDeleteItemId = null;
    this.closeDialog('delete-confirm-modal');
  },

  confirmRemoveItem() {
    const id = Store.data.pendingDeleteItemId;
    Store.data.pendingDeleteItemId = null;
    this.closeDialog('delete-confirm-modal');
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
      this.refreshIcons();
      // El botón que abrió el diálogo desapareció con el ítem: el foco va a "Deshacer"
      const undoBtn = document.getElementById('undo-action-btn');
      if (undoBtn && typeof undoBtn.focus === 'function') undoBtn.focus();
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
    const restoredBtn = this.findByOnclick(`app.requestRemoveItem('${item.id}')`);
    if (restoredBtn) restoredBtn.focus();
    else this.focusViewHeading();
    this.showToast(`Ítem "${item.name}" restaurado a la bolsa`, 'success');
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      badge.innerText = Store.getCartCount();
    }
  },

  // ---- Diálogos modales: foco inicial, trampa de Tab, Esc y retorno del foco ----
  _dialogStack: [],
  _dialogTriggers: {},

  openDialog(id, initialFocusSelector) {
    const modal = document.getElementById(id);
    if (!modal) return null;
    if (!this._dialogStack.includes(id)) {
      this._dialogTriggers[id] = (typeof document !== 'undefined' && document.activeElement) || null;
      this._dialogStack.push(id);
    }
    modal.classList.add('active');
    if (typeof modal.setAttribute === 'function') modal.setAttribute('aria-hidden', 'false');
    if (document.body && document.body.classList) document.body.classList.add('overflow-hidden');
    this.refreshIcons();

    let target = null;
    if (typeof modal.querySelector === 'function') {
      target = (initialFocusSelector && modal.querySelector(initialFocusSelector)) || modal.querySelector('button');
    }
    if (target && typeof target.focus === 'function') target.focus();
    return modal;
  },

  closeDialog(id, returnFocusTo) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      if (typeof modal.setAttribute === 'function') modal.setAttribute('aria-hidden', 'true');
    }
    const trigger = this._dialogTriggers[id];
    delete this._dialogTriggers[id];
    this._dialogStack = this._dialogStack.filter(d => d !== id);
    if (!this._dialogStack.length && document.body && document.body.classList) {
      document.body.classList.remove('overflow-hidden');
    }
    const target = returnFocusTo || trigger;
    if (target && typeof target.focus === 'function' && target.isConnected !== false) target.focus();
  },

  getFocusable(container) {
    if (!container || typeof container.querySelectorAll !== 'function') return [];
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector))
      .filter(el => !el.closest || !el.closest('.hidden'));
  },

  trapDialogFocus(e) {
    const modal = document.getElementById(this._dialogStack[this._dialogStack.length - 1]);
    if (!modal) return;
    const items = this.getFocusable(modal);
    const active = document.activeElement;
    if (!items.length) {
      // Diálogo sin controles (pago en curso): el foco se queda en su contenido
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const inside = typeof modal.contains === 'function' && modal.contains(active);
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !inside)) {
      e.preventDefault();
      first.focus();
    }
  },

  openPSAGuideModal() {
    this.openDialog('psa-guide-modal', 'button[aria-label="Cerrar guía PSA"]');
  },

  closePSAGuideModal() {
    this.closeDialog('psa-guide-modal');
  },

  // "Saltar al contenido": con <base href="../"> el href recargaría la página y perdería ?id=
  setupSkipLink() {
    if (typeof document.querySelector !== 'function') return;
    const link = document.querySelector('.skip-link');
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.focusViewHeading(true);
    });
  },

  focusViewHeading(scroll) {
    const main = document.getElementById('app-view');
    if (!main) return;
    const target = (typeof main.querySelector === 'function' && main.querySelector('h1')) || main;
    if (typeof target.focus !== 'function') return;
    if (typeof target.hasAttribute === 'function' && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: !scroll });
    if (scroll && typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'start' });
  },

  handleNavAccountClick() {
    this.go(Store.data.currentUser ? 'profile' : 'auth');
  },

  async loginUser(email, password, redirectHome = true) {
    const emailMsg = Validators.email(email);
    if (emailMsg || !password) {
      this.showFormError(emailMsg || 'Ingresa tu contraseña.');
      this.showToast(emailMsg || 'Ingresa tu contraseña.', 'error');
      return false;
    }

    try {
      const user = await SupabaseAPI.login(email, password);
      this.showFormError('');
      this.startSession(user);
      this.showToast(`¡Hola, ${user.name}! Sesión iniciada.`, 'success');
      if (redirectHome) {
        this.go('profile');
      }
      return true;
    } catch (err) {
      this.showFormError(err.message);
      this.showToast(err.message, 'error');
      return false;
    }
  },

  // Error persistente junto al formulario de acceso: el toast desaparece a los 2.5 s (WCAG 3.3.1)
  showFormError(message) {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    document.querySelectorAll('[data-form-error]').forEach(el => {
      el.textContent = message || '';
      el.classList.toggle('hidden', !message);
    });
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

    const resultButtons = () => (dropdown && !dropdown.classList.contains('hidden'))
      ? this.getFocusable(dropdown)
      : [];

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Cierra el desplegable sin sacar el foco del buscador
        e.stopPropagation();
        closeSpotlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        closeSpotlight();
        this.executeGlobalSearch(searchInput.value);
      } else if (e.key === 'ArrowDown') {
        if (dropdown && dropdown.classList.contains('hidden')) openSpotlight();
        const items = resultButtons();
        if (items.length) {
          e.preventDefault();
          items[0].focus();
        }
      }
    });

    // Flechas arriba/abajo recorren los resultados; Esc vuelve al buscador
    if (dropdown) {
      dropdown.addEventListener('keydown', (e) => {
        const items = resultButtons();
        const idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
          if (next < 0) searchInput.focus();
          else items[Math.min(next, items.length - 1)].focus();
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          // Primero el foco (su listener reabre el desplegable) y luego se cierra
          searchInput.focus();
          closeSpotlight();
        }
      });
    }

    // Si el foco sale del buscador con Tab, se cierra el fondo oscurecido
    // (un clic dentro del buscador no cuenta: Safari no enfoca botones al pulsarlos)
    if (container) {
      let pointerInside = false;
      container.addEventListener('pointerdown', () => {
        pointerInside = true;
        setTimeout(() => { pointerInside = false; }, 0);
      });
      container.addEventListener('focusout', (e) => {
        if (pointerInside) return;
        if (!e.relatedTarget || !container.contains(e.relatedTarget)) closeSpotlight();
      });
    }

    backdrop.addEventListener('click', () => {
      searchInput.blur();
      closeSpotlight();
    });
  },

  renderLiveSearchDropdown(rawQuery) {
    const dropdown = document.getElementById('search-live-dropdown');
    if (!dropdown) return;

    const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const q = (rawQuery || '').toLowerCase().trim();
    // Buscador de la tienda: solo inventario con stock
    const inStock = p => typeof CatalogView === 'undefined' || !CatalogView.matchesCategory || CatalogView.matchesCategory(p, 'all');
    const matches = PRODUCTS.filter(p => inStock(p) && (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.set || '').toLowerCase().includes(q) ||
      (p.tipo || '').toLowerCase().includes(q)
    )).slice(0, 5);

    const footer = `
      <div class="p-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <a href="${this.url('catalog', { q })}" class="font-semibold text-[#BE123C] hover:text-[#9F1239] inline-flex items-center gap-1 px-1 py-1">
          Ver todos los resultados en la tienda →
        </a>
        <a href="${this.url('search-results', q ? { q } : null)}" class="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 px-1 py-1">
          <i data-lucide="database" class="w-3.5 h-3.5" aria-hidden="true"></i>
          Buscar en la base de cartas Pokémon (API)
        </a>
      </div>`;

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-slate-600">
          No tenemos productos disponibles para "${esc(rawQuery)}".
        </div>
        ${footer}
      `;
      dropdown.classList.remove('hidden');
      this.refreshIcons();
      return;
    }

    dropdown.innerHTML = `
      <div class="px-3 py-2 border-b border-slate-100 text-xs font-semibold text-slate-600 flex justify-between items-center">
        <span>En la tienda</span>
        <span>${matches.length} ${matches.length === 1 ? 'producto' : 'productos'}</span>
      </div>
      <div class="divide-y divide-slate-100">
        ${matches.map(card => {
          const opt = typeof CatalogView !== 'undefined' && CatalogView.getDisplayOption
            ? CatalogView.getDisplayOption(card, 'all')
            : { grade: 'raw', price: card.precios && card.precios.raw };
          const gradeLabel = typeof CatalogView !== 'undefined' && CatalogView.GRADE_LABELS ? CatalogView.GRADE_LABELS[opt.grade] : '';
          return `
          <button type="button" onclick="app.selectSpotlightProduct('${card.id}')" class="w-full text-left p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-md transition group">
            <span class="flex items-center gap-3">
              <img
                src="${card.imagenLocal}"
                alt=""
                width="36"
                height="48"
                loading="lazy"
                decoding="async"
                class="w-9 h-12 object-contain bg-[#F8FAFC] border border-slate-200 rounded p-0.5"
                onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
              />
              <span class="block">
                <span class="block text-xs font-semibold text-[#0F172A] group-hover:text-[#BE123C] transition">${card.nombre}</span>
                <span class="text-xs text-slate-600">${card.set} · ${card.rareza}</span>
              </span>
            </span>
            <span class="block text-right">
              <span class="text-xs font-bold text-[#0F172A]">$${Number(opt.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span class="block text-xs text-slate-600">${gradeLabel}</span>
            </span>
          </button>`;
        }).join('')}
      </div>
      ${footer}
    `;
    dropdown.classList.remove('hidden');
    this.refreshIcons();
  },

  selectSpotlightProduct(cardId) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const dropdown = document.getElementById('search-live-dropdown');
    if (backdrop) backdrop.classList.remove('active');
    if (dropdown) dropdown.classList.add('hidden');
    this.openProductPDP(cardId);
  },

  // Enter en el buscador de la navbar: busca en el inventario de la tienda (catálogo)
  executeGlobalSearch(query) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const dropdown = document.getElementById('search-live-dropdown');
    if (backdrop) backdrop.classList.remove('active');
    if (dropdown) dropdown.classList.add('hidden');

    const cleanQ = (query || '').trim();
    Store.data.searchQuery = cleanQ;
    Store.data.catalogFilters.searchQuery = cleanQ;
    this.go('catalog', cleanQ ? { q: cleanQ } : null);
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
    toast.className = 'pointer-events-auto bg-[#0F172A] text-white text-xs font-semibold px-4 py-3 rounded-md shadow-md border-l-4 flex items-center gap-2.5 transition-all transform translate-y-2 opacity-0';

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
    this.refreshIcons();

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

