/**
 * ==============================================================================
 * TrackingView - Seguimiento de órdenes con verificación de identidad por cédula
 * File: js/views/tracking.js
 *
 * Flujo de la simulación:
 *   1. El cliente rastrea su pedido con número de orden (o guía) + cédula del titular.
 *      Si la cédula no coincide con la registrada en la orden, no se muestra nada.
 *   2. Las etapas avanzan solas: Preparación → En camino → Llegó a destino.
 *   3. En la entrega, el courier (o la ventanilla de bóveda) pide la cédula.
 *      Solo si coincide con el titular se marca como Entregado; tras 3 intentos
 *      fallidos la entrega queda retenida y la pieza regresa a bóveda.
 * ==============================================================================
 */

const TrackingView = {
  // Pasos: 1 preparación, 2 en camino / listo, 3 esperando verificación, 4 entregado, -1 retenido
  STEP_DELAY_MS: 3500,
  MAX_ID_ATTEMPTS: 3,

  current: null,      // orden desbloqueada que se está mostrando
  verifiedId: null,   // cédula con la que se desbloqueó
  lookupError: '',
  _simulationTimer: null,

  clearSimulationTimer() {
    if (this._simulationTimer) {
      clearTimeout(this._simulationTimer);
      this._simulationTimer = null;
    }
  },

  isPickup(order) {
    return order.metodo_entrega === 'pickup' || /retiro/i.test(order.deliveryMethod || '');
  },

  maskId(id) {
    const v = String(id || '');
    return v.length > 4 ? '•'.repeat(v.length - 4) + v.slice(-4) : v;
  },

  nowLabel() {
    return new Date().toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },

  // Deriva el paso actual de órdenes antiguas que solo tienen `stages`
  getStep(order) {
    if (typeof order.trackingStep === 'number') return order.trackingStep;
    const stages = order.stages || [];
    const activeIdx = stages.findIndex(s => s.status === 'active');
    if (activeIdx > 0) return activeIdx;
    if (stages.length && stages.every(s => s.status === 'completed')) return 4;
    return 1;
  },

  buildStages(order) {
    const step = this.getStep(order);
    const dates = order.stepDates || {};
    const pickup = this.isPickup(order);
    const held = step === -1;
    const tpl = pickup ? [
      { title: 'Orden recibida', subtitle: 'Pago verificado', detail: 'Orden registrada en la cadena de custodia.' },
      { title: 'En preparación', subtitle: 'Sellado UV en bóveda', detail: 'Revisión de hologramas, microimpresión y encapsulado.' },
      { title: 'Listo para retiro', subtitle: 'Bóveda Central Quito', detail: 'Disponible en ventanilla de seguridad.' },
      { title: 'Retirado', subtitle: 'Entrega contra cédula', detail: 'El titular presenta su cédula original en ventanilla.' }
    ] : [
      { title: 'Orden recibida', subtitle: 'Pago verificado', detail: 'Orden registrada en la cadena de custodia.' },
      { title: 'En preparación', subtitle: 'Sellado UV en bóveda', detail: 'Revisión de hologramas, microimpresión y encapsulado.' },
      { title: 'En camino', subtitle: order.courierName || 'Transporte blindado', detail: 'Valija con precinto tamper-evident y GPS activo.' },
      { title: 'Entregado', subtitle: 'Entrega contra cédula', detail: 'El courier verifica la cédula del titular antes de entregar.' }
    ];

    return tpl.map((s, idx) => {
      let status = 'pending';
      if (held) {
        status = idx < 3 ? 'completed' : 'failed';
      } else if (idx === 0 || idx < step || step === 4) {
        status = 'completed';
      } else if (idx === step || (step === 3 && idx === 3)) {
        status = 'active';
      }
      if (step === 3 && idx === 2) status = 'completed';

      let date = idx === 0 ? (order.date || '') : (dates[idx] || '');
      if (!date && status === 'pending') date = 'Pendiente';
      if (status === 'active' && idx === 3) date = 'Esperando verificación';
      if (status === 'failed') date = dates.held || 'Entrega retenida';
      return { ...s, status, date, title: `${idx + 1}. ${s.title}` };
    });
  },

  statusLabel(order) {
    const step = this.getStep(order);
    const pickup = this.isPickup(order);
    if (step === -1) return 'Entrega retenida • Regresa a bóveda';
    if (step === 4) return pickup ? 'Retirado en bóveda' : 'Entregado';
    if (step === 3) return pickup ? 'En ventanilla • Verificando identidad' : 'En destino • Verificando identidad';
    if (step === 2) return pickup ? 'Listo para retiro' : 'En camino';
    return 'En preparación';
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
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

    let order = (Store.data.orders || []).find(matchesCode);
    const demo = Store.getPreloadedSimulatedOrder();
    if (!order && matchesCode(demo)) order = this._demoOrder || (this._demoOrder = demo);

    let error = '';
    if (order) {
      if ((order.buyerId || order.usuario_cedula) !== idCard) {
        error = 'La cédula no coincide con el titular registrado en esta orden. Por seguridad no podemos mostrar el seguimiento.';
        order = null;
      }
    } else {
      try {
        order = await SupabaseAPI.trackOrder(code, idCard);
        if (!order) error = 'No encontramos una orden con ese código registrada a esa cédula.';
      } catch (err) {
        error = err.message;
      }
    }

    this.lookupError = error;
    if (order) {
      this.current = order;
      this.verifiedId = idCard;
      app.showToast('Identidad verificada. Mostrando el seguimiento de tu orden.', 'success');
    }
    app.renderCurrentView();
  },

  resetLookup() {
    this.clearSimulationTimer();
    this.current = null;
    this.verifiedId = null;
    this.lookupError = '';
    Store.data.activeTrackingOrderId = null;
    history.replaceState(null, '', app.url('tracking'));
    app.renderCurrentView();
  },

  // Orden a mostrar: la buscada con cédula, o una del historial del usuario con sesión
  resolveOrder() {
    const user = Store.data.currentUser;
    const wanted = Store.data.activeTrackingOrderId;
    if (wanted && user) {
      const own = Store.getOrderById(wanted);
      if (own && (!this.current || this.current.orderId !== own.orderId)) {
        this.current = own;
        this.verifiedId = own.buyerId || user.idCard;
      }
    }
    return this.current;
  },

  // ------------------------------------------------------------ Simulación

  afterRender() {
    this.clearSimulationTimer();
    const order = this.current;
    if (order) this.scheduleNextStep(order);
    if (typeof Validators !== 'undefined') {
      Validators.attach({ 'track-id': v => Validators.idCard(v) });
    }
  },

  scheduleNextStep(order) {
    const step = this.getStep(order);
    if (step < 1 || step >= 3) return;
    this._simulationTimer = setTimeout(() => {
      this.setStep(order, step + 1);
      const pickup = this.isPickup(order);
      const msg = step + 1 === 2
        ? (pickup ? 'Tu pieza está lista para retiro en Bóveda Central.' : 'Tu pedido salió de la bóveda en transporte blindado.')
        : (pickup ? 'Estás en ventanilla: presenta tu cédula para retirar.' : 'El courier llegó a destino y solicita la cédula del titular.');
      app.showToast(msg, 'info');
      this.refreshDetail();
      this.scheduleNextStep(order);
    }, this.STEP_DELAY_MS);
  },

  setStep(order, step) {
    order.trackingStep = step;
    order.stepDates = { ...(order.stepDates || {}), [step]: this.nowLabel() };
    if (step === -1) order.stepDates.held = this.nowLabel();
    order.status = this.statusLabel(order);
    order.stages = this.buildStages(order);
    this.persist(order);
  },

  persist(order) {
    Store.saveOrders();
    if (!order.isDemo && this.verifiedId && SupabaseAPI.isOnline()) {
      SupabaseAPI.updateOrderStatus(order, this.verifiedId).catch(err => {
        console.warn('[TrackingView] No se pudo guardar el estado en Supabase:', err.message);
      });
    }
  },

  refreshDetail() {
    const box = document.getElementById('tracking-detail');
    if (!box || !this.current) return;
    box.innerHTML = this.renderDetail(this.current);
    app.refreshIcons();
    Validators.attach({ 'deliver-id': v => Validators.idCard(v) });
  },

  verifyDelivery() {
    const order = this.current;
    const input = document.getElementById('deliver-id');
    if (!order || !input) return;
    if (!Validators.validateAll({ 'deliver-id': v => Validators.idCard(v) })) return;

    const holderId = order.buyerId || order.usuario_cedula;
    const pickup = this.isPickup(order);
    if (input.value.trim() === holderId) {
      order.deliveredTo = order.buyerName;
      order.idAttempts = 0;
      this.setStep(order, 4);
      app.showToast(pickup ? 'Identidad verificada. Pieza retirada en bóveda.' : 'Identidad verificada. Pedido entregado.', 'success');
    } else {
      order.idAttempts = (order.idAttempts || 0) + 1;
      if (order.idAttempts >= this.MAX_ID_ATTEMPTS) {
        this.setStep(order, -1);
        app.showToast('Entrega retenida: demasiados intentos con una cédula incorrecta.', 'error');
      } else {
        this.persist(order);
        app.showToast('La cédula no coincide con el titular. No se entrega el pedido.', 'error');
      }
    }
    this.refreshDetail();
  },

  // ----------------------------------------------------------------- Vistas

  renderLookupForm(compact) {
    return `
      <section class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm ${compact ? '' : 'max-w-2xl mx-auto'}">
        <div class="flex items-start gap-3 mb-5">
          <div class="w-10 h-10 rounded-xl bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center flex-shrink-0">
            <i data-lucide="package-search" class="w-5 h-5"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-[#0F172A] tracking-tight">Rastrear un pedido</h1>
            <p class="text-xs text-slate-500 mt-0.5">Por seguridad, el seguimiento solo se muestra al titular. Ingresa el número de orden o guía y la cédula con la que se hizo la compra.</p>
          </div>
        </div>

        <form onsubmit="event.preventDefault(); TrackingView.lookup();" class="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start" novalidate>
          <div class="sm:col-span-2">
            <label for="track-code" class="block text-xs font-bold text-[#0F172A] mb-1">Orden o guía</label>
            <input id="track-code" type="text" autocomplete="off" placeholder="PKM-2026-15875" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white font-mono uppercase" />
          </div>
          <div class="sm:col-span-2">
            <label for="track-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula del titular</label>
            <input id="track-id" type="text" value="${(Store.data.currentUser && Store.data.currentUser.idCard) || ''}" inputmode="numeric" maxlength="13" autocomplete="off" placeholder="1710034065" oninput="this.value = this.value.replace(/\\D/g, '')" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" />
          </div>
          <div class="sm:pt-5">
            <button id="track-submit" type="submit" class="w-full py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-lg transition touch-target">Rastrear</button>
          </div>
        </form>

        ${this.lookupError ? `
          <div class="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2" role="alert">
            <i data-lucide="shield-alert" class="w-4 h-4 text-[#BE123C] flex-shrink-0 mt-0.5"></i>
            <span>${this.lookupError}</span>
          </div>
        ` : ''}

        <p class="mt-4 text-xs text-slate-500">
          Pedido de demostración: orden <span class="font-mono font-bold text-slate-500">GS-2026-9481</span> con cédula <span class="font-mono font-bold text-slate-500">1710034065</span>.
        </p>
      </section>
    `;
  },

  renderUserOrders() {
    const user = Store.data.currentUser;
    const orders = Store.data.orders || [];
    if (!user || orders.length === 0) return '';
    return `
      <section class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <span class="text-xs font-semibold text-[#0F172A]">Tus órdenes (${orders.length}):</span>
        <div class="flex flex-wrap gap-2">
          ${orders.map(o => `
            <button type="button" onclick="app.openOrderTracking('${o.orderId}')"
              class="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${this.current && o.orderId === this.current.orderId ? 'bg-[#0F172A] text-[#FEF3C7]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              ${o.orderId}
            </button>
          `).join('')}
        </div>
      </section>
    `;
  },

  renderTimelineStages(stages) {
    return stages.map((stg, idx) => {
      const isCompleted = stg.status === 'completed';
      const isActive = stg.status === 'active';
      const isFailed = stg.status === 'failed';
      let iconClass = 'bg-slate-200 text-slate-600';
      let iconContent = String(idx + 1);

      if (isCompleted) {
        iconClass = 'bg-[#059669] text-white shadow';
        iconContent = '<i data-lucide="check" class="w-5 h-5"></i>';
      } else if (isActive) {
        iconClass = 'bg-[#0F172A] text-[#FEF3C7] shadow ring-4 ring-slate-200';
        iconContent = `<i data-lucide="${idx === 3 ? 'id-card' : 'package'}" class="w-5 h-5 animate-pulse"></i>`;
      } else if (isFailed) {
        iconClass = 'bg-[#E11D48] text-white shadow';
        iconContent = '<i data-lucide="x" class="w-5 h-5"></i>';
      }

      const boxClass = isActive
        ? 'bg-amber-50/60 border border-amber-200/80 ring-1 ring-amber-300/50'
        : (isFailed ? 'bg-rose-50 border border-rose-200' : 'bg-slate-50/40 border border-slate-100');
      const subClass = isActive ? 'text-[#B45309] font-bold' : (isCompleted ? 'text-[#047857] font-semibold' : (isFailed ? 'text-[#BE123C] font-bold' : 'text-slate-500'));

      return `
        <div class="flex sm:flex-col items-center sm:text-center gap-3 p-3 rounded-xl transition-all ${boxClass}">
          <div class="w-10 h-10 rounded-full ${iconClass} flex items-center justify-center font-bold text-sm flex-shrink-0">${iconContent}</div>
          <div>
            <span class="text-xs font-semibold text-[#0F172A] block">${stg.title}</span>
            <span class="text-xs ${subClass} block">${stg.subtitle}</span>
            ${stg.date ? `<span class="text-xs text-slate-500 block mt-0.5">${stg.date}</span>` : ''}
            <p class="text-xs text-slate-500 mt-1 hidden sm:block">${stg.detail}</p>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTransitCard(order) {
    const step = this.getStep(order);
    const progress = { 1: '15%', 2: '60%', 3: '95%', 4: '100%', '-1': '95%' }[step] || '15%';
    const label = { 1: 'Preparando despacho', 2: 'En ruta de entrega', 3: 'En la dirección de entrega', 4: 'Entregado', '-1': 'Regresando a bóveda' }[step];
    return `
      <div class="mt-6 p-5 sm:p-6 bg-[#0F172A] text-white rounded-2xl shadow-md border border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <i data-lucide="truck" class="w-5 h-5 ${step === 2 ? 'animate-pulse' : ''}"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-[#FEF3C7]">Transporte blindado</h3>
              <span class="text-xs text-slate-400">${order.courierName || 'Servientrega Blindado • Bóveda G&S'}</span>
            </div>
          </div>
          <span class="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg self-start sm:self-center">GPS activo</span>
        </div>
        <div class="pt-4 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Bóveda Central Quito</span>
            <span class="font-mono text-amber-400 font-bold">${label}</span>
            <span>${order.buyerName || 'Destinatario'}</span>
          </div>
          <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700" style="width: ${progress}"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderPickupCard(order) {
    return `
      <div class="mt-6 p-5 sm:p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-white border border-emerald-100 rounded-xl">
            <span class="text-slate-500 block text-xs uppercase font-bold">Dirección de retiro</span>
            <strong class="text-[#0F172A] block mt-0.5">Av. República del Salvador N34-183 y Moscú</strong>
            <span class="text-slate-500 text-xs block">Edificio Bóveda Central, Piso 2, Quito</span>
          </div>
          <div class="p-3 bg-white border border-emerald-100 rounded-xl">
            <span class="text-slate-500 block text-xs uppercase font-bold">Horario</span>
            <strong class="text-[#0F172A] block mt-0.5">Lunes a sábado: 09:00 - 18:00</strong>
            <span class="text-slate-500 text-xs block">Titular: ${order.buyerName || 'Coleccionista'}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderIdentityPanel(order) {
    const step = this.getStep(order);
    const pickup = this.isPickup(order);

    if (step === 3) {
      const attemptsLeft = this.MAX_ID_ATTEMPTS - (order.idAttempts || 0);
      return `
        <div class="mt-6 p-5 sm:p-6 border-2 border-[#D97706]/50 bg-[#FEF3C7]/40 rounded-2xl">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center flex-shrink-0">
              <i data-lucide="id-card" class="w-5 h-5"></i>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-bold text-[#0F172A]">Verificación de identidad</h3>
              <p class="text-xs text-slate-600 mt-0.5">
                ${pickup ? 'El agente de ventanilla' : 'El courier'} solicita la cédula de <strong>${order.buyerName}</strong> (titular •••${String(order.buyerId || '').slice(-4)}).
                La pieza solo se entrega si la cédula coincide.
              </p>
              <form onsubmit="event.preventDefault(); TrackingView.verifyDelivery();" class="mt-3 flex flex-col sm:flex-row gap-2 sm:items-start" novalidate>
                <div class="flex-1">
                  <label for="deliver-id" class="sr-only">Cédula presentada</label>
                  <input id="deliver-id" type="text" inputmode="numeric" maxlength="13" placeholder="Cédula presentada en la entrega" oninput="this.value = this.value.replace(/\\D/g, '')" class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg" />
                </div>
                <button type="submit" class="px-5 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold rounded-lg transition touch-target">Verificar y entregar</button>
              </form>
              ${order.idAttempts ? `<p class="text-xs text-[#BE123C] font-semibold mt-2">Cédula incorrecta. Intentos restantes: ${attemptsLeft}</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    if (step === 4) {
      return `
        <div class="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <i data-lucide="badge-check" class="w-6 h-6 text-[#047857] flex-shrink-0"></i>
          <div class="text-xs text-emerald-900">
            <strong class="block text-sm">${pickup ? 'Retirado en bóveda' : 'Entregado'} a ${order.deliveredTo || order.buyerName}</strong>
            Identidad verificada con cédula ${this.maskId(order.buyerId)} • ${(order.stepDates || {})[4] || ''}
          </div>
        </div>
      `;
    }

    if (step === -1) {
      return `
        <div class="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3" role="alert">
          <i data-lucide="shield-x" class="w-6 h-6 text-[#BE123C] flex-shrink-0"></i>
          <div class="text-xs text-rose-900">
            <strong class="block text-sm">Entrega retenida por seguridad</strong>
            Se presentaron ${this.MAX_ID_ATTEMPTS} cédulas que no coinciden con el titular. La pieza regresa a Bóveda Central Quito;
            el titular debe retirarla en persona con su cédula original.
          </div>
        </div>
      `;
    }
    return '';
  },

  renderDetail(order) {
    const pickup = this.isPickup(order);
    const stages = this.buildStages(order);
    const trackingNumber = order.trackingNumber || '';
    return `
      <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-mono font-bold text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded">ORDEN ${order.orderId}</span>
            <span class="text-xs font-semibold ${this.getStep(order) === -1 ? 'text-[#BE123C] bg-rose-100' : 'text-[#047857] bg-[#D1FAE5]'} px-2.5 py-0.5 rounded">${this.statusLabel(order)}</span>
            ${trackingNumber ? `<span class="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">${pickup ? 'Código de retiro' : 'Guía'}: ${trackingNumber}</span>` : ''}
          </div>
          <h1 class="text-2xl font-bold text-[#0F172A] tracking-tight mt-2">Seguimiento de tu pedido</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Fecha: ${order.date || ''} • Titular: ${order.buyerName || ''} (${this.maskId(order.buyerId)}) • ${order.deliveryMethod || ''}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="TrackingView.resetLookup()" class="px-3.5 py-2 text-xs font-bold border border-slate-300 hover:bg-slate-50 text-[#0F172A] rounded-xl transition flex items-center gap-1.5 touch-target">
            <i data-lucide="search" class="w-4 h-4"></i>
            <span>Rastrear otro pedido</span>
          </button>
        </div>
      </div>

      <div class="py-8" role="region" aria-label="Etapas de entrega del pedido" aria-live="polite">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xs font-semibold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <i data-lucide="route" class="w-4 h-4 text-[#047857]"></i>
            <span>Etapas de custodia y despacho</span>
          </h2>
          ${[1, 2].includes(this.getStep(order)) ? `
            <span class="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>Simulación en vivo
            </span>` : ''}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">${this.renderTimelineStages(stages)}</div>
        ${this.renderIdentityPanel(order)}
        ${pickup ? this.renderPickupCard(order) : this.renderTransitCard(order)}
      </div>

      <div class="border-t border-slate-200 pt-6">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 class="text-sm font-semibold text-[#0F172A] uppercase tracking-wider">Piezas de esta orden</h2>
          <span class="text-sm font-bold text-[#0F172A]">Total (IVA incl.): $${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
        </div>
        <div class="space-y-3">
          ${(order.items || []).map(item => `
            <div class="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl">
              <div class="flex items-center gap-3">
                <img src="${item.imageLocal || 'assets/img/cards/card-back.png'}" alt="${item.name}" width="48" height="64" loading="lazy" decoding="async" class="w-12 h-16 object-contain bg-white rounded-lg border border-slate-200 p-0.5"
                  onerror="this.onerror=null; this.src='${item.imageFallback || 'assets/img/cards/card-back.png'}'" />
                <div>
                  <h3 class="text-sm font-semibold text-[#0F172A]">${item.name}</h3>
                  <span class="text-xs text-slate-500">${item.condition || ''} • Cantidad: ${item.quantity || 1}</span>
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
    return `
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-5">
        ${this.renderUserOrders()}
        ${order ? `
          <div id="tracking-detail" class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            ${this.renderDetail(order)}
          </div>
        ` : this.renderLookupForm(false)}
      </div>
    `;
  }
};

if (typeof window !== 'undefined') {
  window.TrackingView = TrackingView;
}
