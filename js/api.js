(function (window) {
  'use strict';

  const BASE_URL = window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL;

  async function parseJsonSafe(response) {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch (_error) {
      throw new Error('The server returned an unreadable response.');
    }
  }

  async function request(pathParams, options) {
    if (!BASE_URL) {
      throw new Error('Missing API base URL configuration.');
    }

    const url = new URL(BASE_URL);
    Object.entries(pathParams || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    let response;
    try {
      response = await fetch(url.toString(), options);
    } catch (_networkError) {
      throw new Error('Network request failed. Check your internet or backend availability.');
    }

    const data = await parseJsonSafe(response);

    if (!response.ok) {
      const message = (data && (data.message || data.error)) || 'Request failed.';
      throw new Error(message);
    }

    return data;
  }

  async function get(action, params) {
    return request({ action, ...(params || {}) }, { method: 'GET' });
  }

  async function post(payload) {
    return request(
      {},
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload || {})
      }
    );
  }

  window.AppApi = { get, post };
})(window);
