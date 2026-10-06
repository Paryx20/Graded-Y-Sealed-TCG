Actúa como Lead Frontend Developer y Especialista en UI/UX. Refactoriza y ajusta la aplicación de "Graded & Sealed TCG" resolviendo de forma estricta los siguientes 7 puntos funcionales y de interacción:

1. Limpieza de Formularios y Estados de Selección:
   - Limpia todos los inputs (Nombre, Correo, Contraseña, Cédula) tras completar el registro o login; no dejes datos precargados en duro.
   - Si el usuario cambia entre la pestaña de "Iniciar Sesión" y "Crear Cuenta", resetea los campos de texto correspondientes.
   - Retira cualquier atributo 'checked' por defecto en opciones secundarias para que el usuario elija conscientemente sus preferencias.

2. Catálogo Centralizado y Ficha Dinámica (PDP) para Todos los Productos:
   - Crea un arreglo maestro en JavaScript (`const PRODUCTS = [...]`) donde cada objeto contenga: id, nombre, set, rareza, imagenLocal, imagenFallbackUrl, y precios por condición (raw, psa8, psa9, psa10).
   - Enrutamiento dinámico en PDP: Al pulsar "Ver detalle" en Umbreon, Gengar, Lugia o cualquier producto, la vista PDP (#pdp) debe renderizar dinámicamente la información, foto, historial de precios y selector de esa carta específica, permitiendo añadirla a la bolsa con su grado seleccionado.
   - Gestión de imágenes: Configura las etiquetas <img> para buscar primero en la carpeta local `img/[id].png` y añade un fallback automático en `onerror` hacia imágenes oficiales de PokemonTCG API si el archivo local no existe.

3. Corrección de Sombreados (:focus) y Ajuste del Envío a $5.00:
   - Corrige el problema de sombreados atascados: asegúrate de aplicar estilos de foco únicamente bajo la pseudo-clase `:focus-visible` (y no `:focus`), o remueve clases de outline persistentes al disparar eventos de clic con ratón para que no se quede el marco sombreado.
   - Ajusta la tarifa plana de envío a domicilio: cambia el valor de $25.00 a exactamente $5.00 USD. Actualiza las constantes de cálculo de la bolsa y el checkout.

4. Buscador con Efecto Spotlight (Fondo Atenuado) y Vista de Resultados:
   - Al hacer foco (`focus`) en la barra de búsqueda superior, oscurece el fondo de la pantalla mediante un overlay semitransparente (backdrop gris/negro con opacidad) para centrar la atención visual exclusivamente en la barra.
   - Al presionar 'Escape' o hacer clic fuera del buscador, desactiva el backdrop.
   - Al presionar Enter o buscar, navega a una vista filtrada `#search-results` o renderiza un contenedor de resultados directos con las cartas coincidentes.

5. Métodos de Pago Simplificados (Solo Tarjeta y Efectivo en Tienda):
   - Elimina definitivamente la opción de "Transferencia Bancaria Directa".
   - Deja únicamente dos métodos:
     1) "Tarjeta de Crédito / Débito"
     2) "Efectivo al retirar en tienda (Cash)" (disponible solo si la entrega es retiro en local).
   - Lógica de confirmación diferenciada:
     * Si paga con Tarjeta: ejecuta la animación modal de pasarela segura (Spinner + 3D Secure) durante 2.5 segundos antes de redirigir a la orden confirmada.
     * Si selecciona Efectivo (Cash): NO ejecutes la animación de pasarela de tarjetas ni 3D Secure; redirige de inmediato a la confirmación indicando: "Orden reservada con éxito. Recuerda realizar el pago en caja al retirar en el local central".

6. Historial de Tracking Dinámico (Última Orden Real):
   - Al finalizar cualquier compra exitosa, guarda los datos de la orden en `localStorage` (número de orden aleatorio, fecha/hora actual, lista de productos comprados y total pagado).
   - La vista `#tracking` debe leer este objeto de la última compra y pintar los productos reales adquiridos en esa sesión, en lugar de datos estáticos quemados.

7. Estado Inicial del Carrito en Cero:
   - Inicializa la bolsa de compras vacía (`cart = []`, badge numérico en 0).
   - Si el carrito está vacío, la vista `#cart` debe mostrar un estado limpio ("Tu bolsa de compras está vacía") con un botón visible: [Explorar Catálogo].