'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign, Users, BedDouble, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const [occupancy, setOccupancy] = useState<{ date: string; occupancy: number }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<any>('/admin/dashboard/stats'),
      api.get<any[]>('/admin/dashboard/occupancy'),
    ]).then(([statsData, occupancyData]) => {
      setStats(statsData);
      setOccupancy(occupancyData || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const maxOccupancy = Math.max(...occupancy.map(d => d.occupancy), 100);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance et statistiques detaillees</p>
        </div>

        {loading ? (
          <div className="text-gray-500">Chargement des donnees...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs">Total Reservations</p>
                      <p className="text-3xl font-bold mt-1">{stats?.totalBookings || 0}</p>
                    </div>
                    <CalendarCheck className="w-10 h-10 text-white/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs">Chiffre d&apos;affaires</p>
                      <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
                    </div>
                    <DollarSign className="w-10 h-10 text-white/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs">Taux d&apos;occupation</p>
                      <p className="text-3xl font-bold mt-1">{stats?.occupancyRate || 0}%</p>
                    </div>
                    <BedDouble className="w-10 h-10 text-white/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Occupancy Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-[#C8A45D]" />
                  Taux d&apos;occupation - 30 derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {occupancy.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {day.date}: {day.occupancy}%
                      </div>
                      <div
                        className={`w-full rounded-t transition-all ${day.occupancy > 80 ? 'bg-green-500' : day.occupancy > 50 ? 'bg-blue-500' : day.occupancy > 20 ? 'bg-yellow-500' : 'bg-gray-300'} group-hover:opacity-80`}
                        style={{ height: `${Math.max((day.occupancy / maxOccupancy) * 100, 4)}%` }}
                      />
                      {i % 5 === 0 && (
                        <span className="text-[9px] text-gray-400 mt-1 rotate-45 origin-left">{day.date.slice(5)}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> &gt;80%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> 50-80%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500"></span> 20-50%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300"></span> &lt;20%</span>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Repartition des reservations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Confirmees', value: stats?.confirmedBookings || 0, total: stats?.totalBookings || 1, color: 'bg-green-500' },
                    { label: 'En attente', value: (stats?.totalBookings || 0) - (stats?.confirmedBookings || 0) - (stats?.cancelledBookings || 0), total: stats?.totalBookings || 1, color: 'bg-yellow-500' },
                    { label: 'Annulees', value: stats?.cancelledBookings || 0, total: stats?.totalBookings || 1, color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium">{item.value} ({Math.round((item.value / item.total) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.value / item.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chambres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Disponibles', value: stats?.availableRooms || 0, color: 'bg-green-500' },
                    { label: 'Occupees', value: (stats?.totalBookings > 0 ? Math.round((stats?.occupancyRate / 100) * (stats?.availableRooms + stats?.maintenanceRooms)) : 0), color: 'bg-blue-500' },
                    { label: 'En maintenance', value: stats?.maintenanceRooms || 0, color: 'bg-yellow-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                        <span className="text-sm text-gray-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

