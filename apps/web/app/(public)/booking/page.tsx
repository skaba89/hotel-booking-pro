'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, User, CreditCard, Check, ArrowRight, ArrowLeft, BedDouble, Users, Maximize, Shield, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getRooms, getQuote, createBooking } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    roomId: searchParams.get('room') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    adults: 2,
    children: 0,
    fullName: '',
    email: '',
    phone: '',
    specialRequest: '',
  });

  useEffect(() => {
    setLoadingRooms(true);
    getRooms({ limit: '50' })
      .then((data) => setRooms(data.data || []))
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  }, []);

  const selectedRoom = rooms.find((r) => r.id === form.roomId);

  const handleGetQuote = async () => {
    if (!form.roomId || !form.checkIn || !form.checkOut) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await getQuote({
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: form.adults,
        children: form.children,
      });
      setQuote(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.fullName || !form.email) {
      setError('Veuillez remplir votre nom et email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const booking = await createBooking(form);
      router.push(`/payment/${booking.bookingReference}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Chambre', icon: CalendarDays },
    { num: 2, label: 'Infos', icon: User },
    { num: 3, label: 'Paiement', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <section className="bg-primary py-10 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white">Réserver votre séjour</h1>
          <p className="text-white/70 mt-2 text-sm md:text-base">Simple, rapide et sécurisé</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-6 md:mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center space-x-1.5 px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${step >= s.num ? 'bg-gold text-white' : 'bg-white text-muted-foreground'}`}>
                {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                <span>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 md:w-8 h-0.5 mx-1.5 md:mx-2 ${step > s.num ? 'bg-gold' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Dates & Room Selection */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="p-4 md:p-6 space-y-5">
                  <h2 className="font-semibold text-lg">Choisissez vos dates et votre chambre</h2>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Arrivée *</label>
                      <Input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Départ *</label>
                      <Input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} min={form.checkIn} />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1">Adultes</label>
                      <select value={form.adults} onChange={(e) => setForm({ ...form, adults: Number(e.target.value) })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Enfants</label>
                      <select value={form.children} onChange={(e) => setForm({ ...form, children: Number(e.target.value) })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Room Selection - Visual Cards */}
                  <div>
                    <label className="text-sm font-medium block mb-2">Chambre *</label>
                    {loadingRooms ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
                        ))}
                      </div>
                    ) : rooms.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <BedDouble className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune chambre disponible</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                        {rooms.map((room) => (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => setForm({ ...form, roomId: room.id })}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              form.roomId === room.id
                                ? 'border-gold bg-gold/5 shadow-sm'
                                : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                          >
                            {/* Room thumbnail */}
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                              {room.images?.[0] ? (
                                <Image src={room.images[0].imageUrl} alt={room.name} fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BedDouble className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Room info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h4 className="font-semibold text-sm truncate">{room.name}</h4>
                                {form.roomId === room.id && (
                                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-1">
                                <span className="flex items-center gap-0.5">
                                  <Users className="w-3 h-3" />{room.capacity}
                                </span>
                                {room.sizeM2 && (
                                  <span className="flex items-center gap-0.5">
                                    <Maximize className="w-3 h-3" />{Number(room.sizeM2)}m²
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <BedDouble className="w-3 h-3" />{room.bedType}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-gold">
                                {formatCurrency(Number(room.pricePerNight))}<span className="text-xs font-normal text-muted-foreground">/nuit</span>
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button variant="gold" size="lg" className="w-full" onClick={handleGetQuote} disabled={loading || !form.roomId}>
                    {loading ? 'Vérification...' : 'Continuer'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <h2 className="font-semibold text-lg">Vos informations</h2>

                  {/* Selected room summary */}
                  {selectedRoom && (
                    <div className="flex items-center gap-3 p-3 bg-gold/5 border border-gold/20 rounded-xl">
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                        {selectedRoom.images?.[0] ? (
                          <Image src={selectedRoom.images[0].imageUrl} alt={selectedRoom.name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><BedDouble className="w-5 h-5 text-gray-300" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{selectedRoom.name}</p>
                        <p className="text-xs text-muted-foreground">{form.checkIn} → {form.checkOut}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium block mb-1">Nom complet *</label>
                    <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Email *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jean@exemple.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Téléphone</label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+224 6XX XXX XXX" />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Demandes spéciales</label>
                    <textarea value={form.specialRequest} onChange={(e) => setForm({ ...form, specialRequest: e.target.value })} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ex: chambre avec vue, lit bébé..." />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-shrink-0">
                      <ArrowLeft className="w-4 h-4 mr-1" />Retour
                    </Button>
                    <Button variant="gold" size="lg" className="flex-1" onClick={() => { if (!form.fullName || !form.email) { setError('Veuillez remplir nom et email'); return; } setError(''); setStep(3); }}>
                      Continuer <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <h2 className="font-semibold text-lg">Récapitulatif</h2>

                  {quote && (
                    <div className="bg-secondary rounded-xl p-4 space-y-2">
                      <p className="font-medium">{quote.roomName}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Arrivée : {new Date(quote.checkIn).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p>Départ : {new Date(quote.checkOut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p>{quote.nights} nuit(s) • {form.adults} adulte(s){form.children > 0 ? ` • ${form.children} enfant(s)` : ''}</p>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between text-sm"><span>Hébergement</span><span>{formatCurrency(quote.baseAmount)}</span></div>
                      <div className="flex justify-between text-sm"><span>Taxes</span><span>{formatCurrency(quote.taxesAmount)}</span></div>
                      {quote.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600"><span>Réduction</span><span>-{formatCurrency(quote.discountAmount)}</span></div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-gold">{formatCurrency(quote.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-secondary rounded-xl p-4">
                    <p className="font-medium mb-1">Client</p>
                    <p className="text-sm text-muted-foreground">{form.fullName}</p>
                    <p className="text-sm text-muted-foreground">{form.email}</p>
                    {form.phone && <p className="text-sm text-muted-foreground">{form.phone}</p>}
                  </div>

                  {/* Trust badges */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-green-500" />Paiement sécurisé</span>
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-blue-500" />Annulation gratuite 48h</span>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-shrink-0">
                      <ArrowLeft className="w-4 h-4 mr-1" />Retour
                    </Button>
                    <Button variant="gold" size="lg" className="flex-1" onClick={handleSubmit} disabled={loading}>
                      {loading ? 'Création...' : 'Confirmer et payer'}
                      <CreditCard className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Help */}
              <div className="text-center mt-4">
                <a href="tel:+224666057620" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
                  <Phone className="w-4 h-4" />
                  Besoin d&apos;aide ? +224 666 05 76 20
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <section className="bg-primary py-10">
          <div className="container mx-auto px-4 text-center">
            <div className="h-8 w-48 bg-white/10 animate-pulse rounded mx-auto" />
          </div>
        </section>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <div className="h-6 w-40 bg-gray-100 animate-pulse rounded" />
            <div className="h-48 bg-gray-100 animate-pulse rounded-xl" />
            <div className="h-10 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
