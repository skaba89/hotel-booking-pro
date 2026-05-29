'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users, Maximize, BedDouble, Wifi, AirVent, Check, Shield,
  Star, Calendar, MapPin, Coffee, Waves, Dumbbell, Car,
  Sparkles, Clock, CreditCard, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageGallery } from '@/components/ui/image-gallery';
import { SocialProofBadge, LastBookedBadge } from '@/components/ui/social-proof';
import { useToast } from '@/components/ui/toast';
import { getRoomBySlug, getQuote } from '@/lib/api';
import { formatCurrency, calculateNights } from '@/lib/utils';

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  air_conditioning: AirVent,
  pool: Waves,
  spa: Sparkles,
  gym: Dumbbell,
  restaurant: Coffee,
  room_service: Coffee,
  breakfast: Coffee,
  parking: Car,
  sea_view: MapPin,
  balcony: MapPin,
  tv: BedDouble,
  safe: Shield,
  minibar: Coffee,
  laundry: Sparkles,
  conference: Users,
};

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi gratuit',
  air_conditioning: 'Climatisation',
  pool: 'Accès piscine',
  spa: 'Accès spa',
  gym: 'Salle de sport',
  restaurant: 'Restaurant',
  room_service: 'Room service',
  breakfast: 'Petit-déjeuner inclus',
  parking: 'Parking gratuit',
  sea_view: 'Vue sur mer',
  balcony: 'Balcon privé',
  tv: 'TV écran plat',
  safe: 'Coffre-fort',
  minibar: 'Minibar',
  laundry: 'Blanchisserie',
  conference: 'Salle de conférence',
};

export default function RoomDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    getRoomBySlug(slug).then(setRoom).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  const handleQuote = async () => {
    if (!checkIn || !checkOut || !room) return;
    setQuoteLoading(true);
    try {
      const data = await getQuote({ roomId: room.id, checkIn, checkOut, adults, children });
      setQuote(data);
    } catch (error: any) {
      toast(error.message, 'error');
    } finally {
      setQuoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="bg-primary py-12"><div className="container mx-auto px-4"><div className="h-8 w-64 bg-white/10 animate-pulse rounded" /></div></div>
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
              <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-gray-100 animate-pulse rounded" />
            </div>
            <div className="h-96 bg-gray-100 animate-pulse rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="min-h-screen flex items-center justify-center">Chambre non trouvée</div>;

  const amenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hotel-setifana-conakry.netlify.app';
  const roomImages: string[] = Array.isArray(room.images)
    ? room.images
    : typeof room.images === 'string'
      ? (() => { try { return JSON.parse(room.images); } catch { return []; } })()
      : [];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: room.name,
    description: room.description,
    url: `${siteUrl}/rooms/${slug}`,
    image: roomImages,
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
    amenityFeature: (amenities || []).map((a: string) => ({
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

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <section className="bg-primary py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-gold mb-2">
            {[1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-4 h-4 fill-gold" />
            ))}
            <span className="text-white/60 text-sm ml-2">Hotel SETIFANA</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">{room.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gold text-lg font-semibold">
              {formatCurrency(Number(room.pricePerNight))} <span className="text-white/50 text-sm font-normal">/ nuit</span>
            </p>
            <LastBookedBadge />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery images={room.images || []} roomName={room.name} />

            {/* Quick highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Capacité</p>
                  <p className="font-semibold text-sm">{room.capacity} pers.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                <Maximize className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Surface</p>
                  <p className="font-semibold text-sm">{Number(room.sizeM2)} m²</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                <BedDouble className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Literie</p>
                  <p className="font-semibold text-sm">Lit {room.bedType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Internet</p>
                  <p className="font-semibold text-sm">WiFi gratuit</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed text-base">{room.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-4">Équipements & Services</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity: string) => {
                  const Icon = amenityIcons[amenity] || Check;
                  const label = amenityLabels[amenity] || amenity.replace(/_/g, ' ');
                  return (
                    <div key={amenity} className="flex items-center gap-3 p-3 rounded-lg border hover:border-gold/30 hover:bg-gold/5 transition-colors">
                      <Icon className="w-5 h-5 text-gold flex-shrink-0" />
                      <span className="text-sm font-medium capitalize">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Policies */}
            <div className="bg-secondary/50 rounded-xl p-6">
              <h2 className="font-serif text-xl font-bold text-primary mb-4">Politique de l&apos;hôtel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Check-in</p>
                    <p className="text-muted-foreground text-sm">À partir de 14h00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Check-out</p>
                    <p className="text-muted-foreground text-sm">Avant 12h00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Annulation</p>
                    <p className="text-muted-foreground text-sm">Gratuite 48h avant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Widget */}
          <div className="space-y-4">
            <Card className="lg:sticky lg:top-24 shadow-lg border-gold/20">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Réserver</h3>
                  <span className="text-gold font-bold text-sm md:text-base">{formatCurrency(Number(room.pricePerNight))}/nuit</span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Arrivée</label>
                      <Input
                        type="date"
                        value={checkIn}
                        onChange={(e) => { setCheckIn(e.target.value); setQuote(null); }}
                        min={new Date().toISOString().split('T')[0]}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Départ</label>
                      <Input
                        type="date"
                        value={checkOut}
                        onChange={(e) => { setCheckOut(e.target.value); setQuote(null); }}
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Adultes</label>
                      <select
                        value={adults}
                        onChange={(e) => { setAdults(Number(e.target.value)); setQuote(null); }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-medium">Enfants</label>
                      <select
                        value={children}
                        onChange={(e) => { setChildren(Number(e.target.value)); setQuote(null); }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {checkIn && checkOut && nights > 0 && !quote && (
                  <Button variant="outline" className="w-full mb-4" onClick={handleQuote} disabled={quoteLoading}>
                    {quoteLoading ? 'Calcul en cours...' : `Voir le prix pour ${nights} nuit(s)`}
                  </Button>
                )}

                {quote && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-secondary rounded-lg p-4 mb-4 space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span>{quote.nights} nuit(s) x {formatCurrency(quote.pricePerNight)}</span>
                      <span>{formatCurrency(quote.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxes (18%)</span>
                      <span>{formatCurrency(quote.taxesAmount)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Réduction</span>
                        <span>-{formatCurrency(quote.discountAmount)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-gold">{formatCurrency(quote.totalAmount)}</span>
                    </div>
                  </motion.div>
                )}

                <Link href={`/booking?room=${room.id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${children}`}>
                  <Button variant="gold" size="lg" className="w-full text-base">
                    Réserver maintenant
                  </Button>
                </Link>

                {/* Trust badges */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Annulation gratuite jusqu&apos;à 48h avant</span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <a href="https://wa.me/224666057620" target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">
                      Assistance 24h/24 via WhatsApp
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <SocialProofBadge roomId={room.id} />
          </div>

          {/* Mobile Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t shadow-2xl p-3 z-40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-gold font-bold text-lg">{formatCurrency(Number(room.pricePerNight))}</p>
                <p className="text-xs text-muted-foreground">par nuit</p>
              </div>
              <Link href={`/booking?room=${room.id}`} className="flex-1 max-w-[200px]">
                <Button variant="gold" className="w-full">
                  Réserver
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
