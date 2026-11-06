const ProfileView = {
  render() {
    const user = Store.data.currentUser;
    if (!user) {
      return `
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div class="bg-white border border-slate-200 rounded-lg p-8 sm:p-10 text-center shadow-sm space-y-6">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-[#0F172A] flex items-center justify-center mx-auto shadow-inner">
              <i data-lucide="shield-check" class="w-8 h-8 text-[#047857]"></i>
            </div>
            
            <div class="space-y-2">
              <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Acceso a tu perfil</h1>
              <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Inicia sesión para ver tus datos, tu historial de compras y el seguimiento de tus pedidos.
              </p>
            </div>

            <form onsubmit="event.preventDefault(); app.loginUser(document.getElementById('prof-login-email').value, document.getElementById('prof-login-pass').value, false);" class="max-w-sm mx-auto space-y-3 text-left" novalidate>
              <div>
                <label for="prof-login-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo electrónico</label>
                <input type="email" id="prof-login-email" autocomplete="email" placeholder="tu.correo@ejemplo.com" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label for="prof-login-pass" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña</label>
                <input type="password" id="prof-login-pass" autocomplete="current-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" />
              </div>
              <p data-form-error role="alert" class="hidden text-xs text-[#BE123C] font-semibold"></p>
              <button type="submit" class="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition shadow touch-target">Iniciar sesión</button>
            </form>

            <div class="pt-4 border-t border-slate-100 text-xs text-slate-500">
              ¿No tienes cuenta?
              <a href="pages/login.html?tab=register" class="font-semibold text-[#BE123C] hover:text-[#9F1239]">Crear una cuenta</a>
            </div>
          </div>
        </div>
      `;
    }

    const activeTab = Store.data.profileActiveTab || 'personal';
    const orders = Store.data.orders || [];
    const cleanPhone = (user.phone || '').replace(/^\+593\s*/, '').replace(/\D/g, '');
    const userInitial = (user.name || 'U').charAt(0).toUpperCase();

    return `
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div class="bg-[#0F172A] text-white rounded-lg p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-lg bg-[#1E293B] border border-[#D97706]/40 text-[#FEF3C7] flex items-center justify-center font-bold text-xl flex-shrink-0">
              ${userInitial}
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D1FAE5] bg-[#059669]/30 px-2.5 py-0.5 rounded mb-1">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Cuenta verificada</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-bold tracking-tight">${user.name}</h1>
              <p class="text-xs text-slate-300">${user.email}${user.idCard ? ` • Cédula/RUC: ${user.idCard}` : ''}</p>
            </div>
          </div>

          <button 
            type="button" 
            onclick="app.logoutUser()" 
            class="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-md transition shadow flex items-center gap-2 self-start sm:self-center touch-target"
          >
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" role="group" aria-label="Secciones del perfil">
          <button 
            type="button" 
            onclick="ProfileView.switchTab('personal')" 
            aria-pressed="${activeTab === 'personal'}"
            class="px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'personal' ? 'bg-[#0F172A] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F172A]'}"
          >
            <i data-lucide="user-cog" class="w-4 h-4"></i>
            <span>Mis Datos Personales</span>
          </button>

          <button 
            type="button" 
            onclick="ProfileView.switchTab('orders')" 
            aria-pressed="${activeTab === 'orders'}"
            class="px-5 py-2.5 rounded-md text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${activeTab === 'orders' ? 'bg-[#0F172A] text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#0F172A]'}"
          >
            <i data-lucide="package-check" class="w-4 h-4"></i>
            <span>Mis Últimas Compras / Historial de Órdenes (${orders.length})</span>
          </button>
        </div>

        ${activeTab === 'personal' ? `
          <div class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm max-w-3xl">
            <div class="pb-4 border-b border-slate-200 mb-6">
              <h2 class="text-lg font-bold text-[#0F172A]">Información Personal y Dirección de Custodia</h2>
              <p class="text-xs text-slate-500 mt-0.5">Estos datos se utilizan automáticamente en tus facturas electrónicas y envíos.</p>
            </div>

            <form onsubmit="event.preventDefault(); ProfileView.saveProfileChanges();" class="space-y-4" novalidate>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="prof-name" class="block text-xs font-semibold text-[#0F172A] mb-1">Nombre Completo: *</label>
                  <input 
                    type="text" 
                    id="prof-name" autocomplete="name" 
                    value="${user.name || ''}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-md focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label for="prof-id" class="block text-xs font-semibold text-[#0F172A] mb-1">Cédula / RUC (Módulo 10): *</label>
                  <input 
                    type="text" 
                    id="prof-id" 
                    value="${user.idCard || ''}" 
                    readonly
                    class="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-semibold cursor-not-allowed"
                  />
                  <p class="text-xs text-slate-500 mt-1">La cédula identifica tu cuenta y no se puede cambiar.</p>
                </div>

                <div>
                  <label for="prof-email" class="block text-xs font-semibold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                  <input
                    type="email"
                    id="prof-email"
                    value="${user.email || ''}"
                    autocomplete="email"
                    oninput="ProfileView.toggleEmailPassword()"
                    required
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-md focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div id="prof-email-pass-row" class="hidden sm:col-span-2 p-3.5 rounded-md bg-amber-50 border border-amber-200">
                  <label for="prof-email-pass" class="block text-xs font-semibold text-[#0F172A] mb-1">Contraseña actual (para confirmar el cambio de correo): *</label>
                  <input
                    type="password"
                    id="prof-email-pass"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    class="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md text-[#0F172A] font-semibold"
                  />
                  <p class="text-xs text-slate-500 mt-1">A partir del cambio inicias sesión con el nuevo correo.</p>
                </div>

                <div>
                  <label for="prof-phone" class="block text-xs font-semibold text-[#0F172A] mb-1">Teléfono Celular: *</label>
                  <div data-field class="flex rounded-md overflow-hidden border border-slate-300 bg-white">
                    <span class="inline-flex items-center px-3.5 bg-slate-100 text-slate-700 text-sm font-bold border-r border-slate-200 select-none">
                      +593
                    </span>
                    <input 
                      type="tel" 
                      id="prof-phone" autocomplete="tel-national" 
                      value="${cleanPhone || ''}" 
                      maxlength="10"
                      oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)"
                      required 
                      class="flex-1 px-3.5 py-2.5 text-sm bg-[#F8FAFC] focus:bg-white text-[#0F172A] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label for="prof-city" class="block text-xs font-semibold text-[#0F172A] mb-1">Ciudad: *</label>
                  <input 
                    type="text" 
                    id="prof-city" autocomplete="address-level2" 
                    value="${user.city || ''}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-md focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>

                <div>
                  <label for="prof-address" class="block text-xs font-semibold text-[#0F172A] mb-1">Dirección Predeterminada de Envío: *</label>
                  <input 
                    type="text" 
                    id="prof-address" autocomplete="street-address" 
                    value="${user.address || ''}" 
                    required 
                    class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-md focus:bg-white text-[#0F172A] font-semibold"
                  />
                </div>
              </div>

              <div class="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <button 
                  type="submit" 
                  class="px-6 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-semibold rounded-md transition shadow flex items-center gap-2 touch-target"
                >
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>Guardar Cambios</span>
                </button>

                <button 
                  type="button" 
                  onclick="app.logoutUser()" 
                  class="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-[#0F172A] text-xs font-bold rounded-md transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </form>
          </div>
        ` : `
          <div class="space-y-4">
            ${orders.length === 0 ? `
              <div class="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-sm space-y-3">
                <i data-lucide="package-search" class="w-12 h-12 mx-auto text-slate-300"></i>
                <h2 class="text-lg font-bold text-[#0F172A]">Aún no registras órdenes en tu historial</h2>
                <p class="text-xs text-slate-500 max-w-md mx-auto">
                  Tus adquisiciones de Slabs PSA y Cajas Selladas aparecerán aquí con desglose tributario y acceso directo al seguimiento en vivo.
                </p>
                <a href="pages/catalogo.html" class="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-md shadow transition">
                  <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                  <span>Ir al catálogo</span>
                </a>
              </div>
            ` : orders.map(order => `
              <article class="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <div class="flex items-center gap-2.5">
                      <span class="font-mono text-sm font-bold text-[#0F172A]">${order.orderId}</span>
                      <span class="px-2.5 py-0.5 text-xs font-semibold bg-[#D1FAE5] text-[#047857] rounded-md">
                        ${order.status || 'En Preparación / En Custodia'}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">
                      Fecha: <strong>${order.date}</strong> • Pago: <strong>${order.paymentMethod}</strong> • ${order.deliveryMethod}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <span class="text-xs text-slate-500 block">Total (IVA 15%: $${(order.tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                      <span class="text-lg font-bold text-[#0F172A]">$${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
                    </div>

                    <button 
                      type="button" 
                      onclick="app.openOrderTracking('${order.orderId}')" 
                      class="px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-md transition shadow flex items-center gap-1.5 touch-target"
                    >
                      <i data-lucide="truck" class="w-4 h-4 text-[#FEF3C7]"></i>
                      <span>Ver Tracking en Vivo</span>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  ${(order.items || []).map(item => `
                    <div class="flex items-center gap-3 p-2.5 rounded-md bg-[#F8FAFC] border border-slate-200">
                      <img 
                        src="${item.imageLocal}" 
                        alt="${item.name}"
                        width="44"
                        height="56"
                        loading="lazy"
                        decoding="async"
                        class="w-11 h-14 object-contain bg-white rounded-lg border border-slate-200 p-0.5 flex-shrink-0" 
                        onerror="this.onerror=null; this.src='${item.imageFallback}'"
                      />
                      <div class="min-w-0 flex-1">
                        <h3 class="text-xs font-semibold text-[#0F172A] truncate">${item.name}</h3>
                        <span class="text-xs text-slate-500 block">${item.condition} • Cant: ${item.quantity}</span>
                        <span class="text-xs font-bold text-[#0F172A]">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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

  PROFILE_RULES: {
    'prof-name': v => Validators.name(v),
    'prof-email': v => Validators.email(v),
    'prof-phone': v => Validators.phone(v),
    'prof-city': v => Validators.city(v),
    'prof-address': v => Validators.address(v)
  },

  afterRender() {
    if (Store.data.currentUser) {
      Validators.attach(this.PROFILE_RULES);
    }
  },

  emailChanged() {
    const input = document.getElementById('prof-email');
    const user = Store.data.currentUser;
    return !!(input && user && input.value.trim().toLowerCase() !== (user.email || '').toLowerCase());
  },

  // Muestra la contraseña actual solo si el correo cambió
  toggleEmailPassword() {
    const row = document.getElementById('prof-email-pass-row');
    if (row) row.classList.toggle('hidden', !this.emailChanged());
  },

  switchTab(tabName) {
    Store.data.profileActiveTab = tabName;
    app.renderCurrentView();
  },

  async saveProfileChanges() {
    const user = Store.data.currentUser;
    if (!user) return;
    if (!Validators.validateAll(this.PROFILE_RULES)) {
      app.showToast('Revisa los campos marcados en rojo.', 'error');
      return;
    }

    const val = id => document.getElementById(id).value.trim();
    const fields = {
      name: val('prof-name').replace(/\s+/g, ' '),
      phone: `+593 ${Validators.normalizePhone(val('prof-phone'))}`,
      city: val('prof-city'),
      address: val('prof-address')
    };

    if (this.emailChanged()) {
      const passEl = document.getElementById('prof-email-pass');
      if (!passEl.value) {
        Validators.showError(passEl, 'Ingresa tu contraseña actual para cambiar el correo.');
        app.showToast('Confirma el cambio de correo con tu contraseña actual.', 'error');
        return;
      }
      Validators.showError(passEl, '');
      fields.email = val('prof-email').toLowerCase();
      fields.currentPassword = passEl.value;
    }

    try {
      const updated = await SupabaseAPI.updateProfile(user.token, fields);
      Store.updateProfile(updated);
      app.updateNavbarUserUI();
      app.renderCurrentView();
      app.showToast('Perfil actualizado correctamente', 'success');
    } catch (err) {
      app.showToast(err.message, 'error');
    }
  }
};
