'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, MessageCircle, Calendar, CreditCard, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getBookingByReference, api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const TEST_MODE = process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true';

export default function ConfirmationPage() {
  const params = useParams();
  const reference = params.bookingReference as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simMsg, setSimMsg] = useState('');

  const loadBooking = () =>
    getBookingByReference(reference).then(setBooking).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { loadBooking(); }, [reference]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSimulateMobileMoney = async () => {
    setSimulating(true);
    setSimMsg('');
    try {
      const res = await api.post<{ message: string }>('/payments/mobile-money/simulate', { bookingReference: reference });
      setSimMsg(res.message);
      await loadBooking();
    } catch (err: any) {
      setSimMsg(err.message ?? 'Erreur lors de la simulation');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center">Réservation non trouvée</div>;

  const isPaid = booking.paymentStatus === 'PAID' || booking.paymentStatus === 'PAY_AT_HOTEL';

  return (
    <div className="min-h-screen bg-secondary py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <h1 className="font-serif text-2xl font-bold text-primary mb-2">
                {isPaid ? 'Réservation confirmée !' : 'Réservation en attente'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isPaid
                  ? 'Merci ! Votre réservation a été confirmée. Vous recevrez un email de confirmation.'
                  : 'Votre réservation est en attente de paiement.'}
              </p>

              <div className="bg-secondary rounded-xl p-6 text-left space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Référence</span>
                  <span className="font-mono font-bold text-primary">{booking.bookingReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="text-sm">{booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chambre</span>
                  <span className="text-sm">{booking.room?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" />Arrivée</span>
                  <span className="text-sm">{formatDate(booking.checkInDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" />Départ</span>
                  <span className="text-sm">{formatDate(booking.checkOutDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nuits</span>
                  <span className="text-sm">{booking.nights}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center"><CreditCard className="w-3.5 h-3.5 mr-1" />Montant</span>
                  <span className="font-bold text-gold">{formatCurrency(Number(booking.totalAmount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Statut paiement</span>
                  <span className={`text-sm font-medium ${isPaid ? 'text-green-600' : 'text-orange-500'}`}>
                    {booking.paymentStatus === 'PAID' ? 'Payé' : booking.paymentStatus === 'PAY_AT_HOTEL' ? 'À l\'hôtel' : 'En attente'}
                  </span>
                </div>
              </div>

              {/* ── Simulation Mobile Money (test mode uniquement) ── */}
              {TEST_MODE && !isPaid && booking.paymentStatus !== 'PAY_AT_HOTEL' && (
                <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-left">
                  <div className="flex items-center gap-2 mb-2 text-yellow-800 font-semibold text-sm">
                    <FlaskConical className="w-4 h-4" />
                    Mode test — Simuler réception Mobile Money
                  </div>
                  <p className="text-xs text-yellow-700 mb-3">
                    Clique pour simuler la notification de paiement reçu depuis l&apos;opérateur mobile.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                    onClick={handleSimulateMobileMoney}
                    disabled={simulating}
                  >
                    {simulating
                      ? <><Loader2 className="animate-spin w-3 h-3 mr-2" />Simulation en cours…</>
                      : <><FlaskConical className="w-3 h-3 mr-2" />Simuler paiement reçu</>}
                  </Button>
                  {simMsg && (
                    <p className={`mt-2 text-xs font-medium ${simMsg.includes('succès') ? 'text-green-700' : 'text-red-600'}`}>
                      {simMsg}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`/api/invoices/${reference}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </a>
                <a href="https://wa.me/224666057620" target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              </div>

              <div className="mt-6">
                <Link href="/">
                  <Button variant="ghost" className="text-muted-foreground">
                    ← Retour à l&apos;accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
