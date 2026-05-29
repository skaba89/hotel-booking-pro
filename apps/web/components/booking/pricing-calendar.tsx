'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PricingCalendarProps {
  basePrice: number;
  roomId?: string;
  onDateSelect?: (date: string) => void;
}

// Simulate pricing variations (in production, this comes from API)
function getDatePrice(basePrice: number, date: Date): { price: number; level: 'low' | 'mid' | 'high' | 'peak' } {
  const day = date.getDay(); // 0=Sun, 6=Sat
  const month = date.getMonth();

  // Weekend premium
  const isWeekend = day === 5 || day === 6;
  // High season (Nov-Jan, Jul-Aug)
  const isHighSeason = month >= 10 || month <= 1 || month === 6 || month === 7;
  // Holiday periods
  const dateStr = `${date.getMonth() + 1}-${date.getDate()}`;
  const isHoliday = ['12-25', '12-31', '1-1', '10-2'].includes(dateStr);

  let multiplier = 1.0;
  let level: 'low' | 'mid' | 'high' | 'peak' = 'low';

  if (isHoliday) {
    multiplier = 1.5;
    level = 'peak';
  } else if (isHighSeason && isWeekend) {
    multiplier = 1.3;
    level = 'peak';
  } else if (isHighSeason) {
    multiplier = 1.15;
    level = 'high';
  } else if (isWeekend) {
    multiplier = 1.1;
    level = 'mid';
  }

  return {
    price: Math.round(basePrice * multiplier),
    level,
  };
}

export function PricingCalendar({ basePrice, roomId, onDateSelect }: PricingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon start

    const days: { date: Date; inMonth: boolean; price?: number; level?: string }[] = [];

    // Padding before
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, inMonth: false });
    }

    // Actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const isPast = d < today;
      if (isPast) {
        days.push({ date: d, inMonth: true });
      } else {
        const { price, level } = getDatePrice(basePrice, d);
        days.push({ date: d, inMonth: true, price, level });
      }
    }

    // Padding after
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, inMonth: false });
    }

    return days;
  }, [currentMonth, basePrice]);

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setCurrentMonth(prev);
    }
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const monthLabel = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const levelColors = {
    low: 'text-green-700 bg-green-50',
    mid: 'text-blue-700 bg-blue-50',
    high: 'text-orange-700 bg-orange-50',
    peak: 'text-red-700 bg-red-50',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold capitalize">{monthLabel}</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center border-b">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="py-2 text-[10px] font-medium text-gray-500 uppercase">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {daysInMonth.map((day, idx) => {
          const isPast = day.date < today;
          const isToday = day.date.toDateString() === today.toDateString();

          return (
            <button
              key={idx}
              disabled={isPast || !day.inMonth || !day.price}
              onClick={() => day.price && onDateSelect?.(day.date.toISOString().split('T')[0])}
              className={`relative p-1 h-14 border-b border-r text-center transition-all
                ${!day.inMonth ? 'bg-gray-50 opacity-30' : ''}
                ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                ${isToday ? 'ring-1 ring-inset ring-[#C8A45D]' : ''}
                ${day.price && !isPast ? 'hover:bg-[#C8A45D]/10 cursor-pointer' : ''}
              `}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-[#C8A45D]' : day.inMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                {day.date.getDate()}
              </span>
              {day.price && day.inMonth && !isPast && (
                <div className={`text-[9px] font-medium mt-0.5 rounded px-0.5 ${levelColors[day.level as keyof typeof levelColors] || ''}`}>
                  {(day.price / 1000).toFixed(0)}k
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-t flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-500">Prix en milliers GNF/nuit</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-green-500"></span> Bas</span>
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-blue-500"></span> Normal</span>
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-orange-500"></span> Eleve</span>
          <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded bg-red-500"></span> Peak</span>
        </div>
      </div>
    </div>
  );
}
