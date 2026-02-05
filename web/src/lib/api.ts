const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  || (import.meta.env.PROD ? 'https://api.moldline.space' : undefined);

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_API_BASE_URL; set it in .env (see .env.example)');
}

export function apiUrl(path: string) {
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit & { userId?: string }) {
  const userId = (init as any)?.userId as string | undefined;
  const headers = new Headers(init?.headers || {});
  headers.set('content-type', 'application/json');
  if (userId) headers.set('x-user-id', userId);

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}
