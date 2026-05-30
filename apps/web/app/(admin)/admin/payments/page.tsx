'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, X, CreditCard, Banknote, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

const statusLabels: Record<string, string> = {
  SUCCESS: 'Reussi',
  PENDING: 'En attente',
  FAILED: 'Echoue',
  REFUNDED: 'Rembourse',
};

const methodIcons: Record<string, any> = {
  STRIPE: CreditCard,
  CARD: CreditCard,
  MOBILE_MONEY: Smartphone,
  PAY_AT_HOTEL: Banknote,
  CASH: Banknote,
};

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewPayment, setViewPayment] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, success: 0, pending: 0, failed: 0 });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/admin/dashboard/latest-payments');
      let filtered = data || [];

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (p: any) =>
            p.booking?.bookingReference?.toLowerCase().includes(s) ||
            p.booking?.customerName?.toLowerCase().includes(s) ||
            p.paymentMethod?.toLowerCase().includes(s)
        );
      }
      if (statusFilter) {
        filtered = filtered.filter((p: any) => p.status === statusFilter);
      }

      setPayments(filtered);

      // Calculate stats
      const all = data || [];
      setStats({
        total: all.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
        success: all.filter((p: any) => p.status === 'SUCCESS').length,
        pending: all.filter((p: any) => p.status === 'PENDING').length,
        failed: all.filter((p: any) => p.status === 'FAILED').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    loadPayments();
  };

  const handleMarkPaid = async (payment: any) => {
    if (!confirm('Marquer ce paiement comme recu ?')) return;
    try {
      await api.patch(`/admin/payments/${payment.id}/confirm`, {});
      toast('Paiement validé avec succès', 'success');
      loadPayments();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const getMethodIcon = (method: string) => {
    const Icon = methodIcons[method] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
            <p className="text-sm text-gray-500">{payments.length} paiement(s)</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total encaisse</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Reussis</p>
              <p className="text-xl font-bold text-green-600">{stats.success}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">En attente</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Echoues</p>
              <p className="text-xl font-bold text-red-600">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par reference, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-md border border-input px-3 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="SUCCESS">Reussi</option>
                <option value="PENDING">En attente</option>
                <option value="FAILED">Echoue</option>
                <option value="REFUNDED">Rembourse</option>
              </select>
              <Button onClick={handleSearch}>Filtrer</Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Reservation</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Montant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Methode</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {p.id?.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {p.booking?.bookingReference || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.booking?.customerName || '-'}</div>
                        <div className="text-xs text-gray-500">{p.booking?.customerEmail || ''}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {formatCurrency(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {getMethodIcon(p.paymentMethod)}
                          <span className="text-xs">{p.paymentMethod?.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setViewPayment(p)}>
                            <Eye className="w-3 h-3 mr-1" />Details
                          </Button>
                          {p.status === 'PENDING' && (
                            <Button size="sm" variant="gold" className="h-7 text-xs" onClick={() => handleMarkPaid(p)}>
                              Valider
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && payments.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucun paiement trouve</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Modal */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Details du paiement">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewPayment(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">Details du paiement</h2>
              <button onClick={() => setViewPayment(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">ID Paiement</p>
                  <p className="text-sm font-mono">{viewPayment.id?.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[viewPayment.status] || ''}`}>
                    {statusLabels[viewPayment.status] || viewPayment.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="text-lg font-bold">{formatCurrency(Number(viewPayment.amount))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Methode</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getMethodIcon(viewPayment.paymentMethod)}
                    <span className="text-sm">{viewPayment.paymentMethod?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-1">Reservation associee</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-mono">{viewPayment.booking?.bookingReference || '-'}</p>
                  <p className="text-sm font-medium mt-1">{viewPayment.booking?.customerName}</p>
                  <p className="text-xs text-gray-500">{viewPayment.booking?.customerEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cree le</p>
                  <p className="text-sm">{formatDate(viewPayment.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Paye le</p>
                  <p className="text-sm">{viewPayment.paidAt ? formatDate(viewPayment.paidAt) : '-'}</p>
                </div>
              </div>
              {viewPayment.transactionId && (
                <div>
                  <p className="text-xs text-gray-500">ID Transaction</p>
                  <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{viewPayment.transactionId}</p>
                </div>
              )}
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setViewPayment(null)}>Fermer</Button>
              {viewPayment.status === 'PENDING' && (
                <Button variant="gold" onClick={() => { handleMarkPaid(viewPayment); setViewPayment(null); }}>
                  Marquer comme paye
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
