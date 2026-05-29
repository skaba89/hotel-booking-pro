'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Users, Maximize, BedDouble, Wifi, AirVent, Star, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getRooms } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

function RoomsContent() {
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    capacity: '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '20' };
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.capacity) params.capacity = filters.capacity;
      if (filters.checkIn) params.checkIn = filters.checkIn;
      if (filters.checkOut) params.checkOut = filters.checkOut;

      const data = await getRooms(params);
      let roomsList = data.data || [];

      // Client-side sorting
      if (sortBy === 'price_asc') roomsList.sort((a: any, b: any) => Number(a.pricePerNight) - Number(b.pricePerNight));
      else if (sortBy === 'price_desc') roomsList.sort((a: any, b: any) => Number(b.pricePerNight) - Number(a.pricePerNight));
      else if (sortBy === 'capacity') roomsList.sort((a: any, b: any) => b.capacity - a.capacity);
      else if (sortBy === 'size') roomsList.sort((a: any, b: any) => Number(b.sizeM2) - Number(a.sizeM2));

      setRooms(roomsList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="bg-primary py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/hotel/hero-1.jpg)', backgroundSize: 'cover' }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4].map((i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">Nos Chambres & Suites</h1>
          <p className="text-white/70 max-w-xl mx-auto text-lg">
            6 catégories de chambres pour tous les styles de séjour, du confort standard au luxe absolu.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-primary"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres {showFilters ? '▲' : '▼'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); loadRooms(); }}
                className="text-sm border rounded-md px-2 py-1"
              >
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="capacity">Capacité</option>
                <option value="size">Surface</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end pt-3 border-t"
            >
              <div>
                <label className="text-xs text-muted-foreground">Arrivée</label>
                <Input
                  type="date"
                  value={filters.checkIn}
                  onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Départ</label>
                <Input
                  type="date"
                  value={filters.checkOut}
                  onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
                  min={filters.checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Voyageurs</label>
                <select
                  value={filters.capacity}
                  onChange={(e) => setFilters({ ...filters, capacity: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}+ personnes</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Budget max.</label>
                <select
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="500000">≤ 500 000 GNF</option>
                  <option value="700000">≤ 700 000 GNF</option>
                  <option value="1000000">≤ 1 000 000 GNF</option>
                  <option value="2000000">≤ 2 000 000 GNF</option>
                </select>
              </div>
              <Button variant="gold" onClick={loadRooms}>
                Rechercher
              </Button>
            </motion.div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-muted-foreground mb-4">
            {rooms.length} chambre(s) disponible(s)
          </p>
        )}

        {/* Room Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <div className="h-52 bg-gray-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <BedDouble className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Aucune chambre disponible avec ces critères.</p>
            <p className="text-sm text-muted-foreground mt-2">Essayez de modifier vos dates ou filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md">
                  {/* Room Image */}
                  <div className="h-52 relative overflow-hidden">
                    {room.images?.[0] ? (
                      <Image
                        src={room.images[0].imageUrl}
                        alt={room.images[0].altText || room.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                        <BedDouble className="w-16 h-16 text-gold/20" />
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-primary text-sm font-bold px-3 py-1.5 rounded-lg shadow">
                      {formatCurrency(Number(room.pricePerNight))}
                      <span className="text-xs font-normal text-muted-foreground">/nuit</span>
                    </div>
                    {/* Featured badge */}
                    {room.isFeatured && (
                      <div className="absolute top-3 left-3 bg-gold text-white text-xs px-2 py-1 rounded-md font-medium">
                        Populaire
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-gold transition-colors">{room.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {room.shortDescription}
                    </p>

                    {/* Room specs */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Users className="w-3.5 h-3.5" />{room.capacity} pers.
                      </span>
                      {room.sizeM2 && (
                        <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                          <Maximize className="w-3.5 h-3.5" />{Number(room.sizeM2)} m²
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <BedDouble className="w-3.5 h-3.5" />{room.bedType}
                      </span>
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Wifi className="w-3.5 h-3.5" />WiFi
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/rooms/${room.slug}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Voir détails</Button>
                      </Link>
                      <Link href={`/booking?room=${room.id}`} className="flex-1">
                        <Button variant="gold" size="sm" className="w-full">Réserver</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="h-10 w-64 bg-white/10 animate-pulse rounded mx-auto mb-3" />
            <div className="h-5 w-96 bg-white/10 animate-pulse rounded mx-auto" />
          </div>
        </section>
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <div className="h-52 bg-gray-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    }>
      <RoomsContent />
    </Suspense>
  );
}
