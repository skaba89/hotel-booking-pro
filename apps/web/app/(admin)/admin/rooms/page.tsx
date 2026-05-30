'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { RoomImageManager } from '@/components/admin/room-image-manager';
import { useToast } from '@/components/ui/toast';
import { getRooms, api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function AdminRoomsPage() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const loadRooms = () => {
    setLoading(true);
    getRooms({ limit: '50' }).then((data) => {
      const roomList = data.data || data || [];
      setRooms(roomList);
      // Update editRoom if it's open so images refresh
      if (editRoom) {
        const updated = roomList.find((r: any) => r.id === editRoom.id);
        if (updated) setEditRoom(updated);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette chambre ? Cette action est irreversible.')) return;
    try {
      await api.delete(`/admin/rooms/${id}`);
      setRooms(rooms.filter((r) => r.id !== id));
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const openEdit = (room: any) => {
    setEditRoom(room);
    setEditForm({
      name: room.name || '',
      shortDescription: room.shortDescription || '',
      pricePerNight: room.pricePerNight?.toString() || '',
      capacity: room.capacity?.toString() || '2',
      sizeM2: room.sizeM2?.toString() || '',
      bedType: room.bedType || '',
      status: room.status || 'AVAILABLE',
      isFeatured: room.isFeatured || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editRoom) return;
    setSaving(true);
    try {
      await api.patch(`/admin/rooms/${editRoom.id}`, {
        name: editForm.name,
        shortDescription: editForm.shortDescription,
        pricePerNight: Number(editForm.pricePerNight),
        capacity: Number(editForm.capacity),
        sizeM2: editForm.sizeM2 ? Number(editForm.sizeM2) : undefined,
        bedType: editForm.bedType,
        status: editForm.status,
        isFeatured: editForm.isFeatured,
      });
      setEditRoom(null);
      loadRooms();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chambres</h1>
            <p className="text-sm text-gray-500">{rooms.length} chambre(s) au total</p>
          </div>
          <Link href="/admin/rooms/new">
            <Button variant="gold"><Plus className="w-4 h-4 mr-1" />Ajouter une chambre</Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Prix/nuit</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Capacite</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Surface</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Photos</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Vedette</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{room.name}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{room.shortDescription}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(room.pricePerNight))}</td>
                      <td className="px-4 py-3">{room.capacity} pers.</td>
                      <td className="px-4 py-3">{room.sizeM2 ? `${Number(room.sizeM2)} m²` : '-'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs">
                          <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                          {room.images?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${room.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : room.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {room.status === 'AVAILABLE' ? 'Disponible' : room.status === 'MAINTENANCE' ? 'Maintenance' : 'Desactivee'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{room.isFeatured ? '⭐' : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(room)}>
                            <Edit className="w-3 h-3 mr-1" />Modifier
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(room.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && rooms.length === 0 && <div className="text-center py-8 text-gray-500">Aucune chambre. Cliquez sur &quot;Ajouter&quot; pour commencer.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {editRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditRoom(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">Modifier: {editRoom.name}</h2>
              <button onClick={() => setEditRoom(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom *</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description courte</label>
                <Input value={editForm.shortDescription} onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Prix/nuit (GNF) *</label>
                  <Input type="number" value={editForm.pricePerNight} onChange={(e) => setEditForm({ ...editForm, pricePerNight: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Surface (m²)</label>
                  <Input type="number" value={editForm.sizeM2} onChange={(e) => setEditForm({ ...editForm, sizeM2: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Capacite</label>
                  <Input type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type de lit</label>
                  <Input value={editForm.bedType} onChange={(e) => setEditForm({ ...editForm, bedType: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Statut</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="AVAILABLE">Disponible</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="DISABLED">Desactivee</option>
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.isFeatured} onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })} className="h-4 w-4 rounded" />
                    <span className="text-sm font-medium">Chambre en vedette</span>
                  </label>
                </div>
              </div>

              {/* Section Photos */}
              <div className="border-t pt-4">
                <RoomImageManager
                  roomId={editRoom.id}
                  images={editRoom.images || []}
                  onImagesChange={loadRooms}
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setEditRoom(null)}>Annuler</Button>
              <Button variant="gold" onClick={handleSaveEdit} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
