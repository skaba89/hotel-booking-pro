'use client';

import { useEffect, useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/admin/contact-messages').then(setMessages).catch(console.error);
  }, []);

  const markAs = async (id: string, status: string) => {
    await api.patch(`/admin/contact-messages/${id}/status`, { status });
    setMessages(messages.map((m) => m.id === id ? { ...m, status } : m));
  };

  const statusLabel: Record<string, string> = { NEW: 'Nouveau', READ: 'Lu', ANSWERED: 'Répondu', ARCHIVED: 'Archivé' };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold text-primary mb-6">Messages de contact</h1>
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.status === 'NEW' ? 'border-gold/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{msg.fullName}</span>
                      <span className="text-xs text-muted-foreground">{msg.email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${msg.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{statusLabel[msg.status]}</span>
                    </div>
                    {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(msg.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    {msg.status === 'NEW' && <Button size="sm" variant="ghost" onClick={() => markAs(msg.id, 'READ')} className="h-7 text-xs">Marquer lu</Button>}
                    {msg.status !== 'ANSWERED' && <Button size="sm" variant="ghost" onClick={() => markAs(msg.id, 'ANSWERED')} className="h-7 text-xs text-green-600"><CheckCircle className="w-3.5 h-3.5 mr-1" />Répondu</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {messages.length === 0 && <p className="text-muted-foreground text-center py-8">Aucun message</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
