'use client';

import { GitCompareArrows } from 'lucide-react';
import { RoomComparison } from '@/components/rooms/room-comparison';

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <GitCompareArrows className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Comparer nos chambres</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Comparez les equipements, prix et caracteristiques de nos chambres pour trouver celle qui vous convient.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <RoomComparison />
      </section>
    </div>
  );
}
