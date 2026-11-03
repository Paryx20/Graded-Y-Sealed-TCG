const CatalogView = {
  mobileFiltersOpen: false,

  matchesCategory(card, category) {
    if (!card) return false;
    if (category === 'all') return true;
    if (category === 'sealed') {
      return card.categoria === 'sealed' || 
             card.tipo_discriminador === 'PRODUCTO_SELLADO' || 
             Boolean(card.set && card.set.toLowerCase().includes('sealed'));
    }
    // Slabs PSA y Cartas raw solo muestran cartas: las cajas y sobres van en Sellados
    const isSealed = card.categoria === 'sealed' || card.tipo_discriminador === 'PRODUCTO_SELLADO';
    if (category === 'psa') {
      return !isSealed && (card.categoria === 'psa' ||
             Boolean(card.precios && (card.precios.psa10 || card.precios.psa9 || card.precios.psa8)));
    }
    if (category === 'raw') {
      return !isSealed && (card.categoria === 'raw' || Boolean(card.precios && card.precios.raw));
    }
    return card.categoria === category;
  },

  getFilteredProducts() {
    const f = Store.data.catalogFilters;
    const condKey = 'raw';

    const testCard = (card, useCategoryFilter, useEraFilter) => {
      if (useCategoryFilter && !this.matchesCategory(card, f.category)) return false;
      if (useEraFilter && f.era !== 'all' && card.era !== f.era) return false;

      if (f.edition === 'special' && !card.edicionEspecial) return false;

      if (f.type !== 'all' && card.tipo !== f.type) return false;

      const refPrice = card.precios.raw;

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

    if (f.sortBy === 'price-asc') {
      list.sort((a, b) => a.precios[condKey] - b.precios[condKey]);
    } else if (f.sortBy === 'price-desc') {
      list.sort((a, b) => b.precios[condKey] - a.precios[condKey]);
    } else if (f.sortBy === 'yield-desc') {
      list.sort((a, b) => b.rendimientoAnual - a.rendimientoAnual);
    }

    return list;
  },

  getActiveTitle() {
    const f = Store.data.catalogFilters;
    if (f.category === 'psa') return 'Slabs Certificados PSA';
    if (f.category === 'raw') return 'Cartas Sueltas / Raw';
    if (f.category === 'sealed') return 'Cajas y Sobres Sellados Vintage';
    if (f.era === 'vintage') return 'Era Clásica WotC (1999 - 2002)';
    if (f.era === 'modern') return 'Era Moderna & Alt Arts';
    return 'Catálogo Completo de la Bóveda';
  },

  render() {
    const f = Store.data.catalogFilters;
    const filtered = this.getFilteredProducts();

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 text-xs font-extrabold text-[#FEF3C7] uppercase tracking-wider mb-1">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-[#B45309]"></i>
              <span>Exploración Libre y Filtrado Multicriterio</span>
            </div>
            <h1 id="catalog-main-title" class="text-2xl sm:text-3xl font-black tracking-tight">${this.getActiveTitle()}</h1>
            <p class="text-xs sm:text-sm text-slate-300 mt-1">
              Filtra en tiempo real por edición, rango de precio, energía y rendimiento anual.
            </p>
          </div>

          <div class="flex items-center gap-3 self-start md:self-center">
            <button 
              type="button" 
              onclick="CatalogView.toggleMobileFilters()" 
              class="lg:hidden px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/15"
            >
              <i data-lucide="sliders-horizontal" class="w-4 h-4 text-[#FEF3C7]"></i>
              <span>Mostrar / Ocultar Filtros</span>
            </button>
            <div class="px-4 py-2.5 rounded-xl bg-[#1E293B] border border-slate-700 text-xs font-bold text-slate-200">
              <span id="catalog-count-badge" class="text-[#FEF3C7] font-black">${filtered.length}</span> piezas encontradas
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside 
            id="catalog-sidebar-filters" 
            class="${this.mobileFiltersOpen ? 'block' : 'hidden'} lg:block lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:sticky lg:top-28 space-y-5"
            aria-label="Filtros avanzados del catálogo"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <i data-lucide="filter" class="w-4 h-4 text-[#BE123C]"></i>
                <h2 class="text-sm font-black text-[#0F172A] uppercase tracking-wider">Filtros en Vivo</h2>
              </div>
              <button 
                type="button" 
                onclick="CatalogView.resetFilters()" 
                class="text-xs font-extrabold text-[#BE123C] hover:text-[#9F1239] underline"
              >
                Limpiar filtros
              </button>
            </div>

            <div>
              <label for="cat-filter-collection" class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Categoría Principal
              </label>
              <select 
                id="cat-filter-collection" 
                onchange="CatalogView.updateFilter('category', this.value)"
                class="w-full px-3 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.category === 'all' ? 'selected' : ''}>Todas las Categorías</option>
                <option value="psa" ${f.category === 'psa' ? 'selected' : ''}>Slabs Certificados PSA</option>
                <option value="raw" ${f.category === 'raw' ? 'selected' : ''}>Cartas Sueltas / Raw</option>
                <option value="sealed" ${f.category === 'sealed' ? 'selected' : ''}>Cajas y Sobres Sellados</option>
              </select>
            </div>

            <div>
              <label for="cat-filter-era" class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Era de Lanzamiento
              </label>
              <select 
                id="cat-filter-era" 
                onchange="CatalogView.updateFilter('era', this.value)"
                class="w-full px-3 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.era === 'all' ? 'selected' : ''}>Todas las Eras</option>
                <option value="vintage" ${f.era === 'vintage' ? 'selected' : ''}>Era Clásica WotC (1999-2002)</option>
                <option value="modern" ${f.era === 'modern' ? 'selected' : ''}>Era Moderna &amp; Alt Arts</option>
              </select>
            </div>

            <div>
              <span class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-2">
                Edición
              </span>
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
            </div>

            <div>
              <label for="cat-filter-type" class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Tipo de Energía
              </label>
              <select 
                id="cat-filter-type" 
                onchange="CatalogView.updateFilter('type', this.value)"
                class="w-full px-3 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#0F172A] focus:bg-white"
              >
                <option value="all" ${f.type === 'all' ? 'selected' : ''}>Todos los Tipos</option>
                <option value="Fuego" ${f.type === 'Fuego' ? 'selected' : ''}>Fuego</option>
                <option value="Oscuridad" ${f.type === 'Oscuridad' ? 'selected' : ''}>Oscuridad</option>
                <option value="Psíquico" ${f.type === 'Psíquico' ? 'selected' : ''}>Psíquico</option>
                <option value="Agua" ${f.type === 'Agua' ? 'selected' : ''}>Agua</option>
                <option value="Incoloro" ${f.type === 'Incoloro' ? 'selected' : ''}>Incoloro</option>
              </select>
            </div>

            <div>
              <span class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-1.5">
                Rango de Precio (USD)
              </span>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label for="cat-min-price" class="text-xs font-bold text-slate-500 block mb-0.5">Desde $</label>
                  <input 
                    type="number" 
                    id="cat-min-price" 
                    placeholder="0" 
                    value="${f.minPrice}"
                    oninput="CatalogView.updatePriceRange()"
                    class="w-full px-2.5 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-lg text-[#0F172A]"
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
                    class="w-full px-2.5 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-lg text-[#0F172A]"
                  />
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onclick="CatalogView.resetFilters()" 
              class="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-[#0F172A] text-xs font-extrabold rounded-xl transition"
            >
              Limpiar filtros
            </button>
          </aside>

          <div class="lg:col-span-9 space-y-5">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Mostrando <strong id="catalog-inline-count" class="text-[#0F172A]">${filtered.length}</strong> de ${PRODUCTS.length} activos en bóveda</span>
                ${this.isVaultFallback ? `<span class="px-2 py-0.5 rounded text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">Búsqueda en toda la Bóveda</span>` : ''}
                ${f.searchQuery ? `
                  <a href="${app.url('catalog', f.category !== 'all' ? { cat: f.category } : (f.era !== 'all' ? { era: f.era } : null))}"
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-[#1E293B]"
                     aria-label="Quitar la búsqueda ${f.searchQuery} y ver todo el catálogo">
                    <span>Búsqueda: “${f.searchQuery}”</span>
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                  </a>` : ''}
              </div>

              <div class="flex items-center gap-2">
                <label for="cat-sort-select" class="text-xs font-extrabold text-[#0F172A]">Ordenar por:</label>
                <select 
                  id="cat-sort-select" 
                  onchange="CatalogView.updateFilter('sortBy', this.value)"
                  class="px-3 py-2 text-xs font-bold bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#0F172A]"
                >
                  <option value="featured" ${f.sortBy === 'featured' ? 'selected' : ''}>Destacados de Bóveda</option>
                  <option value="price-asc" ${f.sortBy === 'price-asc' ? 'selected' : ''}>Precio: Menor a Mayor</option>
                  <option value="price-desc" ${f.sortBy === 'price-desc' ? 'selected' : ''}>Precio: Mayor a Menor</option>
                  <option value="yield-desc" ${f.sortBy === 'yield-desc' ? 'selected' : ''}>Mayor Rendimiento Anual (%)</option>
                </select>
              </div>
            </div>

            <div id="catalog-results-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              ${this.renderCardsGrid(filtered)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderCardsGrid(items) {
    const f = Store.data.catalogFilters;
    if (items.length === 0) {
      return `
        <div class="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div class="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <i data-lucide="search-x" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-black text-[#0F172A]">No encontramos piezas con esos criterios</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">Ajusta el rango de precios o limpia los filtros activos para explorar todo el inventario.</p>
          <button 
            type="button" 
            onclick="CatalogView.resetFilters()" 
            class="px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl transition shadow"
          >
            Limpiar filtros
          </button>
        </div>
      `;
    }

    return items.map(card => {
      const displayCond = card.categoria === 'sealed' ? 'Sellado de Fábrica'
        : card.categoria === 'psa' ? 'Desde Raw / PSA'
        : 'Raw Near Mint';

      const displayPrice = card.precios.raw;

      const badgeHtml = card.edicionEspecial
        ? `<span class="px-2.5 py-0.5 text-xs font-black bg-[#E11D48] text-white rounded">EDICIÓN ESPECIAL</span>`
        : card.categoria === 'psa'
        ? `<span class="px-2.5 py-0.5 text-xs font-black bg-[#FEF3C7] text-[#B45309] rounded">GRADO INVERSIÓN • PSA</span>`
        : card.categoria === 'sealed'
          ? `<span class="px-2.5 py-0.5 text-xs font-black bg-[#0F172A] text-[#FEF3C7] rounded">${card.era === 'vintage' ? 'SELLADO WOTC' : 'SELLADO DE FÁBRICA'}</span>`
          : `<span class="px-2.5 py-0.5 text-xs font-black bg-slate-100 text-[#0F172A] rounded">SINGLE RAW NM</span>`;

      return `
        <article 
          onclick="app.openProductPDP('${card.id}')" 
          onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openProductPDP('${card.id}');}"
          role="button"
          tabindex="0"
          aria-label="Inspeccionar ${card.nombre}"
          class="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-[#0F172A] transition-all flex flex-col justify-between group"
        >
          <div>
            <div class="flex items-center justify-between gap-1 mb-2.5">
              ${badgeHtml}
              <span class="text-xs font-extrabold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded flex items-center gap-0.5">
                <span>${card.tendencia12m}</span>
              </span>
            </div>

            <div class="aspect-[3/4] bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-4 relative">
              <img 
                src="${card.imagenLocal}" 
                alt="${card.nombre}" 
                class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
              />
            </div>

            <div class="mt-3">
              <span class="inline-block text-xs font-bold text-slate-500 uppercase tracking-wider">${card.set} • ${card.tipo}</span>
              <h3 class="font-extrabold text-sm sm:text-base text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-1">${card.nombre}</h3>
              <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">${card.rareza} • Cert #${card.certNumber}</p>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-slate-500 block">${displayCond}</span>
              <span class="text-base font-black text-[#0F172A]">$${Number(displayPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <span class="px-3.5 py-1.5 text-xs font-extrabold text-white bg-[#0F172A] group-hover:bg-[#E11D48] rounded-xl transition inline-flex items-center gap-1">
              <span>Ver Ficha</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </span>
          </div>
        </article>
      `;
    }).join('');
  },

  updateFilter(key, value) {
    Store.data.catalogFilters[key] = value;
    this.refreshGridOnly();
  },

  updatePriceRange() {
    const minEl = document.getElementById('cat-min-price');
    const maxEl = document.getElementById('cat-max-price');
    Store.data.catalogFilters.minPrice = minEl ? minEl.value : '';
    Store.data.catalogFilters.maxPrice = maxEl ? maxEl.value : '';
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
      searchQuery: ''
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
  },

  refreshGridOnly() {
    const filtered = this.getFilteredProducts();
    const grid = document.getElementById('catalog-results-grid');
    const countBadge = document.getElementById('catalog-count-badge');
    const inlineCount = document.getElementById('catalog-inline-count');
    const titleEl = document.getElementById('catalog-main-title');

    if (grid) grid.innerHTML = this.renderCardsGrid(filtered);
    if (countBadge) countBadge.innerText = filtered.length;
    if (inlineCount) inlineCount.innerText = filtered.length;
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }
};

