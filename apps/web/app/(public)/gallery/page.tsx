'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronLeft, ChevronRight, X, Star } from 'lucide-react';

const galleryImages = [
  { src: '/images/hotel/hero-main.jpg', alt: 'Vue extérieure de l\'hôtel', category: 'Extérieur' },
  { src: '/images/hotel/exterior-1.jpg', alt: 'Façade principale', category: 'Extérieur' },
  { src: '/images/hotel/exterior-2.jpg', alt: 'Entrée de l\'hôtel', category: 'Extérieur' },
  { src: '/images/hotel/pool-1.jpg', alt: 'Piscine extérieure', category: 'Piscine' },
  { src: '/images/hotel/lobby-1.jpg', alt: 'Lobby de l\'hôtel', category: 'Intérieur' },
  { src: '/images/hotel/restaurant-1.jpg', alt: 'Restaurant gastronomique', category: 'Restaurant' },
  { src: '/images/hotel/facilities-1.jpg', alt: 'Installations', category: 'Intérieur' },
  { src: '/images/rooms/chambre-standard-1.jpg', alt: 'Chambre Standard', category: 'Chambres' },
  { src: '/images/rooms/chambre-standard-2.jpg', alt: 'Chambre Standard - détail', category: 'Chambres' },
  { src: '/images/rooms/chambre-superieure-1.jpg', alt: 'Chambre Supérieure', category: 'Chambres' },
  { src: '/images/rooms/chambre-superieure-2.jpg', alt: 'Chambre Supérieure - détail', category: 'Chambres' },
  { src: '/images/rooms/suite-junior-1.jpg', alt: 'Suite Junior', category: 'Suites' },
  { src: '/images/rooms/suite-junior-2.jpg', alt: 'Suite Junior - salon', category: 'Suites' },
  { src: '/images/rooms/suite-presidentielle-1.jpg', alt: 'Suite Présidentielle', category: 'Suites' },
  { src: '/images/rooms/suite-presidentielle-2.jpg', alt: 'Suite Présidentielle - luxe', category: 'Suites' },
  { src: '/images/rooms/chambre-familiale-1.jpg', alt: 'Chambre Familiale', category: 'Chambres' },
  { src: '/images/rooms/chambre-business-1.jpg', alt: 'Chambre Business', category: 'Chambres' },
  { src: '/images/services/piscine.jpg', alt: 'Piscine - vue d\'ensemble', category: 'Piscine' },
  { src: '/images/services/restaurant.jpg', alt: 'Restaurant - ambiance', category: 'Restaurant' },
  { src: '/images/services/spa.jpg', alt: 'Espace Spa', category: 'Spa' },
  { src: '/images/services/conference.jpg', alt: 'Salle de conférence', category: 'Conférence' },
  { src: '/images/services/gym.jpg', alt: 'Salle de sport', category: 'Sport' },
];

const categories = ['Tout', 'Extérieur', 'Chambres', 'Suites', 'Piscine', 'Restaurant', 'Spa', 'Intérieur'];

export default function GalleryPage() {
  const [filter, setFilter] = useState('Tout');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const filtered = filter === 'Tout'
    ? galleryImages
    : galleryImages.filter((img) => img.category === filter);

  const openLightbox = (index: number) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);
  const nextImage = useCallback(() => setLightbox((prev) => prev !== null ? (prev + 1) % filtered.length : null), [filtered.length]);
  const prevImage = useCallback(() => setLightbox((prev) => prev !== null ? (prev - 1 + filtered.length) % filtered.length : null), [filtered.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightbox === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox, nextImage, prevImage]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hotel/hero-1.jpg)', backgroundSize: 'cover' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">Notre Galerie</h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg">
            Découvrez l&apos;Hotel SETIFANA en images : nos chambres, nos espaces et nos services.
          </p>
          <p className="text-white/50 text-sm mt-2">{galleryImages.length} photos</p>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => {
            const count = cat === 'Tout' ? galleryImages.length : galleryImages.filter(img => img.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => { setFilter(cat); setLightbox(null); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === cat
                    ? 'bg-gold text-white shadow-md shadow-gold/20'
                    : 'bg-secondary text-muted-foreground hover:bg-gold/10 hover:text-gold'
                }`}
              >
                {cat} <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {filtered.map((img, index) => (
              <motion.div
                key={img.src}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className="relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                  <p className="text-white text-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    {img.alt}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label="Visionneuse d'images"
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button aria-label="Fermer la visionneuse" className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={closeLightbox}>
              <X className="w-8 h-8" />
            </button>
            <div className="absolute top-4 left-4 text-white/70 text-sm">
              {lightbox + 1} / {filtered.length}
            </div>
            <button
              aria-label="Image precedente"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-h-[85vh] max-w-[90vw] w-full h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filtered[lightbox].src}
                alt={filtered[lightbox].alt}
                fill
                className="object-contain rounded-lg"
                sizes="90vw"
                priority
              />
            </motion.div>
            <button
              aria-label="Image suivante"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {filtered[lightbox].alt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
