-- ==============================================================================
-- Graded & Sealed TCG - Funciones RPC (Supabase)
-- Archivo: js/db/funciones_rpc.sql  ·  Versión 2
--
-- Son la única puerta de entrada del navegador a usuarios, direcciones,
-- tarjetas y órdenes. Se ejecutan con SECURITY DEFINER y validan:
--   * la sesión (token_sesion) para perfil, compras e historial,
--   * la cédula del titular para el tracking público,
--   * el stock y el precio de cada pieza en la compra (todo en una transacción).
-- ==============================================================================

-- Validación de cédula/RUC ecuatoriano (Módulo 10), igual que en el navegador
create or replace function public._cedula_valida(p text)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  base text;
  suma int := 0;
  v int;
begin
  if p !~ '^\d{10}(\d{3})?$' then return false; end if;
  if length(p) = 13 and right(p, 3) <> '001' then return false; end if;
  base := left(p, 10);
  if substr(base, 1, 2)::int not between 1 and 24 or substr(base, 3, 1)::int >= 6 then return false; end if;
  for i in 1..9 loop
    v := substr(base, i, 1)::int * case when i % 2 = 1 then 2 else 1 end;
    suma := suma + case when v >= 10 then v - 9 else v end;
  end loop;
  return (10 - suma % 10) % 10 = substr(base, 10, 1)::int;
end $$;

create or replace function public._usuario_json(p_cedula text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'cedula_ruc', u.cedula_ruc, 'nombre', u.nombre, 'email', u.email, 'telefono', u.telefono,
    'ciudad', d.ciudad, 'direccion_principal', d.calle_principal,
    'token_sesion', u.token_sesion, 'creado_en', u.creado_en)
    from public.usuarios u
    left join public.direcciones_envio d on d.usuario_cedula = u.cedula_ruc and d.es_predeterminada
   where u.cedula_ruc = p_cedula;
$$;

-- Crea o actualiza la dirección predeterminada y devuelve su id
create or replace function public._guardar_direccion(p_cedula text, p_calle text, p_ciudad text)
returns integer language plpgsql set search_path = '' as $$
declare v_id integer;
begin
  if coalesce(trim(p_calle), '') = '' then return null; end if;
  update public.direcciones_envio
     set calle_principal = trim(p_calle), ciudad = coalesce(nullif(trim(p_ciudad), ''), ciudad)
   where usuario_cedula = p_cedula and es_predeterminada
  returning direccion_id into v_id;
  if v_id is null then
    insert into public.direcciones_envio (usuario_cedula, calle_principal, ciudad, es_predeterminada)
    values (p_cedula, trim(p_calle), coalesce(nullif(trim(p_ciudad), ''), 'Quito'), true)
    returning direccion_id into v_id;
  end if;
  return v_id;
end $$;

-- Detalle de la orden para la interfaz, con el estado de tracking actualizado desde las columnas
create or replace function public._orden_json(o public.ordenes_compra)
returns jsonb language sql stable set search_path = '' as $$
  select o.detalle || jsonb_build_object(
    'trackingStep', o.paso_tracking,
    'idAttempts', o.intentos_verificacion,
    'status', o.estado);
$$;

-- ------------------------------------------------------------------ Cuentas

