/**
 * Genera las ilustraciones de los productos sellados en assets/img/sealed/<id>/:
 * frontal.svg, lateral.svg, superior.svg y perspectiva.svg (vista 3D).
 *
 * Uso (desde la raíz del proyecto):  node tools/generar_cajas.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FONT = 'Arial, Helvetica, sans-serif';

// w = ancho del frente, h = alto, d = profundidad (en unidades relativas)
const BOXES = [
  { id: 'upc-pokemon-151', c1: '#7C3AED', c2: '#F472B6', side: '#5B21B6', titulo: ['POKÉMON 151', 'ULTRA-PREMIUM'], tipo: 'Collection', sobres: 16, extra: 'Mew metálica + 3 promos', cinta: 'EDICIÓN ESPECIAL', w: 320, h: 230, d: 95, emblema: 'pokeball' },
  { id: 'etb-prismatic-evolutions', c1: '#DB2777', c2: '#60A5FA', side: '#9D174D', titulo: ['PRISMATIC', 'EVOLUTIONS'], tipo: 'Elite Trainer Box', sobres: 9, extra: 'Promo de Eevee', cinta: 'EDICIÓN ESPECIAL', w: 250, h: 260, d: 130, emblema: 'estrella' },
  { id: 'spc-charizard-ex', c1: '#EA580C', c2: '#FACC15', side: '#9A3412', titulo: ['CHARIZARD ex', 'SUPER-PREMIUM'], tipo: 'Collection', sobres: 10, extra: '3 promos foil', cinta: 'EDICIÓN ESPECIAL', w: 320, h: 220, d: 85, emblema: 'llama' },
  { id: 'etb-crown-zenith', c1: '#1E3A8A', c2: '#FBBF24', side: '#172554', titulo: ['CROWN', 'ZENITH'], tipo: 'Elite Trainer Box', sobres: 10, extra: 'Promo foil', cinta: 'EDICIÓN ESPECIAL', w: 250, h: 260, d: 130, emblema: 'corona' },
  { id: 'etb-ascended-heroes', c1: '#0F766E', c2: '#A3E635', side: '#134E4A', titulo: ['ASCENDED', 'HEROES'], tipo: 'Elite Trainer Box', sobres: 9, extra: 'Mega Evolution', cinta: 'EDICIÓN ESPECIAL', w: 250, h: 260, d: 130, emblema: 'pokeball' },
  { id: 'booster-box-fossil-1999', c1: '#D6B07A', c2: '#A9773F', side: '#8B5E2B', titulo: ['FOSSIL', 'BOOSTER BOX'], tipo: 'Wizards of the Coast • 1999', sobres: 36, extra: '1st Edition Limited Printing', cinta: '1ST EDITION', w: 320, h: 150, d: 210, emblema: 'fosil', tinta: '#3F2A14' }
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Tamaño de letra para que un texto quepa en `largo` sin pasar de `max`
const ajustar = (texto, largo, max) => Math.min(max, largo / (String(texto).length * 0.75));
// Recorta el contenido de una cara a su rectángulo
const recorte = (w, h, cuerpo) => `<svg width="${w}" height="${h}" overflow="hidden">${cuerpo}</svg>`;

function defs(b) {
  return `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.c1}"/><stop offset="1" stop-color="${b.c2}"/></linearGradient>
  <linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.side}"/><stop offset="1" stop-color="${b.c1}"/></linearGradient>
  <linearGradient id="brillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <radialGradient id="sombra"><stop offset="0" stop-color="#0F172A" stop-opacity=".35"/><stop offset="1" stop-color="#0F172A" stop-opacity="0"/></radialGradient>
</defs>`;
}

// Emblema centrado en (cx, cy) con radio r
function emblema(tipo, cx, cy, r) {
  const k = '#0F172A';
  const sw = Math.max(2, r * 0.09);
  if (tipo === 'fosil') {
    // Amonita en espiral
    let d = '';
    for (let t = 0; t <= Math.PI * 6; t += 0.15) {
      const rr = r * 0.92 * Math.exp(-0.13 * (Math.PI * 6 - t)) ;
      d += `${d ? 'L' : 'M'}${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * Math.sin(t)).toFixed(1)}`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#F5E6C8" stroke="#3F2A14" stroke-width="${sw}"/>
  <path d="${d}" fill="none" stroke="#3F2A14" stroke-width="${sw * 0.8}" stroke-linecap="round"/>`;
  }
  if (tipo === 'estrella') {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? r * 0.45 : r;
      return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="#fff" stroke="${k}" stroke-width="${sw}" stroke-linejoin="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="#F472B6" stroke="${k}" stroke-width="${sw * 0.7}"/>`;
  }
  if (tipo === 'llama') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity=".92" stroke="${k}" stroke-width="${sw}"/>
  <path d="M${cx} ${cy - r * 0.75} C${cx + r * 0.55} ${cy - r * 0.2} ${cx + r * 0.6} ${cy + r * 0.35} ${cx} ${cy + r * 0.7} C${cx - r * 0.6} ${cy + r * 0.35} ${cx - r * 0.45} ${cy - r * 0.1} ${cx - r * 0.1} ${cy - r * 0.3} C${cx - r * 0.1} ${cy} ${cx + r * 0.05} ${cy + r * 0.1} ${cx} ${cy - r * 0.75}Z" fill="#EA580C" stroke="${k}" stroke-width="${sw * 0.7}"/>
  <path d="M${cx} ${cy + r * 0.05} C${cx + r * 0.25} ${cy + r * 0.25} ${cx + r * 0.2} ${cy + r * 0.55} ${cx} ${cy + r * 0.58} C${cx - r * 0.2} ${cy + r * 0.55} ${cx - r * 0.25} ${cy + r * 0.3} ${cx} ${cy + r * 0.05}Z" fill="#FACC15"/>`;
  }
  if (tipo === 'corona') {
    const x0 = cx - r * 0.75, x1 = cx + r * 0.75, y0 = cy - r * 0.5, y1 = cy + r * 0.45;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity=".92" stroke="${k}" stroke-width="${sw}"/>
  <path d="M${x0} ${y1} L${x0} ${y0} L${cx - r * 0.38} ${cy - r * 0.05} L${cx} ${y0 - r * 0.15} L${cx + r * 0.38} ${cy - r * 0.05} L${x1} ${y0} L${x1} ${y1}Z" fill="#FBBF24" stroke="${k}" stroke-width="${sw * 0.7}" stroke-linejoin="round"/>
  <rect x="${x0}" y="${y1 - r * 0.2}" width="${x1 - x0}" height="${r * 0.2}" fill="#1E3A8A"/>`;
  }
  // Pokébola
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${k}" stroke-width="${sw}"/>
  <path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0z" fill="#E11D48"/>
  <path d="M${cx - r} ${cy}h${2 * r}" stroke="${k}" stroke-width="${sw}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${k}" stroke-width="${sw}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.28}" fill="#fff" stroke="${k}" stroke-width="${sw}"/>`;
}

function codigoBarras(x, y, w, h) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`;
  let cx = x + w * 0.06;
  let i = 0;
  while (cx < x + w * 0.94) {
    const bw = [1, 2, 1, 3, 1, 2][i++ % 6] * w * 0.012;
    out += `<rect x="${cx.toFixed(1)}" y="${y + h * 0.12}" width="${bw.toFixed(1)}" height="${h * 0.76}" fill="#0F172A"/>`;
    cx += bw * 2;
  }
  return out;
}

// --- Caras de la caja, dibujadas en coordenadas locales (0,0)-(ancho,alto)

function caraFrontal(b, w, h) { return recorte(w, h, frontalSinRecorte(b, w, h)); }
function frontalSinRecorte(b, w, h) {
  if (w / h > 1.6) return frontalHorizontal(b, w, h);
  const tinta = b.tinta || '#fff';
  const base = Math.min(w, h);
  const r = base * 0.2;
  const cinta = h * 0.1;
  const tituloY = h * 0.66;
  return `<rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#brillo)"/>
  <rect y="${h * 0.07}" width="${w}" height="${cinta}" fill="#E11D48"/>
  <text x="${w / 2}" y="${h * 0.07 + cinta * 0.7}" text-anchor="middle" font-family="${FONT}" font-size="${cinta * 0.55}" font-weight="900" fill="#fff" letter-spacing="${cinta * 0.12}">${esc(b.cinta)}</text>
  ${emblema(b.emblema, w / 2, h * 0.4, r)}
  <text x="${w / 2}" y="${tituloY}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[0], w * 0.9, base * 0.13)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="${base * 0.004}">${esc(b.titulo[0])}</text>
  <text x="${w / 2}" y="${tituloY + base * 0.1}" text-anchor="middle" font-family="${FONT}" font-size="${base * 0.075}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="${base * 0.003}">${esc(b.titulo[1])}</text>
  <text x="${w / 2}" y="${tituloY + base * 0.17}" text-anchor="middle" font-family="${FONT}" font-size="${base * 0.05}" font-weight="700" fill="#0F172A">${esc(b.tipo)}</text>
  <rect y="${h * 0.9}" width="${w}" height="${h * 0.1}" fill="#0F172A" fill-opacity=".85"/>
  <text x="${w / 2}" y="${h * 0.965}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(`${b.sobres} sobres • ${b.extra}`, w * 0.9, h * 0.05)}" font-weight="700" fill="#fff">${b.sobres} sobres • ${esc(b.extra)}</text>
  <rect width="${w}" height="${h}" fill="none" stroke="#0F172A" stroke-width="${base * 0.015}"/>`;
}

// Frente bajo y ancho (cajas tipo display): emblema a la izquierda y títulos a la derecha
function frontalHorizontal(b, w, h) {
  const tinta = b.tinta || '#fff';
  const cinta = h * 0.16;
  const cx = w * 0.62;
  return `<rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#brillo)"/>
  <rect width="${w}" height="${cinta}" fill="#E11D48"/>
  <text x="${w / 2}" y="${cinta * 0.7}" text-anchor="middle" font-family="${FONT}" font-size="${cinta * 0.55}" font-weight="900" fill="#fff" letter-spacing="${cinta * 0.12}">${esc(b.cinta)}</text>
  ${emblema(b.emblema, w * 0.17, h * 0.55, h * 0.27)}
  <text x="${cx}" y="${h * 0.5}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[0], w * 0.55, h * 0.26)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="1">${esc(b.titulo[0])}</text>
  <text x="${cx}" y="${h * 0.66}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[1], w * 0.5, h * 0.12)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width=".6">${esc(b.titulo[1])}</text>
  <text x="${cx}" y="${h * 0.78}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.tipo, w * 0.55, h * 0.08)}" font-weight="700" fill="#0F172A">${esc(b.tipo)}</text>
  <rect y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="#0F172A" fill-opacity=".85"/>
  <text x="${w / 2}" y="${h * 0.955}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(`${b.sobres} sobres • ${b.extra}`, w * 0.9, h * 0.08)}" font-weight="700" fill="#fff">${b.sobres} sobres • ${esc(b.extra)}</text>
  <rect width="${w}" height="${h}" fill="none" stroke="#0F172A" stroke-width="${h * 0.02}"/>`;
}

function caraLateral(b, d, h) { return recorte(d, h, lateralSinRecorte(b, d, h)); }
function lateralSinRecorte(b, d, h) {
  if (d > h) return lateralHorizontal(b, d, h);
  const base = Math.min(d, h);
  const tinta = b.tinta || '#fff';
  return `<rect width="${d}" height="${h}" fill="url(#gs)"/>
  <rect width="${d}" height="${h}" fill="url(#brillo)"/>
  ${emblema(b.emblema, d / 2, h * 0.14, base * 0.2)}
  <text transform="translate(${d * 0.5} ${h * 0.5}) rotate(-90)" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-size="${ajustar(b.titulo[0], h * 0.42, d * 0.3)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="1">${esc(b.titulo[0])}</text>
  <text x="${d / 2}" y="${h * 0.8}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(`${b.sobres} SOBRES`, d * 0.85, base * 0.12)}" font-weight="900" fill="#fff">${b.sobres} SOBRES</text>
  ${codigoBarras(d * 0.15, h * 0.84, d * 0.7, h * 0.11)}
  <rect width="${d}" height="${h}" fill="none" stroke="#0F172A" stroke-width="${base * 0.02}"/>`;
}

// Costado más ancho que alto: título horizontal
function lateralHorizontal(b, d, h) {
  const tinta = b.tinta || '#fff';
  return `<rect width="${d}" height="${h}" fill="url(#gs)"/>
  <rect width="${d}" height="${h}" fill="url(#brillo)"/>
  ${emblema(b.emblema, d * 0.17, h * 0.4, h * 0.2)}
  <text x="${d * 0.64}" y="${h * 0.4}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[0], d * 0.44, h * 0.22)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="1">${esc(b.titulo[0])}</text>
  <text x="${d * 0.64}" y="${h * 0.58}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(`${b.sobres} SOBRES`, d * 0.45, h * 0.12)}" font-weight="900" fill="#fff">${b.sobres} SOBRES</text>
  ${codigoBarras(d * 0.3, h * 0.72, d * 0.4, h * 0.18)}
  <rect width="${d}" height="${h}" fill="none" stroke="#0F172A" stroke-width="${h * 0.02}"/>`;
}

function caraSuperior(b, w, d) { return recorte(w, d, superiorSinRecorte(b, w, d)); }
function superiorSinRecorte(b, w, d) {
  const base = Math.min(w, d);
  const tinta = b.tinta || '#fff';
  return `<rect width="${w}" height="${d}" fill="url(#g)"/>
  <rect width="${w}" height="${d}" fill="#fff" fill-opacity=".12"/>
  ${emblema(b.emblema, w * 0.16, d / 2, Math.min(base * 0.26, w * 0.12))}
  <text x="${w * 0.6}" y="${d * 0.47}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[0], w * 0.5, base * 0.24)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width="1">${esc(b.titulo[0])}</text>
  <text x="${w * 0.6}" y="${d * 0.47 + base * 0.15}" text-anchor="middle" font-family="${FONT}" font-size="${ajustar(b.titulo[1], w * 0.5, base * 0.14)}" font-weight="900" fill="${tinta}" stroke="#0F172A" stroke-width=".7">${esc(b.titulo[1])}</text>
  <text x="${w * 0.6}" y="${d * 0.88}" text-anchor="middle" font-family="${FONT}" font-size="${base * 0.07}" font-weight="900" fill="#0F172A">▲ ESTE LADO ARRIBA ▲</text>
  <rect width="${w}" height="${d}" fill="none" stroke="#0F172A" stroke-width="${base * 0.02}"/>`;
}

// --- Vistas completas (lienzo 800 x 800)

const LIENZO = 800;
const svg = (b, cuerpo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LIENZO} ${LIENZO}">\n${defs(b)}\n${cuerpo}\n</svg>\n`;

function centrada(b, w, h, cara) {
  const s = Math.min(620 / w, 620 / h);
  const x = (LIENZO - w * s) / 2;
  const y = (LIENZO - h * s) / 2 - 20;
  return svg(b, `<ellipse cx="400" cy="${y + h * s + 30}" rx="${w * s * 0.55}" ry="24" fill="url(#sombra)"/>
<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})">
  ${cara}
</g>`);
}

function perspectiva(b) {
  const a = 0.62, k = 0.36; // proyección de la profundidad
  const totalW = b.w + b.d * a;
  const totalH = b.h + b.d * k;
  const s = Math.min(640 / totalW, 600 / totalH);
  const x0 = (LIENZO - totalW * s) / 2;
  const y0 = (LIENZO - totalH * s) / 2 + b.d * k * s;
  const W = b.w * s, H = b.h * s, D = b.d * s;
  const caraEn = (m, cara) => `<g transform="matrix(${m.map(v => +v.toFixed(3)).join(' ')})">${cara}</g>`;
  return svg(b, `<ellipse cx="${x0 + (W + D * a) / 2}" cy="${y0 + H + 18}" rx="${(W + D * a) * 0.55}" ry="26" fill="url(#sombra)"/>
${caraEn([s, 0, -a * s, k * s, x0 + D * a, y0 - D * k], caraSuperior(b, b.w, b.d))}
${caraEn([s, 0, -a * s, k * s, x0 + D * a, y0 - D * k], `<rect width="${b.w}" height="${b.d}" fill="#fff" fill-opacity=".1"/>`)}
${caraEn([a * s, -k * s, 0, s, x0 + W, y0], caraLateral(b, b.d, b.h))}
${caraEn([a * s, -k * s, 0, s, x0 + W, y0], `<rect width="${b.d}" height="${b.h}" fill="#000" fill-opacity=".18"/>`)}
${caraEn([s, 0, 0, s, x0, y0], caraFrontal(b, b.w, b.h))}`);
}

BOXES.forEach(b => {
  const dir = path.join(ROOT, 'img/sealed', b.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'frontal.svg'), centrada(b, b.w, b.h, caraFrontal(b, b.w, b.h)));
  fs.writeFileSync(path.join(dir, 'lateral.svg'), centrada(b, b.d, b.h, caraLateral(b, b.d, b.h)));
  fs.writeFileSync(path.join(dir, 'superior.svg'), centrada(b, b.w, b.d, caraSuperior(b, b.w, b.d)));
  fs.writeFileSync(path.join(dir, 'perspectiva.svg'), perspectiva(b));
  console.log('generado', b.id);
});
