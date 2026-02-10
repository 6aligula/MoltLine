const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL as string | undefined)
  || (import.meta.env.PROD ? 'https://auth.moldline.space' : 'http://localhost:8080');

export type AuthResult = {
  userId: string;
  name: string;
  token: string;
};

export type AuthUser = {
  userId: string;
  name: string;
};

function authUrl(path: string) {
  const base = AUTH_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function authFetch<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  headers.set('content-type', 'application/json');

  const res = await fetch(authUrl(path), { ...init, headers });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const msg = (json && (json.message || json.error)) ? (json.message || json.error) : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function login(name: string, password: string) {
  return authFetch<AuthResult>('/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
}

export async function register(name: string, password: string) {
  return authFetch<AuthResult>('/register', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  });
}

export async function listUsers(token: string) {
  return authFetch<AuthUser[]>('/users', {
    headers: { authorization: `Bearer ${token}` },
  });
}
