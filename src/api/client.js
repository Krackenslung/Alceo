// Thin fetch wrapper for the Flask API. Errors arrive as {"error": {"code", "message"}}.
const BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'alceo:token';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {
      code: 'http_error',
      message: res.status >= 500 ? 'Cannot reach the server. Is the backend running?' : `Request failed (${res.status})`,
    };
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, err.code, err.message);
  }
  return data;
}

export const post = (path, body = {}) => api(path, { method: 'POST', body });
export const patch = (path, body) => api(path, { method: 'PATCH', body });
export const put = (path, body) => api(path, { method: 'PUT', body });
export const del = (path) => api(path, { method: 'DELETE' });
