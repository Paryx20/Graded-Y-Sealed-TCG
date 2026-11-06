-- ==============================================================================
-- Graded & Sealed TCG - Esquema de base de datos (Supabase / PostgreSQL 17)
-- Archivo: js/db/schema.sql  ·  Versión 2
--
-- 13 tablas:
--   Catálogo .... categorias_producto, sets_expansiones, productos,
--                 detalles_cartas, detalles_sellados, certificaciones_psa
--                 (precio y stock por grado), historial_precios
--   Clientes .... usuarios, direcciones_envio, metodos_pago_tokenizados
--   Ventas ...... ordenes_compra, items_orden, eventos_tracking
--
-- Seguridad:
--   * El catálogo es de lectura pública (vista v_catalogo).
--   * Usuarios, direcciones, tarjetas y órdenes NO se pueden leer ni escribir
--     directamente con la clave pública: solo mediante las funciones RPC de
--     js/db/funciones_rpc.sql, que validan la sesión o la cédula del titular.
--   * Nunca se guarda el número completo de la tarjeta ni el CVV.
-- Datos iniciales del catálogo: js/db/seed_catalogo.sql
-- ==============================================================================

-- ---------------------------------------------------------------- Catálogo

create table categorias_producto (
  slug_categoria   varchar(20) primary key,
  nombre_categoria varchar(80) not null,
  descripcion      text,
  orden            smallint not null default 0
);

create table sets_expansiones (
  codigo_set       varchar(40) primary key,
  nombre_set       varchar(120) not null unique,
  era              varchar(10) not null check (era in ('vintage', 'modern')),
  anio_lanzamiento smallint not null check (anio_lanzamiento between 1996 and 2100)
);

create table productos (
  sku                varchar(60) primary key,
  nombre             varchar(160) not null,
  tipo_discriminador varchar(20) not null check (tipo_discriminador in ('CARTA_INDIVIDUAL', 'PRODUCTO_SELLADO')),
  slug_categoria     varchar(20) not null references categorias_producto (slug_categoria),
  codigo_set         varchar(40) references sets_expansiones (codigo_set),
  descripcion        text,
  imagen_url         text,
  rendimiento_anual  numeric(5, 2),
  -- BOVEDA: inventario propio · API_TCG: carta pedida desde la búsqueda en la API Pokémon TCG
  origen             varchar(10) not null default 'BOVEDA' check (origen in ('BOVEDA', 'API_TCG')),
  activo             boolean not null default true,
  creado_en          timestamptz not null default now()
);
create index idx_productos_categoria on productos (slug_categoria);
create index idx_productos_set on productos (codigo_set);

create table detalles_cartas (
  producto_sku varchar(60) primary key references productos (sku) on delete cascade,
  numero_carta varchar(20),
  rareza       varchar(60) not null,
  tipo_energia varchar(30) not null
);

create table detalles_sellados (
  producto_sku             varchar(60) primary key references productos (sku) on delete cascade,
  gramaje_gramos           numeric(7, 1) check (gramaje_gramos > 0),
  cantidad_sobres_interior smallint not null default 1 check (cantidad_sobres_interior > 0),
  tiene_celofan            boolean not null default true,
  es_pesado_verificado     boolean not null default false,
  estado_sellado           varchar(120) not null default 'Sellado de fábrica'
);

-- Una fila por producto y grado disponible: precio y stock reales de la bóveda
create table certificaciones_psa (
  producto_sku         varchar(60) not null references productos (sku) on delete cascade,
  grado                varchar(10) not null check (grado in ('raw', 'psa8', 'psa9', 'psa10', 'sealed')),
  numero_certificacion varchar(20) unique,
  precio               numeric(10, 2) not null check (precio > 0),
  stock_disponible     integer not null default 0 check (stock_disponible >= 0),
  primary key (producto_sku, grado),
  -- Solo los slabs PSA tienen número de certificado
  check ((grado like 'psa%') = (numero_certificacion is not null))
);

create table historial_precios (
  producto_sku varchar(60) not null references productos (sku) on delete cascade,
  grado        varchar(10) not null,
  mes          date not null check (extract(day from mes) = 1),
  precio_usd   numeric(10, 2) not null check (precio_usd > 0),
  primary key (producto_sku, grado, mes),
  foreign key (producto_sku, grado) references certificaciones_psa (producto_sku, grado) on delete cascade
);

-- ---------------------------------------------------------------- Clientes

