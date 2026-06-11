import { apiCall } from './api';

export function initSettingsInterceptor() {
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  let syncTimeout = null;

  const syncToBackend = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        const settings = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('pontage_') || k.startsWith('map_selection_mode') || k.startsWith('elysium_'))) {
            // Exclure les clés de session/état
            if (!k.includes('pontage_current_service') && !k.includes('pontage_csrf_token') && !k.includes('pontage_activeSiteId') && !k.includes('pontage_activeSiteName') && !k.includes('pontage_period') && !k.includes('pontage_active_view')) {
              settings[k] = originalGetItem.call(localStorage, k);
            }
          }
        }
        await apiCall('save_user_settings', { settings });
      } catch (e) {
        console.error("Erreur sync settings:", e);
      }
    }, 2000); // Debounce 2 secondes
  };

  const isScopedKey = (key) => {
    if (!key) return false;
    if (key.startsWith('pontage_') || key.startsWith('map_selection_mode')) {
      const exclusions = [
        'pontage_current_service',
        'pontage_csrf_token',
        'pontage_activeSiteId',
        'pontage_activeSiteName',
        'pontage_period',
        'pontage_active_view'
      ];
      for (let ex of exclusions) {
        if (key.includes(ex)) return false;
      }
      return true;
    }
    return false;
  };

  Storage.prototype.getItem = function(key) {
    if (isScopedKey(key)) {
      const svc = originalGetItem.call(this, 'pontage_current_service');
      if (svc) {
        const scoped = originalGetItem.call(this, `${key}_${svc}`);
        if (scoped !== null) return scoped;
      }
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    let changed = false;
    if (isScopedKey(key)) {
      const svc = originalGetItem.call(this, 'pontage_current_service');
      if (svc) {
        originalSetItem.call(this, `${key}_${svc}`, value);
        originalSetItem.call(this, key, value);
        changed = true;
      } else {
        originalSetItem.call(this, key, value);
        changed = true;
      }
    } else {
      originalSetItem.call(this, key, value);
      if (key && (key.startsWith('pontage_') || key.startsWith('map_selection_mode') || key.startsWith('elysium_'))) {
        if (!key.includes('pontage_current_service') && !key.includes('pontage_csrf_token')) {
          changed = true;
        }
      }
    }

    if (changed) syncToBackend();
  };

  Storage.prototype.removeItem = function(key) {
    let changed = false;
    if (isScopedKey(key)) {
      const svc = originalGetItem.call(this, 'pontage_current_service');
      if (svc) {
        originalRemoveItem.call(this, `${key}_${svc}`);
        changed = true;
      }
    }
    originalRemoveItem.call(this, key);
    if (key && (key.startsWith('pontage_') || key.startsWith('map_selection_mode') || key.startsWith('elysium_'))) {
      if (!key.includes('pontage_current_service') && !key.includes('pontage_csrf_token')) {
        changed = true;
      }
    }

    if (changed) syncToBackend();
  };
}

export function restoreSettingsFromBackend(settings) {
  if (!settings || typeof settings !== 'object') return;
  for (const [k, v] of Object.entries(settings)) {
    // Si la valeur existe déjà et est identique, pas besoin de réécrire
    if (localStorage.getItem(k) !== v) {
      localStorage.setItem(k, v);
    }
  }
}
