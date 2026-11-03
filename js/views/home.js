const HomeView = {
  render() {
    const featuredIds = ['charizard-ex-paldean', 'pikachu-crown-zenith', 'greninja-ex-twilight', 'blastoise-ex-151'];
    const featuredCards = featuredIds
      .map(id => PRODUCTS.find(p => p.id === id))
      .filter(Boolean);

    const sealedProducts = PRODUCTS.filter(p => p.categoria === 'sealed').slice(0, 3);

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12">
        <!-- ==========================================
             1. HERO SECTION COMERCIAL: BÓVEDA DE INVERSIÓN
             ========================================== -->
        <section aria-labelledby="hero-heading" class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white shadow-2xl border border-slate-800">
          <!-- Brillos ambientales en paleta 60-30-10 -->
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-[#E11D48]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none"></div>

          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-12">
            <!-- Columna Izquierda: Mensaje Comercial y Propuesta de Valor -->
            <div class="lg:col-span-7 space-y-5">
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FEF3C7]/15 border border-[#D97706]/50 text-[#FEF3C7] text-xs font-bold tracking-wide uppercase">
                <i data-lucide="award" class="w-4 h-4 text-[#B45309]"></i>
                <span>BÓVEDA DE INVERSIÓN • OFICIAL PSA &amp; SELLADOS VINTAGE</span>
              </div>

              <h1 id="hero-heading" class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                Bóveda de Coleccionismo Certificado &amp; Slabs PSA
              </h1>

              <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
                Primera plataforma especializada en Ecuador para la adquisición, custodia física y comercialización de cartas Pokémon graduadas por PSA/BGS y producto sellado de época WotC 1999. Autenticidad garantizada, trazabilidad auditable y resguardo en bóveda de alta seguridad.
              </p>

              <!-- CTAs Principales con paleta carmesí / dorado -->
              <div class="pt-2 flex flex-wrap items-center gap-3.5">
                <a 
                  href="pages/catalogo.html?cat=psa" 
                  class="px-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2 touch-target"
                >
                  <i data-lucide="shield-check" class="w-4 h-4"></i>
                  <span>Explorar Bóveda PSA</span>
                </a>

                <a 
                  href="pages/catalogo.html?cat=sealed" 
                  class="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-bold rounded-xl transition flex items-center gap-2 touch-target"
                >
                  <i data-lucide="package" class="w-4 h-4 text-[#FEF3C7]"></i>
                  <span>Ver Cajas Selladas</span>
                </a>

                <a 
                  href="pages/catalogo.html" 
                  class="px-5 py-3.5 bg-transparent hover:bg-white/10 text-slate-200 text-sm font-bold rounded-xl transition flex items-center gap-1.5 touch-target"
                >
                  <span>Catálogo Completo</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
              </div>

              <!-- Barra de Métricas y KPIs Comerciales en Bóveda -->
              <div class="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span class="block text-xl sm:text-2xl font-bold text-[#FEF3C7]">+$280K</span>
                  <span class="text-xs font-semibold text-slate-400">Activos en Bóveda</span>
                </div>
                <div>
                  <span class="block text-xl sm:text-2xl font-bold text-[#D1FAE5]">100%</span>
                  <span class="text-xs font-semibold text-slate-400">Auténtico PSA Card</span>
                </div>
                <div>
                  <span class="block text-xl sm:text-2xl font-bold text-[#FEF3C7]">+18.4%</span>
                  <span class="text-xs font-semibold text-slate-400">Rendimiento Promedio</span>
                </div>
                <div>
                  <span class="block text-xl sm:text-2xl font-bold text-white">48h</span>
                  <span class="text-xs font-semibold text-slate-400">Envíos a Todo Ecuador</span>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Pieza Estelar de Inversión con Holograma y Badge -->
            <div class="lg:col-span-5 flex items-center justify-center">
              <div 
                onclick="app.openProductPDP('charizard-base')" 
                onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.openProductPDP('charizard-base');}"
                role="button"
                tabindex="0"
                aria-label="Inspeccionar pieza estelar Charizard Base Set 1999 PSA 10"
                class="cursor-pointer group relative bg-[#1E293B]/95 backdrop-blur-md border border-slate-700/80 hover:border-[#D97706] rounded-2xl p-5 shadow-2xl max-w-xs w-full transition-all duration-300 hover:-translate-y-1.5"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="px-2.5 py-0.5 rounded text-xs font-bold bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/40">
                    PIEZA ESTELAR PSA 10
                  </span>
                  <span class="text-xs font-bold text-[#D1FAE5] bg-[#059669]/30 border border-[#059669]/40 px-2 py-0.5 rounded flex items-center gap-1">
                    <i data-lucide="trending-up" class="w-3.5 h-3.5"></i> +21.7% (12m)
                  </span>
                </div>

                <div class="aspect-square bg-[#0F172A] rounded-xl border border-slate-700 flex items-center justify-center p-4 overflow-hidden relative">
                  <div class="holo-sheen-layer"></div>
                  <img 
                    src="https://images.pokemontcg.io/base1/4.png"
                    alt="Charizard Base Set 1999 #4/102 PSA 10"
                    width="245"
                    height="342"
                    fetchpriority="high"
                    decoding="async"
                    class="max-h-52 w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-2xl"
                    onerror="this.onerror=null; this.src='assets/img/cards/card-back.png'"
                  />
                </div>

                <div class="mt-3.5 flex items-center justify-between">
                  <div>
                    <h2 class="text-sm font-semibold text-white group-hover:text-[#FEF3C7] transition">Charizard Base Set 1999</h2>
                    <p class="text-xs text-slate-400">Cert #48291034 • GEM MT 10</p>
                  </div>
                  <div class="text-right">
                    <span class="text-xs text-slate-400 block font-semibold">Valor de Mercado</span>
                    <span class="text-base font-bold text-[#FEF3C7]">$18,500.00</span>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
                  <span class="text-xs text-slate-400 flex items-center gap-1">
                    <i data-lucide="shield" class="w-3.5 h-3.5 text-[#047857]"></i>
                    Bóveda Climatizada
                  </span>
                  <span class="font-semibold text-[#FEF3C7] group-hover:text-white transition flex items-center gap-1">
                    Inspeccionar Slab
                    <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ==========================================
             2. BARRA DE GARANTÍAS DE BÓVEDA
             (Envío blindado $5.00, Certificación PSA, Retiro en Quito)
             ========================================== -->
        <section aria-label="Garantías oficiales de compra y seguridad" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <!-- Garantía 1: Envío Blindado $5.00 -->
            <div class="flex items-start gap-4 pt-4 sm:pt-0 first:pt-0 sm:px-3 first:pl-0">
              <div class="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center flex-shrink-0 text-[#BE123C] shadow-xs">
                <i data-lucide="truck" class="w-6 h-6"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xs sm:text-sm font-bold text-[#0F172A]">Envío Blindado ($5.00)</h2>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed font-normal">
                  Tarifa plana a todo el Ecuador. Empaque rígido en estuche acrílico con protección UV y precinto de inviolabilidad.
                </p>
                <span class="inline-block text-xs font-bold text-[#BE123C] uppercase tracking-wider">Courier Especializado</span>
              </div>
            </div>

            <!-- Garantía 2: Certificación Oficial PSA -->
            <div class="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
              <div class="w-12 h-12 rounded-xl bg-[#D1FAE5] border border-[#059669]/30 flex items-center justify-center flex-shrink-0 text-[#047857] shadow-xs">
                <i data-lucide="shield-check" class="w-6 h-6"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xs sm:text-sm font-bold text-[#0F172A]">Certificación PSA Oficial</h2>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed font-normal">
                  100% cartas y slabs genuinos con número de certificación auditable directamente en la base de datos de PSA Card.
                </p>
                <span class="inline-block text-xs font-bold text-[#047857] uppercase tracking-wider">Cero Réplicas • 100% Auténtico</span>
              </div>
            </div>

            <!-- Garantía 3: Retiro en Quito $0.00 -->
            <div class="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
              <div class="w-12 h-12 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center flex-shrink-0 text-[#B45309] shadow-xs">
                <i data-lucide="store" class="w-6 h-6"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xs sm:text-sm font-bold text-[#0F172A]">Retiro en Quito ($0.00)</h2>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed font-normal">
                  Retiro presencial sin recargo en nuestra Bóveda Central (Quito) en 2 horas previa cita y verificación de identidad.
                </p>
                <span class="inline-block text-xs font-bold text-[#B45309] uppercase tracking-wider">Sin Costo • Inmediato</span>
              </div>
            </div>

            <!-- Garantía 4: Custodia en Bóveda Térmica -->
            <div class="flex items-start gap-4 pt-4 sm:pt-0 sm:px-4">
              <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center flex-shrink-0 text-[#0F172A] shadow-xs">
                <i data-lucide="lock" class="w-6 h-6"></i>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xs sm:text-sm font-bold text-[#0F172A]">Bóveda Térmica (20°C / 50%)</h2>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed font-normal">
                  Preservación contra humedad y pandeo con póliza de seguro y pasarela de pago bancaria encriptada TLS 256 bits.
                </p>
                <span class="inline-block text-xs font-bold text-[#0F172A] uppercase tracking-wider">Custodia Institucional</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ==========================================
             3. TESOROS DESTACADOS DE LA BÓVEDA
             ========================================== -->
        <section aria-labelledby="vault-highlights-heading" class="space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[#B45309]">GRADO INVERSIÓN • OFICIAL PSA</span>
              <h2 id="vault-highlights-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Tesoros Destacados de la Bóveda
              </h2>
            </div>
            <a 
              href="pages/catalogo.html?cat=psa" 
              class="text-xs font-semibold text-[#BE123C] hover:text-[#9F1239] inline-flex items-center gap-1 self-start sm:self-auto transition"
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
                class="cursor-pointer bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-[#0F172A] transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div class="flex items-center justify-between mb-2.5">
                    <span class="px-2.5 py-0.5 text-xs font-bold bg-[#FEF3C7] text-[#B45309] rounded border border-[#D97706]/30">
                      GRADO INVERSIÓN • PSA 10
                    </span>
                    <span class="text-xs font-bold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded border border-[#059669]/30">
                      ${card.tendencia12m}
                    </span>
                  </div>
                  <div class="aspect-[3/4] bg-[#F8FAFC] rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-3 relative">
                    <img 
                      src="${card.imagenLocal}"
                      alt="${card.nombre}"
                      width="245"
                      height="342"
                      loading="lazy"
                      decoding="async"
                      class="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-105" 
                      onerror="this.onerror=null; this.src='${card.imagenFallbackUrl}'"
                    />
                  </div>
                  <div class="mt-3">
                    <span class="inline-block text-xs font-bold text-slate-500 uppercase tracking-wider">${card.set} • ${card.tipo}</span>
                    <h3 class="font-semibold text-sm sm:text-base text-[#0F172A] group-hover:text-[#BE123C] transition mt-0.5 line-clamp-1">${card.nombre}</h3>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span class="text-xs text-slate-500 block">PSA 10 GEM MT</span>
                    <span class="text-base font-bold text-[#0F172A]">$${card.precios.psa10.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span class="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F172A] group-hover:bg-[#E11D48] rounded-lg transition inline-flex items-center gap-1 shadow-xs">
                    <span>Inspeccionar</span>
                    <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- ==========================================
             4. CAJAS Y SOBRES VINTAGE SELLADOS
             ========================================== -->
        <section aria-labelledby="sealed-vintage-heading" class="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="space-y-2 max-w-xl">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/40">
                <i data-lucide="flame" class="w-3.5 h-3.5"></i>
                <span>EXPANSIONES CLÁSICAS WOTC 1999</span>
              </span>
              <h2 id="sealed-vintage-heading" class="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Cajas y Sobres Vintage Sellados
              </h2>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Sobres originales pesados en báscula de precisión (Heavy Packs calibrados) y Booster Boxes selladas de fábrica conservadas en bóveda con control de humedad para evitar micro-grietas en el celofán original.
              </p>
            </div>
            <a 
              href="pages/catalogo.html?cat=sealed" 
              class="px-5 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow flex items-center gap-2 self-start lg:self-center flex-shrink-0 touch-target"
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
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-[#D1FAE5] text-[#047857]">
                      SELLADO DE FÁBRICA
                    </span>
                    <span class="text-xs font-bold text-[#FEF3C7]">${pack.tendencia12m}</span>
                  </div>
                  <div class="h-44 bg-[#0F172A] rounded-xl border border-slate-700 flex items-center justify-center p-3 overflow-hidden">
                    <img 
                      src="${pack.imagenLocal}"
                      alt="${pack.nombre}"
                      loading="lazy"
                      decoding="async"
                      class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" 
                      onerror="this.onerror=null; this.src='${pack.imagenFallbackUrl}'"
                    />
                  </div>
                  <h3 class="text-sm sm:text-base font-bold text-white group-hover:text-[#FEF3C7] transition mt-3 line-clamp-1">${pack.nombre}</h3>
                  <p class="text-xs text-slate-300 mt-1 line-clamp-2">${pack.descripcion}</p>
                </div>
                <div class="pt-3 mt-4 flex items-center justify-between border-t border-slate-700">
                  <div>
                    <span class="text-xs text-slate-400 block">Desde (Sellado)</span>
                    <span class="text-base font-bold text-[#FEF3C7]">$${pack.precios.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <span class="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-[#E11D48] text-white text-xs font-semibold transition inline-flex items-center gap-1">
                    <span>Ver Ficha</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                  </span>
                </div>
              </article>
            `).join('')}
          </div>
        </section>

        <!-- ==========================================
             5. SECCIÓN PEDAGÓGICA Y DE CONFIANZA:
             ¿POR QUÉ INVERTIR EN GRADED & SEALED TCG?
             ========================================== -->
        <section aria-labelledby="why-invest-heading" class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div class="max-w-2xl">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#B45309]">Estándar de Bóveda &amp; Coleccionismo</span>
            <h2 id="why-invest-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight mt-1">
              ¿Por qué invertir en Graded &amp; Sealed TCG?
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed font-normal">
              El coleccionismo de alta gama ha evolucionado hacia una clase de activo alternativa respaldada por escasez comprobada, auditoría técnica independiente y liquidez global en dólares.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center text-[#B45309]">
                <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
              </div>
              <h3 class="text-sm font-bold text-[#0F172A]">1. Escasez y Población PSA</h3>
              <p class="text-xs text-slate-600 leading-relaxed font-normal">
                El informe oficial de población (PSA Population Report) audita con exactitud cuántas piezas existen en el mundo con grado 10 Gem Mint, eliminando el riesgo de sobreoferta.
              </p>
            </div>

            <div class="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#BE123C]">
                <i data-lucide="shield" class="w-5 h-5"></i>
              </div>
              <h3 class="text-sm font-bold text-[#0F172A]">2. Protección Grado Museo</h3>
              <p class="text-xs text-slate-600 leading-relaxed font-normal">
                Las cápsulas acrílicas soldadas por ultrasonido aíslan la carta de la humedad, polvo ambiental y radiación ultravioleta, preservando su estado Near Mint para siempre.
              </p>
            </div>

            <div class="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <div class="w-10 h-10 rounded-xl bg-[#D1FAE5] border border-[#059669]/30 flex items-center justify-center text-[#047857]">
                <i data-lucide="coins" class="w-5 h-5"></i>
              </div>
              <h3 class="text-sm font-bold text-[#0F172A]">3. Liquidez Internacional</h3>
              <p class="text-xs text-slate-600 leading-relaxed font-normal">
                Las piezas graduadas cuentan con cotizaciones verificables en tiempo real en subastas de Estados Unidos y Japón (PWCC, Goldin, eBay Sold), transables directamente en USD.
              </p>
            </div>
          </div>
        </section>

        <!-- ==========================================
             6. EXPLORADOR POR CATEGORÍA O ERA
             ========================================== -->
        <section aria-labelledby="collections-nav-heading" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Navegación por Colecciones</span>
              <h2 id="collections-nav-heading" class="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                Explora el Catálogo por Categoría o Era
              </h2>
            </div>
            <a href="pages/catalogo.html" class="text-xs font-semibold text-[#BE123C] hover:text-[#9F1239] inline-flex items-center gap-1 transition">
              <span>Abrir Catálogo Avanzado</span>
              <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="pages/catalogo.html?cat=psa" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="award" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-[#BE123C] transition">Slabs Certificados PSA</h3>
                  <p class="text-xs text-slate-500">Grados oficiales PSA 8, 9 y 10 Gem Mint</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>

            <a href="pages/catalogo.html?cat=raw" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#D1FAE5] text-[#047857] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="sparkles" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-[#BE123C] transition">Cartas Sueltas / Raw</h3>
                  <p class="text-xs text-slate-500">Piezas Near Mint listas para graduar</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>

            <a href="pages/catalogo.html?cat=sealed" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="package" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-[#BE123C] transition">Cajas y Sobres Sellados</h3>
                  <p class="text-xs text-slate-500">Heavy Packs y Booster Boxes 1999</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>

            <a href="pages/catalogo.html?era=vintage" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-rose-50 text-[#BE123C] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="history" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-[#BE123C] transition">Era Clásica WotC 1999-2002</h3>
                  <p class="text-xs text-slate-500">Base Set, Neo Genesis, Team Rocket y Fossil</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>

            <a href="pages/catalogo.html?era=modern" class="group p-5 bg-white border border-slate-200 hover:border-[#0F172A] rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-slate-100 text-[#0F172A] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="zap" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-[#0F172A] group-hover:text-[#BE123C] transition">Era Moderna &amp; Alt Arts</h3>
                  <p class="text-xs text-slate-500">Evolving Skies, Fusion Strike y Lost Origin</p>
                </div>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-[#0F172A] transition"></i>
            </a>

            <a href="pages/catalogo.html" class="group p-5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-2xl shadow-sm flex items-center justify-between transition">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-white/10 text-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                  <i data-lucide="layout-grid" class="w-5 h-5"></i>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-white">Ver Todo el Catálogo</h3>
                  <p class="text-xs text-slate-300">Filtros combinables en tiempo real</p>
                </div>
              </div>
              <i data-lucide="arrow-right" class="w-4 h-4 text-[#FEF3C7]"></i>
            </a>
          </div>
        </section>

        <!-- ==========================================
             7. BANNER FINAL: INVITACIÓN AL CATÁLOGO COMPLETO
             ========================================== -->
        <section class="bg-gradient-to-r from-slate-900 via-[#0F172A] to-[#1E293B] rounded-3xl p-8 sm:p-10 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-2 max-w-xl text-center md:text-left">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7]/15 text-[#FEF3C7] border border-[#D97706]/40 uppercase">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-[#B45309]"></i>
              <span>Inventario Dinámico en Tiempo Real</span>
            </span>
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¿Buscas una carta específica o un grado exacto?
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Accede al Catálogo Avanzado con filtros por era, tipo de energía, grado PSA y cotización para localizar tu próxima pieza de inversión.
            </p>
          </div>
          <a 
            href="pages/catalogo.html" 
            class="px-6 py-4 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2 flex-shrink-0 touch-target"
          >
            <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
            <span>Abrir Catálogo Avanzado</span>
          </a>
        </section>
      </div>
    `;
  }
};
