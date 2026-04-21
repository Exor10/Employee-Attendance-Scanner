(function (window) {
  'use strict';

  const BASE_URL = window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL;

  async function parseBodySafe(response) {
    const text = await response.text();
    if (!text) return { data: {}, rawText: '' };

    try {
      return { data: JSON.parse(text), rawText: text };
    } catch (_error) {
      return { data: null, rawText: text };
    }
  }

  function backendMessage(payload) {
    if (!payload || typeof payload !== 'object') return '';
    return payload.message || payload.error || payload.reason || '';
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
      throw new Error('Network request failed. Check your internet connection and backend availability.');
    }

    const parsed = await parseBodySafe(response);
    const data = parsed.data;

    if (!response.ok) {
      throw new Error(
        backendMessage(data) ||
          (parsed.rawText ? `Backend request failed (${response.status}). ${parsed.rawText}` : `Backend request failed (${response.status}).`)
      );
    }

    if (data === null) {
      throw new Error('The server returned an unexpected response format. Please try again.');
    }

    const successFlag = data && data.success;
    const statusFlag = String((data && data.status) || '').toLowerCase();
    if (successFlag === false || statusFlag === 'error' || statusFlag === 'failed') {
      throw new Error(backendMessage(data) || 'The server rejected the request.');
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
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload || {})
      }
    );
  }

  window.AppApi = { get, post };
})(window);
