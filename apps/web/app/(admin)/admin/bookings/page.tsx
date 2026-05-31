'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Eye, X, CheckCircle, XCircle, Clock, UserCheck, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { getAdminBookings, updateBookingStatus, api } from '@/lib/api';
import { formatCurrency, formatDate, calculateNights } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  CANCELLED: 'Annulee',
  COMPLETED: 'Terminee',
  NO_SHOW: 'No-show',
};

const paymentColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  PAY_AT_HOTEL: 'bg-blue-100 text-blue-800',
};

const paymentLabels: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Paye',
  FAILED: 'Echoue',
  PAY_AT_HOTEL: 'A l\'hotel',
};

const PAGE_SIZE = 12;

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewBooking, setViewBooking] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    setPage(1); // reset to first page on reload/filter
    try {
      const params: Record<string, string> = { limit: '200' };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await getAdminBookings(params);
      setBookings(data.data || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pagedBookings = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return bookings.slice(start, start + PAGE_SIZE);
  }, [bookings, page]);

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    setActionLoading(id + status);
    try {
      await updateBookingStatus(id, status, reason);
      loadBookings();
      if (viewBooking?.id === id) {
        setViewBooking((prev: any) => prev ? { ...prev, bookingStatus: status } : null);
      }
    } catch (err: any) {
      toast(err.message, 'error');
      // Le statut a probablement change entre-temps (ex. confirmation
      // automatique apres paiement). On rafraichit pour resynchroniser
      // l'affichage et eviter de recliquer une action devenue invalide.
      loadBookings();
      if (viewBooking?.id === id) setViewBooking(null);
    } finally {
      setActionLoading('');
    }
  };

  const handleCancelWithReason = (id: string) => {
    const reason = prompt('Raison de l\'annulation (optionnel):');
    if (reason === null) return; // User clicked Cancel on prompt
    handleStatusChange(id, 'CANCELLED', reason || undefined);
  };

  const getStatusActions = (booking: any) => {
    const actions: { label: string; status: string; icon: any; variant: string; confirm?: boolean }[] = [];

    switch (booking.bookingStatus) {
      case 'PENDING':
        actions.push({ label: 'Confirmer', status: 'CONFIRMED', icon: CheckCircle, variant: 'green' });
        actions.push({ label: 'Annuler', status: 'CANCELLED', icon: XCircle, variant: 'red' });
        break;
      case 'CONFIRMED':
        actions.push({ label: 'Terminer', status: 'COMPLETED', icon: UserCheck, variant: 'blue' });
        actions.push({ label: 'No-show', status: 'NO_SHOW', icon: AlertTriangle, variant: 'gray' });
        actions.push({ label: 'Annuler', status: 'CANCELLED', icon: XCircle, variant: 'red' });
        break;
      // États terminaux : réactivation possible (corrige une erreur). Le serveur
      // re-vérifie la disponibilité avant de remettre la réservation en CONFIRMED.
      case 'CANCELLED':
      case 'NO_SHOW':
      case 'COMPLETED':
        actions.push({ label: 'Réactiver', status: 'CONFIRMED', icon: RotateCcw, variant: 'green' });
        break;
    }

    return actions;
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
            <p className="text-sm text-gray-500">{bookings.length} reservation(s)</p>
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005'}/api/admin/export/bookings.csv`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />Export CSV
            </Button>
          </a>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'En attente', status: 'PENDING', color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Confirmees', status: 'CONFIRMED', color: 'text-green-600 bg-green-50' },
            { label: 'Terminees', status: 'COMPLETED', color: 'text-blue-600 bg-blue-50' },
            { label: 'Annulees', status: 'CANCELLED', color: 'text-red-600 bg-red-50' },
            { label: 'No-show', status: 'NO_SHOW', color: 'text-gray-600 bg-gray-50' },
          ].map((s) => (
            <button
              key={s.status}
              onClick={() => { setStatusFilter(statusFilter === s.status ? '' : s.status); setTimeout(loadBookings, 50); }}
              className={`p-3 rounded-lg border text-center transition-all ${statusFilter === s.status ? 'ring-2 ring-[#C8A45D] border-[#C8A45D]' : 'border-gray-200 hover:border-gray-300'} ${s.color}`}
            >
              <p className="text-2xl font-bold">{bookings.filter((b) => b.bookingStatus === s.status).length}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadBookings()}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input px-3 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmees</option>
                <option value="COMPLETED">Terminees</option>
                <option value="CANCELLED">Annulees</option>
                <option value="NO_SHOW">No-show</option>
              </select>
              <Button onClick={loadBookings}>Filtrer</Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings — mobile cards (sm and below) */}
        <div className="md:hidden space-y-3">
          {pagedBookings.map((b) => (
            <Card key={b.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{b.customerName}</p>
                    <p className="text-xs text-gray-500">{b.customerEmail}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColors[b.bookingStatus] || ''}`}>
                    {statusLabels[b.bookingStatus] || b.bookingStatus}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{b.bookingReference}</span>
                  <span>{b.room?.name || '-'}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Number(b.totalAmount))}</span>
                  <span>{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</span>
                  <span className={`px-1.5 py-0.5 rounded-full ${paymentColors[b.paymentStatus] || ''}`}>
                    {paymentLabels[b.paymentStatus] || b.paymentStatus}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => setViewBooking(b)}>
                    <Eye className="w-3 h-3 mr-1" />Voir
                  </Button>
                  {b.bookingStatus === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="gold"
                      className="h-8 text-xs flex-1"
                      disabled={actionLoading === b.id + 'CONFIRMED'}
                      onClick={() => handleStatusChange(b.id, 'CONFIRMED')}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {actionLoading === b.id + 'CONFIRMED' ? '...' : 'Confirmer'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
          {!loading && bookings.length === 0 && <div className="text-center py-8 text-gray-500">Aucune reservation trouvee</div>}
          {bookings.length > PAGE_SIZE && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={bookings.length} onPageChange={setPage} />
          )}
        </div>

        {/* Bookings Table — desktop (md and above) */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Reference</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Chambre</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Dates</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Paiement</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{b.bookingReference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{b.customerName}</div>
                        <div className="text-xs text-gray-500">{b.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{b.room?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <div>{formatDate(b.checkInDate)}</div>
                          <div className="text-gray-400">au {formatDate(b.checkOutDate)}</div>
                          <div className="text-[#C8A45D] font-medium">{calculateNights(b.checkInDate, b.checkOutDate)} nuit(s)</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(Number(b.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${paymentColors[b.paymentStatus] || 'bg-gray-100'}`}>
                          {paymentLabels[b.paymentStatus] || b.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[b.bookingStatus] || ''}`}>
                          {statusLabels[b.bookingStatus] || b.bookingStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setViewBooking(b)}>
                            <Eye className="w-3 h-3 mr-1" />Voir
                          </Button>
                          {b.bookingStatus === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="gold"
                              className="h-7 text-xs"
                              disabled={actionLoading === b.id + 'CONFIRMED'}
                              onClick={() => handleStatusChange(b.id, 'CONFIRMED')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {actionLoading === b.id + 'CONFIRMED' ? '...' : 'Confirmer'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && bookings.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucune reservation trouvee</div>
              )}
            </div>
            {/* Pagination */}
            {bookings.length > PAGE_SIZE && (
              <div className="px-4 pb-4">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={bookings.length}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Detail Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewBooking(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <div>
                <h2 className="text-lg font-bold">Reservation {viewBooking.bookingReference}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[viewBooking.bookingStatus] || ''}`}>
                  {statusLabels[viewBooking.bookingStatus] || viewBooking.bookingStatus}
                </span>
              </div>
              <button onClick={() => setViewBooking(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Informations client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="text-sm font-medium">{viewBooking.customerName}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{viewBooking.customerEmail}</p>
                  </div>
                  {viewBooking.customerPhone && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="text-sm font-medium">{viewBooking.customerPhone}</p>
                    </div>
                  )}
                  {viewBooking.customerCountry && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Pays</p>
                      <p className="text-sm font-medium">{viewBooking.customerCountry}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Details du sejour</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Chambre</p>
                    <p className="text-sm font-medium">{viewBooking.room?.name || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Arrivee</p>
                    <p className="text-sm font-medium">{formatDate(viewBooking.checkInDate)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Depart</p>
                    <p className="text-sm font-medium">{formatDate(viewBooking.checkOutDate)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Nuits</p>
                    <p className="text-sm font-medium">{calculateNights(viewBooking.checkInDate, viewBooking.checkOutDate)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Adultes</p>
                    <p className="text-sm font-medium">{viewBooking.adults || 1}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Enfants</p>
                    <p className="text-sm font-medium">{viewBooking.children || 0}</p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Montant total</p>
                    <p className="text-lg font-bold text-[#071B33]">{formatCurrency(Number(viewBooking.totalAmount))}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Devise</p>
                    <p className="text-sm font-medium">{viewBooking.currency || 'GNF'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Statut paiement</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${paymentColors[viewBooking.paymentStatus] || 'bg-gray-100'}`}>
                      {paymentLabels[viewBooking.paymentStatus] || viewBooking.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {viewBooking.specialRequests && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Demandes speciales</h3>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">{viewBooking.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Dates</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Creee le</p>
                    <p className="text-sm font-medium">{formatDate(viewBooking.createdAt)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Mise a jour</p>
                    <p className="text-sm font-medium">{formatDate(viewBooking.updatedAt || viewBooking.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex flex-wrap justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setViewBooking(null)}>Fermer</Button>
              {getStatusActions(viewBooking).map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  variant={action.variant === 'red' ? 'ghost' : action.variant === 'green' ? 'gold' : 'outline'}
                  className={`text-xs ${action.variant === 'red' ? 'text-red-600 hover:bg-red-50' : ''}`}
                  disabled={actionLoading === viewBooking.id + action.status}
                  onClick={() => {
                    if (action.status === 'CANCELLED') {
                      handleCancelWithReason(viewBooking.id);
                    } else {
                      handleStatusChange(viewBooking.id, action.status);
                    }
                  }}
                >
                  <action.icon className="w-3.5 h-3.5 mr-1" />
                  {actionLoading === viewBooking.id + action.status ? '...' : action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
