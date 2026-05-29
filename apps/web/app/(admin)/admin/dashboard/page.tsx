'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, DollarSign, TrendingUp, BedDouble, Users, AlertCircle, CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getAdminStats, getLatestBookings, getLatestPayments, api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [latestBookings, setLatestBookings] = useState<any[]>([]);
  const [latestPayments, setLatestPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getLatestBookings().catch(() => []),
      getLatestPayments().catch(() => []),
    ]).then(([statsData, bookings, payments]) => {
      setStats(statsData);
      setLatestBookings(bookings || []);
      setLatestPayments(payments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'Reservations totales', value: stats.totalBookings, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', up: true },
    { label: "Chiffre d'affaires", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', trend: '+8%', up: true },
    { label: "Aujourd'hui", value: stats.todayBookings, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', trend: null, up: true },
    { label: 'Taux occupation', value: `${stats.occupancyRate}%`, icon: BedDouble, color: 'text-orange-600', bg: 'bg-orange-50', trend: `${stats.occupancyRate > 50 ? '+' : ''}${stats.occupancyRate - 50}%`, up: stats.occupancyRate > 50 },
    { label: 'Confirmees', value: stats.confirmedBookings, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', trend: null, up: true },
    { label: 'Annulees', value: stats.cancelledBookings, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', trend: null, up: false },
    { label: 'Chambres disponibles', value: stats.availableRooms, icon: BedDouble, color: 'text-blue-600', bg: 'bg-blue-50', trend: null, up: true },
    { label: 'En maintenance', value: stats.maintenanceRooms, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', trend: null, up: false },
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de l&apos;activite de l&apos;hotel</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" /> Reservations
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-7 bg-gray-200 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.label} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                        <p className="text-2xl font-bold mt-1 text-gray-900">{kpi.value}</p>
                        {kpi.trend && (
                          <div className={`flex items-center gap-0.5 mt-1 text-xs ${kpi.up ? 'text-green-600' : 'text-red-600'}`}>
                            {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {kpi.trend}
                          </div>
                        )}
                      </div>
                      <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Latest Bookings & Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Bookings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Dernieres reservations</CardTitle>
                    <Link href="/admin/bookings">
                      <Button variant="ghost" size="sm" className="text-xs h-7">Voir tout</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {latestBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                            <CalendarCheck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                            <p className="text-xs text-gray-500">{booking.room?.name} - {formatDate(booking.checkInDate)}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.bookingStatus] || 'bg-gray-100'}`}>
                          {booking.bookingStatus}
                        </span>
                      </div>
                    ))}
                    {latestBookings.length === 0 && (
                      <div className="px-5 py-8 text-center text-sm text-gray-500">
                        Aucune reservation pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Latest Payments */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Derniers paiements</CardTitle>
                    <Link href="/admin/payments">
                      <Button variant="ghost" size="sm" className="text-xs h-7">Voir tout</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {latestPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${payment.status === 'SUCCESS' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                            <DollarSign className={`w-4 h-4 ${payment.status === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(payment.amount))}</p>
                            <p className="text-xs text-gray-500">{payment.paymentMethod} - {payment.booking?.bookingReference || 'N/A'}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.status}
                        </span>
                      </div>
                    ))}
                    {latestPayments.length === 0 && (
                      <div className="px-5 py-8 text-center text-sm text-gray-500">
                        Aucun paiement pour le moment
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link href="/admin/rooms/new">
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 hover:border-[#C8A45D] hover:bg-[#C8A45D]/5 transition-colors text-center cursor-pointer">
                      <BedDouble className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">Nouvelle chambre</p>
                    </div>
                  </Link>
                  <Link href="/admin/bookings">
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 hover:border-[#C8A45D] hover:bg-[#C8A45D]/5 transition-colors text-center cursor-pointer">
                      <CalendarCheck className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">Gerer reservations</p>
                    </div>
                  </Link>
                  <Link href="/admin/reviews">
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 hover:border-[#C8A45D] hover:bg-[#C8A45D]/5 transition-colors text-center cursor-pointer">
                      <CheckCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">Moderer avis</p>
                    </div>
                  </Link>
                  <Link href="/admin/settings">
                    <div className="p-4 rounded-xl border border-dashed border-gray-200 hover:border-[#C8A45D] hover:bg-[#C8A45D]/5 transition-colors text-center cursor-pointer">
                      <Clock className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                      <p className="text-xs font-medium text-gray-600">Parametres</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
