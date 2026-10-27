const CartView = {
  render() {
    const items = Store.data.cart;
    const { subtotal, shipping, tax, total } = Store.getCartTotals();

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-black text-[#0F172A] tracking-tight">Tu Bolsa de Compras</h1>
            <p class="text-xs text-slate-500 mt-0.5">Revisa tus piezas certificadas antes de proceder al pago</p>
          </div>
          <a 
            href="#catalog" 
            class="text-xs font-extrabold text-[#E11D48] hover:text-[#BE123C] flex items-center gap-1"
          >
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Continuar explorando</span>
          </a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          <div class="lg:col-span-8 flex flex-col gap-4">
            <div id="cart-items-container" class="flex flex-col gap-3">
              ${items.length === 0 ? `
                <div class="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 shadow-sm">
                  <i data-lucide="shopping-bag" class="w-14 h-14 mx-auto mb-3 text-slate-300"></i>
                  <h2 class="font-extrabold text-base text-[#0F172A]">Tu bolsa de compras está vacía</h2>
                  <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Añade cartas coleccionables, slabs PSA o booster packs para iniciar tu orden.</p>
                  <a href="#catalog" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-extrabold rounded-xl shadow-sm transition">
                    <i data-lucide="compass" class="w-4 h-4"></i>
                    <span>Explorar Catálogo</span>
                  </a>
                </div>
              ` : items.map(item => `
                <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div class="flex items-center gap-3.5 flex-1">
                    <img 
                      src="${item.imageLocal}" 
                      alt="${item.name}" 
                      class="w-16 h-20 object-contain bg-[#F8FAFC] border border-slate-200 rounded-xl p-1" 
                      onerror="this.onerror=null; this.src='${item.imageFallback}'"
                    />
                    <div>
                      <h3 class="font-extrabold text-sm text-[#0F172A]">${item.name}</h3>
                      <span class="text-xs text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded font-bold inline-block mt-1">${item.condition}</span>
                      <span class="text-xs font-black text-[#0F172A] block sm:hidden mt-1.5">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div class="flex items-center border border-slate-300 rounded-xl bg-[#F8FAFC]">
                      <button 
                        type="button" 
                        onclick="app.updateCartQuantity('${item.id}', -1)" 
                        class="px-3 py-1.5 text-slate-700 hover:text-[#0F172A] font-black text-sm"
                        aria-label="Disminuir cantidad"
                      >−</button>
                      <span class="px-3 py-1.5 text-xs font-black text-[#0F172A] bg-white">${item.quantity}</span>
                      <button 
                        type="button" 
                        onclick="app.updateCartQuantity('${item.id}', 1)" 
                        class="px-3 py-1.5 text-slate-700 hover:text-[#0F172A] font-black text-sm"
                        aria-label="Aumentar cantidad"
                      >+</button>
                    </div>

                    <span class="font-black text-base text-[#0F172A] hidden sm:inline w-28 text-right">
                      $${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    <button 
                      type="button" 
                      onclick="app.requestRemoveItem('${item.id}')" 
                      class="p-2 text-[#E11D48] hover:text-[#BE123C] hover:bg-rose-50 rounded-xl transition"
                      aria-label="Eliminar ${item.name} de la bolsa"
                    >
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
              <div class="w-12 h-12 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center flex-shrink-0 text-[#D97706]">
                <i data-lucide="package" class="w-6 h-6"></i>
              </div>
              <div>
                <h2 class="text-sm font-extrabold text-[#0F172A]">Empaque de Coleccionista Especial Gratuito</h2>
                <p class="text-xs text-slate-500 mt-0.5">Todas las piezas se despachan en estuche rígido, precintos de seguridad y protección con filtro ultravioleta (UV).</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-28">
            <h2 class="text-lg font-black text-[#0F172A] tracking-tight">Resumen del Pedido</h2>

            <div class="mt-4 space-y-3 text-sm border-t border-slate-200 pt-4">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span class="font-bold text-[#0F172A]">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-slate-600">
                <span>Envío blindado:</span>
                <span class="font-bold text-[#0F172A]">$${shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-slate-600">
                <span>IVA (15%):</span>
                <span class="font-bold text-[#0F172A]">$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-[#059669] text-xs font-extrabold">
                <span>Seguro de custodia y bóveda:</span>
                <span>GRATIS</span>
              </div>

              <div class="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span class="text-base font-extrabold text-[#0F172A]">Total a Pagar:</span>
                <span class="text-2xl font-black text-[#0F172A]">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
            </div>

            <a 
              href="#checkout" 
              class="w-full mt-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-extrabold rounded-xl transition shadow flex items-center justify-center gap-2 touch-target"
            >
              <span>Proceder al Pago</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>

            <p class="text-[11px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
              <i data-lucide="lock" class="w-3 h-3"></i>
              <span>Transacción encriptada TLS 256-bit</span>
            </p>
          </div>
        </div>
      </div>
    `;
  }
};

