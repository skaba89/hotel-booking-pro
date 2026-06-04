'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Building, Shield, Loader2, FlaskConical, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { getBookingByReference, createStripeSession, payAtHotel, initiateMobileMoney } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true';

const STRIPE_TEST_CARDS = [
  { label: 'Visa (succès)', number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123' },
  { label: 'Mastercard (succès)', number: '5555 5555 5555 4444', expiry: '12/29', cvc: '123' },
  { label: '3D Secure requis', number: '4000 0027 6000 3184', expiry: '12/29', cvc: '123' },
  { label: 'Paiement refusé', number: '4000 0000 0000 9995', expiry: '12/29', cvc: '123' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-1 p-0.5 rounded hover:bg-yellow-200 transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-yellow-700" />}
    </button>
  );
}

function StripeTestCards() {
  return (
    <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 text-yellow-800 font-semibold text-sm">
        <FlaskConical className="w-4 h-4" />
        Mode test — Cartes Stripe virtuelles
      </div>
      <div className="space-y-2">
        {STRIPE_TEST_CARDS.map((c) => (
          <div key={c.number} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-white rounded-md px-3 py-2 border border-yellow-200 gap-1">
            <span className="text-gray-500 font-medium">{c.label}</span>
            <div className="flex items-center gap-1 font-mono text-gray-800">
              <span className="break-all">{c.number}</span>
              <CopyButton text={c.number} />
            </div>
            <span className="text-gray-400">{c.expiry} / {c.cvc}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-yellow-700">Nom : n&apos;importe lequel — ZIP : 00000</p>
    </div>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reference = params.bookingReference as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileProvider, setMobileProvider] = useState('orange_money');

  useEffect(() => {
    getBookingByReference(reference)
      .then(setBooking)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [reference, router]);

  const handleStripe = async () => {
    setProcessing(true);
    try {
      const { url } = await createStripeSession(reference);
      if (url) window.location.href = url;
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayAtHotel = async () => {
    setProcessing(true);
    try {
      await payAtHotel(reference);
      router.push(`/confirmation/${reference}`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleMobileMoney = async () => {
    if (!mobilePhone) { toast('Entrez votre numéro de téléphone', 'error'); return; }
    setProcessing(true);
    try {
      await initiateMobileMoney({ bookingReference: reference, provider: mobileProvider, phoneNumber: mobilePhone });
      toast('Un paiement a été initié sur votre téléphone. Veuillez confirmer.', 'success');
      router.push(`/confirmation/${reference}`);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!booking) return null;

  if (booking.paymentStatus === 'PAID') {
    router.push(`/confirmation/${reference}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-white">Paiement</h1>
          <p className="text-white/70 mt-2">Réservation {reference}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Choisissez votre mode de paiement</h2>

                <div className="space-y-3">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${paymentMethod === 'stripe' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}
                  >
                    <CreditCard className="w-6 h-6 text-gold" />
                    <div className="text-left">
                      <p className="font-medium">Carte bancaire</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, etc.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('mobile')}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${paymentMethod === 'mobile' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}
                  >
                    <Smartphone className="w-6 h-6 text-gold" />
                    <div className="text-left">
                      <p className="font-medium">Mobile Money</p>
                      <p className="text-xs text-muted-foreground">Orange Money, MTN, Wave</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('hotel')}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${paymentMethod === 'hotel' ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}
                  >
                    <Building className="w-6 h-6 text-gold" />
                    <div className="text-left">
                      <p className="font-medium">Payer à l&apos;hôtel</p>
                      <p className="text-xs text-muted-foreground">À l&apos;arrivée</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'mobile' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
                    <select
                      value={mobileProvider}
                      onChange={(e) => setMobileProvider(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="orange_money">Orange Money</option>
                      <option value="mtn_money">MTN Mobile Money</option>
                      <option value="wave">Wave</option>
                    </select>
                    <Input
                      placeholder="Numéro de téléphone"
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                    />
                  </motion.div>
                )}

                {paymentMethod === 'stripe' && TEST_MODE && <StripeTestCards />}

                <div className="mt-6">
                  {paymentMethod === 'stripe' && (
                    <Button variant="gold" size="lg" className="w-full" onClick={handleStripe} disabled={processing}>
                      {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <CreditCard className="mr-2 w-4 h-4" />}
                      Payer par carte
                    </Button>
                  )}
                  {paymentMethod === 'mobile' && (
                    <Button variant="gold" size="lg" className="w-full" onClick={handleMobileMoney} disabled={processing}>
                      {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Smartphone className="mr-2 w-4 h-4" />}
                      Payer via Mobile Money
                    </Button>
                  )}
                  {paymentMethod === 'hotel' && (
                    <Button variant="gold" size="lg" className="w-full" onClick={handlePayAtHotel} disabled={processing}>
                      {processing ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : <Building className="mr-2 w-4 h-4" />}
                      Confirmer - Paiement à l&apos;hôtel
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex items-center text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 mr-1" />
                  Paiement 100% sécurisé et chiffré
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Résumé</h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">{booking.room?.name}</p>
                  <p className="text-muted-foreground">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p>
                  <p className="text-muted-foreground">{booking.nights} nuit(s)</p>
                  <p className="text-muted-foreground">{booking.adults} adulte(s), {booking.children} enfant(s)</p>
                  <hr className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-gold">{formatCurrency(Number(booking.totalAmount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
