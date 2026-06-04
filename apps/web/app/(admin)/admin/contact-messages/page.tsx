'use client';

import { useEffect, useState } from 'react';
import { Mail, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, string>  = { NEW: 'Nouveau', READ: 'Lu', ANSWERED: 'Répondu', ARCHIVED: 'Archivé' };
const STATUS_COLOR: Record<string, string>  = {
  NEW:      'bg-blue-100 text-blue-800',
  READ:     'bg-gray-100 text-gray-700',
  ANSWERED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-slate-100 text-slate-600',
};

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<any[]>('/admin/contact-messages' + (filter ? `?status=${filter}` : ''))
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const markAs = async (id: string, status: string) => {
    await api.patch(`/admin/contact-messages/${id}/status`, { status });
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status } : m));
  };

  const newCount = messages.filter(m => m.status === 'NEW').length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              Messages de contact
            </h1>
            {newCount > 0 && (
              <p className="text-sm text-amber-600 mt-0.5">{newCount} nouveau{newCount > 1 ? 'x' : ''} message{newCount > 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {['', 'NEW', 'READ', 'ANSWERED'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  filter === s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {s === '' ? 'Tous' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Messages list */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </CardContent>
              </Card>
            ))
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>Aucun message{filter ? ' pour ce filtre' : ''}</p>
            </div>
          ) : (
            messages.map(msg => (
              <Card key={msg.id} className={`transition-shadow hover:shadow-md ${msg.status === 'NEW' ? 'border-gold/50 bg-amber-50/30' : ''}`}>
                <CardContent className="p-4">
                  {/* Top row: name + status + actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Author line */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{msg.fullName}</span>
                        <span className="text-xs text-muted-foreground break-all">{msg.email}</span>
                        {msg.phone && <span className="text-xs text-muted-foreground">{msg.phone}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[msg.status] ?? STATUS_COLOR.READ}`}>
                          {STATUS_LABEL[msg.status] ?? msg.status}
                        </span>
                      </div>

                      {/* Subject */}
                      {msg.subject && (
                        <p className="text-sm font-medium text-gray-800 mb-1">{msg.subject}</p>
                      )}

                      {/* Message body */}
                      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(msg.createdAt)}</p>
                    </div>

                    {/* Action buttons — stack on mobile */}
                    <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
                      {msg.status === 'NEW' && (
                        <Button size="sm" variant="outline" onClick={() => markAs(msg.id, 'READ')} className="h-7 text-xs">
                          Marquer lu
                        </Button>
                      )}
                      {msg.status !== 'ANSWERED' && (
                        <Button size="sm" variant="ghost" onClick={() => markAs(msg.id, 'ANSWERED')} className="h-7 text-xs text-green-700 border border-green-200 hover:bg-green-50">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />Répondu
                        </Button>
                      )}
                      {msg.status !== 'ARCHIVED' && (
                        <Button size="sm" variant="ghost" onClick={() => markAs(msg.id, 'ARCHIVED')} className="h-7 text-xs text-gray-500">
                          Archiver
                        </Button>
                      )}
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
