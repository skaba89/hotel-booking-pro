'use client';

/**
 * RoomImage
 * Wrapper autour de Next.js <Image> qui gère les erreurs de chargement.
 *
 * Cas d'usage typique : les images stockées sur le disque éphémère de Render
 * (chemins /uploads/...) disparaissent à chaque redéploiement.
 * Ce composant affiche un placeholder propre au lieu d'une image cassée.
 */

import { useState } from 'react';
import Image from 'next/image';
import { BedDouble } from 'lucide-react';

const FALLBACK_SRCS = [
  '/images/rooms/room-1.webp',
  '/images/rooms/chambre-standard-1.jpg',
];

interface RoomImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Classe CSS appliquée au conteneur placeholder en cas d'erreur */
  placeholderClassName?: string;
}

export function RoomImage({
  src,
  alt,
  sizes,
  priority,
  className,
  placeholderClassName,
}: RoomImageProps) {
  // Si aucune image fournie, commencer directement avec le premier fallback
  const initialSrc = src || FALLBACK_SRCS[0];
  const initialFallbackIndex = src ? 0 : 1;

  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [fallbackIndex, setFallbackIndex] = useState(initialFallbackIndex);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (fallbackIndex < FALLBACK_SRCS.length) {
      setCurrentSrc(FALLBACK_SRCS[fallbackIndex]);
      setFallbackIndex((i) => i + 1);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div
        className={
          placeholderClassName ??
          'w-full h-full bg-primary/10 flex items-center justify-center'
        }
      >
        <BedDouble className="w-16 h-16 text-gold/30" />
      </div>
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'}
      priority={priority}
      className={className}
      onError={handleError}
    />
  );
}
