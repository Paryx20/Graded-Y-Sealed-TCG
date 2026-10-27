const PDPView = {
  getGradeLabel(condition) {
    const map = {
      raw: 'RAW NEAR MINT',
      psa8: 'NM-MT 8',
      psa9: 'MINT 9',
      psa10: 'GEM MT 10'
    };
    return map[condition] || 'GEM MT 10';
  },

  getConditionFullTitle(condition) {
    const map = {
      raw: 'Sin Gradear (Raw NM)',
      psa8: 'PSA 8 NM-MT',
      psa9: 'PSA 9 MINT',
      psa10: 'PSA 10 GEM MT'
    };
    return map[condition] || 'PSA 10 GEM MT';
  },

  renderOfficialPokemonCardBackSVG() {
    return `
      <svg viewBox="0 0 300 420" class="w-full h-full max-h-[340px] max-w-[245px] rounded-xl shadow-2xl select-none" aria-label="Dorso oficial de carta Pokémon con calibración 50/50">
        <defs>
          <linearGradient id="pkBackBorder" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1E3A8A" />
            <stop offset="50%" stop-color="#2563EB" />
            <stop offset="100%" stop-color="#172554" />
          </linearGradient>
          <radialGradient id="pkSwirl" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#60A5FA" />
            <stop offset="45%" stop-color="#1D4ED8" />
            <stop offset="100%" stop-color="#0F172A" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="300" height="420" rx="16" fill="url(#pkBackBorder)" />
        <rect x="16" y="16" width="268" height="388" rx="10" fill="url(#pkSwirl)" stroke="#93C5FD" stroke-width="2" />
        <ellipse cx="150" cy="210" rx="110" ry="155" fill="none" stroke="#60A5FA" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.55" />
        <circle cx="150" cy="210" r="86" fill="none" stroke="#93C5FD" stroke-width="2" opacity="0.45" />
        <path d="M 68 210 A 82 82 0 0 1 232 210 Z" fill="#E11D48" stroke="#0F172A" stroke-width="6" />
        <path d="M 68 210 A 82 82 0 0 0 232 210 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="6" />
        <line x1="66" y1="210" x2="234" y2="210" stroke="#0F172A" stroke-width="8" />
        <circle cx="150" cy="210" r="24" fill="#FFFFFF" stroke="#0F172A" stroke-width="6" />
        <circle cx="150" cy="210" r="11" fill="#E2E8F0" stroke="#0F172A" stroke-width="2" />
        <rect x="55" y="46" width="190" height="32" rx="6" fill="#FBBF24" stroke="#1E3A8A" stroke-width="3" />
        <text x="150" y="67" text-anchor="middle" fill="#1E3A8A" font-size="15" font-weight="900" font-family="Inter, sans-serif" letter-spacing="2">POKÉMON</text>
        <rect x="65" y="344" width="170" height="26" rx="5" fill="#1E3A8A" stroke="#60A5FA" stroke-width="1.5" />
        <text x="150" y="361" text-anchor="middle" fill="#FEF3C7" font-size="10" font-weight="800" font-family="Inter, sans-serif" letter-spacing="1.5">POCKET MONSTERS</text>
      </svg>
    `;
  },

  renderInspectorStage(product, condition, mode) {
    const certCode = product.certNumber || '48291034';
    const gradeLabel = this.getGradeLabel(condition);

    if (mode === 'slab') {
      return `
        <div class="w-full max-w-[350px] mx-auto psa-acrylic-slab transition-all duration-300">
          <div class="psa-flip-label mb-3">
            <div class="flex items-center justify-between text-[10px] font-black text-[#E11D48] tracking-wider uppercase border-b border-rose-100 pb-1 mb-1">
              <span>PROFESSIONAL SPORTS AUTHENTICATOR</span>
              <span>PSA</span>
            </div>
            <div class="flex items-start justify-between gap-2">
              <div class="text-left">
                <div class="text-[11px] font-black text-[#0F172A] leading-tight line-clamp-1">${product.set.toUpperCase()}</div>
                <div class="text-[11px] font-bold text-slate-700 leading-tight line-clamp-1">${product.nombre}</div>
                <div class="mt-1.5 flex items-center gap-2">
                  <div class="psa-barcode" aria-hidden="true"></div>
                  <span class="font-mono text-[10px] font-bold text-slate-600">#${certCode}</span>
                </div>
              </div>
              <div class="text-right flex-shrink-0 bg-[#0F172A] text-[#FEF3C7] px-2.5 py-1 rounded-md border border-[#D97706]">
                <div class="text-[9px] font-bold uppercase tracking-wider text-slate-300">GRADO</div>
                <div class="text-xs font-black">${gradeLabel}</div>
              </div>
            </div>
          </div>

          <div class="psa-inner-well aspect-[3/4] flex items-center justify-center relative overflow-hidden">
            <img 
              src="${product.imagenLocal}" 
              alt="${product.nombre} encapsulada en Slab PSA" 
              class="max-h-full max-w-full object-contain filter drop-shadow-xl"
              onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
            />
            <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-white/85 backdrop-blur text-[9px] font-black text-[#0F172A] border border-slate-300">
              PSA HOLOGRAM SEAL
            </div>
          </div>
        </div>
      `;
    }

    const isFlipped = mode === 'back';
    return `
      <div 
        id="pdp-3d-scene" 
        onmousemove="PDPView.handleHoloMove(event)"
        class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4"
      >
        <div id="pdp-3d-object" class="card-3d-object min-h-[350px] ${isFlipped ? 'is-flipped-y' : ''}">
          <div class="card-3d-face card-3d-front p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                id="pdp-main-image"
                src="${product.imagenLocal}" 
                alt="${product.nombre}"
                class="max-h-[340px] max-w-full object-contain filter drop-shadow-2xl rounded-xl"
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
              <div id="pdp-holo-layer" class="holo-sheen-layer"></div>
            </div>
          </div>

          <div class="card-3d-face card-3d-back p-2">
            <div class="relative inline-flex items-center justify-center">
              ${this.renderOfficialPokemonCardBackSVG()}
              <div class="centering-grid-overlay">
                <span class="absolute top-2 left-2 bg-[#0F172A]/90 text-[#FEF3C7] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#D97706]/50">
                  EJE X: 50.0% / 50.0%
                </span>
                <span class="absolute bottom-2 right-2 bg-[#059669]/95 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                  EJE Y: 50.0% / 50.0% • BORDES OK
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute top-3 left-3 bg-[#0F172A] text-white border border-slate-700 px-3 py-1 rounded-lg text-xs font-black shadow-md flex items-center gap-1.5 z-10">
          <i data-lucide="shield-check" class="w-4 h-4 text-[#059669]"></i>
          <span id="pdp-cert-badge">${this.getConditionFullTitle(condition)} • #${certCode}</span>
        </div>
      </div>
    `;
  },

  render() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const condition = Store.data.pdpSelectedCondition || 'psa10';
    const mode = Store.data.pdpInspectorMode || 'front';
    const currentPrice = product.precios[condition] || product.precios.psa10;
    const qty = Store.data.pdpQuantity || 1;

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Ruta de navegación" class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
          <a href="#home" class="hover:text-[#0F172A] font-semibold">Inicio</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <a href="#catalog" class="hover:text-[#0F172A] font-semibold">Catálogo</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <span class="text-slate-600 font-semibold">${product.set}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <span class="text-[#0F172A] font-extrabold" aria-current="page">${product.nombre}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div 
              id="pdp-inspector-viewport" 
              class="w-full min-h-[410px] bg-[#F8FAFC] rounded-xl border border-slate-200 flex items-center justify-center relative p-4 overflow-hidden"
            >
              ${this.renderInspectorStage(product, condition, mode)}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4" role="tablist" aria-label="Modos del inspector de carta">
              <button 
                type="button" 
                onclick="PDPView.setInspectorMode('front')" 
                class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'front' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                aria-selected="${mode === 'front'}"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#0F172A]">Frontal Completo</span>
                  <i data-lucide="sparkles" class="w-4 h-4 ${mode === 'front' ? 'text-[#E11D48]' : 'text-slate-400'}"></i>
                </div>
                <span class="text-[11px] text-slate-500 mt-0.5">Holograma intacto</span>
              </button>

              <button 
                type="button" 
                onclick="PDPView.setInspectorMode('back')" 
                class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'back' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                aria-selected="${mode === 'back'}"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#0F172A]">Reverso y Bordes</span>
                  <i data-lucide="flip-horizontal" class="w-4 h-4 ${mode === 'back' ? 'text-[#E11D48]' : 'text-slate-400'}"></i>
                </div>
                <span class="text-[11px] text-slate-500 mt-0.5">Centrado 50/50 (Giro 3D Y)</span>
              </button>

              <button 
                type="button" 
                onclick="PDPView.setInspectorMode('slab')" 
                class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'slab' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                aria-selected="${mode === 'slab'}"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-black text-[#0F172A]">Slab &amp; Empaque</span>
                  <i data-lucide="shield-check" class="w-4 h-4 ${mode === 'slab' ? 'text-[#E11D48]' : 'text-slate-400'}"></i>
                </div>
                <span class="text-[11px] text-slate-500 mt-0.5">Sello de autenticidad PSA</span>
              </button>
            </div>
          </div>

          <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-5">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30">
                <i data-lucide="award" class="w-3.5 h-3.5"></i>
                <span>GRADO INVERSIÓN • OFICIAL PSA</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] mt-2 tracking-tight">${product.nombre}</h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza} • ${product.set} • ${product.tipo} • Cert #${product.certNumber}</p>
            </div>

            <div>
              <div class="flex items-center justify-between gap-2 mb-2">
                <label class="block text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                  Seleccionar Condición / Grado PSA:
                </label>
                <button 
                  type="button" 
                  onclick="app.openPSAGuideModal()" 
                  class="inline-flex items-center gap-1 text-xs font-bold text-[#E11D48] hover:text-[#BE123C] underline underline-offset-2 transition"
                >
                  <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                  <span>¿Qué es un grado PSA?</span>
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Condición de la carta">
                ${[
                  { key: 'raw', title: 'Raw / NM', price: product.precios.raw },
                  { key: 'psa8', title: 'PSA 8 NM-MT', price: product.precios.psa8 },
                  { key: 'psa9', title: 'PSA 9 MINT', price: product.precios.psa9 },
                  { key: 'psa10', title: 'PSA 10 GEM MT', price: product.precios.psa10 }
                ].map(item => {
                  const isActive = condition === item.key;
                  return `
                    <button 
                      type="button" 
                      onclick="PDPView.selectCondition('${item.key}')" 
                      class="p-3 rounded-xl text-left transition ${isActive ? 'bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]' : 'bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]'}"
                    >
                      <div class="text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}">
                        <span>${item.title}</span>
                        ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#059669]"></i>' : ''}
                      </div>
                      <div class="text-sm font-black mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}">
                        $${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-[#0F172A] flex items-center gap-1.5">
                  <i data-lucide="trending-up" class="w-4 h-4 text-[#059669]"></i>
                  <span>Historial de Mercado Actual (12 meses)</span>
                </span>
                <span id="market-trend-pill" class="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">${product.tendencia12m}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">Pasa el cursor por la curva para inspeccionar precios históricos mes a mes</p>

              <div id="pdp-chart-container" class="w-full h-36 mt-3 relative select-none">
                <svg id="pdp-interactive-chart" viewBox="0 0 400 130" class="w-full h-full overflow-visible" aria-label="Gráfica interactiva de tendencia de precio a 12 meses">
                  <line x1="20" y1="105" x2="380" y2="105" stroke="#E2E8F0" stroke-width="1.5" />
                  <line x1="20" y1="65" x2="380" y2="65" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
                  <line x1="20" y1="25" x2="380" y2="25" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="4,4" />
                  <line id="chart-guide-line" x1="0" y1="15" x2="0" y2="115" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3,3" style="display:none;" />
                  <polyline id="chart-polyline" points="30,85 110,75 190,80 270,50 370,25" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                  <circle id="chart-hover-dot" cx="0" cy="0" r="5" fill="#0F172A" stroke="#FFFFFF" stroke-width="2" style="display:none;" />
                  <circle id="chart-active-dot" cx="370" cy="25" r="5.5" fill="#059669" stroke="#FFFFFF" stroke-width="2" />
                  <text x="30" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Oct 2025</text>
                  <text x="143" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Feb 2026</text>
                  <text x="256" y="122" fill="#94A3B8" font-size="9" text-anchor="middle">Jun 2026</text>
                  <text x="370" y="122" fill="#0F172A" font-size="9" font-weight="bold" text-anchor="middle">Hoy</text>
                </svg>
                <div id="chart-hover-tooltip" class="chart-tooltip absolute z-20 opacity-0"></div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200">
              <div class="flex items-baseline justify-between">
                <span id="pdp-price" class="text-3xl font-black text-[#0F172A]">$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                <span class="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-md">
                  En Stock • Custodia Bóveda
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#059669]"></i>
                <span>Envío blindado ($5.00) o retiro en tienda central con garantía oficial</span>
              </p>

              <div class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div class="flex items-center justify-between border-2 border-slate-300 rounded-xl bg-[#F8FAFC] px-2 py-1.5 sm:w-36" aria-label="Selector de cantidad de unidades">
                  <button 
                    type="button" 
                    onclick="PDPView.updateQuantity(-1)" 
                    class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#0F172A] font-black text-base flex items-center justify-center transition"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span id="pdp-quantity-value" class="px-3 text-sm font-black text-[#0F172A] select-none" aria-live="polite">${qty}</span>
                  <button 
                    type="button" 
                    onclick="PDPView.updateQuantity(1)" 
                    class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#0F172A] font-black text-base flex items-center justify-center transition"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button 
                  type="button" 
                  onclick="PDPView.addToCart()" 
                  class="flex-1 py-3.5 px-6 bg-[#E11D48] hover:bg-[#BE123C] text-white text-base font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-2 touch-target"
                >
                  <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                  <span>Añadir a la bolsa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  afterRender() {
    this.drawChart();
    this.bindChartEvents();
  },

  handleHoloMove(e) {
    const scene = document.getElementById('pdp-3d-scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    scene.style.setProperty('--holo-x', `${x.toFixed(1)}%`);
    scene.style.setProperty('--holo-y', `${y.toFixed(1)}%`);
  },

  setInspectorMode(mode) {
    Store.data.pdpInspectorMode = mode;
    app.renderCurrentView();
  },

  selectCondition(condKey) {
    Store.data.pdpSelectedCondition = condKey;
    app.renderCurrentView();
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const price = product.precios[condKey];
    app.showToast(`Grado seleccionado: ${condKey.toUpperCase()} ($${price.toLocaleString('en-US')})`, 'info');
  },

  updateQuantity(delta) {
    const next = (Store.data.pdpQuantity || 1) + delta;
    if (next < 1 || next > 10) return;
    Store.data.pdpQuantity = next;
    const el = document.getElementById('pdp-quantity-value');
    if (el) el.innerText = next;
  },

  addToCart() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const condition = Store.data.pdpSelectedCondition || 'psa10';
    const qty = Store.data.pdpQuantity || 1;
    const price = product.precios[condition];
    const label = this.getConditionFullTitle(condition);

    app.addToCart(
      `${product.id}-${condition}`,
      product.nombre,
      label,
      price,
      product.imagenLocal,
      product.imagenFallbackUrl,
      qty
    );

    Store.data.pdpQuantity = 1;
    const el = document.getElementById('pdp-quantity-value');
    if (el) el.innerText = '1';
  },

  drawChart() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const condition = Store.data.pdpSelectedCondition || 'psa10';
    const basePrice = product.precios[condition] || 1000;

    let trendBadge = product.tendencia12m || '+21.7%';
    let isPositive = true;
    let multipliers = product.historialBase || [0.84, 0.86, 0.88, 0.90, 0.91, 0.93, 0.94, 0.96, 0.97, 0.98, 0.99, 1.00];

    if (condition === 'raw') {
      trendBadge = '-8.4%';
      isPositive = false;
      multipliers = [1.09, 1.08, 1.07, 1.06, 1.05, 1.04, 1.03, 1.02, 1.02, 1.01, 1.00, 1.00];
    } else if (condition === 'psa8') {
      trendBadge = '-3.2%';
      isPositive = false;
      multipliers = [1.04, 1.04, 1.03, 1.03, 1.02, 1.02, 1.01, 1.01, 1.01, 1.00, 1.00, 1.00];
    } else if (condition === 'psa9') {
      trendBadge = '+9.5%';
      isPositive = true;
      multipliers = [0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.96, 0.97, 0.98, 0.99, 0.99, 1.00];
    }

    const trendPill = document.getElementById('market-trend-pill');
    if (trendPill) {
      trendPill.innerText = trendBadge;
      trendPill.className = isPositive
        ? 'text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded'
        : 'text-[11px] font-bold text-[#E11D48] bg-rose-100 px-2 py-0.5 rounded';
    }

    const svg = document.getElementById('pdp-interactive-chart');
    if (!svg) return;

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
    const plotW = width - paddingX * 2;
    const plotH = height - paddingY * 2;

    const prices = points.map(p => p.price);
    const minP = Math.min(...prices) * 0.96;
    const maxP = Math.max(...prices) * 1.04;

    const coords = points.map((pt, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * plotW;
      const normalizedY = (pt.price - minP) / (maxP - minP || 1);
      const y = height - paddingY - normalizedY * plotH;
      return { x, y, pt };
    });

    const pointsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    const polylineEl = document.getElementById('chart-polyline');
    if (polylineEl) {
      polylineEl.setAttribute('points', pointsStr);
      polylineEl.setAttribute('stroke', isPositive ? '#059669' : '#E11D48');
    }

    const lastCoord = coords[coords.length - 1];
    const activeDot = document.getElementById('chart-active-dot');
    if (activeDot && lastCoord) {
      activeDot.setAttribute('cx', lastCoord.x);
      activeDot.setAttribute('cy', lastCoord.y);
      activeDot.setAttribute('fill', isPositive ? '#059669' : '#E11D48');
    }

    svg._chartCoords = coords;
  },

  bindChartEvents() {
    const container = document.getElementById('pdp-chart-container');
    const svg = document.getElementById('pdp-interactive-chart');
    const tooltip = document.getElementById('chart-hover-tooltip');
    const guideLine = document.getElementById('chart-guide-line');
    const hoverDot = document.getElementById('chart-hover-dot');

    if (!container || !svg || !tooltip) return;

    const hideTooltip = () => {
      tooltip.style.opacity = '0';
      if (guideLine) guideLine.style.display = 'none';
      if (hoverDot) hoverDot.style.display = 'none';
    };

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
        <div class="px-2.5 py-1.5 bg-[#0F172A] text-white rounded-lg shadow-xl text-[11px] border border-slate-700 whitespace-nowrap">
          <div class="text-[10px] text-slate-400 font-bold">${nearest.pt.month}</div>
          <div class="font-black text-xs text-white mt-0.5">$${nearest.pt.price.toLocaleString('en-US')} USD</div>
          <div class="text-[10px] font-bold ${isUp ? 'text-[#059669]' : 'text-[#E11D48]'} flex items-center gap-1 mt-0.5">
            <span>${nearest.pt.trend}</span>
            <span>${isUp ? '▲' : '▼'}</span>
          </div>
        </div>
      `;
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mouseleave', hideTooltip);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchend', hideTooltip);
  }
};

