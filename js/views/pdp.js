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

  // La ficha usa la versión grande de pokemontcg.io; la cuadrícula carga la pequeña
  hiresImage(url) {
    return /^https:\/\/images\.pokemontcg\.io\/.+(?<!_hires)\.png$/.test(url || '')
      ? url.replace(/\.png$/, '_hires.png')
      : url;
  },

  renderInspectorStage(product, condition, mode) {
    const certCode = product.certNumber || '48291034';
    const gradeLabel = this.getGradeLabel(condition);
    const mainImage = this.hiresImage(product.imagenLocal);

    if (mode === 'slab') {
      const cardNumMatch = (product.nombre || '').match(/#(\d+)(?:\/\d+)?/);
      const cardNum = product.numeroCarta || (cardNumMatch ? '#' + cardNumMatch[1] : '#114');

      return `
        <div class="w-full max-w-[340px] mx-auto psa-acrylic-slab transition-all duration-300 relative select-none">
          <!-- Official PSA White Paper Label with Signature Red Border Frame -->
          <div class="psa-flip-label psa-official-label mb-3 relative">
            <!-- Header Bar: PROFESSIONAL SPORTS AUTHENTICATOR & PSA -->
            <div class="flex items-center justify-between text-xs sm:text-[8.5px] font-bold text-[#D8232A] tracking-wider uppercase border-b border-rose-100 pb-1 mb-1.5 select-none">
              <span class="tracking-widest">PROFESSIONAL SPORTS AUTHENTICATOR</span>
              <span>PSA</span>
            </div>

            <!-- 3-Line Official Typography Grid -->
            <div class="grid grid-cols-12 gap-1 items-start text-[#0F172A] font-mono leading-tight">
              <div class="col-span-8 text-left space-y-0.5">
                <div class="text-xs font-bold tracking-tight line-clamp-1 uppercase text-slate-900">${String(product.set || 'EXP').toUpperCase()}</div>
                <div class="text-xs font-bold tracking-tight line-clamp-1 text-slate-950">${product.nombre}</div>
                <div class="text-[9.5px] font-bold text-slate-600 line-clamp-1 uppercase">${product.rareza || 'SPECIAL ART RARE'}</div>
              </div>
              <div class="col-span-4 text-right flex flex-col items-end justify-start">
                <span class="text-[10.5px] font-bold text-slate-800 tracking-tighter">${cardNum}</span>
                <div class="mt-0.5 text-right">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block leading-none">GRADO</span>
                  <span class="text-xs font-bold text-slate-950 leading-tight block">${gradeLabel}</span>
                </div>
              </div>
            </div>

            <!-- Bottom Row: Barcode, Center Hologram Security Foil & Cert Number -->
            <div class="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between gap-1">
              <div class="psa-barcode flex-shrink-0" role="img" aria-label="Código de barras oficial"></div>
              <div class="psa-hologram-emblem flex-shrink-0 flex items-center justify-center px-1.5 py-0.5 rounded bg-gradient-to-r from-slate-200 via-amber-100 to-slate-200 border border-slate-300 text-xs font-bold shadow-xs" title="PSA Authentic Security Hologram">
                <span class="text-[#0284C7] font-bold">P</span><span class="text-[#D8232A] font-bold">S</span><span class="text-[#0F172A] font-bold">A</span>
              </div>
              <span class="font-mono text-xs font-bold text-slate-700 tracking-wider">#${certCode}</span>
            </div>
          </div>

          <!-- Inner Acrylic Recess with 4 Structural Corner Notches ("Muescas") -->
          <div class="psa-inner-well aspect-[3/4] flex items-center justify-center relative overflow-hidden">
            <!-- 4 Structural Corner Cutouts -->
            <div class="psa-notch psa-notch-tl" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-tr" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-bl" aria-hidden="true"></div>
            <div class="psa-notch psa-notch-br" aria-hidden="true"></div>

            <!-- Centered Card Artwork without artificial overlay sticker -->
            <img 
              src="${mainImage}"
              alt="${product.nombre} encapsulada en Slab PSA"
              width="245"
              height="342"
              fetchpriority="high"
              decoding="async"
              class="max-h-full max-w-full object-contain filter drop-shadow-2xl rounded-xs select-none"
              onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
            />
          </div>

          <!-- Molded Acrylic PSA Emboss (Bottom-Right) -->
          <div class="psa-molded-logo" aria-hidden="true">PSA</div>
        </div>
      `;
    }

    const isFlipped = mode === 'back';
    return `
      <div 
        id="pdp-3d-scene" 
        onmousemove="PDPView.handleHoloMove(event)"
        ontouchstart="PDPView.handleHoloMove(event)"
        ontouchmove="PDPView.handleHoloMove(event)"
        ontouchend="PDPView.handleHoloMove(event)"
        class="w-full h-full min-h-[370px] card-3d-scene flex items-center justify-center relative p-4 select-none touch-none cursor-grab"
      >
        <div id="pdp-3d-object" class="card-3d-object min-h-[350px] ${isFlipped ? 'is-flipped-y' : ''}">
          <div class="card-3d-face card-3d-front p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                id="pdp-main-image"
                src="${mainImage}"
                alt="${product.nombre}, ${gradeLabel}, vista frontal"
                width="245"
                height="342"
                fetchpriority="high"
                decoding="async"
                class="max-h-[340px] w-auto h-auto max-w-full object-contain filter drop-shadow-2xl rounded-xl pointer-events-none select-none"
                draggable="false"
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
              <div id="pdp-holo-layer" class="holo-sheen-layer"></div>
            </div>
          </div>

          <div class="card-3d-face card-3d-back p-2">
            <div class="relative inline-flex items-center justify-center max-h-[350px]">
              <img 
                src="assets/img/cards/card-back.png" 
                class="w-full h-full object-cover rounded-xl max-h-[340px] max-w-[245px] shadow-2xl pointer-events-none select-none" 
                draggable="false"
                alt="Reverso de carta Pokémon" 
                onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
              />
            </div>
          </div>
        </div>

        <div class="absolute top-3 left-3 bg-[#0F172A] text-white border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 z-10 pointer-events-none">
          <i data-lucide="shield-check" class="w-4 h-4 text-[#047857]"></i>
          <span id="pdp-cert-badge">${this.getConditionFullTitle(condition)} • #${certCode}</span>
        </div>
      </div>
    `;
  },

  SEALED_ANGLES: [
    { key: 'perspectiva', title: 'Foto principal', sub: 'Vista completa de la caja', icon: 'camera' },
    { key: 'contenido', title: 'Contenido', sub: 'Lo que trae la caja', icon: 'package-open' },
    { key: 'frontal', title: 'Frontal', sub: 'Sello y arte principal', icon: 'square' },
    { key: 'lateral', title: 'Lateral', sub: 'Costado y código de barras', icon: 'align-justify' },
    { key: 'superior', title: 'Superior', sub: 'Tapa de la caja', icon: 'layers' }
  ],

  getSealedGallery(product) {
    return product.galeria_sellada || {
      frontal: product.imagenLocal,
      perspectiva: product.imagenFallbackUrl || product.imagenLocal,
      lateral: product.imagenLocal
    };
  },

  // Ángulo válido para este producto (el guardado puede no existir en su galería)
  resolveSealedAngle(product, angle) {
    const gallery = this.getSealedGallery(product);
    if (gallery[angle]) return angle;
    const first = this.SEALED_ANGLES.find(a => gallery[a.key]);
    return first ? first.key : 'frontal';
  },

  renderSealedGalleryStage(product, activeAngle) {
    const gallery = this.getSealedGallery(product);
    activeAngle = this.resolveSealedAngle(product, activeAngle);
    const currentImage = gallery[activeAngle] || product.imagenLocal;
    const currentLabel = (this.SEALED_ANGLES.find(a => a.key === activeAngle) || { title: 'Frontal' }).title;
    const sealLabel = product.era === 'vintage' ? 'SELLADO ORIGINAL WOTC • BÓVEDA' : 'SELLADO DE FÁBRICA • BÓVEDA';

    return `
      <div id="pdp-sealed-stage" class="w-full h-full min-h-[370px] flex items-center justify-center relative p-4 select-none">
        <div class="relative inline-flex items-center justify-center max-h-[360px] w-full">
          <img 
            id="pdp-sealed-main-img"
            src="${currentImage}" 
            alt="${product.nombre}, vista ${currentLabel.toLowerCase()}" 
            class="max-h-[340px] max-w-full object-contain filter drop-shadow-2xl rounded-xl sealed-stage-img"
            onerror="this.onerror=null; this.src='${product.imagenFallbackUrl}'"
          />
        </div>
        <div class="absolute top-3 left-3 bg-[#0F172A] text-white border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 z-10">
          <i data-lucide="package-check" class="w-4 h-4 text-[#B45309]"></i>
          <span>${sealLabel}</span>
        </div>
        <div class="absolute bottom-3 right-3 bg-white/90 backdrop-blur border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
          <i data-lucide="eye" class="w-3.5 h-3.5 text-[#0F172A]"></i>
          <span>Ángulo: <strong class="text-[#0F172A] uppercase">${currentLabel}</strong></span>
        </div>
      </div>
    `;
  },

  renderSealedGalleryControls(product, activeAngle) {
    const gallery = this.getSealedGallery(product);
    activeAngle = this.resolveSealedAngle(product, activeAngle);
    const angles = this.SEALED_ANGLES.filter(a => gallery[a.key]);

    return `
      <div class="grid grid-cols-2 ${['sm:grid-cols-3', 'sm:grid-cols-3', 'sm:grid-cols-3', 'sm:grid-cols-3', 'sm:grid-cols-4', 'sm:grid-cols-5'][angles.length] || 'sm:grid-cols-5'} gap-3 mt-4" role="group" aria-label="Ángulos del empaque sellado">
        ${angles.map(ang => {
          const isActive = activeAngle === ang.key;
          const thumbImg = gallery[ang.key] || product.imagenLocal;
          return `
            <button 
              type="button" 
              onclick="PDPView.setSealedAngle('${ang.key}')" 
              class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${isActive ? 'border-[#D97706] bg-amber-50/50 shadow-sm' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
              aria-pressed="${isActive}"
            >
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-bold text-[#0F172A]">${ang.title}</span>
                <i data-lucide="${ang.icon}" class="w-4 h-4 ${isActive ? 'text-[#B45309]' : 'text-slate-500'}"></i>
              </div>
              <div class="w-full h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-1.5">
                <img src="${thumbImg}" alt="" loading="lazy" decoding="async" class="max-h-full max-w-full object-contain p-1" />
              </div>
              <span class="text-xs text-slate-500 line-clamp-1">${ang.sub}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  },

  renderFactorySpecs(product) {
    const specs = product.detalles_sellados || {
      gramaje: '750g (Caja Completa)',
      gramaje_gramos: 750,
      cantidad_sobres_interior: 36,
      es_pesado_verificado: true,
      sellos: 'Sello oficial Wizards of the Coast termo-sellado con logo blanco',
      sello_fabrica: 'Wizards of the Coast Authentic Shrinkwrap with White Logo',
      packs: '36 Sobres de 11 Cartas c/u',
      estado: 'Sin pesar / Unweighed • Sellado de Fábrica Intacto',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    };

    return `
      <div id="sealed-factory-specs" class="bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wide">
            <i data-lucide="file-check-2" class="w-4 h-4 text-[#B45309]"></i>
            <span>Especificaciones de Fábrica Sellada${product.era === 'vintage' ? ' WotC' : ''}</span>
          </span>
          <span class="text-xs font-semibold bg-[#D1FAE5] text-[#047857] px-2 py-0.5 rounded-full border border-[#059669]/20">
            VERIFICADO BÓVEDA
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-2.5 rounded-lg bg-white border border-slate-200">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Gramaje Verificado</div>
            <div class="font-semibold text-[#0F172A] mt-0.5 flex items-center gap-1">
              <i data-lucide="scale" class="w-3.5 h-3.5 text-[#B45309]"></i>
              <span>${specs.gramaje}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${specs.es_pesado_verificado ? 'Balanza de precisión calibrada' : 'Estándar'}</div>
          </div>

          <div class="p-2.5 rounded-lg bg-white border border-slate-200">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Contenido Interior</div>
            <div class="font-semibold text-[#0F172A] mt-0.5 flex items-center gap-1">
              <i data-lucide="boxes" class="w-3.5 h-3.5 text-[#B45309]"></i>
              <span>${specs.packs}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${specs.cantidad_sobres_interior} Sobres sellados</div>
          </div>

          <div class="p-2.5 rounded-lg bg-white border border-slate-200 sm:col-span-2">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sello de Fábrica y Celofán</div>
            <div class="font-bold text-[#0F172A] mt-0.5 flex items-start gap-1">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5 text-[#047857] mt-0.5 flex-shrink-0"></i>
              <span>${specs.sellos} (${specs.sello_fabrica})</span>
            </div>
          </div>

          <div class="p-2.5 rounded-lg bg-white border border-slate-200">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Lote</div>
            <div class="font-bold text-[#0F172A] mt-0.5 flex items-center gap-1">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
              <span>${specs.estado}</span>
            </div>
          </div>

          <div class="p-2.5 rounded-lg bg-white border border-slate-200">
            <div class="text-xs font-bold text-slate-500 uppercase tracking-wider">Conservación</div>
            <div class="font-bold text-[#0F172A] mt-0.5 flex items-center gap-1">
              <i data-lucide="thermometer" class="w-3.5 h-3.5 text-sky-500"></i>
              <span>${specs.conservacion}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  render() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const isSealed = product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed' || product.tipo_item === 'PRODUCTO_SELLADO';
    const condition = Store.data.pdpSelectedCondition || 'psa10';
    const mode = Store.data.pdpInspectorMode || 'front';
    const activeAngle = Store.data.pdpSealedAngle || 'perspectiva';
    const qty = Store.data.pdpQuantity || 1;
    if (typeof document !== 'undefined') document.title = `${product.nombre} | Graded & Sealed TCG`;

    let currentPrice;
    if (isSealed) {
      currentPrice = product.precioUnitario || (product.precios && product.precios.sealed) || (product.precios && product.precios.raw) || 3500;
    } else {
      const prices = this.getConditionPrices(product);
      currentPrice = prices[condition] || prices.psa10 || 1000;
    }

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav aria-label="Ruta de navegación" class="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
          <a href="index.html" class="hover:text-[#0F172A] font-semibold">Inicio</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <a href="pages/catalogo.html" class="hover:text-[#0F172A] font-semibold">Catálogo</a>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <span class="text-slate-600 font-semibold">${product.set || 'Colección TCG'}</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          <span class="text-[#0F172A] font-semibold" aria-current="page">${product.nombre}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div 
              id="pdp-inspector-viewport" 
              class="w-full min-h-[410px] bg-[#F8FAFC] rounded-xl border border-slate-200 flex items-center justify-center relative p-4 overflow-hidden"
            >
              ${isSealed 
                ? this.renderSealedGalleryStage(product, activeAngle) 
                : this.renderInspectorStage(product, condition, mode)}
            </div>

            ${isSealed 
              ? this.renderSealedGalleryControls(product, activeAngle) 
              : `
                ${mode !== 'slab' ? `
                  <div class="flex flex-wrap items-center justify-center gap-2 mt-4" role="group" aria-label="Girar la carta sin arrastrar">
                    <button type="button" onclick="PDPView.rotateCard3D(0, -30)" class="icon-btn" aria-label="Girar a la izquierda">
                      <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="PDPView.rotateCard3D(0, 30)" class="icon-btn" aria-label="Girar a la derecha">
                      <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="PDPView.rotateCard3D(-15, 0)" class="icon-btn" aria-label="Inclinar hacia arriba">
                      <i data-lucide="arrow-up" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="PDPView.rotateCard3D(15, 0)" class="icon-btn" aria-label="Inclinar hacia abajo">
                      <i data-lucide="arrow-down" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="PDPView.resetCard3D()" class="icon-btn" aria-label="Restablecer posición de la carta">
                      <i data-lucide="locate-fixed" class="w-4 h-4"></i>
                    </button>
                  </div>
                ` : ''}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4" role="group" aria-label="Modos del inspector de carta">
                  <button 
                    type="button" 
                    onclick="PDPView.setInspectorMode('front')" 
                    class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'front' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                    aria-pressed="${mode === 'front'}"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#0F172A]">Frontal Completo</span>
                      <i data-lucide="sparkles" class="w-4 h-4 ${mode === 'front' ? 'text-[#BE123C]' : 'text-slate-500'}"></i>
                    </div>
                    <span class="text-xs text-slate-500 mt-0.5">Holograma intacto</span>
                  </button>

                  <button 
                    type="button" 
                    onclick="PDPView.setInspectorMode('back')" 
                    class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'back' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                    aria-pressed="${mode === 'back'}"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#0F172A]">Reverso y Bordes</span>
                      <i data-lucide="flip-horizontal" class="w-4 h-4 ${mode === 'back' ? 'text-[#BE123C]' : 'text-slate-500'}"></i>
                    </div>
                    <span class="text-xs text-slate-500 mt-0.5">Reverso oficial (Giro 3D Y)</span>
                  </button>

                  <button 
                    type="button" 
                    onclick="PDPView.setInspectorMode('slab')" 
                    class="p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${mode === 'slab' ? 'border-[#E11D48] bg-rose-50/40' : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-400'}"
                    aria-pressed="${mode === 'slab'}"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-[#0F172A]">Slab &amp; Empaque</span>
                      <i data-lucide="shield-check" class="w-4 h-4 ${mode === 'slab' ? 'text-[#BE123C]' : 'text-slate-500'}"></i>
                    </div>
                    <span class="text-xs text-slate-500 mt-0.5">Sello de autenticidad PSA</span>
                  </button>
                </div>
              `}
          </div>

          <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-5">
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#D97706]/30">
                <i data-lucide="${isSealed ? 'package-check' : 'award'}" class="w-3.5 h-3.5"></i>
                <span>${isSealed ? (product.era === 'vintage' ? 'PRODUCTO SELLADO DE COLECCIÓN • WOTC' : 'PRODUCTO SELLADO DE COLECCIÓN') : 'GRADO INVERSIÓN • OFICIAL PSA'}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2 tracking-tight">${product.nombre}</h1>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">${product.rareza || 'Coleccionable'} • ${product.set || 'EXP'} • ${isSealed ? `Era ${(product.era || 'vintage').toUpperCase()} • Display Sellado` : `${product.tipo || 'Carta'} • Cert #${product.certNumber || '00000000'}`}</p>
            </div>

            ${isSealed ? this.renderFactorySpecs(product) : `
              <div>
                <div class="flex items-center justify-between gap-2 mb-2">
                  <label class="block text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                    Seleccionar Condición / Grado PSA:
                  </label>
                  <button 
                    type="button" 
                    onclick="app.openPSAGuideModal()" 
                    class="inline-flex items-center gap-1 text-xs font-bold text-[#BE123C] hover:text-[#9F1239] underline underline-offset-2 transition"
                  >
                    <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                    <span>¿Qué es un grado PSA?</span>
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Condición de la carta">
                  ${(() => {
                    const condPrices = this.getConditionPrices(product);
                    return [
                      { key: 'raw', title: 'Raw / NM', price: condPrices.raw },
                      { key: 'psa8', title: 'PSA 8 NM-MT', price: condPrices.psa8 },
                      { key: 'psa9', title: 'PSA 9 MINT', price: condPrices.psa9 },
                      { key: 'psa10', title: 'PSA 10 GEM MT', price: condPrices.psa10 }
                    ].map(item => {
                      const isActive = condition === item.key;
                      return `
                        <button 
                          type="button" 
                          onclick="PDPView.selectCondition('${item.key}')" 
                          role="radio"
                          aria-checked="${isActive}"
                          class="p-3 rounded-xl text-left transition ${isActive ? 'bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]' : 'bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]'}"
                        >
                          <div class="text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}">
                            <span>${item.title}</span>
                            ${isActive ? '<i data-lucide="check" class="w-3.5 h-3.5 text-[#047857]"></i>' : ''}
                          </div>
                          <div class="text-sm font-bold mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}">
                            $${Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          ${Store.getStock(product.id, item.key) === 0 ? `<div class="text-xs font-semibold uppercase tracking-wide mt-0.5 ${isActive ? 'text-rose-300' : 'text-[#BE123C]'}">Agotado</div>` : ''}
                        </button>
                      `;
                    }).join('');
                  })()}
                </div>
              </div>
            `}

            <div class="pt-3 border-t border-slate-200">
              <div class="flex items-baseline justify-between">
                <span id="pdp-price" class="text-3xl font-bold text-[#0F172A]">$${Number(currentPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                ${this.renderStockBadge(product, isSealed ? 'sealed' : condition)}
              </div>
              <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-[#047857]"></i>
                <span>Envío blindado ($5.00) o retiro en tienda central con garantía oficial</span>
              </p>

              <div class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div class="flex items-center justify-between border-2 border-slate-300 rounded-xl bg-[#F8FAFC] px-2 py-1.5 sm:w-36" role="group" aria-label="Selector de cantidad de unidades">
                  <button 
                    type="button" 
                    onclick="PDPView.updateQuantity(-1)" 
                    class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#0F172A] font-bold text-base flex items-center justify-center transition"
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span id="pdp-quantity-value" class="px-3 text-sm font-bold text-[#0F172A] select-none" aria-live="polite">${qty}</span>
                  <button 
                    type="button" 
                    onclick="PDPView.updateQuantity(1)" 
                    class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#0F172A] font-bold text-base flex items-center justify-center transition"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button 
                  type="button" 
                  onclick="PDPView.addToCart()" 
                  class="flex-1 py-3.5 px-6 bg-[#E11D48] hover:bg-[#BE123C] text-white text-base font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2 touch-target"
                >
                  <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                  <span>Añadir a la bolsa</span>
                </button>

                <button
                  type="button"
                  class="icon-btn self-center"
                  style="width: 3rem; height: 3rem;"
                  data-favorite-id="${product.id}"
                  aria-pressed="${Store.isFavorite(product.id) ? 'true' : 'false'}"
                  aria-label="${Store.isFavorite(product.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${product.nombre}"
                  onclick="app.toggleFavorite('${product.id}')"
                >
                  <i data-lucide="heart" class="w-5 h-5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Stock real por grado leído de Supabase (certificaciones_psa)
  renderStockBadge(product, grade) {
    const stock = Store.getStock(product.id, grade);
    let text = 'Disponible bajo pedido';
    let tone = 'text-slate-600 bg-slate-100';
    if (stock === 0) {
      text = 'Agotado en este grado';
      tone = 'text-[#BE123C] bg-rose-100';
    } else if (stock !== null) {
      text = stock === 1 ? 'Última unidad en bóveda' : `${stock} unidades en bóveda`;
      tone = stock <= 2 ? 'text-[#92400E] bg-[#FEF3C7]' : 'text-[#047857] bg-[#D1FAE5]';
    }
    return `<span id="pdp-stock-badge" aria-live="polite" class="text-xs font-bold px-2.5 py-1 rounded-md ${tone}">${text}</span>`;
  },

  afterRender() {
    if (document.getElementById('pdp-interactive-chart')) {
      this.drawChart();
      this.bindChartEvents();
    }
    this.bindCard3DController();
  },

  getConditionPrices(product) {
    if (!product) {
      return { raw: 50, psa8: 68, psa9: 105, psa10: 260 };
    }

    // If complete explicit precios dictionary already exists, return it
    if (product.precios && 
        typeof product.precios.raw === 'number' && 
        typeof product.precios.psa8 === 'number' && 
        typeof product.precios.psa9 === 'number' && 
        typeof product.precios.psa10 === 'number') {
      return product.precios;
    }

    // Determine base price deterministically
    let basePrice = 50;
    if (product.precios && typeof product.precios.raw === 'number') {
      basePrice = product.precios.raw;
    } else if (product.precios && typeof product.precios.psa10 === 'number') {
      basePrice = Math.round(product.precios.psa10 / 5.20);
    } else if (typeof product.precioEstimado === 'number' && product.precioEstimado > 0) {
      basePrice = product.precioEstimado;
    } else if (typeof product.precioUnitario === 'number' && product.precioUnitario > 0) {
      basePrice = product.precioUnitario;
    }

    return {
      raw: (product.precios && typeof product.precios.raw === 'number') 
        ? product.precios.raw 
        : Math.round(basePrice),
      psa8: (product.precios && typeof product.precios.psa8 === 'number') 
        ? product.precios.psa8 
        : Math.round(basePrice * 1.35),
      psa9: (product.precios && typeof product.precios.psa9 === 'number') 
        ? product.precios.psa9 
        : Math.round(basePrice * 2.10),
      psa10: (product.precios && typeof product.precios.psa10 === 'number') 
        ? product.precios.psa10 
        : Math.round(basePrice * 5.20)
    };
  },

  bindCard3DController() {
    const scene = document.getElementById('pdp-3d-scene');
    const card = document.getElementById('pdp-3d-object');
    if (!scene || !card) return;

    // Defensive check for headless/mock test environments
    if (typeof scene.addEventListener !== 'function') return;

    // Abort previous event listeners to eliminate memory leaks across re-renders
    if (this._card3DAbort) {
      try { this._card3DAbort.abort(); } catch (_) {}
    }
    this._card3DAbort = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const signal = this._card3DAbort ? this._card3DAbort.signal : undefined;

    const mode = (typeof Store !== 'undefined' && Store.data && Store.data.pdpInspectorMode) || 'front';

    // Initialize or synchronize internal rotation state
    if (!this._card3D || this._card3D.mode !== mode) {
      this._card3D = {
        mode,
        rotX: 0,
        rotY: mode === 'back' ? 180 : 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        startRotX: 0,
        startRotY: 0,
        lastX: 0,
        lastTime: 0,
        velocityX: 0
      };
    }

    this.applyCard3DTransform();

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      this._card3D.isDragging = true;
      const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : e;
      this._card3D.startX = pointer.clientX;
      this._card3D.startY = pointer.clientY;
      this._card3D.startRotX = this._card3D.rotX;
      this._card3D.startRotY = this._card3D.rotY;
      this._card3D.lastX = pointer.clientX;
      this._card3D.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      this._card3D.velocityX = 0;

      card.style.transition = 'none';
      scene.classList.add('is-dragging');

      if (scene.setPointerCapture && e.pointerId !== undefined) {
        try { scene.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (e.cancelable && e.type !== 'touchstart') {
        e.preventDefault();
      }
    };

    const onPointerMove = (e) => {
      // Sheen tracking remains active
      this.handleHoloMove(e);

      if (!this._card3D || !this._card3D.isDragging) return;

      const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
      if (typeof pointer.clientX !== 'number' || isNaN(pointer.clientX)) return;

      const deltaX = pointer.clientX - this._card3D.startX;
      const deltaY = pointer.clientY - this._card3D.startY;

      // Continuous horizontal rotation (0.55 deg/px)
      this._card3D.rotY = this._card3D.startRotY + deltaX * 0.55;

      // Clamped vertical tilt (-40 deg to +40 deg, 0.35 deg/px)
      this._card3D.rotX = Math.max(-40, Math.min(40, this._card3D.startRotX - deltaY * 0.35));

      // Calculate instantaneous velocity for release deceleration
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const dt = now - this._card3D.lastTime;
      if (dt > 10) {
        this._card3D.velocityX = (pointer.clientX - this._card3D.lastX) / dt;
        this._card3D.lastX = pointer.clientX;
        this._card3D.lastTime = now;
      }

      this.applyCard3DTransform();
      if (e.cancelable && e.type !== 'touchmove') {
        e.preventDefault();
      }
    };

    const onPointerUp = (e) => {
      if (!this._card3D || !this._card3D.isDragging) return;
      this._card3D.isDragging = false;
      scene.classList.remove('is-dragging');

      if (scene.releasePointerCapture && e && e.pointerId !== undefined) {
        try { scene.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      // Smooth deceleration / momentum flick (sin inercia si el usuario pide menos movimiento)
      const vx = this._card3D.velocityX || 0;
      if (Math.abs(vx) > 0.15 && !this.prefersReducedMotion()) {
        const momentumY = Math.max(-60, Math.min(60, vx * 80));
        this._card3D.rotY += momentumY;
      }

      card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1)';
      this.applyCard3DTransform();
    };

    const listenerOpts = signal ? { signal } : false;
    scene.addEventListener('pointerdown', onPointerDown, listenerOpts);
    scene.addEventListener('pointermove', onPointerMove, listenerOpts);
    scene.addEventListener('pointerup', onPointerUp, listenerOpts);
    scene.addEventListener('pointercancel', onPointerUp, listenerOpts);

    // Fallback mouse/touch listeners for environments without PointerEvent support
    scene.addEventListener('mousedown', onPointerDown, listenerOpts);
    scene.addEventListener('mousemove', onPointerMove, listenerOpts);
    scene.addEventListener('mouseup', onPointerUp, listenerOpts);
    scene.addEventListener('mouseleave', onPointerUp, listenerOpts);

    const touchOpts = signal ? { signal, passive: false } : { passive: false };
    scene.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) onPointerDown(e);
    }, touchOpts);
    scene.addEventListener('touchmove', (e) => {
      if (e.cancelable) e.preventDefault();
      onPointerMove(e);
    }, touchOpts);
    scene.addEventListener('touchend', (e) => {
      onPointerUp(e);
    }, touchOpts);
  },

  prefersReducedMotion() {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Alternativa sin arrastre al visor 3D (WCAG 2.5.7)
  rotateCard3D(deltaX, deltaY) {
    if (!this._card3D) return;
    this._card3D.rotX = Math.max(-40, Math.min(40, this._card3D.rotX + deltaX));
    this._card3D.rotY += deltaY;
    const card = document.getElementById('pdp-3d-object');
    if (card) card.style.transition = this.prefersReducedMotion() ? 'none' : 'transform 0.4s ease';
    this.applyCard3DTransform();
  },

  resetCard3D() {
    if (!this._card3D) return;
    this._card3D.rotX = 0;
    this._card3D.rotY = this._card3D.mode === 'back' ? 180 : 0;
    this.rotateCard3D(0, 0);
  },

  applyCard3DTransform() {
    const card = document.getElementById('pdp-3d-object');
    if (!card || !this._card3D) return;
    const { rotX, rotY } = this._card3D;
    card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  },

  handleHoloMove(e) {
    if (!e) return;
    const scene = document.getElementById('pdp-3d-scene');
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;

    const pointer = (e.touches && e.touches.length > 0) ? e.touches[0] : ((e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0] : e);
    const clientX = pointer.clientX;
    const clientY = pointer.clientY;

    if (typeof clientX !== 'number' || typeof clientY !== 'number' || isNaN(clientX) || isNaN(clientY)) {
      return;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    scene.style.setProperty('--holo-x', `${xPct.toFixed(1)}%`);
    scene.style.setProperty('--holo-y', `${yPct.toFixed(1)}%`);
  },

  setInspectorMode(mode) {
    Store.data.pdpInspectorMode = mode;
    if (this._card3D) {
      this._card3D.mode = mode;
      this._card3D.rotX = 0;
      this._card3D.rotY = mode === 'back' ? 180 : 0;
    }
    app.renderCurrentView();
  },

  selectCondition(condKey) {
    Store.data.pdpSelectedCondition = condKey;
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const prices = this.getConditionPrices(product);
    const price = prices[condKey] || prices.psa10 || 1000;

    // 1. Update displayed price in DOM
    const priceEl = document.getElementById('pdp-price');
    if (priceEl) {
      priceEl.innerText = `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
    }

    // 2. Update certification badge in 3D scene (without touching 3D object/transform)
    const certBadge = document.getElementById('pdp-cert-badge');
    if (certBadge) {
      const certCode = product.certNumber || '48291034';
      certBadge.innerText = `${this.getConditionFullTitle(condKey)} • #${certCode}`;
    }

    const stockBadge = document.getElementById('pdp-stock-badge');
    if (stockBadge) stockBadge.outerHTML = this.renderStockBadge(product, condKey);
    Store.data.pdpQuantity = 1;
    const qtyEl = document.getElementById('pdp-quantity-value');
    if (qtyEl) qtyEl.innerText = '1';

    // 3. Update condition radiogroup button styles
    const radiogroup = document.querySelector('[role="radiogroup"][aria-label="Condición de la carta"]');
    if (radiogroup) {
      const buttons = radiogroup.querySelectorAll('button');
      const keys = ['raw', 'psa8', 'psa9', 'psa10'];
      buttons.forEach((btn, idx) => {
        const key = keys[idx];
        const isActive = key === condKey;
        if (isActive) {
          btn.className = 'p-3 rounded-xl text-left transition bg-[#0F172A] text-white shadow-md border-2 border-[#0F172A]';
        } else {
          btn.className = 'p-3 rounded-xl text-left transition bg-white border border-slate-200 hover:border-slate-400 text-[#0F172A]';
        }
        const headerDiv = btn.querySelector('div:first-child');
        if (headerDiv) {
          headerDiv.className = `text-xs font-bold flex items-center justify-between ${isActive ? 'text-white' : 'text-[#0F172A]'}`;
          
          // Requirement R1: Remove all check icons (both initial <i> and Lucide-rendered <svg>)
          const existingIcons = headerDiv.querySelectorAll ? headerDiv.querySelectorAll('i, svg, [data-lucide="check"]') : [];
          if (existingIcons.length > 0) {
            existingIcons.forEach(icon => {
              if (typeof icon.remove === 'function') icon.remove();
            });
          }
          // Direct fallback removals for single-query mocks
          const iIcon = headerDiv.querySelector ? headerDiv.querySelector('i') : null;
          if (iIcon && typeof iIcon.remove === 'function') iIcon.remove();
          const svgIcon = headerDiv.querySelector ? headerDiv.querySelector('svg') : null;
          if (svgIcon && typeof svgIcon.remove === 'function') svgIcon.remove();

          // Array-based children cleanup for test mock environments
          if (Array.isArray(headerDiv.children)) {
            headerDiv.children = headerDiv.children.filter(c => c && c.tagName !== 'I' && c.tagName !== 'SVG');
          }

          // If active, insert exactly one check icon and initialize with Lucide
          if (isActive) {
            headerDiv.insertAdjacentHTML('beforeend', '<i data-lucide="check" class="w-3.5 h-3.5 text-[#047857]"></i>');
            app.refreshIcons();
          }
        }
        const priceDiv = btn.querySelector('div:last-child');
        if (priceDiv) {
          priceDiv.className = `text-sm font-bold mt-0.5 ${isActive ? 'text-[#FEF3C7]' : 'text-slate-600'}`;
        }
      });
    }

    // 4. Update market chart & trend badge (if chart is rendered)
    if (document.getElementById('pdp-interactive-chart') && typeof this.drawChart === 'function') {
      this.drawChart();
    }

    // 5. User feedback toast
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast(`Grado seleccionado: ${(condKey || 'RAW').toUpperCase()} ($${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2 })})`, 'info');
    }
  },

  updateQuantity(delta) {
    const rawDelta = typeof delta === 'number' ? delta : parseInt(delta, 10);
    if (isNaN(rawDelta)) return;

    const current = parseInt(Store.data.pdpQuantity, 10) || 1;
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const isSealed = product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed';
    const stock = Store.getStock(product.id, isSealed ? 'sealed' : (Store.data.pdpSelectedCondition || 'psa10'));
    const max = stock === null ? 10 : Math.max(1, Math.min(10, stock));
    if (rawDelta > 0 && current >= max && stock !== null) {
      app.showToast(`Solo hay ${stock} unidades disponibles en este grado.`, 'info');
    }
    const next = Math.max(1, Math.min(max, current + rawDelta));

    Store.data.pdpQuantity = next;
    if (typeof document !== 'undefined') {
      const el = document.getElementById('pdp-quantity-value');
      if (el) el.innerText = String(next);
    }
    return next;
  },

  setSealedAngle(angle) {
    Store.data.pdpSealedAngle = angle;
    app.renderCurrentView();
  },

  addToCart() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const isSealed = product.tipo_discriminador === 'PRODUCTO_SELLADO' || product.categoria === 'sealed' || product.tipo_item === 'PRODUCTO_SELLADO';
    const condition = isSealed ? 'sealed' : (Store.data.pdpSelectedCondition || 'psa10');
    const qty = Store.data.pdpQuantity || 1;

    let price;
    let label;
    let image = product.imagenLocal || 'assets/img/cards/card-back.png';

    if (isSealed) {
      price = product.precioUnitario || (product.precios && product.precios.sealed) || (product.precios && product.precios.raw) || 3500;
      label = 'Sellado de Fábrica (Caja Intacta)';
      if (product.galeria_sellada && product.galeria_sellada.frontal) {
        image = product.galeria_sellada.frontal;
      }
    } else {
      const prices = this.getConditionPrices(product);
      price = prices[condition] || prices.psa10 || 1000;
      label = this.getConditionFullTitle(condition);
    }

    app.addToCart(
      `${product.id}-${condition}`,
      product.nombre,
      label,
      price,
      image,
      product.imagenFallbackUrl || 'assets/img/cards/card-back.png',
      qty
    );

    Store.data.pdpQuantity = 1;
    if (typeof document !== 'undefined') {
      const el = document.getElementById('pdp-quantity-value');
      if (el) el.innerText = '1';
    }
  },

  drawChart() {
    const product = Store.data.currentPdpProduct || PRODUCTS[0];
    const condition = Store.data.pdpSelectedCondition || 'psa10';
    const condPrices = this.getConditionPrices(product);
    const basePrice = condPrices[condition] || condPrices.psa10 || 1000;

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
        ? 'text-xs font-bold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded'
        : 'text-xs font-bold text-[#BE123C] bg-rose-100 px-2 py-0.5 rounded';
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
        <div class="px-2.5 py-1.5 bg-[#0F172A] text-white rounded-lg shadow-xl text-xs border border-slate-700 whitespace-nowrap">
          <div class="text-xs text-slate-300 font-bold">${nearest.pt.month}</div>
          <div class="font-bold text-xs text-white mt-0.5">$${nearest.pt.price.toLocaleString('en-US')} USD</div>
          <div class="text-xs font-bold ${isUp ? 'text-[#34D399]' : 'text-[#FB7185]'} flex items-center gap-1 mt-0.5">
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

if (typeof window !== 'undefined') window.PDPView = PDPView;
if (typeof globalThis !== 'undefined') globalThis.PDPView = PDPView;
