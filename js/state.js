const Store = {
  data: {
    currentView: 'home',
    currentUser: null,
    users: [],
    cart: [],
    lastDeletedItem: null,
    pendingDeleteItemId: null,
    orders: [],
    activeTrackingOrderId: null,
    deliveryMethod: 'courier',
    shippingFee: APP_CONFIG.COURIER_SHIPPING_FEE,
    currentPdpProduct: PRODUCTS[0],
    pdpSelectedCondition: 'psa10',
    pdpQuantity: 1,
    pdpInspectorMode: 'front',
    catalogFilters: {
      category: 'all',
      era: 'all',
      edition: 'all',
      type: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'featured',
      searchQuery: '',
      onlyFavorites: false
    },
    favorites: [],
    profileActiveTab: 'personal',
    apiCardsCache: {}
  },

  init() {
    try {
      const savedUser = localStorage.getItem('gstcg_user');
      if (savedUser) this.data.currentUser = JSON.parse(savedUser);
      // Sesiones guardadas sin token de Supabase dejan de ser válidas
      if (this.data.currentUser && !this.data.currentUser.token) {
        this.data.currentUser = null;
        localStorage.removeItem('gstcg_user');
        localStorage.removeItem('gstcg_orders');
        localStorage.removeItem('gstcg_last_order');
      }

      const savedUsers = localStorage.getItem('gstcg_users');
      if (savedUsers) this.data.users = JSON.parse(savedUsers);

      const savedDelivery = localStorage.getItem('gstcg_delivery');
      if (savedDelivery) this.data.deliveryMethod = savedDelivery;

      const savedPaymentError = sessionStorage.getItem('gstcg_payment_error');
      if (savedPaymentError) this.data.lastPaymentError = JSON.parse(savedPaymentError);

      const savedCart = localStorage.getItem('gstcg_cart');
      if (savedCart) this.data.cart = JSON.parse(savedCart);

      const savedFavorites = localStorage.getItem('gstcg_favorites');
      if (savedFavorites) this.data.favorites = JSON.parse(savedFavorites);

      const savedOrders = localStorage.getItem('gstcg_orders');
      if (savedOrders) {
        this.data.orders = JSON.parse(savedOrders);
      } else {
        const legacyOrder = localStorage.getItem('gstcg_last_order');
        if (legacyOrder) {
          const parsedLegacy = JSON.parse(legacyOrder);
          this.data.orders = [parsedLegacy];
          this.saveOrders();
        }
      }

      const savedApiCards = localStorage.getItem('gstcg_api_cards_cache');
      if (savedApiCards) {
        this.data.apiCardsCache = Object.assign({}, JSON.parse(savedApiCards), this.data.apiCardsCache || {});
      }

      if (this.data.orders.length > 0 && !this.data.activeTrackingOrderId) {
        this.data.activeTrackingOrderId = this.data.orders[0].orderId;
      }

      this.refreshCartImages();
    } catch (e) {}
  },

  // Bolsas guardadas con versiones anteriores pueden tener rutas de imagen que ya no existen
  refreshCartImages() {
    const cardBack = 'assets/img/cards/card-back.png';
    this.data.cart.forEach(item => {
      const product = this.getProduct(this.parseCartItemId(item.id).sku) || this.getProduct(item.id);
      if (product) {
        const sealed = product.tipo_discriminador === 'PRODUCTO_SELLADO';
        item.imageLocal = (sealed && product.galeria_sellada && product.galeria_sellada.frontal) || product.imagenLocal;
        item.imageFallback = product.imagenFallbackUrl || cardBack;
      } else if (/^img\//.test(item.imageLocal || '')) {
        item.imageLocal = cardBack;
        item.imageFallback = cardBack;
      }
    });
  },

  saveDelivery() {
    try {
      localStorage.setItem('gstcg_delivery', this.data.deliveryMethod);
    } catch (e) {}
  },

  // El detalle del rechazo se muestra en otra página (pages/pago-rechazado.html)
  savePaymentError() {
    try {
      sessionStorage.setItem('gstcg_payment_error', JSON.stringify(this.data.lastPaymentError));
    } catch (e) {}
  },

  saveCart() {
    try {
      localStorage.setItem('gstcg_cart', JSON.stringify(this.data.cart));
    } catch (e) {}
  },

  saveFavorites() {
    try {
      localStorage.setItem('gstcg_favorites', JSON.stringify(this.data.favorites));
    } catch (e) {}
  },

  isFavorite(productId) {
    return (this.data.favorites || []).includes(productId);
  },

  // Devuelve true si el producto quedó marcado como favorito
  toggleFavorite(productId) {
    if (!Array.isArray(this.data.favorites)) this.data.favorites = [];
    const idx = this.data.favorites.indexOf(productId);
    if (idx === -1) this.data.favorites.push(productId);
    else this.data.favorites.splice(idx, 1);
    this.saveFavorites();
    return idx === -1;
  },

  saveUserSession() {
    try {
      if (this.data.currentUser) {
        localStorage.setItem('gstcg_user', JSON.stringify(this.data.currentUser));
      } else {
        localStorage.removeItem('gstcg_user');
      }
      localStorage.setItem('gstcg_users', JSON.stringify(this.data.users));
    } catch (e) {}
  },

  saveOrders() {
    try {
      localStorage.setItem('gstcg_orders', JSON.stringify(this.data.orders));
      if (this.data.orders.length > 0) {
        localStorage.setItem('gstcg_last_order', JSON.stringify(this.data.orders[0]));
      }
    } catch (e) {}
  },

  addOrder(orderObj) {
    this.data.orders.unshift(orderObj);
    this.data.activeTrackingOrderId = orderObj.orderId;
    this.saveOrders();
  },

  getOrderById(orderId) {
    const orders = this.data.orders || [];
    if (!orderId) return orders[0] || null;
    return orders.find(o => o.orderId === orderId) || null;
  },

  // Reemplaza el historial local por las órdenes guardadas en Supabase
  async syncOrdersFromServer() {
    const user = this.data.currentUser;
    if (!user || !user.token || typeof SupabaseAPI === 'undefined') return;
    try {
      const remote = await SupabaseAPI.listOrders(user.token);
      this.data.orders = remote;
      if (!this.getOrderById(this.data.activeTrackingOrderId)) {
        this.data.activeTrackingOrderId = remote.length ? remote[0].orderId : null;
      }
      this.saveOrders();
    } catch (err) {
      // La sesión ya no existe en la base (cuenta eliminada o sesión iniciada en otro dispositivo)
      if (err.code === 'SESION_INVALIDA') {
        this.data.currentUser = null;
        this.data.orders = [];
        this.saveUserSession();
        this.saveOrders();
        if (typeof app !== 'undefined') {
          app.updateNavbarUserUI();
          app.showToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'info');
        }
        return;
      }
      console.warn('[Store] No se pudo sincronizar el historial de órdenes:', err.message);
    }
  },

  // Orden de demostración para el tracking: GS-2026-9481 + cédula 1710034065
  getPreloadedSimulatedOrder() {
    return {
      orderId: '#GS-2026-9481',
      numero_orden: '#GS-2026-9481',
      date: '02 Nov 2026, 09:15',
      buyerName: 'Patricio Mora',
      buyerId: '1710034065',
      buyerEmail: 'coleccionista.paryx@bovedatcg.ec',
      deliveryMethod: 'Courier Nacional Blindado Especializado',
      trackingNumber: 'GUI-EC-948102-PSA',
      courierName: 'Servientrega Blindado • Bóveda G&S',
      estimatedDelivery: '04 Nov 2026 (Entrega Garantizada en Mano)',
      status: 'En Custodia • Autenticación PSA Bóveda',
      isDemo: true,
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
          imageLocal: 'https://images.pokemontcg.io/base1/4.png',
          imageFallback: 'assets/img/cards/card-back.png'
        }
      ]
    };
  },

  updateProfile(updatedFields) {
    if (!this.data.currentUser) return null;
    // Se busca con el correo anterior: el usuario puede haberlo cambiado
    const previousEmail = (this.data.currentUser.email || '').toLowerCase();
    this.data.currentUser = {
      ...this.data.currentUser,
      ...updatedFields
    };
    const idx = this.data.users.findIndex(
      u => (u.email || '').toLowerCase() === previousEmail
    );
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.currentUser };
    } else {
      this.data.users.push({ ...this.data.currentUser });
    }
    this.saveUserSession();
    return this.data.currentUser;
  },

  // Precios, stock e historial vienen de Supabase; data.js queda como respaldo sin conexión
  async loadCatalogFromServer() {
    if (typeof SupabaseAPI === 'undefined' || !SupabaseAPI.isOnline()) return false;
    try {
      const rows = await Promise.race([
        SupabaseAPI.loadCatalog(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('tiempo de espera agotado')), 4000))
      ]);
      const bySku = new Map(rows.map(r => [r.sku, r]));
      for (let i = PRODUCTS.length - 1; i >= 0; i--) {
        const product = PRODUCTS[i];
        const row = bySku.get(product.id);
        if (!row) {
          PRODUCTS.splice(i, 1); // retirado o inactivo en la base de datos
          continue;
        }
        product.precios = { ...product.precios, ...row.precios };
        if (row.precios.sealed) product.precioUnitario = row.precios.sealed;
        product.stock = row.stock || {};
        const isCard = product.tipo_discriminador === 'CARTA_INDIVIDUAL';
        if (isCard) {
          // Cartas: solo imágenes externas de la API; el reverso local queda como respaldo
          if (/^https:\/\//.test(row.imagen_url || '')) product.imagenLocal = row.imagen_url;
        } else if (row.imagen_url) {
          // Filas antiguas guardan la ruta previa a assets/ (img/...)
          const imageUrl = row.imagen_url
            .replace(/^img\/sealed\/Paquete fossil\.png$/, 'img/sealed/paquete-fossil.png')
            .replace(/^img\/booster-team-rocket\.png$/, 'img/packs/booster-team-rocket.png')
            .replace(/^img\//, 'assets/img/');
          product.imagenLocal = imageUrl;
          if (!product.imagenFallbackUrl || !/^https?:/.test(product.imagenFallbackUrl)) product.imagenFallbackUrl = imageUrl;
        }
        if (Array.isArray(row.historial) && row.historial.length) {
          const last = row.historial[row.historial.length - 1];
          product.historialBase = row.historial.map(v => Math.round((v / last) * 1000) / 1000);
        }
        if (row.rendimiento_anual !== null) {
          product.rendimientoAnual = Number(row.rendimiento_anual);
          product.tendencia12m = `+${Number(row.rendimiento_anual).toFixed(1)}%`;
        }
      }
      this.data.catalogSource = 'supabase';
      return true;
    } catch (err) {
      console.warn('[Store] Catálogo local en uso; no se pudo leer Supabase:', err.message);
      this.data.catalogSource = 'local';
      return false;
    }
  },

  // Stock de un producto en un grado; null si no se conoce (cartas de la API o sin conexión)
  getStock(productId, grade) {
    const product = this.getProduct(productId);
    if (!product || !product.stock || product.stock[grade] === undefined) return null;
    return product.stock[grade];
  },

  // Los ítems de la bolsa usan el id "<sku>-<grado>"
  parseCartItemId(itemId) {
    const m = String(itemId).match(/^(.*)-(raw|psa8|psa9|psa10|sealed)$/);
    return m ? { sku: m[1], grade: m[2] } : { sku: String(itemId), grade: 'psa10' };
  },

  getCartCount() {
    return this.data.cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  getCartTotals() {
    const subtotal = this.data.cart.reduce((sum, item) => {
      const price = Number(item.price || item.precio_unitario || 0);
      const qty = parseInt(item.quantity || item.cantidad || 1, 10);
      return sum + (price * qty);
    }, 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    let shipping = 0;
    if (this.data.cart.length > 0) {
      const method = (this.data.deliveryMethod || '').toLowerCase();
      if (method === 'pickup' || method === 'retiro') {
        shipping = APP_CONFIG.PICKUP_SHIPPING_FEE;
      } else if (method === 'quito' || method === 'local' || method === 'local_express') {
        shipping = APP_CONFIG.QUITO_SHIPPING_FEE;
      } else {
        shipping = APP_CONFIG.COURIER_SHIPPING_FEE;
      }
    }
    this.data.shippingFee = shipping;

    const tax = Math.round(roundedSubtotal * APP_CONFIG.TAX_RATE * 100) / 100;
    const total = Math.round((roundedSubtotal + shipping + tax) * 100) / 100;
    return { subtotal: roundedSubtotal, shipping, tax, total };
  },

  isValidEcuadorianId(idString) {
    if (!idString || typeof idString !== 'string') return false;
    const trimmed = idString.trim();
    if (!/^\d+$/.test(trimmed)) return false;

    let base10 = '';
    if (trimmed.length === 10) {
      base10 = trimmed;
    } else if (trimmed.length === 13) {
      if (!trimmed.endsWith('001')) return false;
      base10 = trimmed.substring(0, 10);
    } else {
      return false;
    }

    const provincia = parseInt(base10.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const tercerDigito = parseInt(base10.charAt(2), 10);
    if (tercerDigito >= 6) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(base10.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const residuo = suma % 10;
    const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
    const digitoValidar = parseInt(base10.charAt(9), 10);

    return digitoVerificador === digitoValidar;
  },

  registerApiCard(card) {
    if (!card || !card.id) return null;
    if (!this.data.apiCardsCache) {
      this.data.apiCardsCache = {};
    }

    if (this.data.apiCardsCache[card.id]) {
      return this.data.apiCardsCache[card.id];
    }

    const basePrice = Math.max(1, Number(card.precioEstimado) || 25);
    const hash = this._hashString(String(card.id));
    const certCode = String(60000000 + (hash % 39999999));
    const setStr = card.set || 'Colección TCG';

    const product = {
      id: String(card.id),
      nombre: card.nombre || 'Pokémon Card',
      set: setStr,
      rareza: card.rareza || 'Rare',
      tipo: card.tipo || 'Coleccionable',
      categoria: 'psa',
      tipo_discriminador: 'CARTA_INDIVIDUAL',
      tipo_item: 'CARTA_INDIVIDUAL',
      era: (/base|jungle|fossil|rocket|gym|neo|1999|2000/i.test(setStr)) ? 'vintage' : 'modern',
      condicionPrincipal: 'psa10',
      certNumber: certCode,
      imagenLocal: card.imagen || 'assets/img/cards/card-back.png',
      imagenFallbackUrl: card.imagen || 'assets/img/cards/card-back.png',
      precioEstimado: basePrice,
      precios: {
        raw: Math.round(basePrice),
        psa8: Math.round(basePrice * 1.35),
        psa9: Math.round(basePrice * 2.10),
        psa10: Math.round(basePrice * 5.20)
      },
      descripcion: `${card.rareza || 'Coleccionable'} • Expansión ${setStr} • Verificación PSA Bóveda`,
      tendencia12m: '+16.5%',
      rendimientoAnual: 16.5,
      historialBase: [0.85, 0.86, 0.88, 0.89, 0.91, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00]
    };

    this.data.apiCardsCache[card.id] = product;
    try {
      localStorage.setItem('gstcg_api_cards_cache', JSON.stringify(this.data.apiCardsCache));
    } catch (_) {}
    return product;
  },

  getProduct(id) {
    if (!id) return null;
    const local = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) 
      ? PRODUCTS.find(p => p.id === id) 
      : null;
    if (local) return local;
    if (typeof LEGACY_FIXTURE_PRODUCTS !== 'undefined' && LEGACY_FIXTURE_PRODUCTS && LEGACY_FIXTURE_PRODUCTS[id]) {
      return LEGACY_FIXTURE_PRODUCTS[id];
    }
    if (this.data.apiCardsCache && this.data.apiCardsCache[id]) {
      return this.data.apiCardsCache[id];
    }
    return null;
  },

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
};

