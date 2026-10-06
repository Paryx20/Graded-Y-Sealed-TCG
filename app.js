/**
 * Graded & Sealed TCG - Production Web Application Engine
 * IHC & WCAG 2.2 Compliant Commercial Architecture
 */

const APP_CONFIG = {
  TAX_RATE: 0.15, // IVA Ecuador 15%
  COURIER_SHIPPING_FEE: 5.00, // Envío a domicilio ajustado exactamente a $5.00 USD
  PICKUP_SHIPPING_FEE: 0.00,
  ITEMS_PER_PAGE: 4
};

// =========================================================================
// REQUERIMIENTO 2: CATÁLOGO CENTRALIZADO MAESTRO (PRODUCTS)
// =========================================================================
const PRODUCTS = [
  {
    id: 'charizard-base',
    nombre: 'Charizard Base Set 1999 #4/102',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'Fuego',
    categoria: 'Solo PSA',
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    precios: {
      raw: 750.00,
      psa8: 1800.00,
      psa9: 4850.00,
      psa10: 18500.00
    },
    descripcion: 'Holo Rare 1st Edition • Idioma: Inglés • Certificación Bóveda PSA',
    tendencia12m: '+21.7%'
  },
  {
    id: 'gengar-vmax',
    nombre: 'Gengar VMAX Secret Rare Alt Art',
    set: 'Fusion Strike 2021',
    rareza: 'Secret Rare',
    tipo: 'Psíquico',
    categoria: 'Solo PSA',
    imagenLocal: 'img/gengar-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh8/271_hires.png',
    precios: {
      raw: 240.00,
      psa8: 340.00,
      psa9: 460.00,
      psa10: 620.00
    },
    descripcion: 'Alt Art Secret Rare #271/264 • Idioma: Inglés • Bóveda PSA',
    tendencia12m: '+14.2%'
  },
  {
    id: 'umbreon-vmax',
    nombre: 'Umbreon VMAX Moonbreon Alt Art',
    set: 'Evolving Skies 2021',
    rareza: 'Secret Rare',
    tipo: 'Oscuridad',
    categoria: 'Cartas Sueltas',
    imagenLocal: 'img/umbreon-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    precios: {
      raw: 650.00,
      psa8: 720.00,
      psa9: 780.00,
      psa10: 1350.00
    },
    descripcion: 'Alt Art Secret Rare #215/203 • Funda UltraPro • Autenticidad Garantizada',
    tendencia12m: '+18.9%'
  },
  {
    id: 'lugia-neo',
    nombre: 'Lugia 1st Edition Holo #9/111',
    set: 'Neo Genesis 2000',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'Solo PSA',
    imagenLocal: 'img/lugia-neo.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/neo1/9_hires.png',
    precios: {
      raw: 420.00,
      psa8: 980.00,
      psa9: 1450.00,
      psa10: 4200.00
    },
    descripcion: 'Holo Rare Neo Genesis • Grado Inversión • Bóveda PSA',
    tendencia12m: '+9.4%'
  },
  {
    id: 'booster-team-rocket',
    nombre: 'Booster Pack Team Rocket 1999 Heavy',
    set: 'Team Rocket 1999',
    rareza: 'Promo',
    tipo: 'Oscuridad',
    categoria: 'Booster Packs',
    imagenLocal: 'img/booster-team-rocket.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/logo.png',
    precios: {
      raw: 320.00,
      psa8: 335.00,
      psa9: 350.00,
      psa10: 450.00
    },
    descripcion: 'Sobre sellado de fábrica 21.2g Heavy Pack • Conservación térmica',
    tendencia12m: '+6.1%'
  },
  {
    id: 'pikachu-illustrator',
    nombre: 'Pikachu Illustrator CoroCoro Promo',
    set: 'Promo Japonesa 1998',
    rareza: 'Promo',
    tipo: 'Eléctrico',
    categoria: 'Solo PSA',
    imagenLocal: 'img/pikachu-illustrator.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/basep/1_hires.png',
    precios: {
      raw: 28000.00,
      psa8: 48000.00,
      psa9: 68000.00,
      psa10: 85000.00
    },
    descripcion: 'La carta más codiciada de la historia del TCG • Verificación oficial',
    tendencia12m: '+31.5%'
  },
  {
    id: 'rayquaza-gold-star',
    nombre: 'Rayquaza Gold Star EX Deoxys',
    set: 'EX Deoxys 2005',
    rareza: 'Gold Star',
    tipo: 'Fuego',
    categoria: 'Cartas Sueltas',
    imagenLocal: 'img/rayquaza-gold-star.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/ex1/96_hires.png',
    precios: {
      raw: 1200.00,
      psa8: 1650.00,
      psa9: 2100.00,
      psa10: 4800.00
    },
    descripcion: 'Ultra Rare Gold Star #107/107 • Estado impecable de colección',
    tendencia12m: '+11.8%'
  },
  {
    id: 'blastoise-shadowless',
    nombre: 'Blastoise Shadowless Base Set 1999',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'Agua',
    categoria: 'Solo PSA',
    imagenLocal: 'img/blastoise-shadowless.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
    precios: {
      raw: 380.00,
      psa8: 620.00,
      psa9: 950.00,
      psa10: 2400.00
    },
    descripcion: 'Holo Shadowless 1999 • Sin sombra de recuadro • Sello PSA oficial',
    tendencia12m: '+8.3%'
  }
];

