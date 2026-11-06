const HomeView = {
  render() {
    const featuredIds = ['charizard-ex-paldean', 'pikachu-crown-zenith', 'greninja-ex-twilight', 'umbreon-vmax-evolving-skies'];
    // Solo se destaca lo que tiene stock; si un destacado se agota, entra otra carta disponible
    const available = p => typeof CatalogView === 'undefined' || !CatalogView.matchesCategory || CatalogView.matchesCategory(p, 'all');
    const featuredCards = featuredIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(p => p && available(p));
    PRODUCTS
      .filter(p => featuredCards.length < featuredIds.length && p.categoria !== 'sealed' && !featuredCards.includes(p) && available(p))
      .slice(0, featuredIds.length - featuredCards.length)
      .forEach(p => featuredCards.push(p));

    // Sobres primero (lo más fácil para empezar) y luego cajas
    const sealedAll = PRODUCTS.filter(p => p.categoria === 'sealed' && available(p));
    const sealedProducts = [...sealedAll.filter(p => p.esSobre), ...sealedAll.filter(p => !p.esSobre)].slice(0, 4);

    // Carta del hero: el slab PSA 10 más caro con stock (no repite los destacados)
    const priceOf = p => Number((p.precios && p.precios.psa10) || 0);
    const heroCard = PRODUCTS
      .filter(p => p.categoria !== 'sealed' && !featuredCards.includes(p) &&
        (typeof CatalogView === 'undefined' || !CatalogView.inStock || CatalogView.inStock(p, 'psa10')))
      .sort((a, b) => priceOf(b) - priceOf(a))[0] || null;
    const heroOption = heroCard ? { label: 'PSA 10', price: priceOf(heroCard) } : null;

    // Expansiones con más productos en stock
    const expansions = (typeof EXPANSIONES !== 'undefined' ? EXPANSIONES : [])
      .map(e => ({ ...e, count: PRODUCTS.filter(p => p.expansion === e.slug && available(p)).length }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const money = n => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-14">
        <!-- 1. HERO -->
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
            <div class="lg:col-span-7 space-y-5 hero-intro">
              <p class="text-sm font-medium text-[#FEF3C7]">Tienda de cartas Pokémon en Quito</p>
              <h1 id="hero-heading" class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                Cartas Pokémon para jugar y coleccionar
              </h1>
              <p class="text-slate-200 text-base sm:text-lg max-w-xl">Cartas sueltas, cartas certificadas y sobres sellados, con envío a todo Ecuador.</p>
              <div class="pt-1 flex flex-wrap items-center gap-3">
                <a href="pages/catalogo.html" class="px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition flex items-center gap-2 touch-target">
                  <i data-lucide="layout-grid" class="w-4 h-4" aria-hidden="true"></i>
                  <span>Ver el catálogo</span>
                </a>
                <a href="#que-son" class="px-6 py-3 bg-white text-[#0F172A] hover:bg-slate-100 text-sm font-semibold rounded-md transition flex items-center gap-2 touch-target">
                  <i data-lucide="sparkles" class="w-4 h-4" aria-hidden="true"></i>
                  <span>¿Eres nuevo? Empieza aquí</span>
                </a>
              </div>
            </div>

            ${heroCard ? `
            <div class="lg:col-span-5 flex items-center justify-center">
              <a
                href="${app.url('pdp', { id: heroCard.id })}"
                aria-label="Ver ficha de ${heroCard.nombre}"
                class="block group bg-[#1E293B] border border-slate-700 hover:border-slate-400 rounded-lg p-5 max-w-xs w-full transition"
              >
                <span class="px-2 py-0.5 rounded text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">Destacado · ${heroOption.label}</span>
                <div class="mt-3 aspect-square bg-[#0F172A] rounded-md flex items-center justify-center p-4 overflow-hidden relative">
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
                  <span class="text-base font-bold text-white whitespace-nowrap">$${money(heroOption.price)}</span>
                </div>
              </a>
            </div>` : ''}
          </div>
        </section>

        <!-- 2. VENTAJAS (cortas) -->
        <section aria-label="Envíos y pagos" class="reveal">
          <ul class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            ${[
              { icon: 'truck', color: 'text-[#BE123C]', text: 'Envío a todo Ecuador' },
              { icon: 'store', color: 'text-[#B45309]', text: 'Retiro gratis en Quito' },
              { icon: 'credit-card', color: 'text-[#0F172A]', text: 'Tarjeta o efectivo' },
              { icon: 'package-search', color: 'text-[#047857]', text: 'Sigue tu pedido' }
            ].map(b => `
              <li class="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-4 py-3">
                <i data-lucide="${b.icon}" class="w-5 h-5 ${b.color} flex-shrink-0" aria-hidden="true"></i>
                <span class="text-sm font-semibold text-[#0F172A]">${b.text}</span>
              </li>`).join('')}
          </ul>
        </section>

        <!-- 3. ¿QUÉ SON LAS CARTAS POKÉMON? (para quien no conoce el tema) -->
        <section id="que-son" aria-labelledby="que-son-heading" class="reveal scroll-mt-32">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold text-[#BE123C]">Para quien empieza</p>
            <h2 id="que-son-heading" class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mt-1">¿Qué son las cartas Pokémon?</h2>
            <p class="text-base text-slate-600 mt-2">Son cartas coleccionables de los personajes de Pokémon. La gente las usa de tres formas:</p>
          </div>
          <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            ${[
              { icon: 'swords', title: 'Para jugar', text: 'Es un juego de mesa: armas un mazo de 60 cartas y juegas contra amigos o en torneos.' },
              { icon: 'gem', title: 'Para coleccionar', text: 'Cada carta tiene un dibujo distinto. Algunas son comunes y otras muy difíciles de conseguir.' },
              { icon: 'gift', title: 'Para regalar o abrir', text: 'Los sobres son una sorpresa: no sabes qué cartas te van a tocar hasta abrirlos.' }
            ].map((c, i) => `
              <article class="reveal bg-white border border-slate-200 rounded-lg p-5" style="transition-delay:${i * 90}ms">
                <div class="w-11 h-11 rounded-md bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center">
                  <i data-lucide="${c.icon}" class="w-6 h-6" aria-hidden="true"></i>
                </div>
                <h3 class="mt-3 text-lg font-bold text-[#0F172A]">${c.title}</h3>
                <p class="mt-1 text-sm text-slate-600 leading-relaxed">${c.text}</p>
              </article>`).join('')}
          </div>

          <div class="mt-6 bg-[#0F172A] text-white rounded-lg p-5 sm:p-6">
            <h3 class="text-base font-bold text-[#FEF3C7]">Lo que vendemos, en palabras simples</h3>
            <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              ${[
                { icon: 'layers', term: 'Carta suelta (raw)', def: 'Una carta tal como sale del sobre, en muy buen estado.', href: 'pages/catalogo.html?cat=raw' },
                { icon: 'award', term: 'Carta certificada (PSA)', def: 'Una empresa experta la revisa, le pone una nota del 1 al 10 y la guarda en un estuche sellado.', href: 'pages/catalogo.html?cat=psa' },
                { icon: 'mail', term: 'Sobre (booster pack)', def: 'Un paquete cerrado con 10 cartas al azar de una expansión.', href: 'pages/catalogo.html?cat=sealed' },
                { icon: 'package', term: 'Caja sellada', def: 'Cajas de fábrica con varios sobres y accesorios, sin abrir.', href: 'pages/catalogo.html?cat=sealed' }
              ].map(g => `
                <div class="flex flex-col">
                  <dt class="flex items-center gap-2 text-sm font-bold"><i data-lucide="${g.icon}" class="w-4 h-4 text-[#FDA4AF]" aria-hidden="true"></i>${g.term}</dt>
                  <dd class="mt-1 text-sm text-slate-300 leading-relaxed flex-1">${g.def}</dd>
                  <dd class="mt-2"><a href="${g.href}" class="text-xs font-semibold text-[#FDE68A] hover:underline underline-offset-2">Ver ${g.term.split(' (')[0].toLowerCase()}s</a></dd>
                </div>`).join('')}
            </dl>
          </div>
        </section>

        <!-- 4. CONOCE UNA CARTA (3D) -->
        <section aria-labelledby="explainer-heading" class="reveal bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
          <div class="max-w-2xl mb-4">
            <h2 id="explainer-heading" class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Conoce una carta por dentro</h2>
            <p class="text-base text-slate-600 mt-2">Gírala para ver su grosor y toca los números para saber qué significa cada parte.</p>
          </div>
          ${typeof CardExplainer !== 'undefined' ? CardExplainer.render('home-explainer', { compact: true }) : ''}
          <div class="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-slate-600">¿Quieres saber más sobre notas PSA, estados y cómo comprar?</p>
            <a href="pages/guia.html" class="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold rounded-md transition inline-flex items-center gap-2 touch-target">
              <i data-lucide="book-open" class="w-4 h-4" aria-hidden="true"></i>
              <span>Leer la guía completa</span>
            </a>
          </div>
        </section>

        <!-- 5. DESTACADOS -->
        <section aria-labelledby="vault-highlights-heading" class="reveal space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 id="vault-highlights-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">Destacados</h2>
            <a href="pages/catalogo.html" class="text-sm font-semibold text-[#BE123C] hover:text-[#9F1239] hover:underline underline-offset-2 inline-flex items-center gap-1 self-start sm:self-auto">
              <span>Ver todo el catálogo</span>
              <i data-lucide="arrow-right" class="w-4 h-4" aria-hidden="true"></i>
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
                    <span class="text-base font-bold text-[#0F172A]">$${money(option.price)}</span>
                  </div>
                  <span class="text-xs font-semibold text-[#0F172A] group-hover:text-[#BE123C] inline-flex items-center gap-1">
                    Ver ficha
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5" aria-hidden="true"></i>
                  </span>
                </div>
              </a></article>
            `;
            }).join('')}
          </div>
        </section>

        <!-- 6. SOBRES Y PRODUCTO SELLADO -->
        ${sealedProducts.length ? `
        <section aria-labelledby="sealed-vintage-heading" class="reveal space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 id="sealed-vintage-heading" class="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">Sobres y cajas selladas</h2>
              <p class="text-sm text-slate-600 mt-0.5">Abre tus propios sobres y descubre qué cartas te tocan.</p>
            </div>
            <a href="pages/catalogo.html?cat=sealed" class="text-sm font-semibold text-[#BE123C] hover:text-[#9F1239] hover:underline underline-offset-2 inline-flex items-center gap-1 self-start sm:self-auto">
              <span>Ver todo el sellado</span>
              <i data-lucide="arrow-right" class="w-4 h-4" aria-hidden="true"></i>
            </a>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
                      width="160"
                      height="240"
                      loading="lazy"
                      decoding="async"
                      class="max-h-full max-w-full object-contain transition-transform duration-300 motion-safe:group-hover:scale-105"
                      onerror="this.onerror=null; this.src='${pack.imagenFallbackUrl}'"
                    />
                  </div>
                  <span class="inline-block mt-3 text-xs font-medium text-slate-600">${pack.esSobre ? 'Sobre · 10 cartas' : (pack.era === 'vintage' ? 'Caja vintage' : 'Caja sellada')}</span>
                  <h3 class="text-sm sm:text-base font-semibold text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-2">${pack.nombre}</h3>
                </div>
                <div class="pt-3 mt-3 flex items-end justify-between border-t border-slate-100">
                  <span class="text-base font-bold text-[#0F172A]">$${money(pack.precioUnitario || (pack.precios && (pack.precios.sealed || pack.precios.raw)))}</span>
                  <span class="text-xs font-semibold text-[#0F172A] group-hover:text-[#BE123C] inline-flex items-center gap-1">
                    Ver
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5" aria-hidden="true"></i>
                  </span>
                </div>
              </a></article>
            `).join('')}
          </div>
        </section>` : ''}

        <!-- 7. COMPRAR POR EXPANSIÓN -->
        ${expansions.length ? `
        <section aria-labelledby="collections-nav-heading" class="reveal space-y-4">
          <div class="border-b border-slate-200 pb-3">
            <h2 id="collections-nav-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">Comprar por expansión</h2>
            <p class="text-sm text-slate-600 mt-0.5">Una expansión es una colección de cartas que salió a la venta al mismo tiempo.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${expansions.map(e => `
            <a href="${app.url('catalog', { set: e.slug })}" class="group px-4 py-3.5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-lg flex items-center justify-between transition">
              <span class="flex items-center gap-3">
                <i data-lucide="library" class="w-5 h-5 text-slate-600 group-hover:text-[#0F172A]" aria-hidden="true"></i>
                <span>
                  <span class="block text-sm font-semibold text-[#0F172A] group-hover:text-[#BE123C] transition">${e.nombre}</span>
                  <span class="block text-xs text-slate-600">${e.serie} · ${e.anio} · ${e.count} productos</span>
                </span>
              </span>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-500 group-hover:text-[#0F172A] transition" aria-hidden="true"></i>
            </a>`).join('')}
          </div>
        </section>` : ''}

        <!-- 8. PRECIO DE MERCADO DE CUALQUIER CARTA -->
        <section class="reveal border border-slate-200 bg-[#F1F5F9] rounded-lg px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-[#0F172A]">¿Cuánto vale una carta que tienes en casa?</h2>
            <p class="text-sm text-slate-600 mt-0.5">Búscala en Explorar cartas y mira su precio de mercado de referencia.</p>
          </div>
          <a href="pages/busqueda.html" class="px-5 py-2.5 bg-white border border-slate-300 hover:border-[#0F172A] text-[#0F172A] text-sm font-semibold rounded-md transition flex items-center gap-2 flex-shrink-0 self-start sm:self-auto touch-target">
            <i data-lucide="search" class="w-4 h-4" aria-hidden="true"></i>
            <span>Explorar cartas</span>
          </a>
        </section>
      </div>
    `;
  },

  // Las secciones aparecen suavemente al entrar en pantalla
  setupReveal() {
    if (typeof document.querySelectorAll !== 'function') return;
    const items = Array.from(document.querySelectorAll('#app-view .reveal'));
    const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(el => io.observe(el));
    // Si algo tiene el foco dentro de una sección aún oculta, se muestra de inmediato
    if (!this._revealFocusBound) {
      this._revealFocusBound = true;
      document.addEventListener('focusin', e => {
        const box = e.target.closest && e.target.closest('.reveal');
        if (box) box.classList.add('is-visible');
      });
    }
  },

  // null = el usuario aún no ha elegido; se conserva entre re-renderizados del home
  videoPausedByUser: null,
  visibilityListenerAdded: false,

  afterRender() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    this.setupReveal();
    if (typeof CardExplainer !== 'undefined') CardExplainer.afterRender('home-explainer');
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
