const CheckoutView = {
  authTab: 'login',

  renderCheckout() {
    const user = Store.data.currentUser;
    const isPickup = Store.data.deliveryMethod === 'pickup';
    const { total } = Store.getCartTotals();
    const rawPhone = user && user.phone ? user.phone.replace(/^\+593\s*/, '').replace(/\D/g, '') : '';

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-[#0F172A] text-white rounded-xl px-4 py-3 flex items-center justify-between mb-6 shadow-sm">
          <div class="flex items-center gap-2 text-xs font-bold">
            <i data-lucide="lock" class="w-4 h-4 text-[#059669]"></i>
            <span>Checkout Seguro TLS 256-bit • Graded &amp; Sealed TCG</span>
          </div>
          <span class="text-[11px] text-slate-300">Cumplimiento PCI-DSS</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 class="text-base font-black text-[#0F172A]">${user ? 'Sesión Activa' : 'Usuario Registrado'}</h2>
              <span class="text-[10px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">${user ? 'Verificado' : 'Opción A'}</span>
            </div>

            ${user ? `
              <div class="mt-4 space-y-3">
                <p class="text-xs text-slate-600">Tus datos de perfil se han precargado automáticamente para esta orden.</p>
                <div class="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs space-y-1">
                  <div class="font-black text-[#0F172A]">${user.name}</div>
                  <div class="text-slate-500">${user.email}</div>
                  <div class="text-slate-500">Cédula/RUC: ${user.idCard || 'No registrada'}</div>
                </div>
                <a href="#profile" class="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5">
                  <i data-lucide="user-check" class="w-4 h-4"></i>
                  <span>Ver Mi Perfil e Historial</span>
                </a>
              </div>
            ` : `
              <p class="text-xs text-slate-500 mt-2">Inicia sesión para autocompletar tus datos de envío.</p>
              <form onsubmit="event.preventDefault(); CheckoutView.handleQuickLogin();" class="mt-4 space-y-3.5">
                <div>
                  <label for="login-email-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico:</label>
                  <input type="email" id="login-email-checkout" placeholder="tu.correo@ejemplo.com" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>
                <div>
                  <label for="login-pass-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña:</label>
                  <input type="password" id="login-pass-checkout" placeholder="••••••••" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>
                <button type="submit" class="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg transition touch-target">
                  Iniciar Sesión y Aplicar
                </button>
              </form>
            `}
          </div>

          <div class="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h1 class="text-lg font-black text-[#0F172A]">Datos de Facturación y Entrega</h1>
                <p class="text-xs text-slate-500 mt-0.5">Completa los datos para emitir tu factura electrónica y orden de custodia</p>
              </div>
              <span class="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded">Custodia Asegurada</span>
            </div>

            <fieldset class="space-y-4">
              <legend class="text-sm font-extrabold text-[#0F172A]">1. Datos Personales y Facturación</legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="guest-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nombre Completo: *</label>
                  <input type="text" id="guest-name" value="${user ? user.name : ''}" placeholder="Ej. Carlos Mendoza" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                <div>
                  <label for="guest-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula o RUC (Módulo 10): *</label>
                  <input 
                    type="text" 
                    id="guest-id" 
                    value="${user && user.idCard ? user.idCard : ''}" 
                    placeholder="Ej. 1710034065" 
                    maxlength="10"
                    oninput="CheckoutView.validateIdInput(this)"
                    class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white transition" 
                    required 
                  />
                  <p id="guest-id-error" class="text-xs text-[#E11D48] font-semibold mt-1 hidden" role="alert">
                    Cédula ecuatoriana inválida (debe contener 10 dígitos válidos)
                  </p>
                </div>

                <div>
                  <label for="guest-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                  <input type="email" id="guest-email" value="${user ? user.email : ''}" placeholder="carlos@correo.com" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                <div>
                  <label for="guest-phone" class="block text-xs font-bold text-[#0F172A] mb-1">Teléfono Celular: *</label>
                  <div class="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
                    <span class="inline-flex items-center px-3.5 bg-slate-100 text-slate-700 text-sm font-bold border-r border-slate-200 select-none">
                      +593
                    </span>
                    <input 
                      type="tel" 
                      id="guest-phone" 
                      value="${rawPhone}" 
                      placeholder="0991234567" 
                      maxlength="10" 
                      oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)"
                      class="flex-1 px-3.5 py-2 text-sm bg-[#F8FAFC] focus:bg-white focus:outline-none" 
                      required 
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset class="space-y-3">
              <legend class="text-sm font-extrabold text-[#0F172A]">2. Método de Entrega</legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label class="p-4 rounded-xl cursor-pointer flex items-start gap-3 transition ${!isPickup ? 'border-2 border-[#0F172A] bg-slate-50' : 'border border-slate-300 bg-white hover:bg-slate-50'}">
                  <input type="radio" name="delivery-method" value="courier" ${!isPickup ? 'checked' : ''} onchange="CheckoutView.setDelivery('courier')" class="mt-1 text-[#E11D48]" />
                  <div>
                    <div class="text-sm font-bold text-[#0F172A]">Envío Blindado a Domicilio ($5.00)</div>
                    <p class="text-xs text-slate-500 mt-0.5">Entrega asegurada en 24-48h con protección UV.</p>
                  </div>
                </label>

                <label class="p-4 rounded-xl cursor-pointer flex items-start gap-3 transition ${isPickup ? 'border-2 border-[#0F172A] bg-slate-50' : 'border border-slate-300 bg-white hover:bg-slate-50'}">
                  <input type="radio" name="delivery-method" value="pickup" ${isPickup ? 'checked' : ''} onchange="CheckoutView.setDelivery('pickup')" class="mt-1 text-[#E11D48]" />
                  <div>
                    <div class="text-sm font-bold text-[#0F172A]">Retiro en Local Físico (Gratis)</div>
                    <p class="text-xs text-slate-500 mt-0.5">Sucursal Central Quito (Listo en 2 horas).</p>
                  </div>
                </label>
              </div>
            </fieldset>

            <fieldset class="space-y-3">
              <legend class="text-sm font-extrabold text-[#0F172A]">3. Método de Pago</legend>
              <div class="space-y-3">
                <div class="p-4 rounded-xl border border-[#0F172A] bg-[#F8FAFC] space-y-3">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-3">
                      <input type="radio" name="payment-method" value="card" checked class="text-[#E11D48]" />
                      <div>
                        <span class="text-sm font-bold text-[#0F172A]">Tarjeta de Crédito / Débito</span>
                        <span class="text-xs text-slate-500 block">Visa, Mastercard (3D Secure)</span>
                      </div>
                    </div>
                    <i data-lucide="credit-card" class="w-5 h-5 text-slate-500"></i>
                  </label>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div class="sm:col-span-3">
                      <label for="card-number" class="block text-xs font-bold text-slate-700 mb-1">Número de Tarjeta:</label>
                      <input type="text" id="card-number" placeholder="•••• •••• •••• 4129" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none" />
                      <span class="text-[10px] text-slate-400 mt-0.5 block">Para simular fallo bancario ingresa una tarjeta terminada en 0000</span>
                    </div>
                    <div>
                      <label for="card-exp" class="block text-xs font-bold text-slate-700 mb-1">Expiración:</label>
                      <input type="text" id="card-exp" placeholder="MM/AA" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none" />
                    </div>
                    <div>
                      <label for="card-cvv" class="block text-xs font-bold text-slate-700 mb-1">CVV/CVC:</label>
                      <input type="password" id="card-cvv" placeholder="•••" maxlength="4" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none" />
                    </div>
                  </div>
                </div>

                <label class="p-3.5 rounded-xl border flex items-center justify-between transition ${isPickup ? 'border-slate-300 bg-white cursor-pointer hover:bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'}">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="payment-method" id="payment-cash-input" value="cash" ${isPickup ? '' : 'disabled'} class="text-[#E11D48]" />
                    <div>
                      <span class="text-sm font-bold ${isPickup ? 'text-[#0F172A]' : 'text-slate-500'}">Efectivo al retirar en tienda (Cash)</span>
                      <span class="text-xs text-slate-400 block">${isPickup ? 'Paga directamente en ventanilla de bóveda al retirar' : 'Solo disponible seleccionando "Retiro en Local Físico"'}</span>
                    </div>
                  </div>
                  <i data-lucide="banknote" class="w-5 h-5 text-slate-400"></i>
                </label>
              </div>
            </fieldset>

            <div class="pt-4 border-t border-slate-200">
              <button 
                type="button" 
                onclick="CheckoutView.processPayment()" 
                class="w-full py-4 bg-[#E11D48] hover:bg-[#BE123C] text-white text-base font-extrabold rounded-xl transition shadow-lg flex items-center justify-center gap-2 touch-target"
              >
                <i data-lucide="lock" class="w-5 h-5"></i>
                <span>Proceder al Pago ($${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderConfirmation() {
    const order = Store.getOrderById(Store.data.activeTrackingOrderId);
    if (!order) {
      return `
        <div class="max-w-3xl mx-auto px-4 pt-10 text-center">
          <p class="text-sm text-slate-600">No hay una orden recién procesada.</p>
          <a href="#catalog" class="mt-4 inline-block px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-xl">Ir al Catálogo</a>
        </div>
      `;
    }

    const isCash = order.paymentMethod.includes('Efectivo');

    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div class="w-16 h-16 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center mx-auto mb-4">
            <i data-lucide="check-circle-2" class="w-10 h-10"></i>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">¡Orden confirmada con éxito!</h1>
          <div class="inline-block px-3 py-1 bg-[#FEF3C7] text-[#D97706] font-mono font-bold text-sm rounded-md mt-2">
            Número de Orden: ${order.orderId}
          </div>

          ${isCash ? `
            <div class="my-4 p-4 bg-[#FEF3C7]/60 border border-[#D97706]/40 rounded-xl text-[#0F172A] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
              <i data-lucide="store" class="w-5 h-5 text-[#D97706] flex-shrink-0"></i>
              <span>Orden reservada. Realiza el pago en ventanilla al retirar en Sucursal Central Quito.</span>
            </div>
          ` : ''}

          <p class="text-sm text-slate-600 mt-3 max-w-lg mx-auto">
            Comprobante electrónico y registro de custodia enviados a: 
            <strong class="text-[#0F172A]">${order.buyerEmail}</strong>
          </p>

          <div class="mt-6 text-left bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 max-w-2xl mx-auto space-y-2.5 text-xs sm:text-sm">
            <h2 class="font-black text-[#0F172A] text-sm uppercase tracking-wider mb-2">Desglose de la Transacción</h2>
            ${order.items.map(item => `
              <div class="flex justify-between text-slate-600">
                <span>${item.quantity}x ${item.name} (${item.condition})</span>
                <span class="font-bold text-[#0F172A]">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            `).join('')}
            <div class="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
              <span>${order.deliveryMethod}:</span>
              <span class="font-bold text-[#0F172A]">$${order.shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Impuestos (IVA 15%):</span>
              <span class="font-bold text-[#0F172A]">$${order.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between font-black text-base text-[#0F172A] border-t border-slate-300 pt-2">
              <span>Total Pagado (${order.paymentMethod}):</span>
              <span class="text-[#E11D48]">$${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <button 
              type="button"
              onclick="app.openOrderTracking('${order.orderId}')" 
              class="px-6 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 touch-target"
            >
              <i data-lucide="truck" class="w-4 h-4"></i>
              <span>Ver Seguimiento del Pedido</span>
            </button>
            <a 
              href="#profile" 
              class="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 touch-target"
            >
              <i data-lucide="history" class="w-4 h-4"></i>
              <span>Ver Historial en Mi Perfil</span>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderPaymentError() {
    return `
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div class="w-16 h-16 rounded-full bg-rose-100 text-[#E11D48] flex items-center justify-center mx-auto mb-4">
            <i data-lucide="alert-triangle" class="w-10 h-10"></i>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">No pudimos procesar tu pago</h1>
          <div class="inline-block px-3 py-1 bg-rose-100 text-[#E11D48] font-mono font-bold text-xs rounded-md mt-2">
            Código Bancario: #DECLINED-SEC-054
          </div>

          <div class="mt-6 text-left bg-rose-50/70 border border-rose-200 rounded-xl p-5 space-y-2">
            <h2 class="text-xs font-black text-rose-900 uppercase tracking-wider">Diagnóstico de la Operación</h2>
            <p class="text-xs sm:text-sm text-rose-800 leading-relaxed">
              La transacción fue rechazada por el banco emisor debido a límites de seguridad diarios o verificación 3D Secure.
            </p>
            <div class="flex items-center gap-1.5 text-[#059669] text-xs font-bold pt-1">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>Tranquilidad garantizada: NO se ha realizado ningún cargo a tu tarjeta.</span>
            </div>
          </div>

          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a 
              href="#checkout" 
              class="px-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-bold rounded-xl transition shadow flex items-center justify-center gap-2 touch-target"
            >
              <i data-lucide="credit-card" class="w-4 h-4"></i>
              <span>Reintentar con otra tarjeta</span>
            </a>

            <button 
              type="button" 
              onclick="CheckoutView.switchToCashPickup()" 
              class="px-6 py-3.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 touch-target"
            >
              <i data-lucide="store" class="w-4 h-4"></i>
              <span>Cambiar a Retiro en Tienda y Efectivo</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderAuth() {
    const isLogin = this.authTab === 'login';
    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="text-center mb-6">
          <h1 class="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Portal de Coleccionistas • Graded &amp; Sealed</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Inicia sesión o registra tu cuenta para gestionar perfil, custodia y seguimiento</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          <div class="flex border-b border-slate-200 mb-6">
            <button 
              type="button" 
              onclick="CheckoutView.switchAuthTab('login')" 
              class="flex-1 py-2.5 text-xs font-extrabold border-b-2 transition ${isLogin ? 'border-[#E11D48] text-[#0F172A]' : 'border-transparent text-slate-400 hover:text-[#0F172A]'}"
            >
              Iniciar Sesión
            </button>
            <button 
              type="button" 
              onclick="CheckoutView.switchAuthTab('register')" 
              class="flex-1 py-2.5 text-xs font-extrabold border-b-2 transition ${!isLogin ? 'border-[#E11D48] text-[#0F172A]' : 'border-transparent text-slate-400 hover:text-[#0F172A]'}"
            >
              Crear Cuenta
            </button>
          </div>

          ${isLogin ? `
            <form onsubmit="event.preventDefault(); CheckoutView.submitLogin();" class="space-y-4">
              <div>
                <label for="auth-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                <input type="email" id="auth-email" placeholder="tu.correo@ejemplo.com" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label for="auth-password" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña: *</label>
                <input type="password" id="auth-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <button type="submit" class="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-extrabold rounded-xl transition shadow touch-target">
                Acceder a mi Cuenta
              </button>
            </form>
          ` : `
            <form onsubmit="event.preventDefault(); CheckoutView.submitRegister();" class="space-y-3.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="reg-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nombre Completo: *</label>
                  <input type="text" id="reg-name" placeholder="Ej. Ana Lucía" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label for="reg-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula (10 dígitos): *</label>
                  <input type="text" id="reg-id" maxlength="10" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,10)" placeholder="1710034065" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label for="reg-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo Electrónico: *</label>
                <input type="email" id="reg-email" placeholder="coleccionista@ejemplo.com" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="reg-city" class="block text-xs font-bold text-[#0F172A] mb-1">Ciudad:</label>
                  <input type="text" id="reg-city" placeholder="Quito" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label for="reg-phone" class="block text-xs font-bold text-[#0F172A] mb-1">Celular (+593):</label>
                  <input type="tel" id="reg-phone" maxlength="10" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,10)" placeholder="0991234567" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label for="reg-pass" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña: *</label>
                <input type="password" id="reg-pass" placeholder="••••••••" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <label class="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                <input type="checkbox" id="reg-terms" required class="mt-0.5 rounded text-[#E11D48]" />
                <span>Acepto los protocolos de custodia y términos de Graded &amp; Sealed TCG</span>
              </label>
              <button type="submit" class="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-extrabold rounded-xl transition shadow touch-target">
                Registrar mi Cuenta
              </button>
            </form>
          `}
        </div>
      </div>
    `;
  },

  switchAuthTab(tab) {
    this.authTab = tab;
    app.renderCurrentView();
  },

  validateIdInput(inputEl) {
    inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 10);
    const errEl = document.getElementById('guest-id-error');
    if (!errEl) return;
    if (inputEl.value.length === 0) {
      errEl.classList.add('hidden');
      inputEl.classList.remove('border-[#E11D48]', 'border-[#059669]');
      return;
    }
    const valid = Store.isValidEcuadorianId(inputEl.value);
    errEl.classList.toggle('hidden', valid);
    inputEl.classList.toggle('border-[#E11D48]', !valid);
    inputEl.classList.toggle('border-[#059669]', valid);
  },

  setDelivery(method) {
    Store.data.deliveryMethod = method;
    Store.data.shippingFee = method === 'pickup' ? APP_CONFIG.PICKUP_SHIPPING_FEE : APP_CONFIG.COURIER_SHIPPING_FEE;
    app.renderCurrentView();
    app.showToast(
      method === 'pickup'
        ? 'Entrega: Retiro en Local Central ($0.00). Efectivo habilitado.'
        : 'Entrega: Envío Blindado a Domicilio ($5.00).',
      'info'
    );
  },

  switchToCashPickup() {
    Store.data.deliveryMethod = 'pickup';
    Store.data.shippingFee = APP_CONFIG.PICKUP_SHIPPING_FEE;
    window.location.hash = '#checkout';
    setTimeout(() => {
      const cashRadio = document.getElementById('payment-cash-input');
      if (cashRadio) cashRadio.checked = true;
    }, 60);
    app.showToast('Cambiado a Retiro en Tienda y Pago en Efectivo.', 'success');
  },

  handleQuickLogin() {
    const emailEl = document.getElementById('login-email-checkout');
    const passEl = document.getElementById('login-pass-checkout');
    if (!emailEl || !passEl) return;
    app.loginUser(emailEl.value, passEl.value, false);
    app.renderCurrentView();
  },

  submitLogin() {
    const emailEl = document.getElementById('auth-email');
    const passEl = document.getElementById('auth-password');
    if (!emailEl || !passEl) return;
    app.loginUser(emailEl.value, passEl.value, true);
  },

  submitRegister() {
    const name = document.getElementById('reg-name')?.value.trim();
    const idCard = document.getElementById('reg-id')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const city = document.getElementById('reg-city')?.value.trim() || 'Quito';
    const phoneRaw = document.getElementById('reg-phone')?.value.trim() || '0991234567';

    if (!Store.isValidEcuadorianId(idCard)) {
      app.showToast('La cédula ingresada no supera la validación Módulo 10.', 'error');
      return;
    }

    const newUser = {
      name,
      idCard,
      email,
      phone: `+593 ${phoneRaw.replace(/^\+593\s*/, '')}`,
      city,
      address: 'Av. República del Salvador y Naciones Unidas, Quito'
    };

    Store.data.currentUser = newUser;
    Store.data.users.push(newUser);
    Store.saveUserSession();
    app.updateNavbarUserUI();
    app.showToast(`¡Cuenta creada con éxito, ${newUser.name}!`, 'success');
    window.location.hash = '#profile';
  },

  processPayment() {
    if (Store.data.cart.length === 0) {
      app.showToast('Tu bolsa de compras está vacía.', 'error');
      window.location.hash = '#catalog';
      return;
    }

    const nameInput = document.getElementById('guest-name');
    const idInput = document.getElementById('guest-id');
    const emailInput = document.getElementById('guest-email');
    const phoneInput = document.getElementById('guest-phone');

    if (!nameInput?.value.trim() || !emailInput?.value.trim()) {
      app.showToast('Completa todos los datos obligatorios de facturación.', 'error');
      return;
    }

    if (!idInput || !Store.isValidEcuadorianId(idInput.value)) {
      if (idInput) {
        this.validateIdInput(idInput);
        idInput.focus();
      }
      app.showToast('Cédula ecuatoriana inválida (validación Módulo 10).', 'error');
      return;
    }

    const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'card';

    const buildOrderRecord = (methodLabel) => {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const orderId = `#PKM-2026-${randomNum}`;
      const { subtotal, shipping, tax, total } = Store.getCartTotals();
      const now = new Date();
      const formattedDate = now.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        orderId,
        date: formattedDate,
        status: 'En Preparación / En Custodia',
        buyerName: nameInput.value.trim(),
        buyerId: idInput.value.trim(),
        buyerEmail: emailInput.value.trim(),
        buyerPhone: `+593 ${(phoneInput?.value || '').trim()}`,
        paymentMethod: methodLabel,
        deliveryMethod: Store.data.deliveryMethod === 'courier'
          ? 'Envío Blindado a Domicilio ($5.00)'
          : 'Retiro en Local Central ($0.00)',
        items: [...Store.data.cart],
        subtotal,
        tax,
        shipping,
        total
      };
    };

    if (paymentMethod === 'cash') {
      const orderObj = buildOrderRecord('Efectivo en Tienda');
      Store.addOrder(orderObj);
      Store.data.cart = [];
      Store.saveCart();
      app.updateCartBadge();
      app.showToast(`Orden ${orderObj.orderId} reservada para pago en tienda.`, 'success');
      window.location.hash = '#confirmation';
      return;
    }

    const cardNumInput = document.getElementById('card-number');
    const cardNum = (cardNumInput ? cardNumInput.value : '').replace(/\s+/g, '');
    const isSimulatedFailure = cardNum.endsWith('0000');

    const modal = document.getElementById('payment-modal');
    const modalText = document.getElementById('payment-modal-text');
    const progressBar = document.getElementById('payment-progress-bar');

    if (modal) modal.classList.add('active');
    if (progressBar) progressBar.style.width = '25%';
    if (modalText) modalText.innerText = 'Conectando con pasarela bancaria TLS 256-bit...';

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '75%';
      if (modalText) modalText.innerText = 'Verificando autenticación 3D Secure y custodia...';
    }, 900);

    setTimeout(() => {
      if (progressBar) progressBar.style.width = '100%';
      if (modal) modal.classList.remove('active');

      if (isSimulatedFailure) {
        app.showToast('Transacción denegada por el banco (#DECLINED-SEC-054)', 'error');
        window.location.hash = '#error';
      } else {
        const orderObj = buildOrderRecord('Tarjeta de Crédito / Débito');
        Store.addOrder(orderObj);
        Store.data.cart = [];
        Store.saveCart();
        app.updateCartBadge();
        app.showToast(`¡Pago confirmado! Orden ${orderObj.orderId} registrada.`, 'success');
        window.location.hash = '#confirmation';
      }
    }, 1900);
  }
};

