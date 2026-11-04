# Prompts para Gemini (Nano Banana): Booster Box

Imágenes de las cajas selladas de 36 sobres para la ficha de producto. Se generan fuera de Claude y se guardan como
WebP 1200×900 (horizontal 4:3) en `assets/img/sealed/<id>/<ángulo>.webp`.

| Producto en la tienda | id (`js/data.js`) | Ángulos |
|---|---|---|
| Booster Box Team Rocket 1999 | `booster-team-rocket` | frontal, perspectiva, lateral, superior |
| Booster Box Fossil 1999 (36 packs) | `booster-box-fossil-1999` | frontal, perspectiva, lateral, superior |

## Cómo usarlos
1. Pega primero el **bloque de estilo común**, debajo la **descripción de la caja** y al final la línea del **ángulo**.
2. Pide formato **horizontal 4:3**. Si Gemini la devuelve cuadrada: *"Output a landscape image, 4:3 aspect ratio."*
3. Revisa los textos impresos (Gemini cambia letras). Si sale mal:
   *"Keep everything identical but fix the printed text so it reads exactly: …"*
4. Con la primera imagen buena de cada caja, adjúntala en los siguientes ángulos:
   *"This is the same box. Use this image as reference: keep identical artwork, colors, background and lighting, only change the camera angle."*

## Bloque de estilo común (pegar siempre primero)

```
Professional e-commerce product photograph of a single factory-sealed Pokémon Trading Card Game booster box (a printed cardboard display box that holds 36 booster packs), real physical object, NOT an illustration or 3D render.
The box is wrapped in clear factory shrink-wrap cellophane with realistic glossy reflections, slight tension wrinkles at the corners and edges, and folded heat-sealed seams.
Printed cardboard with authentic late-1990s offset print look: slightly muted colors, fine print texture, crisp sharp corners, no damage.
Lighting: soft studio lighting from a large softbox above-left plus a fill light, gentle highlights on the cellophane, a very soft contact shadow under the box.
Background: seamless plain pale blue-grey studio backdrop (#E9EDF3), no props, no hands, no other products, no text outside the box, no watermark.
The box is centered and fills about 70% of the frame width with even margins. Sharp focus across the whole box, high detail, 70mm lens look, neutral color grading, photorealistic.
Landscape orientation, 4:3 aspect ratio.
```

## Descripción de cada caja

### Team Rocket 1999 → `assets/img/sealed/booster-team-rocket/`
```
The box is the 1999 Pokémon "Team Rocket" booster box, 1st Edition, by Wizards of the Coast: a wide, low rectangular box printed glossy black. On the front: a large red stylized "TEAM Rocket" logo with a big "R" outlined in light blue, and on the right a red-haired anime girl in a white uniform with a red "R" on the chest holding a Poké Ball. Bottom-left corner: the purple-and-gold "Wizards of the Coast" logo and a small white oval "Nintendo" seal. A small round black "1st EDITION" stamp. The sides repeat the red Team Rocket logo on black with a yellow "Pokémon" logo.
```

### Fossil 1999 → `assets/img/sealed/booster-box-fossil-1999/`
```
The box is the 1999 Pokémon "Fossil" booster box, 1st Edition, by Wizards of the Coast: a nearly cube-shaped box printed in beige-tan cracked stone/rock texture. On the top lid: the yellow "Pokémon" logo over a large red-and-white Poké Ball, a pale grey Aerodactyl flying, the red word "DANGER!" and the curved red text "1ST EDITION LIMITED PRINTING". On the front panel: blue text "Gotta catch 'em all!", a Kabutops emerging from a dark hole in the rock, the round "Fossil" expansion symbol, a small "1st EDITION" stamp and a red banner reading "TRADING CARD GAME". On the side panel: a blue Lapras breaking through the rock and the text "this side up" with arrows. Several small translucent "Wizards of the Coast" logo stickers printed on the shrink-wrap.
```

## Línea de ángulo (añadir al final)

- **Frontal** → `frontal.webp`
  ```
  Camera straight-on at eye level facing the main front panel, box perfectly square to the camera, only the front panel visible.
  ```
- **Perspectiva** → `perspectiva.webp`
  ```
  Three-quarter view from slightly above: the front panel, one side panel and the top lid all visible, box rotated about 35 degrees to the right.
  ```
- **Lateral** → `lateral.webp`
  ```
  Camera straight-on facing the narrow side panel of the box, only that side visible, same height as the box center.
  ```
- **Superior** → `superior.webp`
  ```
  Camera directly above looking straight down at the top lid of the box (flat lay), the lid artwork fully visible and centered, shrink-wrap reflections across the top.
  ```

## Opcional: cajas que aún no están en la tienda
Por si se quieren añadir más productos. Usar con el mismo bloque común y las líneas de ángulo.

### Base Set 1999 → `assets/img/sealed/booster-box-base-1999/`
```
The box is the 1999 Pokémon "Base Set" booster box, 1st Edition, by Wizards of the Coast: dark blue box with swirling energy background, the yellow "Pokémon" logo, a red "TRADING CARD GAME" banner, Charizard, Blastoise and Venusaur artwork on the lid, a small "1st EDITION" stamp and the Wizards of the Coast logo.
```

### Pokémon 151 (2023) → `assets/img/sealed/booster-box-151-2023/`
```
The box is the 2023 Pokémon "Scarlet & Violet 151" booster bundle box: white box covered with a pattern of small colorful Pokémon silhouettes, the yellow "Pokémon" logo, a pink Mew with a red-and-white Poké Ball, the "Scarlet & Violet" logo and a large chrome-rainbow "151". Modern clean print with a glossy coating instead of vintage print texture.
```

## Después de generarlas
Pásame los archivos (PNG o JPG) y yo los convierto a WebP 1200×900 en la carpeta correcta y actualizo
`galeria_sellada` en `js/data.js` para que la ficha muestre los 4 ángulos.
