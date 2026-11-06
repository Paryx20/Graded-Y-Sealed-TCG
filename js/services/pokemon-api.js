/**
 * ==============================================================================
 * PokemonAPI - Dual Search API with 3-Tier Automatic Failover Cascade
 * File: js/services/pokemon-api.js
 * 
 * Cascade Architecture:
 *   - Tier 1: pokemontcg.io (Primary Source, 4-second AbortController timeout)
 *   - Tier 2: tcgdex.net (Secondary Backup Source, 4-second AbortController timeout)
 *   - Tier 3: In-Memory Local Vault Catalog (Offline Fallback from PRODUCTS)
 * 
 * Standard Normalized Card Format:
 *   {
 *     id: string,
 *     nombre: string,
 *     set: string,
 *     rareza: string,
 *     imagen: string,
 *     precioEstimado: number,
 *     fuente: 'pokemontcg.io' | 'tcgdex.net' | 'local-vault'
 *   }
 * ==============================================================================
 */

class PokemonAPI {
  constructor(localCatalog = null) {
    this.localCatalog = localCatalog;
    this.primaryUrl = 'https://api.pokemontcg.io/v2/cards';
    this.secondaryUrl = 'https://api.tcgdex.net/v2/en/cards';
    this.timeoutMs = 4000;
    this.debounceMs = 400;
    this._debounceTimer = null;
    this._pendingResolve = null;
  }

  /**
   * Performs 3-tier cascade search: Primary -> Backup -> Offline Local
   * @param {string} query - Search term
   * @param {object} [options={}] - Mock / test options (failPrimary, failSecondary, primaryData, secondaryData, localCatalog)
   * @returns {Promise<Array>} Normalized card objects
   */
  async searchCards(query, options = {}) {
    const q = (query || '').trim();
    if (!q) return [];

    // --------------------------------------------------------------------------
    // TIER 1: pokemontcg.io (Primary Source)
    // --------------------------------------------------------------------------
    try {
      if (options.failPrimary) {
        throw new Error('Primary source failure simulation (failPrimary=true)');
      }

      if (options.primaryData) {
        return this._normalizePrimaryResults(options.primaryData);
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let timer = null;
      if (controller) {
        timer = setTimeout(() => controller.abort(), this.timeoutMs);
      }

      const endpoint = `${this.primaryUrl}?q=name:*${encodeURIComponent(q)}*&pageSize=12`;
      const fetchOpts = {
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'application/json' }
      };

      const res = await fetch(endpoint, fetchOpts);
      if (timer) clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Primary API (pokemontcg.io) responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        return this._normalizePrimaryResults(json.data);
      }
    } catch (errPrimary) {
      console.warn('[PokemonAPI] Primary source (pokemontcg.io) failed, switching to backup (tcgdex.net)...', errPrimary.message || errPrimary);
    }

    // --------------------------------------------------------------------------
    // TIER 2: tcgdex.net (Secondary Backup Source)
    // --------------------------------------------------------------------------
    try {
      if (options.failSecondary) {
        throw new Error('Secondary source failure simulation (failSecondary=true)');
      }

      if (options.secondaryData) {
        return this._normalizeSecondaryResults(options.secondaryData);
      }

      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      let timer = null;
      if (controller) {
        timer = setTimeout(() => controller.abort(), this.timeoutMs);
      }

      const endpoint = `${this.secondaryUrl}?name=${encodeURIComponent(q)}`;
      const fetchOpts = {
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'application/json' }
      };

