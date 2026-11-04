const APP_CONFIG = {
  TAX_RATE: 0.15,
  QUITO_SHIPPING_FEE: 3.00,
  COURIER_SHIPPING_FEE: 5.00,
  PICKUP_SHIPPING_FEE: 0.00,
};

/**
 * Precios de cartas: el Raw es el precio de mercado real de TCGplayer (consultado en la API
 * de TCGdex el día PRECIOS_FECHA y fijado aquí, igual que en Supabase, para que el checkout cuadre).
 * Los grados PSA son estimaciones a partir del Raw.
 */
const PRECIOS_FECHA = '2026-11-03';
const PRECIOS_FUENTE = 'TCGplayer';
const MULTIPLICADORES_PSA = { psa8: 1.6, psa9: 2.4, psa10: 4.5 };

// Cálculo en centavos enteros con redondeo half-up, idéntico a round() de PostgreSQL
function precioPorMultiplicador(raw, multiplicador) {
  const centavos = Math.round(raw * 100);
  return Math.round(centavos * Math.round(multiplicador * 10) / 10) / 100;
}

function preciosDesdeRaw(raw) {
  return {
    raw,
    psa8: precioPorMultiplicador(raw, MULTIPLICADORES_PSA.psa8),
    psa9: precioPorMultiplicador(raw, MULTIPLICADORES_PSA.psa9),
    psa10: precioPorMultiplicador(raw, MULTIPLICADORES_PSA.psa10)
  };
}

/**
 * Catálogo principal: 10 cartas Pokémon con precio real de mercado
 */
