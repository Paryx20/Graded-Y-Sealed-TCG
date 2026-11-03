# CLAUDE.md — E-commerce Pokémon TCG (Graded & Sealed)

Tienda online de cartas Pokémon (singles Raw, slabs PSA, producto sellado y sets).
Proyecto académico (solo lo verán el profesor y compañeros, no se lanzará al mercado)
que debe verse y funcionar como un e-commerce profesional real.

## Stack
- **Frontend:** Vanilla JavaScript (ES6+), HTML5, Tailwind CSS, Lucide Icons. Sin frameworks ni bundler.
- **Backend / BD:** Supabase (PostgreSQL + Auth + RLS), cliente `@supabase/supabase-js@2` por CDN.
- **Fallback offline:** Dexie.js (IndexedDB) / localStorage vía `js/db/db-client.js`.
- **Tests:** `node --test tests/*.test.mjs`

## Estado actual (importante)
- Supabase ya está configurado: registro e inicio de sesión de usuarios funcionando y guardándose en la BD.
- **Google Sign-In / GIS está DESCARTADO.** Aunque `PROJECT.md` lo mencione, no añadir ni mantener código de Google.
  Si encuentras código GIS, consultar antes de eliminarlo.
- **El router por hash (`#catalog`, `#pdp`, etc.) está DESCARTADO.** La navegación es multipágina:
  cada sección es un archivo HTML propio y se navega con enlaces normales (`<a href="pages/catalogo.html">`).
  JavaScript se usa solo para la lógica de cada página (carrito, Supabase, filtros, visor 3D), no para cambiar de página.
  Si queda código del router hash o vistas renderizadas por JS que ya existen como HTML, proponer eliminarlo.
- `PROJECT.md` tiene el detalle histórico (features, contratos de interfaz), pero está desactualizado
  en Google Sign-In y en el router hash. Consultarlo solo si hace falta.

## Estructura
- `index.html` — página de inicio
- `pages/*.html` — una página HTML por sección (catálogo, producto, carrito, checkout, login, perfil, seguimiento)
- `js/app.js` — lógica común a todas las páginas (sesión, navbar, carrito)
- `js/views/` o `js/pages/` — un script por página con su lógica específica (ej. `pdp.js` visor 3D + slab PSA)
- `js/data.js` — catálogo (10 cartas, precios $5–$80 USD)
- `js/db/` — `schema.sql` (12 tablas + RLS), `supabase-config.js`, `db-client.js` (capa híbrida)
- `css/styles.css` — estilos propios (slab PSA, drawer, etc.)
- `tests/` — suites de unit/integración
- `PLAN_DE_TRABAJO.md` — fases del proyecto

## Convenciones
- Estado global en `Store.data` (ej. `Store.data.currentUser`).
- El contenido de cada página va escrito en su HTML; JS solo añade comportamiento y datos dinámicos.
- Cada HTML carga únicamente los scripts que necesita.
- Todo acceso a datos pasa por `db-client.js` (nunca llamar a Supabase directo desde las vistas).
- Nunca poner claves secretas (service_role) en el frontend; solo la anon/publishable key.
- Cero errores en consola. Mantener los selectores que usan los tests.
- Textos de la interfaz en español.