const app = {
  // Global application state
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
    // REQUERIMIENTO 7: Carrito inicializado estrictamente en cero
    cart: [],
    lastDeletedItem: null,
    deliveryMethod: 'courier', // 'courier' ($5.00) or 'pickup' ($0.00)
    shippingFee: APP_CONFIG.COURIER_SHIPPING_FEE,
    currentUser: null,
    // REQUERIMIENTO 2: Ficha dinámica actual seleccionada
    currentPdpProduct: PRODUCTS[0],
    pdpSelectedCondition: 'psa10'
  },

  // =========================================================================
  // BOOTSTRAP & INITIALIZATION
  // =========================================================================
  init() {
    this.initSessionFromStorage();
    this.initRouter();
    this.renderCatalog();
    this.renderCart();
    this.updateCartBadge();
    this.setupSearchSpotlight();
    this.setupPDPChartInteractions();
    this.setupPhoneInput();
    this.setupIdValidation();
    lucide.createIcons();
  },

  // =========================================================================
  // REQUERIMIENTO 2 & HASH ROUTER CON SOPORTE DE BOTÓN ATRÁS
  // =========================================================================
  initRouter() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());

    if (!window.location.hash) {
      window.location.hash = '#home';
    } else {
      this.handleHashChange();
    }
  },

  handleHashChange() {
    const raw = window.location.hash.replace(/^#/, '').trim();
    const parts = raw.split('?');
    const route = parts[0].toLowerCase();
    const params = new URLSearchParams(parts[1] || '');

    // Check dynamic PDP route: #pdp?id=... or #pdp
    if (route === 'pdp') {
      const prodId = params.get('id');
      if (prodId) {
        const found = PRODUCTS.find(p => p.id === prodId);
        if (found) {
          this.state.currentPdpProduct = found;
          this.state.pdpSelectedCondition = 'psa10';
        }
      }
      this.activateView('view-pdp', false);
      this.renderDynamicPDP();
      return;
    }

    // Direct search results route
    if (route === 'search-results') {
      this.activateView('view-home', false);
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    const routeMap = {
      'home': 'view-home',
      'cart': 'view-cart',
      'checkout': 'view-checkout',
      'confirmation': 'view-confirmation',
      'tracking': 'view-tracking',
      'auth': 'view-login',
      'error': 'view-payment-error'
    };

    const targetViewId = routeMap[route] || 'view-home';
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

      // View lifecycle hooks
      if (viewId === 'view-pdp') {
        this.renderDynamicPDP();
      } else if (viewId === 'view-checkout') {
        this.syncCheckoutWithSession();
      } else if (viewId === 'view-tracking') {
        this.renderDynamicTracking();
      }
    }
  },

  // =========================================================================
  // REQUERIMIENTO 2: FICHA DINÁMICA (PDP) PARA CUALQUIER PRODUCTO
  // =========================================================================
  openProductPDP(productId) {
    const found = PRODUCTS.find(p => p.id === productId);
    if (found) {
      this.state.currentPdpProduct = found;
      this.state.pdpSelectedCondition = 'psa10';
      window.location.hash = `#pdp?id=${found.id}`;
    }
  },

  renderDynamicPDP() {
    const product = this.state.currentPdpProduct || PRODUCTS[0];
    const condition = this.state.pdpSelectedCondition || 'psa10';
    const currentPrice = product.precios[condition] || product.precios.psa10;

    // Breadcrumbs
    const bcSet = document.getElementById('pdp-breadcrumb-set');
    const bcName = document.getElementById('pdp-breadcrumb-name');
    if (bcSet) bcSet.innerText = product.set;
    if (bcName) bcName.innerText = product.nombre;

    // Title & details
    const titleEl = document.getElementById('pdp-title');
    const descEl = document.getElementById('pdp-desc');
    if (titleEl) titleEl.innerText = product.nombre;
    if (descEl) descEl.innerText = `${product.rareza} • ${product.set} • ${product.tipo} • Bóveda Certificada`;

    // Main Image with local image and official fallback
    const mainImg = document.getElementById('pdp-main-image');
    if (mainImg) {
      mainImg.src = product.imagenLocal;
      mainImg.alt = product.nombre;
      mainImg.onerror = function() {
        this.onerror = null;
        this.src = product.imagenFallbackUrl;
      };
    }

    // Cert Badge
    const certBadge = document.getElementById('pdp-cert-badge');
    const conditionLabels = {
      raw: 'Sin Gradear (Raw NM)',
      psa8: 'PSA 8 NM-MT',
      psa9: 'PSA 9 MINT',
      psa10: 'PSA 10 GEM MT'
    };
    if (certBadge) certBadge.innerText = `${conditionLabels[condition]} #${product.id.toUpperCase()}-CERT`;

    // Update prices on 4 condition buttons
    ['raw', 'psa8', 'psa9', 'psa10'].forEach(cKey => {
      const pEl = document.getElementById(`cond-price-${cKey}`);
      if (pEl) {
        pEl.innerText = `$${product.precios[cKey].toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
    });

    // Update button active state
    document.querySelectorAll('.cond-btn').forEach(btn => {
      btn.className = 'cond-btn p-3 rounded-xl border border-slate-200 text-left hover:border-slate-400 transition bg-white';
      const p = btn.querySelector('.cond-price');
      if (p) p.className = 'cond-price text-sm font-black text-brand-muted';
      const t = btn.querySelector('.cond-title');
      if (t) t.className = 'cond-title text-xs font-bold text-brand-charcoal';
      const icon = btn.querySelector('.check-indicator');
      if (icon) icon.classList.add('hidden');
    });

    const activeBtn = document.getElementById(`cond-${condition}`);
    if (activeBtn) {
      activeBtn.className = 'cond-btn p-3 rounded-xl bg-brand-charcoal text-white text-left shadow transition';
      const p = activeBtn.querySelector('.cond-price');
      if (p) p.className = 'cond-price text-sm font-black text-amber-400';
      const t = activeBtn.querySelector('.cond-title');
      if (t) t.className = 'cond-title text-xs font-bold text-white';
      const icon = activeBtn.querySelector('.check-indicator');
      if (icon) icon.classList.remove('hidden');
    }

    // Main big price
    const priceEl = document.getElementById('pdp-price');
    if (priceEl) {
      priceEl.innerText = `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
    }

    // Redraw SVG chart for this card and condition
    this.drawPDPChart();
    lucide.createIcons();
  },

  selectPDPCondition(condId) {
    this.state.pdpSelectedCondition = condId;
    this.renderDynamicPDP();
    const product = this.state.currentPdpProduct || PRODUCTS[0];
    const price = product.precios[condId];
    this.showToast(`Condición: ${condId.toUpperCase()} ($${price.toLocaleString('en-US')})`, 'info');
  },

  addCurrentPDPToCart() {
    const product = this.state.currentPdpProduct || PRODUCTS[0];
    const condition = this.state.pdpSelectedCondition || 'psa10';
    const conditionLabels = {
      raw: 'Sin Gradear (Raw NM)',
      psa8: 'PSA 8 NM-MT',
      psa9: 'PSA 9 MINT',
      psa10: 'PSA 10 GEM MT'
    };
    const price = product.precios[condition];

    this.addToCart(
      `${product.id}-${condition}`,
      product.nombre,
      conditionLabels[condition],
      price,
      product.imagenLocal,
      product.imagenFallbackUrl
    );
  },

  // 12-Month Historical Chart Generator scaled to current product price and condition variability
  drawPDPChart() {
    const product = this.state.currentPdpProduct || PRODUCTS[0];
    const condition = this.state.pdpSelectedCondition || 'psa10';
    const basePrice = product.precios[condition] || 1000;

    // REQUERIMIENTO 2: Variabilidad Realista en Historial de Mercado (Tendencias Negativas)
    let trendBadge = '+21.7%';
    let isPositive = true;
    let multipliers = [];

    if (condition === 'raw') {
      trendBadge = '-12.3%';
      isPositive = false;
      // Trayectoria descendente: inicia 14% más alto y cae al precio actual
      multipliers = [1.14, 1.13, 1.12, 1.10, 1.08, 1.07, 1.05, 1.04, 1.03, 1.02, 1.01, 1.00];
    } else if (condition === 'psa8') {
      trendBadge = '-4.8%';
      isPositive = false;
      // Trayectoria con caída hacia el final
      multipliers = [1.05, 1.05, 1.04, 1.04, 1.03, 1.03, 1.02, 1.02, 1.01, 1.01, 1.00, 1.00];
    } else if (condition === 'psa9') {
      trendBadge = '+6.5%';
      isPositive = true;
      multipliers = [0.94, 0.94, 0.95, 0.95, 0.96, 0.97, 0.97, 0.98, 0.98, 0.99, 0.99, 1.00];
    } else { // psa10
      trendBadge = '+21.7%';
      isPositive = true;
      multipliers = [0.82, 0.84, 0.86, 0.88, 0.90, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00];
    }

    const trendPill = document.getElementById('market-trend-pill');
    if (trendPill) {
      trendPill.innerText = trendBadge;
      trendPill.className = isPositive 
        ? 'text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded' 
        : 'text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded';
    }

    const svg = document.getElementById('pdp-interactive-chart');
    if (!svg) return;

    // Generate 12 months data scaled around current price
    const months = ['Oct 2025', 'Nov 2025', 'Dic 2025', 'Ene 2026', 'Feb 2026', 'Mar 2026', 'Abr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Ago 2026', 'Sep 2026 (Hoy)'];

    const points = months.map((m, idx) => {
      const p = Math.round(basePrice * multipliers[idx]);
      const diff = ((multipliers[idx] - multipliers[0]) / multipliers[0]) * 100;
      const sign = diff >= 0 ? '+' : '';
      return {
        month: m,
        price: p,
        trend: idx === 0 ? '+0.0%' : `${sign}${diff.toFixed(1)}%`
      };
    });

    const width = 400;
    const height = 130;
    const paddingX = 30;
    const paddingY = 25;
    const plotW = width - (paddingX * 2);
    const plotH = height - (paddingY * 2);

    const prices = points.map(p => p.price);
    const minP = Math.min(...prices) * 0.96;
    const maxP = Math.max(...prices) * 1.04;

    const coords = points.map((pt, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * plotW;
      const normalizedY = (pt.price - minP) / (maxP - minP);
      const y = height - paddingY - (normalizedY * plotH);
      return { x, y, pt };
    });

    const pointsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const polylineEl = document.getElementById('chart-polyline');
    if (polylineEl) {
      polylineEl.setAttribute('points', pointsStr);
      polylineEl.setAttribute('stroke', isPositive ? '#16A34A' : '#DC2626');
    }

    const lastCoord = coords[coords.length - 1];
    const activeDot = document.getElementById('chart-active-dot');
    if (activeDot) {
      activeDot.setAttribute('cx', lastCoord.x);
      activeDot.setAttribute('cy', lastCoord.y);
      activeDot.setAttribute('fill', isPositive ? '#16A34A' : '#DC2626');
    }

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

      if (clientX < rect.left || clientX > rect.right) {
        hideTooltip();
        return;
      }

      const svgX = ((clientX - rect.left) / rect.width) * 400;

      let nearest = svg._chartCoords[0];
      let minDiff = Infinity;
      for (const c of svg._chartCoords) {
        const diff = Math.abs(c.x - svgX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = c;
        }
      }

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

      const pixelX = (nearest.x / 400) * rect.width;
      const pixelY = (nearest.y / 130) * rect.height;

      tooltip.style.left = `${pixelX}px`;
      tooltip.style.top = `${pixelY - 12}px`;
      tooltip.style.opacity = '1';

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

  // =========================================================================
  // REQUERIMIENTO 4: BUSCADOR CON EFECTO SPOTLIGHT Y RESULTADOS
  // =========================================================================
  setupSearchSpotlight() {
    const searchInput = document.getElementById('global-search');
    const backdrop = document.getElementById('search-spotlight-backdrop');
    const container = document.getElementById('search-container');
    const dropdown = document.getElementById('search-live-dropdown');

    if (!searchInput || !backdrop) return;

    const openSpotlight = () => {
      backdrop.classList.add('active');
      if (container) container.classList.add('focused');
      this.renderLiveSearchResults(searchInput.value);
    };

    const closeSpotlight = () => {
      backdrop.classList.remove('active');
      if (container) container.classList.remove('focused');
      if (dropdown) dropdown.classList.add('hidden');
    };

    searchInput.addEventListener('focus', openSpotlight);

    searchInput.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value.toLowerCase().trim();
      this.renderLiveSearchResults(this.state.searchQuery);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.blur();
        closeSpotlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        closeSpotlight();
        this.executeSearchQuery(searchInput.value);
      }
    });

    backdrop.addEventListener('click', () => {
      searchInput.blur();
      closeSpotlight();
    });
  },

  renderLiveSearchResults(query) {
    const dropdown = document.getElementById('search-live-dropdown');
    if (!dropdown) return;

    query = (query || '').toLowerCase().trim();
    const matches = PRODUCTS.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.set.toLowerCase().includes(query) ||
      p.tipo.toLowerCase().includes(query)
    ).slice(0, 4);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="p-4 text-center text-xs text-brand-muted">
          No se encontraron cartas que coincidan con "${query}".
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = `
      <div class="p-2 border-b border-slate-100 text-[10px] font-bold text-brand-muted uppercase tracking-wider flex justify-between items-center">
        <span>Cartas encontradas en la Bóveda</span>
        <span>${matches.length} sugerencias</span>
      </div>
      <div class="divide-y divide-slate-100">
        ${matches.map(card => `
          <div onclick="app.selectSearchCard('${card.id}')" class="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg transition group">
            <div class="flex items-center gap-3">
              <img 
                src="${card.imagenLocal}" 
                alt="${card.nombre}" 
                class="w-8 h-11 object-contain bg-slate-50 border border-slate-200 rounded p-0.5" 
                onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
              />
              <div>
                <h4 class="text-xs font-bold text-brand-charcoal group-hover:text-brand-red transition">${card.nombre}</h4>
                <span class="text-[10px] text-brand-muted">${card.set} • ${card.rareza}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-black text-brand-charcoal">$${card.precios.psa10.toLocaleString('en-US')}</span>
              <span class="block text-[9px] text-brand-muted">PSA 10</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="p-2 border-t border-slate-100 text-center">
        <button type="button" onclick="app.executeSearchQuery('${query}')" class="text-xs font-bold text-brand-red hover:text-brand-darkred">
          Ver todos los resultados en el catálogo →
        </button>
      </div>
    `;
    dropdown.classList.remove('hidden');
    lucide.createIcons();
  },

  selectSearchCard(cardId) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    const dropdown = document.getElementById('search-live-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    this.openProductPDP(cardId);
  },

  executeSearchQuery(query) {
    const backdrop = document.getElementById('search-spotlight-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    const dropdown = document.getElementById('search-live-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    this.state.searchQuery = (query || '').toLowerCase().trim();
    this.state.currentPage = 1;
    this.renderCatalog();
    this.navigateTo('home');
    this.showToast(`Búsqueda ejecutada: "${query}"`, 'info');
  },

  // =========================================================================
  // CATÁLOGO, FILTROS Y PAGINACIÓN
  // =========================================================================
  filterCategory(category) {
    this.state.activeCategory = category;
    this.state.currentPage = 1;

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
    this.showToast('Filtros restablecidos.', 'info');
  },

  setPage(page) {
    this.state.currentPage = page;
    this.renderCatalog();
    window.scrollTo({ top: 350, behavior: 'smooth' });
  },

  getFilteredCatalog() {
    return PRODUCTS.filter(card => {
      if (this.state.activeCategory !== 'Todas' && card.categoria !== this.state.activeCategory) {
        return false;
      }
      if (this.state.searchQuery) {
        const matchesName = card.nombre.toLowerCase().includes(this.state.searchQuery);
        const matchesSet = card.set.toLowerCase().includes(this.state.searchQuery);
        if (!matchesName && !matchesSet) return false;
      }
      const adv = this.state.advancedFilters;
      if (adv.type !== 'all' && card.tipo !== adv.type) return false;
      if (adv.rarity !== 'all' && card.rareza !== adv.rarity) return false;
      if (adv.minPrice !== null && card.precios.psa10 < adv.minPrice) return false;
      if (adv.maxPrice !== null && card.precios.psa10 > adv.maxPrice) return false;

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
          <h3 class="text-base font-bold text-brand-charcoal">No se encontraron cartas</h3>
          <p class="text-xs text-brand-muted mt-1">Intenta con otro término o limpia los filtros.</p>
          <button onclick="app.resetAdvancedFilters(); app.filterCategory('Todas');" class="mt-4 px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg shadow-sm">
            Ver todas las cartas
          </button>
        </div>
      `;
      this.renderPagination(0, 0, 1);
      lucide.createIcons();
      return;
    }

    grid.innerHTML = pagedItems.map(card => `
      <article class="bg-white border border-brand-border rounded-xl p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group">
        <div>
          <div class="aspect-[3/4] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-3 relative">
            <img 
              src="${card.imagenLocal}" 
              alt="${card.nombre}" 
              class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
              onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
            />
          </div>

          <div class="mt-3">
            <span class="inline-block text-[10px] font-bold text-brand-muted uppercase tracking-wider">${card.tipo} • ${card.rareza}</span>
            <h3 class="font-extrabold text-sm sm:text-base text-brand-charcoal mt-0.5 line-clamp-1">${card.nombre}</h3>
            <p class="text-xs text-brand-muted mt-0.5">${card.set}</p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span class="text-xs text-brand-muted block">Desde</span>
            <span class="text-base font-black text-brand-charcoal">$${card.precios.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <button 
            type="button" 
            onclick="app.openProductPDP('${card.id}')"
            class="px-3.5 py-1.5 text-xs font-extrabold text-brand-red border border-brand-red hover:bg-brand-red hover:text-white rounded-lg transition"
            aria-label="Ver detalles de ${card.nombre}"
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

  // =========================================================================
  // REQUERIMIENTO 7 & 3: BOLSA DE COMPRAS & ENVÍO A $5.00 CON IVA (15%)
  // =========================================================================
  addToCart(id, name, condition, price, imageLocal, imageFallback) {
    const existing = this.state.cart.find(c => c.id === id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.state.cart.push({
        id,
        name,
        condition,
        price,
        quantity: 1,
        imageLocal: imageLocal || 'img/charizard-base.png',
        imageFallback: imageFallback || 'https://images.pokemontcg.io/base1/4_hires.png'
      });
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
    this.showToast(`Ítem "${item.name}" restaurado`, 'success');
  },

  renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    // REQUERIMIENTO 7: Estado limpio cuando el carrito está vacío
    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div class="bg-white border border-brand-border rounded-xl p-10 text-center text-brand-muted">
          <i data-lucide="shopping-bag" class="w-14 h-14 mx-auto mb-3 text-slate-300"></i>
          <h3 class="font-extrabold text-base text-brand-charcoal">Tu bolsa de compras está vacía</h3>
          <p class="text-xs text-brand-muted mt-1 max-w-sm mx-auto">Añade cartas coleccionables, slabs PSA o booster packs para iniciar tu compra.</p>
          <a href="#home" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-darkred text-white text-xs font-bold rounded-lg shadow-sm transition">
            <i data-lucide="compass" class="w-4 h-4"></i>
            <span>Explorar Catálogo</span>
          </a>
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
            src="${item.imageLocal}" 
            alt="${item.name}" 
            class="w-16 h-20 object-contain bg-slate-50 border border-slate-200 rounded-lg p-1" 
            onerror="this.onerror=null; this.src='${item.imageFallback}'"
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
              aria-label="Disminuir cantidad"
            >−</button>
            <span class="px-3 py-1 text-xs font-black text-brand-charcoal bg-white">${item.quantity}</span>
            <button 
              type="button" 
              onclick="app.updateQuantity('${item.id}', 1)" 
              class="px-3 py-1 text-slate-600 hover:text-brand-charcoal font-black text-sm"
              aria-label="Aumentar cantidad"
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
    // REQUERIMIENTO 3: Envío a domicilio exactamente a $5.00 USD
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

    const checkoutPayBtn = document.getElementById('checkout-pay-button');
    if (checkoutPayBtn) {
      checkoutPayBtn.innerText = `Finalizar Compra ($${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)`;
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
  // REQUERIMIENTO 3 & 5 & 1: CHECKOUT SIMPLIFICADO & ENTREGA ADAPTATIVA
  // =========================================================================
  handleDeliveryChange(method) {
    this.state.deliveryMethod = method;
    const courierContainer = document.getElementById('delivery-courier-container');
    const pickupContainer = document.getElementById('delivery-pickup-container');
    const courierInput = document.getElementById('delivery-courier-input');
    const pickupInput = document.getElementById('delivery-pickup-input');

    const cashContainer = document.getElementById('payment-cash-container');
    const cashInput = document.getElementById('payment-cash-input');
    const cashTitle = document.getElementById('payment-cash-title');
    const cashDesc = document.getElementById('payment-cash-desc');

    if (method === 'pickup') {
      this.state.shippingFee = APP_CONFIG.PICKUP_SHIPPING_FEE;
      // REQUERIMIENTO 1: Sincronización reactiva de contenedores de entrega
      if (courierContainer) {
        courierContainer.className = 'delivery-option p-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition';
      }
      if (pickupContainer) {
        pickupContainer.className = 'delivery-option p-4 rounded-xl border-2 border-brand-red bg-red-50/40 cursor-pointer flex items-start gap-3 transition';
      }
      if (pickupInput) pickupInput.checked = true;

      if (cashContainer) {
        cashContainer.className = 'payment-option p-3.5 rounded-xl border border-slate-300 bg-white flex items-center justify-between cursor-pointer hover:bg-slate-50 transition';
      }
      if (cashInput) cashInput.disabled = false;
      if (cashTitle) cashTitle.className = 'text-sm font-bold text-brand-charcoal';
      if (cashDesc) cashDesc.innerText = 'Paga en caja al retirar en el local central';
      this.showToast('Entrega: Retiro en Sucursal Central ($0.00). Efectivo disponible.', 'info');
    } else {
      // REQUERIMIENTO 3: Envío a domicilio exactamente a $5.00 USD
      this.state.shippingFee = APP_CONFIG.COURIER_SHIPPING_FEE;
      // REQUERIMIENTO 1: Sincronización reactiva de contenedores de entrega
      if (courierContainer) {
        courierContainer.className = 'delivery-option p-4 rounded-xl border-2 border-brand-red bg-red-50/40 cursor-pointer flex items-start gap-3 transition';
      }
      if (pickupContainer) {
        pickupContainer.className = 'delivery-option p-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer flex items-start gap-3 transition';
      }
      if (courierInput) courierInput.checked = true;

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
      if (cashDesc) cashDesc.innerText = 'Solo disponible para "Retiro en Local Físico"';
      this.showToast('Entrega: Domicilio ($5.00). Efectivo bloqueado por seguridad.', 'info');
    }

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.calculateTotals(subtotal);
  },

  // REQUERIMIENTO 5: Procesamiento de pago diferenciado (Tarjeta con modal vs Efectivo directo)
  startPaymentProcessing() {
    if (this.state.cart.length === 0) {
      this.showToast('Tu bolsa de compras está vacía. Añade cartas antes de pagar.', 'error');
      this.navigateTo('home');
      return;
    }

    const nameInput = document.getElementById('guest-name');
    const idInput = document.getElementById('guest-id');
    const emailInput = document.getElementById('guest-email');
    if (!nameInput || !nameInput.value.trim() || !emailInput || !emailInput.value.trim()) {
      this.showToast('Por favor completa tus datos de facturación.', 'error');
      return;
    }

    // REQUERIMIENTO 5: Validación Algorítmica de Cédula Ecuatoriana (Módulo 10)
    if (!idInput || !this.isValidEcuadorianId(idInput.value)) {
      this.updateIdValidationUI(false);
      if (idInput) idInput.focus();
      this.showToast('Cédula ecuatoriana inválida (debe contener 10 dígitos válidos).', 'error');
      return;
    }

    const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'card';

    // CASO A: Pago en Efectivo (Cash) -> DIRECTO SIN SPINNER NI MODAL
    if (paymentMethod === 'cash') {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const orderId = `#PKM-2026-${randomNum}`;
      
      const orderData = this.buildOrderData(orderId, nameInput.value, emailInput.value, 'Efectivo en Tienda');
      this.saveLastOrder(orderData);

      this.state.cart = [];
      this.updateCartBadge();
      this.renderCart();

      this.showToast('Orden reservada con éxito. Recuerda realizar el pago en caja al retirar en el local central.', 'success');
      this.navigateTo('confirmation');
      return;
    }

    // CASO B: Pago con Tarjeta -> MODAL CON ANIMACIÓN DE SPINNER Y 3D SECURE (2.5s)
    // REQUERIMIENTO 3: Gobernado estrictamente por terminación en '0000'
    const cardNumInput = document.getElementById('card-number');
    const cardNum = (cardNumInput ? cardNumInput.value : '').replace(/\s+/g, '');
    const isSimulatedFailure = cardNum.endsWith('0000');

    const modal = document.getElementById('payment-modal');
    const modalText = document.getElementById('payment-modal-text');
    const progressBar = document.getElementById('payment-progress-bar');

    if (modal) modal.classList.add('active');
    if (progressBar) progressBar.style.width = '20%';
    if (modalText) modalText.innerText = 'Conectando con la pasarela bancaria segura...';

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '70%';
      if (modalText) modalText.innerText = 'Validando fondos y autenticación 3D Secure...';
    }, 1200);

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '100%';
      if (modal) modal.classList.remove('active');

      if (isSimulatedFailure) {
        this.showToast('Transacción rechazada por entidad bancaria (#DECLINED-SEC-054)', 'error');
        this.navigateTo('error');
      } else {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const orderId = `#PKM-2026-${randomNum}`;

        const orderData = this.buildOrderData(orderId, nameInput.value, emailInput.value, 'Tarjeta de Crédito');
        this.saveLastOrder(orderData);

        this.state.cart = [];
        this.updateCartBadge();
        this.renderCart();

        this.showToast(`¡Pago exitoso! Orden confirmada: ${orderId}`, 'success');
        this.navigateTo('confirmation');
      }
    }, 2500);
  },

  buildOrderData(orderId, buyerName, buyerEmail, paymentLabel) {
    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * APP_CONFIG.TAX_RATE;
    const shipping = this.state.shippingFee;
    const total = subtotal + tax + shipping;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return {
      orderId,
      date: formattedDate,
      buyerName,
      buyerEmail,
      paymentMethod: paymentLabel,
      deliveryMethod: this.state.deliveryMethod === 'courier' ? 'Envío a Domicilio ($5.00)' : 'Retiro en Local Central ($0.00)',
      items: [...this.state.cart],
      subtotal,
      tax,
      shipping,
      total
    };
  },

  // =========================================================================
  // REQUERIMIENTO 6: HISTORIAL DE TRACKING DINÁMICO (ÚLTIMA ORDEN REAL)
  // =========================================================================
  saveLastOrder(orderData) {
    try {
      localStorage.setItem('gstcg_last_order', JSON.stringify(orderData));
    } catch (e) {
      console.warn('Error al guardar orden en localStorage:', e);
    }
    this.renderDynamicConfirmation(orderData);
  },

  renderDynamicConfirmation(order) {
    const orderBadge = document.getElementById('confirm-order-id');
    if (orderBadge) orderBadge.innerText = `Número de Orden: ${order.orderId}`;

    const emailSpan = document.getElementById('confirm-email-recipient');
    if (emailSpan) emailSpan.innerText = order.buyerEmail;

    const cashNotice = document.getElementById('confirm-cash-notice');
    if (cashNotice) {
      if (order.paymentMethod.includes('Efectivo')) {
        cashNotice.classList.remove('hidden');
      } else {
        cashNotice.classList.add('hidden');
      }
    }

    const breakdownContainer = document.getElementById('confirm-breakdown-container');
    if (breakdownContainer) {
      breakdownContainer.innerHTML = `
        <h2 class="font-black text-brand-charcoal text-sm uppercase tracking-wider mb-2">Desglose de la Transacción</h2>
        ${order.items.map(item => `
          <div class="flex justify-between text-brand-muted">
            <span>${item.quantity}x ${item.name} (${item.condition})</span>
            <span class="font-bold text-brand-charcoal">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        `).join('')}
        <div class="flex justify-between text-brand-muted border-t border-slate-200 pt-2">
          <span>${order.deliveryMethod}:</span>
          <span class="font-bold text-brand-charcoal">$${order.shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="flex justify-between text-brand-muted">
          <span>Impuestos (IVA 15%):</span>
          <span class="font-bold text-brand-charcoal">$${order.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="flex justify-between font-black text-base text-brand-charcoal border-t border-slate-300 pt-2">
          <span>Total (${order.paymentMethod}):</span>
          <span class="text-brand-red">$${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
      `;
    }
  },

  renderDynamicTracking() {
    let order = null;
    try {
      const saved = localStorage.getItem('gstcg_last_order');
      if (saved) order = JSON.parse(saved);
    } catch (e) {}

    const orderIdEl = document.getElementById('tracking-order-id');
    const orderDateEl = document.getElementById('tracking-order-date');
    const itemsContainer = document.getElementById('tracking-items-container');
    const emptyState = document.getElementById('tracking-empty-state');
    const activeOrderBox = document.getElementById('tracking-active-order-box');

    if (!order) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (activeOrderBox) activeOrderBox.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (activeOrderBox) activeOrderBox.classList.remove('hidden');

    if (orderIdEl) orderIdEl.innerText = `ORDEN ${order.orderId}`;
    if (orderDateEl) orderDateEl.innerText = `Fecha: ${order.date} • Titular: ${order.buyerName} • Método: ${order.deliveryMethod}`;

    if (itemsContainer) {
      itemsContainer.innerHTML = order.items.map(item => `
        <div class="flex items-center justify-between p-3.5 bg-brand-surface border border-brand-border rounded-xl">
          <div class="flex items-center gap-3">
            <img 
              src="${item.imageLocal}" 
              alt="${item.name}" 
              class="w-12 h-16 object-contain bg-white rounded border border-slate-200" 
              onerror="this.onerror=null; this.src='${item.imageFallback}'"
            />
            <div>
              <h3 class="text-sm font-bold text-brand-charcoal">${item.name}</h3>
              <span class="text-xs text-brand-muted">${item.condition} • Cantidad: ${item.quantity}</span>
            </div>
          </div>
          <span class="text-sm font-black text-brand-charcoal">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      `).join('');
    }
    lucide.createIcons();
  },

  // =========================================================================
  // REQUERIMIENTO 1: LIMPIEZA DE FORMULARIOS Y RESET DE PESTAÑAS
  // =========================================================================
  switchAuthTab(tab) {
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const sectionLogin = document.getElementById('auth-section-login');
    const sectionRegister = document.getElementById('auth-section-register');

    // Reset fields on tab change
    this.resetAuthFormInputs();

    if (tab === 'login') {
      if (tabLogin) tabLogin.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-brand-red text-brand-charcoal';
      if (tabRegister) tabRegister.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-transparent text-brand-muted hover:text-brand-charcoal';
      if (sectionLogin) sectionLogin.classList.remove('hidden');
      if (sectionRegister) sectionRegister.classList.add('hidden');
    } else {
      if (tabLogin) tabLogin.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-transparent text-brand-muted hover:text-brand-charcoal';
      if (tabRegister) tabRegister.className = 'flex-1 py-2.5 text-xs font-bold border-b-2 border-brand-red text-brand-charcoal';
      if (sectionLogin) sectionLogin.classList.add('hidden');
      if (sectionRegister) sectionRegister.classList.remove('hidden');
    }
  },

  resetAuthFormInputs() {
    ['auth-email', 'auth-password', 'reg-name', 'reg-id', 'reg-email', 'reg-pass', 'reg-pass-confirm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const checkRemember = document.getElementById('auth-remember');
    if (checkRemember) checkRemember.checked = false;
    const checkTerms = document.getElementById('reg-terms');
    if (checkTerms) checkTerms.checked = false;
  },

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
      if (userBtn) userBtn.classList.add('border-brand-red', 'bg-red-50');
    } else {
      if (userLabel) userLabel.innerText = 'Mi Cuenta';
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (userBtn) userBtn.classList.remove('border-brand-red', 'bg-red-50');
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
    }
  },

  handleLogin(email, password) {
    if (!email || !password) {
      this.showToast('Por favor completa correo y contraseña.', 'error');
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
    this.resetAuthFormInputs();
    this.updateUserNavbarUI();
    this.syncCheckoutWithSession();
    this.showToast(`¡Bienvenido de vuelta, ${userObj.name}!`, 'success');
    this.navigateTo('home');
  },

  handleRegister(name, idCard, email, password) {
    if (!name || !email || !password) {
      this.showToast('Por favor completa todos los campos obligatorios.', 'error');
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
    this.resetAuthFormInputs();
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
    const nameInput = document.getElementById('guest-name'); if (nameInput) nameInput.value = '';
    const idInput = document.getElementById('guest-id'); if (idInput) idInput.value = '';
    const emailInput = document.getElementById('guest-email'); if (emailInput) emailInput.value = '';
    const phoneInput = document.getElementById('guest-phone'); if (phoneInput) phoneInput.value = '';
    this.showToast('Sesión cerrada correctamente.', 'info');
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

  // =========================================================================
  // REQUERIMIENTO 4: FORMATO DE TELÉFONO ECUATORIANO (+593)
  // =========================================================================
  setupPhoneInput() {
    const phoneInput = document.getElementById('guest-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        // Bloquear caracteres no numéricos y limitar a 10 dígitos
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      });
    }
  },

  // =========================================================================
  // REQUERIMIENTO 5: VALIDACIÓN ALGORÍTMICA DE CÉDULA ECUATORIANA (MÓDULO 10)
  // =========================================================================
  isValidEcuadorianId(cedula) {
    if (!cedula || typeof cedula !== 'string') return false;
    const clean = cedula.trim().replace(/\D/g, '');
    if (clean.length !== 10) return false;

    // 1. Código de provincia: 01 a 24
    const provincia = parseInt(clean.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    // 2. Tercer dígito menor a 6 (personas naturales)
    const tercerDigito = parseInt(clean.charAt(2), 10);
    if (tercerDigito >= 6) return false;

    // 3. Algoritmo Módulo 10
    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(clean.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const residuo = suma % 10;
    const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
    const digitoValidar = parseInt(clean.charAt(9), 10);

    return digitoVerificador === digitoValidar;
  },

  setupIdValidation() {
    const idInput = document.getElementById('guest-id');
    if (!idInput) return;

    const validateAndRender = () => {
      const val = idInput.value.trim();
      if (val.length === 0) {
        this.clearIdValidationUI();
        return;
      }
      if (val.length === 10) {
        const isValid = this.isValidEcuadorianId(val);
        this.updateIdValidationUI(isValid);
      } else {
        this.updateIdValidationUI(false);
      }
    };

    idInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      validateAndRender();
    });

    idInput.addEventListener('blur', () => {
      validateAndRender();
    });

    // Validar también el campo de registro si existe
    const regId = document.getElementById('reg-id');
    if (regId) {
      regId.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
      });
    }
  },

  updateIdValidationUI(isValid) {
    const idInput = document.getElementById('guest-id');
    const errorMsg = document.getElementById('guest-id-error');
    if (!idInput || !errorMsg) return;

    if (isValid) {
      idInput.classList.remove('border-red-500', 'bg-red-50/20');
      idInput.classList.add('border-emerald-500');
      errorMsg.classList.add('hidden');
    } else {
      idInput.classList.remove('border-emerald-500');
      idInput.classList.add('border-red-500', 'bg-red-50/20');
      errorMsg.classList.remove('hidden');
    }
  },

  clearIdValidationUI() {
    const idInput = document.getElementById('guest-id');
    const errorMsg = document.getElementById('guest-id-error');
    if (!idInput || !errorMsg) return;
    idInput.classList.remove('border-red-500', 'bg-red-50/20', 'border-emerald-500');
    errorMsg.classList.add('hidden');
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
