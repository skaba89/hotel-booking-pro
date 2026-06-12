'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Save, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { api, getServices } from '@/lib/api';

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    isActive: true,
    sortOrder: 0,
  });

  const loadServices = () => {
    setLoading(true);
    getServices()
      .then((data) => setServices(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openAdd = () => {
    setEditService(null);
    setForm({ name: '', slug: '', description: '', icon: '', isActive: true, sortOrder: services.length });
    setShowModal(true);
  };

  const openEdit = (service: any) => {
    setEditService(service);
    setForm({
      name: service.name || '',
      slug: service.slug || '',
      description: service.description || '',
      icon: service.icon || '',
      isActive: service.isActive !== false,
      sortOrder: service.sortOrder || 0,
    });
    setShowModal(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({ ...form, name, slug: editService ? form.slug : generateSlug(name) });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Le nom est requis', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description,
        icon: form.icon,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
      };

      if (editService) {
        await api.patch(`/admin/services/${editService.id}`, payload);
      } else {
        await api.post('/admin/services', payload);
      }
      setShowModal(false);
      loadServices();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce service ? Cette action est irreversible.')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      setServices(services.filter((s) => s.id !== id));
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const toggleActive = async (service: any) => {
    try {
      await api.patch(`/admin/services/${service.id}`, { isActive: !service.isActive });
      loadServices();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            <p className="text-sm text-gray-500">{services.length} service(s) au total</p>
          </div>
          <Button variant="gold" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1" />Ajouter un service
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Ordre</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Grip className="w-4 h-4" />
                          <span className="text-sm">{service.sortOrder}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {service.icon && <span className="text-lg">{service.icon}</span>}
                          <span className="font-medium text-gray-900">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{service.slug}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-600 truncate max-w-[250px]">{service.description || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(service)}
                          className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                            service.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {service.isActive ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(service)}>
                            <Edit className="w-3 h-3 mr-1" />Modifier
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(service.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && services.length === 0 && (
                <div className="text-center py-8 text-gray-500">Aucun service. Cliquez sur &quot;Ajouter&quot; pour commencer.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">{editService ? `Modifier: ${editService.name}` : 'Nouveau service'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom du service *</label>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Restaurant, Piscine, Spa..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Slug (URL)</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="restaurant"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Genere automatiquement a partir du nom</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du service..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Icone (emoji ou code)</label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    placeholder="🍽️"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ordre d&apos;affichage</label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm font-medium">Service actif (visible sur le site)</span>
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="gold" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
