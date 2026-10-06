/**
 * Graded & Sealed TCG - Modular Web Application Engine
 * IHC & WCAG 2.2 Compliant Commercial Architecture
 */

const APP_CONFIG = {
  TAX_RATE: 0.15, // IVA Ecuador 15%
  COURIER_SHIPPING_FEE: 25.00,
  PICKUP_SHIPPING_FEE: 0.00,
  ITEMS_PER_PAGE: 4
};

// 12-Month Market Historical Data per Condition
const MARKET_HISTORY_DATA = {
  psa10: {
    points: [
      { month: 'Oct 2025', price: 14800, trend: '+0.0%' },
      { month: 'Nov 2025', price: 15200, trend: '+2.7%' },
      { month: 'Dic 2025', price: 15500, trend: '+4.7%' },
      { month: 'Ene 2026', price: 15900, trend: '+7.4%' },
      { month: 'Feb 2026', price: 16400, trend: '+10.8%' },
      { month: 'Mar 2026', price: 16800, trend: '+13.5%' },
      { month: 'Abr 2026', price: 17100, trend: '+15.5%' },
      { month: 'May 2026', price: 17400, trend: '+17.5%' },
      { month: 'Jun 2026', price: 17650, trend: '+19.2%' },
      { month: 'Jul 2026', price: 17900, trend: '+20.9%' },
      { month: 'Ago 2026', price: 18200, trend: '+22.9%' },
      { month: 'Sep 2026 (Hoy)', price: 18500, trend: '+25.0%' }
    ],
    trendBadge: '+21.7%',
    isPositive: true
  },
  psa9: {
    points: [
      { month: 'Oct 2025', price: 4300, trend: '+0.0%' },
      { month: 'Nov 2025', price: 4350, trend: '+1.1%' },
      { month: 'Dic 2025', price: 4420, trend: '+2.7%' },
      { month: 'Ene 2026', price: 4480, trend: '+4.1%' },
      { month: 'Feb 2026', price: 4520, trend: '+5.1%' },
      { month: 'Mar 2026', price: 4580, trend: '+6.5%' },
      { month: 'Abr 2026', price: 4620, trend: '+7.4%' },
      { month: 'May 2026', price: 4690, trend: '+9.0%' },
      { month: 'Jun 2026', price: 4720, trend: '+9.7%' },
      { month: 'Jul 2026', price: 4760, trend: '+10.6%' },
      { month: 'Ago 2026', price: 4800, trend: '+11.6%' },
      { month: 'Sep 2026 (Hoy)', price: 4850, trend: '+12.7%' }
    ],
    trendBadge: '+8.5%',
    isPositive: true
  },
  psa8: {
    points: [
      { month: 'Oct 2025', price: 1720, trend: '+0.0%' },
      { month: 'Nov 2025', price: 1730, trend: '+0.5%' },
      { month: 'Dic 2025', price: 1740, trend: '+1.1%' },
      { month: 'Ene 2026', price: 1745, trend: '+1.4%' },
      { month: 'Feb 2026', price: 1750, trend: '+1.7%' },
      { month: 'Mar 2026', price: 1760, trend: '+2.3%' },
      { month: 'Abr 2026', price: 1770, trend: '+2.9%' },
      { month: 'May 2026', price: 1780, trend: '+3.4%' },
      { month: 'Jun 2026', price: 1785, trend: '+3.7%' },
      { month: 'Jul 2026', price: 1790, trend: '+4.0%' },
      { month: 'Ago 2026', price: 1795, trend: '+4.3%' },
      { month: 'Sep 2026 (Hoy)', price: 1800, trend: '+4.6%' }
    ],
    trendBadge: '+3.2%',
    isPositive: true
  },
  raw: {
    points: [
      { month: 'Oct 2025', price: 780, trend: '+0.0%' },
      { month: 'Nov 2025', price: 775, trend: '-0.6%' },
      { month: 'Dic 2025', price: 770, trend: '-1.2%' },
      { month: 'Ene 2026', price: 765, trend: '-1.9%' },
      { month: 'Feb 2026', price: 760, trend: '-2.5%' },
      { month: 'Mar 2026', price: 755, trend: '-3.2%' },
      { month: 'Abr 2026', price: 750, trend: '-3.8%' },
      { month: 'May 2026', price: 755, trend: '-3.2%' },
      { month: 'Jun 2026', price: 750, trend: '-3.8%' },
      { month: 'Jul 2026', price: 748, trend: '-4.1%' },
      { month: 'Ago 2026', price: 745, trend: '-4.4%' },
      { month: 'Sep 2026 (Hoy)', price: 750, trend: '-3.8%' }
    ],
    trendBadge: '-1.8%',
    isPositive: false
  }
};

