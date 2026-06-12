'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface DayData {
  date: string;           // YYYY-MM-DD
  checkIns: Booking[];
  checkOuts: Booking[];
  staying: Booking[];
}

interface Booking {
  id: string;
  bookingReference: string;
  customerName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
  room: { name: string };
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getOccupancyColor(count: number, total: number) {
  if (total === 0 || count === 0) return 'bg-white';
  const pct = count / total;
  if (pct >= 0.8) return 'bg-red-50 border-red-200';
  if (pct >= 0.5) return 'bg-amber-50 border-amber-200';
  return 'bg-green-50 border-green-200';
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      // Add a buffer of ±7 days to catch bookings spanning month boundaries
      const from = new Date(firstDay); from.setDate(from.getDate() - 7);
      const to   = new Date(lastDay);  to.setDate(to.getDate() + 7);

      const [bookingRes, roomRes] = await Promise.all([
        api.get<{ data: Booking[] }>(`/admin/bookings?limit=200&from=${formatDateLocal(from)}&to=${formatDateLocal(to)}`),
        api.get<{ data: any[] }>('/rooms?limit=50&status=AVAILABLE'),
      ]);

      setBookings((bookingRes as any).data || []);
      setRooms((roomRes as any).data || []);
    } catch (err) {
      console.error('Calendar fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build calendar grid
  const firstOfMonth = new Date(year, month, 1);
  // Monday = 0 offset (European grid)
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function getDayData(dayNum: number): DayData {
    const dateStr = formatDateLocal(new Date(year, month, dayNum));
    const active = bookings.filter(
      (b) => ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(b.bookingStatus),
    );
    return {
      date: dateStr,
      checkIns:  active.filter((b) => b.checkInDate.slice(0, 10) === dateStr),
      checkOuts: active.filter((b) => b.checkOutDate.slice(0, 10) === dateStr),
      staying:   active.filter(
        (b) => b.checkInDate.slice(0, 10) < dateStr && b.checkOutDate.slice(0, 10) > dateStr,
      ),
    };
  }

  function goToPrev() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function goToNext() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }
  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  }

  const totalRooms = rooms.length || 1;
  const todayStr = formatDateLocal(today);

  // Summary stats for the month
  const monthBookings = bookings.filter((b) => {
    const ci = b.checkInDate.slice(0, 10);
    return ci.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
  });
  const monthRevenue = monthBookings
    .filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED')
    .reduce((s, b) => s + Number(b.totalAmount), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-gold" />
            Calendrier de disponibilité
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualisez les arrivées, départs et occupation en un coup d&apos;œil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>Aujourd&apos;hui</Button>
          <Button variant="outline" size="icon" onClick={goToPrev}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold text-primary min-w-[160px] text-center">
            {MONTHS_FR[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={goToNext}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{monthBookings.length}</p>
            <p className="text-xs text-muted-foreground">Réservations ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {monthBookings.filter((b) => b.bookingStatus === 'CONFIRMED').length}
            </p>
            <p className="text-xs text-muted-foreground">Confirmées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {monthBookings.filter((b) => b.bookingStatus === 'PENDING').length}
            </p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold text-gold">{formatCurrency(monthRevenue)}</p>
            <p className="text-xs text-muted-foreground">Revenus (confirmés)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_FR.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dayData = getDayData(dayNum);
                  const occupied = dayData.checkIns.length + dayData.staying.length;
                  const dateStr = dayData.date;
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDay?.date === dateStr;
                  const colorClass = getOccupancyColor(occupied, totalRooms);

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(isSelected ? null : dayData)}
                      className={`
                        relative rounded-lg border p-1.5 min-h-[64px] text-left transition-all
                        hover:shadow-md hover:scale-[1.02]
                        ${colorClass}
                        ${isToday ? 'ring-2 ring-gold ring-offset-1' : ''}
                        ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}
                      `}
                    >
                      <span className={`text-xs font-bold ${isToday ? 'text-gold' : 'text-primary'}`}>
                        {dayNum}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayData.checkIns.length > 0 && (
                          <div className="text-[10px] bg-green-100 text-green-700 rounded px-1 leading-tight">
                            ↓ {dayData.checkIns.length} arr.
                          </div>
                        )}
                        {dayData.checkOuts.length > 0 && (
                          <div className="text-[10px] bg-blue-100 text-blue-700 rounded px-1 leading-tight">
                            ↑ {dayData.checkOuts.length} dép.
                          </div>
                        )}
                        {dayData.staying.length > 0 && (
                          <div className="text-[10px] bg-gray-100 text-gray-600 rounded px-1 leading-tight">
                            ⚑ {dayData.staying.length} séj.
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" /> Faible occupation</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 inline-block" /> Occupation moyenne</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> Forte occupation</span>
                <span className="flex items-center gap-1">↓ Arrivée &nbsp;↑ Départ &nbsp;⚑ Séjour en cours</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day detail panel */}
        <div>
          {selectedDay ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selectedDay.checkIns.length === 0 && selectedDay.checkOuts.length === 0 && selectedDay.staying.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">Aucune réservation ce jour.</p>
                )}

                {selectedDay.checkIns.length > 0 && (
                  <div>
                    <p className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                      ↓ Arrivées ({selectedDay.checkIns.length})
                    </p>
                    <div className="space-y-2">
                      {selectedDay.checkIns.map((b) => (
                        <div key={b.id} className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                          <p className="font-medium">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground">{b.room?.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-mono text-muted-foreground">{b.bookingReference}</span>
                            <Badge variant={b.bookingStatus === 'CONFIRMED' ? 'default' : 'secondary'} className="text-[10px]">
                              {b.bookingStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDay.checkOuts.length > 0 && (
                  <div>
                    <p className="font-semibold text-blue-700 mb-2">↑ Départs ({selectedDay.checkOuts.length})</p>
                    <div className="space-y-2">
                      {selectedDay.checkOuts.map((b) => (
                        <div key={b.id} className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                          <p className="font-medium">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground">{b.room?.name}</p>
                          <span className="text-xs font-mono text-muted-foreground">{b.bookingReference}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDay.staying.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-600 mb-2">⚑ Séjours en cours ({selectedDay.staying.length})</p>
                    <div className="space-y-2">
                      {selectedDay.staying.map((b) => (
                        <div key={b.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                          <p className="font-medium">{b.customerName}</p>
                          <p className="text-xs text-muted-foreground">{b.room?.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full min-h-[200px] text-center p-6">
                <div>
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez sur un jour pour voir le détail des réservations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 bg-primary text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Chargement…
        </div>
      )}
    </div>
  );
}