create table usuarios (
  cedula_ruc     varchar(13) primary key check (cedula_ruc ~ '^\d{10}(\d{3})?$'),
  nombre         varchar(80) not null check (length(trim(nombre)) >= 5),
  email          varchar(150) not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  telefono       varchar(20) check (telefono ~ '^\+593 9\d{8}$'),
  rol            varchar(30) not null default 'CLIENTE_REGISTRADO',
  password_hash  text not null,
  token_sesion   uuid unique,
  ultimo_acceso  timestamptz,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table direcciones_envio (
  direccion_id      serial primary key,
  usuario_cedula    varchar(13) not null references usuarios (cedula_ruc) on delete cascade,
  calle_principal   varchar(150) not null check (length(trim(calle_principal)) >= 8),
  ciudad            varchar(60) not null,
  es_predeterminada boolean not null default false,
  creado_en         timestamptz not null default now()
);
-- Cada usuario tiene como máximo una dirección predeterminada
create unique index ux_direccion_predeterminada on direcciones_envio (usuario_cedula) where es_predeterminada;

create table metodos_pago_tokenizados (
  token_tarjeta     varchar(40) primary key,
  usuario_cedula    varchar(13) not null references usuarios (cedula_ruc) on delete cascade,
  marca_tarjeta     varchar(20) not null check (marca_tarjeta in ('Visa', 'Mastercard')),
  ultimos_4_digitos char(4) not null check (ultimos_4_digitos ~ '^\d{4}$'),
  titular           varchar(80) not null,
  mes_expiracion    smallint not null check (mes_expiracion between 1 and 12),
  anio_expiracion   smallint not null check (anio_expiracion >= 2024),
  creado_en         timestamptz not null default now(),
  unique (usuario_cedula, marca_tarjeta, ultimos_4_digitos, mes_expiracion, anio_expiracion)
);

-- ---------------------------------------------------------------- Ventas

create table ordenes_compra (
  numero_orden          varchar(30) primary key,
  usuario_cedula        varchar(13) not null references usuarios (cedula_ruc),
  fecha_creacion        timestamptz not null default now(),
  estado                varchar(60) not null default 'En preparación',
  subtotal              numeric(10, 2) not null check (subtotal >= 0),
  impuesto_iva          numeric(10, 2) not null check (impuesto_iva >= 0),
  tarifa_envio          numeric(6, 2) not null check (tarifa_envio >= 0),
  total                 numeric(10, 2) not null check (total >= 0),
  metodo_pago           varchar(10) not null check (metodo_pago in ('TARJETA', 'EFECTIVO')),
  token_tarjeta         varchar(40) references metodos_pago_tokenizados (token_tarjeta),
  metodo_entrega        varchar(10) not null check (metodo_entrega in ('courier', 'quito', 'pickup')),
  direccion_envio_id    integer references direcciones_envio (direccion_id),
  guia_tracking         varchar(30) unique,
  -- 0 cancelado · 1 preparación · 2 en camino / listo para retiro · 3 en reparto · 4 entregado / retirado
  paso_tracking         smallint not null default 1 check (paso_tracking in (-1, 0, 1, 2, 3, 4)),
  intentos_verificacion smallint not null default 0 check (intentos_verificacion between 0 and 3),
  detalle               jsonb not null,
  check (metodo_pago = 'TARJETA' or token_tarjeta is null),
  check (metodo_pago <> 'EFECTIVO' or metodo_entrega = 'pickup'),
  check (metodo_entrega = 'pickup' or direccion_envio_id is not null)
);
create index idx_ordenes_usuario on ordenes_compra (usuario_cedula, fecha_creacion desc);
create index idx_ordenes_direccion on ordenes_compra (direccion_envio_id);
create index idx_ordenes_tarjeta on ordenes_compra (token_tarjeta);

create table items_orden (
  numero_orden    varchar(30) not null references ordenes_compra (numero_orden) on delete cascade,
  sku             varchar(60) not null references productos (sku),
  grado           varchar(10) not null check (grado in ('raw', 'psa8', 'psa9', 'psa10', 'sealed')),
  cantidad        smallint not null check (cantidad > 0),
  precio_unitario numeric(10, 2) not null check (precio_unitario > 0),
  subtotal        numeric(10, 2) generated always as (cantidad * precio_unitario) stored,
  primary key (numero_orden, sku, grado)
);
create index idx_items_sku on items_orden (sku);

-- Bitácora de la cadena de custodia: cada cambio de etapa y cada verificación de cédula
create table eventos_tracking (
  evento_id    bigserial primary key,
  numero_orden varchar(30) not null references ordenes_compra (numero_orden) on delete cascade,
  paso         smallint not null,
  descripcion  varchar(200) not null,
  creado_en    timestamptz not null default now()
);
create index idx_eventos_orden on eventos_tracking (numero_orden, creado_en);

-- ---------------------------------------------------------------- Vista pública del catálogo

create view v_catalogo with (security_invoker = true) as
select p.sku,
       p.nombre,
       p.slug_categoria,
       p.tipo_discriminador,
       s.nombre_set,
       s.era,
       p.imagen_url,
       p.rendimiento_anual,
       (select jsonb_object_agg(c.grado, c.precio) from certificaciones_psa c where c.producto_sku = p.sku) as precios,
       (select jsonb_object_agg(c.grado, c.stock_disponible) from certificaciones_psa c where c.producto_sku = p.sku) as stock,
       (select jsonb_agg(h.precio_usd order by h.mes) from historial_precios h
         where h.producto_sku = p.sku and h.grado = case when p.tipo_discriminador = 'PRODUCTO_SELLADO' then 'sealed' else 'psa10' end) as historial
  from productos p
  left join sets_expansiones s on s.codigo_set = p.codigo_set
 where p.activo and p.origen = 'BOVEDA';

-- ---------------------------------------------------------------- Seguridad (RLS)

alter table categorias_producto enable row level security;
alter table sets_expansiones enable row level security;
alter table productos enable row level security;
alter table detalles_cartas enable row level security;
alter table detalles_sellados enable row level security;
alter table certificaciones_psa enable row level security;
alter table historial_precios enable row level security;
alter table usuarios enable row level security;
alter table direcciones_envio enable row level security;
alter table metodos_pago_tokenizados enable row level security;
alter table ordenes_compra enable row level security;
alter table items_orden enable row level security;
alter table eventos_tracking enable row level security;

create policy "Lectura pública" on categorias_producto for select using (true);
create policy "Lectura pública" on sets_expansiones for select using (true);
create policy "Lectura pública" on productos for select using (activo);
create policy "Lectura pública" on detalles_cartas for select using (true);
create policy "Lectura pública" on detalles_sellados for select using (true);
create policy "Lectura pública" on certificaciones_psa for select using (true);
create policy "Lectura pública" on historial_precios for select using (true);
-- usuarios, direcciones_envio, metodos_pago_tokenizados, ordenes_compra, items_orden
-- y eventos_tracking no tienen políticas: solo se acceden con las funciones RPC.

grant select on v_catalogo to anon, authenticated;
