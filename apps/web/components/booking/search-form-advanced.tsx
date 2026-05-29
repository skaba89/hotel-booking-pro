'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, Users, BedDouble, Search, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SearchFormAdvanced() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('adults', adults.toString());
    params.set('children', children.toString());
    params.set('rooms', rooms.toString());
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <section className="relative -mt-8 z-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 md:p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
            {/* Check-in */}
            <div className="col-span-1 md:col-span-3">
              <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Arrivée
              </label>
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (checkOut && e.target.value >= checkOut) {
                    const next = new Date(e.target.value);
                    next.setDate(next.getDate() + 1);
                    setCheckOut(next.toISOString().split('T')[0]);
                  }
                }}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/30 outline-none"
              />
            </div>

            {/* Check-out */}
            <div className="col-span-1 md:col-span-3">
              <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Départ
                {nights > 0 && <span className="ml-1 text-[#C8A45D]">({nights} nuit{nights > 1 ? 's' : ''})</span>}
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-[#C8A45D] focus:ring-1 focus:ring-[#C8A45D]/30 outline-none"
              />
            </div>

            {/* Guests & Rooms */}
            <div className="col-span-2 md:col-span-4 relative">
              <label className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Voyageurs & Chambres
              </label>
              <button
                type="button"
                onClick={() => setGuestOpen(!guestOpen)}
                className="w-full h-11 rounded-lg border border-gray-200 px-3 text-sm text-left flex items-center justify-between hover:border-[#C8A45D] transition-colors"
              >
                <span>{adults} adulte{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''} - {rooms} chambre{rooms > 1 ? 's' : ''}</span>
                <Users className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown */}
              {guestOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setGuestOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border p-4 z-40 space-y-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Adultes</p>
                        <p className="text-xs text-gray-500">18 ans et plus</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D] disabled:opacity-30" disabled={adults <= 1}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-medium">{adults}</span>
                        <button type="button" onClick={() => setAdults(Math.min(10, adults + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D]">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Enfants</p>
                        <p className="text-xs text-gray-500">0 - 17 ans</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D] disabled:opacity-30" disabled={children <= 0}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-medium">{children}</span>
                        <button type="button" onClick={() => setChildren(Math.min(6, children + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D]">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Rooms */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Chambres</p>
                        <p className="text-xs text-gray-500">Nombre de chambres</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D] disabled:opacity-30" disabled={rooms <= 1}>
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-medium">{rooms}</span>
                        <button type="button" onClick={() => setRooms(Math.min(5, rooms + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:border-[#C8A45D]">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <Button variant="gold" size="sm" className="w-full" onClick={() => setGuestOpen(false)}>
                      Appliquer
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Search Button */}
            <div className="col-span-2 md:col-span-2">
              <Button
                variant="gold"
                size="lg"
                className="w-full h-11"
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span> Confirmation instantanée
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span> Annulation gratuite 48h
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1 hidden sm:flex">
              <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></span> Meilleur prix garanti
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1 hidden sm:flex">
              <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></span> Paiement sécurisé
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
