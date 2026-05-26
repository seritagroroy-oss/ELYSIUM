import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiCall } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('fr');

  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get_user_info', {}, 'GET');
      if (res.success && res.user) {
        setUser(res.user);
        setSubscription(res.subscription);
      } else {
        setUser(null);
        setSubscription(null);
      }
    } catch (e) {
      console.error("Erreur lors de la récupération de la session :", e);
    } finally {
      setLoading(false);
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
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
