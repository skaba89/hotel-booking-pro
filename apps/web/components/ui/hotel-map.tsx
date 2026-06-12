'use client';

import { MapPin, Navigation, Phone, Clock } from 'lucide-react';

export function HotelMap() {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
      {/* Map Embed */}
      <div className="relative h-64 md:h-80 bg-gray-100">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5!2d-13.5786!3d9.6411!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xf1cd0326f73f3e1%3A0x0!2zSG90ZWwgU0VUSUZBTkE!5e0!3m2!1sfr!2sgn!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      </div>

      {/* Info bar */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Adresse</p>
            <p className="text-sm font-medium">Baie de Sangarea, Conakry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Depuis l&apos;aeroport</p>
            <p className="text-sm font-medium">25 min en voiture</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Reception</p>
            <p className="text-sm font-medium">24h/24, 7j/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
