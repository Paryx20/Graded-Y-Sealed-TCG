# Prompts para generar los sobres con Gemini (Nano Banana)

Hay que generar 5 imágenes, una vista frontal por sobre. La vista en perspectiva es opcional: si la generas, añádela en `galeria_sellada` de `js/data.js`.

## Pasos
1. Abre Gemini con el modelo de imagen (Nano Banana) y pega **plantilla base + bloque del sobre + vista**.
2. Pide formato **vertical 2:3**. Si el sobre sale cortado, recortado o con texto raro, vuelve a generarlo.
3. Descarga cada imagen y guárdala con el **nombre exacto** indicado, en `assets/img/packs/_originales/`. Esa carpeta no se sube a git.
4. Desde la raíz del proyecto ejecuta:
   ```bash
   python tools/optimizar_sobres.py assets/img/packs/_originales
   ```
   El script deja los WebP de 800×1200 en `assets/img/packs/`, ya enlazados en el catálogo.

## Plantilla base (va en todos)
> Professional e-commerce product photograph of a single sealed Pokémon Trading Card Game booster pack, standing upright and centered, filling about 80% of the frame height. Glossy metallic foil wrapper with realistic crinkles, subtle wrinkles and specular highlights from the plastic, crimped heat-sealed edges at the top and bottom. Soft studio lighting with two large softboxes, gentle reflections, very soft contact shadow. Plain seamless light grey background (#F1F5F9), no props, no hands, no extra text, no watermark. Photorealistic, sharp focus, 85mm lens, high detail. Vertical 2:3 aspect ratio.

## Vistas
- **Frontal:** `Straight-on front view, camera at the pack's center height, pack perfectly vertical.`
- **Perspectiva:** `Three-quarter view, pack rotated about 30 degrees to the left, slightly leaning back, showing the side thickness and the light reflecting along the foil.`

## Sobres

### 1. Base Set 1999 1st Edition
Archivos: `booster-pack-base-1999-frontal.png`, `booster-pack-base-1999-perspectiva.png`
> Vintage 1999 Wizards of the Coast Base Set booster pack design: Charizard artwork on the front, classic yellow Pokémon logo at the top, blue and red color scheme, black "1st Edition" stamp near the logo, slightly aged foil.

### 2. Fossil 1999
Archivos: `booster-pack-fossil-1999-frontal.png`, `booster-pack-fossil-1999-perspectiva.png`
> Vintage 1999 Wizards of the Coast Fossil expansion booster pack design: Aerodactyl artwork on the front, amber and brown tones, yellow Pokémon logo at the top, Fossil expansion name, slightly aged foil.

### 3. Team Rocket 1999
Archivos: `booster-pack-team-rocket-1999-frontal.png`, `booster-pack-team-rocket-1999-perspectiva.png`
> Vintage 2000 Wizards of the Coast Team Rocket expansion booster pack design: Dark Charizard artwork on the front, black and dark purple background with a big red "R" logo, yellow Pokémon logo at the top.

### 4. Pokémon 151 (2023)
Archivos: `booster-pack-151-2023-frontal.png`, `booster-pack-151-2023-perspectiva.png`
> Modern 2023 Scarlet & Violet "151" expansion booster pack design: Mew artwork on a pink and white background, large "151" logo, modern Pokémon TCG branding at the top.

### 5. Prismatic Evolutions (2025)
Archivos: `booster-pack-prismatic-evolutions-2025-frontal.png`, `booster-pack-prismatic-evolutions-2025-perspectiva.png`
> Modern 2025 Scarlet & Violet "Prismatic Evolutions" booster pack design: Eevee and Eeveelution artwork, iridescent rainbow prismatic foil effects, modern Pokémon TCG branding at the top.

## Control de calidad antes de guardar
- Parece una **foto**, no una ilustración: hay brillo de plástico y arrugas visibles.
- El fondo es gris claro liso y el sobre está completo, sin bordes cortados.
- No hay texto inventado o deformado muy visible. Si lo hay, vuelve a generarla.
- Las dos vistas de un mismo sobre muestran el mismo diseño.
