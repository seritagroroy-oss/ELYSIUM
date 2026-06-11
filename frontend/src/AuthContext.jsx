import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiCall } from './api';
import { restoreSettingsFromBackend } from './settingsPrefs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('fr');

  const refreshUser = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiCall('get_user_info', {}, 'GET');
      if (res.success && res.user) {
        setUser(res.user);
        setSubscription(res.subscription);
        if (res.user.service) {
          localStorage.setItem('pontage_current_service', res.user.service);
        }
        if (res.csrf_token) {
          localStorage.setItem('pontage_csrf_token', res.csrf_token);
        }
        if (res.user.settings) {
          restoreSettingsFromBackend(res.user.settings);
        }
      } else {
        setUser(null);
        setSubscription(null);
        localStorage.removeItem('pontage_current_service');
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de la session :", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await apiCall('login', { email, password });
      if (res.success) {
        localStorage.removeItem('pontage_activeSiteId');
        localStorage.removeItem('pontage_activeSiteName');
        localStorage.removeItem('pontage_period');
        if (res.csrf_token) {
          localStorage.setItem('pontage_csrf_token', res.csrf_token);
        }
        await refreshUser();
        return { success: true, subscription: res.subscription };
      }
      return { success: false, message: res.message || "Erreur de connexion" };
    } catch (e) {
      return { success: false, message: "Erreur réseau" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await apiCall('logout');
      if (res.success) {
        localStorage.removeItem('pontage_activeSiteId');
        localStorage.removeItem('pontage_activeSiteName');
        localStorage.removeItem('pontage_period');
        localStorage.removeItem('pontage_current_service');
        setUser(null);
        setSubscription(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const register = async (service_name, email, name, password) => {
    setLoading(true);
    try {
      const res = await apiCall('register', { service_name, email, name, password });
      if (res.success) {
        await refreshUser();
        return { success: true, subscription: res.subscription };
      }
      return { success: false, message: res.message || "Erreur d'inscription" };
    } catch (e) {
      return { success: false, message: "Erreur réseau" };
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (newLang) => {
    try {
      const res = await apiCall('set_lang', { lang: newLang });
      if (res.success) {
        setLang(newLang);
        // On pourrait recharger des libellés de traduction ici si nécessaire
      }
    } catch (e) {
      console.error("Erreur langue:", e);
    }
  };

  const hasPermission = (moduleName) => {
    // Si c'est un super_admin, accès total. Pour un admin, accès total SAUF s'il est de l'espace RH.
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin' && user?.workspace_type !== 'RH') return true;
    
    if (!user?.permissions) return false;
    
    // Si c'est un tableau (ancien format)
    if (Array.isArray(user.permissions)) return user.permissions.includes(moduleName);
    
    // Si c'est un objet — accepter toute valeur non-false/non-none (read, write, true...)
    const val = user.permissions[moduleName];
    if (val && val !== false && val !== 'none') return true;
    
    return Object.values(user.permissions).includes(moduleName);
  };

  const hasWritePermission = (moduleName) => {
    if (user?.role === 'super_admin') return true;
    if (user?.role === 'admin' && user?.workspace_type !== 'RH') return true;
    
    if (!user?.permissions) return false;
    
    // Si c'est un tableau, l'ancien format donne un accès total (write)
    if (Array.isArray(user.permissions)) return user.permissions.includes(moduleName);
    
    // Si c'est un objet
    return user.permissions[moduleName] === 'write' || user.permissions[moduleName] === true || user.permissions[moduleName] === 'approver_3';
  };

  return (
    <AuthContext.Provider value={{
      user,
      subscription,
      loading,
      lang,
      login,
      logout,
      register,
      changeLanguage,
      refreshUser,
      hasPermission,
      hasWritePermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
