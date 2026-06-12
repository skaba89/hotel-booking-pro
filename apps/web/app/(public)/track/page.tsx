'use client';

import { Search } from 'lucide-react';
import { BookingTracker } from '@/components/booking/booking-tracker';

export default function TrackBookingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <Search className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Suivre ma reservation</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Entrez votre reference de reservation pour consulter son statut et ses details.
          </p>
        </div>
      </section>

      {/* Tracker */}
      <section className="container mx-auto px-4 py-12">
        <BookingTracker />
      </section>
    </div>
  );
}
