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
      condition: 'all',
      type: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'featured',
      searchQuery: ''
    },
    profileActiveTab: 'personal',
    apiCardsCache: {}
  },

  init() {
    try {
      const savedUser = localStorage.getItem('gstcg_user');
      if (savedUser) this.data.currentUser = JSON.parse(savedUser);
      // Sesiones antiguas (Google simulado o sin token de Supabase) dejan de ser válidas
      if (this.data.currentUser && !this.data.currentUser.token) {
        this.data.currentUser = null;
        localStorage.removeItem('gstcg_user');
        localStorage.removeItem('gstcg_orders');
        localStorage.removeItem('gstcg_last_order');
      }

      const savedUsers = localStorage.getItem('gstcg_users');
      if (savedUsers) this.data.users = JSON.parse(savedUsers);

      const savedCart = localStorage.getItem('gstcg_cart');
      if (savedCart) this.data.cart = JSON.parse(savedCart);

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
    } catch (e) {}
  },

  saveCart() {
    try {
      localStorage.setItem('gstcg_cart', JSON.stringify(this.data.cart));
    } catch (e) {}
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
          imageLocal: 'img/cards/card-back.png',
          imageFallback: 'https://images.pokemontcg.io/base1/4_hires.png'
        }
      ]
    };
  },

  updateProfile(updatedFields) {
    if (!this.data.currentUser) return null;
    this.data.currentUser = {
      ...this.data.currentUser,
      ...updatedFields
    };
    const idx = this.data.users.findIndex(
      u => u.email.toLowerCase() === this.data.currentUser.email.toLowerCase()
    );
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.currentUser };
    } else {
      this.data.users.push({ ...this.data.currentUser });
    }
    this.saveUserSession();
    return this.data.currentUser;
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

  isValidEcuadorianPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const trimmed = phone.trim();
    const regex = /^\+593[\s-]?[0-9]{9}$/;
    return regex.test(trimmed);
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
      imagenLocal: card.imagen || 'img/cards/card-back.png',
      imagenFallbackUrl: card.imagen || 'img/cards/card-back.png',
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

