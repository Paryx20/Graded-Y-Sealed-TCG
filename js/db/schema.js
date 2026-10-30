/**
 * ==============================================================================
 * Graded & Sealed TCG - Arquitectura de Base de Datos Relacional (Fase 2)
 * Archivo: js/db/schema.js
 * Descripción: Definición formal del esquema relacional de 12 entidades de negocio
 *              con claves primarias naturales/compuestas y relaciones referenciales
 *              para Dexie.js (IndexedDB).
 * ==============================================================================
 */

const GradedSealedSchema = (() => {
  'use strict';

  const DB_NAME = 'GradedSealedDB';
  const DB_VERSION = 1;

  /**
   * Definición de esquemas de almacenamiento para Dexie.js.
   * La primera columna es siempre la Clave Primaria (PK).
   * Clave autoincremental: prefijo '++'.
   * Clave primaria compuesta: '[columna1+columna2+columna3]'.
   * Las columnas subsiguientes son índices secundarios B-Tree.
   */
  const DEXIE_STORES = {
    // 1. Usuarios del sistema / coleccionistas (PK natural: cedula_ruc ecuatoriana)
    usuarios: 'cedula_ruc, email, nombre, telefono, ciudad',

    // 2. Direcciones de entrega y facturación (PK: direccion_id, FK: usuario_cedula)
    direcciones_envio: '++direccion_id, usuario_cedula, ciudad, es_predeterminada',

    // 3. Categorías maestras del catálogo (PK: slug_categoria -> 'psa', 'raw', 'sealed')
    categorias_producto: 'slug_categoria, nombre_categoria, orden',

    // 4. Sets y expansiones históricas TCG (PK: codigo_set -> 'base1', 'neo1', 'swsh7')
    sets_expansiones: 'codigo_set, nombre_set, era, anio_lanzamiento',

    // 5. Productos / ítems del catálogo (PK: sku, discriminador: 'CARTA_INDIVIDUAL' | 'PRODUCTO_SELLADO')
    productos: 'sku, tipo_discriminador, slug_categoria, codigo_set, era, activo',

    // 6. Atributos específicos de cartas individuales (PK/FK: producto_sku)
    detalles_cartas: 'producto_sku, rareza, tipo_energia, artista',

    // 7. Atributos específicos de productos sellados (PK/FK: producto_sku, gramaje, cantidad)
    detalles_sellados: 'producto_sku, gramaje_gramos, cantidad_sobres_interior, es_pesado_verificado',

    // 8. Certificaciones oficiales PSA y cápsulas acrílicas (PK: numero_certificacion)
    certificaciones_psa: 'numero_certificacion, producto_sku, grado, stock_disponible',

    // 9. Historial cronológico de cotizaciones mensuales a 12 meses (PK: registro_id)
    historial_precios: '++registro_id, producto_sku, grado, fecha_registro, mes_relativo',

    // 10. Bóveda de tarjetas y tokens PCI-DSS simulados (PK: token_tarjeta)
    metodos_pago_tokenizados: 'token_tarjeta, usuario_cedula, ultimos_4_digitos, marca_tarjeta',

    // 11. Órdenes de compra comerciales con desglose fiscal (PK: numero_orden)
    ordenes_compra: 'numero_orden, usuario_cedula, fecha_creacion, estado, metodo_pago',

    // 12. Líneas de detalle por orden (PK Compuesta: [numero_orden+sku+grado])
    items_orden: '[numero_orden+sku+grado], numero_orden, sku, grado'
  };

  /**
   * Diccionario de Metadatos y Restricciones de Integridad Referencial
   */
  const TABLE_DEFINITIONS = {
    usuarios: {
      pk: 'cedula_ruc',
      tipoPk: 'STRING_NATURAL (Algoritmo Módulo 10)',
      indices: ['email', 'nombre', 'telefono', 'ciudad'],
      descripcion: 'Entidad de coleccionistas y clientes con identidad ecuatoriana verificada'
    },
    direcciones_envio: {
      pk: 'direccion_id',
      tipoPk: 'INTEGER_AUTOINCREMENT',
      fk: { usuario_cedula: 'usuarios.cedula_ruc' },
      indices: ['usuario_cedula', 'ciudad', 'es_predeterminada'],
      descripcion: 'Direcciones físicas de entrega nacional blindada y facturación'
    },
    categorias_producto: {
      pk: 'slug_categoria',
      tipoPk: 'STRING_NATURAL',
      indices: ['nombre_categoria', 'orden'],
      descripcion: 'Clasificación principal: Slabs PSA, Cartas Raw, Cajas y Sobres Sellados'
    },
    sets_expansiones: {
      pk: 'codigo_set',
      tipoPk: 'STRING_NATURAL',
      indices: ['nombre_set', 'era', 'anio_lanzamiento'],
      descripcion: 'Expansiones TCG vintage (WotC 1999-2002) y modernas (Sword & Shield / SV)'
    },
    productos: {
      pk: 'sku',
      tipoPk: 'STRING_NATURAL',
      fk: {
        slug_categoria: 'categorias_producto.slug_categoria',
        codigo_set: 'sets_expansiones.codigo_set'
      },
      discriminador: 'tipo_discriminador ("CARTA_INDIVIDUAL" | "PRODUCTO_SELLADO")',
      indices: ['tipo_discriminador', 'slug_categoria', 'codigo_set', 'era', 'activo'],
      descripcion: 'Catálogo unificado maestro con discriminador polimórfico de tipo de ítem'
    },
    detalles_cartas: {
      pk: 'producto_sku',
      tipoPk: 'STRING_FK_1A1',
      fk: { producto_sku: 'productos.sku' },
      indices: ['rareza', 'tipo_energia', 'artista'],
      descripcion: 'Metadatos coleccionables específicos para cartas individuales'
    },
    detalles_sellados: {
      pk: 'producto_sku',
      tipoPk: 'STRING_FK_1A1',
      fk: { producto_sku: 'productos.sku' },
      indices: ['gramaje_gramos', 'cantidad_sobres_interior', 'es_pesado_verificado'],
      descripcion: 'Especificaciones de fábrica de sobres y cajas: gramaje, arte y celofán'
    },
    certificaciones_psa: {
      pk: 'numero_certificacion',
      tipoPk: 'STRING_NATURAL',
      fk: { producto_sku: 'productos.sku' },
      indices: ['producto_sku', 'grado', 'stock_disponible'],
      descripcion: 'Calificaciones numéricas oficiales (Raw, PSA 8, PSA 9, PSA 10) y existencias'
    },
    historial_precios: {
      pk: 'registro_id',
      tipoPk: 'INTEGER_AUTOINCREMENT',
      fk: { producto_sku: 'productos.sku' },
      indices: ['producto_sku', 'grado', 'fecha_registro', 'mes_relativo'],
      descripcion: 'Series cronológicas a 12 meses de cotizaciones para gráficas de inversión'
    },
    metodos_pago_tokenizados: {
      pk: 'token_tarjeta',
      tipoPk: 'STRING_NATURAL_TOKEN',
      fk: { usuario_cedula: 'usuarios.cedula_ruc' },
      indices: ['usuario_cedula', 'ultimos_4_digitos', 'marca_tarjeta'],
      descripcion: 'Tokens seguros de tarjetas sin almacenar CVV ni datos sensibles'
    },
    ordenes_compra: {
      pk: 'numero_orden',
      tipoPk: 'STRING_NATURAL',
      fk: {
        usuario_cedula: 'usuarios.cedula_ruc',
        direccion_envio_id: 'direcciones_envio.direccion_id'
      },
      indices: ['usuario_cedula', 'fecha_creacion', 'estado', 'metodo_pago'],
      descripcion: 'Cabecera de transacciones comerciales con IVA al 15% y fletes $0/$3/$5'
    },
    items_orden: {
      pk: '[numero_orden+sku+grado]',
      tipoPk: 'COMPUESTA (numero_orden, sku, grado)',
      fk: {
        numero_orden: 'ordenes_compra.numero_orden',
        sku: 'productos.sku'
      },
      indices: ['numero_orden', 'sku', 'grado'],
      descripcion: 'Detalle de ítems adquiridos, precio de captura y stock descontado'
    }
  };

  return {
    DB_NAME,
    DB_VERSION,
    DEXIE_STORES,
    TABLE_DEFINITIONS
  };
})();

// Soporte universal de exportación para navegadores y entornos CommonJS/ESM
if (typeof window !== 'undefined') {
  window.GradedSealedSchema = GradedSealedSchema;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GradedSealedSchema;
}
