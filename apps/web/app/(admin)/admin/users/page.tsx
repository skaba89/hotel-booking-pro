'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Edit2, Power, PowerOff, Search, X, Save,
  ShieldCheck, User, Users, Eye, EyeOff, RefreshCw, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import {
  getAdminUsers, createAdminUser, updateAdminUser,
  deactivateAdminUser, reactivateAdminUser,
  type AdminUser, type CreateUserInput, type UpdateUserInput, type UserRole,
} from '@/lib/api';

// ── Role meta ──────────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'ADMIN',    label: 'Administrateur', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { value: 'STAFF',    label: 'Personnel',       color: 'bg-blue-100 text-blue-800 border-blue-300',       icon: <User className="w-3.5 h-3.5" /> },
  { value: 'CUSTOMER', label: 'Client',          color: 'bg-gray-100 text-gray-700 border-gray-300',       icon: <Users className="w-3.5 h-3.5" /> },
];

const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

function RoleBadge({ role }: { role: UserRole }) {
  const meta = roleMap[role] ?? roleMap.CUSTOMER;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${meta.color}`}>
      {meta.icon}{meta.label}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
interface ModalProps {
  user?: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: ModalProps) {
  const { toast: showToast } = useToast();
  const isEdit = !!user;

  const [form, setForm] = useState({
    email:    user?.email    ?? '',
    fullName: user?.fullName ?? '',
    phone:    user?.phone    ?? '',
    role:     (user?.role    ?? 'STAFF') as UserRole,
    password: '',
    isActive: user?.isActive ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: k === 'isActive' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      showToast('Nom et email sont obligatoires', 'error'); return;
    }
    if (!isEdit && form.password.length < 8) {
      showToast('Mot de passe : 8 caractères minimum', 'error'); return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        const patch: UpdateUserInput = {};
        if (form.fullName !== user!.fullName) patch.fullName = form.fullName;
        if (form.phone    !== (user!.phone ?? '')) patch.phone = form.phone || undefined;
        if (form.role     !== user!.role)     patch.role     = form.role;
        if (form.isActive !== user!.isActive) patch.isActive = form.isActive;
        if (form.password) patch.password = form.password;
        await updateAdminUser(user!.id, patch);
        showToast('Utilisateur mis à jour', 'success');
      } else {
        const create: CreateUserInput = {
          email:    form.email,
          password: form.password,
          fullName: form.fullName,
          phone:    form.phone || undefined,
          role:     form.role,
        };
        await createAdminUser(create);
        showToast('Utilisateur créé avec succès', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-bold text-primary">
              {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Full name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nom complet *</label>
              <Input value={form.fullName} onChange={set('fullName')} placeholder="Alice Camara" />
            </div>

            {/* Email — read-only in edit mode */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="alice@setifana.com"
                disabled={isEdit}
                className={isEdit ? 'bg-gray-50 cursor-not-allowed' : ''}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Téléphone</label>
              <Input value={form.phone} onChange={set('phone')} placeholder="+224 6XX XXX XXX" />
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rôle *</label>
              <select
                value={form.role}
                onChange={set('role')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50 focus:border-gold outline-none"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {form.role === 'ADMIN' && '🔑 Accès total au back-office et à la gestion des utilisateurs'}
                {form.role === 'STAFF' && '👤 Accès au back-office, sans gestion des utilisateurs'}
                {form.role === 'CUSTOMER' && '🛎️ Compte client — accès au portail réservations uniquement'}
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {isEdit ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe *'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder={isEdit ? '••••••••' : 'Min. 8 caractères'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* isActive toggle (edit only) */}
            {isEdit && (
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {form.isActive ? 'Compte actif' : 'Compte désactivé'}
                </span>
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button variant="gold" onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="ml-1">{isEdit ? 'Enregistrer' : 'Créer'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { toast: showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user?: AdminUser }>({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await getAdminUsers(params);
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (u: AdminUser) => {
    try {
      if (u.isActive) {
        await deactivateAdminUser(u.id);
        showToast(`${u.fullName} désactivé(e)`, 'success');
      } else {
        await reactivateAdminUser(u.id);
        showToast(`${u.fullName} réactivé(e)`, 'success');
      }
      load();
    } catch (err: any) {
      showToast(err.message || 'Erreur', 'error');
    }
  };

  const ROLE_COUNTS = ROLES.reduce((acc, r) => {
    acc[r.value] = users.filter(u => u.role === r.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">Gestion des utilisateurs</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} compte{total !== 1 ? 's' : ''} au total</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="gold" onClick={() => setModal({ open: true })}>
              <Plus className="w-4 h-4 mr-1" /> Nouvel utilisateur
            </Button>
          </div>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {ROLES.map(r => (
            <Card key={r.value} className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setRoleFilter(roleFilter === r.value ? '' : r.value)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  r.value === 'ADMIN' ? 'bg-purple-100' : r.value === 'STAFF' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {r.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">{ROLE_COUNTS[r.value] ?? 0}</p>
                  <p className="text-xs text-gray-500">{r.label}{ROLE_COUNTS[r.value] !== 1 ? 's' : ''}</p>
                </div>
                {roleFilter === r.value && (
                  <span className="ml-auto text-xs bg-gold/20 text-amber-800 px-2 py-0.5 rounded-full">Filtre actif</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold/50 outline-none"
          >
            <option value="">Tous les rôles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Utilisateur</th>
                      <th className="text-left px-4 py-3">Rôle</th>
                      <th className="text-left px-4 py-3">Email vérifié</th>
                      <th className="text-left px-4 py-3">Statut</th>
                      <th className="text-left px-4 py-3">Créé le</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'STAFF' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {u.fullName[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.fullName}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                              {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-4 py-3">
                          {u.emailVerifiedAt ? (
                            <span className="text-green-600 text-xs">✓ Vérifié</span>
                          ) : (
                            <span className="text-amber-500 text-xs">⚠ Non vérifié</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {u.isActive ? '● Actif' : '● Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setModal({ open: true, user: u })}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`p-1.5 rounded transition-colors ${
                                u.isActive
                                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={u.isActive ? 'Désactiver' : 'Réactiver'}
                            >
                              {u.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
                <span className="text-gray-500">{total} utilisateurs</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Préc.
                  </Button>
                  <span className="px-3 py-1 text-gray-700 font-medium">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Suiv.
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      {modal.open && (
        <UserModal user={modal.user} onClose={() => setModal({ open: false })} onSaved={load} />
      )}
    </AdminLayout>
  );
}
