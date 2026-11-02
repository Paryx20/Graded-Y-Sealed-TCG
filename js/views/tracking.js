/**
 * ==============================================================================
 * TrackingView - Live Order Tracking & Vault Custody Simulation (Requirement R5)
 * File: js/views/tracking.js
 * 
 * Features:
 *   - Preloaded active simulated order (#GS-2026-9481) on initial view load
 *   - Zero manual simulation controls (fully automated, realistic live timeline)
 *   - Dynamic timeline step renderer with active custody milestone & pulsating glow
 *   - Real checkout purchase order integration with tracking code and courier metadata
 * ==============================================================================
 */

const TrackingView = {
  getSimulatedOrder() {
    if (typeof Store !== 'undefined' && typeof Store.getPreloadedSimulatedOrder === 'function') {
      return Store.getPreloadedSimulatedOrder();
    }
    return {
      orderId: '#GS-2026-9481',
      numero_orden: '#GS-2026-9481',
      date: '02 Nov 2026, 09:15',
      buyerName: 'Patricio Mora (Coleccionista Verificado)',
      buyerEmail: 'coleccionista.paryx@bovedatcg.ec',
      deliveryMethod: 'Courier Nacional Blindado Especializado',
      trackingNumber: 'GUI-EC-948102-PSA',
      courierName: 'Servientrega Blindado • Bóveda G&S',
      estimatedDelivery: '04 Nov 2026 (Entrega Garantizada en Mano)',
      status: 'En Custodia • Autenticación PSA Bóveda',
      currentStageIndex: 1,
      subtotal: 18500.00,
      tax: 2775.00,
      shipping: 5.00,
      total: 21280.00,
      paymentMethod: 'Tarjeta de Crédito (3D Secure Verificado)',
      stages: [
        {
          title: '1. Orden Recibida',
          subtitle: 'Pago Verificado TLS 256-bit',
          date: '02 Nov 2026, 08:30',
          status: 'completed',
          detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
        },
        {
          title: '2. Autenticación PSA',
          subtitle: 'Sellado UV & Inspección Óptica',
          date: '02 Nov 2026, 09:15',
          status: 'active',
          detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
        },
        {
          title: '3. Despacho Blindado',
          subtitle: 'Asignado a Transporte Especial',
          date: '03 Nov 2026, 10:00 (Est.)',
          status: 'pending',
          detail: 'Embalaje con precinto tamper-evident en valija de seguridad.'
        },
        {
          title: '4. En Reparto / Entrega',
          subtitle: 'Custodia contra Cédula y Firma',
          date: '04 Nov 2026, 14:00 (Est.)',
          status: 'pending',
          detail: 'Recepción formal por el titular con documento de identidad.'
        }
      ],
      items: [
        {
          id: 'charizard-base-psa10',
          name: 'Charizard Base Set 1999 #4/102',
          condition: 'PSA 10 GEM MT',
          price: 18500.00,
          quantity: 1,
          imageLocal: 'img/cards/card-back.png',
          imageFallback: 'https://images.pokemontcg.io/base1/4_hires.png'
        }
      ]
    };
  },

  _simulationTimer: null,

  clearSimulationTimer() {
    if (this._simulationTimer) {
      clearTimeout(this._simulationTimer);
      this._simulationTimer = null;
    }
  },

  afterRender() {
    this.clearSimulationTimer();
    this.initSimulationTimer();
  },

  initSimulationTimer() {
    let order = (typeof Store !== 'undefined' && Store.getOrderById)
      ? Store.getOrderById(Store.data.activeTrackingOrderId)
      : null;

    if (!order) {
      order = this.getSimulatedOrder();
    }

    if (!order || !Array.isArray(order.stages) || order.stages.length < 3) {
      return;
    }

    const stage2 = order.stages[1];
    if (stage2 && stage2.status === 'active') {
      this._simulationTimer = setTimeout(() => {
        stage2.status = 'completed';
        if (!stage2.date || stage2.date.includes('Est')) {
          stage2.date = 'Completado hace unos momentos';
        }

        if (order.stages[2]) {
          order.stages[2].status = 'active';
          order.currentStageIndex = 2;
        }

        const isPickup = order.metodo_entrega === 'pickup' || 
                         (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
        order.status = isPickup 
          ? 'Listo para Retiro en Bóveda' 
          : 'En Camino / Despacho Blindado';

        if (typeof Store !== 'undefined' && typeof Store.saveOrders === 'function') {
          Store.saveOrders();
        }

        this.updateStagesDOM(order);
      }, 2000);
    }
  },

  updateStagesDOM(order) {
    const statusBadge = document.getElementById('tracking-status-badge');
    if (statusBadge) {
      statusBadge.innerText = order.status;
    }

    const timelineContainer = document.getElementById('tracking-timeline-container');
    if (timelineContainer) {
      timelineContainer.innerHTML = this.renderTimelineStages(order.stages);
    }

    const transitSection = document.getElementById('tracking-transit-section');
    if (transitSection) {
      const isPickup = order.metodo_entrega === 'pickup' || 
                       (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
      transitSection.innerHTML = isPickup 
        ? this.renderPickupCard(order) 
        : this.renderArmoredTransitCard(order);
    }

    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }

    if (typeof app !== 'undefined' && typeof app.showToast === 'function') {
      const isPickup = order.metodo_entrega === 'pickup' || 
                       (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));
      app.showToast(
        isPickup 
          ? '¡Hito completado! Tu orden está lista para retiro en Bóveda Central Quito.' 
          : '¡Hito completado! Tu orden ha sido despachada en transporte blindado.',
        'success'
      );
    }
  },

  renderPickupCard(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-xs">
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <i data-lucide="shield-check" class="w-6 h-6"></i>
          </div>
          <div class="flex-1 space-y-2">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Retiro Seguro en Bóveda Central Quito
              </span>
              <h3 class="text-base font-black text-[#0F172A] mt-1">Listo para retiro presencial en Bóveda</h3>
              <p class="text-xs text-slate-600 mt-0.5">
                Tu pieza certificada se encuentra resguardada en caja fuerte climatizada y lista para entrega en sala privada.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div class="p-3 bg-white border border-emerald-100 rounded-xl">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Dirección de Retiro:</span>
                <strong class="text-[#0F172A] block mt-0.5">Av. República del Salvador N34-183 y Moscú</strong>
                <span class="text-slate-500 text-[11px] block">Edificio Bóveda Central, Piso 2, Quito</span>
              </div>

              <div class="p-3 bg-white border border-emerald-100 rounded-xl">
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Horario de Atención:</span>
                <strong class="text-[#0F172A] block mt-0.5">Lunes a Sábado: 09:00 - 18:00</strong>
                <span class="text-slate-500 text-[11px] block">Entrega inmediata en ventanilla de seguridad</span>
              </div>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 text-amber-700 flex-shrink-0"></i>
              <span><strong>Requisito Obligatorio:</strong> Presentar Cédula de Identidad original del titular registrado (<strong>${order.buyerName || 'Coleccionista'}</strong>) o código QR de orden.</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderArmoredTransitCard(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-[#0F172A] text-white rounded-2xl shadow-md border border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <i data-lucide="truck" class="w-5 h-5 animate-pulse"></i>
            </div>
            <div>
              <h3 class="text-sm font-black text-[#FEF3C7]">Transporte Blindado Especializado en Tránsito</h3>
              <span class="text-[11px] text-slate-400">${order.courierName || 'Servientrega Blindado • Bóveda G&S'}</span>
            </div>
          </div>
          <span class="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg self-start sm:self-center">
            GPS Activo • Valija Nivel IV
          </span>
        </div>

        <div class="pt-4 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Bóveda Central Quito</span>
            <span class="font-mono text-amber-400 font-bold">En Ruta de Entrega</span>
            <span>${order.buyerName || 'Destinatario'}</span>
          </div>
          <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
            <div class="bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-400 h-full w-2/3 rounded-full relative">
              <div class="absolute right-0 top-0 bottom-0 w-2 bg-white animate-ping"></div>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 pt-1">
            Entrega blindada con protocolo de seguridad personal y verificación contra documento de identidad.
          </p>
        </div>
      </div>
    `;
  },

  renderTimelineStages(stages) {
    return (stages || []).map((stg, idx) => {
      const isCompleted = stg.status === 'completed';
      const isActive = stg.status === 'active';
      let iconClass = 'bg-slate-200 text-slate-500';
      let iconContent = String(idx + 1);

      if (isCompleted) {
        iconClass = 'bg-[#059669] text-white shadow';
        iconContent = '<i data-lucide="check" class="w-5 h-5"></i>';
      } else if (isActive) {
        iconClass = 'bg-[#0F172A] text-[#FEF3C7] shadow ring-4 ring-slate-200';
        iconContent = '<i data-lucide="package" class="w-5 h-5 animate-pulse"></i>';
      }

      return `
        <div class="flex sm:flex-col items-center sm:text-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-amber-50/60 border border-amber-200/80 shadow-xs ring-1 ring-amber-300/50' : 'bg-slate-50/40 border border-slate-100'}">
          <div class="w-10 h-10 rounded-full ${iconClass} flex items-center justify-center font-bold text-sm flex-shrink-0">
            ${iconContent}
          </div>
          <div>
            <span class="text-xs font-extrabold text-[#0F172A] block">${stg.title}</span>
            <span class="text-[11px] ${isActive ? 'text-[#D97706] font-bold' : (isCompleted ? 'text-[#059669] font-semibold' : 'text-slate-400')} block">
              ${stg.subtitle}
            </span>
            ${stg.date ? `<span class="text-[10px] text-slate-400 block mt-0.5">${stg.date}</span>` : ''}
            ${stg.detail ? `<p class="text-[10px] text-slate-500 mt-1 line-clamp-2 hidden sm:block">${stg.detail}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  getDefaultStages(order) {
    const orderDate = order?.date || '02 Nov 2026';
    const status = (order?.status || order?.estado || '').toUpperCase();
    
    const isDelivered = status.includes('ENTREGADO') || status.includes('RETIRADO');
    const isInTransit = isDelivered || status.includes('TRANSITO') || status.includes('CAMINO') || status.includes('DESPACHADO') || status.includes('LISTO');
    const isPickup = order?.metodo_entrega === 'pickup' || 
                     (order?.deliveryMethod && /retiro/i.test(order.deliveryMethod));

    if (isPickup) {
      return [
        {
          title: '1. Orden Recibida',
          subtitle: 'Pago Verificado TLS 256-bit',
          date: orderDate,
          status: 'completed',
          detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
        },
        {
          title: '2. En Preparación',
          subtitle: 'Sellado UV en Bóveda',
          date: orderDate,
          status: isInTransit ? 'completed' : 'active',
          detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
        },
        {
          title: '3. Listo para Retiro en Bóveda',
          subtitle: 'Bóveda Central Quito • Sala Privada',
          date: isInTransit ? 'Disponible Ahora' : 'Programado (24h)',
          status: isDelivered ? 'completed' : (isInTransit ? 'active' : 'pending'),
          detail: 'Disponible para entrega en ventanilla de seguridad. Presentar cédula original.'
        },
        {
          title: '4. Retirado en Bóveda',
          subtitle: 'Custodia Transferida contra Cédula',
          date: isDelivered ? 'Retiro completado' : 'Pendiente de retiro',
          status: isDelivered ? 'completed' : 'pending',
          detail: 'Recepción formal por el titular con documento de identidad original.'
        }
      ];
    }

    return [
      {
        title: '1. Orden Recibida',
        subtitle: 'Pago Verificado TLS 256-bit',
        date: orderDate,
        status: 'completed',
        detail: 'Fondos verificados y orden registrada en la cadena de custodia.'
      },
      {
        title: '2. En Preparación',
        subtitle: 'Sellado UV en Bóveda',
        date: orderDate,
        status: isInTransit ? 'completed' : 'active',
        detail: 'Validación de microimpresión, hologramas y encapsulado acrílico.'
      },
      {
        title: '3. En Camino / Despacho',
        subtitle: 'Transporte Blindado',
        date: isInTransit ? (isDelivered ? 'Completado' : 'En tránsito') : 'Programado (24-48h)',
        status: isDelivered ? 'completed' : (isInTransit ? 'active' : 'pending'),
        detail: 'Embalaje con precinto tamper-evident en valija de seguridad.'
      },
      {
        title: '4. Entregado',
        subtitle: 'Custodia contra Documento',
        date: isDelivered ? 'Recepción confirmada' : 'Pendiente de entrega',
        status: isDelivered ? 'completed' : 'pending',
        detail: 'Recepción formal por el titular con documento de identidad.'
      }
    ];
  },

  render() {
    const orders = (typeof Store !== 'undefined' && Store.data && Store.data.orders) ? Store.data.orders : [];
    let order = (typeof Store !== 'undefined' && Store.getOrderById)
      ? Store.getOrderById(Store.data.activeTrackingOrderId)
      : null;

    if (!order) {
      order = this.getSimulatedOrder();
    }

    const stages = (Array.isArray(order.stages) && order.stages.length > 0)
      ? order.stages
      : this.getDefaultStages(order);

    const isPickup = order.metodo_entrega === 'pickup' || 
                     (order.deliveryMethod && /retiro/i.test(order.deliveryMethod));

    const trackingNumber = order.trackingNumber || (isPickup ? 'RET-UIO-948102' : 'GUI-EC-948102-PSA');
    const courierName = order.courierName || (isPickup ? 'Retiro Presencial en Bóveda Central Quito' : 'Servientrega Blindado • Bóveda G&S');
    const estimatedDelivery = order.estimatedDelivery || (isPickup ? 'Listo para retiro inmediato en Bóveda' : '04 Nov 2026 (Entrega Garantizada en Mano)');

    return `
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        ${orders.length > 1 ? `
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs font-extrabold text-[#0F172A]">Seleccionar orden del historial (${orders.length}):</span>
            <div class="flex flex-wrap gap-2">
              ${orders.map(o => `
                <button 
                  type="button" 
                  onclick="app.openOrderTracking('${o.orderId}')" 
                  class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${o.orderId === order.orderId ? 'bg-[#0F172A] text-[#FEF3C7]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}"
                >
                  ${o.orderId}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <!-- Order Header Bar -->
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-mono font-black text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded">ORDEN ${order.orderId || order.numero_orden}</span>
                <span id="tracking-status-badge" class="text-xs font-extrabold text-[#059669] bg-[#D1FAE5] px-2.5 py-0.5 rounded">${order.status || (isPickup ? 'Listo para Retiro en Bóveda' : 'En Preparación / En Custodia')}</span>
                <span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <i data-lucide="${isPickup ? 'shield-check' : 'truck'}" class="w-3.5 h-3.5 ${isPickup ? 'text-[#059669]' : 'text-slate-500'}"></i>
                  <span>${isPickup ? 'Código de Retiro: ' + trackingNumber : 'Guía: ' + trackingNumber}</span>
                </span>
              </div>
              <h1 class="text-2xl font-black text-[#0F172A] tracking-tight mt-2">Seguimiento y Estado de Custodia</h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Fecha: ${order.date || '02 Nov 2026'} • Titular: ${order.buyerName || 'Coleccionista'} • Entrega: ${order.deliveryMethod || (isPickup ? 'Retiro en Bóveda Quito' : 'Courier Nacional Blindado')}
              </p>
              <p class="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1.5">
                <i data-lucide="${isPickup ? 'map-pin' : 'shield-check'}" class="w-3.5 h-3.5 ${isPickup ? 'text-[#E11D48]' : 'text-[#059669]'}"></i>
                <span>${isPickup 
                  ? 'Punto de Retiro: <strong>Bóveda Central Quito</strong> • Horario: <strong>Lun-Sáb 09:00 - 18:00</strong>' 
                  : 'Courier: <strong>' + courierName + '</strong> • Estimada: <strong>' + estimatedDelivery + '</strong>'}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onclick="app.showToast('Descargando factura electrónica SRI (${order.orderId || order.numero_orden})...', 'success')" 
                class="px-3.5 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-[#0F172A] rounded-xl transition flex items-center gap-1.5 touch-target"
              >
                <i data-lucide="file-text" class="w-4 h-4"></i>
                <span>Descargar Factura</span>
              </button>

              <a 
                href="#profile" 
                onclick="Store.data.profileActiveTab='orders'"
                class="px-3.5 py-2 text-xs font-bold bg-[#0F172A] text-white hover:bg-[#1E293B] rounded-xl transition flex items-center gap-1.5 touch-target"
              >
                <i data-lucide="history" class="w-4 h-4"></i>
                <span>Ver Historial Completo</span>
              </a>
            </div>
          </div>

          <!-- Dynamic Timeline Steps (Automated Live Simulation) -->
          <div class="py-8" role="region" aria-label="Línea de tiempo de entrega del pedido">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <i data-lucide="route" class="w-4 h-4 text-[#059669]"></i>
                <span>Etapas de Custodia y Despacho en Vivo</span>
              </h2>
              <span class="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Monitoreo Bóveda G&amp;S 24/7
              </span>
            </div>

            <div id="tracking-timeline-container" class="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              ${this.renderTimelineStages(stages)}
            </div>

            <div id="tracking-transit-section">
              ${isPickup ? this.renderPickupCard(order) : this.renderArmoredTransitCard(order)}
            </div>
          </div>

          <!-- Pieces in Order -->
          <div class="border-t border-slate-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Piezas Incluidas en esta Orden</h2>
              <span class="text-sm font-black text-[#0F172A]">Total (IVA 15% incl.): $${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>

            <div class="space-y-3">
              ${(order.items || []).map(item => `
                <div class="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div class="flex items-center gap-3">
                    <img 
                      src="${item.imageLocal || item.imagen || item.imagenLocal || 'img/cards/card-back.png'}" 
                      alt="${item.name || item.nombre || 'Pokémon Card'}" 
                      class="w-12 h-16 object-contain bg-white rounded-lg border border-slate-200 p-0.5" 
                      onerror="this.onerror=null; this.src='${item.imageFallback || item.imagenFallbackUrl || 'img/cards/card-back.png'}'"
                    />
                    <div>
                      <h3 class="text-sm font-extrabold text-[#0F172A]">${item.name || item.nombre}</h3>
                      <span class="text-xs text-slate-500">${item.condition || item.grado || 'PSA 10'} • Cantidad: ${item.quantity || 1}</span>
                    </div>
                  </div>
                  <span class="text-sm font-black text-[#0F172A]">$${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.TrackingView = TrackingView;
}
if (typeof globalThis !== 'undefined') {
  globalThis.TrackingView = TrackingView;
}
