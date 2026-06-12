'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SearchForm() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      ...(checkIn && { checkIn }),
      ...(checkOut && { checkOut }),
      adults,
      children,
    });
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <section className="relative -mt-16 z-20 container mx-auto px-4">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
      >
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center">
            <CalendarDays className="w-4 h-4 mr-1 text-gold" />
            Arrivée
          </label>
          <Input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center">
            <CalendarDays className="w-4 h-4 mr-1 text-gold" />
            Départ
          </label>
          <Input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center">
            <Users className="w-4 h-4 mr-1 text-gold" />
            Adultes
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} adulte{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center">
            <Users className="w-4 h-4 mr-1 text-gold" />
            Enfants
          </label>
          <select
            value={children}
            onChange={(e) => setChildren(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} enfant{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full">
          <Search className="w-4 h-4 mr-2" />
          Rechercher
        </Button>
      </form>
    </section>
  );
}
