'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, X, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get<any[]>('/admin/customers');
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = () => {
    if (!search.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const s = search.toLowerCase();
    setFilteredCustomers(
      customers.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.phone?.toLowerCase().includes(s) ||
          c.country?.toLowerCase().includes(s)
      )
    );
  };

  useEffect(() => {
    handleSearch();
  }, [search, customers]);

  const openCustomerDetail = async (customer: any) => {
    setViewCustomer(customer);
    setLoadingBookings(true);
    try {
      const data = await api.get<any>(`/admin/bookings?search=${encodeURIComponent(customer.email)}&limit=20`);
      setCustomerBookings(data?.data || []);
    } catch {
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-500">{filteredCustomers.length} client(s)</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, telephone ou pays..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total clients</p>
                  <p className="text-xl font-bold">{customers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avec email</p>
                  <p className="text-xl font-bold">{customers.filter((c) => c.email).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pays differents</p>
                  <p className="text-xl font-bold">
                    {new Set(customers.filter((c) => c.country).map((c) => c.country)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Telephone</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Pays</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Inscrit le</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#071B33] flex items-center justify-center text-white font-bold text-xs">
                            {c.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{c.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.phone || '-'}</td>
                      <td className="px-4 py-3">
                        {c.country ? (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c.country}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openCustomerDetail(c)}>
                          <Eye className="w-3 h-3 mr-1" />Voir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {search ? 'Aucun client ne correspond a la recherche' : 'Aucun client enregistre'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Fiche client">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewCustomer(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">Fiche client</h2>
              <button onClick={() => setViewCustomer(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#071B33] flex items-center justify-center text-white font-bold text-xl">
                  {viewCustomer.fullName?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{viewCustomer.fullName}</h3>
                  <p className="text-sm text-gray-500">Client depuis {formatDate(viewCustomer.createdAt)}</p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 gap-3">
                {viewCustomer.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{viewCustomer.email}</p>
                    </div>
                  </div>
                )}
                {viewCustomer.phone && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="text-sm font-medium">{viewCustomer.phone}</p>
                    </div>
                  </div>
                )}
                {viewCustomer.country && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Pays</p>
                      <p className="text-sm font-medium">{viewCustomer.country}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bookings History */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Historique des reservations ({customerBookings.length})
                </h4>
                {loadingBookings ? (
                  <p className="text-sm text-gray-500">Chargement...</p>
                ) : customerBookings.length === 0 ? (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">Aucune reservation trouvee</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {customerBookings.map((b: any) => (
                      <div key={b.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{b.room?.name || 'Chambre'}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(b.checkInDate)} - {formatDate(b.checkOutDate)}
                          </p>
                          <p className="text-xs font-mono text-gray-400">{b.bookingReference}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              b.bookingStatus === 'CONFIRMED'
                                ? 'bg-green-100 text-green-800'
                                : b.bookingStatus === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : b.bookingStatus === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end rounded-b-xl">
              <Button variant="outline" onClick={() => setViewCustomer(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
