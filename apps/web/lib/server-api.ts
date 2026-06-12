/**
 * server-api.ts — API helpers for Server Components only.
 *
 * These functions use the native fetch() with Next.js `next.revalidate` option,
 * which enables ISR (Incremental Static Regeneration):
 *  - The rendered page is cached on Netlify's CDN.
 *  - After `revalidate` seconds, Netlify background-refreshes the cache.
 *  - Users always get a pre-rendered response from CDN — no Render cold-start on load.
 *
 * DO NOT import from 'lib/api.ts' (ApiClient) here — that class reads localStorage
 * and uses relative URLs which are not available on the server.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';

/**
 * Generic server fetch with ISR cache, graceful fallback, AND a hard timeout.
 *
 * The 8-second timeout prevents the Netlify build worker from hanging when
 * Render is cold-starting during the build. After the deadline the function
 * returns `fallback` so pages are still pre-rendered (just without live data).
 * The ISR revalidation will refresh the pages once Render is warm.
 */
async function serverFetch<T>(
  path: string,
  revalidate: number,
  fallback: T,
  timeoutMs = 8_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}/api${path}`, {
      signal: controller.signal,
      next: { revalidate },
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    // AbortError (timeout) or any network error → return fallback silently
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch rooms with optional query params — cached for 60 s. */
export async function serverGetRooms(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const path = `/rooms${qs ? `?${qs}` : ''}`;
  return serverFetch<{ data: any[]; total: number }>(path, 60, { data: [], total: 0 });
}

/** Fetch featured rooms — cached for 120 s. */
export async function serverGetFeaturedRooms(): Promise<any[]> {
  return serverFetch<any[]>('/rooms/featured', 120, []);
}

/** Fetch public settings — cached for 300 s. */
export async function serverGetPublicSettings(): Promise<Record<string, string>> {
  return serverFetch<Record<string, string>>('/settings/public', 300, {});
}

/** Fetch a single room by slug — cached for 300 s. */
export async function serverGetRoom(slug: string): Promise<any | null> {
  return serverFetch<any | null>(`/rooms/${slug}`, 300, null);
}
