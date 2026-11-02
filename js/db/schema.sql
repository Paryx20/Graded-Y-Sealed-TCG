-- ==============================================================================
-- Graded & Sealed TCG - Esquema Relacional de Base de Datos (FASE 8: Supabase)
-- Archivo: js/db/schema.sql
-- Motor: PostgreSQL 15+ / Supabase
-- Descripción: Definición formal DDL de 12 entidades relacionales de negocio,
--              restricciones de integridad referencial, índices B-Tree,
--              claves compuestas y Políticas de Seguridad de Filas (RLS).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    cedula_ruc VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(30),
    ciudad VARCHAR(100),
    direccion_principal TEXT,
    rol VARCHAR(50) DEFAULT 'CLIENTE_REGISTRADO',
    auth_provider VARCHAR(50) DEFAULT 'local',
    auth_provider_id VARCHAR(100),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    actualizado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabla: direcciones_envio
CREATE TABLE IF NOT EXISTS direcciones_envio (
    direccion_id SERIAL PRIMARY KEY,
    usuario_cedula VARCHAR(20) NOT NULL REFERENCES usuarios(cedula_ruc) ON DELETE CASCADE,
    calle_principal VARCHAR(150) NOT NULL,
    calle_secundaria VARCHAR(150),
    referencia TEXT,
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20),
    es_predeterminada SMALLINT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Tabla: categorias_producto
