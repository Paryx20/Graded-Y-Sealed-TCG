GRADED & SEALED TCG - GUIA PARA REPONER Y AGREGAR PRODUCTOS
============================================================

El stock (cantidad disponible) vive en Supabase, en la tabla
"certificaciones_psa": una fila por producto y grado (raw, psa8, psa9,
psa10 o sealed), con su precio y su columna "stock_disponible".
La pagina web lee esa tabla cada vez que se abre, asi que cualquier cambio
se ve al recargar la pagina (F5). No hay que tocar el codigo.

Entra a https://supabase.com/dashboard -> tu proyecto -> menu izquierdo.


1) VER QUE PRODUCTOS SE ESTAN AGOTANDO
--------------------------------------
SQL Editor -> New query -> pega y presiona "Run":

    select producto_sku, grado, stock_disponible
    from certificaciones_psa
    where stock_disponible <= 1
    order by stock_disponible, producto_sku;

Stock 0 = agotado: la web ya no deja comprar ese grado.


2) REPONER STOCK (la forma recomendada)
---------------------------------------
SQL Editor -> pega y cambia los datos:

    select public.reponer_stock('pikachu-crown-zenith', 'psa10', 5);
                                 ^ codigo del producto    ^ grado ^ cantidad a SUMAR

- Devuelve el stock nuevo (ej. 0 + 5 = 5).
- Para restar (ej. se rompio una caja) usa un numero negativo: -1
- Esta funcion solo se puede usar desde Supabase. Los visitantes de la
  pagina no pueden llamarla.

Ejemplos:
    select public.reponer_stock('booster-box-fossil-1999', 'sealed', 2);
    select public.reponer_stock('charizard-ex-paldean', 'raw', 10);

Codigos (sku) de productos:
    Cartas:   pikachu-crown-zenith, charizard-ex-paldean, eevee-twilight,
              gengar-scarlet-violet, greninja-ex-twilight, mimikyu-paldean,
              mewtwo-151, lucario-vstar-zenith, raichu-gx, blastoise-ex-151
              (grados: raw, psa8, psa9, psa10)
    Sellados: booster-team-rocket, booster-box-fossil-1999,
              booster-pack-base-1999, upc-pokemon-151,
              etb-prismatic-evolutions, spc-charizard-ex,
              etb-crown-zenith, etb-ascended-heroes
              (grado: sealed)


3) REPONER STOCK SIN ESCRIBIR SQL (Table Editor)
------------------------------------------------
Table Editor -> tabla "certificaciones_psa" -> busca la fila del producto
y grado -> doble clic en "stock_disponible" -> escribe el numero nuevo ->
Enter -> "Save". Aqui escribes el TOTAL (no lo que sumas).


4) CAMBIAR UN PRECIO
--------------------
    update certificaciones_psa set precio = 52.00
    where producto_sku = 'pikachu-crown-zenith' and grado = 'psa10';


5) AGREGAR UN PRODUCTO NUEVO (que todavia no existe en la tienda)
-----------------------------------------------------------------
Un producto nuevo necesita datos en la web (nombre, fotos, descripcion) y
en la base (precio y stock). Si solo esta en la web, la pagina lo oculta.

  a) Pon sus fotos en assets/img/sealed/<codigo>/ (o assets/img/cards/ si es carta).
  b) Copia un producto parecido en js/data.js y cambia sus datos
     (id, nombre, set, precios, imagenLocal...). El "id" es el codigo (sku).
  c) En la terminal, desde la carpeta del proyecto:
         node tools/generar_seed.js
     Esto actualiza js/db/seed_catalogo.sql con el producto nuevo.
  d) Copia de seed_catalogo.sql solo las lineas del producto nuevo (las
     que tienen su codigo) en el SQL Editor de Supabase y ejecutalas.
     Va en este orden: sets_expansiones (si el set es nuevo), productos,
     detalles_cartas o detalles_sellados, certificaciones_psa,
     historial_precios.
  e) Recarga la pagina: el producto aparece con su stock.
  f) Haz commit y push para que tus companeros tengan el cambio.


6) RETIRAR UN PRODUCTO DE LA TIENDA (sin borrarlo)
--------------------------------------------------
    update productos set activo = false where sku = 'raichu-gx';

Para volver a mostrarlo cambia false por true.