const app = {
  // Global reactive state
  state: {
    currentView: 'view-home',
    activeCategory: 'Todas',
    searchQuery: '',
    advancedFilters: {
      type: 'all',
      rarity: 'all',
      minPrice: null,
      maxPrice: null
    },
    currentPage: 1,
    cart: [
      {
        id: 'charizard-psa10',
        name: 'Charizard Base Set 1999 #4/102',
        condition: 'PSA 10 GEM MT • Cert #48291034',
        price: 18500.00,
        quantity: 1,
        image: 'https://images.pokemontcg.io/base1/4_hires.png'
      },
      {
        id: 'umbreon-raw',
        name: 'Umbreon VMAX Moonbreon Alt Art',
        condition: 'Sin Gradear / Raw (Near Mint)',
        price: 780.00,
        quantity: 1,
        image: 'https://images.pokemontcg.io/swsh7/215_hires.png'
      },
      {
        id: 'booster-rocket',
        name: 'Booster Pack Team Rocket 1999',
        condition: 'Sellado de Fábrica (21.2g Heavy Pack)',
        price: 350.00,
        quantity: 1,
        image: 'https://images.pokemontcg.io/base1/logo.png'
      }
    ],
    lastDeletedItem: null,
    deliveryMethod: 'courier', // 'courier' or 'pickup'
    shippingFee: APP_CONFIG.COURIER_SHIPPING_FEE,
    currentUser: null,
    // PDP condition state
    pdpCondition: {
      id: 'psa10',
      price: 18500.00,
      label: 'PSA 10 GEM MT'
    },
    lastGeneratedOrder: null
  },

  // Expanded Catalog with multiple types, rarities and pages
  catalog: [
    {
      id: 'charizard-1st',
      name: 'Charizard Base Set 1st Ed.',
      grade: 'PSA 9 MINT • Holo 1999',
      category: 'Solo PSA',
      type: 'Fuego',
      rarity: 'Holo Rare',
      price: 4850.00,
      image: 'https://images.pokemontcg.io/base1/4_hires.png',
      alt: 'Charizard 1st Edition Base Set PSA 9'
    },
    {
      id: 'gengar-vmax',
      name: 'Gengar VMAX Secret Rare',
      grade: 'PSA 10 GEM MT • Fusion Strike',
      category: 'Solo PSA',
      type: 'Psíquico',
      rarity: 'Secret Rare',
      price: 620.00,
      image: 'https://images.pokemontcg.io/swsh8/271_hires.png',
      alt: 'Gengar VMAX Alt Art PSA 10'
    },
    {
      id: 'umbreon-vmax',
      name: 'Umbreon VMAX Moonbreon',
      grade: 'Sin Gradear / Raw (Near Mint)',
      category: 'Cartas Sueltas',
      type: 'Oscuridad',
      rarity: 'Secret Rare',
      price: 780.00,
      image: 'https://images.pokemontcg.io/swsh7/215_hires.png',
      alt: 'Umbreon VMAX Evolving Skies Raw'
    },
    {
      id: 'lugia-neo',
      name: 'Lugia 1st Edition Neo Gen',
      grade: 'PSA 8 NM-MT • Holo 2000',
      category: 'Solo PSA',
      type: 'Psíquico',
      rarity: 'Holo Rare',
      price: 1450.00,
      image: 'https://images.pokemontcg.io/neo1/9_hires.png',
      alt: 'Lugia Neo Genesis 1st Edition PSA 8'
    },
    {
      id: 'booster-team-rocket',
      name: 'Booster Pack Team Rocket 1999',
      grade: 'Sellado de Fábrica (Heavy 21.2g)',
      category: 'Booster Packs',
      type: 'Oscuridad',
      rarity: 'Promo',
      price: 350.00,
      image: 'https://images.pokemontcg.io/base1/logo.png',
      alt: 'Sobre sellado Team Rocket 1999'
    },
    {
      id: 'pikachu-illustrator',
      name: 'Pikachu Illustrator CoroCoro',
      grade: 'PSA 7 NR-MT • Promo Japonesa',
      category: 'Solo PSA',
      type: 'Eléctrico',
      rarity: 'Promo',
      price: 85000.00,
      image: 'https://images.pokemontcg.io/basep/1_hires.png',
      alt: 'Pikachu Illustrator Promo'
    },
    {
      id: 'rayquaza-gold-star',
      name: 'Rayquaza Gold Star EX',
      grade: 'Sin Gradear / Lightly Played',
      category: 'Cartas Sueltas',
      type: 'Fuego',
      rarity: 'Gold Star',
      price: 2100.00,
      image: 'https://images.pokemontcg.io/ex1/96_hires.png',
      alt: 'Rayquaza Gold Star EX Deoxys'
    },
    {
      id: 'blastoise-shadowless',
      name: 'Blastoise Shadowless Base',
      grade: 'PSA 8.5 NM-MT+ • 1999',
      category: 'Solo PSA',
      type: 'Agua',
      rarity: 'Holo Rare',
      price: 950.00,
      image: 'https://images.pokemontcg.io/base1/2_hires.png',
      alt: 'Blastoise Shadowless Base Set'
    }
  ],

  // =========================================================================
  // BOOTSTRAP & INITIALIZATION
  // =========================================================================
  init() {
    this.initSessionFromStorage();
    this.initRouter();
    this.renderCatalog();
    this.renderCart();
    this.updateCartBadge();
    this.setupPDPChartInteractions();
    this.setupSearchInputListener();
    lucide.createIcons();
  },

  // =========================================================================
  // REQUERIMIENTO 2: HASH ROUTER CON BOTÓN ATRÁS NATIVO
  // =========================================================================
  initRouter() {
    // Listen for browser navigation (Back / Forward / direct link)
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());

    // Process initial hash or default to #home
    if (!window.location.hash) {
      window.location.hash = '#home';
    } else {
      this.handleHashChange();
    }
  },

  handleHashChange() {
    const rawHash = window.location.hash.replace(/^#/, '').toLowerCase().trim();
    const routeMap = {
      'home': 'view-home',
      'pdp': 'view-pdp',
      'cart': 'view-cart',
      'checkout': 'view-checkout',
      'confirmation': 'view-confirmation',
      'tracking': 'view-tracking',
      'auth': 'view-login',
      'error': 'view-payment-error'
    };

    const targetViewId = routeMap[rawHash] || 'view-home';
    this.activateView(targetViewId, false);
  },

  navigateTo(target, updateHash = true) {
    const viewToHashMap = {
      'view-home': 'home',
      'view-pdp': 'pdp',
      'view-cart': 'cart',
      'view-checkout': 'checkout',
      'view-confirmation': 'confirmation',
      'view-tracking': 'tracking',
      'view-login': 'auth',
      'view-payment-error': 'error',
      // Allow passing short names directly
      'home': 'home',
      'pdp': 'pdp',
      'cart': 'cart',
      'checkout': 'checkout',
      'confirmation': 'confirmation',
      'tracking': 'tracking',
      'auth': 'auth',
      'error': 'error'
    };

    const hashName = viewToHashMap[target] || 'home';
    if (updateHash) {
      if (window.location.hash === `#${hashName}`) {
        this.handleHashChange();
      } else {
        window.location.hash = `#${hashName}`;
      }
    } else {
      this.activateView(target, false);
    }
  },

  activateView(viewId, updateHash = true) {
    if (!viewId.startsWith('view-')) {
      const aliasMap = {
        'home': 'view-home',
        'pdp': 'view-pdp',
        'cart': 'view-cart',
        'checkout': 'view-checkout',
        'confirmation': 'view-confirmation',
        'tracking': 'view-tracking',
        'auth': 'view-login',
        'error': 'view-payment-error'
      };
      viewId = aliasMap[viewId] || 'view-home';
    }

    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.remove('active');
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      this.state.currentView = viewId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lucide.createIcons();

      // View-specific hooks
      if (viewId === 'view-pdp') {
        this.drawPDPChart();
      } else if (viewId === 'view-checkout') {
        this.syncCheckoutWithSession();
      }
    }
  },

  // =========================================================================
  // REQUERIMIENTO 6: SESIÓN Y USUARIOS CON LOCALSTORAGE
  // =========================================================================
  initSessionFromStorage() {
    try {
      const savedUserJson = localStorage.getItem('gstcg_user');
      if (savedUserJson) {
        this.state.currentUser = JSON.parse(savedUserJson);
      }
    } catch (e) {
      console.warn('No se pudo acceder a localStorage:', e);
    }
    this.updateUserNavbarUI();
  },

  updateUserNavbarUI() {
    const userLabel = document.getElementById('nav-user-label');
    const userBtn = document.getElementById('btn-nav-account');
    const logoutBtn = document.getElementById('btn-nav-logout');

    if (this.state.currentUser) {
      const shortName = this.state.currentUser.name.split(' ')[0];
      if (userLabel) userLabel.innerText = `${shortName}`;
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (userBtn) {
        userBtn.setAttribute('title', `Sesión iniciada: ${this.state.currentUser.name}`);
        userBtn.classList.add('border-brand-red', 'bg-red-50');
      }
    } else {
      if (userLabel) userLabel.innerText = 'Mi Cuenta';
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (userBtn) {
        userBtn.removeAttribute('title');
        userBtn.classList.remove('border-brand-red', 'bg-red-50');
      }
    }
  },

  syncCheckoutWithSession() {
    const nameInput = document.getElementById('guest-name');
    const idInput = document.getElementById('guest-id');
    const emailInput = document.getElementById('guest-email');
    const phoneInput = document.getElementById('guest-phone');

    if (this.state.currentUser) {
      if (nameInput) nameInput.value = this.state.currentUser.name || '';
      if (idInput) idInput.value = this.state.currentUser.idCard || '';
      if (emailInput) emailInput.value = this.state.currentUser.email || '';
      if (phoneInput) phoneInput.value = this.state.currentUser.phone || '';
    } else {
      // Clean placeholders for commercial view - do not hardcode Patrick Mora
      if (nameInput && nameInput.value === 'Patrick Mora') nameInput.value = '';
      if (idInput && idInput.value === '1724589201') idInput.value = '';
      if (emailInput && emailInput.value === 'patrick.mora@puce.edu.ec') emailInput.value = '';
    }
  },

  handleLogin(email, password) {
    if (!email || !password) {
      this.showToast('Por favor completa tu correo y contraseña.', 'error');
      return;
    }

    let existingUsers = [];
    try {
      existingUsers = JSON.parse(localStorage.getItem('gstcg_users') || '[]');
    } catch (e) {}

    const matched = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const userObj = matched || {
      name: email.split('@')[0].toUpperCase(),
      email: email,
      idCard: '1720000000',
      phone: '+593 99 000 0000'
    };

    this.state.currentUser = userObj;
    localStorage.setItem('gstcg_user', JSON.stringify(userObj));
    this.updateUserNavbarUI();
    this.syncCheckoutWithSession();
    this.showToast(`¡Bienvenido de vuelta, ${userObj.name}!`, 'success');
    this.navigateTo('home');
  },

  handleRegister(name, idCard, email, password) {
    if (!name || !email || !password) {
      this.showToast('Por favor llena todos los campos obligatorios.', 'error');
      return;
    }

    const newUser = {
      name: name.trim(),
      idCard: (idCard || '').trim(),
      email: email.trim(),
      phone: '+593 99 123 4567'
    };

    try {
      let existingUsers = JSON.parse(localStorage.getItem('gstcg_users') || '[]');
      existingUsers.push(newUser);
      localStorage.setItem('gstcg_users', JSON.stringify(existingUsers));
      localStorage.setItem('gstcg_user', JSON.stringify(newUser));
    } catch (e) {}

    this.state.currentUser = newUser;
    this.updateUserNavbarUI();
    this.syncCheckoutWithSession();
    this.showToast(`Cuenta creada exitosamente. ¡Bienvenido, ${newUser.name}!`, 'success');
    this.navigateTo('home');
  },

  logoutUser() {
    this.state.currentUser = null;
    try {
      localStorage.removeItem('gstcg_user');
    } catch (e) {}
    this.updateUserNavbarUI();
    this.syncCheckoutWithSession();
    this.showToast('Sesión cerrada con éxito.', 'info');
  },

  // =========================================================================
  // REQUERIMIENTO 5: PDP & GRÁFICA INTERACTIVA CON MOUSE HOVER / TOUCH
  // =========================================================================
  setCondition(condId, price, label) {
    this.state.pdpCondition = { id: condId, price, label };

    // Update active segmented buttons
    document.querySelectorAll('.cond-btn').forEach(btn => {
      btn.className = 'cond-btn p-3 rounded-xl border border-slate-200 text-left hover:border-slate-400 transition bg-white';
      const priceDiv = btn.querySelector('.cond-price');
      if (priceDiv) priceDiv.className = 'cond-price text-sm font-black text-brand-muted';
      const titleDiv = btn.querySelector('.cond-title');
      if (titleDiv) titleDiv.className = 'cond-title text-xs font-bold text-brand-charcoal';
      const checkIcon = btn.querySelector('.check-indicator');
      if (checkIcon) checkIcon.classList.add('hidden');
    });

    const activeBtn = document.getElementById(`cond-${condId}`);
    if (activeBtn) {
      activeBtn.className = 'cond-btn p-3 rounded-xl bg-brand-charcoal text-white text-left shadow transition';
      const priceDiv = activeBtn.querySelector('.cond-price');
      if (priceDiv) priceDiv.className = 'cond-price text-sm font-black text-amber-400';
      const titleDiv = activeBtn.querySelector('.cond-title');
      if (titleDiv) titleDiv.className = 'cond-title text-xs font-bold text-white';
      const checkIcon = activeBtn.querySelector('.check-indicator');
      if (checkIcon) checkIcon.classList.remove('hidden');
    }

    // Update main PDP price display
    const priceEl = document.getElementById('pdp-price');
    if (priceEl) {
      priceEl.innerText = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
    }

    // Update certification badge
    const badgeEl = document.getElementById('pdp-cert-badge');
    if (badgeEl) {
      badgeEl.innerText = `${label} #48291034`;
    }

    // Redraw SVG Chart reactively
    this.drawPDPChart();
    this.showToast(`Grado actualizado a: ${label} ($${price.toLocaleString('en-US')})`, 'info');
  },

  drawPDPChart() {
    const condKey = this.state.pdpCondition.id || 'psa10';
    const market = MARKET_HISTORY_DATA[condKey] || MARKET_HISTORY_DATA.psa10;

    const trendPill = document.getElementById('market-trend-pill');
    if (trendPill) {
      trendPill.innerText = market.trendBadge;
      if (market.isPositive) {
        trendPill.className = 'text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded';
      } else {
        trendPill.className = 'text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded';
      }
    }

    const svg = document.getElementById('pdp-interactive-chart');
    if (!svg) return;

    const width = 400;
    const height = 130;
    const paddingX = 30;
    const paddingY = 25;
    const plotW = width - (paddingX * 2);
    const plotH = height - (paddingY * 2);

    const prices = market.points.map(p => p.price);
    const minP = Math.min(...prices) * 0.96;
    const maxP = Math.max(...prices) * 1.04;

    const coords = market.points.map((pt, idx) => {
      const x = paddingX + (idx / (market.points.length - 1)) * plotW;
      const normalizedY = (pt.price - minP) / (maxP - minP);
      const y = height - paddingY - (normalizedY * plotH);
      return { x, y, pt };
    });

    // Generate polyline string
    const pointsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const polylineEl = document.getElementById('chart-polyline');
    if (polylineEl) {
      polylineEl.setAttribute('points', pointsStr);
      polylineEl.setAttribute('stroke', market.isPositive ? '#16A34A' : '#DC2626');
    }

    // Active end dot
    const lastCoord = coords[coords.length - 1];
    const activeDot = document.getElementById('chart-active-dot');
    if (activeDot) {
      activeDot.setAttribute('cx', lastCoord.x);
      activeDot.setAttribute('cy', lastCoord.y);
      activeDot.setAttribute('fill', market.isPositive ? '#16A34A' : '#DC2626');
    }

    // Save coords in DOM for hover lookup
    svg._chartCoords = coords;
  },

  setupPDPChartInteractions() {
    const container = document.getElementById('pdp-chart-container');
    const svg = document.getElementById('pdp-interactive-chart');
    const tooltip = document.getElementById('chart-hover-tooltip');
    const guideLine = document.getElementById('chart-guide-line');
    const hoverDot = document.getElementById('chart-hover-dot');

    if (!container || !svg || !tooltip) return;

    const handlePointerMove = (e) => {
      if (!svg._chartCoords || svg._chartCoords.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (clientX < rect.left || clientX > rect.right) {
        hideTooltip();
        return;
      }

      // Normalized SVG X coordinate (0 to 400)
      const svgX = ((clientX - rect.left) / rect.width) * 400;

      // Find nearest point
      let nearest = svg._chartCoords[0];
      let minDiff = Infinity;
      for (const c of svg._chartCoords) {
        const diff = Math.abs(c.x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = c;
        }
      }

      // Show and position guide line and dot
      if (guideLine) {
        guideLine.setAttribute('x1', nearest.x);
        guideLine.setAttribute('x2', nearest.x);
        guideLine.setAttribute('y1', 15);
        guideLine.setAttribute('y2', 115);
        guideLine.style.display = 'block';
      }

      if (hoverDot) {
        hoverDot.setAttribute('cx', nearest.x);
        hoverDot.setAttribute('cy', nearest.y);
        hoverDot.style.display = 'block';
      }

      // Tooltip position (in CSS pixels relative to container)
      const pixelX = (nearest.x / 400) * rect.width;
      const pixelY = (nearest.y / 130) * rect.height;

      tooltip.style.left = `${pixelX}px`;
      tooltip.style.top = `${pixelY - 12}px`;
      tooltip.style.opacity = '1';

      // Update tooltip contents
      const isUp = !nearest.pt.trend.startsWith('-');
      tooltip.innerHTML = `
        <div class="px-2.5 py-1.5 bg-brand-charcoal text-white rounded-lg shadow-xl text-[11px] border border-slate-700 whitespace-nowrap">
          <div class="text-[10px] text-slate-400 font-bold">${nearest.pt.month}</div>
          <div class="font-black text-xs text-white mt-0.5">$${nearest.pt.price.toLocaleString('en-US')} USD</div>
          <div class="text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1 mt-0.5">
            <span>${nearest.pt.trend}</span>
            <span>${isUp ? '▲' : '▼'}</span>
          </div>
        </div>
      `;
    };

    const hideTooltip = () => {
      tooltip.style.opacity = '0';
      if (guideLine) guideLine.style.display = 'none';
      if (hoverDot) hoverDot.style.display = 'none';
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', hideTooltip);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchend', hideTooltip);
  },

  selectPDPThumbnail(imgSrc, label) {
    const mainImg = document.getElementById('pdp-main-image');
    if (mainImg) {
      mainImg.src = imgSrc;
      this.showToast(`Vista de carta: ${label}`, 'info');
    }
  },

  addToCartCurrentPdp() {
    const item = this.state.pdpCondition;
    this.addToCart(
      'charizard-pdp',
      'Charizard Base Set 1999 #4/102',
      item.label,
      item.price,
      'https://images.pokemontcg.io/base1/4_hires.png'
    );
  },

  // =========================================================================
  // REQUERIMIENTO 7: FILTROS INTERACTIVOS, BÚSQUEDA Y PAGINACIÓN
  // =========================================================================
  setupSearchInputListener() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.toLowerCase().trim();
        this.state.currentPage = 1;
        this.renderCatalog();
      });
    }
  },

  filterCategory(category) {
    this.state.activeCategory = category;
    this.state.currentPage = 1;

    // Update chips style
    document.querySelectorAll('.filter-chip').forEach(btn => {
      const btnCat = btn.getAttribute('data-cat') || btn.innerText;
      if (btnCat.includes(category)) {
        btn.className = 'filter-chip px-4 py-2 text-xs font-bold rounded-full bg-brand-red text-white transition shadow-sm';
      } else {
        btn.className = 'filter-chip px-4 py-2 text-xs font-bold rounded-full border border-slate-300 text-brand-charcoal hover:bg-slate-100 transition';
      }
    });

    this.renderCatalog();
    this.navigateTo('home');
  },

  openAdvancedFilters() {
    const drawer = document.getElementById('advanced-filters-drawer');
    if (drawer) drawer.classList.add('active');
  },

  closeAdvancedFilters() {
    const drawer = document.getElementById('advanced-filters-drawer');
    if (drawer) drawer.classList.remove('active');
  },

  applyAdvancedFilters() {
    const typeSelect = document.getElementById('filter-type');
    const raritySelect = document.getElementById('filter-rarity');
    const minPriceInput = document.getElementById('filter-min-price');
    const maxPriceInput = document.getElementById('filter-max-price');

    this.state.advancedFilters = {
      type: typeSelect ? typeSelect.value : 'all',
      rarity: raritySelect ? raritySelect.value : 'all',
      minPrice: minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null,
      maxPrice: maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null
    };

    this.state.currentPage = 1;
    this.closeAdvancedFilters();
    this.renderCatalog();
    this.showToast('Filtros avanzados aplicados al catálogo.', 'success');
  },

  resetAdvancedFilters() {
    this.state.advancedFilters = { type: 'all', rarity: 'all', minPrice: null, maxPrice: null };
    const t = document.getElementById('filter-type'); if (t) t.value = 'all';
    const r = document.getElementById('filter-rarity'); if (r) r.value = 'all';
    const min = document.getElementById('filter-min-price'); if (min) min.value = '';
    const max = document.getElementById('filter-max-price'); if (max) max.value = '';

    this.state.currentPage = 1;
    this.closeAdvancedFilters();
    this.renderCatalog();
    this.showToast('Filtros avanzados restablecidos.', 'info');
  },

  setPage(page) {
    this.state.currentPage = page;
    this.renderCatalog();
    window.scrollTo({ top: 320, behavior: 'smooth' });
  },

  getFilteredCatalog() {
    return this.catalog.filter(card => {
      // Category filter
      if (this.state.activeCategory !== 'Todas' && card.category !== this.state.activeCategory) {
        return false;
      }
      // Search query filter
      if (this.state.searchQuery) {
        const matchesName = card.name.toLowerCase().includes(this.state.searchQuery);
        const matchesGrade = card.grade.toLowerCase().includes(this.state.searchQuery);
        if (!matchesName && !matchesGrade) return false;
      }
      // Advanced Filters
      const adv = this.state.advancedFilters;
      if (adv.type !== 'all' && card.type !== adv.type) return false;
      if (adv.rarity !== 'all' && card.rarity !== adv.rarity) return false;
      if (adv.minPrice !== null && card.price < adv.minPrice) return false;
      if (adv.maxPrice !== null && card.price > adv.maxPrice) return false;

      return true;
    });
  },

  renderCatalog() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const filtered = this.getFilteredCatalog();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / APP_CONFIG.ITEMS_PER_PAGE) || 1;

    if (this.state.currentPage > totalPages) this.state.currentPage = 1;

    const startIndex = (this.state.currentPage - 1) * APP_CONFIG.ITEMS_PER_PAGE;
    const pagedItems = filtered.slice(startIndex, startIndex + APP_CONFIG.ITEMS_PER_PAGE);

    if (pagedItems.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white border border-brand-border rounded-2xl p-8">
          <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
          <h3 class="text-base font-bold text-brand-charcoal">No se encontraron cartas con esos criterios</h3>
          <p class="text-xs text-brand-muted mt-1">Intenta cambiar los términos de búsqueda o borrar los filtros aplicados.</p>
          <button onclick="app.resetAdvancedFilters(); app.filterCategory('Todas');" class="mt-4 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg">
            Ver todas las cartas
          </button>
        </div>
      `;
      this.renderPagination(0, 0, 1);
      lucide.createIcons();
      return;
    }

    // Clean commercial rendering: NO floating alt debug boxes
    grid.innerHTML = pagedItems.map(card => `
      <article class="bg-white border border-brand-border rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <div class="aspect-[3/4] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-3 relative">
            <img 
              src="${card.image}" 
              alt="${card.alt}" 
              class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
              onerror="this.src='https://placehold.co/400x550/F1F5F9/64748B?text=Pokemon+Card'"
            />
          </div>

          <div class="mt-3">
            <span class="inline-block text-[10px] font-bold text-brand-muted uppercase tracking-wider">${card.type} • ${card.rarity}</span>
            <h3 class="font-extrabold text-sm sm:text-base text-brand-charcoal mt-0.5 line-clamp-1">${card.name}</h3>
            <p class="text-xs text-brand-muted mt-0.5">${card.grade}</p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-base font-black text-brand-charcoal">$${card.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <button 
            type="button" 
            onclick="app.handleCardClick('${card.id}')"
            class="px-3.5 py-1.5 text-xs font-extrabold text-brand-red border border-brand-red hover:bg-brand-red hover:text-white rounded-lg transition"
            aria-label="Ver detalles de ${card.name}"
          >
            Ver detalle
          </button>
        </div>
      </article>
    `).join('');

    this.renderPagination(startIndex, pagedItems.length, totalItems);
    lucide.createIcons();
  },

  renderPagination(startIndex, pageCount, totalItems) {
    const pagContainer = document.getElementById('catalog-pagination');
    if (!pagContainer) return;

    const totalPages = Math.ceil(totalItems / APP_CONFIG.ITEMS_PER_PAGE) || 1;
    const startNum = totalItems > 0 ? startIndex + 1 : 0;
    const endNum = startIndex + pageCount;

    pagContainer.innerHTML = `
      <span class="text-brand-muted text-xs sm:text-sm">
        Mostrando ${startNum} - ${endNum} de ${totalItems} productos disponibles
      </span>
      <div class="flex items-center gap-1 font-bold text-xs sm:text-sm">
        <button 
          onclick="app.setPage(${this.state.currentPage - 1})" 
          class="px-3 py-1.5 rounded border border-slate-200 ${this.state.currentPage <= 1 ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-brand-charcoal'}" 
          ${this.state.currentPage <= 1 ? 'disabled' : ''}
          aria-label="Página anterior"
        >
          Anterior
        </button>

        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button 
            onclick="app.setPage(${p})" 
            class="px-3 py-1.5 rounded ${p === this.state.currentPage ? 'bg-brand-charcoal text-white font-bold' : 'border border-slate-200 hover:bg-slate-100 text-brand-charcoal'}"
            aria-label="Ir a página ${p}"
            ${p === this.state.currentPage ? 'aria-current="page"' : ''}
          >
            ${p}
          </button>
        `).join('')}

        <button 
          onclick="app.setPage(${this.state.currentPage + 1})" 
          class="px-3 py-1.5 rounded border border-slate-200 ${this.state.currentPage >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-brand-charcoal'}" 
          ${this.state.currentPage >= totalPages ? 'disabled' : ''}
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    `;
  },

  handleCardClick(cardId) {
    if (cardId === 'charizard-1st' || cardId === 'charizard-psa10') {
      this.navigateTo('pdp');
    } else {
      const found = this.catalog.find(c => c.id === cardId);
      if (found) {
        this.addToCart(found.id, found.name, found.grade, found.price, found.image);
      }
    }
  },

  // =========================================================================
  // REQUERIMIENTO 4: BOLSA DE COMPRAS & CÁLCULO FISCAL IVA (15%)
  // =========================================================================
  addToCart(id, name, condition, price, image) {
    const existing = this.state.cart.find(c => c.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.cart.push({ id, name, condition, price, quantity: 1, image });
    }

    this.updateCartBadge();
    this.renderCart();
    this.showToast(`+1 "${name}" añadido a la bolsa`, 'success');
  },

  updateQuantity(id, delta) {
    const item = this.state.cart.find(c => c.id === id);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.removeItem(id);
      return;
    }

    this.updateCartBadge();
    this.renderCart();
  },

  removeItem(id) {
    const itemIndex = this.state.cart.findIndex(c => c.id === id);
    if (itemIndex === -1) return;

    const removed = this.state.cart[itemIndex];
    this.state.lastDeletedItem = { item: removed, index: itemIndex };
    this.state.cart.splice(itemIndex, 1);

    this.updateCartBadge();
    this.renderCart();

    // Nielsen Heuristic #3: Reversibility & Undo
    const banner = document.getElementById('undo-banner');
    const text = document.getElementById('undo-text');
    if (banner && text) {
      text.innerText = `Ítem "${removed.name}" eliminado de la bolsa.`;
      banner.classList.remove('hidden');
      lucide.createIcons();
    }
  },

  undoLastDeletion() {
    if (!this.state.lastDeletedItem) return;
    const { item, index } = this.state.lastDeletedItem;
    this.state.cart.splice(index, 0, item);
    this.state.lastDeletedItem = null;

    const banner = document.getElementById('undo-banner');
    if (banner) banner.classList.add('hidden');

    this.updateCartBadge();
    this.renderCart();
    this.showToast(`Ítem "${item.name}" restaurado exitosamente`, 'success');
  },

  renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div class="bg-white border border-brand-border rounded-xl p-8 text-center text-brand-muted">
          <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-2 text-slate-300"></i>
          <p class="font-bold text-sm text-brand-charcoal">Tu bolsa de compras está vacía</p>
          <button onclick="app.navigateTo('home')" class="mt-3 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg shadow-sm">
            Explorar Cartas y Slabs
          </button>
        </div>
      `;
      this.calculateTotals(0);
      lucide.createIcons();
      return;
    }

    container.innerHTML = this.state.cart.map(item => `
      <div class="bg-white border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div class="flex items-center gap-3 flex-1">
          <img 
            src="${item.image}" 
            alt="${item.name}" 
            class="w-16 h-20 object-contain bg-slate-50 border border-slate-200 rounded-lg p-1" 
            onerror="this.src='https://placehold.co/100x120/F1F5F9/64748B?text=Pokemon'"
          />
          <div>
            <h3 class="font-bold text-sm text-brand-charcoal">${item.name}</h3>
            <span class="text-xs text-brand-muted block">${item.condition}</span>
            <span class="text-xs font-bold text-brand-charcoal block sm:hidden mt-1">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div class="flex items-center border border-slate-300 rounded-lg bg-slate-50">
            <button 
              type="button" 
              onclick="app.updateQuantity('${item.id}', -1)" 
              class="px-3 py-1 text-slate-600 hover:text-brand-charcoal font-black text-sm"
              aria-label="Disminuir cantidad de ${item.name}"
            >−</button>
            <span class="px-3 py-1 text-xs font-black text-brand-charcoal bg-white">${item.quantity}</span>
            <button 
              type="button" 
              onclick="app.updateQuantity('${item.id}', 1)" 
              class="px-3 py-1 text-slate-600 hover:text-brand-charcoal font-black text-sm"
              aria-label="Aumentar cantidad de ${item.name}"
            >+</button>
          </div>

          <span class="font-black text-base text-brand-charcoal hidden sm:inline w-28 text-right">
            $${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>

          <button 
            type="button" 
            onclick="app.removeItem('${item.id}')" 
            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            aria-label="Eliminar ${item.name} de la bolsa"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.calculateTotals(subtotal);
    lucide.createIcons();
  },

  calculateTotals(subtotal) {
    const shipping = this.state.cart.length > 0 ? this.state.shippingFee : 0;
    const tax = subtotal * APP_CONFIG.TAX_RATE; // 15% IVA
    const total = subtotal + shipping + tax;

    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.innerText = `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    setTxt('summary-subtotal', subtotal);
    setTxt('summary-shipping', shipping);
    setTxt('summary-tax', tax);
    setTxt('summary-total', total);

    // Sync button total on checkout if present
    const checkoutPayBtn = document.getElementById('checkout-pay-button');
    if (checkoutPayBtn) {
      checkoutPayBtn.innerText = `Finalizar Compra y Pagar ($${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)`;
    }
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
      badge.innerText = count;
    }
  },

  // =========================================================================
  // REQUERIMIENTO 3 & 4: CHECKOUT, ENTREGA ADAPTATIVA & SIMULACIÓN PAGO
  // =========================================================================
  handleDeliveryChange(method) {
    this.state.deliveryMethod = method;
    const cashContainer = document.getElementById('payment-cash-container');
    const cashInput = document.getElementById('payment-cash-input');
    const cashTitle = document.getElementById('payment-cash-title');
    const cashDesc = document.getElementById('payment-cash-desc');

    if (method === 'pickup') {
      this.state.shippingFee = APP_CONFIG.PICKUP_SHIPPING_FEE;
      if (cashContainer) {
        cashContainer.className = 'payment-option p-3.5 rounded-xl border border-slate-300 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition';
      }
      if (cashInput) cashInput.disabled = false;
      if (cashTitle) cashTitle.className = 'text-sm font-bold text-brand-charcoal';
      if (cashDesc) cashDesc.innerText = 'Paga al retirar tu compra en la sucursal física';
      this.showToast('Entrega: Retiro en Sucursal Central ($0.00). Efectivo disponible.', 'info');
    } else {
      this.state.shippingFee = APP_CONFIG.COURIER_SHIPPING_FEE;
      if (cashContainer) {
        cashContainer.className = 'payment-option p-3.5 rounded-xl border border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed flex items-center justify-between';
      }
      if (cashInput) {
        cashInput.disabled = true;
        if (cashInput.checked) {
          const cardRadio = document.querySelector('input[name="payment-method"][value="card"]');
          if (cardRadio) cardRadio.checked = true;
        }
      }
      if (cashTitle) cashTitle.className = 'text-sm font-bold text-slate-500';
      if (cashDesc) cashDesc.innerText = 'Solo disponible con opción "Retiro en Local Físico"';
      this.showToast('Entrega: Courier Blindado ($25.00). Pago en efectivo inhabilitado por seguridad.', 'info');
    }

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.calculateTotals(subtotal);
  },

  // Realistic Payment Processing Flow with Modal & Spinner
  startPaymentProcessing() {
    if (this.state.cart.length === 0) {
      this.showToast('Tu bolsa de compras está vacía. Añade cartas antes de pagar.', 'error');
      this.navigateTo('home');
      return;
    }

    const nameInput = document.getElementById('guest-name');
    const emailInput = document.getElementById('guest-email');
    if (!nameInput || !nameInput.value.trim() || !emailInput || !emailInput.value.trim()) {
      this.showToast('Por favor completa tus datos personales de facturación.', 'error');
      return;
    }

    const cardNumInput = document.getElementById('card-number');
    const cardNum = (cardNumInput ? cardNumInput.value : '').replace(/\s+/g, '');
    const simulateFailureCheckbox = document.getElementById('test-simulate-failure');
    const isSimulatedFailure = (simulateFailureCheckbox && simulateFailureCheckbox.checked) || cardNum.endsWith('0000');

    // Show processing modal
    const modal = document.getElementById('payment-modal');
    const modalText = document.getElementById('payment-modal-text');
    const progressBar = document.getElementById('payment-progress-bar');

    if (modal) modal.classList.add('active');
    if (progressBar) progressBar.style.width = '15%';

    // Sequential realistic feedback
    if (modalText) modalText.innerText = 'Conectando con la pasarela bancaria segura...';

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '65%';
      if (modalText) modalText.innerText = 'Validando fondos y autenticación 3D Secure...';
    }, 1400);

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '100%';
      
      // Close modal
      if (modal) modal.classList.remove('active');

      if (isSimulatedFailure) {
        // Contingency: Retain inputs, navigate to #error
        this.showToast('Transacción rechazada por entidad bancaria (#DECLINED-SEC-054)', 'error');
        this.navigateTo('error');
      } else {
        // Success: Generate random order, populate confirmation, clear cart, navigate to #confirmation
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderId = `#PKM-2026-${randomNum}`;
        this.buildConfirmationView(orderId, nameInput.value, emailInput.value);
        this.state.cart = [];
        this.updateCartBadge();
        this.renderCart();
        this.showToast(`¡Pago exitoso! Orden generada: ${orderId}`, 'success');
        this.navigateTo('confirmation');
      }
    }, 2800);
  },

  buildConfirmationView(orderId, buyerName, buyerEmail) {
    const orderBadge = document.getElementById('confirm-order-id');
    if (orderBadge) orderBadge.innerText = `Número de Orden: ${orderId}`;

    const emailSpan = document.getElementById('confirm-email-recipient');
    if (emailSpan) emailSpan.innerText = buyerEmail;

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * APP_CONFIG.TAX_RATE;
    const shipping = this.state.shippingFee;
    const total = subtotal + tax + shipping;

    const breakdownContainer = document.getElementById('confirm-breakdown-container');
    if (breakdownContainer) {
      breakdownContainer.innerHTML = `
        <h2 class="font-black text-brand-charcoal text-sm uppercase tracking-wider mb-2">Desglose de la Transacción</h2>
        ${this.state.cart.map(item => `
          <div class="flex justify-between text-brand-muted">
            <span>${item.quantity}x ${item.name} (${item.condition})</span>
            <span class="font-bold text-brand-charcoal">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        `).join('')}
        <div class="flex justify-between text-brand-muted border-t border-slate-200 pt-2">
          <span>Envío (${this.state.deliveryMethod === 'courier' ? 'Courier Blindado' : 'Retiro en Local'}):</span>
          <span class="font-bold text-brand-charcoal">$${shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="flex justify-between text-brand-muted">
          <span>Impuestos (IVA 15%):</span>
          <span class="font-bold text-brand-charcoal">$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="flex justify-between font-black text-base text-brand-charcoal border-t border-slate-300 pt-2">
          <span>Total Pagado:</span>
          <span class="text-brand-red">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
      `;
    }
  },

  switchToCashPickup() {
    this.handleDeliveryChange('pickup');
    const pickupRadio = document.querySelector('input[name="delivery-method"][value="pickup"]');
    if (pickupRadio) pickupRadio.checked = true;
    const cashRadio = document.getElementById('payment-cash-input');
    if (cashRadio) cashRadio.checked = true;

    this.navigateTo('checkout');
    this.showToast('Método actualizado a Retiro en Tienda y Pago en Efectivo ($0.00 envío).', 'success');
  },

  // Accessible Toast Feedback Provider
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto bg-brand-charcoal text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border-l-4 flex items-center gap-2.5 transition-all transform translate-y-2 opacity-0';

    let icon = 'info';
    if (type === 'success') {
      toast.classList.add('border-emerald-500');
      icon = 'check-circle';
    } else if (type === 'error') {
      toast.classList.add('border-brand-red');
      icon = 'alert-circle';
    } else {
      toast.classList.add('border-blue-500');
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
    }, 4000);
  }
};

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
