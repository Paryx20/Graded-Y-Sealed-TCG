Actúa como Senior Frontend Architect y Especialista en UI/UX e Interacción Humano-Computador (IHC). Refactoriza integralmente el proyecto "Graded & Sealed TCG" aplicando arquitectura modular de archivos, psicología del color, navegación libre por categorías, gestión de perfil con historial y corrección del inspector 3D de productos.

======================================================================
1. ARQUITECTURA MODULAR DEL REPOSITORIO (SEPARACIÓN DE ARCHIVOS)
======================================================================
Reorganiza el repositorio para evitar que todo el código viva en un único `index.html` monolítico. Estructura el proyecto así:
- `/index.html` -> Únicamente el contenedor base (Navbar global, Menú lateral de categorías, contenedor `<main id="app-view"></main>`, Modal global y Footer).
- `/css/styles.css` ->Variables de psicología del color, animaciones 3D de cartas (flip Y), estilos del Slab acrílico PSA y utilidades responsivas.
- `/js/data.js` -> Base de datos local ampliada de productos (mínimo 12 productos variados: Slabs PSA, Cartas Raw, Booster Packs Vintage, Cajas Selladas) con sus series históricas de precios.
- `/js/state.js` -> Manejo centralizado de `localStorage` (usuario activo, lista de usuarios registrados, edición de perfil, carrito de compras y arreglo de `orders` con el historial de compras).
- `/js/views/` -> Módulos independientes para cada pantalla (`home.js`, `catalog.js`, `pdp.js`, `cart.js`, `checkout.js`, `profile.js`, `tracking.js`) o plantillas HTML cargadas dinámicamente sin errores de CORS, de modo que modificar una vista jamás rompa las demás.
- `/js/app.js` -> Router principal (`hashchange`) y controladores de eventos globales.
- Elimina de la raíz cualquier archivo residual antiguo que ya no se utilice.

======================================================================
2. PSICOLOGÍA DEL COLOR Y ESTÉTICA DE BÓVEDA DE INVERSIÓN
======================================================================
Aplica la regla cromática 60-30-10 en toda la interfaz:
- 60% Fondos Neutros de Galería (`#F8FAFC` y `#FFFFFF`) para máxima legibilidad y contraste limpio.
- 30% Azul Noche / Pizarra Profundo (`#0F172A` y `#1E293B`) en barra de navegación, Hero banner, encabezados y tarjetas de grado activo para transmitir seguridad financiera, custodia y sobriedad.
- 10% Acentos Estratégicos:
  * Dorado Ámbar (`#D97706` / `#FEF3C7`): Insignias "GRADO INVERSIÓN • OFICIAL PSA" y textos destacados en grados PSA 10.
  * Rojo Carmesí (`#E11D48` / `#BE123C`): Exclusivamente para botones de conversión primaria ("Añadir a la bolsa", "Proceder al Pago") y cabecera de cápsula PSA.
  * Verde Esmeralda (`#059669` / `#D1FAE5`): Estados de autenticidad verificada, stock en bóveda y tendencias alcistas.

======================================================================
3. MENÚ DESPLEGABLE DE CATEGORÍAS Y NAVEGACIÓN LIBRE (`#catalog`)
======================================================================
3.1. Menú de Categorías (Drawer Lateral Izquierdo + Barra Superior):
- Añade en el Navbar un botón claro `[☰ Categorías]` que despliegue un menú lateral deslizable (Drawer) desde la izquierda con fondo oscuro/limpio y cierre suave, además de accesos rápidos.
- Categorías incluidas:
  1. Ver Todo el Catálogo (`#catalog`)
  2. Slabs Certificados PSA (`#catalog?cat=psa`)
  3. Cartas Sueltas / Raw (`#catalog?cat=raw`)
  4. Cajas y Sobres Sellados Vintage (`#catalog?cat=sealed`)
  5. Era Clásica WotC 1999-2002 (`#catalog?era=vintage`)
  6. Era Moderna & Alt Arts (`#catalog?era=modern`)

