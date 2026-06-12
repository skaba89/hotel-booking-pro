import { MetadataRoute } from 'next';

// Regenerated hourly by Netlify CDN — no stale sitemap in Google
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hotel-setifana-conakry.netlify.app').replace(/\/$/, '');

  // Static pages — always included, no API call needed
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/rooms`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/booking`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/gallery`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/reviews`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/offers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/loyalty`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/transfers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/legal`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Dynamic room pages — fetched from API with a strict 8-second timeout.
  // If the API is cold-starting during the Netlify build, the fetch is aborted
  // before the build worker is killed, and we return only static pages.
  // The ISR revalidation (3600 s) will refresh the sitemap once Render is warm.
  let roomPages: MetadataRoute.Sitemap = [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000); // 8 s max

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005';
    const res = await fetch(`${apiUrl}/api/rooms?limit=50`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const rooms: any[] = data.data || data || [];
      roomPages = rooms.map((room) => ({
        url: `${baseUrl}/rooms/${room.slug}`,
        lastModified: new Date(room.updatedAt || room.createdAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch {
    // AbortError (timeout) or network error — static pages only, no crash
  } finally {
    clearTimeout(timer);
  }

  return [...staticPages, ...roomPages];
}
