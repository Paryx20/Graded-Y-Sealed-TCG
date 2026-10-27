const TrackingView = {
  render() {
    const orders = Store.data.orders || [];
    const order = Store.getOrderById(Store.data.activeTrackingOrderId);

    if (!order) {
      return `
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div class="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <i data-lucide="package-search" class="w-16 h-16 mx-auto mb-3 text-slate-300"></i>
            <h1 class="text-xl font-black text-[#0F172A]">No tienes pedidos activos en curso</h1>
            <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Cuando realices una compra en la tienda, podrás consultar aquí en tiempo real la línea de tiempo de custodia y despacho.
            </p>
            <a href="#catalog" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl shadow-sm transition">
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
              <span>Explorar Catálogo</span>
            </a>
          </div>
        </div>
      `;
    }

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
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-black text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded">ORDEN ${order.orderId}</span>
                <span class="text-xs font-extrabold text-[#059669] bg-[#D1FAE5] px-2.5 py-0.5 rounded">${order.status || 'En Preparación / En Custodia'}</span>
              </div>
              <h1 class="text-2xl font-black text-[#0F172A] tracking-tight mt-2">Seguimiento y Estado de Custodia</h1>
              <p class="text-xs text-slate-500 mt-0.5">
                Fecha: ${order.date} • Titular: ${order.buyerName} • Entrega: ${order.deliveryMethod}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                type="button" 
                onclick="app.showToast('Descargando factura electrónica SRI (${order.orderId})...', 'success')" 
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

          <div class="py-8" role="region" aria-label="Línea de tiempo de entrega del pedido">
            <h2 class="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-6">Etapas de Custodia y Despacho</h2>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              <div class="flex sm:flex-col items-center sm:text-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-sm shadow">
                  <i data-lucide="check" class="w-5 h-5"></i>
                </div>
                <div>
                  <span class="text-xs font-extrabold text-[#0F172A] block">1. Orden Recibida</span>
                  <span class="text-[11px] text-[#059669] font-semibold">Autenticidad Validada</span>
                </div>
              </div>

              <div class="flex sm:flex-col items-center sm:text-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center font-bold text-sm shadow ring-4 ring-slate-200">
                  <i data-lucide="package" class="w-5 h-5"></i>
                </div>
                <div>
                  <span class="text-xs font-extrabold text-[#0F172A] block">2. En Preparación</span>
                  <span class="text-[11px] text-[#D97706] font-bold">Sellado UV en Bóveda</span>
                </div>
              </div>

              <div class="flex sm:flex-col items-center sm:text-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <span class="text-xs font-bold text-slate-400 block">3. En Camino / Listo</span>
                  <span class="text-[11px] text-slate-400">Transporte Blindado</span>
                </div>
              </div>

              <div class="flex sm:flex-col items-center sm:text-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <span class="text-xs font-bold text-slate-400 block">4. Entregado</span>
                  <span class="text-[11px] text-slate-400">Recepción Confirmada</span>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">Piezas Incluidas en esta Orden</h2>
              <span class="text-sm font-black text-[#0F172A]">Total (IVA 15% incl.): $${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
            </div>

            <div class="space-y-3">
              ${(order.items || []).map(item => `
                <div class="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                  <div class="flex items-center gap-3">
                    <img 
                      src="${item.imageLocal}" 
                      alt="${item.name}" 
                      class="w-12 h-16 object-contain bg-white rounded-lg border border-slate-200 p-0.5" 
                      onerror="this.onerror=null; this.src='${item.imageFallback}'"
                    />
                    <div>
                      <h3 class="text-sm font-extrabold text-[#0F172A]">${item.name}</h3>
                      <span class="text-xs text-slate-500">${item.condition} • Cantidad: ${item.quantity}</span>
                    </div>
                  </div>
                  <span class="text-sm font-black text-[#0F172A]">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