const POKEMON_CARDS_CATALOG_10 = [
  {
    id: 'pikachu-crown-zenith',
    edicionEspecial: true,
    nombre: 'Pikachu Secret Rare #160/159',
    set: 'Crown Zenith 2023',
    rareza: 'Secret Rare',
    tipo: 'Eléctrico',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920111',
    imagenLocal: 'https://images.pokemontcg.io/swsh12pt5/160.png',
    imagenFallbackUrl: 'assets/img/cards/pikachu-crown-zenith.webp',
    precios: preciosDesdeRaw(36.88),
    descripcion: 'Pikachu Secret Rare #160/159 • Zenit Supremo 2023 • Certificación Bóveda PSA',
    tendencia12m: '+11.5%',
    rendimientoAnual: 11.5,
    historialBase: [0.89, 0.90, 0.91, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'charizard-ex-paldean',
    nombre: 'Charizard ex Double Rare #054/091',
    set: 'Paldean Fates 2024',
    rareza: 'Double Rare',
    tipo: 'Oscuridad',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920112',
    imagenLocal: 'https://images.pokemontcg.io/sv4pt5/54.png',
    imagenFallbackUrl: 'assets/img/cards/charizard-ex-paldean.webp',
    precios: preciosDesdeRaw(4.60),
    descripcion: 'Charizard ex Doble Rara • Destinos de Paldea 2024 • Certificación Bóveda PSA',
    tendencia12m: '+13.2%',
    rendimientoAnual: 13.2,
    historialBase: [0.88, 0.89, 0.90, 0.92, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'eevee-twilight',
    nombre: 'Eevee Illustration Rare #188/167',
    set: 'Twilight Masquerade 2024',
    rareza: 'Illustration Rare',
    tipo: 'Incoloro',
    categoria: 'raw',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '84920113',
    imagenLocal: 'https://images.pokemontcg.io/sv6/188.png',
    imagenFallbackUrl: 'assets/img/cards/eevee-twilight.webp',
    precios: preciosDesdeRaw(70.68),
    descripcion: 'Eevee Arte Especial • Mascarada Crepuscular • Near Mint Verificado',
    tendencia12m: '+15.8%',
    rendimientoAnual: 15.8,
    historialBase: [0.85, 0.87, 0.89, 0.90, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'gengar-scarlet-violet',
    nombre: 'Gengar Holo Rare #094/165',
    set: 'Pokemon 151 2023',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'raw',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '84920114',
    imagenLocal: 'https://images.pokemontcg.io/sv3pt5/94.png',
    imagenFallbackUrl: 'assets/img/cards/gengar-scarlet-violet.webp',
    precios: preciosDesdeRaw(2.94),
    descripcion: 'Gengar Holo Rare #094/165 • Colección Pokémon 151 • Funda Protectora',
    tendencia12m: '+8.4%',
    rendimientoAnual: 8.4,
    historialBase: [0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 0.99, 1.00, 1.00]
  },
  {
    id: 'greninja-ex-twilight',
    nombre: 'Greninja ex Double Rare #106/167',
    set: 'Twilight Masquerade 2024',
    rareza: 'Double Rare',
    tipo: 'Agua',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920115',
    imagenLocal: 'https://images.pokemontcg.io/sv6/106.png',
    imagenFallbackUrl: 'assets/img/cards/greninja-ex-twilight.webp',
    precios: preciosDesdeRaw(1.75),
    descripcion: 'Greninja ex Mascarada Crepuscular 2024 • Certificación PSA 10 GEM MT',
    tendencia12m: '+16.2%',
    rendimientoAnual: 16.2,
    historialBase: [0.86, 0.88, 0.90, 0.92, 0.93, 0.95, 0.96, 0.98, 0.99, 0.99, 1.00, 1.00]
  },
  {
    id: 'mimikyu-paldean',
    nombre: 'Mimikyu Shiny Rare #160/091',
    set: 'Paldean Fates 2024',
    rareza: 'Shiny Rare',
    tipo: 'Psíquico',
    categoria: 'raw',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '84920116',
    imagenLocal: 'https://images.pokemontcg.io/sv4pt5/160.png',
    imagenFallbackUrl: 'assets/img/cards/mimikyu-paldean.webp',
    precios: preciosDesdeRaw(45.30),
    descripcion: 'Mimikyu Shiny Holo • Destinos de Paldea • Estado Near Mint',
    tendencia12m: '+12.7%',
    rendimientoAnual: 12.7,
    historialBase: [0.87, 0.89, 0.91, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'mewtwo-151',
    nombre: 'Mewtwo Holo Rare #150/165',
    set: 'Pokemon 151 2023',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920117',
    imagenLocal: 'https://images.pokemontcg.io/sv3pt5/150.png',
    imagenFallbackUrl: 'assets/img/cards/mewtwo-151.webp',
    precios: preciosDesdeRaw(2.33),
    descripcion: 'Mewtwo Holo Rare • Colección Pokémon 151 • Grado PSA 10 Gem Mint',
    tendencia12m: '+10.4%',
    rendimientoAnual: 10.4,
    historialBase: [0.90, 0.91, 0.92, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 0.99, 1.00, 1.00]
  },
  {
    id: 'lucario-vstar-zenith',
    edicionEspecial: true,
    nombre: 'Lucario VSTAR Promo SWSH291',
    set: 'Crown Zenith Promos 2023',
    rareza: 'Promo Holo',
    tipo: 'Lucha',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920118',
    imagenLocal: 'https://images.pokemontcg.io/swshp/SWSH291.png',
    imagenFallbackUrl: 'assets/img/cards/lucario-vstar-zenith.webp',
    precios: preciosDesdeRaw(8.15),
    descripcion: 'Lucario VSTAR Arte Especial Promo • Grado Inversión Bóveda PSA',
    tendencia12m: '+11.1%',
    rendimientoAnual: 11.1,
    historialBase: [0.89, 0.90, 0.92, 0.93, 0.94, 0.96, 0.97, 0.98, 0.99, 0.99, 1.00, 1.00]
  },
  {
    id: 'raichu-gx',
    nombre: 'Raichu GX Fase 1 Full Art #29/73',
    set: 'Leyendas Luminosas 2017',
    rareza: 'Ultra Rare GX',
    tipo: 'Eléctrico',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '48291077',
    imagenLocal: 'https://images.pokemontcg.io/sm35/29.png',
    imagenFallbackUrl: 'assets/img/cards/raichu-gx.webp',
    precios: preciosDesdeRaw(5.47),
    descripcion: 'Carta oficial Raichu GX • PS 210 • Chispa Poderosa • Bóveda PSA oficial',
    tendencia12m: '+14.8%',
    rendimientoAnual: 14.8,
    historialBase: [0.86, 0.88, 0.89, 0.91, 0.92, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00]
  },
  {
    id: 'blastoise-ex-151',
    nombre: 'Blastoise ex Double Rare #009/165',
    set: 'Pokemon 151 2023',
    rareza: 'Double Rare',
    tipo: 'Agua',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920120',
    imagenLocal: 'https://images.pokemontcg.io/sv3pt5/9.png',
    imagenFallbackUrl: 'assets/img/cards/blastoise-ex-151.webp',
    precios: preciosDesdeRaw(2.27),
    descripcion: 'Blastoise ex #009/165 • Pokémon 151 • Bóveda PSA oficial',
    tendencia12m: '+12.3%',
    rendimientoAnual: 12.3,
    historialBase: [0.88, 0.89, 0.91, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  }
];

/**
 * 25 cartas más del catálogo (precio Raw real de TCGplayer al PRECIOS_FECHA)
 * imagen: ruta en images.pokemontcg.io · respaldo local en assets/img/cards/<id>.png
 */
const POKEMON_CARDS_EXTRA = [
  ['alakazam-ex-151', 'Alakazam ex', 'Alakazam ex Special Illustration Rare #201/165', 'Pokemon 151 2023', 'Special Illustration Rare', 'Psíquico', 'psa', 'sv3pt5/201', 56.97, 14.6],
  ['bulbasaur-151', 'Bulbasaur', 'Bulbasaur Illustration Rare #166/165', 'Pokemon 151 2023', 'Illustration Rare', 'Planta', 'raw', 'sv3pt5/166', 53.60, 12.9],
  ['caterpie-151', 'Caterpie', 'Caterpie Illustration Rare #172/165', 'Pokemon 151 2023', 'Illustration Rare', 'Planta', 'raw', 'sv3pt5/172', 15.57, 7.8],
  ['charmander-151', 'Charmander', 'Charmander Illustration Rare #168/165', 'Pokemon 151 2023', 'Illustration Rare', 'Fuego', 'psa', 'sv3pt5/168', 80.89, 17.4],
  ['dragonair-151', 'Dragonair', 'Dragonair Illustration Rare #181/165', 'Pokemon 151 2023', 'Illustration Rare', 'Dragón', 'raw', 'sv3pt5/181', 37.25, 10.2],
  ['gardevoir-ex-escarlata-purpura', 'Gardevoir ex', 'Gardevoir ex Special Illustration Rare #245/198', 'Scarlet & Violet 2023', 'Special Illustration Rare', 'Psíquico', 'psa', 'sv1/245', 64.05, 11.7],
  ['giratina-vstar-lost-origin', 'Giratina VSTAR', 'Giratina VSTAR Secret Rare #201/196', 'Lost Origin 2022', 'Secret Rare', 'Dragón', 'psa', 'swsh11/201', 24.73, 9.1],
  ['iron-valiant-ex-paradox-rift', 'Iron Valiant ex', 'Iron Valiant ex Special Illustration Rare #249/182', 'Paradox Rift 2023', 'Special Illustration Rare', 'Psíquico', 'raw', 'sv4/249', 19.37, 6.4],
  ['koraidon-ex-escarlata-purpura', 'Koraidon ex', 'Koraidon ex Special Illustration Rare #247/198', 'Scarlet & Violet 2023', 'Special Illustration Rare', 'Lucha', 'raw', 'sv1/247', 18.44, 5.9],
  ['lugia-v-silver-tempest', 'Lugia V', 'Lugia V Holo Rare #138/195', 'Silver Tempest 2022', 'Holo Rare V', 'Incoloro', 'psa', 'swsh12/138', 14.19, 8.8],
  ['machoke-151', 'Machoke', 'Machoke Illustration Rare #177/165', 'Pokemon 151 2023', 'Illustration Rare', 'Lucha', 'raw', 'sv3pt5/177', 19.69, 7.2],
  ['mew-ex-151', 'Mew ex', 'Mew ex Hyper Rare Gold #205/165', 'Pokemon 151 2023', 'Hyper Rare', 'Psíquico', 'psa', 'sv3pt5/205', 23.78, 10.6],
  ['miraidon-ex-escarlata-purpura', 'Miraidon ex', 'Miraidon ex Special Illustration Rare #244/198', 'Scarlet & Violet 2023', 'Special Illustration Rare', 'Eléctrico', 'raw', 'sv1/244', 18.60, 6.1],
  ['nidoking-151', 'Nidoking', 'Nidoking Illustration Rare #174/165', 'Pokemon 151 2023', 'Illustration Rare', 'Oscuridad', 'raw', 'sv3pt5/174', 15.80, 7.5],
  ['omanyte-151', 'Omanyte', 'Omanyte Illustration Rare #180/165', 'Pokemon 151 2023', 'Illustration Rare', 'Agua', 'raw', 'sv3pt5/180', 10.80, 6.8],
  ['poliwhirl-151', 'Poliwhirl', 'Poliwhirl Illustration Rare #176/165', 'Pokemon 151 2023', 'Illustration Rare', 'Agua', 'raw', 'sv3pt5/176', 34.59, 11.3],
  ['psyduck-151', 'Psyduck', 'Psyduck Illustration Rare #175/165', 'Pokemon 151 2023', 'Illustration Rare', 'Agua', 'psa', 'sv3pt5/175', 49.44, 13.5],
  ['rayquaza-vmax-evolving-skies', 'Rayquaza VMAX', 'Rayquaza VMAX Holo Rare #111/203', 'Evolving Skies 2021', 'Holo Rare VMAX', 'Dragón', 'psa', 'swsh7/111', 13.26, 9.7],
  ['roaring-moon-ex-paradox-rift', 'Roaring Moon ex', 'Roaring Moon ex Special Illustration Rare #251/182', 'Paradox Rift 2023', 'Special Illustration Rare', 'Oscuridad', 'raw', 'sv4/251', 28.54, 8.3],
  ['squirtle-151', 'Squirtle', 'Squirtle Illustration Rare #170/165', 'Pokemon 151 2023', 'Illustration Rare', 'Agua', 'psa', 'sv3pt5/170', 82.17, 16.9],
  ['sylveon-vmax-evolving-skies', 'Sylveon VMAX', 'Sylveon VMAX Holo Rare #075/203', 'Evolving Skies 2021', 'Holo Rare VMAX', 'Psíquico', 'psa', 'swsh7/75', 19.08, 10.1],
  ['tangela-151', 'Tangela', 'Tangela Illustration Rare #178/165', 'Pokemon 151 2023', 'Illustration Rare', 'Planta', 'raw', 'sv3pt5/178', 13.96, 6.5],
  ['umbreon-vmax-evolving-skies', 'Umbreon VMAX', 'Umbreon VMAX Holo Rare #095/203', 'Evolving Skies 2021', 'Holo Rare VMAX', 'Oscuridad', 'psa', 'swsh7/95', 28.83, 15.2],
  ['venusaur-ex-151', 'Venusaur ex', 'Venusaur ex Special Illustration Rare #198/165', 'Pokemon 151 2023', 'Special Illustration Rare', 'Planta', 'psa', 'sv3pt5/198', 86.23, 15.8],
  ['zapdos-ex-151', 'Zapdos ex', 'Zapdos ex Special Illustration Rare #202/165', 'Pokemon 151 2023', 'Special Illustration Rare', 'Eléctrico', 'psa', 'sv3pt5/202', 70.67, 13.1]
].map(([id, pokemon, nombre, set, rareza, tipo, categoria, imagen, raw, rendimiento], i) => ({
  id,
  pokemon,
  nombre,
  set,
  rareza,
  tipo,
  categoria,
  tipo_discriminador: 'CARTA_INDIVIDUAL',
  tipo_item: 'CARTA_INDIVIDUAL',
  era: 'modern',
  condicionPrincipal: categoria === 'psa' ? 'psa10' : 'raw',
  certNumber: String(84921000 + i + 1),
  imagenLocal: `https://images.pokemontcg.io/${imagen}.png`,
  imagenFallbackUrl: `assets/img/cards/${id}.png`,
  precios: preciosDesdeRaw(raw),
  descripcion: `${nombre} • ${set} • ${categoria === 'psa' ? 'Disponible en Bóveda PSA' : 'Estado Near Mint verificado'}`,
  tendencia12m: `+${rendimiento.toFixed(1)}%`,
  rendimientoAnual: rendimiento,
  historialBase: [0.88, 0.89, 0.90, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00]
}));

/**
 * Productos Sellados Vintage WotC
 */
const SEALED_PRODUCTS = [
  {
    id: 'booster-team-rocket',
    nombre: 'Booster Box Team Rocket 1999 Sealed',
    set: 'Team Rocket 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Oscuridad',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291901',
    imagenLocal: 'assets/img/sealed/team-rocket-box-front.png',
    imagenFallbackUrl: 'assets/img/sealed/team-rocket-box-perspective.png',
    galeria_sellada: {
      frontal: 'assets/img/sealed/team-rocket-box-front.png',
      perspectiva: 'assets/img/sealed/team-rocket-box-perspective.png',
      lateral: 'assets/img/sealed/team-rocket-box-side.png'
    },
    detalles_sellados: {
      gramaje: '750g (Caja Completa)',
      gramaje_gramos: 750,
      cantidad_sobres_interior: 36,
      es_pesado_verificado: true,
      sellos: 'Sello oficial Wizards of the Coast termo-sellado con logo blanco',
      sello_fabrica: 'Wizards of the Coast Authentic Shrinkwrap with White Logo',
      packs: '36 Sobres de 11 Cartas c/u',
      estado: 'Sin pesar / Unweighed • Sellado de Fábrica Intacto',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: {
      raw: 3500.00,
      psa8: 3800.00,
      psa9: 4200.00,
      psa10: 5500.00,
      sealed: 3500.00
    },
    precioUnitario: 3500.00,
    descripcion: 'Display original Team Rocket 1999 de 36 sobres sellado de fábrica con celofán original Wizards of the Coast',
    tendencia12m: '+18.4%',
    rendimientoAnual: 18.4,
    historialBase: [0.82, 0.84, 0.85, 0.87, 0.89, 0.91, 0.93, 0.95, 0.96, 0.98, 0.99, 1.00]
  },
  {
    id: 'booster-box-fossil-1999',
    nombre: 'Booster Box Fossil 1999 1st Edition (36 sobres)',
    set: 'Fossil WotC 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Incoloro',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291955',
    imagenLocal: 'assets/img/sealed/booster-box-fossil-1999/perspectiva.webp',
    imagenFallbackUrl: 'assets/img/sealed/booster-box-fossil-1999/frontal.webp',
    galeria_sellada: {
      perspectiva: 'assets/img/sealed/booster-box-fossil-1999/perspectiva.webp',
      frontal: 'assets/img/sealed/booster-box-fossil-1999/frontal.webp',
      lateral: 'assets/img/sealed/booster-box-fossil-1999/lateral.webp',
      superior: 'assets/img/sealed/booster-box-fossil-1999/superior.webp'
    },
    detalles_sellados: {
      gramaje: '745g (Caja Completa)',
      gramaje_gramos: 745,
      cantidad_sobres_interior: 36,
      es_pesado_verificado: true,
      sellos: 'Sello oficial Wizards of the Coast termo-sellado con logo blanco',
      sello_fabrica: 'Wizards of the Coast Authentic Shrinkwrap with White Logo',
      packs: '36 Sobres de 11 Cartas c/u',
      estado: 'Sin pesar / Unweighed • Sellado de Fábrica Intacto',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: {
      raw: 15000.00,
      sealed: 15000.00
    },
    precioUnitario: 15000.00,
    descripcion: 'Display 1st Edition de Fossil (Wizards of the Coast, octubre de 1999): 36 sobres de 11 cartas de una expansión de 62 cartas, con celofán original de fábrica',
    tendencia12m: '+21.8%',
    rendimientoAnual: 21.8,
    historialBase: [0.82, 0.83, 0.85, 0.86, 0.88, 0.90, 0.91, 0.93, 0.95, 0.97, 0.98, 1.00]
  },
  // Booster Box con fotos de producto generadas con IA (docs/prompts-gemini-booster-box.md)
  {
    id: 'booster-box-base-1999',
    nombre: 'Booster Box Base Set 1999 1st Edition (36 sobres)',
    set: 'Base Set 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Fuego',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291960',
    imagenLocal: 'assets/img/sealed/booster-box-base-1999/perspectiva.webp',
    imagenFallbackUrl: 'assets/img/sealed/booster-box-base-1999/frontal.webp',
    galeria_sellada: {
      perspectiva: 'assets/img/sealed/booster-box-base-1999/perspectiva.webp',
      frontal: 'assets/img/sealed/booster-box-base-1999/frontal.webp',
      lateral: 'assets/img/sealed/booster-box-base-1999/lateral.webp',
      superior: 'assets/img/sealed/booster-box-base-1999/superior.webp'
    },
    detalles_sellados: {
      gramaje: '750g (Caja Completa)',
      gramaje_gramos: 750,
      cantidad_sobres_interior: 36,
      es_pesado_verificado: true,
      sellos: 'Sello oficial Wizards of the Coast termo-sellado con logo blanco',
      sello_fabrica: 'Wizards of the Coast Authentic Shrinkwrap with White Logo',
      packs: '36 Sobres de 11 Cartas c/u',
      estado: 'Sin pesar / Unweighed • Primera tirada 1st Edition',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: {
      raw: 187500.00,
      sealed: 187500.00
    },
    precioUnitario: 187500.00,
    descripcion: 'Display 1st Edition del Base Set original (Wizards of the Coast, enero de 1999): 36 sobres de 11 cartas de la primera expansión de 102 cartas, con Charizard, Blastoise y Venusaur holográficos',
    tendencia12m: '+12.5%',
    rendimientoAnual: 12.5,
    historialBase: [0.89, 0.90, 0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.99, 1.00]
  },
  {
    id: 'booster-bundle-151-2023',
    nombre: 'Pokémon 151 Booster Bundle (6 sobres)',
    set: 'Pokemon 151 2023',
    rareza: 'Sellado de Fábrica',
    tipo: 'Psíquico',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'modern',
    condicionPrincipal: 'sealed',
    certNumber: '48292153',
    imagenLocal: 'assets/img/sealed/booster-box-151-2023/perspectiva.webp',
    imagenFallbackUrl: 'assets/img/sealed/booster-box-151-2023/frontal.webp',
    galeria_sellada: {
      perspectiva: 'assets/img/sealed/booster-box-151-2023/perspectiva.webp',
      frontal: 'assets/img/sealed/booster-box-151-2023/frontal.webp',
      lateral: 'assets/img/sealed/booster-box-151-2023/lateral.webp',
      superior: 'assets/img/sealed/booster-box-151-2023/superior.webp'
    },
    detalles_sellados: {
      gramaje: '135g (Bundle Completo)',
      gramaje_gramos: 135,
      cantidad_sobres_interior: 6,
      es_pesado_verificado: true,
      sellos: 'Celofán original de The Pokémon Company International',
      sello_fabrica: 'The Pokémon Company International Factory Shrinkwrap',
      packs: '6 Sobres de 10 Cartas c/u',
      estado: 'Sellado de Fábrica Intacto',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: {
      raw: 185.00,
      sealed: 185.00
    },
    precioUnitario: 185.00,
    descripcion: 'Booster Bundle de Escarlata y Púrpura 151 (The Pokémon Company, 22 de septiembre de 2023): 6 sobres de 10 cartas de la expansión de los 151 Pokémon originales (165 cartas + 42 secretas); PVP original $26.94',
    tendencia12m: '+78.4%',
    rendimientoAnual: 78.4,
    historialBase: [0.56, 0.57, 0.58, 0.60, 0.62, 0.64, 0.68, 0.72, 0.79, 0.88, 0.96, 1.00]
  },
  // Sobres individuales: fotos de producto generadas con IA
  ...[
    {
      id: 'booster-pack-base-1999',
      nombre: 'Booster Pack Base Set 1999 1st Edition',
      set: 'Base Set 1999',
      tipo: 'Fuego',
      era: 'vintage',
      certNumber: '48291999',
      gramos: 21.2,
      cartas: 11,
      estado: 'Sin pesar / Heavy Pack Candidate • Bóveda UV',
      sello: 'Wizards of the Coast 1st Edition Foil Crimping',
      precios: { raw: 1450.00, psa8: 1750.00, psa9: 2200.00, psa10: 3600.00, sealed: 1450.00 },
      descripcion: 'Sobre individual 1999 1st Edition • Estuche magnético UV incluido',
      rendimientoAnual: 19.5,
      historialBase: [0.83, 0.85, 0.87, 0.88, 0.90, 0.91, 0.93, 0.95, 0.96, 0.98, 0.99, 1.00]
    },
    {
      id: 'booster-pack-fossil-1999',
      nombre: 'Booster Pack Fossil 1999 Unlimited',
      set: 'Fossil WotC 1999',
      tipo: 'Lucha',
      era: 'vintage',
      certNumber: '48291956',
      gramos: 21,
      cartas: 11,
      estado: 'Sin pesar • Arte de Aerodactyl',
      sello: 'Wizards of the Coast Foil Crimping',
      precios: { sealed: 180.00 },
      descripcion: 'Sobre individual Fossil 1999 de Wizards of the Coast con 11 cartas, sellado de fábrica',
      rendimientoAnual: 15.8
    },
    {
      id: 'booster-pack-team-rocket-1999',
      nombre: 'Booster Pack Team Rocket 1999 Unlimited',
      set: 'Team Rocket 1999',
      tipo: 'Oscuridad',
      era: 'vintage',
      certNumber: '48291902',
      gramos: 21,
      cartas: 11,
      estado: 'Sin pesar • Arte de Dark Charizard',
      sello: 'Wizards of the Coast Foil Crimping',
      precios: { sealed: 220.00 },
      descripcion: 'Sobre individual Team Rocket 1999 de Wizards of the Coast con 11 cartas, sellado de fábrica',
      rendimientoAnual: 17.2
    },
    {
      id: 'booster-pack-151-2023',
      nombre: 'Booster Pack Pokémon 151',
      set: 'Pokemon 151 2023',
      tipo: 'Psíquico',
      era: 'modern',
      certNumber: '48292152',
      gramos: 16,
      cartas: 10,
      estado: 'Sellado de Fábrica Intacto',
      sello: 'The Pokémon Company International Crimping',
      precios: { sealed: 9.00 },
      descripcion: 'Sobre individual de la expansión Pokémon 151 (Escarlata y Púrpura) con 10 cartas',
      rendimientoAnual: 9.4
    },
    {
      id: 'booster-pack-prismatic-evolutions-2025',
      nombre: 'Booster Pack Prismatic Evolutions',
      set: 'Prismatic Evolutions 2025',
      tipo: 'Incoloro',
      era: 'modern',
      certNumber: '48292027',
      gramos: 16,
      cartas: 10,
      estado: 'Sellado de Fábrica Intacto',
      sello: 'The Pokémon Company International Crimping',
      precios: { sealed: 14.00 },
      descripcion: 'Sobre individual de Evoluciones Prismáticas con 10 cartas y posibilidad de Eeveelutions especiales',
      rendimientoAnual: 22.7
    }
  ].map(p => ({
    id: p.id,
    edicionEspecial: true,
    nombre: p.nombre,
    set: p.set,
    rareza: 'Sellado de Fábrica',
    tipo: p.tipo,
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: p.era,
    condicionPrincipal: 'sealed',
    certNumber: p.certNumber,
    imagenLocal: `assets/img/packs/${p.id}-frontal.webp`,
    imagenFallbackUrl: 'assets/img/packs/placeholder-sobre.svg',
    galeria_sellada: {
      frontal: `assets/img/packs/${p.id}-frontal.webp`
    },
    detalles_sellados: {
      gramaje: `${p.gramos}g (Sobre Individual)`,
      gramaje_gramos: p.gramos,
      cantidad_sobres_interior: 1,
      es_pesado_verificado: true,
      sellos: `Sello de calor original ${p.era === 'vintage' ? 'Wizards of the Coast' : 'The Pokémon Company'}`,
      sello_fabrica: p.sello,
      packs: `1 Sobre de ${p.cartas} Cartas`,
      estado: p.estado,
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: p.precios.raw ? p.precios : { raw: p.precios.sealed, sealed: p.precios.sealed },
    precioUnitario: p.precios.sealed,
    descripcion: p.descripcion,
    tendencia12m: `+${p.rendimientoAnual.toFixed(1)}%`,
    rendimientoAnual: p.rendimientoAnual,
    historialBase: p.historialBase || [0.85, 0.86, 0.88, 0.89, 0.90, 0.92, 0.93, 0.95, 0.96, 0.97, 0.99, 1.00]
  })),
  ...[
    {
      id: 'upc-pokemon-151',
      nombre: 'Pokémon 151 Ultra-Premium Collection',
      set: 'Pokemon 151 2023',
      tipo: 'Psíquico',
      era: 'modern',
      certNumber: '48292151',
      gramos: 1800,
      sobres: 16,
      packs: '16 Sobres de 10 Cartas + Mew metálica + 3 promos foil',
      precio: 219.99,
      descripcion: 'Colección Ultra-Premium de Pokémon 151: 16 sobres, carta metálica de Mew ex, 3 promos foil, playmat y accesorios premium',
      rendimientoAnual: 21.6
    },
    {
      id: 'etb-prismatic-evolutions',
      nombre: 'Prismatic Evolutions Elite Trainer Box',
      set: 'Prismatic Evolutions 2025',
      tipo: 'Incoloro',
      era: 'modern',
      certNumber: '48292025',
      gramos: 950,
      sobres: 9,
      packs: '9 Sobres de 10 Cartas + promo de Eevee',
      precio: 119.99,
      descripcion: 'Elite Trainer Box de Evoluciones Prismáticas con 9 sobres, carta promo de Eevee, 65 fundas, dados y marcadores',
      rendimientoAnual: 26.3
    },
    {
      id: 'spc-charizard-ex',
      nombre: 'Charizard ex Super-Premium Collection',
      set: 'Charizard ex Collection 2024',
      tipo: 'Fuego',
      era: 'modern',
      certNumber: '48292024',
      gramos: 1200,
      sobres: 10,
      packs: '10 Sobres + 3 promos foil de Charizard',
      precio: 129.99,
      descripcion: 'Colección Super-Premium de Charizard ex: 10 sobres, 3 cartas promo foil, figura y accesorios de colección',
      rendimientoAnual: 17.9,
      conContenido: true
    },
    {
      id: 'etb-crown-zenith',
      nombre: 'Crown Zenith Elite Trainer Box',
      set: 'Crown Zenith 2023',
      tipo: 'Incoloro',
      era: 'modern',
      certNumber: '48292023',
      gramos: 950,
      sobres: 10,
      packs: '10 Sobres de 10 Cartas + promo foil',
      precio: 89.99,
      descripcion: 'Elite Trainer Box de Zenit Supremo con 10 sobres, carta promo foil, fundas y accesorios del entrenador',
      rendimientoAnual: 14.2
    },
    {
      id: 'etb-ascended-heroes',
      nombre: 'Ascended Heroes Elite Trainer Box',
      set: 'Ascended Heroes 2026',
      tipo: 'Psíquico',
      era: 'modern',
      certNumber: '48292026',
      gramos: 950,
      sobres: 9,
      packs: '9 Sobres • Expansión Mega Evolution',
      precio: 99.99,
      descripcion: 'Elite Trainer Box de Ascended Heroes (Mega Evolución 2026) con 9 sobres, promo foil, fundas y accesorios',
      rendimientoAnual: 12.5,
      conContenido: true
    }
  ].map(p => ({
    id: p.id,
    nombre: p.nombre,
    set: p.set,
    rareza: 'Edición Especial Sellada',
    tipo: p.tipo,
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: p.era,
    edicionEspecial: true,
    condicionPrincipal: 'sealed',
    certNumber: p.certNumber,
    // foto.png: foto oficial de pokemon.com · contenido.png: qué trae la caja (si existe)
    imagenLocal: `assets/img/sealed/${p.id}/foto.png`,
    imagenFallbackUrl: `assets/img/sealed/${p.id}/frontal.svg`,
    galeria_sellada: {
      perspectiva: `assets/img/sealed/${p.id}/foto.png`,
      ...(p.conContenido ? { contenido: `assets/img/sealed/${p.id}/contenido.png` } : {}),
      frontal: `assets/img/sealed/${p.id}/frontal.svg`,
      lateral: `assets/img/sealed/${p.id}/lateral.svg`,
      superior: `assets/img/sealed/${p.id}/superior.svg`
    },
    detalles_sellados: {
      gramaje: `${p.gramos}g (Caja Completa)`,
      gramaje_gramos: p.gramos,
      cantidad_sobres_interior: p.sobres,
      es_pesado_verificado: true,
      sellos: 'Celofán original de fábrica The Pokémon Company International',
      sello_fabrica: 'Factory Sealed Shrinkwrap',
      packs: p.packs,
      estado: 'Sellado de Fábrica Intacto',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: { raw: p.precio, sealed: p.precio },
    precioUnitario: p.precio,
    descripcion: p.descripcion,
    tendencia12m: `+${p.rendimientoAnual.toFixed(1)}%`,
    rendimientoAnual: p.rendimientoAnual,
    historialBase: [0.84, 0.85, 0.87, 0.88, 0.90, 0.91, 0.93, 0.94, 0.96, 0.97, 0.99, 1.00]
  }))
];

/**
 * Fixtures históricos preservados para retrocompatibilidad total con pruebas unitarias existentes
 */
const LEGACY_FIXTURE_PRODUCTS = {
  'charizard-base': {
    id: 'charizard-base',
    nombre: 'Charizard Base Set 1999 #4/102',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'Fuego',
    categoria: 'psa',
    era: 'vintage',
    condicionPrincipal: 'psa10',
    certNumber: '48291034',
    imagenLocal: 'https://images.pokemontcg.io/base1/4.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 750.00,
      psa8: 1800.00,
      psa9: 4850.00,
      psa10: 18500.00
    },
    descripcion: 'Holo Rare 1st Edition • Idioma: Inglés • Certificación Bóveda PSA',
    tendencia12m: '+21.7%',
    rendimientoAnual: 21.7,
    historialBase: [0.82, 0.84, 0.86, 0.88, 0.90, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00]
  },
  'umbreon-vmax': {
    id: 'umbreon-vmax',
    nombre: 'Umbreon VMAX Moonbreon Alt Art #215',
    set: 'Evolving Skies 2021',
    rareza: 'Secret Rare',
    tipo: 'Oscuridad',
    categoria: 'raw',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '61948201',
    imagenLocal: 'https://images.pokemontcg.io/swsh7/215.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 650.00,
      psa8: 720.00,
      psa9: 890.00,
      psa10: 1350.00
    },
    descripcion: 'Alt Art Secret Rare #215/203 • Funda UltraPro • Autenticidad Garantizada',
    tendencia12m: '+18.9%',
    rendimientoAnual: 18.9,
    historialBase: [0.84, 0.85, 0.87, 0.89, 0.90, 0.92, 0.93, 0.95, 0.96, 0.98, 0.99, 1.00]
  },
  'lugia-neo': {
    id: 'lugia-neo',
    nombre: 'Lugia 1st Edition Holo #9/111',
    set: 'Neo Genesis 2000',
    rareza: 'Holo Rare',
    tipo: 'Incoloro',
    categoria: 'psa',
    era: 'vintage',
    condicionPrincipal: 'psa10',
    certNumber: '48291088',
    imagenLocal: 'https://images.pokemontcg.io/neo1/9.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 420.00,
      psa8: 980.00,
      psa9: 1450.00,
      psa10: 4200.00
    },
    descripcion: 'Holo Rare Neo Genesis • Grado Inversión • Bóveda PSA',
    tendencia12m: '+15.4%',
    rendimientoAnual: 15.4,
    historialBase: [0.86, 0.87, 0.89, 0.90, 0.91, 0.93, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00]
  },
  'gengar-vmax': {
    id: 'gengar-vmax',
    nombre: 'Gengar VMAX Secret Rare Alt Art #271',
    set: 'Fusion Strike 2021',
    rareza: 'Secret Rare',
    tipo: 'Psíquico',
    categoria: 'psa',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '59302145',
    imagenLocal: 'https://images.pokemontcg.io/swsh8/271.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 240.00,
      psa8: 340.00,
      psa9: 460.00,
      psa10: 620.00
    },
    descripcion: 'Alt Art Secret Rare #271/264 • Idioma: Inglés • Bóveda PSA',
    tendencia12m: '+14.2%',
    rendimientoAnual: 14.2,
    historialBase: [0.87, 0.88, 0.89, 0.91, 0.92, 0.93, 0.94, 0.96, 0.97, 0.98, 0.99, 1.00]
  },
  'blastoise-shadowless': {
    id: 'blastoise-shadowless',
    nombre: 'Blastoise Shadowless Base Set 1999 #2/102',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'Agua',
    categoria: 'psa',
    era: 'vintage',
    condicionPrincipal: 'psa9',
    certNumber: '48291102',
    imagenLocal: 'https://images.pokemontcg.io/base1/2.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 380.00,
      psa8: 620.00,
      psa9: 950.00,
      psa10: 2400.00
    },
    descripcion: 'Holo Shadowless 1999 • Sin sombra de recuadro • Sello PSA oficial',
    tendencia12m: '+12.8%',
    rendimientoAnual: 12.8,
    historialBase: [0.88, 0.89, 0.90, 0.91, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00]
  },
  'rayquaza-vmax-alt': {
    id: 'rayquaza-vmax-alt',
    nombre: 'Rayquaza VMAX Alt Art #218/203',
    set: 'Evolving Skies 2021',
    rareza: 'Secret Rare',
    tipo: 'Incoloro',
    categoria: 'raw',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '74019283',
    imagenLocal: 'https://images.pokemontcg.io/swsh7/218.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 390.00,
      psa8: 440.00,
      psa9: 520.00,
      psa10: 840.00
    },
    descripcion: 'Arte Alternativo Evolving Skies • Centrado verificado 50/50 • Near Mint',
    tendencia12m: '+16.5%',
    rendimientoAnual: 16.5,
    historialBase: [0.85, 0.86, 0.88, 0.89, 0.91, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00]
  },
  'mewtwo-base-1999': {
    id: 'mewtwo-base-1999',
    nombre: 'Mewtwo Holo Base Set 1999 #10/102',
    set: 'Base Set 1999',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'psa',
    era: 'vintage',
    condicionPrincipal: 'psa9',
    certNumber: '48291409',
    imagenLocal: 'https://images.pokemontcg.io/base1/10.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 140.00,
      psa8: 290.00,
      psa9: 580.00,
      psa10: 1950.00
    },
    descripcion: 'Clásico WotC 1999 • Superficie holográfica prístina • Bóveda PSA',
    tendencia12m: '+9.8%',
    rendimientoAnual: 9.8,
    historialBase: [0.91, 0.92, 0.92, 0.93, 0.94, 0.95, 0.96, 0.97, 0.98, 0.98, 0.99, 1.00]
  },
  'tyranitar-aquapolis': {
    id: 'tyranitar-aquapolis',
    nombre: 'Shining Tyranitar Neo Destiny #113/105',
    set: 'Neo Destiny 2002',
    rareza: 'Secret Rare',
    tipo: 'Oscuridad',
    categoria: 'raw',
    era: 'vintage',
    condicionPrincipal: 'raw',
    certNumber: '48291612',
    imagenLocal: 'https://images.pokemontcg.io/neo4/113.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 490.00,
      psa8: 680.00,
      psa9: 990.00,
      psa10: 2300.00
    },
    descripcion: 'Triple Estrella Shining • Era Clásica WotC 2002 • Estado Near Mint',
    tendencia12m: '+13.6%',
    rendimientoAnual: 13.6,
    historialBase: [0.88, 0.89, 0.90, 0.91, 0.92, 0.93, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00]
  },
  'giratina-v-alt': {
    id: 'giratina-v-alt',
    nombre: 'Giratina V Alt Art Lost Origin #186/196',
    set: 'Lost Origin 2022',
    rareza: 'Secret Rare',
    tipo: 'Psíquico',
    categoria: 'psa',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '83910422',
    imagenLocal: 'https://images.pokemontcg.io/swsh11/186.png',
    imagenFallbackUrl: 'assets/img/cards/card-back.png',
    precios: {
      raw: 360.00,
      psa8: 410.00,
      psa9: 490.00,
      psa10: 780.00
    },
    descripcion: 'Ilustración de Shinji Kanda • Certificación Oficial PSA 10 Gem Mint',
    tendencia12m: '+17.3%',
    rendimientoAnual: 17.3,
    historialBase: [0.85, 0.86, 0.87, 0.89, 0.91, 0.92, 0.94, 0.95, 0.96, 0.98, 0.99, 1.00]
  }
};

/**
 * Catálogo Oficial Integrado Graded & Sealed TCG
 */
const PRODUCTS = [
  ...POKEMON_CARDS_CATALOG_10,
  ...POKEMON_CARDS_EXTRA,
  ...SEALED_PRODUCTS
];

// Ensure all products have standardized discriminators
PRODUCTS.forEach(p => {
  if (!p.tipo_discriminador) {
    p.tipo_discriminador = (p.categoria === 'sealed') ? 'PRODUCTO_SELLADO' : 'CARTA_INDIVIDUAL';
  }
  if (!p.tipo_item) {
    p.tipo_item = p.tipo_discriminador;
  }
  if (p.tipo_discriminador === 'PRODUCTO_SELLADO' || p.categoria === 'sealed') {
    if (!p.galeria_sellada) {
      p.galeria_sellada = {
        frontal: p.imagenLocal,
        perspectiva: p.imagenFallbackUrl || p.imagenLocal,
        lateral: p.imagenLocal
      };
    }
    if (!p.detalles_sellados) {
      p.detalles_sellados = {
        gramaje: '750g (Caja Completa)',
        gramaje_gramos: 750,
        cantidad_sobres_interior: 36,
        es_pesado_verificado: true,
        sellos: 'Sello oficial Wizards of the Coast termo-sellado con logo blanco',
        sello_fabrica: 'Wizards of the Coast Authentic Shrinkwrap with White Logo',
        packs: '36 Sobres de 11 Cartas c/u',
        estado: 'Sin pesar / Unweighed • Sellado de Fábrica Intacto',
        conservacion: 'Bóveda climatizada a 19°C y 45% HR'
      };
    }
    if (!p.precios.sealed) {
      p.precios.sealed = p.precioUnitario || p.precios.raw || 1000;
    }
    if (!p.precioUnitario) {
      p.precioUnitario = p.precios.sealed;
    }
  }
});

// Exportaciones para entornos globales y módulos Node
if (typeof globalThis !== 'undefined') {
  globalThis.APP_CONFIG = APP_CONFIG;
  globalThis.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10;
  globalThis.POKEMON_CARDS_EXTRA = POKEMON_CARDS_EXTRA;
  globalThis.PRECIOS_FECHA = PRECIOS_FECHA;
  globalThis.PRECIOS_FUENTE = PRECIOS_FUENTE;
  globalThis.MULTIPLICADORES_PSA = MULTIPLICADORES_PSA;
  globalThis.SEALED_PRODUCTS = SEALED_PRODUCTS;
  globalThis.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;
  globalThis.PRODUCTS = PRODUCTS;
}
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10;
  window.POKEMON_CARDS_EXTRA = POKEMON_CARDS_EXTRA;
  window.PRECIOS_FECHA = PRECIOS_FECHA;
  window.PRECIOS_FUENTE = PRECIOS_FUENTE;
  window.MULTIPLICADORES_PSA = MULTIPLICADORES_PSA;
  window.SEALED_PRODUCTS = SEALED_PRODUCTS;
  window.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;
  window.PRODUCTS = PRODUCTS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_CONFIG,
    POKEMON_CARDS_CATALOG_10,
    POKEMON_CARDS_EXTRA,
    PRECIOS_FECHA,
    PRECIOS_FUENTE,
    MULTIPLICADORES_PSA,
    SEALED_PRODUCTS,
    LEGACY_FIXTURE_PRODUCTS,
    PRODUCTS
  };
}
