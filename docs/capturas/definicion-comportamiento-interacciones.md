# Definición detallada del comportamiento de las interacciones e interfaz de usuario

## 1. Navegación global (header y barra de categorías)

La cabecera se mantiene fija en la parte superior de las 11 páginas HTML del sitio, de modo que el usuario siempre tiene a la mano el buscador, el acceso al Catálogo, al Tracking, a Mi Cuenta y a la Bolsa. El botón de la Bolsa muestra un contador numérico que se actualiza en el mismo instante en que se agrega, se quita o se cambia la cantidad de una pieza, sin necesidad de recargar la página. Debajo de la cabecera está la barra de categorías (Todo, Slabs PSA, Cartas raw, Sellados, Vintage y Moderno), y cada opción abre catalogo.html con el filtro ya aplicado mediante parámetros en la URL, lo que permite compartir o guardar un enlace a una categoría concreta.

La página en la que se encuentra el usuario se marca visualmente en la navegación (por ejemplo, "Tracking" aparece resaltado cuando se está en tracking.html), lo que responde a la heurística de visibilidad del estado del sistema. En pantallas pequeñas la cabecera se compacta: los textos de los botones se reemplazan por iconos, el buscador se reduce y la barra de categorías puede desplazarse horizontalmente, de manera que no se pierde ninguna opción en el móvil.

## 2. Búsqueda

El buscador de la cabecera envía la consulta a busqueda.html con el término en la URL. En esa página la consulta se repite en un campo grande y se ofrecen chips de "búsquedas rápidas" (Charizard, Umbreon, Lugia, Pikachu, Base Set, Team Rocket) que lanzan la búsqueda con un solo clic. Mientras el usuario escribe, el sistema espera 400 ms desde la última tecla antes de consultar (debounce), lo que evita peticiones innecesarias y parpadeos de la interfaz.

La búsqueda consulta en cascada tres fuentes: primero la API de pokemontcg.io, si esta falla o tarda se pasa a tcgdex.net, y como último recurso se usa el inventario local de la bóveda. Cada resultado indica con una etiqueta de color de qué fuente proviene y el encabezado muestra cuántas cartas se encontraron. Si no hay resultados, el flujo dirige al usuario al catálogo para que continúe explorando en lugar de dejarlo en una pantalla vacía.

## 3. Catálogo con filtros

En catalogo.html el panel lateral de filtros trabaja "en vivo": al cambiar la categoría, la era de lanzamiento, el tipo de edición, el tipo de energía o el rango de precio, la cuadrícula de productos se vuelve a dibujar de inmediato y el contador "Mostrando X de Y activos en bóveda" se actualiza. El selector "Ordenar por" permite ordenar por destacados, precio ascendente, precio descendente o rendimiento anual. El botón "Limpiar filtros" restablece todos los valores y confirma la acción con un mensaje informativo, lo que ofrece al usuario una salida clara cuando un filtro lo dejó sin resultados.

Cada tarjeta de producto presenta la misma estructura (etiqueta de tipo, rendimiento anual, imagen, nombre, set, número de certificado, precio y botón "Ver Ficha"), de modo que el usuario aprende a leerlas una sola vez. Al pasar el cursor sobre una tarjeta esta se eleva ligeramente con sombra y su borde se oscurece, señal de que es un elemento interactivo (affordance). En móvil la cuadrícula pasa de tres columnas a una sola y el panel de filtros se ubica antes del listado.

## 4. Ficha del producto

En producto.html la imagen principal de la carta puede girarse en 3D arrastrándola con el mouse o con el dedo, y tres botones inferiores (Frontal Completo, Reverso y Bordes, Slab y Empaque) cambian la vista mostrada; la vista activa queda resaltada con un borde rojo. En los productos sellados la galería muestra la caja desde distintas perspectivas.

El bloque de compra permite elegir el grado de la carta (Raw/NM, PSA 8, PSA 9 o PSA 10). Al seleccionar un grado, la tarjeta elegida cambia a fondo oscuro con un check, el precio grande se actualiza y aparece la cantidad de unidades disponibles en bóveda para ese grado. El selector de cantidad no deja superar el stock real; si el usuario lo intenta, se muestra el aviso "Solo hay N unidades disponibles en este grado". El botón "Añadir a la bolsa" confirma la acción con una notificación del tipo "+1 'nombre' añadido a la bolsa" y el contador de la cabecera se incrementa en ese momento. La ruta de migas de pan (Inicio > Catálogo > Set > Producto) indica en todo momento dónde se encuentra el usuario y permite regresar a niveles anteriores.

## 5. Bolsa de compras

carrito.html lista cada pieza con su miniatura, grado, controles de "−" y "+" para la cantidad, subtotal y un icono de papelera. Los botones de cantidad respetan el stock disponible. Al pulsar la papelera no se borra la pieza de inmediato: se abre un cuadro de confirmación "¿Confirma eliminar?". Si el usuario acepta, la pieza se quita y aparece un aviso con la opción "Deshacer", que la devuelve a la misma posición que tenía en la lista. Este comportamiento aplica las heurísticas de prevención de errores y de control y libertad del usuario.

El resumen del pedido recalcula subtotal, envío, IVA del 15 % y total cada vez que cambia algo en la bolsa. Si la bolsa está vacía, la página muestra un estado vacío con un enlace para volver al catálogo, y si el usuario intenta pagar con la bolsa vacía se le avisa que no tiene productos.

## 6. Checkout (datos de facturación, entrega y pago)

