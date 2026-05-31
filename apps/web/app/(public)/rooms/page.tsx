/**
 * /rooms — Incremental Static Regeneration (ISR)
 *
 * Next.js pre-renders this page at build time with real rooms data.
 * Netlify CDN serves the cached HTML instantly to every user.
 * The cache is stale-revalidated every 60 seconds in the background.
 *
 * Result: users see rooms immediately — no skeleton, no Render cold-start wait.
 */

import type { Metadata } from 'next';
import { serverGetRooms } from '@/lib/server-api';
import { RoomsClient } from './rooms-client';

export const revalidate = 60; // ISR: refresh cache every 60 s

export const metadata: Metadata = {
  title: 'Chambres & Suites | Hotel SETIFANA',
  description:
    "Découvrez nos chambres et suites luxueuses à Conakry. Standard, Deluxe, Suite, Penthouse — réservez votre séjour à l'Hôtel SETIFANA.",
};

interface Props {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; capacity?: string }>;
}

export default async function RoomsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params: Record<string, string> = { limit: '20' };
  if (sp?.checkIn) params.checkIn = sp.checkIn;
  if (sp?.checkOut) params.checkOut = sp.checkOut;
  if (sp?.capacity) params.capacity = sp.capacity;

  // Fetch server-side — pre-rendered into HTML at build / revalidate time
  const { data: initialRooms = [] } = await serverGetRooms(params);

  return (
    <RoomsClient
      initialRooms={initialRooms}
      initialCheckIn={sp?.checkIn ?? ''}
      initialCheckOut={sp?.checkOut ?? ''}
    />
  );
}
