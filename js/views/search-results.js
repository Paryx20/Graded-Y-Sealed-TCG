/**
 * ==============================================================================
 * SearchResultsView - Decoupled Search Results View (Phase 6)
 * File: js/views/search-results.js
 * 
 * Features:
 *   - Route: #search-results?q=<query>
 *   - 400ms debounce on keystroke input
 *   - Animated skeleton loader indicators (animate-pulse, skeleton-card)
 *   - Informative, user-friendly zero-results state
 *   - Card grid with source attribution badges (pokemontcg.io, tcgdex.net, local-vault)
 *   - Integrated CTAs (PDP deep link, add to cart, catalog exploration)
 * ==============================================================================
 */

const SearchResultsView = {
  currentQuery: '',
  isLoading: false,
  results: [],
  _debounceTimer: null,

  /**
   * Generates the primary HTML shell for the decoupled search results view
   * @param {string} initialQuery
   * @returns {string} HTML markup
   */
  render(initialQuery = '') {
    this.currentQuery = (initialQuery || '').trim();

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <!-- Header Banner -->
        <div class="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-extrabold text-[#FEF3C7] uppercase tracking-wider mb-1">
              <i data-lucide="cpu" class="w-3.5 h-3.5 text-[#D97706]"></i>
              <span>Doble API con Failover Automático • 3-Tier Cascade</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black tracking-tight">Búsqueda Multifuente en Tiempo Real</h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Consulta en cascada automática: <strong>pokemontcg.io</strong> → <strong>tcgdex.net</strong> → <strong>Bóveda Local G&amp;S</strong> con tolerancia a desconexión y latencia.
            </p>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] border border-slate-700 rounded-xl font-bold text-slate-200">
              <span class="w-2 h-2 rounded-full bg-[#059669] animate-ping"></span>
              <span>API Gateway Activo</span>
            </span>
          </div>
        </div>

        <!-- Search Bar with 400ms Debounce Input -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200 mb-8">
          <form onsubmit="event.preventDefault(); SearchResultsView.submitForm();" class="relative flex items-center w-full" role="search">
            <i data-lucide="search" class="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none"></i>
            <input 
              id="search-view-input"
              type="search"
              autocomplete="off"
              value="${this._escapeHtml(this.currentQuery)}"
              placeholder="Escribe el nombre de un Pokémon, carta, expansión (e.g. Charizard, Moonbreon, Base Set)..."
              class="w-full pl-12 pr-28 py-3.5 text-sm sm:text-base bg-slate-50 border-2 border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 font-medium focus:bg-white focus:border-[#E11D48] focus:outline-none transition shadow-inner"
              oninput="SearchResultsView.handleInput(this.value)"
            />
            <button 
              type="submit"
              class="absolute right-2 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-black rounded-lg transition shadow flex items-center gap-1.5 touch-target"
            >
              <span>Buscar</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </form>

          <!-- Quick Suggestion Tags -->
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span class="font-bold text-slate-400">Búsquedas rápidas:</span>
            <button type="button" onclick="SearchResultsView.quickSearch('Charizard')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Charizard</button>
            <button type="button" onclick="SearchResultsView.quickSearch('Umbreon')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Umbreon</button>
            <button type="button" onclick="SearchResultsView.quickSearch('Lugia')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Lugia</button>
            <button type="button" onclick="SearchResultsView.quickSearch('Pikachu')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Pikachu</button>
            <button type="button" onclick="SearchResultsView.quickSearch('Base Set')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Base Set</button>
            <button type="button" onclick="SearchResultsView.quickSearch('Team Rocket')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition">Team Rocket</button>
          </div>
        </div>

        <!-- Dynamic Results Container -->
        <div id="search-results-container">
          ${this.currentQuery ? this.renderLoadingSkeleton() : this.renderInitialPrompt()}
        </div>
      </div>
    `;
  },

  /**
   * Executed after DOM injection to wire up listeners and trigger search
   */
  afterRender() {
    const input = document.getElementById('search-view-input');
    if (input) {
      input.focus();
      if (this.currentQuery) {
        input.value = this.currentQuery;
        this.executeSearch(this.currentQuery);
      }
    }
  },

  /**
   * Handles user keystrokes in search input with 400ms debounce
   * @param {string} val
   */
  handleInput(val) {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    const q = (val || '').trim();
    this.currentQuery = q;

    // Show skeletons immediately if query has at least 1 character
    if (q) {
      const container = document.getElementById('search-results-container');
      if (container && !this.isLoading) {
        container.innerHTML = this.renderLoadingSkeleton();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      }
    }

    this._debounceTimer = setTimeout(() => {
      this._updateHashSilently(q);
      if (q) {
        this.executeSearch(q);
      } else {
        const container = document.getElementById('search-results-container');
        if (container) {
          container.innerHTML = this.renderInitialPrompt();
          if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
        }
      }
    }, 400);
  },

  submitForm() {
    const input = document.getElementById('search-view-input');
    const q = input ? (input.value || '').trim() : this.currentQuery;
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this.currentQuery = q;
    this._updateHashSilently(q);
    this.executeSearch(q);
  },

  quickSearch(term) {
    const input = document.getElementById('search-view-input');
    if (input) input.value = term;
    this.currentQuery = term;
    this._updateHashSilently(term);
    this.executeSearch(term);
  },

  _updateHashSilently(query) {
    const target = `#search-results?q=${encodeURIComponent(query)}`;
    if (window.location.hash !== target) {
      if (typeof history !== 'undefined' && history.replaceState) {
        history.replaceState(null, '', target);
      } else {
        window.location.hash = target;
      }
    }
  },

  /**
   * Executes cascade search against PokemonAPI and renders results
   * @param {string} query
   */
  async executeSearch(query) {
    const q = (query || '').trim();
    const container = document.getElementById('search-results-container');
    if (!container) return;

    if (!q) {
      container.innerHTML = this.renderInitialPrompt();
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
      return;
    }

    this.isLoading = true;
    container.innerHTML = this.renderLoadingSkeleton();
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

    try {
      const api = (typeof PokemonAPI !== 'undefined') ? PokemonAPI : null;
      let items = [];
      if (api && typeof api.searchCards === 'function') {
        items = await api.searchCards(q);
      } else if (typeof PRODUCTS !== 'undefined') {
        // Fallback directly to local vault if PokemonAPI is not yet attached
        const qLow = q.toLowerCase();
        items = PRODUCTS.filter(p =>
          p.nombre.toLowerCase().includes(qLow) ||
          p.set.toLowerCase().includes(qLow) ||
          (p.tipo && p.tipo.toLowerCase().includes(qLow))
        ).map(p => ({
          id: p.id,
          nombre: p.nombre,
          set: p.set,
          rareza: p.rareza,
          imagen: p.imagenLocal || p.imagenFallbackUrl,
          precioEstimado: p.precios ? (p.precios.psa10 || p.precios.raw) : 50.00,
          fuente: 'local-vault'
        }));
      }

      this.results = items;
      this.isLoading = false;

      if (!items || items.length === 0) {
        container.innerHTML = this.renderZeroState(q);
      } else {
        container.innerHTML = this.renderResultsGrid(items, q);
      }
    } catch (err) {
      console.error('[SearchResultsView] Search error:', err);
      this.isLoading = false;
      container.innerHTML = `
        <div class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800">
          <p class="font-bold">Ocurrió un error inesperado al procesar la búsqueda.</p>
          <p class="text-xs mt-1 text-rose-600">${this._escapeHtml(err.message || String(err))}</p>
          <button type="button" onclick="SearchResultsView.executeSearch('${this._escapeHtml(q)}')" class="mt-4 px-4 py-2 bg-[#E11D48] text-white text-xs font-bold rounded-xl shadow">Reintentar Búsqueda</button>
        </div>
      `;
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  },

  /**
   * Renders animated skeleton card indicators
   * @returns {string} HTML markup
   */
  renderLoadingSkeleton() {
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-ping"></span>
            <span>Consultando fuentes primarias y de respaldo...</span>
          </span>
        </div>

        <div id="search-skeletons" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          ${[1, 2, 3, 4, 5, 6, 7, 8].map(() => `
            <div class="skeleton-card animate-pulse bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
              <div class="bg-slate-200 h-52 rounded-xl w-full"></div>
              <div class="space-y-2 pt-2">
                <div class="bg-slate-200 h-4 rounded w-3/4"></div>
                <div class="bg-slate-200 h-3 rounded w-1/2"></div>
              </div>
              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="bg-slate-200 h-5 rounded w-20"></div>
                <div class="bg-slate-200 h-8 rounded-lg w-24"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Renders informative zero-results state
   * @param {string} query
   * @returns {string} HTML markup
   */
  renderZeroState(query) {
    const qEscaped = this._escapeHtml(query);
    return `
      <div id="search-zero-state" class="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <i data-lucide="search-x" class="w-8 h-8 text-[#E11D48]"></i>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-[#0F172A] mb-2">No encontramos resultados para "${qEscaped}"</h2>
        <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
          Intenta buscando por nombre de Pokémon, expansión (Base Set) o rareza.
        </p>

        <div class="bg-slate-50 rounded-xl p-4 text-left text-xs text-slate-600 border border-slate-100 mb-6 space-y-2">
          <p class="font-bold text-[#0F172A] flex items-center gap-1.5">
            <i data-lucide="help-circle" class="w-4 h-4 text-[#D97706]"></i>
            <span>Recomendaciones para afinar tu búsqueda:</span>
          </p>
          <ul class="list-disc list-inside space-y-1 text-slate-500 pl-1">
            <li>Verifica la ortografía del Pokémon (ej: "Charizard", "Mewtwo", "Umbreon").</li>
            <li>Busca por número de carta o set (ej: "Neo Genesis", "Evolving Skies", "WotC").</li>
            <li>Prueba con términos genéricos como "Booster Box" o "Holo".</li>
          </ul>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-2">
          <span class="text-xs text-slate-400 font-bold mr-1">Sugerencias:</span>
          <button type="button" onclick="SearchResultsView.quickSearch('Charizard')" class="text-xs font-bold text-[#E11D48] hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition">Charizard Base Set</button>
          <button type="button" onclick="SearchResultsView.quickSearch('Umbreon')" class="text-xs font-bold text-[#E11D48] hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition">Moonbreon Alt Art</button>
          <button type="button" onclick="SearchResultsView.quickSearch('Lugia')" class="text-xs font-bold text-[#E11D48] hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition">Lugia 1st Edition</button>
          <a href="#catalog" class="text-xs font-bold text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition">Ver Catálogo Completo →</a>
        </div>
      </div>
    `;
  },

  /**
   * Renders initial empty state before user types anything
   * @returns {string} HTML markup
   */
  renderInitialPrompt() {
    return `
      <div class="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto">
        <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto mb-4">
          <i data-lucide="sparkles" class="w-8 h-8 text-[#D97706]"></i>
        </div>
        <h2 class="text-xl font-black text-[#0F172A] mb-2">Comienza a escribir para buscar</h2>
        <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
          Escribe al menos 2 letras en la barra de búsqueda superior para activar la consulta multifuente.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onclick="SearchResultsView.quickSearch('Charizard')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition">Charizard</button>
          <button type="button" onclick="SearchResultsView.quickSearch('Pikachu')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition">Pikachu</button>
          <button type="button" onclick="SearchResultsView.quickSearch('Booster')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-lg transition">Cajas Selladas</button>
        </div>
      </div>
    `;
  },

  /**
   * Renders card grid upon successful fetch
   * @param {Array} items
   * @param {string} query
   * @returns {string} HTML markup
   */
  renderResultsGrid(items, query = '') {
    if (typeof Store !== 'undefined' && Store.registerApiCard && Array.isArray(items)) {
      items.forEach(card => Store.registerApiCard(card));
    }
    const total = items.length;
    const qEscaped = this._escapeHtml(query);

    return `
      <div class="space-y-4">
        <!-- Results stats bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs">
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-[#0F172A]">${total} ${total === 1 ? 'carta encontrada' : 'cartas encontradas'}</span>
            ${query ? `<span class="text-slate-400">para "${qEscaped}"</span>` : ''}
          </div>
          <div class="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#059669]"></span>
              <span>pokemontcg.io</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <span>tcgdex.net</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-[#D97706]"></span>
              <span>Bóveda Local</span>
            </span>
          </div>
        </div>

        <!-- Cards Grid -->
        <div id="search-results-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          ${items.map(card => this._renderCardItem(card)).join('')}
        </div>
      </div>
    `;
  },

  _renderCardItem(card) {
    const isLocal = card.fuente === 'local-vault';
    const isPokemontcg = card.fuente === 'pokemontcg.io';
    const isTcgdex = card.fuente === 'tcgdex.net';

    let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    let badgeText = 'Bóveda Local G&S';
    if (isPokemontcg) {
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      badgeText = 'API pokemontcg.io';
    } else if (isTcgdex) {
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
      badgeText = 'Respaldo tcgdex.net';
    }

    // Determine if card matches an existing local vault item
    const matchedVaultProduct = (typeof PRODUCTS !== 'undefined')
      ? PRODUCTS.find(p => p.id === card.id || p.nombre.toLowerCase() === (card.nombre || '').toLowerCase())
      : null;

    const formattedPrice = Number(card.precioEstimado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `
      <div class="card-item bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group">
        <div>
          <!-- Card Header / Source Badge -->
          <div class="p-3 pb-0 flex items-center justify-between text-[10px]">
            <span class="font-extrabold uppercase px-2 py-0.5 rounded-full border ${badgeClass}">
              ${badgeText}
            </span>
            <span class="font-bold text-slate-500">${this._escapeHtml(card.rareza || 'Coleccionable')}</span>
          </div>

          <!-- Card Thumbnail -->
          <div 
            onclick="app.openProductPDP('${card.id}')"
            class="p-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white min-h-[220px] cursor-pointer"
          >
            <img 
              src="${card.imagen || 'img/cards/card-back.png'}" 
              alt="${this._escapeHtml(card.nombre)}" 
              class="max-h-48 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
              onerror="this.onerror=null; this.src='img/cards/card-back.png'"
              loading="lazy"
            />
          </div>

          <!-- Card Details -->
          <div 
            onclick="app.openProductPDP('${card.id}')"
            class="px-4 pb-2 cursor-pointer"
          >
            <h3 class="text-sm font-extrabold text-[#0F172A] line-clamp-1 group-hover:text-[#E11D48] transition">
              ${this._escapeHtml(card.nombre)}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">${this._escapeHtml(card.set || 'Expansión')}</p>
          </div>
        </div>

        <!-- Footer / Pricing & Actions -->
        <div class="p-4 pt-3 border-t border-slate-100 bg-slate-50/60">
          <div class="flex items-baseline justify-between mb-3">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Cotización Est.</span>
              <span class="text-base font-black text-[#0F172A]">$${formattedPrice}</span>
            </div>
            ${matchedVaultProduct ? `
              <span class="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">
                En Custodia
              </span>
            ` : `
              <span class="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                Mercado Global
              </span>
            `}
          </div>

          <div class="grid grid-cols-1 gap-2">
            ${matchedVaultProduct ? `
              <button 
                type="button" 
                onclick="app.openProductPDP('${matchedVaultProduct.id}')"
                class="w-full py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5 touch-target"
              >
                <i data-lucide="eye" class="w-3.5 h-3.5 text-[#FEF3C7]"></i>
                <span>Ver Detalle Bóveda</span>
              </button>
            ` : `
              <button 
                type="button" 
                onclick="SearchResultsView.handleCardAction('${card.id}')"
                data-action="SearchResultsView.openQuoteModal"
                class="w-full py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5 touch-target"
              >
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                <span>Solicitar Adquisición</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  handleCardAction(cardId) {
    if (!cardId) return;
    const cleanId = String(cardId).trim();

    // Ensure card is registered in Store.data.apiCardsCache
    if (typeof Store !== 'undefined' && typeof Store.registerApiCard === 'function') {
      const card = Array.isArray(this.results) ? this.results.find(c => c.id === cleanId) : null;
      if (card) {
        Store.registerApiCard(card);
      }
    }

    // Direct navigation to 3D Product Detail Page with realistic market pricing
    if (typeof app !== 'undefined' && typeof app.openProductPDP === 'function') {
      app.openProductPDP(cleanId);
    }
  },

  // Backward-compatible alias for existing tests or callers
  openQuoteModal(name, set, price, cardId) {
    const targetId = cardId || (typeof name === 'string' && (this.results?.find(c => c.id === name || c.nombre === name)?.id || name));
    this.handleCardAction(targetId);
  },

  _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/on\w+\s*=/gi, '');
  }
};

if (typeof window !== 'undefined') {
  window.SearchResultsView = SearchResultsView;
}
if (typeof globalThis !== 'undefined') {
  globalThis.SearchResultsView = SearchResultsView;
}