3.2. Página Dedicada de Catálogo y Filtros Avanzados (`#catalog`):
- Separa el Home de la página de exploración. El Home (`#home`) tendrá su Hero Banner, barra de garantías y vitrinas destacadas; mientras que `#catalog` será la vista de navegación libre con:
  * Barra lateral izquierda fija (en escritorio) y desplegable (en móvil) con filtros combinables en tiempo real:
    - Rango de Precio (Slider o inputs Desde $ / Hasta $).
    - Condición / Grado (Raw, PSA 8, PSA 9, PSA 10, Sellado de Fábrica).
    - Tipo de Energía / Rareza (Fuego, Oscuridad, Psíquico, Agua, Incoloro).
    - Ordenamiento: "Precio: Menor a Mayor", "Precio: Mayor a Menor", "Mayor Rendimiento Anual (%)".
  * Contador dinámico de productos filtrados y botón `[Limpiar filtros]`.

======================================================================
4. CORRECCIÓN DEL INSPECTOR DE CARTA EN FICHA DE PRODUCTO (PDP)
======================================================================
Corrige de forma definitiva el comportamiento de los 3 botones debajo de la imagen en la vista `#pdp`:
- PROHIBIDO usar `rotate-180` (que pone la carta de cabeza al revés).
- Implementa un visor interactivo con 3 modos reales:
  1. Botón [Frontal Completo - Holograma intacto]:
     Muestra el frente de la carta en su orientación normal vertical, con un efecto de destello holográfico suave al mover el cursor sobre ella.
  2. Botón [Reverso y Bordes - Centrado 50/50]:
     Ejecuta una rotación 3D en el eje Y (`transform: rotateY(180deg)` con `perspective: 1000px`) mostrando el DORSO OFICIAL de una carta Pokémon (diseño azul con Pokéball central) y superpone una retícula técnica de calibración de bordes (líneas punteadas que ilustran el centrado 50/50 de las esquinas).
  3. Botón [Slab & Empaque - Sello de autenticidad]:
     Transforma el contenedor de la carta envolviéndola visualmente dentro de una cápsula acrílica PSA realista (borde translúcido tipo cristal con relieve, etiqueta superior rectangular con borde rojo oficial PSA, código de barras, título de la carta, número de certificación `#48291034` y calificación `GEM MT 10` o el grado actualmente seleccionado).

======================================================================
5. MÓDULO COMPLETO DE PERFIL DE USUARIO E HISTORIAL (`#profile`)
======================================================================
Crea una vista dedicada `#profile` accesible al hacer clic en el nombre del usuario en el Navbar cuando ha iniciado sesión:
5.1. Pestaña "Mis Datos Personales" (Editable):
- Formulario precargado con los datos del usuario actual guardados en `localStorage` (Nombre completo, Cédula/RUC validada con Módulo 10, Correo electrónico, Teléfono con prefijo +593, Ciudad y Dirección predeterminada de envío).
- Botón `[Guardar Cambios]` que actualice el usuario en `localStorage`, actualice el Navbar en tiempo real y muestre una notificación toast de confirmación ("Perfil actualizado correctamente").

5.2. Pestaña "Mis Últimas Compras / Historial de Órdenes":
- Lista todas las órdenes realizadas por el usuario (almacenadas en un array `orders` en `localStorage`).
- Cada orden del historial debe mostrar: Código de orden (`#PKM-2026-...`), Fecha, Estado actual (`En Preparación / En Custodia`), Método de pago usado, Total pagado (con IVA 15% desglosado), miniaturas de las cartas compradas y un botón `[Ver Tracking en Vivo]` que cargue esa orden específica en la vista `#tracking`.

5.3. Botón de `[Cerrar Sesión]` claramente visible dentro del perfil.