create or replace function public.registrar_usuario(
  p_cedula text, p_nombre text, p_email text, p_password text,
  p_telefono text default null, p_ciudad text default null, p_direccion text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public._cedula_valida(trim(p_cedula)) then raise exception 'CEDULA_INVALIDA'; end if;
  if length(coalesce(p_password, '')) < 8 then raise exception 'PASSWORD_CORTA'; end if;
  if exists (select 1 from public.usuarios where lower(email) = lower(trim(p_email))) then
    raise exception 'EMAIL_EXISTE';
  end if;
  if exists (select 1 from public.usuarios where cedula_ruc = trim(p_cedula)) then
    raise exception 'CEDULA_EXISTE';
  end if;
  insert into public.usuarios (cedula_ruc, nombre, email, telefono, password_hash, token_sesion, ultimo_acceso)
  values (trim(p_cedula), trim(p_nombre), lower(trim(p_email)), p_telefono,
          extensions.crypt(p_password, extensions.gen_salt('bf')), gen_random_uuid(), now());
  perform public._guardar_direccion(trim(p_cedula), p_direccion, p_ciudad);
  return public._usuario_json(trim(p_cedula));
end $$;

create or replace function public.iniciar_sesion(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.usuarios;
begin
  select * into u from public.usuarios where lower(email) = lower(trim(p_email));
  if u.cedula_ruc is null or u.password_hash <> extensions.crypt(p_password, u.password_hash) then
    raise exception 'CREDENCIALES_INVALIDAS';
  end if;
  update public.usuarios set token_sesion = gen_random_uuid(), ultimo_acceso = now()
   where cedula_ruc = u.cedula_ruc;
  return public._usuario_json(u.cedula_ruc);
end $$;

/*
  Actualiza los datos del perfil. Para cambiar el correo (p_email distinto al
  actual) se exige la contraseña actual (p_password) y que el nuevo correo no
  esté registrado por otra cuenta.
*/
drop function if exists public.actualizar_perfil(uuid, text, text, text, text);
create or replace function public.actualizar_perfil(
  p_token uuid, p_nombre text, p_telefono text, p_ciudad text, p_direccion text,
  p_email text default null, p_password text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u public.usuarios;
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  select * into u from public.usuarios where token_sesion = p_token;
  if u.cedula_ruc is null then raise exception 'SESION_INVALIDA'; end if;

  if v_email <> '' and v_email <> lower(u.email) then
    if p_password is null or u.password_hash <> extensions.crypt(p_password, u.password_hash) then
      raise exception 'PASSWORD_INCORRECTA';
    end if;
    if v_email !~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' then raise exception 'EMAIL_INVALIDO'; end if;
    if exists (select 1 from public.usuarios where lower(email) = v_email and cedula_ruc <> u.cedula_ruc) then
      raise exception 'EMAIL_EXISTE';
    end if;
  else
    v_email := lower(u.email);
  end if;

  update public.usuarios
     set nombre = trim(p_nombre), telefono = p_telefono, email = v_email, actualizado_en = now()
   where cedula_ruc = u.cedula_ruc;
  perform public._guardar_direccion(u.cedula_ruc, p_direccion, p_ciudad);
  return public._usuario_json(u.cedula_ruc);
end $$;

-- ------------------------------------------------------------- Inventario

/*
  Repone (o descuenta, con cantidad negativa) el stock de un producto en un
  grado. Solo para el administrador: se ejecuta desde el SQL Editor de
  Supabase y no está disponible para los visitantes de la web.
    select public.reponer_stock('pikachu-crown-zenith', 'psa10', 5);
*/
create or replace function public.reponer_stock(p_sku text, p_grado text, p_cantidad integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_stock integer;
begin
  update public.certificaciones_psa
     set stock_disponible = stock_disponible + p_cantidad
   where producto_sku = p_sku and grado = p_grado
  returning stock_disponible into v_stock;
  if v_stock is null then
    raise exception 'No existe el producto % con grado %', p_sku, p_grado;
  end if;
  return v_stock;
end $$;

-- ------------------------------------------------------------------ Compras

/*
  p_orden:   detalle de la orden (orderId, trackingNumber, totales, metodo_entrega, ...)
  p_items:   [{ sku, grado, cantidad, precio, nombre, imagen }]
  p_tarjeta: { marca, ultimos4, titular, mes, anio } o null si paga en efectivo
  Descuenta el stock y valida que el precio coincida con la bóveda. Si algo
  falla, la transacción completa se revierte y no se crea la orden.
*/
create or replace function public.guardar_orden(p_token uuid, p_orden jsonb, p_items jsonb, p_tarjeta jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_cedula    text;
  v_entrega   text := coalesce(p_orden->>'metodo_entrega', 'courier');
  v_dir       integer;
  v_token     text;
  v_subtotal  numeric(10, 2) := 0;
  v_precio    numeric(10, 2);
  v_item      jsonb;
  v_cant      int;
  v_numero    text := p_orden->>'orderId';
begin
  select cedula_ruc into v_cedula from public.usuarios where token_sesion = p_token;
  if v_cedula is null then raise exception 'SESION_INVALIDA'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then raise exception 'ORDEN_VACIA'; end if;

  if v_entrega <> 'pickup' then
    v_dir := public._guardar_direccion(v_cedula, p_orden->>'shippingStreet', p_orden->>'shippingCity');
  end if;

  if p_tarjeta is not null then
    insert into public.metodos_pago_tokenizados
      (token_tarjeta, usuario_cedula, marca_tarjeta, ultimos_4_digitos, titular, mes_expiracion, anio_expiracion)
    values ('tok_' || replace(gen_random_uuid()::text, '-', ''), v_cedula, p_tarjeta->>'marca', p_tarjeta->>'ultimos4',
            upper(p_tarjeta->>'titular'), (p_tarjeta->>'mes')::smallint, (p_tarjeta->>'anio')::smallint)
    on conflict (usuario_cedula, marca_tarjeta, ultimos_4_digitos, mes_expiracion, anio_expiracion)
      do update set titular = excluded.titular
    returning token_tarjeta into v_token;
  end if;

  insert into public.ordenes_compra (numero_orden, usuario_cedula, estado, subtotal, impuesto_iva, tarifa_envio,
    total, metodo_pago, token_tarjeta, metodo_entrega, direccion_envio_id, guia_tracking, detalle)
  values (v_numero, v_cedula, 'En preparación', 0, (p_orden->>'tax')::numeric, (p_orden->>'shipping')::numeric,
    (p_orden->>'total')::numeric, case when p_tarjeta is null then 'EFECTIVO' else 'TARJETA' end, v_token,
    v_entrega, v_dir, p_orden->>'trackingNumber', p_orden);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_cant := (v_item->>'cantidad')::int;

    -- Solo se venden productos del inventario que estén activos
    if not exists (select 1 from public.productos
                    where sku = v_item->>'sku' and activo and origen = 'BOVEDA') then
      raise exception 'PRODUCTO_NO_DISPONIBLE:%', v_item->>'nombre';
    end if;

    update public.certificaciones_psa
       set stock_disponible = stock_disponible - v_cant
     where producto_sku = v_item->>'sku' and grado = v_item->>'grado'
    returning precio into v_precio;

    if not found then
      raise exception 'GRADO_NO_DISPONIBLE:%', v_item->>'nombre';
    end if;
    -- El precio lo define la base de datos, no el navegador
    if abs(v_precio - (v_item->>'precio')::numeric) > 0.009 then
      raise exception 'PRECIO_CAMBIO:%', v_item->>'nombre';
    end if;

    insert into public.items_orden (numero_orden, sku, grado, cantidad, precio_unitario)
    values (v_numero, v_item->>'sku', v_item->>'grado', v_cant, v_precio);
    v_subtotal := v_subtotal + v_precio * v_cant;
  end loop;

  update public.ordenes_compra set subtotal = v_subtotal where numero_orden = v_numero;
  insert into public.eventos_tracking (numero_orden, paso, descripcion)
  values (v_numero, 1, 'Orden recibida y pago verificado');

  return jsonb_build_object('numero_orden', v_numero, 'subtotal', v_subtotal);
exception
  when check_violation then
    if sqlerrm like '%stock_disponible%' then
      raise exception 'SIN_STOCK:%', v_item->>'nombre';
    end if;
    raise;
end $$;

create or replace function public.listar_mis_ordenes(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_cedula text;
begin
  select cedula_ruc into v_cedula from public.usuarios where token_sesion = p_token;
  if v_cedula is null then raise exception 'SESION_INVALIDA'; end if;
  return (select coalesce(jsonb_agg(public._orden_json(o) order by o.fecha_creacion desc), '[]'::jsonb)
            from public.ordenes_compra o where o.usuario_cedula = v_cedula);
end $$;

-- ------------------------------------------------------------------ Tracking

-- Tracking público: solo devuelve la orden si la cédula coincide con el titular
create or replace function public.rastrear_orden(p_codigo text, p_cedula text)
returns jsonb language sql security definer set search_path = '' as $$
  select public._orden_json(o) from public.ordenes_compra o
   where (upper(o.numero_orden) in (upper(trim(p_codigo)), upper('#' || trim(p_codigo)))
          or upper(o.guia_tracking) = upper(trim(p_codigo)))
     and o.usuario_cedula = trim(p_cedula)
   limit 1;
$$;

create or replace function public.actualizar_estado_orden(p_codigo text, p_cedula text, p_orden jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  o         public.ordenes_compra;
  v_paso    smallint := coalesce((p_orden->>'trackingStep')::smallint, 1);
  v_intento smallint := least(coalesce((p_orden->>'idAttempts')::smallint, 0), 3);
begin
  select * into o from public.ordenes_compra where numero_orden = p_codigo and usuario_cedula = trim(p_cedula);
  if o.numero_orden is null then return false; end if;

  update public.ordenes_compra
     set paso_tracking = v_paso, intentos_verificacion = v_intento,
         estado = coalesce(p_orden->>'status', estado), detalle = p_orden
   where numero_orden = o.numero_orden;

  if v_intento > o.intentos_verificacion then
    insert into public.eventos_tracking (numero_orden, paso, descripcion)
    values (o.numero_orden, v_paso, format('Cédula presentada no coincide con el titular (intento %s de 3)', v_intento));
  end if;
  if v_paso <> o.paso_tracking then
    insert into public.eventos_tracking (numero_orden, paso, descripcion)
    values (o.numero_orden, v_paso, case v_paso
      when 2 then 'Despachado / listo para retiro'
      when 3 then 'En destino: verificando identidad del titular'
      when 4 then 'Entregado: identidad verificada con cédula'
      when -1 then 'Entrega retenida por 3 verificaciones fallidas'
      else coalesce(p_orden->>'status', 'Cambio de estado') end);
  end if;
  return true;
end $$;

-- ------------------------------------------------------------------ Permisos

revoke all on function public._cedula_valida(text) from public, anon, authenticated;
revoke all on function public.reponer_stock(text, text, integer) from public, anon, authenticated;
revoke all on function public._usuario_json(text) from public, anon, authenticated;
revoke all on function public._guardar_direccion(text, text, text) from public, anon, authenticated;
revoke all on function public._orden_json(public.ordenes_compra) from public, anon, authenticated;

grant execute on function public.registrar_usuario(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.iniciar_sesion(text, text) to anon, authenticated;
grant execute on function public.actualizar_perfil(uuid, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.guardar_orden(uuid, jsonb, jsonb, jsonb) to anon, authenticated;
grant execute on function public.listar_mis_ordenes(uuid) to anon, authenticated;
grant execute on function public.rastrear_orden(text, text) to anon, authenticated;
grant execute on function public.actualizar_estado_orden(text, text, jsonb) to anon, authenticated;