      const res = await fetch(endpoint, fetchOpts);
      if (timer) clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`Secondary API (tcgdex.net) responded with HTTP ${res.status}`);
      }

      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return this._normalizeSecondaryResults(json);
      }
    } catch (errSecondary) {
      console.warn('[PokemonAPI] Backup source (tcgdex.net) failed, falling back to local vault catalogue...', errSecondary.message || errSecondary);
    }

    // --------------------------------------------------------------------------
    // TIER 3: Local Vault Catalogue (Offline Fallback)
    // --------------------------------------------------------------------------
    return this._searchLocalCatalog(q, options);
  }

  // Precio de mercado real informado por la API (TCGplayer o Cardmarket); null si no hay dato
  marketPriceOf(c) {
    if (!c) return null;
    const tp = (c.tcgplayer && c.tcgplayer.prices) || {};
    const tcg = ['holofoil', 'normal', 'reverseHolofoil', '1stEditionHolofoil', 'unlimitedHolofoil']
      .map(k => tp[k] && tp[k].market).find(v => Number(v) > 0);
    if (tcg) return { valor: Math.round(Number(tcg) * 100) / 100, fuente: 'TCGplayer', fecha: (c.tcgplayer && c.tcgplayer.updatedAt) || null };
    const cmPrices = c.cardmarket && c.cardmarket.prices;
    const cm = cmPrices && (cmPrices.trendPrice || cmPrices.averageSellPrice);
    if (Number(cm) > 0) return { valor: Math.round(Number(cm) * 100) / 100, fuente: 'Cardmarket', moneda: 'EUR', fecha: (c.cardmarket && c.cardmarket.updatedAt) || null };
    const pr = c.pricing && c.pricing.tcgplayer;
    const tcgdex = pr && ['holofoil', 'normal', 'reverse-holofoil', 'reverseHolofoil'].map(k => pr[k] && pr[k].marketPrice).find(v => Number(v) > 0);
    if (Number(tcgdex) > 0) return { valor: Math.round(Number(tcgdex) * 100) / 100, fuente: 'TCGplayer', fecha: String(pr.updated || '').slice(0, 10) || null };
    const cmx = c.pricing && c.pricing.cardmarket;
    const cmv = cmx && (cmx.trend || cmx.avg);
    if (Number(cmv) > 0) return { valor: Math.round(Number(cmv) * 100) / 100, fuente: 'Cardmarket', moneda: cmx.unit || 'EUR', fecha: String(cmx.updated || '').slice(0, 10) || null };
    return null;
  }

  calculateRealisticPrice(c) {
    if (!c) return 25.00;

    // 1. Direct API Market Data Check
    const marketPrice = 
      c.cardmarket?.prices?.averageSellPrice ||
      c.cardmarket?.prices?.trendPrice ||
      c.tcgplayer?.prices?.holofoil?.market ||
      c.tcgplayer?.prices?.normal?.market ||
      c.tcgplayer?.prices?.reverseHolofoil?.market ||
      c.pricing?.tcgplayer?.holofoil?.marketPrice ||
      c.pricing?.tcgplayer?.normal?.marketPrice ||
      c.pricing?.cardmarket?.avg ||
      (c.precioEstimado && Number(c.precioEstimado) !== 15 ? c.precioEstimado : null);

    if (marketPrice && !isNaN(Number(marketPrice)) && Number(marketPrice) > 0) {
      return Math.round(Number(marketPrice) * 100) / 100;
    }

    // 2. Rarity Base Value
    const r = (c.rarity || c.rareza || '').toLowerCase();
    let base = 12.00;
    if (r.includes('secret') || r.includes('secreta') || r.includes('rainbow') || r.includes('hyper') || r.includes('alt art')) {
      base = 110.00;
    } else if (r.includes('illustration') || r.includes('especial') || r.includes('special')) {
      base = 85.00;
    } else if (r.includes('ultra') || r.includes('vmax') || r.includes('vstar') || r.includes(' ex') || r.includes(' gx')) {
      base = 48.00;
    } else if (r.includes('holo') || r.includes('radiant') || r.includes('brillante')) {
      base = 24.00;
    } else if (r.includes('promo')) {
      base = 18.00;
    } else if (r.includes('rare') || r.includes('rara')) {
      base = 12.00;
    } else if (r.includes('uncommon') || r.includes('poco')) {
      base = 4.50;
    } else if (r.includes('common') || r.includes('comun') || r.includes('común')) {
      base = 2.50;
    }

    // 3. Vintage Era Multiplier
    const setAndId = `${c.set?.name || c.set || ''} ${c.id || ''}`.toLowerCase();
    let eraMultiplier = 1.0;
    if (/base|jungle|fossil|rocket|gym|neo|expedition|aquapolis|skyridge|1999|2000|2001|2002|wotc/i.test(setAndId)) {
      eraMultiplier = 4.5;
    } else if (/ruby|sapphire|emerald|ex|diamond|pearl|platinum|hgss|heartgold|soulsilver/i.test(setAndId)) {
      eraMultiplier = 2.5;
    } else if (/black|white|plasma|xy|evolutions/i.test(setAndId)) {
      eraMultiplier = 1.6;
    } else if (/sun|moon|gx/i.test(setAndId)) {
      eraMultiplier = 1.2;
    }

    // 4. Keyword Popularity Multiplier (Star Power)
    const name = (c.name || c.nombre || '').toLowerCase();
    let popMultiplier = 1.0;
    if (/charizard/i.test(name)) {
      popMultiplier = 3.2;
    } else if (/umbreon|lugia|rayquaza|gengar|mewtwo|pikachu/i.test(name)) {
      popMultiplier = 2.2;
    } else if (/mew|blastoise|venusaur|eevee|espeon|dragonite|gyarados/i.test(name)) {
      popMultiplier = 1.6;
    } else if (/zapdos|moltres|articuno|suicune|raikou|entei|tyranitar|lucario|gardevoir/i.test(name)) {
      popMultiplier = 1.3;
    }

    // 5. Deterministic ID Hash Variance (Natural ±15% distribution)
    const cardId = String(c.id || name);
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      hash = ((hash << 5) - hash) + cardId.charCodeAt(i);
      hash |= 0;
    }
    const variance = 0.85 + ((Math.abs(hash) % 31) / 100);

    const calculated = base * eraMultiplier * popMultiplier * variance;
    return Math.round(calculated * 100) / 100;
  }

  _normalizePrimaryResults(cards) {
    if (!Array.isArray(cards)) return [];
    return cards.map(c => ({
      id: String(c.id || ''),
      nombre: c.name || 'Sin Nombre',
      set: c.set?.name || 'Expansion',
      rareza: c.rarity || 'Coleccionable',
      imagen: c.images?.small || c.images?.large || 'assets/img/cards/card-back.png',
      precioEstimado: this.calculateRealisticPrice(c),
      precioMercado: this.marketPriceOf(c),
      fuente: 'pokemontcg.io'
    }));
  }

  _normalizeSecondaryResults(cards) {
    if (!Array.isArray(cards)) return [];

    // Sort cards with artwork first
    const sorted = [...cards].sort((a, b) => {
      const aHasImg = Boolean(a.image);
      const bHasImg = Boolean(b.image);
      if (aHasImg && !bHasImg) return -1;
      if (!aHasImg && bHasImg) return 1;
      return 0;
    });

    return sorted.slice(0, 12).map(c => {
      let img = 'assets/img/cards/card-back.png';
      if (c.image) {
        img = (c.image.endsWith('.webp') || c.image.endsWith('.png') || c.image.endsWith('.jpg'))
          ? c.image
          : `${c.image}/high.webp`;
      }
      return {
        id: String(c.id || ''),
        nombre: c.name || 'Sin Nombre',
        set: c.set?.name || 'TCG Set',
        rareza: c.rarity || 'Rare',
        imagen: img,
        precioEstimado: this.calculateRealisticPrice(c),
        precioMercado: this.marketPriceOf(c),
        fuente: 'tcgdex.net'
      };
    });
  }

  _searchLocalCatalog(query, options = {}) {
    const qLower = query.toLowerCase();
    const catalog = options.localCatalog || this.localCatalog || (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);

    const localList = catalog.filter(p => {
      const inNombre = p.nombre && p.nombre.toLowerCase().includes(qLower);
      const inSet = p.set && p.set.toLowerCase().includes(qLower);
      const inTipo = p.tipo && p.tipo.toLowerCase().includes(qLower);
      const inRareza = p.rareza && p.rareza.toLowerCase().includes(qLower);
      return inNombre || inSet || inTipo || inRareza;
    });

    return localList.map(p => ({
      id: String(p.id || ''),
      nombre: p.nombre || 'Pieza de Bóveda',
      set: p.set || 'Bóveda Local',
      rareza: p.rareza || 'Vault Asset',
      imagen: p.imagenLocal || p.imagenFallbackUrl || 'assets/img/cards/card-back.png',
      precioEstimado: p.precios
        ? (p.precios.psa10 || p.precios.raw || 50.00)
        : 50.00,
      fuente: 'local-vault'
    }));
  }

  /**
   * Debounces user keystrokes by 400ms before triggering cascade search
   * @param {string} query
   * @param {Function} callback
   * @param {object} [options={}]
   * @returns {Promise<Array>}
   */
  debounceSearch(query, callback, options = {}) {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      if (this._pendingResolve) {
        this._pendingResolve({ cancelled: true });
      }
    }

    return new Promise((resolve) => {
      this._pendingResolve = resolve;
      this._debounceTimer = setTimeout(async () => {
        this._pendingResolve = null;
        const results = await this.searchCards(query, options);
        if (typeof callback === 'function') callback(results);
        resolve(results);
      }, this.debounceMs);
    });
  }

  // Static singleton methods for direct PokemonAPI.searchCards() usage
  static get instance() {
    if (!this._instance) {
      this._instance = new PokemonAPI();
    }
    return this._instance;
  }

  static searchCards(query, options) {
    return this.instance.searchCards(query, options);
  }

  static debounceSearch(query, callback, options) {
    return this.instance.debounceSearch(query, callback, options);
  }

  // El listado de TCGdex no trae precios: se piden al abrir el detalle de una carta
  static async fetchMarketPrice(card) {
    if (!card || card.fuente !== 'tcgdex.net' || !card.id || typeof fetch === 'undefined') return null;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    try {
      const res = await fetch(`${this.instance.secondaryUrl}/${encodeURIComponent(card.id)}`, {
        signal: controller ? controller.signal : undefined,
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) return null;
      return this.instance.marketPriceOf(await res.json());
    } catch (err) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

if (typeof window !== 'undefined') {
  window.PokemonAPI = PokemonAPI;
}
if (typeof globalThis !== 'undefined') {
  globalThis.PokemonAPI = PokemonAPI;
}