## Objetivos pendientes (en este orden)
1. **Limpieza y orden del repositorio** — PRIMERA TAREA, hacerla en modo plan:
   - Inventariar todos los archivos y clasificarlos: en uso / duplicado / versión vieja / prueba suelta / sin usar.
   - **Antes de borrar nada, mostrar la lista completa al usuario y esperar su aprobación.**
     Verificar con búsqueda (grep) que ningún archivo a borrar esté referenciado en HTML, JS o tests.
   - Eliminar código muerto, funciones sin uso, `console.log` de depuración y comentarios obsoletos.
   - Eliminar el código de Google Sign-In / GIS (descartado).
   - Estructura objetivo:
     ```
     /
     ├── index.html   (página de inicio / entrada, siempre en la raíz)
     ├── pages/       (el resto de páginas HTML: catalogo.html, producto.html, carrito.html, checkout.html, login.html, perfil.html, seguimiento.html...)
     ├── README.md
     ├── CLAUDE.md
     ├── .gitignore
     ├── css/
     ├── js/
     │   ├── app.js
     │   ├── data.js
     │   ├── views/
     │   └── db/
     ├── assets/
     │   └── img/
     │       ├── logo/
     │       └── packs/
     ├── tests/
     └── docs/        (PROJECT.md, PLAN_DE_TRABAJO.md y demás documentación)
     ```
   - **El proyecto es multipágina (requisito académico): mantener varios HTML, no fusionarlos en uno.**
     Revisar cada HTML: si es una página real, moverla a `pages/`; si es duplicado o versión vieja, proponer borrarlo.
     Al mover, corregir rutas relativas (`../css/`, `../js/`, `../assets/`) y todos los enlaces entre páginas.
     Navbar y footer iguales en todas las páginas.
   - Nombres de archivo en minúsculas y con guiones (`kebab-case`), sin espacios ni sufijos tipo `-v2`, `-final`, `-copia`.
   - Crear `.gitignore` (node_modules, .env, archivos del sistema como `.DS_Store`/`Thumbs.db`, logs).
   - Reescribir `README.md`: descripción, stack, cómo ejecutarlo, cómo correr los tests, capturas.
   - Tras mover archivos, actualizar todas las rutas y ejecutar los tests: deben seguir en verde.
2. **Aspecto profesional:** diseño consistente, tipografía y espaciados cuidados, estados de carga/vacío/error.
   - Usar el **logo oficial de Pokémon** (imagen real, no generada), guardado en `assets/img/logo/`.
   - Pie de página con aviso: "Pokémon y sus marcas pertenecen a Nintendo, Creatures Inc. y GAME FREAK.
     Proyecto académico sin fines comerciales."
   - **Iconos del catálogo (pendiente):** añadir iconos Lucide coherentes en todo el catálogo:
     categorías (PSA, Raw, Sellado, Sets), filtros, ordenar, buscar, añadir al carrito, favoritos, condición/grado.
     Mismo tamaño y grosor en todos; iconos decorativos con `aria-hidden="true"` y botones solo-icono con `aria-label`.
3. **Imágenes de cartas:** imágenes reales externas (ej. Pokémon TCG API `images.pokemontcg.io`),
   con `loading="lazy"`, tamaños definidos y fallback si falla la carga.
4. **Imágenes de sobres/paquetes generadas por IA (con Gemini / Nano Banana, fuera de Claude):** solo para el producto sellado (booster packs).
   Deben verse **realistas, como fotografía de producto** (no dibujos): sobre metalizado, brillo y arrugas
   del plástico, iluminación de estudio, fondo neutro, misma proporción y tamaño en todas.
   Guardarlas en `assets/img/packs/` en formato WebP optimizado.
5. **Accesibilidad WCAG 2.2 (nivel AA):**
   - `alt` descriptivo en imágenes; HTML semántico (`header`, `nav`, `main`, `button` real, no `div` clicables).
   - Contraste mínimo 4.5:1 en texto.
   - Foco visible y no tapado por elementos fijos (2.4.7, 2.4.11).
   - Objetivos táctiles de al menos 24×24 px (2.5.8).
   - Formularios con `label`, errores anunciados (`aria-live`), sin pedir datos repetidos (3.3.7).
   - Alternativa sin arrastre para el visor 3D (botones de rotar) (2.5.7).
   - Respetar `prefers-reduced-motion`.
6. **Navegación por teclado:**
   - Todo usable con Tab / Shift+Tab / Enter / Espacio / Esc.
   - Enlace "Saltar al contenido".
   - Drawer y modales: atrapar el foco, cerrar con Esc y devolver el foco al botón que los abrió.
   - Visor 3D girable con flechas del teclado.
   - Al cambiar de ruta, mover el foco al encabezado de la nueva vista.

## Forma de trabajar
- Para cambios grandes, proponer un plan antes de editar.
- Nunca borrar archivos sin aprobación explícita del usuario.
- Ejecutar los tests después de cada cambio relevante.
- Mantener el repositorio ordenado: cada archivo nuevo va en su carpeta según la estructura de arriba.
