'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

const DEPARTMENTS: { value: string; label: string }[] = [
  { value: 'HOUSEKEEPING', label: 'Femme de chambre' },
  { value: 'RECEPTION', label: 'Réception' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'KITCHEN', label: 'Cuisine' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SECURITY', label: 'Sécurité' },
  { value: 'MANAGEMENT', label: 'Direction' },
  { value: 'OTHER', label: 'Autre' },
];

const DEPT_LABEL: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.value, d.label]),
);

const DEPT_COLOR: Record<string, string> = {
  HOUSEKEEPING: 'bg-pink-100 text-pink-800',
  RECEPTION: 'bg-blue-100 text-blue-800',
  RESTAURANT: 'bg-amber-100 text-amber-800',
  KITCHEN: 'bg-orange-100 text-orange-800',
  MAINTENANCE: 'bg-slate-100 text-slate-800',
  SECURITY: 'bg-red-100 text-red-800',
  MANAGEMENT: 'bg-purple-100 text-purple-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

const SHIFT_STATUSES: { value: string; label: string }[] = [
  { value: 'SCHEDULED', label: 'Planifié' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'CANCELLED', label: 'Annulé' },
];

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-[#C8A45D]/15 text-[#8a6d2f] border-[#C8A45D]/40',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  ABSENT: 'bg-red-100 text-red-700 border-red-300',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-300 line-through',
};

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const shiftDayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const startOfWeek = (base: Date) => {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

type StaffMember = {
  id: string;
  fullName: string;
  department: string;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  hireDate?: string | null;
  notes?: string | null;
};

type Shift = {
  id: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  area?: string | null;
  status: string;
  notes?: string | null;
};

const emptyMember = {
  fullName: '',
  department: 'HOUSEKEEPING',
  position: '',
  phone: '',
  email: '',
  isActive: true,
  hireDate: '',
  notes: '',
};

export default function AdminStaffPage() {
  const { toast } = useToast();
  const [view, setView] = useState<'team' | 'planning'>('team');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- team modal ----
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [memberForm, setMemberForm] = useState<typeof emptyMember>(emptyMember);
  const [savingMember, setSavingMember] = useState(false);

  // ---- planning ----
  const [weekBase, setWeekBase] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [savingShift, setSavingShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    staffId: '',
    date: '',
    startTime: '08:00',
    endTime: '16:00',
    area: '',
    status: 'SCHEDULED',
    notes: '',
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekBase, i)),
    [weekBase],
  );

  const loadStaff = useCallback(() => {
    setLoading(true);
    api
      .get<StaffMember[]>('/admin/staff')
      .then((data) => setStaff(data || []))
      .catch((e: any) => toast(e.message || 'Erreur de chargement', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const loadShifts = useCallback(() => {
    const from = fmtDate(weekDays[0]);
    const to = fmtDate(weekDays[6]);
    api
      .get<Shift[]>(`/admin/staff/shifts?from=${from}&to=${to}`)
      .then((data) => setShifts(data || []))
      .catch((e: any) => toast(e.message || 'Erreur de chargement du planning', 'error'));
  }, [weekDays, toast]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    if (view === 'planning') loadShifts();
  }, [view, loadShifts]);

  // ---- team handlers ----
  const openAddMember = () => {
    setEditMember(null);
    setMemberForm(emptyMember);
    setShowMemberModal(true);
  };

  const openEditMember = (m: StaffMember) => {
    setEditMember(m);
    setMemberForm({
      fullName: m.fullName || '',
      department: m.department || 'HOUSEKEEPING',
      position: m.position || '',
      phone: m.phone || '',
      email: m.email || '',
      isActive: m.isActive !== false,
      hireDate: m.hireDate ? shiftDayKey(m.hireDate) : '',
      notes: m.notes || '',
    });
    setShowMemberModal(true);
  };

  const saveMember = async () => {
    if (!memberForm.fullName.trim()) {
      toast('Le nom est requis', 'error');
      return;
    }
    setSavingMember(true);
    try {
      const payload: any = {
        fullName: memberForm.fullName.trim(),
        department: memberForm.department,
        position: memberForm.position || undefined,
        phone: memberForm.phone || undefined,
        email: memberForm.email || undefined,
        isActive: memberForm.isActive,
        hireDate: memberForm.hireDate || undefined,
        notes: memberForm.notes || undefined,
      };
      if (editMember) await api.patch(`/admin/staff/${editMember.id}`, payload);
      else await api.post('/admin/staff', payload);
      setShowMemberModal(false);
      loadStaff();
      toast(editMember ? 'Membre mis à jour' : 'Membre ajouté', 'success');
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const deleteMember = async (m: StaffMember) => {
    if (!confirm(`Supprimer ${m.fullName} ? Tous ses créneaux de planning seront aussi supprimés.`)) return;
    try {
      await api.delete(`/admin/staff/${m.id}`);
      setStaff((prev) => prev.filter((s) => s.id !== m.id));
      toast('Membre supprimé', 'success');
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    }
  };

  // ---- shift handlers ----
  const openAddShift = (staffId: string, date: Date) => {
    setEditShift(null);
    setShiftForm({
      staffId,
      date: fmtDate(date),
      startTime: '08:00',
      endTime: '16:00',
      area: '',
      status: 'SCHEDULED',
      notes: '',
    });
    setShowShiftModal(true);
  };

  const openEditShift = (s: Shift) => {
    setEditShift(s);
    setShiftForm({
      staffId: s.staffId,
      date: shiftDayKey(s.date),
      startTime: s.startTime,
      endTime: s.endTime,
      area: s.area || '',
      status: s.status,
      notes: s.notes || '',
    });
    setShowShiftModal(true);
  };

  const saveShift = async () => {
    if (!shiftForm.staffId || !shiftForm.date) {
      toast('Membre et date requis', 'error');
      return;
    }
    setSavingShift(true);
    try {
      const payload: any = {
        staffId: shiftForm.staffId,
        date: shiftForm.date,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        area: shiftForm.area || undefined,
        status: shiftForm.status,
        notes: shiftForm.notes || undefined,
      };
      if (editShift) await api.patch(`/admin/staff/shifts/${editShift.id}`, payload);
      else await api.post('/admin/staff/shifts', payload);
      setShowShiftModal(false);
      loadShifts();
      toast(editShift ? 'Créneau mis à jour' : 'Créneau ajouté', 'success');
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setSavingShift(false);
    }
  };

  const deleteShift = async () => {
    if (!editShift) return;
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await api.delete(`/admin/staff/shifts/${editShift.id}`);
      setShowShiftModal(false);
      loadShifts();
      toast('Créneau supprimé', 'success');
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    }
  };

  const activeStaff = staff.filter((s) => s.isActive);
  const shiftsByKey = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    for (const s of shifts) {
      const key = `${s.staffId}|${shiftDayKey(s.date)}`;
      (map[key] ||= []).push(s);
    }
    return map;
  }, [shifts]);

  const weekLabel = `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion du personnel</h1>
            <p className="text-sm text-gray-500">
              {staff.length} membre(s) · {activeStaff.length} actif(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border bg-white p-1">
              <button
                onClick={() => setView('team')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'team' ? 'bg-[#071B33] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" /> Équipe
              </button>
              <button
                onClick={() => setView('planning')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  view === 'planning' ? 'bg-[#071B33] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CalendarDays className="w-4 h-4" /> Planning
              </button>
            </div>
            {view === 'team' && (
              <Button variant="gold" onClick={openAddMember}>
                <Plus className="w-4 h-4 mr-1" />Ajouter
              </Button>
            )}
          </div>
        </div>

        {/* ---- TEAM VIEW ---- */}
        {view === 'team' && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Nom</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Département</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Poste</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {staff.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{m.fullName}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${DEPT_COLOR[m.department] || 'bg-gray-100 text-gray-800'}`}>
                            {DEPT_LABEL[m.department] || m.department}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.position || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {m.phone && (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>
                            )}
                            {m.email && (
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</span>
                            )}
                            {!m.phone && !m.email && '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {m.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEditMember(m)}>
                              <Edit className="w-3 h-3 mr-1" />Modifier
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMember(m)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
                {!loading && staff.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Aucun membre. Cliquez sur &quot;Ajouter&quot; pour commencer.</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---- PLANNING VIEW ---- */}
        {view === 'planning' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setWeekBase(addDays(weekBase, -7))}>
                  <ChevronLeft className="w-4 h-4" /> Semaine préc.
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{weekLabel}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWeekBase(startOfWeek(new Date()))}>
                    Aujourd&apos;hui
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setWeekBase(addDays(weekBase, 7))}>
                  Semaine suiv. <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {activeStaff.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun membre actif. Ajoutez du personnel dans l&apos;onglet « Équipe ».
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-white border-b border-r px-3 py-2 text-left font-medium text-gray-600 min-w-[160px]">
                          Personnel
                        </th>
                        {weekDays.map((d, i) => (
                          <th key={i} className="border-b px-2 py-2 text-center font-medium text-gray-600 min-w-[120px]">
                            <div>{DAY_LABELS[i]}</div>
                            <div className="text-xs font-normal text-gray-400">{d.getDate()}/{d.getMonth() + 1}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeStaff.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50">
                          <td className="sticky left-0 bg-white border-b border-r px-3 py-2 align-top">
                            <div className="font-medium text-gray-900">{m.fullName}</div>
                            <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DEPT_COLOR[m.department] || 'bg-gray-100 text-gray-800'}`}>
                              {DEPT_LABEL[m.department] || m.department}
                            </span>
                          </td>
                          {weekDays.map((d, i) => {
                            const key = `${m.id}|${fmtDate(d)}`;
                            const cellShifts = shiftsByKey[key] || [];
                            return (
                              <td key={i} className="border-b px-1.5 py-1.5 align-top">
                                <div className="space-y-1">
                                  {cellShifts.map((s) => (
                                    <button
                                      key={s.id}
                                      onClick={() => openEditShift(s)}
                                      className={`w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded border ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                                    >
                                      <div className="font-semibold">{s.startTime}–{s.endTime}</div>
                                      {s.area && <div className="truncate opacity-80">{s.area}</div>}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => openAddShift(m.id, d)}
                                    className="w-full text-[11px] text-gray-400 hover:text-[#C8A45D] hover:bg-[#C8A45D]/5 rounded py-0.5 transition-colors"
                                    title="Ajouter un créneau"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ---- MEMBER MODAL ---- */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMemberModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">{editMember ? `Modifier: ${editMember.fullName}` : 'Nouveau membre'}</h2>
              <button onClick={() => setShowMemberModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom complet *</label>
                <Input value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })} placeholder="Ex: Aïssatou Diallo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Département *</label>
                  <select
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Poste</label>
                  <Input value={memberForm.position} onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })} placeholder="Ex: Gouvernante" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone</label>
                  <Input value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="+224 ..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="nom@exemple.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date d&apos;embauche</label>
                <Input type="date" value={memberForm.hireDate} onChange={(e) => setMemberForm({ ...memberForm, hireDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={memberForm.notes}
                  onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  placeholder="Informations complémentaires..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px] resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={memberForm.isActive} onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })} className="h-4 w-4 rounded" />
                  <span className="text-sm font-medium">Membre actif</span>
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowMemberModal(false)}>Annuler</Button>
              <Button variant="gold" onClick={saveMember} disabled={savingMember}>
                <Save className="w-4 h-4 mr-1" />{savingMember ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- SHIFT MODAL ---- */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowShiftModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">{editShift ? 'Modifier le créneau' : 'Nouveau créneau'}</h2>
              <button onClick={() => setShowShiftModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Membre *</label>
                <select
                  value={shiftForm.staffId}
                  onChange={(e) => setShiftForm({ ...shiftForm, staffId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Sélectionner —</option>
                  {activeStaff.map((m) => (
                    <option key={m.id} value={m.id}>{m.fullName} ({DEPT_LABEL[m.department]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date *</label>
                <Input type="date" value={shiftForm.date} onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Début</label>
                  <Input type="time" value={shiftForm.startTime} onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fin</label>
                  <Input type="time" value={shiftForm.endTime} onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Zone / Étage</label>
                <Input value={shiftForm.area} onChange={(e) => setShiftForm({ ...shiftForm, area: e.target.value })} placeholder="Ex: Étage 2, Réception, Restaurant..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Statut</label>
                <select
                  value={shiftForm.status}
                  onChange={(e) => setShiftForm({ ...shiftForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {SHIFT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px] resize-y"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between gap-2 rounded-b-xl">
              <div>
                {editShift && (
                  <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={deleteShift}>
                    <Trash2 className="w-4 h-4 mr-1" />Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowShiftModal(false)}>Annuler</Button>
                <Button variant="gold" onClick={saveShift} disabled={savingShift}>
                  <Save className="w-4 h-4 mr-1" />{savingShift ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
