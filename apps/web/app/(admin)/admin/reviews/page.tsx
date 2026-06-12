'use client';

import { useEffect, useState } from 'react';
import { Star, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    api.get<any[]>('/admin/reviews').then(setReviews).catch(console.error);
  }, []);

  const handleApprove = async (id: string) => {
    await api.patch(`/admin/reviews/${id}/approve`, {});
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    await api.delete(`/admin/reviews/${id}`);
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filtered = reviews.filter(r =>
    filter === 'all' ? true : filter === 'pending' ? !r.isApproved : r.isApproved
  );

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Avis clients</h1>
            {pendingCount > 0 && (
              <p className="text-sm text-amber-600 mt-0.5">{pendingCount} avis en attente de modération</p>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {([['all', 'Tous'], ['pending', 'En attente'], ['approved', 'Approuvés']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  filter === val ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Star className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>Aucun avis</p>
            </div>
          ) : (
            filtered.map(review => (
              <Card key={review.id} className={`hover:shadow-md transition-shadow ${!review.isApproved ? 'border-amber-200 bg-amber-50/20' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-gray-900 text-sm">{review.customerName}</span>
                        {/* Stars */}
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-gold text-gold' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">({review.rating}/5)</span>
                        {review.isApproved
                          ? <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">✓ Approuvé</span>
                          : <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">En attente</span>
                        }
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 break-words leading-relaxed">« {review.comment} »</p>
                      )}
                      {review.createdAt && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 sm:flex-col sm:items-end flex-shrink-0">
                      {!review.isApproved && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(review.id)}
                          className="h-8 text-xs text-green-700 border-green-300 hover:bg-green-50">
                          <Check className="w-3.5 h-3.5 mr-1" />Approuver
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(review.id)}
                        className="h-8 text-xs text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
