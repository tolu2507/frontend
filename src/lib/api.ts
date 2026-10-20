'use client';

import { brand } from '@/config/brand';
import { useAuth, type Session } from './auth';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function refresh(): Promise<boolean> {
  const { refreshToken, signIn, clear } = useAuth.getState();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${brand.apiUrl}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
    if (!res.ok) throw new Error();
    signIn((await res.json()) as Session);
    return true;
  } catch {
    clear();
    return false;
  }
}

/** Calls the BrainBox API. Refreshes an expired session once, then replays. Errors become one readable sentence. */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const { accessToken, schoolId } = useAuth.getState();
  let res: Response;
  try {
    res = await fetch(`${brand.apiUrl}${path}`, {
      method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(schoolId ? { 'x-school-id': schoolId } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(`We can't reach BrainBox. Check your internet connection${process.env.NODE_ENV === 'development' ? ` (is the API running at ${brand.apiUrl}?)` : ''}.`, 0);
  }
  if (res.status === 401 && !retried && !path.startsWith('/auth/')) {
    refreshing ??= refresh().finally(() => (refreshing = null));
    if (await refreshing) return api<T>(path, init, true);
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const m = (data as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(m) ? m[0] : m;
    throw new ApiError(message || (res.status >= 500 ? 'Something went wrong on our side. Please try again.' : 'That didn’t work. Please try again.'), res.status);
  }
  return data as T;
}

export const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');
