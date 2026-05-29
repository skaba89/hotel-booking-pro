'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRooms } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const featureList = [
  { key: 'wifi', label: 'WiFi Gratuit' },
  { key: 'breakfast', label: 'Petit-dejeuner inclus' },
  { key: 'air_conditioning', label: 'Climatisation' },
  { key: 'tv', label: 'TV ecran plat' },
  { key: 'safe', label: 'Coffre-fort' },
  { key: 'minibar', label: 'Minibar' },
  { key: 'balcony', label: 'Balcon/Terrasse' },
  { key: 'room_service', label: 'Room Service 24h' },
  { key: 'pool', label: 'Acces Piscine' },
  { key: 'spa', label: 'Acces Spa' },
  { key: 'gym', label: 'Salle de Sport' },
  { key: 'parking', label: 'Parking gratuit' },
  { key: 'sea_view', label: 'Vue mer/jardin' },
  { key: 'laundry', label: 'Blanchisserie' },
];

export function RoomComparison() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    getRooms({ limit: '20' }).then((data) => {
      const list = data.data || data || [];
      setRooms(list);
      // Select first 3 by default
      setSelected(list.slice(0, 3).map((r: any) => r.id));
    }).catch(console.error);
  }, []);

  const visibleRooms = rooms.filter(r => selected.includes(r.id));

  return (
    <div className="overflow-x-auto">
      {/* Room selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => {
              if (selected.includes(room.id)) {
                setSelected(selected.filter(id => id !== room.id));
              } else if (selected.length < 4) {
                setSelected([...selected, room.id]);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(room.id)
                ? 'bg-[#C8A45D] text-white border-[#C8A45D]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#C8A45D]'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      {visibleRooms.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-40">Caracteristique</th>
                {visibleRooms.map((room) => (
                  <th key={room.id} className="px-4 py-3 text-center min-w-[140px]">
                    <div className="font-semibold text-[#071B33]">{room.name}</div>
                    <div className="text-xs text-[#C8A45D] font-bold mt-0.5">{formatCurrency(Number(room.pricePerNight))}/nuit</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Basic info */}
              <tr className="bg-blue-50/50">
                <td className="px-4 py-2 font-medium text-gray-700">Superficie</td>
                {visibleRooms.map((room) => (
                  <td key={room.id} className="px-4 py-2 text-center">{room.sizeM2 ? `${Number(room.sizeM2)} m²` : '-'}</td>
                ))}
              </tr>
              <tr className="bg-blue-50/50">
                <td className="px-4 py-2 font-medium text-gray-700">Capacite</td>
                {visibleRooms.map((room) => (
                  <td key={room.id} className="px-4 py-2 text-center">{room.capacity} personnes</td>
                ))}
              </tr>
              <tr className="bg-blue-50/50">
                <td className="px-4 py-2 font-medium text-gray-700">Type de lit</td>
                {visibleRooms.map((room) => (
                  <td key={room.id} className="px-4 py-2 text-center">{room.bedType || '-'}</td>
                ))}
              </tr>

              {/* Features */}
              {featureList.map((feature) => (
                <tr key={feature.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{feature.label}</td>
                  {visibleRooms.map((room) => {
                    const has = room.amenities?.includes(feature.key);
                    return (
                      <td key={room.id} className="px-4 py-2 text-center">
                        {has ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Book buttons */}
              <tr className="bg-gray-50">
                <td className="px-4 py-4"></td>
                {visibleRooms.map((room) => (
                  <td key={room.id} className="px-4 py-4 text-center">
                    <Link href={`/booking?room=${room.id}`}>
                      <Button variant="gold" size="sm" className="w-full">
                        Reserver <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
