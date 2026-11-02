Optimización y evolución para producción de la plataforma e-commerce Graded & Sealed TCG: ajuste de simulación de despacho y tracking por tipo de entrega, integración de Google Sign-In, rediseño de slabs PSA según fotografía de referencia, corrección de búsqueda multicriterio por categoría, modernización visual del drawer de categorías y desarrollo de la FASE 8 con Supabase y catálogo de 10 cartas a precios normales de mercado.

Working directory: c:\Users\patri\Desktop\PUCE TAREAS\IHC\Pagina_e-commerce
Integrity mode: development

Referencias visuales provistas:
- Captura 1 (Tracking en Vivo): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634163224_5524a750.jpg
- Captura 2 (Portal de Autenticación sin Google visible): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634228982_2f8039b1.jpg
- Captura 3 (Foto real de Slab PSA Greninja): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634479327_23c1d67d.jpg
- Captura 4 (Catálogo con búsqueda): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634656938_1630c76b.jpg
- Captura 5 (Drawer de Categorías a mejorar): C:/Users/patri/.gemini/antigravity/brain/81d26242-cfdc-492f-a712-669157c1638a/.user_uploaded/media_1793634877558_f20d87f2.png

## Requirements

### R1. Simulación y Flujo Diferenciado de Tracking (#tracking)
Acelerar la progresión temporal de la simulación de despacho para que el hito de preparación se complete rápidamente con su indicador de check y continúe fluido hacia la siguiente etapa. Diferenciar de forma clara e inequívoca el tracking según la modalidad elegida en la compra: para "Envío a Domicilio", mostrar el avance del transporte blindado/camión; para "Retiro en Local / Bóveda Quito", suprimir la animación del camión en tránsito y mostrar el estado de preparación y disponibilidad para retiro presencial, detallando horarios y requisitos de retiro.

### R2. Integración de Google Sign-In / OAuth
Implementar el botón de Google Sign-In visible y completamente funcional en la pestaña "Iniciar Sesión" y en la pestaña "Crear Cuenta / Registrarse" del portal de autenticación (#auth), así como en el flujo de Checkout. Utilizar el SDK oficial de Google Identity Services con soporte interactivo que incluya simulación o fallback funcional que permita autenticar y registrar la sesión del usuario si no hay un Client ID de Google configurado en el entorno.

### R3. Rediseño Visual del Slab PSA Basado en Referencia Real
Rediseñar el slab PSA en CSS para replicar fielmente la fotografía de referencia de la certificación real (Greninja PSA 10, Captura 3): marco acrílico biselado transparente con muescas estructurales, etiqueta superior oficial con borde rojo característico de PSA, código de barras nítido, logotipo oficial de PSA, tipografía reglamentaria, alineación precisa y grado GEM MT 10.

### R4. Búsqueda y Filtrado Multicriterio por Categoría
Corregir la lógica de búsqueda en el catálogo (#catalog) para que permita buscar términos dentro de la categoría seleccionada (búsqueda multicriterio) y garantizar que la consulta por nombre de carta (por ejemplo, "charizard") no restrinja indebidamente ni bloquee la visualización de los resultados.

### R5. Estilización y Microinteracciones del Drawer de Categorías
Modernizar la apariencia visual de los botones del menú lateral desplegable de categorías (Captura 5), aplicando estilos refinados en bordes, gradientes sutiles, microinteracciones hover claras, tipografía jerárquica y badges identificativos acordes al diseño de la plataforma.

### R6. FASE 8: Arquitectura Supabase y Catálogo de 10 Cartas con Precios Normales
Ejecutar la FASE 8 de PLAN_DE_TRABAJO.md creando `js/db/schema.sql` compatible con PostgreSQL, la configuración e inicialización del cliente en `js/db/supabase-config.js` y adaptando el cliente de base de datos con un esquema híbrido que asegure fallback automático a IndexedDB/Dexie si no hay conexión a la nube. Poblar el catálogo con 10 cartas Pokémon con precios normales y reales de mercado ($5 a $80 USD), reemplazando cotizaciones exorbitantes. Actualizar `PLAN_DE_TRABAJO.md` marcando la FASE 8 con `[X]`.

## Acceptance Criteria

### Tracking y Despacho
- [ ] La simulación en `#tracking` progresa con tiempos breves entre etapas, completando la preparación rápidamente y mostrando el check correspondiente.
- [ ] En pedidos con "Retiro en Local / Bóveda Quito", el tracking no muestra camión ni despacho vial; muestra "Listo para retiro presencial en Bóveda", indicando dirección, horario de atención y requisitos de cédula.
- [ ] En pedidos con "Envío a Domicilio", el tracking muestra el estado y la animación de transporte blindado en ruta.

### Autenticación Google
- [ ] El botón de Google Sign-In está presente y estilizado tanto en la pestaña "Iniciar Sesión" como en "Crear Cuenta / Registrarse" dentro de `#auth` y en el Checkout.
- [ ] Al interactuar con el botón de Google Sign-In, el usuario puede iniciar sesión o registrarse, actualizando el estado de sesión global y el navbar sin errores en consola.

### Slab PSA
- [ ] El inspector de cartas en modo Slab PSA presenta el marco acrílico transparente biselado con muescas, la etiqueta oficial con marco rojo PSA, código de barras, número de certificación, tipografía y logo oficiales alineados según la Captura 3.

### Búsqueda y Navegación
- [ ] La búsqueda textual permite filtrar dentro de la categoría activa seleccionada sin bloquear los resultados.
- [ ] Los botones del menú drawer de categorías cuentan con estilos modernos (bordes, gradientes, badges) y retroalimentación hover visible.

### Base de Datos y Catálogo
- [ ] Existe el archivo `js/db/schema.sql` con las sentencias DDL correspondientes para PostgreSQL/Supabase.
- [ ] Existe `js/db/supabase-config.js` y el cliente Supabase está integrado en `index.html` y `js/db/db-client.js` con fallback transparente a IndexedDB/Dexie.
- [ ] El catálogo contiene 10 cartas de Pokémon con precios de mercado razonables (entre $5 y $80 USD).
- [ ] El archivo `PLAN_DE_TRABAJO.md` tiene marcada la FASE 8 con `[X]`.

## Verification Resources
- Pruebas automatizadas existentes en `tests/` ejecutadas sin fallos.
- Validación funcional e interactiva en navegador de cada una de las 6 áreas (Tracking con ambos métodos de entrega, Google Sign-In en login/registro/checkout, visor de Slab PSA, búsqueda por categoría, drawer y catálogo de 10 cartas con persistencia).
