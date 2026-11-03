const APP_CONFIG = {
  TAX_RATE: 0.15,
  QUITO_SHIPPING_FEE: 3.00,
  COURIER_SHIPPING_FEE: 5.00,
  PICKUP_SHIPPING_FEE: 0.00,
};

/**
 * Catálogo Principal de 10 Cartas Pokémon a Precios Normales de Mercado Real ($5.00 a $80.00 USD)
 * Requisito R6 / Fase 8: Eliminación de precios especulativos inflados.
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
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh12pt5/160_hires.png',
    precios: {
      raw: 12.00,
      psa8: 18.00,
      psa9: 24.00,
      psa10: 48.00
    },
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
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv4pt5/54_hires.png',
    precios: {
      raw: 10.00,
      psa8: 16.00,
      psa9: 22.00,
      psa10: 45.00
    },
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
    imagenLocal: 'img/umbreon-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv6/188_hires.png',
    precios: {
      raw: 38.00,
      psa8: 45.00,
      psa9: 55.00,
      psa10: 78.00
    },
    descripcion: 'Eevee Arte Especial • Mascarada Crepuscular • Near Mint Verificado',
    tendencia12m: '+15.8%',
    rendimientoAnual: 15.8,
    historialBase: [0.85, 0.87, 0.89, 0.90, 0.92, 0.94, 0.95, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'gengar-scarlet-violet',
    nombre: 'Gengar Holo Rare #057/198',
    set: 'Scarlet & Violet 2023',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'raw',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '84920114',
    imagenLocal: 'assets/img/cards/gengar-holo-scarlet.png',
    imagenFallbackUrl: 'assets/img/cards/gengar-holo-scarlet.png',
    precios: {
      raw: 5.00,
      psa8: 9.00,
      psa9: 14.00,
      psa10: 28.00
    },
    descripcion: 'Gengar Holo Rare #057/198 • Escarlata y Púrpura • Funda Protectora',
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
    imagenLocal: 'img/blastoise-shadowless.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv6/106_hires.png',
    precios: {
      raw: 8.50,
      psa8: 14.00,
      psa9: 20.00,
      psa10: 38.00
    },
    descripcion: 'Greninja ex Mascarada Crepuscular 2024 • Certificación PSA 10 GEM MT',
    tendencia12m: '+16.2%',
    rendimientoAnual: 16.2,
    historialBase: [0.86, 0.88, 0.90, 0.92, 0.93, 0.95, 0.96, 0.98, 0.99, 0.99, 1.00, 1.00]
  },
  {
    id: 'mimikyu-paldean',
    nombre: 'Mimikyu Baby Shiny #097/091',
    set: 'Paldean Fates 2024',
    rareza: 'Shiny Rare',
    tipo: 'Psíquico',
    categoria: 'raw',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'raw',
    certNumber: '84920116',
    imagenLocal: 'assets/img/cards/mimikyu-rare.png',
    imagenFallbackUrl: 'assets/img/cards/mimikyu-rare.png',
    precios: {
      raw: 14.00,
      psa8: 20.00,
      psa9: 28.00,
      psa10: 52.00
    },
    descripcion: 'Mimikyu Shiny Holo • Destinos de Paldea • Estado Near Mint',
    tendencia12m: '+12.7%',
    rendimientoAnual: 12.7,
    historialBase: [0.87, 0.89, 0.91, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  },
  {
    id: 'mewtwo-151',
    nombre: 'Mewtwo Holo Rare #059/165',
    set: 'Pokemon 151 2023',
    rareza: 'Holo Rare',
    tipo: 'Psíquico',
    categoria: 'psa',
    tipo_discriminador: 'CARTA_INDIVIDUAL',
    tipo_item: 'CARTA_INDIVIDUAL',
    era: 'modern',
    condicionPrincipal: 'psa10',
    certNumber: '84920117',
    imagenLocal: 'assets/img/cards/mewto-holo-rare.png',
    imagenFallbackUrl: 'assets/img/cards/mewto-holo-rare.png',
    precios: {
      raw: 6.00,
      psa8: 11.00,
      psa9: 16.00,
      psa10: 32.00
    },
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
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swshp/SWSH291_hires.png',
    precios: {
      raw: 7.00,
      psa8: 12.00,
      psa9: 18.00,
      psa10: 36.00
    },
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
    imagenLocal: 'assets/img/cards/raichu-gx.png',
    imagenFallbackUrl: 'assets/img/cards/raichu-gx.png',
    precios: {
      raw: 6.50,
      psa8: 12.00,
      psa9: 18.00,
      psa10: 35.00
    },
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
    imagenLocal: 'img/blastoise-shadowless.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/sv3pt5/9_hires.png',
    precios: {
      raw: 8.00,
      psa8: 14.00,
      psa9: 20.00,
      psa10: 42.00
    },
    descripcion: 'Blastoise ex #009/165 • Pokémon 151 • Bóveda PSA oficial',
    tendencia12m: '+12.3%',
    rendimientoAnual: 12.3,
    historialBase: [0.88, 0.89, 0.91, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98, 0.99, 1.00, 1.00]
  }
];

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
    nombre: 'Caja Sellada Booster Box Fossil 1999 (36 Packs)',
    set: 'Fossil WotC 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Incoloro',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291955',
    imagenLocal: 'assets/img/sealed/paquete-fossil.png',
    imagenFallbackUrl: 'assets/img/sealed/paquete-fossil.png',
    galeria_sellada: {
      perspectiva: 'assets/img/sealed/paquete-fossil.png',
      frontal: 'assets/img/sealed/booster-box-fossil-1999/frontal.svg',
      lateral: 'assets/img/sealed/booster-box-fossil-1999/lateral.svg',
      superior: 'assets/img/sealed/booster-box-fossil-1999/superior.svg'
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
      raw: 8400.00,
      psa8: 8900.00,
      psa9: 9600.00,
      psa10: 12500.00,
      sealed: 8400.00
    },
    precioUnitario: 8400.00,
    descripcion: 'Display original de 36 sobres con celofán de fábrica Wizards of the Coast',
    tendencia12m: '+24.1%',
    rendimientoAnual: 24.1,
    historialBase: [0.80, 0.82, 0.84, 0.86, 0.88, 0.90, 0.92, 0.94, 0.96, 0.97, 0.99, 1.00]
  },
  {
    id: 'booster-pack-base-1999',
    edicionEspecial: true,
    nombre: 'Booster Pack Base Set 1999 1st Edition',
    set: 'Base Set 1999',
    rareza: 'Sellado de Fábrica',
    tipo: 'Fuego',
    categoria: 'sealed',
    tipo_discriminador: 'PRODUCTO_SELLADO',
    tipo_item: 'PRODUCTO_SELLADO',
    era: 'vintage',
    condicionPrincipal: 'sealed',
    certNumber: '48291999',
    imagenLocal: 'assets/img/packs/booster-team-rocket.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    galeria_sellada: {
      frontal: 'assets/img/packs/booster-team-rocket.png',
      perspectiva: 'assets/img/packs/booster-team-rocket.png',
      lateral: 'assets/img/packs/booster-team-rocket.png'
    },
    detalles_sellados: {
      gramaje: '21.2g (Sobre Individual)',
      gramaje_gramos: 21.2,
      cantidad_sobres_interior: 1,
      es_pesado_verificado: true,
      sellos: 'Sello de calor original Wizards of the Coast 1999',
      sello_fabrica: 'Wizards of the Coast 1st Edition Foil Crimping',
      packs: '1 Sobre de 11 Cartas',
      estado: 'Sin pesar / Heavy Pack Candidate • Bóveda UV',
      conservacion: 'Bóveda climatizada a 19°C y 45% HR'
    },
    precios: {
      raw: 1450.00,
      psa8: 1750.00,
      psa9: 2200.00,
      psa10: 3600.00,
      sealed: 1450.00
    },
    precioUnitario: 1450.00,
    descripcion: 'Sobre individual 1999 1st Edition • Estuche magnético UV incluido',
    tendencia12m: '+19.5%',
    rendimientoAnual: 19.5,
    historialBase: [0.83, 0.85, 0.87, 0.88, 0.90, 0.91, 0.93, 0.95, 0.96, 0.98, 0.99, 1.00]
  },
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
    imagenLocal: 'img/charizard-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
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
    imagenLocal: 'img/umbreon-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
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
    imagenLocal: 'img/lugia-neo.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/neo1/9_hires.png',
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
    imagenLocal: 'img/gengar-vmax.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh8/271_hires.png',
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
    imagenLocal: 'img/blastoise-shadowless.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
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
    imagenLocal: 'img/rayquaza-gold-star.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh7/218_hires.png',
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
    imagenLocal: 'img/mewtwo-base.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/base1/10_hires.png',
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
    imagenLocal: 'img/tyranitar-neo.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/neo4/113_hires.png',
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
    imagenLocal: 'img/giratina-v.png',
    imagenFallbackUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
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
  globalThis.SEALED_PRODUCTS = SEALED_PRODUCTS;
  globalThis.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;
  globalThis.PRODUCTS = PRODUCTS;
}
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  window.POKEMON_CARDS_CATALOG_10 = POKEMON_CARDS_CATALOG_10;
  window.SEALED_PRODUCTS = SEALED_PRODUCTS;
  window.LEGACY_FIXTURE_PRODUCTS = LEGACY_FIXTURE_PRODUCTS;
  window.PRODUCTS = PRODUCTS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_CONFIG,
    POKEMON_CARDS_CATALOG_10,
    SEALED_PRODUCTS,
    LEGACY_FIXTURE_PRODUCTS,
    PRODUCTS
  };
}
