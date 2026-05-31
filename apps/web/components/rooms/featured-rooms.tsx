'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Maximize, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getFeaturedRooms } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/provider';
import { RoomImage } from '@/components/rooms/room-image';

export function FeaturedRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    getFeaturedRooms().then(setRooms).catch(console.error);
  }, []);

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-3">
            {t('rooms.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('rooms.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-56 bg-muted overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                  <RoomImage
                    src={room.images?.[0]?.imageUrl || ''}
                    alt={room.images?.[0]?.altText || room.name}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="bg-gold text-white text-xs px-2 py-1 rounded">
                      {t('rooms.from')} {formatCurrency(Number(room.pricePerNight))}{t('rooms.night')}
                    </span>
                  </div>
                  {room.isFeatured && (
                    <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur text-gold text-xs px-2 py-1 rounded font-medium">
                      ★ {t('rooms.popular')}
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg text-primary mb-2">{room.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {room.shortDescription}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {room.capacity} {t('rooms.capacity')}
                    </span>
                    {room.sizeM2 && (
                      <span className="flex items-center">
                        <Maximize className="w-4 h-4 mr-1" />
                        {Number(room.sizeM2)} m²
                      </span>
                    )}
                    {room.bedType && (
                      <span className="flex items-center">
                        <BedDouble className="w-4 h-4 mr-1" />
                        {room.bedType}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/rooms/${room.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        {t('rooms.details')}
                      </Button>
                    </Link>
                    <Link href={`/booking?room=${room.id}`} className="flex-1">
                      <Button variant="gold" size="sm" className="w-full">
                        {t('rooms.book')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('general.loading')}</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/rooms">
            <Button variant="outline" size="lg">
              {t('general.viewAll')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
