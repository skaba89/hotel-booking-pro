'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { RoomImageManager } from '@/components/admin/room-image-manager';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

export default function AdminNewRoomPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    pricePerNight: '',
    capacity: '2',
    adultsCapacity: '2',
    childrenCapacity: '1',
    bedType: 'Double',
    sizeM2: '',
    status: 'AVAILABLE',
    isFeatured: false,
    amenities: [] as string[],
  });

  useEffect(() => {
  }, []);

  const amenityOptions = ['wifi', 'air_conditioning', 'tv', 'safe', 'minibar', 'balcony', 'room_service', 'breakfast', 'pool', 'spa', 'gym', 'parking', 'laundry', 'restaurant', 'sea_view', 'conference'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const room = await api.post<any>('/admin/rooms', {
        ...form,
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        adultsCapacity: Number(form.adultsCapacity),
        childrenCapacity: Number(form.childrenCapacity),
        sizeM2: form.sizeM2 ? Number(form.sizeM2) : undefined,
      });
      setCreatedRoom(room);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const reloadCreatedRoom = async () => {
    if (!createdRoom) return;
    try {
      const updated = await api.get<any>(`/admin/rooms`);
      const rooms = updated.data || updated || [];
      const found = rooms.find((r: any) => r.id === createdRoom.id);
      if (found) setCreatedRoom(found);
    } catch {}
  };

  // Step 2: Room created — show image upload
  if (createdRoom) {
    return (
      <AdminLayout>
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chambre créée !</h1>
              <p className="text-sm text-gray-500">Ajoutez maintenant des photos pour <strong>{createdRoom.name}</strong></p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <RoomImageManager
                roomId={createdRoom.id}
                images={createdRoom.images || []}
                onImagesChange={reloadCreatedRoom}
              />
            </CardContent>
          </Card>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" onClick={() => router.push('/admin/rooms')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux chambres
            </Button>
            <Button variant="gold" onClick={() => {
              setCreatedRoom(null);
              setForm({
                name: '', description: '', shortDescription: '', pricePerNight: '',
                capacity: '2', adultsCapacity: '2', childrenCapacity: '1',
                bedType: 'Double', sizeM2: '', status: 'AVAILABLE', isFeatured: false, amenities: [],
              });
            }}>
              Créer une autre chambre
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Step 1: Room creation form
  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-primary mb-6">Ajouter une chambre</h1>
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div><label className="text-sm font-medium">Nom *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Description courte</label><Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Description complète</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Prix par nuit (GNF) *</label><Input type="number" value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })} required /></div>
                <div><label className="text-sm font-medium">Superficie (m²)</label><Input type="number" value={form.sizeM2} onChange={(e) => setForm({ ...form, sizeM2: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Capacité totale</label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Adultes max</label><Input type="number" value={form.adultsCapacity} onChange={(e) => setForm({ ...form, adultsCapacity: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Enfants max</label><Input type="number" value={form.childrenCapacity} onChange={(e) => setForm({ ...form, childrenCapacity: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Type de lit</label><Input value={form.bedType} onChange={(e) => setForm({ ...form, bedType: e.target.value })} /></div>
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="AVAILABLE">Disponible</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="DISABLED">Désactivée</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Équipements</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenityOptions.map((a) => (
                    <label key={a} className="flex items-center space-x-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.amenities.includes(a)} onChange={(e) => {
                        setForm({ ...form, amenities: e.target.checked ? [...form.amenities, a] : form.amenities.filter((x) => x !== a) });
                      }} className="rounded" />
                      <span className="capitalize">{a.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                <span className="text-sm font-medium">Chambre en vedette (affichée en accueil)</span>
              </label>
              <Button variant="gold" size="lg" type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création...' : 'Créer la chambre'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
}
