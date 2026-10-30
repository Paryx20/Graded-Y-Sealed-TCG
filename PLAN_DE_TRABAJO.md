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

### [X] FASE 2: Arquitectura de Base de Datos Relacional (12 Tablas de Negocio)
- [X] Definir 'js/db/schema.js' con claves naturales/compuestas y 12 entidades relacionales:
      1. usuarios (PK: cedula_ruc)
      2. direcciones_envio (PK: direccion_id, FK: usuario_cedula)
      3. categorias_producto (PK: slug_categoria)
      4. sets_expansiones (PK: codigo_set)
      5. productos (PK: sku, discriminador: 'CARTA_INDIVIDUAL' vs 'PRODUCTO_SELLADO')
      6. detalles_cartas (PK/FK: producto_sku)
      7. detalles_sellados (PK/FK: producto_sku, gramaje, arte sobre, cantidad sobres)
      8. certificaciones_psa (PK: numero_certificacion)
      9. historial_precios (PK: registro_id, serie mensual 12 meses)
      10. metodos_pago_tokenizados (PK: token_tarjeta, últimos 4 dígitos)
      11. ordenes_compra (PK: numero_orden, IVA 15%, tarifas $0/$3/$5)
      12. items_orden (PK Compuesta: numero_orden + sku + grado)
- [X] Implementar motor de persistencia en 'js/db/db-client.js' con Dexie.js (IndexedDB transaccional ACID).
- [X] Implementar la función transaccional de compra `procesarOrdenTransaccional()` con rollback si falla el stock.
- [X] Poblar la base de datos (Seed Data) con:
      * 4 cartas individuales de inversión (Charizard Base Set #4, Umbreon VMAX Alt Art, Gengar VMAX, Lugia Neo Genesis) con sus certificaciones e historial de cotizaciones.
      * 2 productos sellados auténticos: Booster Pack Team Rocket 1999 (Pesado 20.94g) y Jungle Booster Pack (36 sobres).
- [X] Comprobar apertura de tablas en DevTools (F12 -> Application -> Storage -> IndexedDB).

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