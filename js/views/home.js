const HomeView = {
  render() {
    const featuredIds = ['charizard-base', 'umbreon-vmax', 'lugia-neo', 'gengar-vmax'];
    const featuredCards = featuredIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    const sealedProducts = PRODUCTS.filter(p => p.categoria === 'sealed').slice(0, 3);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        <section aria-labelledby="hero-heading" class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white shadow-xl border border-slate-800">
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-[#E11D48]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            <div class="lg:col-span-7 space-y-5">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7]/15 border border-[#D97706]/40 text-[#FEF3C7] text-xs font-extrabold tracking-wide uppercase">
                <i data-lucide="award" class="w-3.5 h-3.5 text-[#D97706]"></i>
                <span>GRADO INVERSIÓN • OFICIAL PSA</span>
              </div>

              <h1 id="hero-heading" class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Bóveda de Coleccionismo Certificado &amp; Slabs PSA
              </h1>

              <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Adquiere cartas históricas verificadas, expansiones de época selladas y piezas de inversión con entrega segura y garantía de autenticidad.
              </p>

              <div class="pt-2 flex flex-wrap items-center gap-3.5">
                <a 
                  href="#catalog?cat=psa" 
                  class="px-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-extrabold rounded-xl transition shadow-lg flex items-center gap-2 touch-target"
                >
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  <span>Explorar Bóveda PSA</span>
                </a>

                <a 
                  href="#catalog?cat=sealed" 
                  class="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold rounded-xl transition flex items-center gap-2 touch-target"
                >
                  <i data-lucide="package" class="w-4 h-4 text-[#FEF3C7]"></i>
                  <span>Ver Cajas Selladas</span>
                </a>

                <a 
                  href="#catalog" 
                  class="px-5 py-3.5 bg-transparent hover:bg-white/10 text-slate-200 text-sm font-bold rounded-xl transition flex items-center gap-1.5 touch-target"
                >
                  <span>Catálogo Completo</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
              </div>
            </div>

            <div class="lg:col-span-5 flex items-center justify-center">
              <div 
                onclick="app.openProductPDP('charizard-base')" 
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openProductPDP('charizard-base');}"
                role="button"
                tabindex="0"
                aria-label="Inspeccionar pieza estelar Charizard Base Set 1999 PSA 10"
                class="cursor-pointer group relative bg-[#1E293B]/90 backdrop-blur-md border border-slate-700 rounded-2xl p-5 shadow-2xl max-w-xs w-full transition-transform duration-300 hover:-translate-y-1"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#FEF3C7] text-[#D97706]">
                    PIEZA ESTELAR PSA 10
                  </span>
                  <span class="text-xs font-bold text-[#D1FAE5] bg-[#059669]/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +21.7%
                  </span>
                </div>
                <div class="aspect-square bg-[#0F172A] rounded-xl border border-slate-700 flex items-center justify-center p-4 overflow-hidden">
                  <img 
                    src="img/charizard-base.png" 
                    alt="Charizard Base Set 1999 #4/102 PSA 10" 
                    class="max-h-52 object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-xl" 
                    onerror="this.onerror=null; this.src='https://images.pokemontcg.io/base1/4_hires.png'"
                  />
                </div>
                <div class="mt-3 flex items-center justify-between">
                  <div>
                    <h2 class="text-sm font-extrabold text-white group-hover:text-[#FEF3C7] transition">Charizard Base Set 1999</h2>
                    <p class="text-[11px] text-slate-400">Cert #48291034 • GEM MT 10</p>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] text-slate-400 block">Grado PSA 10</span>
                    <span class="text-sm font-black text-[#FEF3C7]">$18,500.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Garantías de compra y seguridad" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div class="flex items-start gap-3.5 pt-3 sm:pt-0 first:pt-0 sm:px-3 first:pl-0">
              <div class="w-10 h-10 rounded-xl bg-[#D1FAE5] border border-[#059669]/30 flex items-center justify-center flex-shrink-0 text-[#059669]">
                <i data-lucide="shield-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h2 class="text-xs sm:text-sm font-extrabold text-[#0F172A]">Autenticidad Certificada</h2>
                <p class="text-xs text-slate-600 mt-0.5 leading-snug">Todas las cartas cuentan con registro verificable en PSA</p>
              </div>
            </div>

            <div class="flex items-start gap-3.5 pt-3 sm:pt-0 sm:px-4">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-[#E11D48]">
                <i data-lucide="truck" class="w-5 h-5"></i>
              </div>
              <div>
                <h2 class="text-xs sm:text-sm font-extrabold text-[#0F172A]">Envíos Blindados ($5.00)</h2>
                <p class="text-xs text-slate-600 mt-0.5 leading-snug">Empaque especial en estuche rígido con protección UV</p>
              </div>
            </div>

            <div class="flex items-start gap-3.5 pt-3 sm:pt-0 sm:px-4">
              <div class="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center flex-shrink-0 text-[#D97706]">
                <i data-lucide="store" class="w-5 h-5"></i>
              </div>
              <div>
                <h2 class="text-xs sm:text-sm font-extrabold text-[#0F172A]">Retiro en Local Físico</h2>
                <p class="text-xs text-slate-600 mt-0.5 leading-snug">Disponible en Sucursal Central Quito en 2 horas</p>
              </div>
            </div>

            <div class="flex items-start gap-3.5 pt-3 sm:pt-0 sm:px-4">
              <div class="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0 text-[#0F172A]">
                <i data-lucide="lock" class="w-5 h-5"></i>
              </div>
              <div>
                <h2 class="text-xs sm:text-sm font-extrabold text-[#0F172A]">Transacciones Protegidas</h2>
                <p class="text-xs text-slate-600 mt-0.5 leading-snug">Protocolos de pago seguro y custodia en bóveda</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="vault-highlights-heading" class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#D97706]">GRADO INVERSIÓN • OFICIAL PSA</span>
              <h2 id="vault-highlights-heading" class="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Tesoros Destacados de la Bóveda
              </h2>
            </div>
            <a 
              href="#catalog?cat=psa" 
              class="text-xs font-extrabold text-[#E11D48] hover:text-[#BE123C] inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver todos los Slabs PSA</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            ${featuredCards.map(card => `
              <article 
                onclick="app.openProductPDP('${card.id}')" 
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openProductPDP('${card.id}');}"
                role="button"
                tabindex="0"
                aria-label="Ver detalles de ${card.nombre}"
                class="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-[#0F172A] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <span class="px-2.5 py-0.5 text-[10px] font-black bg-[#FEF3C7] text-[#D97706] rounded">
                      GRADO INVERSIÓN • PSA 10
                    </span>
                    <span class="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">${card.tendencia12m}</span>
                  </div>
                  <div class="aspect-[3/4] bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-3 relative">
                    <img 
                      src="${card.imagenLocal}" 
                      alt="${card.nombre}" 
                      class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                      onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
                    />
                  </div>
                  <div class="mt-3">
                    <span class="inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider">${card.set} • ${card.tipo}</span>
                    <h3 class="font-extrabold text-sm sm:text-base text-[#0F172A] group-hover:text-[#E11D48] transition mt-0.5 line-clamp-1">${card.nombre}</h3>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-500 block">PSA 10 GEM MT</span>
                    <span class="text-base font-black text-[#0F172A]">$${card.precios.psa10.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span class="px-3 py-1.5 text-xs font-extrabold text-white bg-[#0F172A] group-hover:bg-[#E11D48] rounded-lg transition inline-flex items-center gap-1">
                    <span>Inspeccionar</span>
                    <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <section aria-labelledby="sealed-vintage-heading" class="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-2 max-w-xl">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-[#FEF3C7] text-[#D97706]">
                <i data-lucide="flame" class="w-3.5 h-3.5"></i>
                <span>EXPANSIONES CLÁSICAS WOTC 1999</span>
              </span>
              <h2 id="sealed-vintage-heading" class="text-xl sm:text-2xl font-black tracking-tight text-white">
                Cajas y Sobres Vintage Sellados
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Sobres originales pesados en báscula de precisión (Heavy Packs) y Booster Boxes selladas de fábrica conservadas en bóveda con control de humedad.
              </p>
            </div>
            <a 
              href="#catalog?cat=sealed" 
              class="px-5 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-black rounded-xl transition shadow flex items-center gap-2 self-start lg:self-center flex-shrink-0"
            >
              <i data-lucide="package-open" class="w-4 h-4"></i>
              <span>Explorar Sellados Vintage</span>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            ${sealedProducts.map(pack => `
              <article 
                onclick="app.openProductPDP('${pack.id}')" 
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openProductPDP('${pack.id}');}"
                role="button"
                tabindex="0"
                aria-label="Ver producto sellado ${pack.nombre}"
                class="cursor-pointer bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-[#D97706] rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-md"
              >
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-[#D1FAE5] text-[#059669]">
                      SELLADO DE FÁBRICA
                    </span>
                    <span class="text-xs font-bold text-[#FEF3C7]">${pack.tendencia12m}</span>
                  </div>
                  <div class="h-44 bg-[#0F172A] rounded-xl border border-slate-700 flex items-center justify-center p-3 overflow-hidden">
                    <img 
                      src="${pack.imagenLocal}" 
                      alt="${pack.nombre}" 
                      class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                      onerror="this.onerror=null; this.src='${pack.imagenFallbackUrl}'"
                    />
                  </div>
                  <h3 class="text-sm sm:text-base font-black text-white group-hover:text-[#FEF3C7] transition mt-3 line-clamp-1">${pack.nombre}</h3>
                  <p class="text-xs text-slate-300 mt-1 line-clamp-2">${pack.descripcion}</p>
                </div>
                <div class="pt-3 mt-4 flex items-center justify-between border-t border-slate-700">
                  <div>
                    <span class="text-[10px] text-slate-400 block">Desde (Sellado)</span>
                    <span class="text-base font-black text-[#FEF3C7]">$${pack.precios.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span class="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-[#E11D48] text-white text-xs font-extrabold transition inline-flex items-center gap-1">
                    <span>Ver Ficha</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <section aria-labelledby="collections-nav-heading" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Navegación por Colecciones</span>
              <h2 id="collections-nav-heading" class="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                Explora el Catálogo por Categoría o Era
              </h2>
            </div>
            <a href="#catalog" class="text-xs font-extrabold text-[#E11D48] hover:text-[#BE123C] inline-flex items-center gap-1">
              <span>Abrir Catálogo Avanzado</span>
              <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#catalog?cat=psa" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center">
                  <i data-lucide="award" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0F172A] group-hover:text-[#E11D48] transition">Slabs Certificados PSA</h3>
                  <p class="text-xs text-slate-500">Grados oficiales PSA 8, 9 y 10 Gem Mint</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]"></i>
            </a>

            <a href="#catalog?cat=raw" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center">
                  <i data-lucide="sparkles" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0F172A] group-hover:text-[#E11D48] transition">Cartas Sueltas / Raw</h3>
                  <p class="text-xs text-slate-500">Piezas Near Mint listas para graduar</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]"></i>
            </a>

            <a href="#catalog?cat=sealed" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                  <i data-lucide="package" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0F172A] group-hover:text-[#E11D48] transition">Cajas y Sobres Sellados</h3>
                  <p class="text-xs text-slate-500">Heavy Packs y Booster Boxes 1999</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]"></i>
            </a>

            <a href="#catalog?era=vintage" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
                  <i data-lucide="history" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0F172A] group-hover:text-[#E11D48] transition">Era Clásica WotC 1999-2002</h3>
                  <p class="text-xs text-slate-500">Base Set, Neo Genesis, Team Rocket y Fossil</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]"></i>
            </a>

            <a href="#catalog?era=modern" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center">
                  <i data-lucide="zap" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-[#0F172A] group-hover:text-[#E11D48] transition">Era Moderna &amp; Alt Arts</h3>
                  <p class="text-xs text-slate-500">Evolving Skies, Fusion Strike y Lost Origin</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]"></i>
            </a>

            <a href="#catalog" class="group p-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-white/10 text-[#FEF3C7] flex items-center justify-center">
                  <i data-lucide="layout-grid" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-black text-white">Ver Todo el Catálogo</h3>
                  <p class="text-xs text-slate-300">Filtros combinables en tiempo real</p>
                </div>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-[#FEF3C7]"></i>
            </a>
          </div>
        </section>
      </div>
    `;
  }
};

