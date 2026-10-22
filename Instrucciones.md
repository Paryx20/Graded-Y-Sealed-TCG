Actúa como Senior UI/UX Designer y Frontend Engineer. Aplica las siguientes mejoras estructurales, estéticas y de interacción en la aplicación web "Graded & Sealed TCG". 

NO integres APIs externas en esta versión. Toda la información debe seguir alimentándose del dataset local estructurado.

======================================================================
1. REDISEÑO TOTAL DEL HOME (DE BUSCADOR A E-COMMERCE REAL)
======================================================================
1.1. Hero Section de Alto Impacto:
- Reemplaza el inicio plano por un Hero Banner elegante (fondo oscuro carbón #0F172A o degradado sutil hacia azul marino):
  * Título principal: "Bóveda de Coleccionismo Certificado & Slabs PSA"
  * Subtítulo: "Adquiere cartas históricas verificadas, expansiones de época selladas y piezas de inversión con entrega segura y garantía de autenticidad."
  * Botones de acción (CTAs):
    - Botón primario: [Explorar Bóveda PSA] (desplaza suavemente hacia las cartas graduadas).
    - Botón secundario: [Ver Cajas Selladas] (filtra inmediatamente por Booster Packs).

1.2. Barra de Garantías y Confianza (Trust Bar):
- Inmediatamente debajo del Hero, coloca una barra horizontal de 3 o 4 columnas con iconos limpios y microtextos:
  1. Icono Escudo: "Autenticidad Certificada" (Todas las cartas cuentan con registro verificable en PSA).
  2. Icono Camión: "Envíos Blindados ($5.00)" (Empaque especial en estuche rígido con protección UV).
  3. Icono Tienda: "Retiro en Local Físico" (Disponible en Sucursal Central Quito en 2 horas).
  4. Icono Candado: "Transacciones Protegidas" (Protocolos de pago seguro y custodia en bóveda).

1.3. Vitrinas Curadas del Home:
- Organiza el contenido en bloques temáticos antes de la grilla general:
  * Bloque A: "Tesoros Destacados de la Bóveda" (Cards de Charizard, Umbreon, Lugia, Gengar).
  * Bloque B: "Cajas y Sobres Vintage Sellados" (Booster packs de 1999 con fotos reales).
  * Bloque C: "Acceso Rápido al Catálogo Completo" con los chips de filtrado.

======================================================================
2. LIMPIEZA ABSOLUTA DEL FOOTER
======================================================================
2.1. Eliminación de Enlaces Inactivos:
- Remueve completamente todos los enlaces vacíos, botones sin función y listas de links de relleno del pie de página.
2.2. Footer Comercial Sobrio:
- Diseña un footer minimalista con fondo neutro:
  * Logo de Graded & Sealed TCG y breve resumen: "Especialistas en preservación y comercialización de coleccionables TCG de alta gama en Ecuador."
  * Indicador de métodos de compra: Iconos o insignias de Visa, Mastercard y Efectivo en Tienda.
  * Línea de copyright: "© 2026 Graded & Sealed TCG. Todos los derechos reservados. Quito, Ecuador."

======================================================================
3. MEJORAS DE ERGONOMÍA E INTERACCIÓN (PENDIENTES DEL ANÁLISIS)
======================================================================
3.1. Tarjeta Clickeable Unificada (Ley de Fitts):
- Haz que toda el área de cada tarjeta de producto (imagen, textos, contenedor) tenga cursor pointer y redirija a su correspondiente vista de detalle (#pdp).

3.2. Selector de Cantidad en Ficha de Producto (PDP):
- En la vista de detalle de cada producto, coloca un selector numérico interactivo (- [ 1 ] +) junto al botón "Añadir a la bolsa" para poder elegir unidades antes de agregar al carrito.

3.3. Modal Informativo: "¿Qué es un Grado PSA?":
- Junto al selector de condiciones en la PDP, agrega un botón discreto "¿Qué es un grado PSA?" que abra un modal visual explicando la diferencia entre cartas 'Raw' y cartas 'PSA 10 Gem Mint' encapsuladas.

3.4. Confirmación de Eliminación en Carrito:
- Al presionar el icono de basura en la bolsa de compras, despliega una alerta breve o modal accesible: "¿Deseas eliminar este artículo de tu bolsa? [Cancelar] [Eliminar]", conservando el toast de "Deshacer" si el usuario confirma.