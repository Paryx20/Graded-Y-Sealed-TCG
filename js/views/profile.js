const ProfileView = {
  render() {
    const user = Store.data.currentUser;
    if (!user) {
      return `
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div class="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto">
              <i data-lucide="user-lock" class="w-8 h-8"></i>
            </div>
            <h1 class="text-2xl font-black text-[#0F172A]">Inicia sesión para acceder a tu Perfil</h1>
            <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Gestiona tus datos personales de facturación, dirección predeterminada y consulta el historial completo de tus órdenes en custodia.
            </p>
            <div class="pt-2">
              <a href="#auth" class="inline-flex items-center gap-2 px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow transition">
                <i data-lucide="log-in" class="w-4 h-4"></i>
                <span>Ir al Portal de Acceso</span>
              </a>
            </div>
          </div>
        </div>
      `;
    }

    const activeTab = Store.data.profileActiveTab || 'personal';
    const orders = Store.data.orders || [];
    const cleanPhone = (user.phone || '').replace(/^\+593\s*/, '').replace(/\D/g, '');

    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div class="bg-[#0F172A] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#D97706]/40 text-[#FEF3C7] flex items-center justify-center font-black text-xl flex-shrink-0">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#D1FAE5] bg-[#059669]/30 px-2.5 py-0.5 rounded mb-1">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Titular de Bóveda Verificado</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black tracking-tight">${user.name}</h1>
              <p class="text-xs text-slate-300">${user.email} • Cédula/RUC: ${user.idCard || '1710034065'}</p>
            </div>
          </div>

          <button 
            type="button" 
            onclick="app.logoutUser()" 
            class="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-2 self-start sm:self-center touch-target"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" role="tablist">
          <button 
            type="button" 
            onclick="ProfileView.switchTab('personal')" 
            class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 ${activeTab === 'personal' ? 'bg-[#0F172A] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F172A]'}"
          >
            <i data-lucide="user-cog" class="w-4 h-4"></i>
            <span>Mis Datos Personales</span>
          </button>

          <button 
            type="button" 
            onclick="ProfileView.switchTab('orders')" 
            class="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 ${activeTab === 'orders' ? 'bg-[#0F172A] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F172A]'}"
          >
            <i data-lucide="package-check" class="w-4 h-4"></i>
            <span>Mis Últimas Compras / Historial de Órdenes (${orders.length})</span>
          </button>
        </div>

        ${activeTab === 'personal' ? `
          <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-3xl">
            <div class="pb-4 border-b border-slate-200 mb-6">
              <h2 class="text-lg font-black text-[#0F172A]">Información Personal y Dirección de Custodia</h2>
              <p class="text-xs text-slate-500 mt-0.5">Estos datos se utilizan automáticamente en tus facturas electrónicas y despachos blindados.</p>
            </div>

            <form onsubmit="event.preventDefault(); ProfileView.saveProfileChanges();" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="prof-name" class="block text-xs font-extrabold text-[#0F172A] mb-1">Nombre Completo: *</label>
                  <input 
                    type="text" 
                    id="prof-name" 
                    value="${user.name || ''}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label for="prof-id" class="block text-xs font-extrabold text-[#0F172A] mb-1">Cédula / RUC (Módulo 10): *</label>
                  <input 
                    type="text" 
                    id="prof-id" 
                    value="${user.idCard || '1710034065'}" 
                    maxlength="10"
                    oninput="ProfileView.validateProfileId(this)"
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white text-[#0F172A] font-semibold"
                  />
                  <p id="prof-id-error" class="text-xs text-[#E11D48] font-bold mt-1 hidden">
                    Cédula ecuatoriana inválida (10 dígitos Módulo 10)
                  </p>
                </div>

                <div>
                  <label for="prof-email" class="block text-xs font-extrabold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                  <input 
                    type="email" 
                    id="prof-email" 
                    value="${user.email || ''}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label for="prof-phone" class="block text-xs font-extrabold text-[#0F172A] mb-1">Teléfono Celular: *</label>
                  <div class="flex rounded-xl overflow-hidden border border-slate-300 bg-white">
                    <span class="inline-flex items-center px-3.5 bg-slate-100 text-slate-700 text-sm font-bold border-r border-slate-200 select-none">
                      +593
                    </span>
                    <input 
                      type="tel" 
                      id="prof-phone" 
                      value="${cleanPhone || '0991234567'}" 
                      maxlength="10"
                      oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)"
                      required 
                      class="flex-1 px-3.5 py-2.5 text-sm bg-[#F8FAFC] focus:bg-white focus:outline-none text-[#0F172A] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label for="prof-city" class="block text-xs font-extrabold text-[#0F172A] mb-1">Ciudad: *</label>
                  <input 
                    type="text" 
                    id="prof-city" 
                    value="${user.city || 'Quito'}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label for="prof-address" class="block text-xs font-extrabold text-[#0F172A] mb-1">Dirección Predeterminada de Envío: *</label>
                  <input 
                    type="text" 
                    id="prof-address" 
                    value="${user.address || 'Av. República del Salvador N34-183, Quito'}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>
              </div>

              <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button 
                  type="submit" 
                  class="px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-extrabold rounded-xl transition shadow flex items-center gap-2 touch-target"
                >
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>Guardar Cambios</span>
                </button>

                <button 
                  type="button" 
                  onclick="app.logoutUser()" 
                  class="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-[#0F172A] text-xs font-bold rounded-xl transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </form>
          </div>
        ` : `
          <div class="space-y-4">
            ${orders.length === 0 ? `
              <div class="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm space-y-3">
                <i data-lucide="package-search" class="w-12 h-12 mx-auto text-slate-300"></i>
                <h2 class="text-lg font-black text-[#0F172A]">Aún no registras órdenes en tu historial</h2>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Tus adquisiciones de Slabs PSA y Cajas Selladas aparecerán aquí con desglose tributario y acceso directo al seguimiento en vivo.
                </p>
                <a href="#catalog" class="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl shadow transition">
                  <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                  <span>Explorar Bóveda</span>
                </a>
              </div>
            ` : orders.map(order => `
              <article class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <span class="font-mono text-sm font-black text-[#0F172A]">${order.orderId}</span>
                      <span class="px-2.5 py-0.5 text-[11px] font-extrabold bg-[#D1FAE5] text-[#059669] rounded-md">
                        ${order.status || 'En Preparación / En Custodia'}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      Fecha: <strong>${order.date}</strong> • Pago: <strong>${order.paymentMethod}</strong> • ${order.deliveryMethod}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <span class="text-[10px] text-slate-500 block">Total (IVA 15%: $${(order.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                      <span class="text-lg font-black text-[#0F172A]">$${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                    </div>

                    <button 
                      type="button" 
                      onclick="app.openOrderTracking('${order.orderId}')" 
                      class="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-extrabold rounded-xl transition shadow flex items-center gap-1.5 touch-target"
                    >
                      <i data-lucide="truck" class="w-4 h-4 text-[#FEF3C7]"></i>
                      <span>Ver Tracking en Vivo</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  ${(order.items || []).map(item => `
                    <div class="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                      <img 
                        src="${item.imageLocal}" 
                        alt="${item.name}" 
                        class="w-11 h-14 object-contain bg-white rounded-lg border border-slate-200 p-0.5 flex-shrink-0" 
                        onerror="this.onerror=null; this.src='${item.imageFallback}'"
                      />
                      <div class="min-w-0 flex-1">
                        <h3 class="text-xs font-extrabold text-[#0F172A] truncate">${item.name}</h3>
                        <span class="text-[10px] text-slate-500 block">${item.condition} • Cant: ${item.quantity}</span>
                        <span class="text-xs font-black text-[#0F172A]">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  switchTab(tabName) {
    Store.data.profileActiveTab = tabName;
    app.renderCurrentView();
  },

  validateProfileId(inputEl) {
    inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 10);
    const errEl = document.getElementById('prof-id-error');
    if (!errEl) return;
    const valid = Store.isValidEcuadorianId(inputEl.value);
    errEl.classList.toggle('hidden', valid);
    inputEl.classList.toggle('border-[#E11D48]', !valid);
    inputEl.classList.toggle('border-[#059669]', valid);
  },

  saveProfileChanges() {
    const name = document.getElementById('prof-name')?.value.trim();
    const idCard = document.getElementById('prof-id')?.value.trim();
    const email = document.getElementById('prof-email')?.value.trim();
    const phoneRaw = document.getElementById('prof-phone')?.value.trim();
    const city = document.getElementById('prof-city')?.value.trim();
    const address = document.getElementById('prof-address')?.value.trim();

    if (!name || !email) {
      app.showToast('El nombre y el correo electrónico son obligatorios.', 'error');
      return;
    }

    if (!Store.isValidEcuadorianId(idCard)) {
      const idEl = document.getElementById('prof-id');
      if (idEl) {
        this.validateProfileId(idEl);
        idEl.focus();
      }
      app.showToast('La cédula ingresada no es válida según el algoritmo Módulo 10.', 'error');
      return;
    }

    Store.updateProfile({
      name,
      idCard,
      email,
      phone: `+593 ${phoneRaw.replace(/^\+593\s*/, '')}`,
      city,
      address
    });

    app.updateNavbarUserUI();
    app.renderCurrentView();
    app.showToast('Perfil actualizado correctamente', 'success');
  }
};