CREATE TABLE IF NOT EXISTS categorias_producto (
    slug_categoria VARCHAR(50) PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

-- 4. Tabla: sets_expansiones
CREATE TABLE IF NOT EXISTS sets_expansiones (
    codigo_set VARCHAR(50) PRIMARY KEY,
    nombre_set VARCHAR(150) NOT NULL,
    era VARCHAR(50) NOT NULL,
    anio_lanzamiento INTEGER NOT NULL,
    total_cartas INTEGER,
    logo_url TEXT,
    simbolo_url TEXT
);

-- 5. Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    sku VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo_discriminador VARCHAR(50) NOT NULL CHECK (tipo_discriminador IN ('CARTA_INDIVIDUAL', 'PRODUCTO_SELLADO')),
    slug_categoria VARCHAR(50) NOT NULL REFERENCES categorias_producto(slug_categoria) ON DELETE RESTRICT,
    codigo_set VARCHAR(50) REFERENCES sets_expansiones(codigo_set) ON DELETE SET NULL,
    era VARCHAR(50) NOT NULL DEFAULT 'modern',
    descripcion TEXT,
    imagen_local TEXT,
    imagen_fallback TEXT,
    precio_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_total INTEGER NOT NULL DEFAULT 0 CHECK (stock_total >= 0),
    activo SMALLINT NOT NULL DEFAULT 1,
    tendencia12m VARCHAR(20),
    rendimiento_anual NUMERIC(6, 2),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Tabla: detalles_cartas
CREATE TABLE IF NOT EXISTS detalles_cartas (
    producto_sku VARCHAR(100) PRIMARY KEY REFERENCES productos(sku) ON DELETE CASCADE,
    numero_carta VARCHAR(50),
    rareza VARCHAR(100),
    tipo_energia VARCHAR(50),
    artista VARCHAR(150),
    es_primera_edicion BOOLEAN DEFAULT FALSE,
    es_shadowless BOOLEAN DEFAULT FALSE,
    hp INTEGER,
    super_tipo VARCHAR(50) DEFAULT 'Pokémon'
);

-- 7. Tabla: detalles_sellados
CREATE TABLE IF NOT EXISTS detalles_sellados (
    producto_sku VARCHAR(100) PRIMARY KEY REFERENCES productos(sku) ON DELETE CASCADE,
    gramaje_gramos NUMERIC(8, 2),
    arte_sobre VARCHAR(150),
    cantidad_sobres_interior INTEGER DEFAULT 1,
    tiene_celofan BOOLEAN DEFAULT TRUE,
    atributos_celofan TEXT,
    es_pesado_verificado BOOLEAN DEFAULT FALSE,
    estado_sellado VARCHAR(100) DEFAULT 'SELLADO_DE_FABRICA'
);

-- 8. Tabla: certificaciones_psa
CREATE TABLE IF NOT EXISTS certificaciones_psa (
    numero_certificacion VARCHAR(50) PRIMARY KEY,
    producto_sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE CASCADE,
    grado VARCHAR(20) NOT NULL,
    etiqueta_grado VARCHAR(50),
    calificacion_centrado NUMERIC(3, 1),
    calificacion_esquinas NUMERIC(3, 1),
    calificacion_bordes NUMERIC(3, 1),
    calificacion_superficie NUMERIC(3, 1),
    precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
    stock_disponible INTEGER NOT NULL DEFAULT 0 CHECK (stock_disponible >= 0),
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Tabla: historial_precios
CREATE TABLE IF NOT EXISTS historial_precios (
    registro_id SERIAL PRIMARY KEY,
    producto_sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE CASCADE,
    grado VARCHAR(20) NOT NULL DEFAULT 'PSA 10',
    fecha_registro DATE NOT NULL,
    mes_relativo INTEGER NOT NULL CHECK (mes_relativo BETWEEN 1 AND 12),
    precio_usd NUMERIC(12, 2) NOT NULL,
    volumen_transacciones INTEGER DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 10. Tabla: metodos_pago_tokenizados
CREATE TABLE IF NOT EXISTS metodos_pago_tokenizados (
    token_tarjeta VARCHAR(100) PRIMARY KEY,
    usuario_cedula VARCHAR(20) NOT NULL REFERENCES usuarios(cedula_ruc) ON DELETE CASCADE,
    ultimos_4_digitos VARCHAR(4) NOT NULL,
    marca_tarjeta VARCHAR(50) NOT NULL,
    titular VARCHAR(150) NOT NULL,
    mes_expiracion VARCHAR(2) NOT NULL,
    anio_expiracion VARCHAR(4) NOT NULL,
    activo SMALLINT DEFAULT 1,
    creado_en TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Tabla: ordenes_compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    numero_orden VARCHAR(50) PRIMARY KEY,
    usuario_cedula VARCHAR(20) REFERENCES usuarios(cedula_ruc) ON DELETE SET NULL,
    fecha_creacion TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    estado VARCHAR(100) NOT NULL DEFAULT 'En Custodia / En Preparación',
    subtotal NUMERIC(12, 2) NOT NULL,
    impuesto_iva NUMERIC(12, 2) NOT NULL,
    tarifa_envio NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    metodo_pago VARCHAR(100) NOT NULL,
    metodo_entrega VARCHAR(50) NOT NULL DEFAULT 'courier',
    direccion_envio_id INTEGER REFERENCES direcciones_envio(direccion_id) ON DELETE SET NULL,
    transaccion_id VARCHAR(100),
    guia_tracking VARCHAR(100),
    notas TEXT
);

-- 12. Tabla: items_orden (Clave Primaria Compuesta: numero_orden, sku, grado)
CREATE TABLE IF NOT EXISTS items_orden (
    numero_orden VARCHAR(50) NOT NULL REFERENCES ordenes_compra(numero_orden) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL REFERENCES productos(sku) ON DELETE RESTRICT,
    grado VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    PRIMARY KEY (numero_orden, sku, grado)
);

-- ÍNDICES B-TREE
CREATE INDEX IF NOT EXISTS idx_direcciones_usuario ON direcciones_envio(usuario_cedula);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(slug_categoria);
CREATE INDEX IF NOT EXISTS idx_productos_set ON productos(codigo_set);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo_discriminador);
CREATE INDEX IF NOT EXISTS idx_certificaciones_sku ON certificaciones_psa(producto_sku);
CREATE INDEX IF NOT EXISTS idx_certificaciones_grado ON certificaciones_psa(grado);
CREATE INDEX IF NOT EXISTS idx_historial_sku_grado ON historial_precios(producto_sku, grado);
CREATE INDEX IF NOT EXISTS idx_ordenes_usuario ON ordenes_compra(usuario_cedula);
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes_compra(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_items_orden_sku ON items_orden(sku);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets_expansiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_cartas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_sellados ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificaciones_psa ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_pago_tokenizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_orden ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
CREATE POLICY "Public Read Categorias" ON categorias_producto FOR SELECT USING (true);
CREATE POLICY "Public Read Sets" ON sets_expansiones FOR SELECT USING (true);
CREATE POLICY "Public Read Productos" ON productos FOR SELECT USING (true);
CREATE POLICY "Public Read Detalles Cartas" ON detalles_cartas FOR SELECT USING (true);
CREATE POLICY "Public Read Detalles Sellados" ON detalles_sellados FOR SELECT USING (true);
CREATE POLICY "Public Read Certificaciones PSA" ON certificaciones_psa FOR SELECT USING (true);
CREATE POLICY "Public Read Historial Precios" ON historial_precios FOR SELECT USING (true);

-- Políticas de usuarios y direcciones
CREATE POLICY "Allow All Users Select" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Allow All Users Insert" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Users Update" ON usuarios FOR UPDATE USING (true);

CREATE POLICY "Allow All Direcciones Select" ON direcciones_envio FOR SELECT USING (true);
CREATE POLICY "Allow All Direcciones Insert" ON direcciones_envio FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Direcciones Update" ON direcciones_envio FOR UPDATE USING (true);

-- Políticas de métodos de pago
CREATE POLICY "Allow All MetodosPago Select" ON metodos_pago_tokenizados FOR SELECT USING (true);
CREATE POLICY "Allow All MetodosPago Insert" ON metodos_pago_tokenizados FOR INSERT WITH CHECK (true);

-- Políticas de órdenes comerciales
CREATE POLICY "Public Read Ordenes" ON ordenes_compra FOR SELECT USING (true);
CREATE POLICY "Public Insert Ordenes" ON ordenes_compra FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Items Orden" ON items_orden FOR SELECT USING (true);
CREATE POLICY "Public Insert Items Orden" ON items_orden FOR INSERT WITH CHECK (true);
