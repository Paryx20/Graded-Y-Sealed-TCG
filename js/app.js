const app = {
  init() {
    Store.init();
    this.updateNavbarUserUI();
    this.updateCartBadge();
    this.setupSearchSpotlight();

    window.addEventListener('hashchange', () => this.handleRoute());
    if (!window.location.hash) {
      window.location.hash = '#home';
    } else {
      this.handleRoute();
    }
  },

  handleRoute() {
    this.closeCategoriesDrawer();
    const raw = window.location.hash.replace(/^#/, '').trim();
    const parts = raw.split('?');
    const route = (parts[0] || 'home').toLowerCase();
    const params = new URLSearchParams(parts[1] || '');

    if (route === 'pdp') {
      const prodId = params.get('id');
      if (prodId) {
        const found = PRODUCTS.find(p => p.id === prodId);
        if (found) {
          Store.data.currentPdpProduct = found;
          Store.data.pdpSelectedCondition = found.condicionPrincipal === 'psa9' ? 'psa9' : 'psa10';
          Store.data.pdpQuantity = 1;
          Store.data.pdpInspectorMode = 'front';
        }
      }
      Store.data.currentView = 'pdp';
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === 'catalog') {
      const catParam = params.get('cat');
      const eraParam = params.get('era');
      const qParam = params.get('q');

      if (catParam) {
        Store.data.catalogFilters.category = catParam;
        Store.data.catalogFilters.era = 'all';
      } else if (eraParam) {
        Store.data.catalogFilters.era = eraParam;
        Store.data.catalogFilters.category = 'all';
      } else if (!qParam) {
        Store.data.catalogFilters.category = 'all';
        Store.data.catalogFilters.era = 'all';
      }

      if (qParam !== null) {
        Store.data.catalogFilters.searchQuery = qParam;
      }

      Store.data.currentView = 'catalog';
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === 'tracking') {
      const orderParam = params.get('order');
      if (orderParam) {
        Store.data.activeTrackingOrderId = orderParam;
      }
      Store.data.currentView = 'tracking';
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validRoutes = ['home', 'cart', 'checkout', 'confirmation', 'error', 'auth', 'profile'];
    Store.data.currentView = validRoutes.includes(route) ? route : 'home';
    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderCurrentView() {
    const container = document.getElementById('app-view');
    if (!container) return;

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
    } else {
      html = HomeView.render();
    }

    container.innerHTML = html;
    lucide.createIcons();

    if (view === 'pdp') {
      PDPView.afterRender();
    }
  },

  openProductPDP(productId) {
    const found = PRODUCTS.find(p => p.id === productId);
    if (!found) return;
    Store.data.currentPdpProduct = found;
    Store.data.pdpSelectedCondition = found.condicionPrincipal === 'psa9' ? 'psa9' : 'psa10';
    Store.data.pdpQuantity = 1;
    Store.data.pdpInspectorMode = 'front';

    const targetHash = `#pdp?id=${found.id}`;
    if (window.location.hash === targetHash) {
      Store.data.currentView = 'pdp';
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = targetHash;
    }
  },

  openOrderTracking(orderId) {
    Store.data.activeTrackingOrderId = orderId;
    const targetHash = `#tracking?order=${encodeURIComponent(orderId)}`;
    if (window.location.hash === targetHash) {
      Store.data.currentView = 'tracking';
      this.renderCurrentView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.hash = targetHash;
    }
  },

  openCategoriesDrawer() {
    const drawer = document.getElementById('categories-drawer');
    if (drawer) drawer.classList.add('active');
  },

  closeCategoriesDrawer() {
    const drawer = document.getElementById('categories-drawer');
    if (drawer) drawer.classList.remove('active');
  },

  addToCart(id, name, condition, price, imageLocal, imageFallback, qty = 1) {
    const units = Math.max(1, parseInt(qty, 10) || 1);
    const existing = Store.data.cart.find(c => c.id === id);
    if (existing) {
      existing.quantity += units;
    } else {
      Store.data.cart.push({
        id,
        name,
        condition,
        price,
        quantity: units,
        imageLocal: imageLocal || 'img/charizard-base.png',
        imageFallback: imageFallback || 'https://images.pokemontcg.io/base1/4_hires.png'
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
      lucide.createIcons();
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
      lucide.createIcons();
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
      modal.classList.add('active');
      lucide.createIcons();
    }
  },

  closePSAGuideModal() {
    const modal = document.getElementById('psa-guide-modal');
    if (modal) modal.classList.remove('active');
  },

  handleNavAccountClick() {
    if (Store.data.currentUser) {
      window.location.hash = '#profile';
    } else {
      window.location.hash = '#auth';
    }
  },

  loginUser(email, password, redirectHome = true) {
    if (!email || !password) {
      this.showToast('Ingresa tu correo y contraseña.', 'error');
      return;
    }

    const matched = Store.data.users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );

    const userObj = matched || {
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email.trim(),
      idCard: '1710034065',
      phone: '+593 0991234567',
      city: 'Quito',
      address: 'Av. República del Salvador N34-183, Quito'
    };

    Store.data.currentUser = userObj;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast(`¡Bienvenido a la bóveda, ${userObj.name}!`, 'success');

    if (redirectHome) {
      window.location.hash = '#profile';
    }
  },

  logoutUser() {
    Store.data.currentUser = null;
    Store.saveUserSession();
    this.updateNavbarUserUI();
    this.showToast('Sesión cerrada correctamente.', 'info');
    window.location.hash = '#home';
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
      <div class="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
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
                <h4 class="text-xs font-extrabold text-[#0F172A] group-hover:text-[#E11D48] transition">${card.nombre}</h4>
                <span class="text-[10px] text-slate-500">${card.set} • ${card.rareza}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-[#0F172A]">$${card.precios.psa10.toLocaleString('en-US')}</span>
              <span class="block text-[9px] text-[#D97706] font-bold">PSA 10</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="p-2 border-t border-slate-100 text-center">
        <button type="button" onclick="app.executeGlobalSearch('${q.replace(/'/g, '')}')" class="text-xs font-extrabold text-[#E11D48] hover:text-[#BE123C]">
          Filtrar resultados en el Catálogo Avanzado →
        </button>
      </div>
    `;
    dropdown.classList.remove('hidden');
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

    Store.data.catalogFilters.searchQuery = (query || '').trim();
    Store.data.catalogFilters.category = 'all';
    Store.data.catalogFilters.era = 'all';
    window.location.hash = `#catalog?q=${encodeURIComponent(Store.data.catalogFilters.searchQuery)}`;
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
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
    lucide.createIcons();

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

