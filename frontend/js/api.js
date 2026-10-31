const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

export function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

export function post(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function put(endpoint, body, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function remove(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}
