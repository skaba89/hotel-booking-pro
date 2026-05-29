'use client';

import { useEffect, useState } from 'react';
import { Star, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/admin/reviews').then(setReviews).catch(console.error);
  }, []);

  const handleApprove = async (id: string) => {
    await api.patch(`/admin/reviews/${id}/approve`, {});
    setReviews(reviews.map((r) => r.id === id ? { ...r, isApproved: true } : r));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return;
    await api.delete(`/admin/reviews/${id}`);
    setReviews(reviews.filter((r) => r.id !== id));
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-primary mb-6">Avis clients</h1>
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{review.customerName}</span>
                    <div className="flex">{[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />)}</div>
                    {!review.isApproved && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">En attente</span>}
                    {review.isApproved && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Approuvé</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
                <div className="flex gap-1">
                  {!review.isApproved && <Button size="sm" variant="ghost" onClick={() => handleApprove(review.id)} className="h-7 text-green-600"><Check className="w-4 h-4" /></Button>}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(review.id)} className="h-7 text-red-600"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && <p className="text-muted-foreground text-center py-8">Aucun avis</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
