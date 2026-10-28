# Plan de Trabajo Acelerado: Graded & Sealed TCG
> Fecha límite de entrega: Viernes | Arquitectura: SPA Modular + DB Relacional + Failover API

---

### [X] FASE 1: Limpieza Estructural de Archivos y Rutas (Miércoles - Mañana)
- [X] Renombrar y mover 'Logo del e-commerce 1.png' a 'img/logo.png'.
- [X] Crear subcarpetas organizadas: 'img/cards/' y 'img/sealed/'.
- [X] Actualizar rutas del logo en 'index.html' y módulos para evitar imágenes rotas.
- [X] Eliminar archivos temporales o scripts huérfanos en la raíz.
- [X] Validar en navegador que la estructura visual base cargue limpia.

---

### [ ] FASE 2: Base de Datos Relacional de 10 Tablas y Datos Semilla (Miércoles - Tarde)
- [ ] Crear 'js/db/schema.js' modelando las 10 entidades relacionales:
      1. usuarios
      2. direcciones_envio
      3. categorias_producto
      4. sets_expansiones
      5. productos (con campo discriminador 'tipo_item': 'CARTA_INDIVIDUAL' | 'PRODUCTO_SELLADO')
      6. detalles_cartas (atributos específicos TCG: rareza, tipo, artista)
      7. certificaciones_psa (grados: Raw, PSA 8, PSA 9, PSA 10)
      8. historial_precios (series cronológicas para gráfica)
      9. ordenes_compra (desglose IVA 15% y envío $5)
      10. items_orden
- [ ] Crear 'js/db/db-client.js' con persistencia transaccional (Dexie.js / IndexedDB) y respaldo en localStorage.
- [ ] Poblar el catálogo inicial con al menos 6 cartas individuales y 4 productos sellados de fábrica.

---

### [ ] FASE 3: Rediseño Estético del Home y Menú de Categorías (Jueves - Mañana)
- [ ] Construir Hero Section comercial con propuesta de valor de bóveda de inversión.
- [ ] Crear la Barra de Garantías (Envío blindado $5.00, Certificación PSA, Retiro en Quito).
- [ ] Implementar Drawer lateral deslizable de Categorías [☰ Categorías] en el Navbar.
- [ ] Aplicar paleta cromática 60-30-10 (Blanco galería, Azul noche de resguardo, Acentos dorados/carmesí).
- [ ] Separar el catálogo exploratorio libre (#catalog) de la página de inicio (#home).

---

### [ ] FASE 4: Ficha de Producto (PDP) e Inspector Técnico Adaptativo (Jueves - Tarde)
- [ ] Lógica condicional según 'tipo_item':
      * Si es 'PRODUCTO_SELLADO' (Cajas/Packs): OCULTAR selector de grados PSA y botones de giro 3D; mostrar detalles de fábrica y fotos del empaque.
      * Si es 'CARTA_INDIVIDUAL': Habilitar grados PSA, gráfica de cotización y visor técnico.
- [ ] Inspector 3D de Cartas:
      * Botón 'Frontal': Vista vertical normal con brillo holográfico.
      * Botón 'Reverso y Bordes': Giro 3D en eje Y (rotateY 180deg) mostrando dorso oficial azul y cuadrícula de centrado 50/50.
      * Botón 'Slab PSA': Enmarcar la carta dentro de una cápsula acrílica con etiqueta superior oficial PSA en CSS.
- [ ] Agregar selector numérico de cantidad (- [ 1 ] +) antes de añadir a la bolsa.
- [ ] Modal pedagógico accesible: "¿Qué es un Grado PSA?".

---

### [ ] FASE 5: Carrito, Checkout Ecuatoriano y Notificación Única (Viernes - Mañana)
- [ ] Sistema de Notificación Singleton: Máximo un mensaje flotante en pantalla (auto-cierre en 2.5s, sin spam en el DOM).
- [ ] Confirmación modal antes de eliminar un ítem del carrito con opción de 'Deshacer'.
- [ ] Formularios de Checkout con validaciones ecuatorianas:
      * Cédula / RUC mediante algoritmo Módulo 10 en tiempo real.
      * Teléfono con prefijo fijo no editable '+593' y longitud de 9 dígitos.
      * Tarjetas de crédito con algoritmo de Luhn (terminación '0000' dispara error simulado #DECLINED-SEC-054).
- [ ] Cálculos financieros exactos: IVA al 15% desglosado y tarifa plana de envío a $5.00 (gratis en retiro local).

---

### [ ] FASE 6: Doble API de Búsqueda con Failover (Viernes - Tarde)
- [ ] Crear 'js/services/pokemon-api.js' con lógica de conmutación por fallo:
      * Primaria: 'pokemontcg.io' (metadatos completos y cotizaciones).
      * Secundaria (Respaldo): 'tcgdex.net' (gratuita, sin límite de cuota).
      * Fallback Offline: Catálogo local en memoria si no hay conexión a internet.
- [ ] Crear la vista desacoplada '#search-results' con debounce de 400ms, skeleton loader y estado amigable de 'Cero resultados'.

---

### [ ] FASE 7: Perfil de Usuario, Tracking en Vivo y Despliegue (Viernes - Noche)
- [ ] Vista '#profile' con pestañas de "Datos Personales" (editables) e "Historial de Compras".
- [ ] Conexión del historial con la vista '#tracking' para ver el estado real de la orden generada.
- [ ] Auditoría de navegación móvil (sin desbordamientos horizontales ni textos cortados).
- [ ] Commit final y despliegue verificado en GitHub Pages.