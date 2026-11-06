/**
 * Graded & Sealed TCG — Capa de acceso a Supabase (usuarios, órdenes y tracking)
 * Todas las operaciones pasan por funciones RPC (ver js/db/funciones_rpc.sql):
 * las contraseñas se cifran con bcrypt en el servidor y las tablas no son
 * legibles directamente desde el navegador.
 */
const SupabaseAPI = {
  ERRORS: {
    EMAIL_EXISTE: 'Ya existe una cuenta con ese correo. Inicia sesión.',
    CEDULA_EXISTE: 'Ya existe una cuenta registrada con esa cédula.',
    CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos.',
    PASSWORD_CORTA: 'La contraseña debe tener al menos 8 caracteres.',
    SESION_INVALIDA: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    CEDULA_INVALIDA: 'La cédula o RUC no es válida (Módulo 10).',
    PASSWORD_INCORRECTA: 'La contraseña actual no es correcta. No se cambió el correo.',
    EMAIL_INVALIDO: 'El nuevo correo no tiene un formato válido.',
    ORDEN_VACIA: 'Tu bolsa está vacía.',
    SIN_STOCK: pieza => `No hay stock suficiente de "${pieza}". Ajusta la cantidad en tu bolsa.`,
    PRECIO_CAMBIO: pieza => `El precio de "${pieza}" cambió. Revisa tu bolsa antes de pagar.`,
    GRADO_NO_DISPONIBLE: pieza => `El grado elegido de "${pieza}" ya no está disponible.`,
    PRODUCTO_NO_DISPONIBLE: pieza => `"${pieza}" ya no está disponible en la tienda. Quítalo de tu bolsa.`,
    NO_AUTORIZADO: 'Acceso no autorizado.',
    PRECIO_INVALIDO: 'El precio debe ser mayor que 0.',
    STOCK_INVALIDO: 'El stock debe ser un número entero mayor o igual a 0.',
    PASSWORD_ACTUAL_INCORRECTA: 'La contraseña actual no es correcta.',
    PASSWORD_IGUAL: 'La nueva contraseña debe ser distinta de la actual.',
    DATOS_NO_COINCIDEN: 'El correo y la cédula no corresponden a ninguna cuenta.',
    ORDEN_NO_ENCONTRADA: 'No encontramos ese pedido en tu cuenta.',
    ORDEN_NO_CANCELABLE: 'Este pedido ya salió de la tienda y no se puede cancelar.'
  },

  client() {
    return (typeof SupabaseConfig !== 'undefined') ? SupabaseConfig.getClient() : null;
  },

  isOnline() {
    return !!this.client();
  },

  async rpc(fn, args) {
    const sb = this.client();
    if (!sb) throw new Error('Sin conexión con la base de datos (Supabase).');
    const { data, error } = await sb.rpc(fn, args);
    if (error) {
      const msg = error.message || '';
      const code = Object.keys(this.ERRORS).find(k => msg.startsWith(k) || msg.includes(k));
      const text = this.ERRORS[code];
      const err = new Error(typeof text === 'function' ? text(msg.split(':').slice(1).join(':')) : (text || msg || 'Error de base de datos'));
      err.code = code;
      throw err;
    }
    return data;
  },

  // Convierte la fila de la tabla `usuarios` al formato que usa la interfaz
  toUser(row) {
    if (!row) return null;
    return {
      name: row.nombre,
      email: row.email,
      idCard: row.cedula_ruc,
      phone: row.telefono || '',
      city: row.ciudad || '',
      address: row.direccion_principal || '',
      token: row.token_sesion
    };
  },

  async register({ idCard, name, email, password, phone, city, address }) {
    const row = await this.rpc('registrar_usuario', {
      p_cedula: idCard,
      p_nombre: name,
      p_email: email,
      p_password: password,
      p_telefono: phone || null,
      p_ciudad: city || null,
      p_direccion: address || null
    });
    return this.toUser(row);
  },

  async login(email, password) {
    const row = await this.rpc('iniciar_sesion', { p_email: email, p_password: password });
    return this.toUser(row);
  },

  // email y currentPassword solo se envían cuando el usuario cambia su correo
  async updateProfile(token, { name, phone, city, address, email, currentPassword }) {
    const row = await this.rpc('actualizar_perfil', {
      p_token: token,
      p_nombre: name,
      p_telefono: phone,
      p_ciudad: city,
      p_direccion: address,
      p_email: email || null,
      p_password: currentPassword || null
    });
    return this.toUser(row);
  },

  // Cambia la contraseña con sesión iniciada (exige la actual)
  async changePassword(token, currentPassword, newPassword) {
    return this.rpc('cambiar_password', { p_token: token, p_actual: currentPassword, p_nueva: newPassword });
  },

  // Recuperación sin correo: se verifica con el correo y la cédula de la cuenta
  async resetPassword(email, idCard, newPassword) {
    return this.rpc('restablecer_password', { p_email: email, p_cedula: idCard, p_nueva: newPassword });
  },

  // Cancela un pedido en preparación y devuelve el stock al inventario
  async cancelOrder(token, orderId) {
    return this.rpc('cancelar_orden', { p_token: token, p_codigo: orderId });
  },

  // items: [{ sku, grado, cantidad, precio, nombre, imagen }] · card: { marca, ultimos4, titular, mes, anio } o null
  async saveOrder(token, order, items, card) {
    return this.rpc('guardar_orden', { p_token: token, p_orden: order, p_items: items, p_tarjeta: card || null });
  },

  // Catálogo público (vista v_catalogo): precios, stock por grado e historial de 12 meses
  async loadCatalog() {
    const sb = this.client();
    if (!sb) throw new Error('Sin conexión con la base de datos (Supabase).');
    const { data, error } = await sb.from('v_catalogo').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  },

  async listOrders(token) {
    return (await this.rpc('listar_mis_ordenes', { p_token: token })) || [];
  },

  async trackOrder(code, idCard) {
    return this.rpc('rastrear_orden', { p_codigo: code, p_cedula: idCard });
  },

  async updateOrderStatus(order, idCard) {
    return this.rpc('actualizar_estado_orden', {
      p_codigo: order.orderId,
      p_cedula: idCard,
      p_orden: order
    });
  },

  // ---- Panel de inventario (js/db/admin_rpc.sql): el servidor exige rol ADMIN
  async adminListProducts(token) {
    return (await this.rpc('admin_listar_productos', { p_token: token })) || [];
  },

  async adminUpdateGrade(token, sku, grade, price, stock) {
    return this.rpc('admin_actualizar_grado', {
      p_token: token,
      p_sku: sku,
      p_grado: grade,
      p_precio: price,
      p_stock: stock
    });
  },

  async adminSetActive(token, sku, active) {
    return this.rpc('admin_cambiar_activo', { p_token: token, p_sku: sku, p_activo: active });
  }
};

if (typeof window !== 'undefined') {
  window.SupabaseAPI = SupabaseAPI;
}
