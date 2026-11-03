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

### [X] FASE 3: Rediseño Estético del Home y Menú de Categorías (Jueves - Mañana)
- [X] Construir Hero Section comercial con propuesta de valor de bóveda de inversión.
- [X] Crear la Barra de Garantías (Envío blindado $5.00, Certificación PSA, Retiro en Quito).
- [X] Implementar Drawer lateral deslizable de Categorías [☰ Categorías] en el Navbar.
- [X] Aplicar paleta cromática 60-30-10 (Blanco galería, Azul noche de resguardo, Acentos dorados/carmesí).
- [X] Separar el catálogo exploratorio libre (#catalog) de la página de inicio (#home).

---

### [X] FASE 4: Ficha de Producto (PDP) e Inspector Técnico Adaptativo (Jueves - Tarde)
- [X] Lógica condicional según 'tipo_item':
      * Si es 'PRODUCTO_SELLADO' (Cajas/Packs): OCULTAR selector de grados PSA y botones de giro 3D; mostrar detalles de fábrica y fotos del empaque.
      * Si es 'CARTA_INDIVIDUAL': Habilitar grados PSA, gráfica de cotización y visor técnico.
- [X] Inspector 3D de Cartas:
      * Botón 'Frontal': Vista vertical normal con brillo holográfico.
      * Botón 'Reverso y Bordes': Giro 3D en eje Y (rotateY 180deg) mostrando dorso oficial azul y cuadrícula de centrado 50/50.
      * Botón 'Slab PSA': Enmarcar la carta dentro de una cápsula acrílica con etiqueta superior oficial PSA en CSS.
- [X] Agregar selector numérico de cantidad (- [ 1 ] +) antes de añadir a la bolsa.
- [X] Modal pedagógico accesible: "¿Qué es un Grado PSA?".

---

### [X] FASE 5: Carrito, Checkout con Registro Obligatorio y Validaciones Ecuatorianas
- [X] Eliminar la compra como invitado anónimo sin persistencia.
- [X] Formulario de Checkout unificado:
      * Captura de datos obligatorios: Nombre completo, Cédula/RUC (validada con Módulo 10), Teléfono (+593), Dirección de entrega.
      * Creación de cuenta en el mismo paso: Campo de contraseña ("Crea tu contraseña para registrar tu compra y acceder a tu historial").
- [X] Lógica de persistencia en Dexie.js al pagar:
      * Inserta o actualiza al cliente en la tabla 'usuarios'.
      * Asocia formalmente la orden generada al 'usuario_id' en 'ordenes_compra'.
      * Activa la sesión en 'state.js' automáticamente.
- [X] Validaciones y pagos:
      * Tarjetas validadas con Luhn (terminación '0000' dispara error simulado #DECLINED-SEC-054).
      * Tarifa plana de envío: $3.00 (Quito) / $5.00 (Nacional) / $0.00 (Retiro en local).
      * Desglose del IVA al 15%.
- [X] Sistema de Notificación Singleton: Máximo un toast activo en pantalla con auto-cierre en 2.5s.
- [X] Confirmación modal antes de eliminar ítems del carrito con opción de 'Deshacer'.

---

### [X] FASE 6: Doble API de Búsqueda con Failover (Viernes - Tarde)
- [X] Crear 'js/services/pokemon-api.js' con lógica de conmutación por fallo:
      * Primaria: 'pokemontcg.io' (metadatos completos y cotizaciones).
      * Secundaria (Respaldo): 'tcgdex.net' (gratuita, sin límite de cuota).
      * Fallback Offline: Catálogo local en memoria si no hay conexión a internet.
- [X] Crear la vista desacoplada '#search-results' con debounce de 400ms, skeleton loader y estado amigable de 'Cero resultados'.

---

### [X] FASE 7: Perfil de Usuario, Historial "Mis Últimas Compras" y Despliegue
- [X] Vista '#profile' completamente reactiva conectada a Dexie.js:
      * Pestaña "Mis Datos Personales": Permite editar nombre, teléfono y dirección guardada.
      * Pestaña "Mis Últimas Compras": Lee la tabla 'ordenes_compra' filtrada por el 'usuario_id' activo y renderiza los pedidos reales con miniaturas, fecha, método de pago y estado logístico.
- [X] Botón en cada orden del historial: [Ver Tracking en Vivo] que redirige a la vista '#tracking' con los datos exactos de esa compra.
- [X] Botón de [Cerrar Sesión] que limpia el estado activo y redirige al Home.

### [X] FASE 8: Migración a Supabase (PostgreSQL en la Nube) y Backend Real
- [X] Extraer el modelo de datos a un archivo `js/db/schema.sql` compatible con PostgreSQL.
- [X] Importar el cliente de Supabase por CDN en `index.html`.
- [X] Crear `js/db/supabase-config.js` para inicializar el cliente con la URL y anon_key.
- [X] Refactorizar `js/db/db-client.js` para que las consultas y mutaciones (lectura de catálogo, inserción de usuarios y órdenes) apunten a Supabase en lugar de IndexedDB.
- [X] Configurar Políticas de Seguridad de Filas (RLS) en Supabase para permitir lecturas públicas del catálogo e inserciones seguras de órdenes.