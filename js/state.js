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
    profileActiveTab: 'personal'
  },

  init() {
    try {
      const savedUser = localStorage.getItem('gstcg_user');
      if (savedUser) this.data.currentUser = JSON.parse(savedUser);

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
    if (!orderId) return this.data.orders[0] || null;
    return this.data.orders.find(o => o.orderId === orderId) || this.data.orders[0] || null;
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
    const subtotal = this.data.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = this.data.cart.length > 0 ? this.data.shippingFee : 0;
    const tax = subtotal * APP_CONFIG.TAX_RATE;
    const total = subtotal + shipping + tax;
    return { subtotal, shipping, tax, total };
  },

  isValidEcuadorianId(cedula) {
    if (!cedula || typeof cedula !== 'string') return false;
    const clean = cedula.trim().replace(/\D/g, '');
    if (clean.length !== 10) return false;

    const provincia = parseInt(clean.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const tercerDigito = parseInt(clean.charAt(2), 10);
    if (tercerDigito >= 6) return false;

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let valor = parseInt(clean.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const residuo = suma % 10;
    const digitoVerificador = residuo === 0 ? 0 : 10 - residuo;
    const digitoValidar = parseInt(clean.charAt(9), 10);

    return digitoVerificador === digitoValidar;
  }
};

