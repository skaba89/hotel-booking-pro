'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { getReviews, submitReview } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerName: '', rating: 5, comment: '' });

  useEffect(() => {
    getReviews().then(setReviews).catch(console.error);
  }, []);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReview(form);
      setSubmitted(true);
      setForm({ customerName: '', rating: 5, comment: '' });
    } catch (err: any) {
      toast(err.message || 'Erreur lors de la soumission', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <Star className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="font-serif text-4xl font-bold text-white mb-3">Avis de nos clients</h1>
          <p className="text-white/70 max-w-xl mx-auto">
            Decouvrez ce que nos clients disent de leur experience a l&apos;Hotel SETIFANA.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {/* Rating Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Average */}
          <Card className="text-center">
            <CardContent className="p-6">
              <p className="text-5xl font-bold text-[#071B33]">{averageRating}</p>
              <div className="flex justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">{reviews.length} avis verifies</p>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, percent }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm w-3">{star}</span>
                    <Star className="w-4 h-4 fill-[#C8A45D] text-[#C8A45D]" />
                    <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C8A45D] rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA to leave review */}
        {!showForm && !submitted && (
          <div className="text-center mb-10">
            <Button variant="gold" size="lg" onClick={() => setShowForm(true)}>
              <MessageSquare className="w-4 h-4 mr-2" /> Laisser un avis
            </Button>
          </div>
        )}

        {/* Review Form */}
        {showForm && !submitted && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto mb-10">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Partagez votre experience</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Votre nom</label>
                    <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Note</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setForm({ ...form, rating: star })}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-7 h-7 ${star <= form.rating ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Commentaire</label>
                    <textarea
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Partagez votre experience..."
                      required
                    />
                  </div>
                  <Button variant="gold" type="submit" className="w-full" disabled={loading}>
                    <Send className="w-4 h-4 mr-2" />{loading ? 'Envoi...' : 'Publier mon avis'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success message */}
        {submitted && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mb-10">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg text-green-800">Merci pour votre avis !</h3>
                <p className="text-sm text-green-700 mt-1">Votre avis sera publie apres verification par notre equipe.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-[#071B33] flex items-center justify-center text-white text-sm font-bold">
                        {review.customerName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.customerName}</p>
                        <p className="text-[11px] text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-[#C8A45D] text-[#C8A45D]' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun avis pour le moment. Soyez le premier a partager votre experience !
          </div>
        )}
      </section>
    </div>
  );
}
