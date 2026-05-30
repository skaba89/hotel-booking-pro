import type { Metadata } from 'next';
import { getRoomBySlug } from '@/lib/api';
import { RoomDetailClient, amenityLabels } from './room-detail-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotel-setifana-conakry.netlify.app';

// Données fraîches à chaque requête (prix/dispo peuvent changer côté admin).
export const dynamic = 'force-dynamic';

async function fetchRoom(slug: string): Promise<any | null> {
  try {
    return await getRoomBySlug(slug);
  } catch {
    return null;
  }
}

function parseAmenities(room: any): string[] {
  if (Array.isArray(room?.amenities)) return room.amenities;
  if (typeof room?.amenities === 'string') {
    try { return JSON.parse(room.amenities); } catch { return []; }
  }
  return [];
}

function parseImages(room: any): string[] {
  if (Array.isArray(room?.images)) {
    // images peut être un tableau d'objets {imageUrl} ou de chaînes
    return room.images.map((im: any) => (typeof im === 'string' ? im : im?.imageUrl)).filter(Boolean);
  }
  if (typeof room?.images === 'string') {
    try {
      const arr = JSON.parse(room.images);
      return Array.isArray(arr) ? arr.map((im: any) => (typeof im === 'string' ? im : im?.imageUrl)).filter(Boolean) : [];
    } catch { return []; }
  }
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const room = await fetchRoom(params.slug);
  if (!room) {
    return { title: 'Chambre non trouvée — Hotel SETIFANA' };
  }
  const title = `${room.name} — Hotel SETIFANA Conakry`;
  const description = (room.description || '').slice(0, 160);
  const images = parseImages(room);
  const url = `${siteUrl}/rooms/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: images.length ? images.slice(0, 1) : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.length ? images.slice(0, 1) : undefined,
    },
  };
}

export default async function RoomDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const room = await fetchRoom(slug);

  let jsonLd: Record<string, any> | null = null;
  if (room) {
    const amenities = parseAmenities(room);
    const images = parseImages(room);
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'HotelRoom',
      name: room.name,
      description: room.description,
      url: `${siteUrl}/rooms/${slug}`,
      image: images,
      occupancy: {
        '@type': 'QuantitativeValue',
        maxValue: room.capacity,
        unitText: 'person',
      },
      floorSize: {
        '@type': 'QuantitativeValue',
        value: Number(room.sizeM2),
        unitCode: 'MTK',
      },
      bed: { '@type': 'BedDetails', typeOfBed: room.bedType },
      amenityFeature: amenities.map((a: string) => ({
        '@type': 'LocationFeatureSpecification',
        name: amenityLabels[a] || a.replace(/_/g, ' '),
        value: true,
      })),
      containedInPlace: {
        '@type': 'Hotel',
        name: 'Hotel SETIFANA',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Conakry',
          addressCountry: 'GN',
        },
      },
      offers: {
        '@type': 'Offer',
        price: Number(room.pricePerNight),
        priceCurrency: 'GNF',
        availability: 'https://schema.org/InStock',
        url: `${siteUrl}/rooms/${slug}`,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RoomDetailClient slug={slug} initialRoom={room} />
    </>
  );
}
