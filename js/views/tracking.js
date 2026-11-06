/**
 * ==============================================================================
 * TrackingView - Mis pedidos y seguimiento de cada orden
 * File: js/views/tracking.js
 *
 * - Con sesión: lista de pedidos del usuario; al elegir uno se abre su detalle (?order=).
 * - Sin sesión: se busca un pedido con número de orden (o guía) + la cédula de la compra.
 * - El avance es simulado y depende del tiempo transcurrido desde la compra
 *   (MILESTONES_MIN), así que sigue avanzando aunque se cierre la página.
 * - Un pedido "En preparación" se puede cancelar: el stock vuelve al inventario.
 * ==============================================================================
 */

const TrackingView = {
  // Paso: 0 cancelado · 1 en preparación · 2 en camino / listo para retiro · 3 en reparto · 4 entregado / retirado
  // Minutos desde la compra en que empieza cada paso (simulación para la demostración)
  MILESTONES_MIN: { 2: 2, 3: 5, 4: 10 },
  REFRESH_MS: 15000,

  current: null,       // orden que se está mostrando
  verifiedId: null,    // cédula con la que se abrió (para guardar el estado en Supabase)
  lookupError: '',
  confirmingCancel: false,
  _timer: null,

  clearSimulationTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },

  isPickup(order) {
    return order.metodo_entrega === 'pickup' || /retiro/i.test(order.deliveryMethod || '');
  },

  isCash(order) {
    return /efectivo/i.test(order.paymentMethod || '');
  },

  isCancelled(order) {
    return order.trackingStep === 0 || /cancelad/i.test(order.status || '');
  },

  maskId(id) {
    const v = String(id || '');
    return v.length > 4 ? '•'.repeat(v.length - 4) + v.slice(-4) : v;
  },

  timeLabel(date) {
    return date.toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },

  createdAt(order) {
    const t = Date.parse(order.fecha_creacion || '');
    return Number.isFinite(t) ? t : null;
  },

  // Paso según el tiempo transcurrido; nunca retrocede respecto al paso guardado
  getStep(order) {
    if (this.isCancelled(order)) return 0;
    const stored = typeof order.trackingStep === 'number' && order.trackingStep > 0 ? order.trackingStep : 1;
    const start = this.createdAt(order);
    if (start === null) return stored;
    const minutes = (Date.now() - start) / 60000;
    let step = 1;
    [2, 3, 4].forEach(s => { if (minutes >= this.MILESTONES_MIN[s]) step = s; });
    return Math.max(step, Math.min(stored, 4));
  },

  // Fecha real o estimada de cada paso
  stepTime(order, step) {
    const start = this.createdAt(order);
    if (start === null) return null;
    const offset = step <= 1 ? 0 : this.MILESTONES_MIN[step];
    return new Date(start + offset * 60000);
  },

  stageTemplates(order) {
    const cash = this.isCash(order);
    const received = {
      title: 'Pedido recibido',
      subtitle: cash ? 'Pago pendiente: pagas al retirar' : 'Pago con tarjeta aprobado',
      detail: cash ? 'Reservamos tus productos. El pago se hace en efectivo en la tienda.' : 'Registramos tu pedido y tu pago.'
    };
    if (this.isPickup(order)) {
      return [
        { ...received, step: 1 },
        { title: 'En preparación', subtitle: 'Revisión y empaque', detail: 'Revisamos tus productos y los protegemos.', step: 1 },
        { title: 'Listo para retiro', subtitle: 'Tienda en Quito', detail: 'Ya puedes pasar a retirarlo en el horario de atención.', step: 2 },
        { title: cash ? 'Retirado y pagado' : 'Retirado', subtitle: 'En la tienda', detail: 'Entregamos tu pedido en la tienda.', step: 4 }
      ];
    }
    return [
      { ...received, step: 1 },
      { title: 'En preparación', subtitle: 'Revisión y empaque', detail: 'Revisamos tus productos y los protegemos.', step: 1 },
      { title: 'En camino', subtitle: order.courierName || 'Courier', detail: 'Salió de la tienda con número de guía.', step: 2 },
      { title: 'En reparto', subtitle: 'Llega hoy', detail: 'El repartidor va hacia tu dirección.', step: 3 },
      { title: 'Entregado', subtitle: 'En tu dirección', detail: 'Tu pedido fue entregado.', step: 4 }
    ];
  },

  buildStages(order) {
    const step = this.getStep(order);
    const tpl = this.stageTemplates(order);
    // Índice de la etapa activa según el paso
    const activeIdx = step === 4 ? tpl.length : tpl.reduce((idx, s, i) => (s.step <= step && i > 0 ? i : idx), 1);
    return tpl.map((s, idx) => {
      let status = 'pending';
      if (step === 0) status = idx === 0 ? 'completed' : 'cancelled';
      else if (idx === 0 || idx < activeIdx) status = 'completed';
      else if (idx === activeIdx) status = 'active';

      const time = this.stepTime(order, s.step);
      let date = '';
      if (step === 0) date = idx === 0 ? (order.date || '') : '';
      else if (idx === 0) date = order.date || (time ? this.timeLabel(time) : '');
      else if (time) date = status === 'pending' ? `Estimado: ${this.timeLabel(time)}` : this.timeLabel(time);
      else if (status === 'pending') date = 'Pendiente';
      return { ...s, status, date, title: `${idx + 1}. ${s.title}` };
    });
  },

  statusLabel(order) {
    const step = this.getStep(order);
    const pickup = this.isPickup(order);
    if (step === 0) return 'Cancelado';
    if (step === 4) return pickup ? 'Retirado en tienda' : 'Entregado';
    if (step === 3) return pickup ? 'Listo para retiro' : 'En reparto';
    if (step === 2) return pickup ? 'Listo para retiro' : 'En camino';
    return 'En preparación';
  },

  // Porcentaje del recorrido completo (0 a 100)
  progressPercent(order) {
    const step = this.getStep(order);
    if (step === 0) return 0;
    if (step === 4) return 100;
    const start = this.createdAt(order);
    if (start === null) return { 1: 10, 2: 45, 3: 75 }[step] || 10;
    const total = this.MILESTONES_MIN[4] * 60000;
    return Math.max(5, Math.min(99, Math.round(((Date.now() - start) / total) * 100)));
  },

  // Guarda el paso calculado si cambió (local y en Supabase)
  syncStep(order) {
    const step = this.getStep(order);
    if (order.trackingStep === step && order.status === this.statusLabel(order)) return false;
    order.trackingStep = step;
    order.status = this.statusLabel(order);
    order.stages = this.buildStages(order);
    this.persist(order);
    return true;
  },

  persist(order) {
    Store.saveOrders();
    const id = this.verifiedId || order.buyerId || order.usuario_cedula;
    if (id && typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isOnline()) {
      SupabaseAPI.updateOrderStatus(order, id).catch(err => {
        console.warn('[TrackingView] No se pudo guardar el estado en Supabase:', err.message);
      });
    }
  },

  // -------------------------------------------------------------- Búsqueda

  async lookup() {
    const codeEl = document.getElementById('track-code');
    const idEl = document.getElementById('track-id');
    const code = (codeEl ? codeEl.value : '').trim().replace(/^#/, '').toUpperCase();
    const idCard = (idEl ? idEl.value : '').trim();

    if (!code) {
      Validators.showError(codeEl, 'Ingresa el número de orden o de guía.');
      codeEl.focus();
      return;
    }
    Validators.showError(codeEl, '');
    if (!Validators.validateAll({ 'track-id': v => Validators.idCard(v) })) return;

    const matchesCode = o => [o.orderId, o.numero_orden, o.trackingNumber]
      .filter(Boolean)
      .some(c => String(c).replace(/^#/, '').toUpperCase() === code);

    const btn = document.getElementById('track-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }

    let order = (Store.data.orders || []).find(matchesCode);
    let error = '';
    if (order) {
      if ((order.buyerId || order.usuario_cedula) !== idCard) {
        error = 'La cédula no coincide con la de la compra. Por seguridad no podemos mostrar este pedido.';
        order = null;
      }
    } else {
      try {
        order = await SupabaseAPI.trackOrder(code, idCard);
        if (!order) error = 'No encontramos un pedido con ese número y esa cédula.';
      } catch (err) {
        error = err.message;
      }
    }

    this.lookupError = error;
    if (order) {
      this.current = order;
      this.verifiedId = idCard;
    }
    app.renderCurrentView();
  },

  // Vuelve a la lista de pedidos (o al buscador si no hay sesión)
  backToList() {
    this.clearSimulationTimer();
    this.current = null;
    this.verifiedId = null;
    this.lookupError = '';
    this.confirmingCancel = false;
    Store.data.trackingRequestedOrder = null;
    history.replaceState(null, '', app.url('tracking'));
    app.renderCurrentView();
  },

  // Se mantiene por compatibilidad con enlaces anteriores
  resetLookup() {
    this.backToList();
  },

  // Orden pedida en la URL (?order=) que pertenece al usuario con sesión
  resolveOrder() {
    const user = Store.data.currentUser;
    const wanted = Store.data.trackingRequestedOrder;
    if (wanted && user) {
      const own = (Store.data.orders || []).find(o => o.orderId === wanted);
      if (own && (!this.current || this.current.orderId !== own.orderId)) {
        this.current = own;
        this.verifiedId = own.buyerId || user.idCard;
        this.confirmingCancel = false;
      }
    }
    return this.current;
  },

  // ------------------------------------------------------------ Simulación

  afterRender() {
    this.clearSimulationTimer();
    if (this.current) {
      if (this.syncStep(this.current)) this.refreshDetail();
      this.scheduleRefresh();
    }
    if (typeof Validators !== 'undefined') {
      Validators.attach({ 'track-id': v => Validators.idCard(v) });
    }
  },

  scheduleRefresh() {
    const order = this.current;
    if (!order || this.getStep(order) === 0 || this.getStep(order) === 4) return;
    this._timer = setTimeout(() => {
      const before = order.trackingStep;
      if (this.syncStep(order)) {
        app.showToast(`Tu pedido ${order.orderId}: ${this.statusLabel(order)}.`, 'info');
        if (before !== order.trackingStep) this.refreshDetail();
      } else {
        this.updateProgressBar(order);
      }
      this.scheduleRefresh();
    }, this.REFRESH_MS);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  },

  updateProgressBar(order) {
    const bar = document.getElementById('tracking-progress-bar');
    const pct = this.progressPercent(order);
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));
    }
  },

  refreshDetail() {
    const box = document.getElementById('tracking-detail');
    if (!box || !this.current) return;
    box.innerHTML = this.renderDetail(this.current);
    app.refreshIcons();
  },

  // ----------------------------------------------------------- Cancelación

  canCancel(order) {
    return !!Store.data.currentUser && this.getStep(order) === 1;
  },

  askCancel() {
    this.confirmingCancel = true;
    this.refreshDetail();
    const box = document.getElementById('cancel-confirm');
    if (box) box.focus();
  },

  dismissCancel() {
    this.confirmingCancel = false;
    this.refreshDetail();
    const btn = document.getElementById('cancel-order-btn');
    if (btn) btn.focus();
  },

  async confirmCancel() {
    const order = this.current;
    const user = Store.data.currentUser;
    if (!order || !user) return;
    const btn = document.getElementById('cancel-confirm-yes');
    if (btn) { btn.disabled = true; btn.textContent = 'Cancelando...'; }
    try {
      if (user.token && typeof SupabaseAPI !== 'undefined' && SupabaseAPI.isOnline()) {
        await SupabaseAPI.cancelOrder(user.token, order.orderId);
        if (typeof Store.loadCatalogFromServer === 'function') Store.loadCatalogFromServer();
      }
    } catch (err) {
      app.showToast(err.message, 'error');
      this.confirmingCancel = false;
      this.refreshDetail();
      return;
    }
    order.trackingStep = 0;
    order.status = 'Cancelado';
    order.cancelledAt = this.timeLabel(new Date());
    order.stages = this.buildStages(order);
    Store.saveOrders();
    this.confirmingCancel = false;
    this.clearSimulationTimer();
    app.showToast(`Pedido ${order.orderId} cancelado. ${this.isCash(order) ? 'No se realizó ningún cobro.' : 'Te devolvemos el pago a tu tarjeta.'}`, 'success');
    this.refreshDetail();
    const heading = document.getElementById('tracking-detail-title');
    if (heading) heading.focus();
  },

  // ----------------------------------------------------------------- Vistas

  statusBadgeClass(order) {
    const step = this.getStep(order);
    if (step === 0) return 'text-slate-700 bg-slate-200';
    if (step === 4) return 'text-[#047857] bg-[#D1FAE5]';
    return 'text-[#B45309] bg-[#FEF3C7]';
  },

  renderLookupForm(compact) {
    const user = Store.data.currentUser;
    return `
      <section class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm ${compact ? '' : 'max-w-2xl mx-auto'}" aria-labelledby="track-form-title">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-10 h-10 rounded-md bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center flex-shrink-0">
            <i data-lucide="package-search" class="w-5 h-5" aria-hidden="true"></i>
          </div>
          <div>
            ${compact
              ? `<h2 id="track-form-title" class="text-base font-bold text-[#0F172A] tracking-tight">Buscar un pedido por número</h2>`
              : `<h1 id="track-form-title" class="text-xl font-bold text-[#0F172A] tracking-tight">Rastrear un pedido</h1>`}
            <p class="text-xs text-slate-600 mt-0.5">Escribe el número de orden (o de guía) y la cédula con la que hiciste la compra.</p>
          </div>
        </div>

        <form onsubmit="event.preventDefault(); TrackingView.lookup();" class="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start" novalidate>
          <div class="sm:col-span-2">
            <label for="track-code" class="block text-xs font-bold text-[#0F172A] mb-1">Número de orden o guía</label>
            <input id="track-code" type="text" autocomplete="off" placeholder="PKM-2026-15875" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white font-mono uppercase" />
          </div>
          <div class="sm:col-span-2">
            <label for="track-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula de la compra</label>
            <input id="track-id" type="text" value="${(user && user.idCard) || ''}" inputmode="numeric" maxlength="13" autocomplete="off" placeholder="1710034065" oninput="this.value = this.value.replace(/\\D/g, '')" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" />
          </div>
          <div class="sm:pt-5">
            <button id="track-submit" type="submit" class="w-full py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-lg transition touch-target">Buscar</button>
          </div>
        </form>

        ${this.lookupError ? `
          <div class="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2" role="alert">
            <i data-lucide="shield-alert" class="w-4 h-4 text-[#BE123C] flex-shrink-0 mt-0.5" aria-hidden="true"></i>
            <span>${this.lookupError}</span>
          </div>
        ` : ''}

        ${user ? '' : `
          <p class="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
            <i data-lucide="user" class="w-4 h-4 text-slate-500" aria-hidden="true"></i>
            <span>¿Tienes cuenta?</span>
            <a href="pages/login.html" class="font-semibold text-[#BE123C] hover:underline">Inicia sesión para ver todos tus pedidos</a>
          </p>
        `}
      </section>
    `;
  },

  renderOrderList() {
    const orders = Store.data.orders || [];
    orders.forEach(o => this.syncStep(o));
    return `
      <section class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm" aria-labelledby="orders-list-title">
        <div class="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h1 id="orders-list-title" class="text-2xl font-bold text-[#0F172A] tracking-tight">Mis pedidos</h1>
            <p class="text-xs text-slate-600 mt-0.5">${orders.length ? `Tienes ${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}. Elige uno para ver su seguimiento.` : 'Aquí verás tus compras y su estado.'}</p>
          </div>
        </div>

        ${orders.length === 0 ? `
          <div class="py-10 text-center">
            <i data-lucide="package-open" class="w-12 h-12 mx-auto text-slate-300" aria-hidden="true"></i>
            <h2 class="mt-3 text-base font-bold text-[#0F172A]">Todavía no tienes pedidos</h2>
            <p class="text-sm text-slate-600 mt-1">Cuando compres algo aparecerá aquí.</p>
            <a href="pages/catalogo.html" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition touch-target">
              <i data-lucide="compass" class="w-4 h-4" aria-hidden="true"></i>
              <span>Ver el catálogo</span>
            </a>
          </div>
        ` : `
          <ul class="mt-4 space-y-3" id="orders-list">
            ${orders.map(o => {
              const items = o.items || [];
              const first = items[0] || {};
              const count = items.reduce((n, it) => n + (it.quantity || 1), 0);
              return `
                <li>
                  <a href="${app.url('tracking', { order: o.orderId })}"
                     class="order-list-item flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] hover:bg-white hover:border-slate-400 hover:shadow-sm transition"
                     aria-label="Ver el pedido ${o.orderId}, ${this.statusLabel(o)}">
                    <img src="${first.imageLocal || 'assets/img/cards/card-back.png'}" alt="" width="48" height="64" loading="lazy" decoding="async"
                      class="w-12 h-16 object-contain bg-white rounded-md border border-slate-200 p-0.5 flex-shrink-0"
                      onerror="this.onerror=null; this.src='${first.imageFallback || 'assets/img/cards/card-back.png'}'" />
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-mono font-bold text-[#0F172A]">${o.orderId}</span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded ${this.statusBadgeClass(o)}">${this.statusLabel(o)}</span>
                      </div>
                      <p class="text-xs text-slate-600 mt-1 truncate">${first.name || 'Pedido'}${count > 1 ? ` y ${count - 1} producto${count - 1 === 1 ? '' : 's'} más` : ''}</p>
                      <p class="text-xs text-slate-500 mt-0.5">${o.date || ''} · ${this.isPickup(o) ? 'Retiro en tienda' : 'Envío a domicilio'}</p>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <span class="block text-sm font-bold text-[#0F172A]">$${(o.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span class="inline-flex items-center gap-1 text-xs font-semibold text-[#BE123C] mt-1">Ver pedido <i data-lucide="chevron-right" class="w-4 h-4" aria-hidden="true"></i></span>
                    </div>
                  </a>
                </li>
              `;
            }).join('')}
          </ul>
        `}
      </section>
    `;
  },

  renderTimelineStages(stages) {
    return stages.map((stg, idx) => {
      const isCompleted = stg.status === 'completed';
      const isActive = stg.status === 'active';
      const isCancelled = stg.status === 'cancelled';
      let iconClass = 'bg-slate-200 text-slate-600';
      let iconContent = String(idx + 1);

      if (isCompleted) {
        iconClass = 'bg-[#059669] text-white shadow';
        iconContent = '<i data-lucide="check" class="w-5 h-5" aria-hidden="true"></i>';
      } else if (isActive) {
        iconClass = 'bg-[#0F172A] text-[#FEF3C7] shadow ring-4 ring-slate-200';
        iconContent = '<i data-lucide="package" class="w-5 h-5 motion-safe:animate-pulse" aria-hidden="true"></i>';
      } else if (isCancelled) {
        iconClass = 'bg-slate-100 text-slate-500 border border-slate-300';
        iconContent = '<i data-lucide="minus" class="w-5 h-5" aria-hidden="true"></i>';
      }

      const boxClass = isActive
        ? 'bg-amber-50/60 border border-amber-200/80 ring-1 ring-amber-300/50'
        : 'bg-slate-50/40 border border-slate-100';
      const subClass = isActive ? 'text-[#B45309] font-bold' : (isCompleted ? 'text-[#047857] font-semibold' : 'text-slate-500');
      const state = isCompleted ? 'completada' : isActive ? 'en curso' : isCancelled ? 'cancelada' : 'pendiente';

      return `
        <li class="flex sm:flex-col items-center sm:text-center gap-3 p-3 rounded-md transition-all ${boxClass} ${isCancelled ? 'opacity-60' : ''}" ${isActive ? 'aria-current="step"' : ''}>
          <div class="w-10 h-10 rounded-full ${iconClass} flex items-center justify-center font-bold text-sm flex-shrink-0">${iconContent}</div>
          <div>
            <span class="text-xs font-semibold text-[#0F172A] block">${stg.title}<span class="sr-only"> (${state})</span></span>
            <span class="text-xs ${subClass} block">${stg.subtitle}</span>
            ${stg.date ? `<span class="text-xs text-slate-500 block mt-0.5">${stg.date}</span>` : ''}
            <p class="text-xs text-slate-500 mt-1 hidden sm:block">${stg.detail}</p>
          </div>
        </li>
      `;
    }).join('');
  },

  renderProgress(order) {
    const step = this.getStep(order);
    const pickup = this.isPickup(order);
    const pct = this.progressPercent(order);
    const next = step >= 1 && step < 4 ? this.stepTime(order, pickup && step === 2 ? 4 : step + 1) : null;
    return `
      <div class="mt-6 p-5 sm:p-6 bg-[#0F172A] text-white rounded-lg shadow-md border border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <i data-lucide="${pickup ? 'store' : 'truck'}" class="w-5 h-5" aria-hidden="true"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#FEF3C7]">${pickup ? 'Retiro en tienda' : 'Envío'}</h3>
              <span class="text-xs text-slate-300">${pickup ? 'Av. República del Salvador N34-183, Quito' : (order.courierName || 'Servientrega')}</span>
            </div>
          </div>
          ${next ? `<span class="text-xs text-slate-300">Próxima etapa: <strong class="text-amber-300">${this.timeLabel(next)}</strong></span>` : ''}
        </div>
        <div class="pt-4 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-300 gap-2">
            <span>Tienda Graded &amp; Sealed</span>
            <span class="font-semibold text-amber-300">${this.statusLabel(order)}</span>
            <span>${pickup ? 'Tú en la tienda' : (order.buyerName || 'Tu dirección')}</span>
          </div>
          <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden" role="progressbar" aria-label="Avance del pedido" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" id="tracking-progress-bar-track">
            <div id="tracking-progress-bar" class="bg-[#059669] h-full rounded-full motion-safe:transition-all motion-safe:duration-700" style="width: ${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderCancelPanel(order) {
    const step = this.getStep(order);
    if (step === 0) {
      return `
        <div class="mt-6 p-5 bg-slate-50 border border-slate-300 rounded-lg flex items-start gap-3" role="status">
          <i data-lucide="circle-slash" class="w-6 h-6 text-slate-600 flex-shrink-0" aria-hidden="true"></i>
          <div class="text-xs text-slate-700">
            <strong class="block text-sm text-[#0F172A]">Pedido cancelado${order.cancelledAt ? ` el ${order.cancelledAt}` : ''}</strong>
            ${this.isCash(order) ? 'No se realizó ningún cobro.' : 'El valor se devuelve a tu tarjeta en 3 a 5 días hábiles.'} Los productos volvieron a la tienda.
          </div>
        </div>
      `;
    }
    if (!this.canCancel(order)) return '';
    if (this.confirmingCancel) {
      return `
        <div id="cancel-confirm" tabindex="-1" role="alertdialog" aria-labelledby="cancel-confirm-title" aria-describedby="cancel-confirm-text" class="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-lg">
          <h3 id="cancel-confirm-title" class="text-sm font-bold text-[#0F172A]">¿Cancelar el pedido ${order.orderId}?</h3>
          <p id="cancel-confirm-text" class="text-xs text-slate-700 mt-1">Ya no se enviará. ${this.isCash(order) ? 'No tienes que pagar nada.' : 'Te devolvemos el pago a tu tarjeta.'}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" id="cancel-confirm-yes" onclick="TrackingView.confirmCancel()" class="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-md transition touch-target">Sí, cancelar pedido</button>
            <button type="button" onclick="TrackingView.dismissCancel()" class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-xs font-semibold rounded-md transition touch-target">No, mantenerlo</button>
          </div>
        </div>
      `;
    }
    return `
      <div class="mt-6 p-4 bg-[#F8FAFC] border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs text-slate-600">Puedes cancelar este pedido mientras esté en preparación.</p>
        <button type="button" id="cancel-order-btn" onclick="TrackingView.askCancel()" class="px-4 py-2.5 bg-white border border-[#BE123C] text-[#BE123C] hover:bg-rose-50 text-xs font-semibold rounded-md transition flex items-center gap-1.5 touch-target">
          <i data-lucide="x-circle" class="w-4 h-4" aria-hidden="true"></i>
          <span>Cancelar pedido</span>
        </button>
      </div>
    `;
  },

  renderPickupInfo(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-emerald-50/70 border border-emerald-200 rounded-lg">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-white border border-emerald-100 rounded-md">
            <span class="text-slate-600 block text-xs uppercase font-bold">Dirección de retiro</span>
            <strong class="text-[#0F172A] block mt-0.5">Av. República del Salvador N34-183 y Moscú, Quito</strong>
          </div>
          <div class="p-3 bg-white border border-emerald-100 rounded-md">
            <span class="text-slate-600 block text-xs uppercase font-bold">Horario</span>
            <strong class="text-[#0F172A] block mt-0.5">Lunes a sábado: 09:00 - 18:00</strong>
            <span class="text-slate-600 text-xs block">${this.isCash(order) ? `Total a pagar en efectivo: $${(order.total || 0).toFixed(2)}` : 'Pedido ya pagado con tarjeta'}</span>
          </div>
        </div>
        <p class="mt-3 text-xs text-emerald-900 flex items-center gap-1.5">
          <i data-lucide="info" class="w-4 h-4 flex-shrink-0" aria-hidden="true"></i>
          <span>Recuerda indicar tu número de pedido ${order.trackingNumber ? `o el código de retiro <strong class="font-mono">${order.trackingNumber}</strong>` : ''} al llegar.</span>
        </p>
      </div>
    `;
  },

  renderDetail(order) {
    const pickup = this.isPickup(order);
    const step = this.getStep(order);
    const stages = this.buildStages(order);
    const trackingNumber = order.trackingNumber || '';
    const user = Store.data.currentUser;
    return `
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded">ORDEN ${order.orderId}</span>
            <span class="text-xs font-semibold ${this.statusBadgeClass(order)} px-2.5 py-0.5 rounded">${this.statusLabel(order)}</span>
            ${trackingNumber && step !== 0 ? `<span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">${pickup ? 'Código de retiro' : 'Guía'}: ${trackingNumber}</span>` : ''}
          </div>
          <h1 id="tracking-detail-title" tabindex="-1" class="text-2xl font-bold text-[#0F172A] tracking-tight mt-2">Seguimiento de tu pedido</h1>
          <p class="text-xs text-slate-600 mt-0.5">
            Fecha: ${order.date || ''} • ${order.buyerName || ''} • ${order.deliveryMethod || ''}
          </p>
        </div>
        <button type="button" onclick="TrackingView.backToList()" class="px-3.5 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-[#0F172A] rounded-md transition flex items-center gap-1.5 touch-target">
          <i data-lucide="${user ? 'arrow-left' : 'search'}" class="w-4 h-4" aria-hidden="true"></i>
          <span>${user ? 'Mis pedidos' : 'Buscar otro pedido'}</span>
        </button>
      </div>

      <div class="py-8" role="region" aria-labelledby="tracking-stages-title">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-6">
          <h2 id="tracking-stages-title" class="text-xs font-semibold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="route" class="w-4 h-4 text-[#047857]" aria-hidden="true"></i>
            <span>Etapas del pedido</span>
          </h2>
          ${step >= 1 && step < 4 ? `
            <span class="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#059669] motion-safe:animate-pulse" aria-hidden="true"></span>Se actualiza solo
            </span>` : ''}
        </div>
        <ol class="grid grid-cols-1 ${stages.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-4" aria-live="polite">${this.renderTimelineStages(stages)}</ol>
        ${this.renderCancelPanel(order)}
        ${step !== 0 ? this.renderProgress(order) : ''}
        ${pickup && step !== 0 ? this.renderPickupInfo(order) : ''}
      </div>

      <div class="border-t border-slate-200 pt-6">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 class="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Productos de este pedido</h2>
          <span class="text-sm font-bold text-[#0F172A]">Total (IVA incl.): $${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
        </div>
        <div class="space-y-3">
          ${(order.items || []).map(item => `
            <div class="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-md">
              <div class="flex items-center gap-3">
                <img src="${item.imageLocal || 'assets/img/cards/card-back.png'}" alt="${item.name}" width="48" height="64" loading="lazy" decoding="async" class="w-12 h-16 object-contain bg-white rounded-lg border border-slate-200 p-0.5"
                  onerror="this.onerror=null; this.src='${item.imageFallback || 'assets/img/cards/card-back.png'}'" />
                <div>
                  <h3 class="text-sm font-semibold text-[#0F172A]">${item.name}</h3>
                  <span class="text-xs text-slate-600">${item.condition || ''} • Cantidad: ${item.quantity || 1}</span>
                </div>
              </div>
              <span class="text-sm font-bold text-[#0F172A]">$${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  render() {
    const order = this.resolveOrder();
    const user = Store.data.currentUser;
    if (order) {
      return `
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div id="tracking-detail" class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            ${this.renderDetail(order)}
          </div>
        </div>
      `;
    }
    return `
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        ${user ? this.renderOrderList() + this.renderLookupForm(true) : this.renderLookupForm(false)}
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.TrackingView = TrackingView;
}
