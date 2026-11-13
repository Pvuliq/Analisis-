const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
const AUTH_API_BASE_URL = window.AUTH_API_BASE_URL || 'http://localhost:8081';

export function repairMojibake(value) {
  const text = String(value ?? '');
  if (!/[ÃÂâ]/.test(text)) return text;

  try {
    const bytes = Uint8Array.from(text, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

function normalizeEncoding(value) {
  if (typeof value === 'string') return repairMojibake(value);
  if (Array.isArray(value)) return value.map(normalizeEncoding);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeEncoding(item)])
    );
  }
  return value;
}

export function apiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

export function getAuthToken() {
  return sessionStorage.getItem('authToken');
}

function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const responseData = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  const data = normalizeEncoding(responseData);

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.message;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function apiRequest(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(),
      ...options.headers
    }
  });
  return parseResponse(response);
}

export async function authRequest(endpoint, options = {}) {
  const response = await fetch(`${AUTH_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return parseResponse(response);
}

export function authGet(endpoint, options = {}) {
  return authRequest(endpoint, { ...options, method: 'GET' });
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

export function postFile(endpoint, formData, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: formData
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
