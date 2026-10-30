/**
 * ==============================================================================
 * Graded & Sealed TCG - Motor de Persistencia Relacional Transaccional (Fase 2)
 * Archivo: js/db/db-client.js
 * Descripción: Cliente oficial de base de datos 'GradedSealedDB' con soporte ACID
 *              mediante Dexie.js (IndexedDB) y fallback transparente a localStorage.
 *              Implementa transacciones de compra y función semilla seedDatabase().
 * ==============================================================================
 */

(function (global) {
  'use strict';

  // Obtener definición de esquema
  const schema = (typeof global.GradedSealedSchema !== 'undefined')
    ? global.GradedSealedSchema
    : (typeof require !== 'undefined' ? require('./schema.js') : null);

  if (!schema) {
    console.error('[GradedSealedDB] Error crítico: GradedSealedSchema no se encuentra cargado.');
  }

  const DB_NAME = schema ? schema.DB_NAME : 'GradedSealedDB';
  const DB_VERSION = schema ? schema.DB_VERSION : 1;
  const DEXIE_STORES = schema ? schema.DEXIE_STORES : {};

  /**
   * ============================================================================
   * ADAPTADOR FALLBACK A LOCALSTORAGE (En caso de bloqueo o fallo de IndexedDB)
   * ============================================================================
   */
  const memFallbackStore = {};

  class LocalStorageTable {
    constructor(tableName, pkField) {
      this.tableName = tableName;
      this.pkField = pkField;
      this.storageKey = `gstcg_table_${tableName}`;
    }

    _load() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(this.storageKey);
          return raw ? JSON.parse(raw) : [];
        } else {
          return memFallbackStore[this.storageKey]
            ? JSON.parse(JSON.stringify(memFallbackStore[this.storageKey]))
            : [];
        }
      } catch (e) {
        console.warn(`[LocalStorageTable] Error al leer tabla ${this.tableName}:`, e);
        return [];
      }
    }

    _save(records) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(records));
        } else {
          memFallbackStore[this.storageKey] = JSON.parse(JSON.stringify(records));
        }
      } catch (e) {
        console.error(`[LocalStorageTable] Cuota o error al guardar en tabla ${this.tableName}:`, e);
      }
    }

    _getKey(record) {
      if (Array.isArray(this.pkField)) {
        return this.pkField.map(k => String(record[k] || '')).join('::');
      }
      const actualField = typeof this.pkField === 'string' && this.pkField.startsWith('++')
        ? this.pkField.replace(/^\+\+/, '')
        : this.pkField;
      return record[actualField];
    }

    _matchesKey(record, key) {
      if (Array.isArray(this.pkField)) {
        if (Array.isArray(key)) {
          return this.pkField.every((field, idx) => record[field] === key[idx]);
        }
        if (typeof key === 'string') {
          const parts = key.split('::');
          return this.pkField.every((field, idx) => String(record[field]) === parts[idx]);
        }
      }
      const actualField = typeof this.pkField === 'string' && this.pkField.startsWith('++')
        ? this.pkField.replace(/^\+\+/, '')
        : this.pkField;
      return record[actualField] === key;
    }

    async get(key) {
      const records = this._load();
      return records.find(r => this._matchesKey(r, key)) || undefined;
    }

    async toArray() {
      return this._load();
    }

    async count() {
      return this._load().length;
    }

    async add(record) {
      const records = this._load();
      const rec = { ...record };

      if (typeof this.pkField === 'string' && this.pkField.startsWith('++')) {
        const actualField = this.pkField.replace(/^\+\+/, '');
        const maxId = records.reduce((max, r) => Math.max(max, Number(r[actualField]) || 0), 0);
        rec[actualField] = maxId + 1;
      } else {
        const key = this._getKey(rec);
        const exists = records.some(r => this._matchesKey(r, key));
        if (exists) {
          throw new Error(`Clave duplicada en tabla ${this.tableName}: ${JSON.stringify(key)}`);
        }
      }

      records.push(rec);
      this._save(records);
      return this._getKey(rec);
    }

    async put(record) {
      const records = this._load();
      const rec = { ...record };

      if (typeof this.pkField === 'string' && this.pkField.startsWith('++')) {
        const actualField = this.pkField.replace(/^\+\+/, '');
        if (!rec[actualField]) {
          const maxId = records.reduce((max, r) => Math.max(max, Number(r[actualField]) || 0), 0);
          rec[actualField] = maxId + 1;
        }
      }

      const key = this._getKey(rec);
      const index = records.findIndex(r => this._matchesKey(r, key));

      if (index >= 0) {
        records[index] = rec;
      } else {
        records.push(rec);
      }
      this._save(records);
      return key;
    }

    async bulkAdd(items) {
      const records = this._load();
      for (const item of items) {
        records.push({ ...item });
      }
      this._save(records);
      return items.length;
    }

    async bulkPut(items) {
      const records = this._load();
      for (const item of items) {
        const rec = { ...item };
        const key = this._getKey(rec);
        const index = records.findIndex(r => this._matchesKey(r, key));
        if (index >= 0) {
          records[index] = rec;
        } else {
          records.push(rec);
        }
      }
      this._save(records);
      return items.length;
    }

    async delete(key) {
      let records = this._load();
      records = records.filter(r => !this._matchesKey(r, key));
      this._save(records);
    }

    async clear() {
      this._save([]);
    }

    where(field) {
      return {
        equals: (val) => ({
          toArray: async () => {
            const records = this._load();
            return records.filter(r => r[field] === val);
          },
          first: async () => {
            const records = this._load();
            return records.find(r => r[field] === val) || undefined;
          },
          count: async () => {
            const records = this._load();
            return records.filter(r => r[field] === val).length;
          }
        })
      };
    }
  }

  class LocalStorageFallbackDB {
    constructor() {
      this.name = DB_NAME;
      this.isOpenFlag = true;
      this.isFallback = true;
      this.storageEngine = 'localStorage';

      // Configurar tablas
      for (const [tableName, storeDef] of Object.entries(DEXIE_STORES)) {
        const parts = storeDef.split(',').map(s => s.trim());
        let pkPart = parts[0] || 'id';
        let pkField = pkPart;

        if (pkPart.startsWith('[') && pkPart.endsWith(']')) {
          pkField = pkPart.slice(1, -1).split('+').map(p => p.trim());
        }

        const tableInstance = new LocalStorageTable(tableName, pkField);
        this[tableName] = tableInstance;
      }
    }

    table(name) {
      return this[name];
    }

    isOpen() {
      return this.isOpenFlag;
    }

    async transaction(mode, tables, callback) {
      // Instantánea previa para rollback ACID
      const snapshot = {};
      const tableList = Array.isArray(tables) ? tables : [tables];

      for (const tbl of tableList) {
        const tableName = typeof tbl === 'string' ? tbl : tbl.tableName;
        if (this[tableName]) {
          snapshot[tableName] = JSON.parse(JSON.stringify(this[tableName]._load()));
        }
      }

      try {
        const result = await callback();
        return result;
      } catch (err) {
        // Rollback automático: restaurar estado intacto
        console.warn('[LocalStorageFallbackDB] Rollback ejecutado por error en transacción:', err.message);
        for (const [tblName, data] of Object.entries(snapshot)) {
          if (this[tblName]) {
            this[tblName]._save(data);
          }
        }
        throw err;
      }
    }
  }

  /**
   * ============================================================================
   * INICIALIZACIÓN DE LA BASE DE DATOS 'GradedSealedDB'
   * ============================================================================
   */
  let dbInstance = null;
  let useFallback = false;

  const hasDexie = (typeof global.Dexie !== 'undefined');
  const hasIndexedDB = (typeof indexedDB !== 'undefined' && indexedDB !== null);

  if (hasDexie && hasIndexedDB) {
    try {
      dbInstance = new global.Dexie(DB_NAME);
      dbInstance.version(DB_VERSION).stores(DEXIE_STORES);
      dbInstance.storageEngine = 'IndexedDB (Dexie.js)';
      dbInstance.isFallback = false;
      console.log(`[GradedSealedDB] Inicializado exitosamente sobre IndexedDB v${DB_VERSION}.`);
    } catch (e) {
      console.warn('[GradedSealedDB] Error al instanciar Dexie, activando fallback localStorage:', e);
      useFallback = true;
    }
  } else {
    console.warn('[GradedSealedDB] Dexie o IndexedDB no disponibles en el entorno. Activando fallback localStorage.');
    useFallback = true;
  }

  if (useFallback || !dbInstance) {
    dbInstance = new LocalStorageFallbackDB();
  }

  /**
   * ============================================================================
   * TRANSACCIÓN ACID: PROCESAMIENTO DE ÓRDENES Y DESCUENTO DE INVENTARIO
   * ============================================================================
   */
  async function procesarOrdenTransaccional({
    usuario_cedula = '1710034065',
    items = [],
    metodo_entrega = 'courier',
    tarifa_envio = null,
    metodo_pago = 'Tarjeta de Crédito (Visa ***9921)',
    direccion_envio_id = 1,
    notas = ''
  }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('La orden debe contener al menos un producto coleccionable.');
    }

    return await dbInstance.transaction(
      'rw',
      [
        dbInstance.ordenes_compra,
        dbInstance.items_orden,
        dbInstance.certificaciones_psa,
        dbInstance.productos
      ],
      async () => {
        const lineasProcesadas = [];
        let subtotalCalculado = 0;

        // 1. Verificación atómica de stock y descuento de inventario
        for (const item of items) {
          const sku = item.sku || item.id;
          const cantidad = parseInt(item.cantidad || 1, 10);
          const grado = (item.grado || item.condicion || 'RAW').toUpperCase();

          if (isNaN(cantidad) || cantidad <= 0) {
            throw new Error(`Cantidad inválida (${cantidad}) para el artículo ${sku}.`);
          }

          // Verificar existencia en catálogo maestro
          const producto = await dbInstance.productos.get(sku);
          if (!producto) {
            throw new Error(`El producto con SKU '${sku}' no existe en la bóveda.`);
          }

          if (producto.stock_total < cantidad) {
            throw new Error(
              `Stock total insuficiente para ${producto.nombre}. Solicitado: ${cantidad}, Disponible: ${producto.stock_total}`
            );
          }

          let precioCapturado = Number(item.precio_unitario || item.price || 0);
          let certAsociada = null;

          // Si es carta individual, validar y descontar el grado PSA específico
          if (producto.tipo_discriminador === 'CARTA_INDIVIDUAL') {
            const certs = await dbInstance.certificaciones_psa
              .where('producto_sku')
              .equals(sku)
              .toArray();

            certAsociada = certs.find(c =>
              c.grado.toUpperCase() === grado ||
              c.numero_certificacion === item.numero_certificacion
            );

            if (certAsociada) {
              if (certAsociada.stock_disponible < cantidad) {
                throw new Error(
                  `Stock insuficiente en grado ${certAsociada.grado} para '${producto.nombre}'. Solicitado: ${cantidad}, Disponible en bóveda: ${certAsociada.stock_disponible}`
                );
              }
              if (!precioCapturado) {
                precioCapturado = Number(certAsociada.precio);
              }

              // Descontar inventario en la cápsula/certificación PSA
              certAsociada.stock_disponible -= cantidad;
              await dbInstance.certificaciones_psa.put(certAsociada);
            }
          }

          // Si es sellado o no tenía precio unitario, tomar el precio base
          if (!precioCapturado) {
            precioCapturado = Number(producto.precio_base || 0);
          }

          // Descontar inventario global del producto
          producto.stock_total -= cantidad;
          await dbInstance.productos.put(producto);

          const subtotalLinea = Math.round(precioCapturado * cantidad * 100) / 100;
          subtotalCalculado += subtotalLinea;

          lineasProcesadas.push({
            sku,
            grado: certAsociada ? certAsociada.grado : (item.grado || 'SELLADO'),
            cantidad,
            precio_unitario: precioCapturado,
            subtotal: subtotalLinea
          });
        }

        // 2. Cálculos fiscales ecuatorianos: IVA 15% y fletes $0 / $3 / $5
        const subtotal = Math.round(subtotalCalculado * 100) / 100;
        const impuesto_iva = Math.round(subtotal * 0.15 * 100) / 100;

        let costoEnvio = 5.00;
        if (tarifa_envio !== null && tarifa_envio !== undefined) {
          costoEnvio = Number(tarifa_envio);
        } else if (metodo_entrega === 'pickup') {
          costoEnvio = 0.00;
        } else if (metodo_entrega === 'local_express') {
          costoEnvio = 3.00;
        } else {
          costoEnvio = 5.00; // Nacional blindado
        }

        const total = Math.round((subtotal + impuesto_iva + costoEnvio) * 100) / 100;

        // 3. Generación de cabecera de orden
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const numero_orden = `#PKM-2026-${randomNum}`;

        const nuevaOrden = {
          numero_orden,
          usuario_cedula,
          fecha_creacion: new Date().toISOString(),
          estado: 'En Custodia / En Preparación',
          subtotal,
          impuesto_iva,
          tarifa_envio: costoEnvio,
          total,
          metodo_pago,
          metodo_entrega,
          direccion_envio_id,
          transaccion_id: `TXN-SEC-${Date.now().toString().slice(-6)}`,
          notas
        };

        await dbInstance.ordenes_compra.add(nuevaOrden);

        // 4. Inserción de líneas con clave primaria compuesta [numero_orden+sku+grado]
        for (const linea of lineasProcesadas) {
          await dbInstance.items_orden.add({
            numero_orden,
            sku: linea.sku,
            grado: linea.grado,
            cantidad: linea.cantidad,
            precio_unitario: linea.precio_unitario,
            subtotal: linea.subtotal
          });
        }

        return {
          orden: nuevaOrden,
          items: lineasProcesadas
        };
      }
    );
  }

  /**
   * ============================================================================
   * DATOS SEMILLA (SEED DATABASE)
   * ============================================================================
   */
  async function seedDatabase() {
    try {
      // 1. Verificación de existencia del SKU representativo
      const existeCharizard = await dbInstance.productos.get('PKM-BASE-CHAR-004');
      if (existeCharizard) {
        console.log('[GradedSealedDB] Base de datos ya poblada con el ítem estelar PKM-BASE-CHAR-004.');
        return false;
      }

      console.log('[GradedSealedDB] Iniciando inserción de datos semilla para las 12 entidades relacionales...');

      // 2. Transacción de inserción masiva
      await dbInstance.transaction(
        'rw',
        [
          dbInstance.categorias_producto,
          dbInstance.sets_expansiones,
          dbInstance.usuarios,
          dbInstance.direcciones_envio,
          dbInstance.metodos_pago_tokenizados,
          dbInstance.productos,
          dbInstance.detalles_cartas,
          dbInstance.detalles_sellados,
          dbInstance.certificaciones_psa,
          dbInstance.historial_precios,
          dbInstance.ordenes_compra,
          dbInstance.items_orden
        ],
        async () => {
          // A. Categorías maestras
          await dbInstance.categorias_producto.bulkPut([
            { slug_categoria: 'psa', nombre_categoria: 'Slabs Certificados PSA', orden: 1 },
            { slug_categoria: 'raw', nombre_categoria: 'Cartas Sueltas / Raw', orden: 2 },
            { slug_categoria: 'sealed', nombre_categoria: 'Cajas y Sobres Sellados Vintage', orden: 3 }
          ]);

          // B. Sets y expansiones históricas
          await dbInstance.sets_expansiones.bulkPut([
            { codigo_set: 'base1', nombre_set: 'Base Set 1999', era: 'vintage', anio_lanzamiento: 1999 },
            { codigo_set: 'swsh7', nombre_set: 'Evolving Skies 2021', era: 'modern', anio_lanzamiento: 2021 },
            { codigo_set: 'swsh8', nombre_set: 'Fusion Strike 2021', era: 'modern', anio_lanzamiento: 2021 },
            { codigo_set: 'neo1', nombre_set: 'Neo Genesis 2000', era: 'vintage', anio_lanzamiento: 2000 },
            { codigo_set: 'base5', nombre_set: 'Team Rocket 1999', era: 'vintage', anio_lanzamiento: 1999 },
            { codigo_set: 'base2', nombre_set: 'Jungle 1999', era: 'vintage', anio_lanzamiento: 1999 }
          ]);

          // C. Usuario coleccionista verificado
          await dbInstance.usuarios.put({
            cedula_ruc: '1710034065',
            nombre: 'Patricio Coleccionista',
            email: 'patricio.collector@vault.ec',
            telefono: '+593 99 876 5432',
            ciudad: 'Quito',
            direccion_principal: 'Av. González Suárez N27-142 y San Ignacio, Bóveda 4B',
            creado_en: '2026-01-15T10:00:00.000Z',
            rol: 'VIP_COLLECTOR'
          });

          // D. Dirección de entrega
          await dbInstance.direcciones_envio.put({
            direccion_id: 1,
            usuario_cedula: '1710034065',
            calle_principal: 'Av. González Suárez N27-142',
            calle_secundaria: 'San Ignacio',
            referencia: 'Edificio Bóveda TCG, Piso 4, Suite 4B',
            ciudad: 'Quito',
            provincia: 'Pichincha',
            codigo_postal: '170109',
            es_predeterminada: 1
          });

          // E. Método de pago tokenizado
          await dbInstance.metodos_pago_tokenizados.put({
            token_tarjeta: 'tok_visa_vault_9921',
            usuario_cedula: '1710034065',
            ultimos_4_digitos: '9921',
            marca_tarjeta: 'Visa Infinite',
            titular: 'Patricio Coleccionista',
            mes_expiracion: '12',
            anio_expiracion: '2028',
            activo: 1
          });

          // F. Catálogo de Productos (4 Cartas de Inversión + 2 Productos Sellados)
          await dbInstance.productos.bulkPut([
            // 1. Charizard Base Set #4
            {
              sku: 'PKM-BASE-CHAR-004',
              nombre: 'Charizard Base Set 1999 #4/102',
              tipo_discriminador: 'CARTA_INDIVIDUAL',
              slug_categoria: 'psa',
              codigo_set: 'base1',
              era: 'vintage',
              descripcion: 'Holo Rare 1st Edition • Idioma: Inglés • Certificación Bóveda PSA',
              imagen_local: 'img/charizard-base.png',
              imagen_fallback: 'https://images.pokemontcg.io/base1/4_hires.png',
              precio_base: 18500.00,
              stock_total: 7,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            },
            // 2. Umbreon VMAX Moonbreon
            {
              sku: 'PKM-SWSH7-UMB-215',
              nombre: 'Umbreon VMAX Moonbreon Alt Art #215',
              tipo_discriminador: 'CARTA_INDIVIDUAL',
              slug_categoria: 'raw',
              codigo_set: 'swsh7',
              era: 'modern',
              descripcion: 'Alt Art Secret Rare #215/203 • Funda UltraPro • Autenticidad Garantizada',
              imagen_local: 'img/umbreon-vmax.png',
              imagen_fallback: 'https://images.pokemontcg.io/swsh7/215_hires.png',
              precio_base: 1350.00,
              stock_total: 12,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            },
            // 3. Gengar VMAX Alt Art
            {
              sku: 'PKM-SWSH8-GEN-271',
              nombre: 'Gengar VMAX Secret Rare Alt Art #271',
              tipo_discriminador: 'CARTA_INDIVIDUAL',
              slug_categoria: 'psa',
              codigo_set: 'swsh8',
              era: 'modern',
              descripcion: 'Alt Art Secret Rare #271/264 • Idioma: Inglés • Bóveda PSA',
              imagen_local: 'img/gengar-vmax.png',
              imagen_fallback: 'https://images.pokemontcg.io/swsh8/271_hires.png',
              precio_base: 620.00,
              stock_total: 10,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            },
            // 4. Lugia Neo Genesis
            {
              sku: 'PKM-NEO1-LUG-009',
              nombre: 'Lugia 1st Edition Holo #9/111',
              tipo_discriminador: 'CARTA_INDIVIDUAL',
              slug_categoria: 'psa',
              codigo_set: 'neo1',
              era: 'vintage',
              descripcion: 'Holo Rare Neo Genesis • Grado Inversión • Bóveda PSA',
              imagen_local: 'img/lugia-neo.png',
              imagen_fallback: 'https://images.pokemontcg.io/neo1/9_hires.png',
              precio_base: 4200.00,
              stock_total: 6,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            },
            // 5. Booster Pack Team Rocket 1999 (Pesado 20.94g)
            {
              sku: 'PKM-TR-BOOST-1999',
              nombre: 'Booster Pack Team Rocket 1999 Heavy',
              tipo_discriminador: 'PRODUCTO_SELLADO',
              slug_categoria: 'sealed',
              codigo_set: 'base5',
              era: 'vintage',
              descripcion: 'Sobre sellado de fábrica 20.94g Heavy Pack • Arte de Gyarados • Conservación térmica',
              imagen_local: 'img/booster-team-rocket.png',
              imagen_fallback: 'https://images.pokemontcg.io/base5/3_hires.png',
              precio_base: 540.00,
              stock_total: 4,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            },
            // 6. Jungle Booster Box 1999 (36 Sobres)
            {
              sku: 'PKM-JUNG-BOX-1999',
              nombre: 'Jungle Booster Box 1999 (36 Sobres Sellados)',
              tipo_discriminador: 'PRODUCTO_SELLADO',
              slug_categoria: 'sealed',
              codigo_set: 'base2',
              era: 'vintage',
              descripcion: 'Caja sellada de fábrica con 36 sobres Jungle WotC 1999 • Bóveda climatizada',
              imagen_local: 'img/booster-team-rocket.png',
              imagen_fallback: 'https://images.pokemontcg.io/base2/box_hires.png',
              precio_base: 14200.00,
              stock_total: 2,
              activo: 1,
              creado_en: '2026-01-01T00:00:00.000Z'
            }
          ]);

          // G. Detalles específicos de cartas (Datos de artista, rareza y energía)
          await dbInstance.detalles_cartas.bulkPut([
            {
              producto_sku: 'PKM-BASE-CHAR-004',
              numero_carta: '4/102',
              rareza: 'Holo Rare',
              tipo_energia: 'Fuego',
              artista: 'Mitsuhiro Arita',
              es_primera_edicion: true,
              es_shadowless: false,
              hp: 120,
              super_tipo: 'Pokémon'
            },
            {
              producto_sku: 'PKM-SWSH7-UMB-215',
              numero_carta: '215/203',
              rareza: 'Secret Rare Alt Art',
              tipo_energia: 'Oscuridad',
              artista: 'KEIICHIRO ITO',
              es_primera_edicion: false,
              es_shadowless: false,
              hp: 310,
              super_tipo: 'Pokémon VMAX'
            },
            {
              producto_sku: 'PKM-SWSH8-GEN-271',
              numero_carta: '271/264',
              rareza: 'Secret Rare Alt Art',
              tipo_energia: 'Psíquico',
              artista: 'sowsow',
              es_primera_edicion: false,
              es_shadowless: false,
              hp: 320,
              super_tipo: 'Pokémon VMAX'
            },
            {
              producto_sku: 'PKM-NEO1-LUG-009',
              numero_carta: '9/111',
              rareza: 'Holo Rare',
              tipo_energia: 'Incoloro',
              artista: 'Hironobu Yoshida',
              es_primera_edicion: true,
              es_shadowless: false,
              hp: 90,
              super_tipo: 'Pokémon'
            }
          ]);

          // H. Detalles específicos de productos sellados (Gramaje, arte y celofán)
          await dbInstance.detalles_sellados.bulkPut([
            {
              producto_sku: 'PKM-TR-BOOST-1999',
              gramaje_gramos: 20.94,
              arte_sobre: 'Gyarados',
              cantidad_sobres_interior: 1,
              tiene_celofan: false,
              atributos_celofan: null,
              es_pesado_verificado: true,
              estado_sellado: 'SELLADO_DE_FABRICA_HEAVY'
            },
            {
              producto_sku: 'PKM-JUNG-BOX-1999',
              gramaje_gramos: 750.00,
              arte_sobre: 'Jungle Display Box WotC',
              cantidad_sobres_interior: 36,
              tiene_celofan: true,
              atributos_celofan: 'Sello WotC oficial con logos de Pokéball blancos intactos',
              es_pesado_verificado: false,
              estado_sellado: 'CAJA_BOOSTER_BOX_SELLADA'
            }
          ]);

          // I. Certificaciones PSA oficiales (4 grados por cada carta)
          await dbInstance.certificaciones_psa.bulkPut([
            // Charizard Base Set #4
            {
              numero_certificacion: 'RAW-CHAR-004-01',
              producto_sku: 'PKM-BASE-CHAR-004',
              grado: 'RAW',
              etiqueta_grado: 'Near Mint Raw',
              calificacion_centrado: 8.5,
              calificacion_esquinas: 9.0,
              calificacion_bordes: 8.5,
              calificacion_superficie: 9.0,
              precio: 750.00,
              stock_disponible: 3
            },
            {
              numero_certificacion: 'PSA8-48291032',
              producto_sku: 'PKM-BASE-CHAR-004',
              grado: 'PSA 8',
              etiqueta_grado: 'NM-MT 8',
              calificacion_centrado: 8.5,
              calificacion_esquinas: 8.5,
              calificacion_bordes: 8.5,
              calificacion_superficie: 8.5,
              precio: 1800.00,
              stock_disponible: 2
            },
            {
              numero_certificacion: 'PSA9-48291033',
              producto_sku: 'PKM-BASE-CHAR-004',
              grado: 'PSA 9',
              etiqueta_grado: 'MINT 9',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 9.5,
              calificacion_bordes: 9.0,
              calificacion_superficie: 9.5,
              precio: 4850.00,
              stock_disponible: 1
            },
            {
              numero_certificacion: 'PSA10-48291034',
              producto_sku: 'PKM-BASE-CHAR-004',
              grado: 'PSA 10',
              etiqueta_grado: 'GEM MT 10',
              calificacion_centrado: 10.0,
              calificacion_esquinas: 10.0,
              calificacion_bordes: 10.0,
              calificacion_superficie: 10.0,
              precio: 18500.00,
              stock_disponible: 1
            },

            // Umbreon VMAX Moonbreon
            {
              numero_certificacion: 'RAW-UMB-215-01',
              producto_sku: 'PKM-SWSH7-UMB-215',
              grado: 'RAW',
              etiqueta_grado: 'Near Mint Raw',
              calificacion_centrado: 9.5,
              calificacion_esquinas: 9.5,
              calificacion_bordes: 9.0,
              calificacion_superficie: 9.5,
              precio: 650.00,
              stock_disponible: 5
            },
            {
              numero_certificacion: 'PSA8-61948199',
              producto_sku: 'PKM-SWSH7-UMB-215',
              grado: 'PSA 8',
              etiqueta_grado: 'NM-MT 8',
              calificacion_centrado: 8.5,
              calificacion_esquinas: 8.5,
              calificacion_bordes: 8.5,
              calificacion_superficie: 8.5,
              precio: 720.00,
              stock_disponible: 3
            },
            {
              numero_certificacion: 'PSA9-61948200',
              producto_sku: 'PKM-SWSH7-UMB-215',
              grado: 'PSA 9',
              etiqueta_grado: 'MINT 9',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 9.0,
              calificacion_bordes: 9.5,
              calificacion_superficie: 9.0,
              precio: 890.00,
              stock_disponible: 2
            },
            {
              numero_certificacion: 'PSA10-61948201',
              producto_sku: 'PKM-SWSH7-UMB-215',
              grado: 'PSA 10',
              etiqueta_grado: 'GEM MT 10',
              calificacion_centrado: 10.0,
              calificacion_esquinas: 10.0,
              calificacion_bordes: 10.0,
              calificacion_superficie: 10.0,
              precio: 1350.00,
              stock_disponible: 2
            },

            // Gengar VMAX Alt Art
            {
              numero_certificacion: 'RAW-GEN-271-01',
              producto_sku: 'PKM-SWSH8-GEN-271',
              grado: 'RAW',
              etiqueta_grado: 'Near Mint Raw',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 9.0,
              calificacion_bordes: 9.0,
              calificacion_superficie: 9.0,
              precio: 240.00,
              stock_disponible: 4
            },
            {
              numero_certificacion: 'PSA8-59302143',
              producto_sku: 'PKM-SWSH8-GEN-271',
              grado: 'PSA 8',
              etiqueta_grado: 'NM-MT 8',
              calificacion_centrado: 8.5,
              calificacion_esquinas: 8.0,
              calificacion_bordes: 8.5,
              calificacion_superficie: 8.5,
              precio: 340.00,
              stock_disponible: 3
            },
            {
              numero_certificacion: 'PSA9-59302144',
              producto_sku: 'PKM-SWSH8-GEN-271',
              grado: 'PSA 9',
              etiqueta_grado: 'MINT 9',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 9.0,
              calificacion_bordes: 9.0,
              calificacion_superficie: 9.0,
              precio: 460.00,
              stock_disponible: 2
            },
            {
              numero_certificacion: 'PSA10-59302145',
              producto_sku: 'PKM-SWSH8-GEN-271',
              grado: 'PSA 10',
              etiqueta_grado: 'GEM MT 10',
              calificacion_centrado: 10.0,
              calificacion_esquinas: 10.0,
              calificacion_bordes: 10.0,
              calificacion_superficie: 10.0,
              precio: 620.00,
              stock_disponible: 1
            },

            // Lugia Neo Genesis
            {
              numero_certificacion: 'RAW-LUG-009-01',
              producto_sku: 'PKM-NEO1-LUG-009',
              grado: 'RAW',
              etiqueta_grado: 'Near Mint Raw',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 8.5,
              calificacion_bordes: 8.5,
              calificacion_superficie: 9.0,
              precio: 420.00,
              stock_disponible: 2
            },
            {
              numero_certificacion: 'PSA8-48291086',
              producto_sku: 'PKM-NEO1-LUG-009',
              grado: 'PSA 8',
              etiqueta_grado: 'NM-MT 8',
              calificacion_centrado: 8.0,
              calificacion_esquinas: 8.5,
              calificacion_bordes: 8.0,
              calificacion_superficie: 8.5,
              precio: 980.00,
              stock_disponible: 2
            },
            {
              numero_certificacion: 'PSA9-48291087',
              producto_sku: 'PKM-NEO1-LUG-009',
              grado: 'PSA 9',
              etiqueta_grado: 'MINT 9',
              calificacion_centrado: 9.0,
              calificacion_esquinas: 9.0,
              calificacion_bordes: 9.0,
              calificacion_superficie: 9.0,
              precio: 1450.00,
              stock_disponible: 1
            },
            {
              numero_certificacion: 'PSA10-48291088',
              producto_sku: 'PKM-NEO1-LUG-009',
              grado: 'PSA 10',
              etiqueta_grado: 'GEM MT 10',
              calificacion_centrado: 10.0,
              calificacion_esquinas: 10.0,
              calificacion_bordes: 10.0,
              calificacion_superficie: 10.0,
              precio: 4200.00,
              stock_disponible: 1
            }
          ]);

          // J. Historial cronológico de cotizaciones a 12 meses
          const mesesHistoricos = [
            { mes_relativo: 1, fecha: '2025-11-15' },
            { mes_relativo: 2, fecha: '2025-12-15' },
            { mes_relativo: 3, fecha: '2026-01-15' },
            { mes_relativo: 4, fecha: '2026-02-15' },
            { mes_relativo: 5, fecha: '2026-03-15' },
            { mes_relativo: 6, fecha: '2026-04-15' },
            { mes_relativo: 7, fecha: '2026-05-15' },
            { mes_relativo: 8, fecha: '2026-06-15' },
            { mes_relativo: 9, fecha: '2026-07-15' },
            { mes_relativo: 10, fecha: '2026-08-15' },
            { mes_relativo: 11, fecha: '2026-09-15' },
            { mes_relativo: 12, fecha: '2026-10-15' }
          ];

          const seriesHistoricas = [];

          // Factores relativos de crecimiento para cada carta
          const cartasConfigs = [
            {
              sku: 'PKM-BASE-CHAR-004',
              precioFinal: 18500.00,
              factores: [0.82, 0.84, 0.86, 0.88, 0.90, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00]
            },
            {
              sku: 'PKM-SWSH7-UMB-215',
              precioFinal: 1350.00,
              factores: [0.84, 0.85, 0.87, 0.89, 0.90, 0.92, 0.93, 0.95, 0.96, 0.98, 0.99, 1.00]
            },
            {
              sku: 'PKM-SWSH8-GEN-271',
              precioFinal: 620.00,
              factores: [0.87, 0.88, 0.89, 0.91, 0.92, 0.93, 0.94, 0.96, 0.97, 0.98, 0.99, 1.00]
            },
            {
              sku: 'PKM-NEO1-LUG-009',
              precioFinal: 4200.00,
              factores: [0.86, 0.87, 0.89, 0.90, 0.91, 0.93, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00]
            }
          ];

          let registroIdCounter = 1;
          for (const config of cartasConfigs) {
            for (let i = 0; i < 12; i++) {
              const precioCalculado = Math.round(config.precioFinal * config.factores[i] * 100) / 100;
              seriesHistoricas.push({
                registro_id: registroIdCounter++,
                producto_sku: config.sku,
                grado: 'PSA 10',
                fecha_registro: mesesHistoricos[i].fecha,
                mes_relativo: mesesHistoricos[i].mes_relativo,
                precio_usd: precioCalculado,
                volumen_transacciones: Math.floor(8 + Math.random() * 25)
              });
            }
          }

          await dbInstance.historial_precios.bulkPut(seriesHistoricas);

          // K. Orden histórica inicial de custodia
          await dbInstance.ordenes_compra.put({
            numero_orden: '#PKM-2026-8841',
            usuario_cedula: '1710034065',
            fecha_creacion: '2026-10-25T14:30:00.000Z',
            estado: 'En Custodia / En Preparación',
            subtotal: 18500.00,
            impuesto_iva: 2775.00,
            tarifa_envio: 5.00,
            total: 21280.00,
            metodo_pago: 'Tarjeta de Crédito (Visa ***9921)',
            metodo_entrega: 'courier',
            direccion_envio_id: 1,
            transaccion_id: 'TXN-SEC-894102',
            notas: 'Entrega en estuche sellado ignífugo con verificación de custodia'
          });

          // L. Detalle de orden con clave primaria compuesta
          await dbInstance.items_orden.put({
            numero_orden: '#PKM-2026-8841',
            sku: 'PKM-BASE-CHAR-004',
            grado: 'PSA 10',
            cantidad: 1,
            precio_unitario: 18500.00,
            subtotal: 18500.00
          });
        }
      );

      console.log('[GradedSealedDB] ¡Población de datos semilla completada exitosamente!');
      return true;
    } catch (err) {
      console.error('[GradedSealedDB] Error al ejecutar seedDatabase:', err);
      throw err;
    }
  }

  // Asignar métodos principales a la instancia
  dbInstance.procesarOrdenTransaccional = procesarOrdenTransaccional;
  dbInstance.seedDatabase = seedDatabase;

  // Exportar en el ámbito global (navegador)
  global.GradedSealedDB = dbInstance;

  // Autoiniciar semilla cuando el DOM esté listo o inmediatamente
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        dbInstance.seedDatabase().catch(e => console.warn('[GradedSealedDB] Seed diferido:', e));
      });
    } else {
      setTimeout(() => {
        dbInstance.seedDatabase().catch(e => console.warn('[GradedSealedDB] Seed inmediato:', e));
      }, 0);
    }
  }

  // Soporte para entornos Node/CommonJS
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      GradedSealedDB: dbInstance,
      procesarOrdenTransaccional,
      seedDatabase
    };
  }

})(typeof window !== 'undefined' ? window : globalThis);
