# Fotos de los sobres nuevos (Gemini)

Los 8 sobres agregados en la versión 24 se muestran por ahora con una ilustración SVG provisional
(`assets/img/packs/<id>-frontal.svg`, generada con `node tools/generar_sobres.js`).
Para reemplazarla por una foto:

1. Genera la imagen en Gemini con el prompt de la tabla (formato vertical 2:3).
2. Guárdala en `assets/img/packs/_originales/` con el nombre `<id>-frontal.png` (o `.jpg`).
3. Ejecuta `python tools/optimizar_sobres.py assets/img/packs/_originales` → crea `assets/img/packs/<id>-frontal.webp` (800×1200).
4. En `js/data.js`, quita `fotoProvisional: true` de ese sobre.
5. Opcional: borra el SVG provisional (verifica antes con grep que no se use).

Prompt base (cambia lo que está entre corchetes):

> Product photo of a single sealed Pokémon Trading Card Game booster pack from the
> [EXPANSIÓN] expansion, foil wrapper with crimped top and bottom edges, featuring
> [POKÉMON] artwork, front view, standing upright, centered, soft studio lighting,
> plain light gray background, realistic, high detail, vertical 2:3.

| id (nombre del archivo) | Expansión | Pokémon de la portada |
| --- | --- | --- |
| `booster-pack-evolving-skies-2021` | Evolving Skies | Rayquaza VMAX |
| `booster-pack-lost-origin-2022` | Lost Origin | Giratina VSTAR |
| `booster-pack-silver-tempest-2022` | Silver Tempest | Lugia V |
| `booster-pack-crown-zenith-2023` | Crown Zenith | Zacian y Zamazenta |
| `booster-pack-scarlet-violet-2023` | Scarlet & Violet | Koraidon ex / Miraidon ex |
| `booster-pack-paradox-rift-2023` | Paradox Rift | Roaring Moon ex / Iron Valiant ex |
| `booster-pack-paldean-fates-2024` | Paldean Fates | Charizard ex variocolor |
| `booster-pack-twilight-masquerade-2024` | Twilight Masquerade | Ogerpon ex |

## Base de datos

Los sobres solo aparecen en la tienda cuando existen en Supabase. Para agregarlos sin tocar el
inventario actual, ejecuta una vez `js/db/seed-sobres-v24.sql` en el SQL Editor
(usa `on conflict do nothing`). Se regenera con:

```bash
node tools/generar_seed.js --solo booster-pack-evolving-skies-2021,booster-pack-lost-origin-2022,booster-pack-silver-tempest-2022,booster-pack-crown-zenith-2023,booster-pack-scarlet-violet-2023,booster-pack-paradox-rift-2023,booster-pack-paldean-fates-2024,booster-pack-twilight-masquerade-2024 --salida js/db/seed-sobres-v24.sql
```
