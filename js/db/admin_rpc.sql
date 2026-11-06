-- ==============================================================================
-- Graded & Sealed TCG - Funciones del panel de inventario
-- Archivo: js/db/admin_rpc.sql  ·  Ejecutar después de funciones_rpc.sql
--
-- Solo una cuenta con rol 'ADMIN' puede usarlas. El rol se asigna a mano desde
-- el SQL Editor de Supabase (no existe ninguna función que lo cambie):
--     update public.usuarios set rol = 'ADMIN' where email = '<correo>';
-- Cada función valida el token de sesión y el rol en el servidor, y la sesión
-- de administrador caduca a las 8 horas del último inicio de sesión.
-- ==============================================================================

alter table public.usuarios drop constraint if exists usuarios_rol_check;
alter table public.usuarios
  add constraint usuarios_rol_check check (rol in ('CLIENTE_REGISTRADO', 'ADMIN'));

create or replace function public._exigir_admin(p_token uuid)
returns text language plpgsql stable set search_path = '' as $$
declare v_cedula text;
begin
  select cedula_ruc into v_cedula from public.usuarios
   where token_sesion = p_token
     and rol = 'ADMIN'
     and ultimo_acceso > now() - interval '8 hours';
  if v_cedula is null then raise exception 'NO_AUTORIZADO'; end if;
  return v_cedula;
end $$;

-- Todos los productos del inventario (también los ocultos) con precio y stock por grado
create or replace function public.admin_listar_productos(p_token uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform public._exigir_admin(p_token);
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'sku', p.sku,
             'nombre', p.nombre,
             'categoria', p.slug_categoria,
             'tipo', p.tipo_discriminador,
             'set', s.nombre_set,
             'imagen', p.imagen_url,
             'activo', p.activo,
             'grados', (select coalesce(jsonb_agg(jsonb_build_object(
                                 'grado', c.grado, 'precio', c.precio, 'stock', c.stock_disponible)
                               order by array_position(array['raw','psa8','psa9','psa10','sealed']::text[], c.grado::text)),
                               '[]'::jsonb)
                          from public.certificaciones_psa c where c.producto_sku = p.sku)
           ) order by p.nombre), '[]'::jsonb)
      from public.productos p
      left join public.sets_expansiones s on s.codigo_set = p.codigo_set
     where p.origen = 'BOVEDA');
end $$;

-- Cambia el precio y el stock de un grado; registra el precio en el historial del mes actual
create or replace function public.admin_actualizar_grado(
  p_token uuid, p_sku text, p_grado text, p_precio numeric, p_stock integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_mes date := date_trunc('month', now())::date;
begin
  perform public._exigir_admin(p_token);
  if p_precio is null or p_precio <= 0 then raise exception 'PRECIO_INVALIDO'; end if;
  if p_stock is null or p_stock < 0 then raise exception 'STOCK_INVALIDO'; end if;

  update public.certificaciones_psa
     set precio = round(p_precio, 2), stock_disponible = p_stock
   where producto_sku = p_sku and grado = p_grado;
  if not found then raise exception 'GRADO_NO_DISPONIBLE:%', p_sku; end if;

  insert into public.historial_precios (producto_sku, grado, mes, precio_usd)
  values (p_sku, p_grado, v_mes, round(p_precio, 2))
  on conflict (producto_sku, grado, mes) do update set precio_usd = excluded.precio_usd;

  return jsonb_build_object('sku', p_sku, 'grado', p_grado, 'precio', round(p_precio, 2), 'stock', p_stock);
end $$;

-- Oculta o vuelve a mostrar un producto en la tienda
create or replace function public.admin_cambiar_activo(p_token uuid, p_sku text, p_activo boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform public._exigir_admin(p_token);
  update public.productos set activo = coalesce(p_activo, activo) where sku = p_sku and origen = 'BOVEDA';
  if not found then raise exception 'PRODUCTO_NO_DISPONIBLE:%', p_sku; end if;
  return p_activo;
end $$;

revoke all on function public._exigir_admin(uuid) from public, anon, authenticated;
grant execute on function public.admin_listar_productos(uuid) to anon, authenticated;
grant execute on function public.admin_actualizar_grado(uuid, text, text, numeric, integer) to anon, authenticated;
grant execute on function public.admin_cambiar_activo(uuid, text, boolean) to anon, authenticated;
