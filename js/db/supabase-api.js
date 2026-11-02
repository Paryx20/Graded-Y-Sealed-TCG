/**
 * Graded & Sealed TCG — Capa de acceso a Supabase (usuarios, órdenes y tracking)
 * Todas las operaciones pasan por funciones RPC (ver js/db/schema_auth_rpc.sql):
 * las contraseñas se cifran con bcrypt en el servidor y las tablas no son
 * legibles directamente desde el navegador.
 */
const SupabaseAPI = {
  ERRORS: {
    EMAIL_EXISTE: 'Ya existe una cuenta con ese correo. Inicia sesión.',
    CEDULA_EXISTE: 'Ya existe una cuenta registrada con esa cédula.',
    CREDENCIALES_INVALIDAS: 'Correo o contraseña incorrectos.',
    PASSWORD_CORTA: 'La contraseña debe tener al menos 8 caracteres.',
    SESION_INVALIDA: 'Tu sesión expiró. Vuelve a iniciar sesión.'
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
      const code = Object.keys(this.ERRORS).find(k => (error.message || '').includes(k));
      throw new Error(code ? this.ERRORS[code] : (error.message || 'Error de base de datos'));
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

  async updateProfile(token, { name, phone, city, address }) {
    const row = await this.rpc('actualizar_perfil', {
      p_token: token,
      p_nombre: name,
      p_telefono: phone,
      p_ciudad: city,
      p_direccion: address
    });
    return this.toUser(row);
  },

  async saveOrder(token, order) {
    return this.rpc('guardar_orden', { p_token: token, p_orden: order });
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
  }
};

if (typeof window !== 'undefined') {
  window.SupabaseAPI = SupabaseAPI;
}
