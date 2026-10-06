Actúa como Senior Full-Stack Frontend Engineer y Diseñador UI/UX enfocado en aplicaciones web comerciales e Interacción Humano-Computador. Refactoriza y optimiza por completo el código de la aplicación "Graded & Sealed TCG" para convertirla en una aplicación web interactiva de nivel de producción lista para demostración técnica.

Estructura el código de forma limpia y mantenible (actualiza `index.html`, y si es necesario genera `styles.css` y `app.js` enlazados).

Requerimientos y Correcciones Obligatorias:

1. Limpieza de Modo Evaluativo / Debug a Producto Comercial:
   - Elimina por completo la barra superior negra de depuración ("WCAG 2.2 AAA", "Acceso directo a vistas: 01 Home...", etc.).
   - En el pie de página, elimina los textos de "Cumplimiento WCAG Evaluadas / Pontificia Universidad Católica del Ecuador". Deja un pie de página comercial limpio: términos legales, políticas de garantía, envíos seguros y copyright © 2026 Graded & Sealed TCG.
   - En la vista de Checkout, elimina el recuadro amarillo/rojo de debug ("Evaluación de Prototipo IHC & Heurísticas" con los botones manuales de simular). 
   - Retira las etiquetas flotantes de debug (como los recuadros negros 'alt: "..."' visibles sobre las fotos); los atributos alt deben existir en el código HTML de las etiquetas <img>, pero NO como cajas flotantes sobre el diseño.

2. Navegación Nativa y Soporte de Botón Atrás del Navegador (Hash Router):
   - Implementa un sistema de enrutamiento basado en URL Hash (#home, #pdp, #cart, #checkout, #confirmation, #tracking, #auth, #error).
   - Escucha el evento `window.addEventListener('hashchange', ...)` y `window.addEventListener('popstate', ...)`. Cuando el usuario presione el botón de "Atrás" o "Adelante" del navegador, la página debe cambiar de vista y cargar el estado correcto sin recargar todo el sitio ni perder el contexto.

3. Simulación Realista de Procesamiento de Pago:
   - Al hacer clic en "Finalizar Compra y Pagar" en el Checkout:
     * No saltes de golpe a la pantalla final.
     * Despliega un Modal interactivo de alta calidad con animación de Spinner de carga y textos secuenciales: "Conectando con la pasarela bancaria segura...", "Validando fondos y autenticación 3D Secure..." (duración total: 2.5 a 3 segundos).
     * Lógica de resolución: Si el número de tarjeta ingresado termina en '0000' o el usuario marca una casilla sutil de test 'Simular fallo', redirige a la vista de `#error` bancario (#DECLINED-SEC-054) reteniendo todos los datos del formulario. De lo contrario, redirige a `#confirmation` con número de orden generado aleatoriamente.

4. Corrección Fiscal del IVA (15%):
   - Actualiza la constante de impuestos a 15% (tasa ecuatoriana actual).
   - En la bolsa de compras y en el checkout:
     * Subtotal = suma de ítems.
     * IVA (15%) = Subtotal * 0.15 (mostrado explícitamente como "IVA (15%)").
     * Envío = $25.00 si es courier, $0.00 si es retiro en local.
     * Total a pagar = Subtotal + IVA + Envío.

5. Ficha de Detalle (PDP) y Gráfica Interactiva con Mouse Hover:
   - En la sección "Historial de Mercado Actual", implementa una gráfica interactiva (con SVG o Canvas) que renderice la curva de precios de los últimos 12 meses.
   - Evento de Mouse Hover / Touch: Al pasar el cursor o dedo por encima de la curva, debe mostrarse una línea vertical guía con un punto activo y un Tooltip dinámico flotante indicando la fecha y el precio en ese punto exacto (ej. "Nov 2025: $16,800 USD", con indicador de subida/bajada en verde o rojo).
   - Al alternar entre los botones segmentados [Raw / NM], [PSA 8], [PSA 9] y [PSA 10 GEM MT], la gráfica y el precio principal deben redibujarse reactivamente reflejando las cifras de esa condición.

6. Sistema de Sesión y Usuarios con LocalStorage:
   - Desacopla los datos estáticos predeterminados. Los campos de Nombre, Correo y Cédula en el Checkout no deben venir prellenados con "Patrick Mora". Deben mostrar placeholders limpios y permitir entrada de cualquier usuario.
   - En la vista de Autenticación (#auth): Permite registrar un usuario (Nombre, Email, Contraseña) y guardarlo en `localStorage`. Si el usuario inicia sesión, actualiza el Navbar con su nombre real en lugar de "Mi Cuenta", y autocompleta sus datos únicamente cuando haya una sesión iniciada. Incluye la opción de "Cerrar Sesión".

7. Filtros Interactivos y Paginación Funcional:
   - Los botones de filtro superior ([Todas], [Cartas Sueltas], [Booster Packs], [Solo PSA]) deben filtrar de verdad la lista de productos mostrada en el catálogo.
   - La barra de búsqueda debe filtrar en tiempo real por nombre de carta (ej. 'Charizard', 'Umbreon', 'Gengar', 'Lugia').
   - El botón [+ Filtros Avanzados] debe abrir un panel lateral deslizable (drawer) con opciones por Tipo (Fuego, Psíquico, Oscuridad), Rareza y Rango de Precio.
   - Paginación: Haz que los botones de paginación [1], [2], [Siguiente] funcionen mostrando al menos 2 páginas distintas con productos de prueba.

8. Responsive Design Estricto para Dispositivos Móviles:
   - Soluciona los desbordamientos en celulares:
     * Usa clases fluidas de Tailwind (w-full, max-w-full, overflow-x-hidden en el contenedor principal).
     * En móvil (< 640px), la grilla de productos debe mostrarse en 1 columna o 2 columnas compactas.
     * La sección de descubrimiento superior (las 4 tarjetas modulares de packs y PSA) debe pasar a un slider horizontal táctil o una grilla de 2x2 para que los botones y textos no se corten.
     * En el Checkout y la Bolsa, las columnas paralelas deben apilarse verticalmente (flex-col lg:flex-row).
     * Asegura tamaños táctiles mínimos de 44x44px para botones e inputs sin desbordar el viewport horizontal.

9. Gestión de Imágenes e Íconos:
   - Configura rutas seguras para imágenes: si existen imágenes locales en una carpeta `img/` o `assets/`, enlázalas; si alguna falla al cargar, agrega un manejador de fallback `onerror` que cargue imágenes de alta resolución desde URLs de CDN confiables de Pokemon TCG API.
   - Íconos coherentes: Asegúrate de que todos los íconos de Lucide Icons carguen con dimensiones consistentes (w-5 h-5).