checkout.html divide el proceso en tres bloques numerados: 1. Datos personales y facturación, 2. Método de entrega y 3. Método de pago. Si el usuario ya tiene sesión, sus datos se precargan desde el perfil; si no, el panel izquierdo le permite iniciar sesión, o puede completar el formulario con una contraseña y la cuenta se crea automáticamente al confirmar la compra.

Cada campo se valida cuando el usuario sale de él (evento blur) y se vuelve a validar mientras lo corrige. La cédula o RUC se verifica con el algoritmo Módulo 10, el celular con el formato ecuatoriano (+593) y el correo con su formato. Un campo con error se marca con borde rojo y un mensaje debajo que explica qué corregir; un campo correcto se marca con borde verde. Al intentar pagar con errores, el sistema no envía nada, coloca el foco en el primer campo inválido y muestra "Revisa los datos de facturación marcados en rojo".

Las tres opciones de entrega (Envío Nacional Blindado $5.00, Local Express Quito $3.00 y Retiro en Local Físico $0.00) son tarjetas seleccionables; al elegir una, el total del botón de pago se actualiza y una notificación confirma la opción. La opción "Efectivo al retirar en tienda" aparece deshabilitada y con texto explicativo hasta que se elige Retiro en Local Físico, lo que evita combinaciones imposibles. En el pago con tarjeta, el número se agrupa automáticamente de cuatro en cuatro y la fecha se formatea como MM/AA mientras se escribe. Antes de consultar al banco simulado se comprueban la marca de la tarjeta, el algoritmo de Luhn, que la fecha no esté vencida, el CVV y el nombre del titular; si algo falla, el error aparece en el campo y se aclara que no se realizó ningún cargo.

## 7. Resultado del pago

Cuando el banco simulado aprueba la tarjeta, o cuando se elige efectivo con retiro en local, el usuario llega a confirmacion.html, donde ve el número de orden, el resumen de las piezas, el total pagado y accesos directos a "Ver seguimiento" y "Ver historial". Si el banco rechaza la transacción (tarjeta inexistente, fondos insuficientes, tarjeta bloqueada o CVV incorrecto), se redirige a pago-rechazado.html, que explica el motivo concreto con su código, recuerda que no se cobró nada y ofrece dos salidas: reintentar con otra tarjeta o cambiar a retiro en local con pago en efectivo. De esta forma ningún error deja al usuario sin un camino para continuar.

## 8. Cuenta de usuario (login y perfil)

login.html tiene dos pestañas, Iniciar Sesión y Crear Cuenta; la pestaña activa se subraya en rojo y el enlace "Regístrate aquí" cambia a la segunda. Las credenciales se validan contra Supabase y, si son incorrectas, se muestra un mensaje de error y el usuario permanece en el formulario para corregir los datos. Al ingresar correctamente, se muestra un mensaje de bienvenida y se redirige a perfil.html.

En perfil.html el usuario puede editar sus datos personales, cambiar su correo (para lo cual se le pide la contraseña actual como confirmación) y revisar el historial de órdenes, desde donde puede abrir el seguimiento de cada una. Si la sesión expira, el sistema lo informa y pide volver a iniciar sesión. Al cerrar sesión se muestra un aviso y se regresa al inicio.

## 9. Seguimiento del pedido (tracking)

Por seguridad, tracking.html solo muestra un pedido cuando se ingresan el número de orden o guía y la cédula del titular. Si la cédula no coincide, se muestra un error y no se revela ningún dato del pedido. Cuando la identidad es correcta, aparece una línea de tiempo de cuatro etapas (Orden recibida, En preparación, En camino y Entregado); las etapas completadas se marcan con un check verde, la etapa actual se resalta en amarillo y la pendiente queda en gris. Una barra de progreso del transporte representa el avance entre la bóveda en Quito y el destino.

Las etapas avanzan de forma automática para simular el envío real. En la entrega, el courier debe verificar la cédula del titular; si coincide, el pedido pasa a "Entregado", y tras tres intentos fallidos la entrega queda retenida y el paquete regresa a la bóveda, comportamiento que se comunica claramente en pantalla.

## 10. Retroalimentación del sistema (notificaciones)

Todas las acciones importantes se confirman con una notificación tipo "toast" que aparece en una esquina de la pantalla con una animación suave de entrada y se cierra sola después de 2,5 segundos. Se usan tres variantes con color e icono distintos: verde con check para acciones exitosas (producto añadido, perfil actualizado, orden confirmada), rojo con signo de alerta para errores (stock insuficiente, datos inválidos, cédula incorrecta) y ámbar con icono informativo para avisos neutros (filtros restablecidos, sesión cerrada). Solo se muestra una notificación a la vez para no saturar al usuario, y el contenedor está marcado como región aria-live para que los lectores de pantalla también la anuncien.

## 11. Estados de los componentes y accesibilidad de la interacción

Los botones y enlaces tienen estados definidos: normal, hover (el color se oscurece, por ejemplo el rojo #E11D48 pasa a #BE123C), foco y deshabilitado. Al navegar con teclado, el elemento enfocado muestra un contorno ámbar de 3 px separado del borde, mientras que al hacer clic con el mouse ese contorno no aparece, para no generar ruido visual. Las tarjetas de producto que funcionan como botones pueden activarse con Enter o con la barra espaciadora. El primer elemento de cada página es un enlace "Saltar al contenido", visible solo al recibir el foco con Tab.

Los controles táctiles tienen un área mínima de 44 × 44 px para facilitar su uso en el celular. Los mensajes de error de los formularios usan role="alert" y el atributo aria-invalid, y quedan vinculados al campo correspondiente, de modo que un lector de pantalla anuncia el problema en el momento en que ocurre. Las transiciones son cortas (entre 0,15 y 0,5 segundos) y sirven para comunicar cambios de estado, no como simple decoración.
