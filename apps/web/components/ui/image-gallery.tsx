'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, BedDouble } from 'lucide-react';

const FALLBACK = '/images/rooms/room-1.webp';

function SafeImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
        <BedDouble className="w-12 h-12 text-gold/30" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => {
        if (imgSrc !== FALLBACK) {
          setImgSrc(FALLBACK);
        } else {
          setBroken(true);
        }
      }}
    />
  );
}

interface ImageGalleryProps {
  images: { id: string; imageUrl: string; altText: string }[];
  roomName: string;
}

export function ImageGallery({ images, roomName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const next = () => setCurrentIndex((i) => (i + 1) % images.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <>
      {/* Main Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
        {/* Main large image */}
        <div
          className="md:col-span-2 relative h-72 md:h-96 cursor-pointer group"
          onClick={() => { setCurrentIndex(0); setLightboxOpen(true); }}
        >
          <SafeImage
            src={images[0].imageUrl}
            alt={images[0].altText || roomName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Side images */}
        <div className="hidden md:grid grid-rows-2 gap-2">
          {images.slice(1, 3).map((img, i) => (
            <div
              key={img.id}
              className="relative h-[calc(12rem-0.25rem)] md:h-[calc(12rem-0.25rem)] cursor-pointer group"
              onClick={() => { setCurrentIndex(i + 1); setLightboxOpen(true); }}
            >
              <SafeImage
                src={img.imageUrl}
                alt={img.altText || roomName}
                fill
                className="object-cover"
                sizes="33vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {i === 1 && images.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">+{images.length - 3} photos</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Previous */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              src={images[currentIndex].imageUrl}
              alt={images[currentIndex].altText}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
            />

            {/* Next */}
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                    i === currentIndex ? 'border-gold' : 'border-transparent opacity-60'
                  }`}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
