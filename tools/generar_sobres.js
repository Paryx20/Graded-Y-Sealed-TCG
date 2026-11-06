/**
 * Genera ilustraciones SVG provisionales de los sobres (booster packs) que todavía
 * no tienen foto: assets/img/packs/<id>-frontal.svg
 *
 * Cuando tengas la foto generada con Gemini, guárdala como assets/img/packs/_originales/<id>-frontal.png,
 * conviértela con `python tools/optimizar_sobres.py assets/img/packs/_originales` y quita
 * `fotoProvisional: true` del sobre en js/data.js. Ver docs/prompts-sobres.md.
 *
 * Uso (desde la raíz del proyecto):  node tools/generar_sobres.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
global.window = global;
eval(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + ';global.__PRODUCTS = PRODUCTS;');

// Color principal y de acento de cada expansión (colores planos, sin logos oficiales)
const COLORS = {
  'evolving-skies': ['#0E7490', '#FDE68A'],
  'lost-origin': ['#312E81', '#A5B4FC'],
  'silver-tempest': ['#475569', '#E2E8F0'],
  'crown-zenith': ['#1E3A8A', '#FCD34D'],
  'scarlet-violet': ['#9F1239', '#C4B5FD'],
  'paradox-rift': ['#3F3F46', '#F0ABFC'],
  'paldean-fates': ['#065F46', '#FDE047'],
  'twilight-masquerade': ['#14532D', '#FDBA74']
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(pack, [main, accent]) {
  const name = pack.nombre.replace(/^Booster Pack /, '');
  const year = (pack.set.match(/(19|20)\d{2}/) || [''])[0];
  const cards = (pack.detalles_sellados && pack.detalles_sellados.packs) || '1 Sobre de 10 Cartas';
  const fontSize = name.length > 16 ? 58 : 72;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200" role="img" aria-label="Ilustración del sobre ${esc(name)}">
  <rect width="800" height="1200" fill="#F8FAFC"/>
  <path d="M180 120 h440 l12 46 v868 l-12 46 h-440 l-12 -46 v-868 z" fill="${main}"/>
  <g fill="none" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="4">
    <path d="M168 166 h464" stroke-dasharray="14 10"/>
    <path d="M168 1034 h464" stroke-dasharray="14 10"/>
  </g>
  <rect x="226" y="230" width="348" height="54" rx="10" fill="${accent}"/>
  <text x="400" y="268" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#0F172A" letter-spacing="3">BOOSTER PACK</text>
  <circle cx="400" cy="560" r="150" fill="none" stroke="${accent}" stroke-width="18"/>
  <path d="M250 560 h300" stroke="${accent}" stroke-width="18"/>
  <circle cx="400" cy="560" r="46" fill="${main}" stroke="${accent}" stroke-width="18"/>
  <text x="400" y="830" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="#FFFFFF">${esc(name)}</text>
  <text x="400" y="890" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600" fill="${accent}">${esc(year)} · ${esc(cards.replace('1 Sobre de ', ''))}</text>
  <text x="400" y="1100" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" fill="#64748B">Imagen ilustrativa</text>
</svg>
`;
}

const packs = global.__PRODUCTS.filter(p => p.esSobre && /\.svg$/.test(p.imagenLocal) && p.imagenLocal !== p.imagenFallbackUrl);
packs.forEach(pack => {
  const colors = COLORS[pack.expansion] || ['#0F172A', '#FDE68A'];
  const file = path.join(ROOT, pack.imagenLocal);
  fs.writeFileSync(file, svg(pack, colors));
  console.log('ok', pack.imagenLocal);
});
console.log(`${packs.length} sobres provisionales generados`);
