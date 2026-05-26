/**
 * Client d'API pour communiquer avec api.php
 */

export async function apiCall(action, data = {}, method = 'POST') {
  const url = `/api.php?action=${action}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'POST') {
    options.body = JSON.stringify(data);
  } else if (method === 'GET' && Object.keys(data).length > 0) {
    // Si méthode GET, ajouter les paramètres en query string (au cas où)
    const params = new URLSearchParams(data).toString();
    return fetch(`${url}&${params}`, { headers: { 'Content-Type': 'application/json' } })
      .then(res => res.json())
      .catch(err => {
        console.error(`Erreur API GET ${action}:`, err);
        return { success: false, message: "Erreur de connexion au serveur" };
      });
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Erreur d'appel API [${action}]:`, error);
    return {
      success: false,
      message: "Impossible de contacter le serveur de pointage. Veuillez vérifier votre connexion locale."
    };
  }
}
