'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle, BedDouble, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { lookupBooking } from '@/lib/api';
import { formatCurrency, formatDate, calculateNights } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  PENDING: { label: 'En attente de confirmation', color: 'text-yellow-700', icon: Clock, bg: 'bg-yellow-50 border-yellow-200' },
  CONFIRMED: { label: 'Confirmee', color: 'text-green-700', icon: CheckCircle, bg: 'bg-green-50 border-green-200' },
  CANCELLED: { label: 'Annulee', color: 'text-red-700', icon: XCircle, bg: 'bg-red-50 border-red-200' },
  COMPLETED: { label: 'Terminee', color: 'text-blue-700', icon: CalendarCheck, bg: 'bg-blue-50 border-blue-200' },
  NO_SHOW: { label: 'Non presente', color: 'text-gray-700', icon: AlertCircle, bg: 'bg-gray-50 border-gray-200' },
};

export function BookingTracker() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await lookupBooking(reference.trim().toUpperCase(), email.trim().toLowerCase());
      setBooking(data);
    } catch {
      setError('Reservation introuvable. Verifiez votre reference et votre email.');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const status = booking ? statusConfig[booking.bookingStatus] || statusConfig.PENDING : null;
  const StatusIcon = status?.icon || Clock;

  return (
    <div className="max-w-xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reference (ex: BK-XXXXXXXX)"
              className="pl-10 uppercase"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email utilise lors de la reservation"
              className="pl-10"
            />
          </div>
          <Button variant="gold" type="submit" disabled={loading || !reference.trim() || !email.trim()}>
            {loading ? '...' : 'Suivre'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>
      )}

      {/* Booking Details */}
      {booking && status && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            {/* Status Banner */}
            <div className={`px-5 py-3 border-b ${status.bg} flex items-center gap-2`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Reference */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Reference</span>
                <span className="font-mono text-sm font-bold text-[#071B33]">{booking.bookingReference}</span>
              </div>

              {/* Guest */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Client</span>
                <span className="text-sm font-medium">{booking.customerName}</span>
              </div>

              {/* Room */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Chambre</span>
                <div className="flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-[#C8A45D]" />
                  <span className="text-sm font-medium">{booking.room?.name || 'N/A'}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Arrivee</p>
                  <p className="text-sm font-medium">{formatDate(booking.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 mb-0.5">Depart</p>
                  <p className="text-sm font-medium">{formatDate(booking.checkOutDate)}</p>
                </div>
              </div>

              {/* Nights & Amount */}
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">{booking.nights || calculateNights(booking.checkInDate, booking.checkOutDate)} nuit(s)</span>
                <span className="text-lg font-bold text-[#071B33]">{formatCurrency(Number(booking.totalAmount))}</span>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Paiement</span>
                <span className={`text-xs px-2 py-1 rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {booking.paymentStatus === 'PAID' ? 'Paye' : booking.paymentStatus === 'PAY_AT_HOTEL' ? 'A l\'hotel' : 'En attente'}
                </span>
              </div>

              {/* Contact */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-700 mb-1">Besoin d&apos;aide avec votre reservation ?</p>
                <a href="tel:+224666057620" className="inline-flex items-center gap-1 text-sm font-medium text-blue-800 hover:underline">
                  <Phone className="w-3.5 h-3.5" /> +224 666 05 76 20
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
