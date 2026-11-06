/**
 * Explorar cartas (pages/busqueda.html, ruta "search-results").
 *
 * Consulta la base pública de cartas Pokémon (pokemontcg.io y, si falla, TCGdex)
 * a través de PokemonAPI. Es una página de referencia: no muestra precios ni
 * permite comprar. Si una carta coincide con un producto en stock de la tienda,
 * se enlaza a su ficha. El buscador de la tienda es otro: el de la navbar.
 */
const SearchResultsView = {
  currentQuery: '',
  isLoading: false,
  results: [],
  _debounceTimer: null,
  _searchId: 0,
  _dialogReturnFocus: null,

  SOURCE_LABELS: {
    'pokemontcg.io': 'Pokémon TCG API',
    'tcgdex.net': 'TCGdex'
  },

  render(initialQuery = '') {
    this.currentQuery = (initialQuery || '').trim();
    if (typeof document !== 'undefined') {
      document.title = this.currentQuery
        ? `Explorar cartas: ${this.currentQuery} | Graded & Sealed TCG`
        : 'Explorar cartas | Graded & Sealed TCG';
    }

    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div class="mb-6 pb-5 border-b border-slate-200">
          <nav aria-label="Ruta de navegación" class="text-xs text-slate-600 mb-1.5">
            <a href="index.html" class="hover:text-[#BE123C] hover:underline">Inicio</a>
            <span aria-hidden="true" class="mx-1">/</span>
            <span aria-current="page">Explorar cartas</span>
          </nav>
          <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A]">Explorar cartas</h1>
          <p class="text-sm text-slate-600 mt-1 max-w-2xl">
            Consulta cualquier carta del juego en una base de datos pública: set, número, rareza e ilustración.
          </p>
        </div>

        <div class="flex items-start gap-3 rounded-md border border-[#B45309]/30 bg-[#FEF3C7]/50 px-4 py-3 mb-6 text-sm text-[#78350F]" role="note">
          <i data-lucide="info" class="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true"></i>
          <p>
            Estas cartas vienen de una base de datos pública y <strong>no forman parte de nuestro inventario</strong>.
            Para comprar, usa el buscador de la tienda o
            <a href="${app.url('catalog')}" class="font-semibold underline underline-offset-2 hover:text-[#BE123C]">revisa el catálogo</a>.
          </p>
        </div>

        <form onsubmit="event.preventDefault(); SearchResultsView.submitForm();" role="search" aria-label="Buscar en la base de cartas" class="flex flex-col sm:flex-row gap-2 mb-3">
          <label for="search-view-input" class="sr-only">Nombre de la carta o del Pokémon</label>
          <div class="relative flex-1">
            <i data-lucide="database" class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true"></i>
            <input
              id="search-view-input"
              type="search"
              autocomplete="off"
              value="${this._escapeHtml(this.currentQuery)}"
              placeholder="Ej.: Charizard, Umbreon, Lugia"
              class="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-md text-[#0F172A] placeholder-slate-500 focus:border-[#0F172A]"
              oninput="SearchResultsView.handleInput(this.value)"
            />
          </div>
          <button type="submit" class="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold rounded-md touch-target">
            Buscar en la base
          </button>
        </form>

        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-8">
          <span>Prueba con:</span>
          ${['Charizard', 'Umbreon', 'Lugia', 'Pikachu', 'Mewtwo'].map(name => `
            <button type="button" onclick="SearchResultsView.quickSearch('${name}')" class="px-2.5 py-1 min-h-[28px] border border-slate-300 hover:border-[#0F172A] rounded-md text-slate-700 bg-white">${name}</button>
          `).join('')}
        </div>

        <div id="search-results-container" aria-live="polite">
          ${this.currentQuery ? this.renderLoadingSkeleton() : this.renderInitialPrompt()}
        </div>
      </div>

      <div id="explore-card-dialog" class="explore-dialog fixed inset-0 z-50 items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-hidden="true" aria-modal="true" aria-labelledby="explore-card-title">
        <div class="bg-white rounded-lg shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto" id="explore-card-dialog-body"></div>
      </div>
    `;
  },

  afterRender() {
    const input = document.getElementById('search-view-input');
    if (input) {
      input.focus();
      if (this.currentQuery) this.executeSearch(this.currentQuery);
    }
    const dialog = document.getElementById('explore-card-dialog');
    if (dialog && typeof dialog.addEventListener === 'function') {
      dialog.addEventListener('click', (e) => { if (e.target === dialog) this.closeCard(); });
    }
  },

  // Espera 400 ms desde la última tecla antes de consultar la API
  handleInput(val) {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    const q = (val || '').trim();
    this.currentQuery = q;
    const container = document.getElementById('search-results-container');
    if (!q) {
      if (container) container.innerHTML = this.renderInitialPrompt();
      app.refreshIcons();
      return;
    }
    if (container && !this.isLoading) container.innerHTML = this.renderLoadingSkeleton();
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null;
      this.updateUrl(q);
      this.executeSearch(q);
    }, 400);
  },

  submitForm() {
    const input = document.getElementById('search-view-input');
    const q = input ? input.value.trim() : this.currentQuery;
    if (this._debounceTimer) { clearTimeout(this._debounceTimer); this._debounceTimer = null; }
    this.currentQuery = q;
    this.updateUrl(q);
    this.executeSearch(q);
  },

  quickSearch(q) {
    const input = document.getElementById('search-view-input');
    if (input) input.value = q;
    this.currentQuery = q;
    this.updateUrl(q);
    this.executeSearch(q);
  },

  updateUrl(q) {
    if (typeof history === 'undefined' || typeof app === 'undefined') return;
    try { history.replaceState(null, '', app.url('search-results', q ? { q } : null)); } catch (e) { /* sin historial */ }
  },

  async executeSearch(query) {
    const q = (query || '').trim();
    const container = document.getElementById('search-results-container');
    if (!container) return;

    if (!q) {
      container.innerHTML = this.renderInitialPrompt();
      app.refreshIcons();
      return;
    }

    const searchId = ++this._searchId;
    this.isLoading = true;
    container.innerHTML = this.renderLoadingSkeleton();
    app.refreshIcons();

    let items = [];
    let failed = false;
    try {
      const all = (typeof PokemonAPI !== 'undefined' && PokemonAPI.searchCards) ? await PokemonAPI.searchCards(q) : [];
      // El respaldo local de PokemonAPI no se mezcla aquí: si las dos APIs fallan es un error de conexión
      items = (all || []).filter(c => c.fuente === 'pokemontcg.io' || c.fuente === 'tcgdex.net');
      failed = (all || []).length > 0 && items.length === 0;
    } catch (err) {
      failed = true;
    }
    if (searchId !== this._searchId) return; // llegó una búsqueda más reciente

    this.results = items;
    this.isLoading = false;
    container.innerHTML = failed
      ? this.renderErrorState(q)
      : items.length ? this.renderResultsGrid(items, q) : this.renderZeroState(q);
    app.refreshIcons();
  },

  // Producto en stock de la tienda que es la misma carta: mismo nombre y además
  // mismo número de carta o mismo set. Si no se puede confirmar, no se enlaza.
  findStoreMatch(card) {
    if (typeof PRODUCTS === 'undefined' || !card) return null;
    const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const name = norm(card.nombre);
    if (!name) return null;
    const apiNumber = this.cardNumber(card).replace(/^0+/, '');
    const inStock = p => typeof CatalogView === 'undefined' || !CatalogView.matchesCategory || CatalogView.matchesCategory(p, 'all');
    const isSealed = p => typeof CatalogView !== 'undefined' && CatalogView.isSealedItem && CatalogView.isSealedItem(p);
    return PRODUCTS.find(p => {
      if (isSealed(p) || !inStock(p)) return false;
      const storeName = norm(p.nombre);
      if (storeName !== name && !storeName.startsWith(name + ' ')) return false;
      const storeNumber = ((p.nombre || '').match(/#\s*0*(\d+)/) || [])[1];
      if (storeNumber && apiNumber) return storeNumber === apiNumber;
      return this.hasRealSet(card) && Boolean(p.set) && norm(p.set).includes(norm(card.set).split(' ')[0]);
    }) || null;
  },

  // TCGdex no devuelve el nombre del set en la búsqueda: se muestra el código del id
  hasRealSet(card) {
    return Boolean(card && card.set && !/^(TCG Set|Expansion)$/i.test(card.set));
  },

  setLabel(card) {
    if (this.hasRealSet(card)) return card.set;
    const m = String(card.id || '').match(/^(.+)-[A-Za-z0-9]+$/);
    return m ? `Set ${m[1].toUpperCase()}` : 'Set desconocido';
  },

  cardNumber(card) {
    const m = String(card.id || '').match(/-([A-Za-z0-9]+)$/);
    return m ? m[1] : '';
  },

  largeImage(card) {
    const img = card.imagen || '';
    if (/images\.pokemontcg\.io\/.+\/\w+\.png$/.test(img) && !/_hires\.png$/.test(img)) return img.replace(/\.png$/, '_hires.png');
    return img;
  },

  renderLoadingSkeleton() {
    return `
      <div id="search-skeletons">
        <p class="sr-only">Buscando cartas…</p>
        <ul class="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white" aria-hidden="true">
          ${Array.from({ length: 8 }).map(() => `
            <li class="skeleton-card motion-safe:animate-pulse flex items-center gap-4 p-3">
              <div class="w-12 h-16 rounded bg-slate-200"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3.5 w-1/3 rounded bg-slate-200"></div>
                <div class="h-3 w-1/2 rounded bg-slate-100"></div>
              </div>
            </li>`).join('')}
        </ul>
      </div>
    `;
  },

  renderInitialPrompt() {
    return `
      <div class="border border-dashed border-slate-300 rounded-lg p-10 text-center bg-white">
        <i data-lucide="database" class="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true"></i>
        <h2 class="text-base font-semibold text-[#0F172A]">Comienza a escribir para buscar</h2>
        <p class="text-sm text-slate-600 mt-1">Escribe el nombre de una carta o de un Pokémon. Los resultados son solo informativos.</p>
      </div>
    `;
  },

  renderZeroState(query) {
    // Además de escapar, se quitan atributos de evento escritos en la consulta
    const q = this._escapeHtml(query).replace(/on\w+\s*=/gi, '');
    return `
      <div id="search-zero-state" class="border border-slate-200 rounded-lg p-10 text-center bg-white">
        <i data-lucide="search-x" class="w-8 h-8 text-slate-400 mx-auto mb-3" aria-hidden="true"></i>
        <h2 class="text-base font-semibold text-[#0F172A]">No encontramos resultados para "${q}"</h2>
        <p class="text-sm text-slate-600 mt-1">Revisa la ortografía o busca solo el nombre del Pokémon.</p>
      </div>
    `;
  },

  renderErrorState(query) {
    const q = this._escapeHtml(query);
    return `
      <div class="border border-rose-200 bg-rose-50 rounded-lg p-8 text-center">
        <i data-lucide="wifi-off" class="w-8 h-8 text-[#BE123C] mx-auto mb-3" aria-hidden="true"></i>
        <h2 class="text-base font-semibold text-[#0F172A]">No se pudo conectar con la base de cartas</h2>
        <p class="text-sm text-slate-700 mt-1">Ocurrió un error inesperado al consultar la base. Inténtalo de nuevo en unos minutos.</p>
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" onclick="SearchResultsView.executeSearch(SearchResultsView.currentQuery)" class="px-4 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-md">Reintentar Búsqueda</button>
          <a href="${app.url('catalog', { q: query })}" class="px-4 py-2 border border-slate-300 bg-white text-sm font-semibold rounded-md text-[#0F172A]">Buscar "${q}" en la tienda</a>
        </div>
      </div>
    `;
  },

  renderResultsGrid(items, query = '') {
    const sources = [...new Set(items.map(c => this.SOURCE_LABELS[c.fuente] || c.fuente))].join(' y ');
    return `
      <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 class="text-sm font-semibold text-[#0F172A]">${items.length} cartas para "${this._escapeHtml(query)}"</h2>
        <p class="text-xs text-slate-600">Fuente: ${this._escapeHtml(sources)}</p>
      </div>
      <ul id="search-results-grid" class="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
        ${items.map((card, i) => this._renderCardItem(card, i)).join('')}
      </ul>
    `;
  },

  _renderCardItem(card, index) {
    const match = this.findStoreMatch(card);
    const number = this.cardNumber(card);
    const name = this._escapeHtml(card.nombre);
    return `
      <li class="explore-row flex items-center gap-4 p-3" data-source="${this._escapeHtml(card.fuente)}">
        <button type="button" onclick="SearchResultsView.openCard(${index}, this)"
          class="flex items-center gap-4 flex-1 min-w-0 text-left rounded-md hover:bg-slate-50 -m-1 p-1"
          aria-label="Ver detalles de ${name}">
          <img src="${this._escapeHtml(card.imagen)}" alt="" width="48" height="67" loading="lazy" decoding="async"
            class="w-12 h-[67px] object-contain bg-slate-50 rounded border border-slate-200 flex-shrink-0"
            onerror="this.onerror=null; this.src='assets/img/cards/card-back.png'" />
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-[#0F172A] truncate">${name}</span>
            <span class="block text-xs text-slate-600 truncate">${this._escapeHtml(this.setLabel(card))}${number ? ` · #${this._escapeHtml(number)}` : ''} · ${this._escapeHtml(card.rareza)}</span>
          </span>
        </button>
        <span class="hidden sm:block text-[11px] text-slate-500 flex-shrink-0">${this._escapeHtml(this.SOURCE_LABELS[card.fuente] || card.fuente)}</span>
        ${match ? `
          <a href="${app.url('pdp', { id: match.id })}" class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#047857] border border-[#047857]/40 bg-[#D1FAE5]/50 rounded-md px-2.5 py-1.5 hover:bg-[#D1FAE5]"
            aria-label="${name} está disponible en la tienda: ver ficha">
            <i data-lucide="store" class="w-3.5 h-3.5" aria-hidden="true"></i>
            En la tienda
          </a>` : ''}
      </li>
    `;
  },

  openCard(index, trigger) {
    const card = this.results[index];
    const dialog = document.getElementById('explore-card-dialog');
    const body = document.getElementById('explore-card-dialog-body');
    if (!card || !dialog || !body) return;
    const match = this.findStoreMatch(card);
    const number = this.cardNumber(card);
    body.innerHTML = `
      <div class="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
        <h2 id="explore-card-title" class="text-lg font-semibold text-[#0F172A]">${this._escapeHtml(card.nombre)}</h2>
        <button type="button" onclick="SearchResultsView.closeCard()" class="icon-btn" aria-label="Cerrar">
          <i data-lucide="x" class="w-5 h-5" aria-hidden="true"></i>
        </button>
      </div>
      <div class="p-4 grid sm:grid-cols-2 gap-5">
        <img src="${this._escapeHtml(this.largeImage(card))}" alt="Carta ${this._escapeHtml(card.nombre)} de ${this._escapeHtml(this.setLabel(card))}"
          width="300" height="418" class="w-full max-w-[300px] mx-auto h-auto rounded-md"
          onerror="this.onerror=null; this.src='${this._escapeHtml(card.imagen)}'" />
        <div class="text-sm">
          <dl class="divide-y divide-slate-100">
            <div class="py-2 flex justify-between gap-3"><dt class="text-slate-600">Set</dt><dd class="font-medium text-right">${this._escapeHtml(this.setLabel(card))}</dd></div>
            ${number ? `<div class="py-2 flex justify-between gap-3"><dt class="text-slate-600">Número</dt><dd class="font-medium">#${this._escapeHtml(number)}</dd></div>` : ''}
            <div class="py-2 flex justify-between gap-3"><dt class="text-slate-600">Rareza</dt><dd class="font-medium text-right">${this._escapeHtml(card.rareza)}</dd></div>
            ${card.tipo ? `<div class="py-2 flex justify-between gap-3"><dt class="text-slate-600">Tipo</dt><dd class="font-medium">${this._escapeHtml(card.tipo)}</dd></div>` : ''}
            <div class="py-2 flex justify-between gap-3"><dt class="text-slate-600">Fuente</dt><dd class="font-medium">${this._escapeHtml(this.SOURCE_LABELS[card.fuente] || card.fuente)}</dd></div>
          </dl>
          ${match
            ? `<a href="${app.url('pdp', { id: match.id })}" class="mt-5 w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md">
                 <i data-lucide="store" class="w-4 h-4" aria-hidden="true"></i> Ver en la tienda
               </a>`
            : `<p class="mt-5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">Esta carta no está en nuestro inventario.</p>`}
        </div>
      </div>
    `;
    this._dialogReturnFocus = trigger || null;
    // El botón que abrió el diálogo recibe el foco al cerrarlo (también con Esc)
    if (trigger && trigger.focus) trigger.focus();
    app.openDialog('explore-card-dialog');
  },

  closeCard() {
    const dialog = document.getElementById('explore-card-dialog');
    if (!dialog) return;
    app.closeDialog('explore-card-dialog', this._dialogReturnFocus);
    this._dialogReturnFocus = null;
  },

  _escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
};

if (typeof window !== 'undefined') {
  window.SearchResultsView = SearchResultsView;
}
