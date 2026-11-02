/**
 * Graded & Sealed TCG — Supabase Configuration (Fase 8)
 * Configuración cliente para PostgreSQL en la nube con fallback local.
 */
(function (global) {
  'use strict';

  var getEnv = function (key) {
    if (typeof window !== 'undefined' && window.__ENV && window.__ENV[key]) {
      return window.__ENV[key];
    }
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    try {
      if (typeof localStorage !== 'undefined') {
        var stored = localStorage.getItem('gstcg_' + key.toLowerCase());
        if (stored) return stored;
      }
    } catch (e) {
      // Ignorar restricciones de almacenamiento local
    }
    return '';
  };

  var SUPABASE_URL = getEnv('SUPABASE_URL') || '';
  var SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || '';

  var clientInstance = null;

  var SupabaseConfig = {
    SUPABASE_CONFIG: {
      url: SUPABASE_URL,
      anonKey: SUPABASE_ANON_KEY
    },

    isConfigured: function () {
      var url = this.SUPABASE_CONFIG.url || '';
      var key = this.SUPABASE_CONFIG.anonKey || '';

      if (!url || !key) return false;
      if (url.indexOf('TU-PROYECTO') !== -1 || url.indexOf('YOUR-PROJECT') !== -1 || url.indexOf('example') !== -1) {
        return false;
      }
      return url.startsWith('https://') && url.includes('.supabase.co') && key.length > 20;
    },

    getClient: function () {
      if (!this.isConfigured()) {
        return null;
      }
      if (clientInstance) {
        return clientInstance;
      }

      var supabaseLib = null;
      if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseLib = window.supabase;
      } else if (typeof globalThis !== 'undefined' && globalThis.supabase && typeof globalThis.supabase.createClient === 'function') {
        supabaseLib = globalThis.supabase;
      }

      if (supabaseLib) {
        try {
          clientInstance = supabaseLib.createClient(this.SUPABASE_CONFIG.url, this.SUPABASE_CONFIG.anonKey);
          return clientInstance;
        } catch (err) {
          console.warn('[SupabaseConfig] Error al inicializar cliente Supabase:', err);
          return null;
        }
      }
      return null;
    },

    resetClient: function () {
      clientInstance = null;
    }
  };

  global.SupabaseConfig = SupabaseConfig;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
