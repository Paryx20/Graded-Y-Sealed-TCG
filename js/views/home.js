const HomeView = {
  render() {
    const featuredIds = ['charizard-ex-paldean', 'pikachu-crown-zenith', 'greninja-ex-twilight', 'blastoise-ex-151'];
    // Solo se destaca lo que tiene stock; si un destacado se agota, entra otra carta disponible
    const available = p => typeof CatalogView === 'undefined' || !CatalogView.matchesCategory || CatalogView.matchesCategory(p, 'all');
    const featuredCards = featuredIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(p => p && available(p));
    PRODUCTS
      .filter(p => featuredCards.length < featuredIds.length && p.categoria !== 'sealed' && !featuredCards.includes(p) && available(p))
      .slice(0, featuredIds.length - featuredCards.length)
      .forEach(p => featuredCards.push(p));

    const sealedProducts = PRODUCTS.filter(p => p.categoria === 'sealed' && available(p)).slice(0, 3);

    // Carta del hero: el slab PSA 10 más caro con stock (no repite los destacados)
    const priceOf = p => Number((p.precios && p.precios.psa10) || 0);
    const heroCard = PRODUCTS
      .filter(p => p.categoria !== 'sealed' && !featuredCards.includes(p) &&
        (typeof CatalogView === 'undefined' || !CatalogView.inStock || CatalogView.inStock(p, 'psa10')))
      .sort((a, b) => priceOf(b) - priceOf(a))[0] || null;
    const heroOption = heroCard ? { label: 'PSA 10', price: priceOf(heroCard) } : null;

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
        <!-- ==========================================
             1. HERO
             ========================================== -->
        <section aria-labelledby="hero-heading" class="relative rounded-lg overflow-hidden bg-[#0F172A] text-white border border-slate-800">
          <!-- Video de fondo decorativo: se reproduce desde afterRender (respeta prefers-reduced-motion) -->
          <video
            id="hero-video"
            class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            muted
            loop
            playsinline
            preload="metadata"
            poster="assets/video/hero-sobres-poster.webp"
            aria-hidden="true"
            tabindex="-1"
          >
            <source src="assets/video/hero-sobres.mp4" type="video/mp4">
          </video>
          <!-- Capa oscura para mantener el contraste del texto sobre el video -->
          <div class="absolute inset-0 bg-[#0F172A]/80 pointer-events-none" aria-hidden="true"></div>

          <button
            type="button"
            id="hero-video-toggle"
            class="absolute bottom-2 right-2 z-20 w-8 h-8 inline-flex items-center justify-center rounded-full bg-[#0F172A] text-white border border-white/30 hover:border-white transition"
            aria-label="Pausar video de fondo"
          >
            <span data-video-icon="pause" aria-hidden="true"><i data-lucide="pause" class="w-4 h-4"></i></span>
            <span data-video-icon="play" class="hidden" aria-hidden="true"><i data-lucide="play" class="w-4 h-4"></i></span>
          </button>

          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            <div class="lg:col-span-7 space-y-5">
              <p class="text-sm font-medium text-[#FEF3C7]">Tienda de cartas Pokémon en Quito</p>

              <h1 id="hero-heading" class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                Slabs PSA, cartas raw y producto sellado
              </h1>

              <p class="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
                Cartas certificadas por PSA con su número verificable, singles en Near Mint y cajas selladas de fábrica.
                Enviamos a todo Ecuador o puedes retirar en Quito sin costo.
              </p>

              <div class="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="pages/catalogo.html?cat=psa"
                  class="px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition flex items-center gap-2 touch-target"
                >
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  <span>Ver slabs PSA</span>
                </a>

                <a
                  href="pages/catalogo.html?cat=sealed"
                  class="px-6 py-3 bg-white text-[#0F172A] hover:bg-slate-100 text-sm font-semibold rounded-md transition flex items-center gap-2 touch-target"
                >
                  <i data-lucide="package" class="w-4 h-4"></i>
                  <span>Producto sellado</span>
                </a>

                <a
                  href="pages/catalogo.html"
                  class="px-4 py-3 text-slate-100 hover:text-white hover:underline underline-offset-4 text-sm font-semibold transition flex items-center gap-1.5 touch-target"
                >
                  <span>Todo el catálogo</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
              </div>

              <ul class="pt-4 border-t border-white/15 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
                <li class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-[#D1FAE5]"></i>Envío a todo Ecuador por $5</li>
                <li class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-[#D1FAE5]"></i>Retiro gratis en Quito</li>
                <li class="flex items-center gap-1.5"><i data-lucide="check" class="w-4 h-4 text-[#D1FAE5]"></i>Certificados PSA verificables</li>
              </ul>
            </div>

            ${heroCard ? `
            <div class="lg:col-span-5 flex items-center justify-center">
              <a
                href="${app.url('pdp', { id: heroCard.id })}"
                aria-label="Ver ficha de ${heroCard.nombre}"
                class="block group bg-[#1E293B] border border-slate-700 hover:border-slate-400 rounded-lg p-5 max-w-xs w-full transition"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">Destacado · ${heroOption.label}</span>
                </div>

                <div class="aspect-square bg-[#0F172A] rounded-md flex items-center justify-center p-4 overflow-hidden relative">
                  <img
                    src="${heroCard.imagenLocal}"
                    alt="${heroCard.nombre}"
                    width="245"
                    height="342"
                    fetchpriority="high"
                    decoding="async"
                    class="max-h-52 w-auto object-contain transition-transform duration-300 motion-safe:group-hover:scale-105"
                    onerror="this.onerror=null; this.src='${heroCard.imagenFallbackUrl || 'assets/img/cards/card-back.png'}'"
                  />
                </div>

                <div class="mt-3.5 flex items-end justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="text-sm font-semibold text-white group-hover:underline underline-offset-2 line-clamp-2">${heroCard.nombre}</h2>
                    <p class="text-xs text-slate-300 mt-0.5">${heroCard.set}</p>
                  </div>
                  <span class="text-base font-bold text-white whitespace-nowrap">$${Number(heroOption.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </a>
            </div>` : ''}
          </div>
        </section>

        <!-- ==========================================
             2. ENVÍOS, GARANTÍAS Y PAGOS
             ========================================== -->
        <section aria-label="Envíos, garantías y pagos" class="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="flex items-start gap-3">
              <i data-lucide="truck" class="w-6 h-6 text-[#BE123C] flex-shrink-0 mt-0.5"></i>
              <div>
                <h2 class="text-sm font-semibold text-[#0F172A]">Envío a todo Ecuador · $5</h2>
                <p class="text-sm text-slate-600 mt-0.5">Tarifa plana. Cada carta va en funda, toploader o caja rígida.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="shield-check" class="w-6 h-6 text-[#047857] flex-shrink-0 mt-0.5"></i>
              <div>
                <h2 class="text-sm font-semibold text-[#0F172A]">Slabs PSA originales</h2>
                <p class="text-sm text-slate-600 mt-0.5">Cada slab trae su número de certificado para verificarlo en psacard.com.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="store" class="w-6 h-6 text-[#B45309] flex-shrink-0 mt-0.5"></i>
              <div>
                <h2 class="text-sm font-semibold text-[#0F172A]">Retiro gratis en Quito</h2>
                <p class="text-sm text-slate-600 mt-0.5">Elige “Retiro en tienda” al pagar y te avisamos cuando esté listo.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="credit-card" class="w-6 h-6 text-[#0F172A] flex-shrink-0 mt-0.5"></i>
              <div>
                <h2 class="text-sm font-semibold text-[#0F172A]">Pago con tarjeta o efectivo</h2>
                <p class="text-sm text-slate-600 mt-0.5">Visa, Mastercard o efectivo al retirar. Puedes seguir tu pedido en línea.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- ==========================================
             3. DESTACADOS
             ========================================== -->
        <section aria-labelledby="vault-highlights-heading" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 id="vault-highlights-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Destacados
            </h2>
            <a
              href="pages/catalogo.html"
              class="text-sm font-semibold text-[#BE123C] hover:text-[#9F1239] hover:underline underline-offset-2 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver todo el catálogo</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            ${featuredCards.map(card => {
              const opt = typeof CatalogView !== 'undefined' && CatalogView.getDisplayOption
                ? CatalogView.getDisplayOption(card, 'psa')
                : { grade: 'psa10', price: card.precios.psa10 };
              const option = opt.price ? opt : (typeof CatalogView !== 'undefined' ? CatalogView.getDisplayOption(card, 'all') : opt);
              const label = typeof CatalogView !== 'undefined' && CatalogView.GRADE_LABELS ? CatalogView.GRADE_LABELS[option.grade] : 'PSA 10';
              return `
              <article class="h-full">
              <a
                href="${app.url('pdp', { id: card.id })}"
                aria-label="Ver detalles de ${card.nombre}"
                class="block h-full bg-white border border-slate-200 rounded-lg p-3.5 hover:shadow-md hover:border-slate-400 transition flex flex-col justify-between group"
              >
                <div>
                  <div class="aspect-[3/4] bg-[#F8FAFC] rounded-md overflow-hidden flex items-center justify-center p-3 relative">
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
                    <span class="inline-block text-xs font-medium text-slate-600">${card.set}</span>
                    <h3 class="font-semibold text-sm sm:text-base text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-1">${card.nombre}</h3>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <span class="text-xs text-slate-600 block">${option.grade.startsWith('psa') ? 'Desde ' : ''}${label}</span>
                    <span class="text-base font-bold text-[#0F172A]">$${Number(option.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span class="text-xs font-semibold text-[#0F172A] group-hover:text-[#BE123C] inline-flex items-center gap-1">
                    Ver ficha
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </a></article>
            `;
            }).join('')}
          </div>
        </section>

        <!-- ==========================================
             4. PRODUCTO SELLADO
             ========================================== -->
        ${sealedProducts.length ? `
        <section aria-labelledby="sealed-vintage-heading" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 id="sealed-vintage-heading" class="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Producto sellado
              </h2>
              <p class="text-sm text-slate-600 mt-0.5">Booster boxes, Elite Trainer Boxes y colecciones especiales, selladas de fábrica.</p>
            </div>
            <a
              href="pages/catalogo.html?cat=sealed"
              class="text-sm font-semibold text-[#BE123C] hover:text-[#9F1239] hover:underline underline-offset-2 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver todo el sellado</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            ${sealedProducts.map(pack => `
              <article class="h-full">
              <a
                href="${app.url('pdp', { id: pack.id })}"
                aria-label="Ver producto sellado ${pack.nombre}"
                class="block h-full bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md rounded-lg p-4 flex flex-col justify-between transition group"
              >
                <div>
                  <div class="h-44 bg-[#F8FAFC] rounded-md flex items-center justify-center p-3 overflow-hidden">
                    <img
                      src="${pack.imagenLocal}"
                      alt="${pack.nombre}"
                      loading="lazy"
                      decoding="async"
                      class="max-h-full max-w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-105"
                      onerror="this.onerror=null; this.src='${pack.imagenFallbackUrl}'"
                    />
                  </div>
                  <span class="inline-block mt-3 text-xs font-medium text-slate-600">${pack.era === 'vintage' ? 'Vintage WotC' : 'Sellado de fábrica'}</span>
                  <h3 class="text-sm sm:text-base font-semibold text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-1">${pack.nombre}</h3>
                </div>
                <div class="pt-3 mt-3 flex items-end justify-between border-t border-slate-100">
                  <span class="text-base font-bold text-[#0F172A]">$${Number(pack.precioUnitario || (pack.precios && (pack.precios.sealed || pack.precios.raw)) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span class="text-xs font-semibold text-[#0F172A] group-hover:text-[#BE123C] inline-flex items-center gap-1">
                    Ver ficha
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </a></article>
            `).join('')}
          </div>
        </section>` : ''}

        <!-- ==========================================
             5. GUÍA RÁPIDA: RAW, PSA Y SELLADO
             ========================================== -->
        <section aria-labelledby="why-invest-heading" class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5">
          <div class="max-w-2xl">
            <h2 id="why-invest-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              ¿Raw, PSA o sellado?
            </h2>
            <p class="text-sm text-slate-600 mt-1">Una guía corta para elegir qué comprar.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-1.5">
              <h3 class="text-sm font-semibold text-[#0F172A] flex items-center gap-2"><i data-lucide="layers" class="w-4 h-4 text-slate-600"></i>Carta raw</h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                La carta tal cual, sin calificar. Revisamos cada una y solo vendemos Near Mint. Es la opción más económica para jugar o completar un set.
              </p>
            </div>
            <div class="space-y-1.5">
              <h3 class="text-sm font-semibold text-[#0F172A] flex items-center gap-2"><i data-lucide="shield-check" class="w-4 h-4 text-slate-600"></i>Slab PSA</h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                PSA califica la carta del 1 al 10 y la sella en una cápsula con número de certificado. Un PSA 10 es una carta prácticamente perfecta.
              </p>
              <button type="button" onclick="app.openPSAGuideModal()" class="text-sm font-semibold text-[#BE123C] hover:underline underline-offset-2">Ver la guía de grados</button>
            </div>
            <div class="space-y-1.5">
              <h3 class="text-sm font-semibold text-[#0F172A] flex items-center gap-2"><i data-lucide="package" class="w-4 h-4 text-slate-600"></i>Producto sellado</h3>
              <p class="text-sm text-slate-600 leading-relaxed">
                Cajas y sobres con su plástico de fábrica intacto. Ideal para abrir o para guardar en la colección.
              </p>
            </div>
          </div>
        </section>

        <!-- ==========================================
             6. CATEGORÍAS
             ========================================== -->
        <section aria-labelledby="collections-nav-heading" class="space-y-4">
          <h2 id="collections-nav-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight border-b border-slate-200 pb-3">
            Comprar por categoría
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${[
              { href: 'pages/catalogo.html?cat=psa', icon: 'award', title: 'Slabs PSA', text: 'PSA 8, 9 y 10' },
              { href: 'pages/catalogo.html?cat=raw', icon: 'layers', title: 'Cartas raw', text: 'Singles en Near Mint' },
              { href: 'pages/catalogo.html?cat=sealed', icon: 'package', title: 'Producto sellado', text: 'Booster boxes y ETB' },
              { href: 'pages/catalogo.html?era=vintage', icon: 'history', title: 'Vintage', text: 'Base Set, Jungle, Fossil (1999-2002)' },
              { href: 'pages/catalogo.html?era=modern', icon: 'zap', title: 'Moderno', text: 'Espada y Escudo, Escarlata y Púrpura' },
              { href: 'pages/catalogo.html', icon: 'layout-grid', title: 'Todo el catálogo', text: 'Con filtros por precio y tipo' }
            ].map(c => `
            <a href="${c.href}" class="group px-4 py-3.5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-lg flex items-center justify-between transition">
              <span class="flex items-center gap-3">
                <i data-lucide="${c.icon}" class="w-5 h-5 text-slate-600 group-hover:text-[#0F172A]"></i>
                <span>
                  <span class="block text-sm font-semibold text-[#0F172A] group-hover:text-[#BE123C] transition">${c.title}</span>
                  <span class="block text-xs text-slate-600">${c.text}</span>
                </span>
              </span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>`).join('')}
          </div>
        </section>

        <!-- ==========================================
             7. EXPLORAR CARTAS (base de datos pública)
             ========================================== -->
        <section class="border border-slate-200 bg-[#F1F5F9] rounded-lg px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-[#0F172A]">¿Buscas una carta que no tenemos?</h2>
            <p class="text-sm text-slate-600 mt-0.5">Consúltala en Explorar cartas: set, número y rareza de cualquier carta del juego.</p>
          </div>
          <a
            href="pages/busqueda.html"
            class="px-5 py-2.5 bg-white border border-slate-300 hover:border-[#0F172A] text-[#0F172A] text-sm font-semibold rounded-md transition flex items-center gap-2 flex-shrink-0 self-start sm:self-auto touch-target"
          >
            <i data-lucide="database" class="w-4 h-4"></i>
            <span>Explorar cartas</span>
          </a>
        </section>
      </div>
    `;
  },

  // null = el usuario aún no ha elegido; se conserva entre re-renderizados del home
  videoPausedByUser: null,
  visibilityListenerAdded: false,

  afterRender() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const video = document.getElementById('hero-video');
    const toggle = document.getElementById('hero-video-toggle');
    if (!video || !toggle || typeof video.play !== 'function') return;

    const reduceMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.videoPausedByUser === null && reduceMotion) this.videoPausedByUser = true;

    const syncButton = () => {
      const paused = video.paused;
      toggle.setAttribute('aria-label', paused ? 'Reproducir video de fondo' : 'Pausar video de fondo');
      toggle.querySelector('[data-video-icon="pause"]').classList.toggle('hidden', paused);
      toggle.querySelector('[data-video-icon="play"]').classList.toggle('hidden', !paused);
    };

    const play = () => {
      const result = video.play();
      if (result && typeof result.catch === 'function') result.catch(syncButton);
    };

    video.addEventListener('play', syncButton);
    video.addEventListener('pause', syncButton);
    // Si el video no carga, queda el póster/gradiente y el botón deja de tener sentido
    video.querySelector('source').addEventListener('error', () => { toggle.hidden = true; });

    toggle.addEventListener('click', () => {
      if (video.paused) {
        this.videoPausedByUser = false;
        play();
      } else {
        this.videoPausedByUser = true;
        video.pause();
      }
    });

    if (!this.visibilityListenerAdded) {
      this.visibilityListenerAdded = true;
      document.addEventListener('visibilitychange', () => {
        const current = document.getElementById('hero-video');
        if (!current) return;
        if (document.hidden) current.pause();
        else if (this.videoPausedByUser !== true) current.play().catch(() => {});
      });
    }

    syncButton();
    if (this.videoPausedByUser !== true) play();
  }
};
