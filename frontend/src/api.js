/**
 * Client d'API pour communiquer avec api.php
 */

export async function apiCall(action, data = {}, method = 'POST') {
  const url = `/api.php?action=${action}`;

  try {
    let response;

    if (method === 'GET') {
      const qsData = { ...data, _t: Date.now() };
      const params = new URLSearchParams(qsData).toString();
      response = await fetch(`${url}&${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const options = {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': localStorage.getItem('pontage_csrf_token') || ''
        },
      };
      if (method === 'POST') {
        options.body = JSON.stringify(data);
      }
      response = await fetch(url, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;

  } catch (error) {
    console.error(`Erreur d'appel API [${action}]:`, error);
    return {
      success: false,
      message: "Impossible de contacter le serveur de pointage. Veuillez vérifier votre connexion locale. Détail: " + error.message
    };
  }
}
