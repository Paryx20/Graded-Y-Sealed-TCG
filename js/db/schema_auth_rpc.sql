-- ==============================================================================
-- Graded & Sealed TCG - Autenticación de usuarios, órdenes y tracking (Supabase)
-- Archivo: js/db/schema_auth_rpc.sql  (aplicado como migración "usuarios_auth_y_tracking_rpc")
--
-- Las tablas usuarios y ordenes_compra NO son accesibles directamente con la
-- clave pública: el navegador solo puede llamar a estas funciones RPC.
--   * Contraseñas cifradas con bcrypt (pgcrypto) en el servidor.
--   * token_sesion: identifica la sesión para editar perfil y guardar órdenes.
--   * rastrear_orden: solo devuelve la orden si la cédula coincide con el titular.
-- ==============================================================================

alter table public.usuarios add column if not exists password_hash text;
alter table public.usuarios add column if not exists token_sesion uuid;
alter table public.usuarios add column if not exists ultimo_acceso timestamptz;
alter table public.ordenes_compra add column if not exists detalle jsonb;
create index if not exists idx_ordenes_guia on public.ordenes_compra(guia_tracking);

drop policy if exists "Allow All Users Select" on public.usuarios;
drop policy if exists "Allow All Users Insert" on public.usuarios;
drop policy if exists "Allow All Users Update" on public.usuarios;
drop policy if exists "Public Read Ordenes" on public.ordenes_compra;
drop policy if exists "Public Insert Ordenes" on public.ordenes_compra;

create or replace function public._usuario_json(u public.usuarios)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'cedula_ruc', u.cedula_ruc, 'nombre', u.nombre, 'email', u.email,
    'telefono', u.telefono, 'ciudad', u.ciudad, 'direccion_principal', u.direccion_principal,
    'token_sesion', u.token_sesion, 'creado_en', u.creado_en);
$$;

create or replace function public.registrar_usuario(
  p_cedula text, p_nombre text, p_email text, p_password text,
  p_telefono text default null, p_ciudad text default null, p_direccion text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.usuarios;
begin
  if length(coalesce(p_password, '')) < 8 then raise exception 'PASSWORD_CORTA'; end if;
  if exists (select 1 from public.usuarios where lower(email) = lower(trim(p_email))) then
    raise exception 'EMAIL_EXISTE';
  end if;
  if exists (select 1 from public.usuarios where cedula_ruc = trim(p_cedula)) then
    raise exception 'CEDULA_EXISTE';
  end if;
  insert into public.usuarios (cedula_ruc, nombre, email, telefono, ciudad, direccion_principal,
                               password_hash, token_sesion, ultimo_acceso)
  values (trim(p_cedula), trim(p_nombre), lower(trim(p_email)), p_telefono, p_ciudad, p_direccion,
          extensions.crypt(p_password, extensions.gen_salt('bf')), gen_random_uuid(), now())
  returning * into u;
  return public._usuario_json(u);
end $$;

create or replace function public.iniciar_sesion(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.usuarios;
begin
  select * into u from public.usuarios where lower(email) = lower(trim(p_email));
  if u.cedula_ruc is null or u.password_hash is null
     or u.password_hash <> extensions.crypt(p_password, u.password_hash) then
    raise exception 'CREDENCIALES_INVALIDAS';
  end if;
  update public.usuarios set token_sesion = gen_random_uuid(), ultimo_acceso = now()
   where cedula_ruc = u.cedula_ruc returning * into u;
  return public._usuario_json(u);
end $$;

create or replace function public.actualizar_perfil(
  p_token uuid, p_nombre text, p_telefono text, p_ciudad text, p_direccion text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare u public.usuarios;
begin
  update public.usuarios set nombre = trim(p_nombre), telefono = p_telefono, ciudad = p_ciudad,
         direccion_principal = p_direccion, actualizado_en = now()
   where token_sesion = p_token returning * into u;
  if u.cedula_ruc is null then raise exception 'SESION_INVALIDA'; end if;
  return public._usuario_json(u);
end $$;

create or replace function public.guardar_orden(p_token uuid, p_orden jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_cedula text;
begin
  select cedula_ruc into v_cedula from public.usuarios where token_sesion = p_token;
  if v_cedula is null then raise exception 'SESION_INVALIDA'; end if;
  insert into public.ordenes_compra (numero_orden, usuario_cedula, estado, subtotal, impuesto_iva,
    tarifa_envio, total, metodo_pago, metodo_entrega, guia_tracking, detalle)
  values (p_orden->>'orderId', v_cedula, coalesce(p_orden->>'status', 'En Preparación'),
    (p_orden->>'subtotal')::numeric, (p_orden->>'tax')::numeric, (p_orden->>'shipping')::numeric,
    (p_orden->>'total')::numeric, p_orden->>'paymentMethod', coalesce(p_orden->>'metodo_entrega', 'courier'),
    p_orden->>'trackingNumber', p_orden)
  on conflict (numero_orden) do update set estado = excluded.estado, detalle = excluded.detalle;
  return p_orden->>'orderId';
end $$;

create or replace function public.listar_mis_ordenes(p_token uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(o.detalle order by o.fecha_creacion desc), '[]'::jsonb)
    from public.ordenes_compra o join public.usuarios u on u.cedula_ruc = o.usuario_cedula
   where u.token_sesion = p_token and o.detalle is not null;
$$;

create or replace function public.rastrear_orden(p_codigo text, p_cedula text)
returns jsonb language sql security definer set search_path = '' as $$
  select o.detalle from public.ordenes_compra o
   where (upper(o.numero_orden) = upper(trim(p_codigo)) or upper(o.numero_orden) = upper('#' || trim(p_codigo))
          or upper(o.guia_tracking) = upper(trim(p_codigo)))
     and o.usuario_cedula = trim(p_cedula)
   limit 1;
$$;

create or replace function public.actualizar_estado_orden(p_codigo text, p_cedula text, p_orden jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  update public.ordenes_compra set estado = coalesce(p_orden->>'status', estado), detalle = p_orden
   where numero_orden = p_codigo and usuario_cedula = trim(p_cedula);
  return found;
end $$;

revoke all on function public._usuario_json(public.usuarios) from public, anon, authenticated;
grant execute on function public.registrar_usuario(text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.iniciar_sesion(text,text) to anon, authenticated;
grant execute on function public.actualizar_perfil(uuid,text,text,text,text) to anon, authenticated;
grant execute on function public.guardar_orden(uuid,jsonb) to anon, authenticated;
grant execute on function public.listar_mis_ordenes(uuid) to anon, authenticated;
grant execute on function public.rastrear_orden(text,text) to anon, authenticated;
grant execute on function public.actualizar_estado_orden(text,text,jsonb) to anon, authenticated;
