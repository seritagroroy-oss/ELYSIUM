/**
 * Client d'API pour communiquer avec api.php
 */

export async function apiCall(action, data = {}, method = 'POST', signal = null) {
  const url = `/api.php?action=${action}`;

  try {
    let response;

    if (method === 'GET') {
      const qsData = { ...data, _t: Date.now() };
      const params = new URLSearchParams(qsData).toString();
      response = await fetch(`${url}&${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...(signal ? { signal } : {})
      });
    } else {
      const options = {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': localStorage.getItem('pontage_csrf_token') || ''
        },
        ...(signal ? { signal } : {})
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
    // Si la requête a été annulée intentionnellement, on retourne silencieusement
    if (error.name === 'AbortError') {
      return { success: true, aborted: true };
    }
    console.error(`Erreur d'appel API [${action}]:`, error);
    return {
      success: false,
      message: "Impossible de contacter le serveur de pointage. Veuillez vérifier votre connexion locale. Détail: " + error.message
    };
  }
}
