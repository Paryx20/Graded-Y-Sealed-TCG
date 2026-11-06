const CheckoutView = {
  authTab: 'login',

  renderCheckout() {
    const user = Store.data.currentUser;
    const isPickup = Store.data.deliveryMethod === 'pickup';
    const isQuito = Store.data.deliveryMethod === 'quito' || Store.data.deliveryMethod === 'local_express';
    const isCourier = !isPickup && !isQuito;
    const { total } = Store.getCartTotals();
    const rawPhone = user && user.phone ? user.phone.replace(/^\+593\s*/, '').replace(/\D/g, '') : '';

    if (!Store.data.cart || Store.data.cart.length === 0) {
      return `
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div class="bg-white border border-slate-200 rounded-lg p-10 text-center shadow-sm">
            <i data-lucide="shopping-bag" class="w-14 h-14 mx-auto mb-3 text-slate-300" aria-hidden="true"></i>
            <h1 id="checkout-empty-title" class="text-xl font-bold text-[#0F172A]">Tu bolsa está vacía</h1>
            <p class="text-sm text-slate-600 mt-2 max-w-sm mx-auto">Para finalizar una compra primero agrega productos a tu bolsa.</p>
            <a href="pages/catalogo.html" class="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md shadow-sm transition touch-target">
              <i data-lucide="compass" class="w-4 h-4" aria-hidden="true"></i>
              <span>Ver el catálogo</span>
            </a>
          </div>
        </div>
      `;
    }

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <h1 class="sr-only">Finalizar compra</h1>
        <div class="bg-[#0F172A] text-white rounded-md px-4 py-3 flex items-center justify-between mb-6 shadow-sm">
          <div class="flex items-center gap-2 text-xs font-bold">
            <i data-lucide="lock" class="w-4 h-4 text-[#047857]"></i>
            <span>Pago Seguro y Protegido</span>
          </div>
          <span class="text-xs text-slate-300">Tus datos viajan cifrados</span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 class="text-base font-bold text-[#0F172A]">${user ? 'Tu cuenta' : 'Inicia sesión'}</h2>
              <span class="text-xs font-bold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded">${user ? 'Sesión iniciada' : 'Necesaria'}</span>
            </div>

            ${user ? `
              <div class="mt-4 space-y-3">
                <p class="text-xs text-slate-600">Usamos los datos de tu perfil para este pedido.</p>
                <div class="p-3.5 rounded-md bg-[#F8FAFC] border border-slate-200 text-xs space-y-1">
                  <div class="font-bold text-[#0F172A]">${user.name}</div>
                  <div class="text-slate-500">${user.email}</div>
                  <div class="text-slate-500">Cédula/RUC: ${user.idCard || user.cedula_ruc || 'No registrada'}</div>
                  <div class="text-slate-500">Tel: ${user.phone || user.telefono || 'No registrado'}</div>
                </div>
                <a href="pages/perfil.html" class="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-md transition flex items-center justify-center gap-1.5">
                  <i data-lucide="user-check" class="w-4 h-4"></i>
                  <span>Ver mi perfil</span>
                </a>
              </div>
            ` : `
              <div class="mt-3 space-y-3">
                <p class="text-xs text-slate-600">Para comprar necesitas una cuenta: así puedes seguir tu pedido y recibir tu factura. Si ya tienes una, inicia sesión:</p>
                <form onsubmit="event.preventDefault(); CheckoutView.handleQuickLogin();" class="mt-2 space-y-3" novalidate>
                  <div>
                    <label for="login-email-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Correo electrónico:</label>
                    <input type="email" id="login-email-checkout" autocomplete="email" placeholder="tu.correo@ejemplo.com" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                  </div>
                  <div>
                    <label for="login-pass-checkout" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña:</label>
                    <input type="password" id="login-pass-checkout" autocomplete="current-password" placeholder="••••••••" class="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                  </div>
                  <p data-form-error role="alert" class="hidden text-xs text-[#BE123C] font-semibold"></p>
                  <button type="submit" class="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold rounded-lg transition touch-target">
                    Iniciar sesión
                  </button>
                </form>
                <p class="text-xs text-slate-500">¿Primera compra? Completa el formulario y creamos tu cuenta al confirmar el pedido.</p>
              </div>
            `}
          </div>

          <div class="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 class="text-lg font-bold text-[#0F172A]">Datos de facturación y entrega</h2>
                <p class="text-xs text-slate-500 mt-0.5">Los usamos para tu factura electrónica y para el envío.</p>
              </div>
              
            </div>

            <fieldset class="space-y-4">
              <legend class="text-sm font-semibold text-[#0F172A]">1. Datos personales</legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="guest-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nombre completo: *</label>
                  <input type="text" id="guest-name" value="${user ? user.name : ''}" autocomplete="name" placeholder="Ej. Carlos Mendoza" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                <div>
                  <label for="guest-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula o RUC: *</label>
                  <input 
                    type="text" 
                    id="guest-id" 
                    value="${user && (user.idCard || user.cedula_ruc) ? (user.idCard || user.cedula_ruc) : ''}" 
                    autocomplete="off" placeholder="Ej. 1710034065 o 1710034065001" 
                    maxlength="13"
                    inputmode="numeric"
                    oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 13)"
                    class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white transition" 
                    required
                    aria-describedby="guest-id-help"
                  />
                  <span id="guest-id-help" class="text-xs text-slate-500 mt-1 block">Solo para tu factura electrónica. También te sirve para buscar tu pedido sin iniciar sesión.</span>
                </div>

                <div>
                  <label for="guest-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo electrónico: *</label>
                  <input type="email" id="guest-email" value="${user ? user.email : ''}" autocomplete="email" placeholder="carlos@correo.com" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                <div>
                  <label for="guest-phone" class="block text-xs font-bold text-[#0F172A] mb-1">Celular: *</label>
                  <div data-field class="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
                    <span class="inline-flex items-center px-3.5 bg-slate-100 text-slate-700 text-sm font-bold border-r border-slate-200 select-none">
                      +593
                    </span>
                    <input 
                      type="tel" 
                      id="guest-phone" inputmode="numeric" 
                      value="${rawPhone}" 
                      autocomplete="tel-national" placeholder="0991234567" 
                      maxlength="10" 
                      oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)"
                      class="flex-1 px-3.5 py-2 text-sm bg-[#F8FAFC] focus:bg-white" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label for="guest-address" class="block text-xs font-bold text-[#0F172A] mb-1">Dirección de entrega: *</label>
                  <input type="text" id="guest-address" value="${user ? (user.address || user.direccion_principal || '') : ''}" autocomplete="street-address" placeholder="Av. República del Salvador N34-183" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                <div>
                  <label for="guest-city" class="block text-xs font-bold text-[#0F172A] mb-1">Ciudad: *</label>
                  <input type="text" id="guest-city" value="${user ? (user.city || user.ciudad || '') : ''}" autocomplete="address-level2" placeholder="Quito" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                </div>

                ${user ? `
                  <div class="sm:col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                    <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
                    <span>Compras como <strong>${user.name}</strong>. El pedido quedará en tu historial.</span>
                  </div>
                ` : `
                  <div class="sm:col-span-2">
                    <label for="checkout-password" class="block text-xs font-bold text-[#0F172A] mb-1">Crea una contraseña para tu cuenta: *</label>
                    <input type="password" id="checkout-password" autocomplete="new-password" placeholder="Mínimo 8 caracteres, con letras y números" minlength="8" class="w-full px-3.5 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg focus:bg-white" required />
                    <span class="text-xs text-slate-500 mt-1 block">Con ella podrás ver tus pedidos y seguir el envío.</span>
                  </div>
                `}
              </div>
            </fieldset>

            <fieldset class="space-y-3">
              <legend class="text-sm font-semibold text-[#0F172A]">2. Entrega</legend>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label class="p-3.5 rounded-md cursor-pointer flex flex-col justify-between transition ${isCourier ? 'border-2 border-[#0F172A] bg-slate-50' : 'border border-slate-300 bg-white hover:bg-slate-50'}">
                  <div class="flex items-start gap-2.5">
                    <input type="radio" name="delivery-method" value="courier" ${isCourier ? 'checked' : ''} onchange="CheckoutView.setDelivery('courier')" class="mt-0.5 text-[#BE123C]" />
                    <div>
                      <div class="text-xs font-bold text-[#0F172A]">Envío nacional</div>
                      <span class="text-xs font-bold text-[#BE123C]">$5.00</span>
                      <p class="text-xs text-slate-500 mt-0.5">A todo Ecuador, con empaque protegido.</p>
                    </div>
                  </div>
                </label>

                <label class="p-3.5 rounded-md cursor-pointer flex flex-col justify-between transition ${isQuito ? 'border-2 border-[#0F172A] bg-slate-50' : 'border border-slate-300 bg-white hover:bg-slate-50'}">
                  <div class="flex items-start gap-2.5">
                    <input type="radio" name="delivery-method" value="quito" ${isQuito ? 'checked' : ''} onchange="CheckoutView.setDelivery('quito')" class="mt-0.5 text-[#BE123C]" />
                    <div>
                      <div class="text-xs font-bold text-[#0F172A]">Local Express (Quito)</div>
                      <span class="text-xs font-bold text-[#BE123C]">$3.00</span>
                      <p class="text-xs text-slate-500 mt-0.5">Entrega en Quito en 24 horas.</p>
                    </div>
                  </div>
                </label>

                <label class="p-3.5 rounded-md cursor-pointer flex flex-col justify-between transition ${isPickup ? 'border-2 border-[#0F172A] bg-slate-50' : 'border border-slate-300 bg-white hover:bg-slate-50'}">
                  <div class="flex items-start gap-2.5">
                    <input type="radio" name="delivery-method" value="pickup" ${isPickup ? 'checked' : ''} onchange="CheckoutView.setDelivery('pickup')" class="mt-0.5 text-[#BE123C]" />
                    <div>
                      <div class="text-xs font-bold text-[#0F172A]">Retiro en tienda</div>
                      <span class="text-xs font-bold text-[#047857]">$0.00 (Gratis)</span>
                      <p class="text-xs text-slate-500 mt-0.5">En nuestra tienda de Quito. Puedes pagar en efectivo.</p>
                    </div>
                  </div>
                </label>
              </div>
            </fieldset>

            <fieldset class="space-y-3">
              <legend class="text-sm font-semibold text-[#0F172A]">3. Pago</legend>
              <div class="space-y-3">
                <div class="p-4 rounded-md border border-[#0F172A] bg-[#F8FAFC] space-y-3">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-3">
                      <input type="radio" name="payment-method" value="card" checked class="text-[#BE123C]" />
                      <div>
                        <span class="text-sm font-bold text-[#0F172A]">Tarjeta de crédito o débito</span>
                        <span class="text-xs text-slate-500 block">Visa, Mastercard</span>
                      </div>
                    </div>
                    <i data-lucide="credit-card" class="w-5 h-5 text-slate-500"></i>
                  </label>

                  <div id="card-fields" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div class="sm:col-span-3">
                      <label for="card-holder" class="block text-xs font-bold text-slate-700 mb-1">Nombre del titular (como aparece en la tarjeta):</label>
                      <input type="text" id="card-holder" value="${user ? String(user.name || '').toUpperCase() : ''}" autocomplete="cc-name" placeholder="CARLOS MENDOZA" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg uppercase" />
                    </div>
                    <div class="sm:col-span-3">
                      <label for="card-number" class="block text-xs font-bold text-slate-700 mb-1">Número de tarjeta:</label>
                      <div data-field class="flex items-center bg-white border border-slate-300 rounded-lg overflow-hidden">
                        <input type="text" id="card-number" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="0000 0000 0000 0000" oninput="CheckoutView.formatCardNumber(this)" class="flex-1 px-3 py-2 text-sm bg-transparent font-mono tracking-wide" />
                        <span id="card-brand" class="px-3 text-xs font-bold text-slate-500 uppercase"></span>
                      </div>
                    </div>
                    <div>
                      <label for="card-exp" class="block text-xs font-bold text-slate-700 mb-1">Expiración:</label>
                      <input type="text" id="card-exp" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/AA" oninput="CheckoutView.formatExpiry(this)" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label for="card-cvv" class="block text-xs font-bold text-slate-700 mb-1">CVV/CVC:</label>
                      <input type="password" id="card-cvv" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="3" oninput="this.value = this.value.replace(/\\D/g, '')" class="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <label class="p-3.5 rounded-md border flex items-center justify-between transition ${isPickup ? 'border-slate-300 bg-white cursor-pointer hover:bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'}">
                  <div class="flex items-center gap-3">
                    <input type="radio" name="payment-method" id="payment-cash-input" value="cash" ${isPickup ? '' : 'disabled'} class="text-[#BE123C]" />
                    <div>
                      <span class="text-sm font-bold ${isPickup ? 'text-[#0F172A]' : 'text-slate-600'}">Efectivo al retirar en tienda</span>
                      <span class="text-xs text-slate-600 block">${isPickup ? 'Pagas en la tienda al retirar' : 'Solo disponible seleccionando "Retiro en tienda"'}</span>
                    </div>
                  </div>
                  <i data-lucide="banknote" class="w-5 h-5 text-slate-500"></i>
                </label>
              </div>
            </fieldset>

            <div class="pt-4 border-t border-slate-200">
              <button 
                type="button" 
                onclick="CheckoutView.processPayment()" 
                class="w-full py-4 bg-[#E11D48] hover:bg-[#BE123C] text-white text-base font-semibold rounded-md transition shadow-lg flex items-center justify-center gap-2 touch-target"
              >
                <i data-lucide="lock" class="w-5 h-5"></i>
                <span>Proceder al Pago ($${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD)</span>
              </button>
              <p class="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                <span>Proyecto académico: el pago es simulado y no se realiza ningún cargo real.</span>
              </p>
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
          <h1 class="text-lg font-bold text-[#0F172A]">No hay una orden recién procesada</h1>
          <p class="text-sm text-slate-600 mt-1">Cuando completes una compra verás aquí su resumen.</p>
          <a href="pages/catalogo.html" class="mt-4 inline-block px-5 py-2.5 bg-[#E11D48] text-white text-xs font-bold rounded-md">Ir al catálogo</a>
        </div>
      `;
    }

    const isCash = order.paymentMethod.includes('Efectivo');

    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm text-center">
          <div class="w-16 h-16 rounded-full bg-[#D1FAE5] text-[#047857] flex items-center justify-center mx-auto mb-4">
            <i data-lucide="check-circle-2" class="w-10 h-10"></i>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">¡Gracias! Tu pedido está confirmado</h1>
          <div class="inline-block px-3 py-1 bg-[#FEF3C7] text-[#B45309] font-mono font-bold text-sm rounded-md mt-2">
            Número de Orden: ${order.orderId}
          </div>

          ${isCash ? `
            <div class="my-4 p-4 bg-[#FEF3C7]/60 border border-[#D97706]/40 rounded-md text-[#0F172A] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
              <i data-lucide="store" class="w-5 h-5 text-[#B45309] flex-shrink-0"></i>
              <span>Pedido reservado. Pagas en efectivo al retirarlo en nuestra tienda de Quito.</span>
            </div>
          ` : ''}

          <p class="text-sm text-slate-600 mt-3 max-w-lg mx-auto">
            Enviamos la factura electrónica a: 
            <strong class="text-[#0F172A]">${order.buyerEmail}</strong>
          </p>

          <div class="mt-6 text-left bg-[#F8FAFC] border border-slate-200 rounded-md p-5 max-w-2xl mx-auto space-y-2.5 text-xs sm:text-sm">
            <h2 class="font-bold text-[#0F172A] text-sm mb-2">Resumen del pago</h2>
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
            <div class="flex justify-between font-bold text-base text-[#0F172A] border-t border-slate-300 pt-2">
              <span>${isCash ? 'Total a pagar al retirar (efectivo)' : `Total pagado (${order.paymentMethod})`}:</span>
              <span class="text-[#BE123C]">$${order.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <button 
              type="button"
              onclick="app.openOrderTracking('${order.orderId}')" 
              class="px-6 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold rounded-md transition flex items-center gap-2 touch-target"
            >
              <i data-lucide="truck" class="w-4 h-4"></i>
              <span>Seguir mi pedido</span>
            </button>
            <a 
              href="pages/seguimiento.html"
              class="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-bold rounded-md transition flex items-center gap-2 touch-target"
            >
              <i data-lucide="history" class="w-4 h-4"></i>
              <span>Ver mis pedidos</span>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderPaymentError() {
    const err = Store.data.lastPaymentError || {
      code: 'RECHAZADA',
      title: 'Transacción rechazada',
      message: 'La transacción fue rechazada por el banco emisor.'
    };
    const isCancelled = !!err.cancelled || /^CANCELADO/.test(err.code || '');
    if (typeof document !== 'undefined' && isCancelled) document.title = 'Pago cancelado | Graded & Sealed TCG';
    return `
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm text-center">
          <div class="w-16 h-16 rounded-full ${isCancelled ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-[#BE123C]'} flex items-center justify-center mx-auto mb-4">
            <i data-lucide="${isCancelled ? 'circle-slash' : 'credit-card'}" class="w-9 h-9" aria-hidden="true"></i>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">${isCancelled ? 'Pago cancelado' : 'No pudimos procesar tu pago'}</h1>
          <div class="inline-block px-3 py-1 ${isCancelled ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-[#BE123C]'} font-mono font-bold text-xs rounded-md mt-2">
            ${isCancelled ? 'Estado' : 'Código bancario'}: ${err.code}
          </div>

          <div class="mt-6 text-left bg-rose-50/70 border border-rose-200 rounded-md p-5 space-y-2">
            <h2 class="text-xs font-bold text-rose-900 uppercase tracking-wider">${err.title}</h2>
            <p class="text-xs sm:text-sm text-rose-800 leading-relaxed">${err.message}</p>
            ${err.cardLast4 ? `<p class="text-xs text-rose-700">Tarjeta ${err.brand || ''} terminada en <strong>${err.cardLast4}</strong></p>` : ''}
            <div class="flex items-center gap-1.5 text-[#047857] text-xs font-bold pt-1">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
              <span>No se realizó ningún cargo y la orden no fue creada. Tu bolsa sigue intacta.</span>
            </div>
          </div>

          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="pages/checkout.html"
              class="px-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs sm:text-sm font-bold rounded-md transition shadow flex items-center justify-center gap-2 touch-target"
            >
              <i data-lucide="credit-card" class="w-4 h-4"></i>
              <span>${isCancelled ? 'Volver a intentar el pago' : 'Reintentar con otra tarjeta'}</span>
            </a>

            <a
              href="pages/carrito.html"
              class="px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-bold rounded-md transition flex items-center justify-center gap-2 touch-target"
            >
              <i data-lucide="shopping-bag" class="w-4 h-4" aria-hidden="true"></i>
              <span>Volver a la bolsa</span>
            </a>

            <button
              type="button"
              onclick="CheckoutView.switchToCashPickup()"
              class="px-6 py-3.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs sm:text-sm font-bold rounded-md transition flex items-center justify-center gap-2 touch-target"
            >
              <i data-lucide="store" class="w-4 h-4"></i>
              <span>Retirar en tienda y pagar en efectivo</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderAuth(tab) {
    if (tab) this.authTab = tab;
    if (this.authTab === 'recover') return this.renderRecover();
    const isLogin = this.authTab === 'login';
    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="text-center mb-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">Tu cuenta</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Inicia sesión o crea una cuenta para comprar y seguir tus pedidos.</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          <div class="flex border-b border-slate-200 mb-6" role="group" aria-label="Acceso a tu cuenta">
            <button 
              type="button" 
              onclick="CheckoutView.switchAuthTab('login')" 
              aria-pressed="${isLogin}"
              class="flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${isLogin ? 'border-[#E11D48] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-[#0F172A]'}"
            >
              Iniciar Sesión
            </button>
            <button 
              type="button" 
              onclick="CheckoutView.switchAuthTab('register')" 
              aria-pressed="${!isLogin}"
              class="flex-1 py-2.5 text-xs font-semibold border-b-2 transition ${!isLogin ? 'border-[#E11D48] text-[#0F172A]' : 'border-transparent text-slate-500 hover:text-[#0F172A]'}"
            >
              Crear Cuenta
            </button>
          </div>

          ${isLogin ? `
            <form onsubmit="event.preventDefault(); CheckoutView.submitLogin();" class="space-y-4" novalidate>
              <div>
                <label for="auth-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo electrónico: *</label>
                <input type="email" id="auth-email" autocomplete="email" placeholder="tu.correo@ejemplo.com" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label for="auth-password" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña: *</label>
                <input type="password" id="auth-password" autocomplete="current-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                <div class="text-right mt-1.5">
                  <button type="button" id="auth-forgot-link" onclick="CheckoutView.switchAuthTab('recover')" class="text-xs font-semibold text-[#BE123C] hover:underline">¿Olvidaste tu contraseña?</button>
                </div>
              </div>
              <p data-form-error role="alert" class="hidden text-xs text-[#BE123C] font-semibold"></p>
              <button type="submit" class="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition shadow touch-target">
                Acceder a mi Cuenta
              </button>
            </form>
            <p class="text-center text-xs text-slate-500 mt-4">
              ¿Aún no tienes cuenta?
              <button type="button" onclick="CheckoutView.switchAuthTab('register')" class="font-semibold text-[#BE123C] hover:underline">Regístrate aquí</button>
            </p>
          ` : `
            <form onsubmit="event.preventDefault(); CheckoutView.submitRegister();" class="space-y-3.5" novalidate>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="reg-name" class="block text-xs font-bold text-[#0F172A] mb-1">Nombre completo: *</label>
                  <input type="text" id="reg-name" autocomplete="name" placeholder="Ej. Ana Lucía Pérez" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label for="reg-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula o RUC: *</label>
                  <input type="text" id="reg-id" inputmode="numeric" maxlength="13" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,13)" autocomplete="off" placeholder="1710034065" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label for="reg-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo electrónico: *</label>
                <input type="email" id="reg-email" autocomplete="email" placeholder="coleccionista@ejemplo.com" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label for="reg-city" class="block text-xs font-bold text-[#0F172A] mb-1">Ciudad: *</label>
                  <input type="text" id="reg-city" autocomplete="address-level2" placeholder="Quito" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label for="reg-phone" class="block text-xs font-bold text-[#0F172A] mb-1">Celular: *</label>
                  <input type="tel" id="reg-phone" inputmode="numeric" maxlength="10" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,10)" autocomplete="tel-national" placeholder="0991234567" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label for="reg-address" class="block text-xs font-bold text-[#0F172A] mb-1">Dirección de entrega: *</label>
                <input type="text" id="reg-address" autocomplete="street-address" placeholder="Av. República del Salvador N34-183 y Moscú" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label for="reg-pass" class="block text-xs font-bold text-[#0F172A] mb-1">Contraseña: *</label>
                <input type="password" id="reg-pass" autocomplete="new-password" placeholder="Mínimo 8 caracteres, con letras y números" class="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <p data-form-error role="alert" class="hidden text-xs text-[#BE123C] font-semibold"></p>
              <button type="submit" class="w-full py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold rounded-md transition shadow touch-target">
                Registrar mi Cuenta
              </button>
            </form>
          `}
        </div>
      </div>
    `;
  },

  // "Olvidé mi contraseña": se verifica con el correo y la cédula de la cuenta
  renderRecover() {
    return `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm max-w-lg mx-auto">
          <div class="flex items-start gap-3 mb-5">
            <div class="w-10 h-10 rounded-md bg-[#0F172A] text-[#FEF3C7] flex items-center justify-center flex-shrink-0">
              <i data-lucide="key-round" class="w-5 h-5" aria-hidden="true"></i>
            </div>
            <div>
              <h1 class="text-xl font-bold text-[#0F172A] tracking-tight">Recuperar contraseña</h1>
              <p class="text-xs text-slate-600 mt-0.5">Para confirmar que la cuenta es tuya, escribe el correo y la cédula con los que te registraste. Luego elige una contraseña nueva.</p>
            </div>
          </div>
          <form onsubmit="event.preventDefault(); CheckoutView.submitRecover();" class="space-y-4" novalidate>
            <div>
              <label for="rec-email" class="block text-xs font-bold text-[#0F172A] mb-1">Correo de tu cuenta: *</label>
              <input type="email" id="rec-email" autocomplete="email" placeholder="tu.correo@ejemplo.com" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
            </div>
            <div>
              <label for="rec-id" class="block text-xs font-bold text-[#0F172A] mb-1">Cédula o RUC de tu cuenta: *</label>
              <input type="text" id="rec-id" inputmode="numeric" maxlength="13" oninput="this.value = this.value.replace(/\\D/g, '').slice(0,13)" autocomplete="off" placeholder="1710034065" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="rec-pass" class="block text-xs font-bold text-[#0F172A] mb-1">Nueva contraseña: *</label>
                <input type="password" id="rec-pass" autocomplete="new-password" placeholder="Letras y números" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label for="rec-pass2" class="block text-xs font-bold text-[#0F172A] mb-1">Repítela: *</label>
                <input type="password" id="rec-pass2" autocomplete="new-password" class="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg" required />
              </div>
            </div>
            <p data-form-error role="alert" class="hidden text-xs text-[#BE123C] font-semibold"></p>
            <button type="submit" id="rec-submit" class="w-full py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition shadow touch-target">
              Guardar nueva contraseña
            </button>
          </form>
          <p class="text-center text-xs text-slate-600 mt-4">
            <button type="button" onclick="CheckoutView.switchAuthTab('login')" class="inline-flex items-center gap-1 font-semibold text-[#BE123C] hover:underline">
              <i data-lucide="arrow-left" class="w-4 h-4" aria-hidden="true"></i>
              Volver a iniciar sesión
            </button>
          </p>
        </div>
      </div>
    `;
  },

  RECOVER_RULES: {
    'rec-email': v => Validators.email(v),
    'rec-id': v => Validators.idCard(v),
    'rec-pass': v => Validators.password(v),
    'rec-pass2': v => {
      const first = document.getElementById('rec-pass');
      if (!v) return 'Repite la nueva contraseña.';
      return first && first.value !== v ? 'Las contraseñas no coinciden.' : '';
    }
  },

  async submitRecover() {
    if (!Validators.validateAll(this.RECOVER_RULES)) return;
    const val = id => document.getElementById(id).value.trim();
    const email = val('rec-email');
    const btn = document.getElementById('rec-submit');
    if (btn) btn.disabled = true;
    try {
      await SupabaseAPI.resetPassword(email, val('rec-id'), document.getElementById('rec-pass').value);
      app.showFormError('');
      this.authTab = 'login';
      app.renderCurrentView();
      const emailInput = document.getElementById('auth-email');
      if (emailInput) emailInput.value = email;
      const passInput = document.getElementById('auth-password');
      if (passInput) passInput.focus();
      app.showToast('Listo: tu contraseña cambió. Inicia sesión con la nueva.', 'success');
    } catch (err) {
      app.showFormError(err.message);
      app.showToast(err.message, 'error');
      if (btn) btn.disabled = false;
    }
  },

  REGISTER_RULES: {
    'reg-name': v => Validators.name(v),
    'reg-id': v => Validators.idCard(v),
    'reg-email': v => Validators.email(v),
    'reg-city': v => Validators.city(v),
    'reg-phone': v => Validators.phone(v),
    'reg-address': v => Validators.address(v),
    'reg-pass': v => Validators.password(v)
  },

  billingRules(needsPassword) {
    const rules = {
      'guest-name': v => Validators.name(v),
      'guest-id': v => Validators.idCard(v),
      'guest-email': v => Validators.email(v),
      'guest-phone': v => Validators.phone(v),
      'guest-address': v => Validators.address(v),
      'guest-city': v => Validators.city(v)
    };
    if (needsPassword) rules['checkout-password'] = v => Validators.password(v);
    return rules;
  },

  CARD_RULES: {
    'card-holder': v => Validators.cardHolder(v),
    'card-number': v => Validators.cardNumber(v),
    'card-exp': v => Validators.cardExpiry(v),
    'card-cvv': v => Validators.cardCvv(v)
  },

  afterAuthRender() {
    if (this.authTab === 'register') {
      Validators.attach(this.REGISTER_RULES);
    } else if (this.authTab === 'recover') {
      Validators.attach(this.RECOVER_RULES);
    } else {
      Validators.attach({ 'auth-email': v => Validators.email(v) });
    }
  },

  afterCheckoutRender() {
    if (new URLSearchParams(window.location.search).get('pago') === 'efectivo') {
      const cashRadio = document.getElementById('payment-cash-input');
      if (cashRadio) cashRadio.checked = true;
    }
    Validators.attach(this.billingRules(!Store.data.currentUser));
    Validators.attach(this.CARD_RULES);
  },

  afterRender() {
    if (typeof Store !== 'undefined') {
      if (Store.data.currentView === 'auth') {
        this.afterAuthRender();
      } else if (Store.data.currentView === 'checkout') {
        this.afterCheckoutRender();
      }
    }
  },

  switchAuthTab(tab) {
    this.authTab = tab;
    app.renderCurrentView();
  },

  formatCardNumber(inputEl) {
    const digits = inputEl.value.replace(/\D/g, '').slice(0, 19);
    inputEl.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    const brandEl = document.getElementById('card-brand');
    if (brandEl) brandEl.textContent = Validators.cardBrand(digits);
  },

  formatExpiry(inputEl) {
    let d = inputEl.value.replace(/\D/g, '').slice(0, 4);
    if (d.length === 1 && d > '1') d = '0' + d;
    inputEl.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  },

  setDelivery(method) {
    Store.data.deliveryMethod = method;
    Store.saveDelivery();
    if (method === 'pickup' || method === 'retiro') {
      Store.data.shippingFee = APP_CONFIG.PICKUP_SHIPPING_FEE;
      app.showToast('Entrega: Retiro en tienda ($0.00). Efectivo habilitado.', 'info');
    } else if (method === 'quito' || method === 'local' || method === 'local_express') {
      Store.data.shippingFee = APP_CONFIG.QUITO_SHIPPING_FEE;
      app.showToast('Entrega: Local Express Quito ($3.00).', 'info');
    } else {
      Store.data.deliveryMethod = 'courier';
      Store.data.shippingFee = APP_CONFIG.COURIER_SHIPPING_FEE;
      app.showToast('Entrega: Envío nacional ($5.00).', 'info');
    }
    app.renderCurrentView();
  },

  switchToCashPickup() {
    Store.data.deliveryMethod = 'pickup';
    Store.saveDelivery();
    app.go('checkout', { pago: 'efectivo' });
  },

  async handleQuickLogin() {
    const emailEl = document.getElementById('login-email-checkout');
    const passEl = document.getElementById('login-pass-checkout');
    if (!emailEl || !passEl) return;
    await app.loginUser(emailEl.value, passEl.value, false);
  },

  async submitLogin() {
    const emailEl = document.getElementById('auth-email');
    const passEl = document.getElementById('auth-password');
    if (!emailEl || !passEl) return;
    await app.loginUser(emailEl.value, passEl.value, true);
  },

  async submitRegister() {
    if (!Validators.validateAll(this.REGISTER_RULES)) {
      app.showToast('Revisa los campos marcados en rojo.', 'error');
      return;
    }
    const val = id => document.getElementById(id).value.trim();
    try {
      const user = await SupabaseAPI.register({
        name: val('reg-name').replace(/\s+/g, ' '),
        idCard: val('reg-id'),
        email: val('reg-email'),
        city: val('reg-city'),
        phone: `+593 ${Validators.normalizePhone(val('reg-phone'))}`,
        address: val('reg-address'),
        password: document.getElementById('reg-pass').value
      });
      await app.startSession(user);
      app.showToast(`¡Cuenta creada con éxito, ${user.name}!`, 'success');
      app.go('profile');
    } catch (err) {
      app.showFormError(err.message);
      app.showToast(err.message, 'error');
    }
  },

  // Botón "Cancelar pago" del diálogo de procesamiento
  cancelPayment() {
    this._paymentCancelled = true;
    const text = document.getElementById('payment-modal-text');
    if (text) text.innerText = 'Cancelando el pago...';
  },

  async processPayment() {
    if (Store.data.cart.length === 0) {
      app.showToast('Tu bolsa de compras está vacía.', 'error');
      app.go('catalog');
      return;
    }

    const soldOut = Store.data.cart.find(c => {
      const { sku, grade } = Store.parseCartItemId(c.id);
      const stock = Store.getStock(sku, grade);
      return stock !== null && c.quantity > stock;
    });
    if (soldOut) {
      app.showToast(`No hay stock suficiente de "${soldOut.name}". Ajusta la cantidad en tu bolsa.`, 'error');
      return;
    }

    const currentUser = Store.data.currentUser;
    if (!Validators.validateAll(this.billingRules(!currentUser))) {
      app.showToast('Revisa los datos de facturación marcados en rojo.', 'error');
      return;
    }

    const val = id => (document.getElementById(id)?.value || '').trim();
    const name = val('guest-name').replace(/\s+/g, ' ');
    const email = val('guest-email');
    const idCard = val('guest-id');
    const address = val('guest-address');
    const city = val('guest-city');
    const password = document.getElementById('checkout-password')?.value || '';
    const formattedPhone = `+593 ${Validators.normalizePhone(val('guest-phone'))}`;

    if (currentUser && currentUser.idCard && currentUser.idCard !== idCard) {
      app.showToast('La cédula debe coincidir con la registrada en tu cuenta.', 'error');
      document.getElementById('guest-id')?.focus();
      return;
    }

    const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'card';

    // Verificación de tarjeta: formato, marca, Luhn, caducidad, CVV y respuesta del banco
    let cardInfo = null;
    if (paymentMethod === 'card') {
      if (!Validators.validateAll(this.CARD_RULES)) {
        const expMsg = Validators.cardExpiry(val('card-exp'));
        app.showToast(expMsg === 'La tarjeta está caducada.' ? 'Tarjeta caducada: la transacción no se realizó.' : 'Revisa los datos de la tarjeta.', 'error');
        return;
      }
      const digits = val('card-number').replace(/\D/g, '');
      const [month, year] = val('card-exp').split('/').map(n => parseInt(n, 10));
      cardInfo = {
        brand: Validators.cardBrand(digits),
        last4: digits.slice(-4),
        digits,
        holder: val('card-holder'),
        month,
        year: year < 100 ? 2000 + year : year
      };
    }

    // Cuenta obligatoria: si no hay sesión se crea en Supabase antes de cobrar
    if (!currentUser) {
      try {
        const user = await SupabaseAPI.register({ idCard, name, email, password, phone: formattedPhone, city, address });
        await app.startSession(user);
        app.showToast(`Cuenta creada para ${user.name}.`, 'success');
      } catch (err) {
        app.showToast(err.message, 'error');
        return;
      }
    } else if (currentUser.token) {
      try {
        const updated = await SupabaseAPI.updateProfile(currentUser.token, { name, phone: formattedPhone, city, address });
        Store.data.currentUser = { ...currentUser, ...updated };
        Store.saveUserSession();
      } catch (err) {
        console.warn('[CheckoutView] No se pudo actualizar el perfil:', err.message);
      }
    }

    const finalizeOrder = async (methodLabel) => {
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

      let deliveryLabel = 'Envío nacional ($5.00)';
      if (Store.data.deliveryMethod === 'pickup') {
        deliveryLabel = 'Retiro en Local Central ($0.00)';
      } else if (Store.data.deliveryMethod === 'quito' || Store.data.deliveryMethod === 'local_express') {
        deliveryLabel = 'Local Express Quito ($3.00)';
      }

      const isPickupOrder = Store.data.deliveryMethod === 'pickup';
      const trackingCode = isPickupOrder
        ? `RET-UIO-${Math.floor(100000 + Math.random() * 900000)}`
        : `GUI-EC-${Math.floor(100000 + Math.random() * 900000)}-PSA`;
      const courierName = isPickupOrder
        ? 'Retiro en tienda (Quito)'
        : 'Servientrega';
      const estimatedDelivery = isPickupOrder
        ? 'Listo para retiro en tienda'
        : '2 a 3 días hábiles (Entrega Garantizada)';

      const orderRecord = {
        numero_orden: orderId,
        orderId,
        trackingNumber: trackingCode,
        courierName,
        estimatedDelivery,
        usuario_cedula: idCard,
        buyerName: name,
        buyerId: idCard,
        buyerEmail: email,
        buyerPhone: formattedPhone,
        shippingAddress: isPickupOrder ? 'Tienda Graded & Sealed, Quito' : `${address}, ${city}`,
        shippingStreet: address,
        shippingCity: city,
        fecha_creacion: now.toISOString(),
        date: formattedDate,
        subtotal,
        tax,
        shipping,
        total,
        paymentMethod: cardInfo ? `${methodLabel} (${cardInfo.brand} •••• ${cardInfo.last4})` : methodLabel,
        metodo_entrega: Store.data.deliveryMethod,
        deliveryMethod: deliveryLabel,
        status: 'En preparación',
        trackingStep: 1,
        stepDates: { 1: formattedDate },
        items: [...Store.data.cart]
      };

      // Supabase registra la orden, descuenta el stock y valida precios en una sola transacción
      const sessionUser = Store.data.currentUser;
      const items = Store.data.cart.map(c => {
        const { sku, grade } = Store.parseCartItemId(c.id);
        return { sku, grado: grade, cantidad: c.quantity, precio: c.price, nombre: c.name, imagen: [c.imageLocal, c.imageFallback].find(u => /^https?:/.test(u || '')) || c.imageLocal };
      });
      try {
        await SupabaseAPI.saveOrder(sessionUser.token, orderRecord, items, cardInfo && {
          marca: cardInfo.brand,
          ultimos4: cardInfo.last4,
          titular: cardInfo.holder,
          mes: cardInfo.month,
          anio: cardInfo.year
        });
      } catch (err) {
        await Store.loadCatalogFromServer();
        app.showToast(`${err.message} No se realizó ningún cargo.`, 'error');
        return;
      }

      Store.addOrder(orderRecord);
      Store.data.cart = [];
      Store.saveCart();
      app.updateCartBadge();

      app.showToast(`¡Orden ${orderId} confirmada con éxito!`, 'success');
      app.go('confirmation', { order: orderId });
    };

    if (paymentMethod === 'cash') {
      await finalizeOrder('Efectivo en Tienda');
      return;
    }

    const modal = document.getElementById('payment-modal');
    const modalText = document.getElementById('payment-modal-text');
    const progressBar = document.getElementById('payment-progress-bar');
    const step = (pct, text) => {
      if (progressBar) progressBar.style.width = pct;
      if (modalText) modalText.innerText = text;
    };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    this._paymentCancelled = false;
    const cancelBtn = document.getElementById('payment-cancel-btn');
    if (cancelBtn) cancelBtn.disabled = false;
    if (modal) {
      modal.dataset.locked = '1';
      app.openDialog('payment-modal', '.modal-content');
    }
    const closeModal = () => {
      if (modal) {
        delete modal.dataset.locked;
        app.closeDialog('payment-modal');
      }
    };
    // Si el cliente pulsa "Cancelar pago" durante el proceso, no se cobra ni se crea la orden
    const cancelled = () => {
      if (!this._paymentCancelled) return false;
      closeModal();
      Store.data.lastPaymentError = {
        code: 'CANCELADO',
        cancelled: true,
        title: 'Pago cancelado',
        message: 'Cancelaste el pago antes de que el banco lo confirmara.',
        brand: cardInfo.brand,
        cardLast4: cardInfo.last4
      };
      Store.savePaymentError();
      app.go('error');
      return true;
    };
    step('25%', 'Conectando con la pasarela bancaria...');
    await wait(900);
    if (cancelled()) return;
    step('60%', `Consultando al banco emisor (${cardInfo.brand} •••• ${cardInfo.last4})...`);
    await wait(1100);
    if (cancelled()) return;

    const bank = Validators.bankAuthorize(cardInfo.digits);
    if (bank.approved) {
      if (cancelBtn) cancelBtn.disabled = true;
      step('100%', 'Pago autorizado. Registrando tu orden...');
      await wait(400);
    }
    closeModal();

    if (!bank.approved) {
      Store.data.lastPaymentError = {
        code: bank.code,
        title: bank.title,
        message: bank.message,
        brand: cardInfo.brand,
        cardLast4: cardInfo.last4
      };
      Store.savePaymentError();
      app.go('error');
      return;
    }

    await finalizeOrder('Tarjeta de crédito o débito');
  }
};
