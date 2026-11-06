const CatalogView = {
  mobileFiltersOpen: false,
  PAGE_SIZE: 12,

  // Grados que cuenta cada categoría del catálogo
  CATEGORY_GRADES: {
    raw: ['raw'],
    psa: ['psa8', 'psa9', 'psa10'],
    sealed: ['sealed']
  },

  GRADE_LABELS: {
    raw: 'Raw · Near Mint',
    psa8: 'PSA 8',
    psa9: 'PSA 9',
    psa10: 'PSA 10',
    sealed: 'Sellado de fábrica'
  },

  isSealedItem(card) {
    return card.categoria === 'sealed' || card.tipo_discriminador === 'PRODUCTO_SELLADO';
  },

  gradePrice(card, grade) {
    if (grade === 'sealed') return Number(card.precioUnitario || (card.precios && card.precios.sealed) || 0);
    return Number((card.precios && card.precios[grade]) || 0);
  },

  // Hay stock si el grado tiene precio y la base de datos no lo marca en 0.
  // Sin conexión el stock es desconocido (null) y el producto se muestra.
  inStock(card, grade) {
    if (!(this.gradePrice(card, grade) > 0)) return false;
    const stock = Store.getStock(card.id, grade);
    return stock === null || stock > 0;
  },

  // Grados con stock del producto, limitados a los de la categoría indicada
  availableGrades(card, category = 'all') {
    if (!card) return [];
    const own = this.isSealedItem(card) ? ['sealed'] : ['raw', 'psa8', 'psa9', 'psa10'];
    const allowed = category === 'all' ? own : own.filter(g => (this.CATEGORY_GRADES[category] || []).includes(g));
    return allowed.filter(g => this.inStock(card, g));
  },

  matchesCategory(card, category) {
    if (!card) return false;
    // Slabs PSA y Raw solo muestran cartas; las cajas y sobres van en Sellados
    if (category === 'sealed' && !this.isSealedItem(card)) return false;
    if ((category === 'psa' || category === 'raw') && this.isSealedItem(card)) return false;
    return this.availableGrades(card, category).length > 0;
  },

  // Grado y precio que muestra la tarjeta: el más barato con stock dentro de la categoría
  getDisplayOption(card, category = Store.data.catalogFilters.category) {
    const grades = this.availableGrades(card, category);
    if (!grades.length) return { grade: this.isSealedItem(card) ? 'sealed' : 'raw', price: 0 };
    const grade = grades.reduce((best, g) => (this.gradePrice(card, g) < this.gradePrice(card, best) ? g : best), grades[0]);
    return { grade, price: this.gradePrice(card, grade) };
  },

  // Tipos de energía con al menos un producto en stock, en orden alfabético
  availableTypes() {
    return [...new Set(PRODUCTS.filter(card => this.matchesCategory(card, 'all')).map(card => card.tipo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
  },

  getFilteredProducts() {
    const f = Store.data.catalogFilters;

    const testCard = (card, useCategoryFilter, useEraFilter) => {
      if (useCategoryFilter && !this.matchesCategory(card, f.category)) return false;
      if (useEraFilter && f.era !== 'all' && card.era !== f.era) return false;
      if (useEraFilter && f.set && f.set !== 'all' && card.expansion !== f.set) return false;

      if (f.edition === 'special' && !card.edicionEspecial) return false;

      if (f.onlyFavorites && !Store.isFavorite(card.id)) return false;

      if (f.type !== 'all' && card.tipo !== f.type) return false;

      // Sin el filtro de categoría (búsqueda ampliada) se exige igual que haya stock
      if (!useCategoryFilter && !this.matchesCategory(card, 'all')) return false;

      const refPrice = this.getDisplayOption(card, useCategoryFilter ? f.category : 'all').price;

      const min = f.minPrice !== '' && f.minPrice !== null ? parseFloat(f.minPrice) : null;
      const max = f.maxPrice !== '' && f.maxPrice !== null ? parseFloat(f.maxPrice) : null;

      if (min !== null && !isNaN(min) && refPrice < min) return false;
      if (max !== null && !isNaN(max) && refPrice > max) return false;

      if (f.searchQuery) {
        const q = f.searchQuery.toLowerCase().trim();
        const inName = (card.nombre || '').toLowerCase().includes(q);
        const inSet = (card.set || '').toLowerCase().includes(q);
        const inType = (card.tipo || '').toLowerCase().includes(q);
        const inRarity = (card.rareza || '').toLowerCase().includes(q);
        const inCert = (card.certNumber || '').toLowerCase().includes(q);
        if (!inName && !inSet && !inType && !inRarity && !inCert) return false;
      }

      return true;
    };

    let list = PRODUCTS.filter(card => testCard(card, true, true));

    // Vault search fallback: If a text query produces 0 results within the selected category/era,
    // fallback gracefully to searching across all categories in the vault so the user is never blocked.
    this.isVaultFallback = false;
    if (list.length === 0 && f.searchQuery) {
      const fallbackList = PRODUCTS.filter(card => testCard(card, false, false));
      if (fallbackList.length > 0) {
        list = fallbackList;
        this.isVaultFallback = true;
      }
    }

    const priceOf = card => this.getDisplayOption(card, this.isVaultFallback ? 'all' : f.category).price;
    if (f.sortBy === 'price-asc') {
      list.sort((a, b) => priceOf(a) - priceOf(b));
    } else if (f.sortBy === 'price-desc') {
      list.sort((a, b) => priceOf(b) - priceOf(a));
    } else if (f.sortBy === 'name-asc') {
      list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
    }

    return list;
  },

  getExpansion(slug) {
    return (typeof EXPANSIONES !== 'undefined' && EXPANSIONES.find(e => e.slug === slug)) || null;
  },

  getActiveTitle() {
    const f = Store.data.catalogFilters;
    const exp = f.set && f.set !== 'all' ? this.getExpansion(f.set) : null;
    if (exp) {
      const cat = { psa: ' · Slabs PSA', raw: ' · Cartas raw', sealed: ' · Sellados' }[f.category] || '';
      return `${exp.nombre} (${exp.anio})${cat}`;
    }
    if (f.category === 'psa') return 'Slabs PSA';
    if (f.category === 'raw') return 'Cartas raw';
    if (f.category === 'sealed') return 'Producto sellado';
    if (f.era === 'vintage') return 'Vintage (1999 - 2002)';
    if (f.era === 'modern') return 'Moderno';
    return 'Todo el catálogo';
  },

  // Parámetros de la URL que describen el listado actual
  currentParams(extra) {
    const f = Store.data.catalogFilters;
    const params = {};
    if (f.category && f.category !== 'all') params.cat = f.category;
    else if (f.era && f.era !== 'all') params.era = f.era;
    if (f.set && f.set !== 'all') params.set = f.set;
    if (f.searchQuery) params.q = f.searchQuery;
    Object.assign(params, extra || {});
    if (params.page === 1) delete params.page;
    return Object.keys(params).length ? params : null;
  },

  // Página actual (ajustada al total) y los productos que se muestran en ella
  paginate(list) {
    const f = Store.data.catalogFilters;
    const pages = Math.max(1, Math.ceil(list.length / this.PAGE_SIZE));
    const page = Math.min(Math.max(1, parseInt(f.page, 10) || 1), pages);
    f.page = page;
    const start = (page - 1) * this.PAGE_SIZE;
    return { page, pages, start, items: list.slice(start, start + this.PAGE_SIZE), total: list.length };
  },

  rangeLabel(pg) {
    if (!pg.total) return 'Sin productos';
    return `Mostrando ${pg.start + 1}–${pg.start + pg.items.length} de ${pg.total} productos`;
  },

  // Números de página a mostrar: 1 … 4 5 6 … 10
  pageNumbers(page, pages) {
    const set = new Set([1, pages, page - 1, page, page + 1].filter(n => n >= 1 && n <= pages));
    const nums = [...set].sort((a, b) => a - b);
    const out = [];
    nums.forEach((n, i) => {
      if (i && n - nums[i - 1] > 1) out.push('…');
      out.push(n);
    });
    return out;
  },

  renderPagination(pg) {
    if (pg.pages <= 1) return '';
    const btn = 'inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-md text-sm font-semibold border transition';
    const link = (n, label, content, disabled) => disabled
      ? `<span class="${btn} border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed" aria-disabled="true">${content}</span>`
      : `<a href="${app.url('catalog', this.currentParams({ page: n }))}" onclick="event.preventDefault(); CatalogView.goToPage(${n})" class="${btn} border-slate-300 text-[#0F172A] bg-white hover:bg-slate-50" aria-label="${label}">${content}</a>`;
    return `
      <nav id="catalog-pagination" aria-label="Paginación del catálogo" class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-xs text-slate-600">Página ${pg.page} de ${pg.pages}</p>
        <ul class="flex flex-wrap items-center gap-1.5">
          <li>${link(pg.page - 1, 'Página anterior', '<i data-lucide="chevron-left" class="w-4 h-4" aria-hidden="true"></i><span class="ml-1">Anterior</span>', pg.page === 1)}</li>
          ${this.pageNumbers(pg.page, pg.pages).map(n => n === '…'
            ? '<li><span class="px-1 text-slate-500" aria-hidden="true">…</span></li>'
            : n === pg.page
              ? `<li><span class="${btn} border-[#0F172A] bg-[#0F172A] text-white" aria-current="page" aria-label="Página ${n}, actual">${n}</span></li>`
              : `<li>${link(n, `Ir a la página ${n}`, String(n), false)}</li>`).join('')}
          <li>${link(pg.page + 1, 'Página siguiente', '<span class="mr-1">Siguiente</span><i data-lucide="chevron-right" class="w-4 h-4" aria-hidden="true"></i>', pg.page === pg.pages)}</li>
        </ul>
      </nav>
    `;
  },

  goToPage(n) {
    Store.data.catalogFilters.page = n;
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', app.url('catalog', this.currentParams({ page: Store.data.catalogFilters.page })));
    }
    this.refreshGridOnly();
    const heading = document.getElementById('catalog-results-heading');
    if (heading) {
      heading.scrollIntoView({ block: 'start', behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      heading.focus({ preventScroll: true });
    }
  },

  paramsWithoutQuery() {
    const params = this.currentParams() || {};
    delete params.q;
    return Object.keys(params).length ? params : null;
  },

  renderExpansionOptions(f) {
    if (typeof EXPANSIONES === 'undefined') return '';
    const groups = [];
    EXPANSIONES.forEach(e => {
      if (!PRODUCTS.some(p => p.expansion === e.slug && this.matchesCategory(p, 'all'))) return;
      let g = groups.find(x => x.name === e.serie);
      if (!g) groups.push(g = { name: e.serie, items: [] });
      g.items.push(e);
    });
    return groups.map(g => `<optgroup label="${g.name}">${g.items.map(e => `<option value="${e.slug}" ${f.set === e.slug ? 'selected' : ''}>${e.nombre} (${e.anio})</option>`).join('')}</optgroup>`).join('');
  },

  render() {
    const f = Store.data.catalogFilters;
    const filtered = this.getFilteredProducts();
    const pg = this.paginate(filtered);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="mb-6 pb-5 border-b border-slate-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav aria-label="Ruta de navegación" class="text-xs text-slate-600 mb-1.5">
              <a href="index.html" class="hover:text-[#BE123C] hover:underline">Inicio</a>
              <span aria-hidden="true" class="mx-1">/</span>
              <span aria-current="page">Catálogo</span>
            </nav>
            <h1 id="catalog-main-title" class="text-2xl sm:text-3xl font-bold text-[#0F172A]">${this.getActiveTitle()}</h1>
            <p class="text-sm text-slate-600 mt-1">
              <span id="catalog-count-badge" class="font-semibold text-[#0F172A]">${filtered.length}</span> productos disponibles
            </p>
          </div>

          <button
            type="button"
            onclick="CatalogView.toggleMobileFilters()"
            aria-controls="catalog-sidebar-filters"
            aria-expanded="${this.mobileFiltersOpen ? 'true' : 'false'}"
            class="lg:hidden self-start px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0F172A] rounded-md text-sm font-semibold flex items-center gap-2 border border-slate-300 touch-target"
          >
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
            <span>Filtros</span>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside 
            id="catalog-sidebar-filters" 
            class="${this.mobileFiltersOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:sticky lg:top-28 space-y-5"
            aria-label="Filtros avanzados del catálogo"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <i data-lucide="filter" class="w-4 h-4 text-[#BE123C]"></i>
                <h2 class="text-sm font-bold text-[#0F172A]">Filtros</h2>
              </div>
              <button 
                type="button" 
                onclick="CatalogView.resetFilters()" 
                class="text-xs font-semibold text-[#BE123C] hover:text-[#9F1239] underline"
              >
                Limpiar filtros
              </button>
            </div>

            <div>
              <label for="cat-filter-collection" class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-1.5">
                <i data-lucide="tag" class="w-4 h-4 text-slate-500"></i>
                Categoría
              </label>
              <select 
                id="cat-filter-collection" 
                onchange="CatalogView.updateFilter('category', this.value)"
                class="w-full px-3 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-md text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.category === 'all' ? 'selected' : ''}>Todas</option>
                <option value="psa" ${f.category === 'psa' ? 'selected' : ''}>Slabs PSA</option>
                <option value="raw" ${f.category === 'raw' ? 'selected' : ''}>Cartas raw</option>
                <option value="sealed" ${f.category === 'sealed' ? 'selected' : ''}>Producto sellado</option>
              </select>
            </div>

            <div>
              <label for="cat-filter-set" class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-1.5">
                <i data-lucide="library" class="w-4 h-4 text-slate-500" aria-hidden="true"></i>
                Expansión
              </label>
              <select
                id="cat-filter-set"
                onchange="CatalogView.updateFilter('set', this.value)"
                class="w-full px-3 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-md text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${!f.set || f.set === 'all' ? 'selected' : ''}>Todas las expansiones</option>
                ${this.renderExpansionOptions(f)}
              </select>
            </div>

            <div>
              <label for="cat-filter-era" class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-1.5">
                <i data-lucide="calendar" class="w-4 h-4 text-slate-500"></i>
                Época
              </label>
              <select 
                id="cat-filter-era" 
                onchange="CatalogView.updateFilter('era', this.value)"
                class="w-full px-3 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-md text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.era === 'all' ? 'selected' : ''}>Todas</option>
                <option value="vintage" ${f.era === 'vintage' ? 'selected' : ''}>Vintage WotC (1999-2002)</option>
                <option value="modern" ${f.era === 'modern' ? 'selected' : ''}>Moderno</option>
              </select>
            </div>

            <fieldset>
              <legend class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-2">
                <i data-lucide="star" class="w-4 h-4 text-slate-500"></i>
                Edición
              </legend>
              <div class="space-y-1.5 text-xs">
                ${[
                  { id: 'all', label: 'Todas las cartas' },
                  { id: 'special', label: 'Ediciones especiales' }
                ].map(opt => `
                  <label class="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
                    <input
                      type="radio"
                      name="cat-edition-radio"
                      value="${opt.id}"
                      ${f.edition === opt.id ? 'checked' : ''}
                      onchange="CatalogView.updateFilter('edition', '${opt.id}')"
                      class="text-[#BE123C]"
                    />
                    <span class="font-semibold text-[#0F172A]">${opt.label}</span>
                  </label>
                `).join('')}
              </div>
            </fieldset>

            <div>
              <label class="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 text-xs">
                <input
                  type="checkbox"
                  id="cat-filter-favorites"
                  ${f.onlyFavorites ? 'checked' : ''}
                  onchange="CatalogView.updateFilter('onlyFavorites', this.checked)"
                  class="w-4 h-4 text-[#BE123C]"
                />
                <i data-lucide="heart" class="w-4 h-4 text-[#BE123C]"></i>
                <span class="font-semibold text-[#0F172A]">Solo mis favoritos</span>
              </label>
            </div>

            <div>
              <label for="cat-filter-type" class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-1.5">
                <i data-lucide="zap" class="w-4 h-4 text-slate-500"></i>
                Tipo de energía
              </label>
              <select 
                id="cat-filter-type" 
                onchange="CatalogView.updateFilter('type', this.value)"
                class="w-full px-3 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-md text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.type === 'all' ? 'selected' : ''}>Todos</option>
                ${this.availableTypes().map(t => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>

            <fieldset>
              <legend class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] mb-1.5">
                <i data-lucide="dollar-sign" class="w-4 h-4 text-slate-500"></i>
                Precio (USD)
              </legend>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="cat-min-price" class="text-xs font-bold text-slate-500 block mb-0.5">Desde $</label>
                  <input 
                    type="number" 
                    id="cat-min-price" 
                    placeholder="0" 
                    value="${f.minPrice}"
                    oninput="CatalogView.updatePriceRange()"
                    class="w-full px-2.5 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>
                <div>
                  <label for="cat-max-price" class="text-xs font-bold text-slate-500 block mb-0.5">Hasta $</label>
                  <input 
                    type="number" 
                    id="cat-max-price" 
                    placeholder="25000" 
                    value="${f.maxPrice}"
                    oninput="CatalogView.updatePriceRange()"
                    class="w-full px-2.5 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>
              </div>
            </fieldset>

            <button 
              type="button" 
              onclick="CatalogView.resetFilters()" 
              class="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-[#0F172A] text-xs font-semibold rounded-md transition touch-target"
            >
              Limpiar filtros
            </button>
          </aside>

          <div class="lg:col-span-9 space-y-5">
            <div class="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
                <h2 id="catalog-results-heading" tabindex="-1" class="sr-only">Resultados</h2>
                <span role="status" aria-atomic="true" id="catalog-range-label">${this.rangeLabel(pg)}</span>
                <strong id="catalog-inline-count" class="sr-only">${filtered.length}</strong>
                ${this.isVaultFallback ? `<span class="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">Resultados de todas las categorías</span>` : ''}
                ${f.searchQuery ? `
                  <a href="${app.url('catalog', this.paramsWithoutQuery())}"
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B]"
                     aria-label="Quitar la búsqueda ${f.searchQuery} y ver todo el catálogo">
                    <span>Búsqueda: “${f.searchQuery}”</span>
                    <i data-lucide="x" class="w-4 h-4"></i>
                  </a>` : ''}
              </div>

              <div class="flex items-center gap-2">
                <label for="cat-sort-select" class="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]"><i data-lucide="arrow-up-down" class="w-4 h-4 text-slate-500"></i>Ordenar por:</label>
                <select 
                  id="cat-sort-select" 
                  onchange="CatalogView.updateFilter('sortBy', this.value)"
                  class="px-3 py-2 text-xs font-medium bg-[#F8FAFC] border border-slate-300 rounded-md text-[#0F172A]"
                >
                  <option value="featured" ${f.sortBy === 'featured' ? 'selected' : ''}>Destacados</option>
                  <option value="price-asc" ${f.sortBy === 'price-asc' ? 'selected' : ''}>Precio: menor a mayor</option>
                  <option value="price-desc" ${f.sortBy === 'price-desc' ? 'selected' : ''}>Precio: mayor a menor</option>
                  <option value="name-asc" ${f.sortBy === 'name-asc' ? 'selected' : ''}>Nombre: A a Z</option>
                </select>
              </div>
            </div>

            <div id="catalog-results-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              ${this.renderCardsGrid(pg.items)}
            </div>
            <div id="catalog-pagination-wrap">${this.renderPagination(pg)}</div>
          </div>
        </div>
      </div>
    `;
  },

  renderCardsGrid(items) {
    const f = Store.data.catalogFilters;
    if (items.length === 0) {
      return `
        <div class="col-span-full bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
          <div class="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <i data-lucide="${f.onlyFavorites ? 'heart-off' : 'search-x'}" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-bold text-[#0F172A]">${f.onlyFavorites ? 'Aún no tienes favoritos con esos criterios' : 'No encontramos piezas con esos criterios'}</h3>
          <p class="text-sm text-slate-500 max-w-sm mx-auto">${f.onlyFavorites
            ? 'Marca piezas con el corazón para guardarlas aquí, o limpia los filtros para ver todo el inventario.'
            : 'Ajusta el rango de precios o limpia los filtros activos para explorar todo el inventario.'}</p>
          <button
            type="button"
            onclick="CatalogView.resetFilters()"
            class="px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-md transition shadow touch-target"
          >
            Limpiar filtros
          </button>
        </div>
      `;
    }

    const category = this.isVaultFallback ? 'all' : f.category;
    return items.map(card => {
      const { grade, price } = this.getDisplayOption(card, category);
      const gradeCount = this.availableGrades(card, category).length;
      const isPsaGrade = grade.startsWith('psa');
      const gradeInfo = grade === 'sealed'
        ? { icon: 'package', label: 'Sellado de fábrica' }
        : isPsaGrade
          ? { icon: 'shield-check', label: gradeCount > 1 ? `Desde ${this.GRADE_LABELS[grade]}` : this.GRADE_LABELS[grade] }
          : { icon: 'layers', label: gradeCount > 1 ? 'Desde Raw · NM' : 'Raw · Near Mint' };

      const badgeHtml = card.edicionEspecial
        ? `<span class="px-2 py-0.5 text-xs font-semibold bg-[#E11D48] text-white rounded">Edición especial</span>`
        : grade === 'sealed'
          ? `<span class="px-2 py-0.5 text-xs font-semibold bg-[#0F172A] text-white rounded">${card.era === 'vintage' ? 'Sellado WotC' : 'Sellado'}</span>`
          : isPsaGrade
            ? `<span class="px-2 py-0.5 text-xs font-semibold bg-[#FEF3C7] text-[#92400E] rounded">Slab PSA</span>`
            : `<span class="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-[#0F172A] rounded">Raw</span>`;

      const isFav = Store.isFavorite(card.id);

      return `
        <article class="bg-white border border-slate-200 rounded-lg p-3.5 hover:shadow-md hover:border-slate-400 transition flex flex-col justify-between group">
          <a href="${app.url('pdp', { id: card.id })}" class="block rounded-md" aria-label="Ver ficha de ${card.nombre}">
            <div class="flex items-center gap-1 mb-2.5">
              ${badgeHtml}
            </div>

            <div class="aspect-[3/4] rounded-md overflow-hidden flex items-center justify-center relative ${isPsaGrade ? 'catalog-slab px-4 pb-4 pt-11' : 'bg-[#F8FAFC] p-4'}">
              ${isPsaGrade ? `<span class="catalog-slab-label" aria-hidden="true"><span>PSA</span><span>Nota ${grade.slice(3)}</span></span>` : ''}
              <img
                src="${card.imagenLocal}"
                alt="${card.nombre}"
                width="245"
                height="342"
                loading="lazy"
                decoding="async"
                class="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 motion-safe:group-hover:scale-105"
                onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
              />
            </div>

            <div class="mt-3">
              <span class="inline-block text-xs font-medium text-slate-600">${card.set}${card.tipo ? ` · ${card.tipo}` : ''}</span>
              <h3 class="font-semibold text-sm sm:text-base text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-1">${card.nombre}</h3>
              <p class="text-xs text-slate-600 mt-0.5 line-clamp-1">${card.rareza}${isPsaGrade && card.certNumber ? ` · Cert #${card.certNumber}` : ''}</p>
            </div>
          </a>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <span class="text-xs font-medium text-slate-600 flex items-center gap-1">
                <i data-lucide="${gradeInfo.icon}" class="w-4 h-4"></i>
                <span class="truncate">${gradeInfo.label}</span>
              </span>
              <span class="font-display text-lg font-bold text-[#0F172A]">$${Number(price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              ${grade === 'raw' && typeof PRECIOS_FUENTE !== 'undefined' ? `<span class="block text-xs text-slate-500">Precio ${PRECIOS_FUENTE}</span>` : ''}
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                class="icon-btn"
                data-favorite-id="${card.id}"
                aria-pressed="${isFav ? 'true' : 'false'}"
                aria-label="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${card.nombre}"
                onclick="app.toggleFavorite('${card.id}')"
              >
                <i data-lucide="heart" class="w-5 h-5"></i>
              </button>
              <button
                type="button"
                onclick="CatalogView.quickAdd('${card.id}')"
                class="h-10 px-3.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-[#E11D48] rounded-md transition inline-flex items-center gap-1.5"
                aria-label="Añadir ${card.nombre} (${this.GRADE_LABELS[grade]}) a la bolsa"
              >
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                <span>Añadir</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  // Grado y precio que se muestran en la tarjeta y que añade el botón rápido
  getQuickAddOption(card) {
    const f = Store.data.catalogFilters;
    return this.getDisplayOption(card, this.isVaultFallback ? 'all' : f.category);
  },

  quickAdd(productId) {
    const card = PRODUCTS.find(p => p.id === productId);
    if (!card) return;
    const { grade, price } = this.getQuickAddOption(card);
    const label = grade === 'sealed'
      ? 'Sellado de Fábrica (Caja Intacta)'
      : (typeof PDPView !== 'undefined' && PDPView.getConditionFullTitle ? PDPView.getConditionFullTitle(grade) : this.GRADE_LABELS[grade]);
    const image = (grade === 'sealed' && card.galeria_sellada && card.galeria_sellada.frontal) || card.imagenLocal;
    app.addToCart(`${card.id}-${grade}`, card.nombre, label, price, image, card.imagenFallbackUrl, 1);
  },

  updateFilter(key, value) {
    Store.data.catalogFilters[key] = value;
    Store.data.catalogFilters.page = 1;
    if (typeof history !== 'undefined' && history.replaceState && ['category', 'set', 'era'].includes(key)) {
      history.replaceState(null, '', app.url('catalog', this.currentParams()));
    }
    this.refreshGridOnly();
  },

  updatePriceRange() {
    const minEl = document.getElementById('cat-min-price');
    const maxEl = document.getElementById('cat-max-price');
    Store.data.catalogFilters.minPrice = minEl ? minEl.value : '';
    Store.data.catalogFilters.maxPrice = maxEl ? maxEl.value : '';
    Store.data.catalogFilters.page = 1;
    this.refreshGridOnly();
  },

  resetFilters() {
    Store.data.catalogFilters = {
      category: 'all',
      era: 'all',
      edition: 'all',
      type: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'featured',
      searchQuery: '',
      onlyFavorites: false,
      set: 'all',
      page: 1
    };
    const searchInput = document.getElementById('global-search');
    if (searchInput) searchInput.value = '';
    history.replaceState(null, '', app.url('catalog'));
    app.renderCurrentView();
    app.showToast('Filtros del catálogo restablecidos.', 'info');
  },

  toggleMobileFilters() {
    this.mobileFiltersOpen = !this.mobileFiltersOpen;
    const sidebar = document.getElementById('catalog-sidebar-filters');
    if (sidebar) {
      sidebar.classList.toggle('hidden', !this.mobileFiltersOpen);
      sidebar.classList.toggle('block', this.mobileFiltersOpen);
    }
    const toggle = document.querySelector('[aria-controls="catalog-sidebar-filters"]');
    if (toggle) toggle.setAttribute('aria-expanded', this.mobileFiltersOpen ? 'true' : 'false');

    // Al abrir, el foco entra al panel; al cerrar (también con Esc) vuelve al botón "Filtros"
    if (this.mobileFiltersOpen) {
      const first = sidebar && app.getFocusable(sidebar)[0];
      if (first) first.focus();
    } else if (toggle && typeof toggle.focus === 'function') {
      toggle.focus();
    }
  },

  refreshGridOnly() {
    const filtered = this.getFilteredProducts();
    const pg = this.paginate(filtered);
    const grid = document.getElementById('catalog-results-grid');
    const countBadge = document.getElementById('catalog-count-badge');
    const inlineCount = document.getElementById('catalog-inline-count');
    const titleEl = document.getElementById('catalog-main-title');
    const rangeEl = document.getElementById('catalog-range-label');
    const pagerEl = document.getElementById('catalog-pagination-wrap');

    if (grid) grid.innerHTML = this.renderCardsGrid(pg.items);
    if (rangeEl) rangeEl.textContent = this.rangeLabel(pg);
    if (pagerEl) pagerEl.innerHTML = this.renderPagination(pg);
    if (countBadge) countBadge.innerText = filtered.length;
    if (inlineCount) inlineCount.innerText = filtered.length;
    if (titleEl) titleEl.textContent = this.getActiveTitle();
    app.refreshIcons();
  }
};

