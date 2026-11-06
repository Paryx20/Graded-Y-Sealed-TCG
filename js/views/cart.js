const CartView = {
  render() {
    const items = Store.data.cart;
    const { subtotal, shipping, tax, total } = Store.getCartTotals();

    return `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 class="text-2xl font-bold text-[#0F172A] tracking-tight">Tu bolsa</h1>
            <p class="text-xs text-slate-500 mt-0.5">Revisa los productos y las cantidades antes de pagar.</p>
          </div>
          <a 
            href="pages/catalogo.html" 
            class="text-xs font-semibold text-[#BE123C] hover:text-[#9F1239] flex items-center gap-1"
          >
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Seguir comprando</span>
          </a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          <div class="lg:col-span-8 flex flex-col gap-4">
            <div id="cart-items-container" class="flex flex-col gap-3">
              ${items.length === 0 ? `
                <div class="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500 shadow-sm">
                  <i data-lucide="shopping-bag" class="w-14 h-14 mx-auto mb-3 text-slate-300"></i>
                  <h2 class="font-semibold text-base text-[#0F172A]">Tu bolsa está vacía</h2>
                  <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Agrega cartas, slabs PSA o producto sellado desde el catálogo.</p>
                  <a href="pages/catalogo.html" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold rounded-md shadow-sm transition">
                    <i data-lucide="compass" class="w-4 h-4"></i>
                    <span>Ir al catálogo</span>
                  </a>
                </div>
              ` : items.map(item => `
                <div class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div class="flex items-center gap-3.5 flex-1">
                    <img 
                      src="${item.imageLocal}" 
                      alt=""
                      width="64"
                      height="80"
                      loading="lazy"
                      decoding="async"
                      class="w-16 h-20 object-contain bg-[#F8FAFC] border border-slate-200 rounded-md p-1" 
                      onerror="this.onerror=null; this.src='${item.imageFallback}'"
                    />
                    <div>
                      <h3 class="font-semibold text-sm text-[#0F172A]">${item.name}</h3>
                      <span class="text-xs text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded font-bold inline-block mt-1">${item.condition}</span>
                      <span class="text-xs font-bold text-[#0F172A] block sm:hidden mt-1.5">$${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div class="flex items-center border border-slate-300 rounded-md bg-[#F8FAFC]">
                      <button 
                        type="button" 
                        onclick="app.updateCartQuantity('${item.id}', -1)" 
                        class="px-3 py-1.5 text-slate-700 hover:text-[#0F172A] font-bold text-sm"
                        aria-label="Disminuir cantidad de ${item.name}"
                      >−</button>
                      <span class="px-3 py-1.5 text-xs font-bold text-[#0F172A] bg-white"><span class="sr-only">Cantidad: </span>${item.quantity}</span>
                      <button 
                        type="button" 
                        onclick="app.updateCartQuantity('${item.id}', 1)" 
                        class="px-3 py-1.5 text-slate-700 hover:text-[#0F172A] font-bold text-sm"
                        aria-label="Aumentar cantidad de ${item.name}"
                      >+</button>
                    </div>

                    <span class="font-bold text-base text-[#0F172A] hidden sm:inline w-28 text-right">
                      $${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>

                    <button 
                      type="button" 
                      onclick="app.requestRemoveItem('${item.id}')" 
                      class="p-2 text-[#BE123C] hover:text-[#9F1239] hover:bg-rose-50 rounded-md transition"
                      aria-label="Eliminar ${item.name} de la bolsa"
                    >
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-4 shadow-sm">
              <div class="w-12 h-12 rounded-md bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center flex-shrink-0 text-[#B45309]">
                <i data-lucide="package" class="w-6 h-6"></i>
              </div>
              <div>
                <h2 class="text-sm font-semibold text-[#0F172A]">Empaque protegido incluido</h2>
                <p class="text-xs text-slate-500 mt-0.5">Las cartas van en funda y toploader; los slabs y el sellado, en caja rígida con relleno.</p>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 shadow-sm sticky top-28">
            <h2 class="text-lg font-bold text-[#0F172A] tracking-tight">Resumen del pedido</h2>

            <div class="mt-4 space-y-3 text-sm border-t border-slate-200 pt-4">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span class="font-bold text-[#0F172A]">$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-slate-600">
                <span>Envío:</span>
                <span class="font-bold text-[#0F172A]">$${shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-slate-600">
                <span>IVA (15%):</span>
                <span class="font-bold text-[#0F172A]">$${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="flex justify-between text-[#047857] text-xs font-semibold">
                <span>Seguro de envío:</span>
                <span>Incluido</span>
              </div>

              <div class="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span class="text-base font-semibold text-[#0F172A]">Total:</span>
                <span class="text-2xl font-bold text-[#0F172A]">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
              </div>
            </div>

            ${items.length === 0 ? `
            <button
              type="button"
              disabled
              aria-disabled="true"
              aria-describedby="cart-empty-checkout-hint"
              class="w-full mt-6 py-3.5 bg-slate-200 text-slate-600 text-sm font-semibold rounded-md flex items-center justify-center gap-2 cursor-not-allowed touch-target"
            >
              <span>Ir a pagar</span>
              <i data-lucide="arrow-right" class="w-4 h-4" aria-hidden="true"></i>
            </button>
            <p id="cart-empty-checkout-hint" class="text-xs text-slate-600 text-center mt-2">Agrega al menos un producto para continuar al pago.</p>
            ` : `
            <a
              href="pages/checkout.html"
              class="w-full mt-6 py-3.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-sm font-semibold rounded-md transition shadow flex items-center justify-center gap-2 touch-target"
            >
              <span>Ir a pagar</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
            `}

            <p class="text-xs text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
              <i data-lucide="lock" class="w-3 h-3"></i>
              <span>Pago seguro · Puedes revisar todo antes de confirmar</span>
            </p>
          </div>
        </div>
      </div>
    `;
  }
};

