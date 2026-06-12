'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import {
  getAdminExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
  type CreateExpenseInput,
  type ExpenseCategory,
  type ExpensePaymentMethod,
} from '@/lib/api';

// ---- Référentiels (miroir du back) ----
const CATEGORY_LABELS: Record<string, string> = {
  SUPPLIES: 'Fournitures',
  SALARIES: 'Salaires',
  UTILITIES: 'Énergie / Eau',
  MAINTENANCE: 'Maintenance',
  MARKETING: 'Marketing',
  FOOD_BEVERAGE: 'Nourriture & Boissons',
  RENT: 'Loyer',
  TAXES: 'Taxes',
  OTHER: 'Autre',
};

const CATEGORY_COLOR: Record<string, string> = {
  SUPPLIES: 'bg-blue-100 text-blue-800',
  SALARIES: 'bg-purple-100 text-purple-800',
  UTILITIES: 'bg-amber-100 text-amber-800',
  MAINTENANCE: 'bg-orange-100 text-orange-800',
  MARKETING: 'bg-pink-100 text-pink-800',
  FOOD_BEVERAGE: 'bg-emerald-100 text-emerald-800',
  RENT: 'bg-indigo-100 text-indigo-800',
  TAXES: 'bg-red-100 text-red-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Espèces',
  BANK_TRANSFER: 'Virement',
  MOBILE_MONEY: 'Mobile Money',
  CARD: 'Carte',
  CHECK: 'Chèque',
  OTHER: 'Autre',
};

type ExpenseForm = {
  category: ExpenseCategory;
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  vendor: string;
  invoiceNumber: string;
  paymentMethod: ExpensePaymentMethod;
  receiptUrl: string;
  notes: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): ExpenseForm => ({
  category: 'OTHER',
  description: '',
  amount: '',
  currency: 'GNF',
  expenseDate: todayISO(),
  vendor: '',
  invoiceNumber: '',
  paymentMethod: 'CASH',
  receiptUrl: '',
  notes: '',
});

const fmtMoney = (n: any, currency = 'GNF') =>
  `${Number(n || 0).toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');

export default function AdminExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<any>(null);

  // ---- modal ----
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<any>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (filterCategory) params.category = filterCategory;
    if (search.trim()) params.search = search.trim();
    getAdminExpenses(params)
      .then((res) => {
        setExpenses(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
        setTotalAmount(res.totalAmount || 0);
      })
      .catch((e: any) => toast(e.message || 'Erreur de chargement', 'error'))
      .finally(() => setLoading(false));
  }, [page, filterCategory, search, toast]);

  const loadSummary = useCallback(() => {
    getExpensesSummary()
      .then(setSummary)
      .catch(() => {
        /* synthèse non bloquante */
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ---- modal handlers ----
  const openCreate = () => {
    setEditExpense(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (x: any) => {
    setEditExpense(x);
    setForm({
      category: x.category,
      description: x.description || '',
      amount: String(Number(x.amount) || 0),
      currency: x.currency || 'GNF',
      expenseDate: x.expenseDate ? new Date(x.expenseDate).toISOString().slice(0, 10) : todayISO(),
      vendor: x.vendor || '',
      invoiceNumber: x.invoiceNumber || '',
      paymentMethod: x.paymentMethod || 'CASH',
      receiptUrl: x.receiptUrl || '',
      notes: x.notes || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.description.trim()) return toast('La description est requise', 'error');
    if (form.amount === '' || Number(form.amount) < 0)
      return toast('Le montant doit être un nombre positif', 'error');
    if (!form.expenseDate) return toast('La date est requise', 'error');

    const payload: CreateExpenseInput = {
      category: form.category,
      description: form.description.trim(),
      amount: Number(form.amount),
      currency: form.currency || 'GNF',
      expenseDate: form.expenseDate,
      vendor: form.vendor.trim() || undefined,
      invoiceNumber: form.invoiceNumber.trim() || undefined,
      paymentMethod: form.paymentMethod,
      receiptUrl: form.receiptUrl.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editExpense) {
        await updateExpense(editExpense.id, payload);
        toast('Dépense mise à jour', 'success');
      } else {
        await createExpense(payload);
        toast('Dépense enregistrée', 'success');
      }
      setShowModal(false);
      load();
      loadSummary();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (x: any) => {
    if (!confirm(`Supprimer définitivement la dépense ${x.reference} ?`)) return;
    setBusyId(x.id);
    try {
      await deleteExpense(x.id);
      toast('Dépense supprimée', 'success');
      load();
      loadSummary();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
            <p className="text-sm text-gray-500">{total} dépense(s)</p>
          </div>
          <Button variant="gold" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />Nouvelle dépense
          </Button>
        </div>

        {/* Synthèse financière */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recettes encaissées</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(summary.totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-700">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total dépenses</p>
                  <p className="text-lg font-bold text-gray-900">{fmtMoney(summary.totalExpenses)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${summary.netProfit >= 0 ? 'bg-[#C8A45D]/20 text-[#8a6d2f]' : 'bg-red-100 text-red-700'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bénéfice net</p>
                  <p className={`text-lg font-bold ${summary.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {fmtMoney(summary.netProfit)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Répartition par catégorie */}
        {summary?.byCategory?.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Répartition par catégorie</p>
              <div className="space-y-2">
                {summary.byCategory.map((c: any) => {
                  const pct = summary.totalExpenses > 0 ? Math.round((c.amount / summary.totalExpenses) * 100) : 0;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-44 shrink-0 text-center ${CATEGORY_COLOR[c.category] || 'bg-gray-100'}`}>
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C8A45D]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                      <span className="text-sm font-medium text-gray-800 w-32 text-right tabular-nums">
                        {fmtMoney(c.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtres */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Réf., description, fournisseur..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Catégorie</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Toutes</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Catégorie</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((x) => (
                    <tr key={x.id} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{x.reference}</div>
                        <div className="text-xs text-gray-400">{PAYMENT_LABELS[x.paymentMethod] || x.paymentMethod}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">{x.description}</div>
                        {x.vendor && <div className="text-xs text-gray-400">Fournisseur : {x.vendor}</div>}
                        {x.invoiceNumber && <div className="text-xs text-gray-400">Facture n° {x.invoiceNumber}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLOR[x.category] || 'bg-gray-100'}`}>
                          {CATEGORY_LABELS[x.category] || x.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{fmtDate(x.expenseDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmtMoney(x.amount, x.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(x)} disabled={busyId === x.id}>
                            <Edit className="w-3 h-3 mr-1" />Modifier
                          </Button>
                          {x.receiptUrl && (
                            <a href={x.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" title="Voir le justificatif">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50" onClick={() => remove(x)} disabled={busyId === x.id} title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && expenses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Aucune dépense. Cliquez sur &quot;Nouvelle dépense&quot; pour en enregistrer une.
                </div>
              )}
              {!loading && expenses.length > 0 && (
                <div className="flex justify-end px-4 py-3 border-t bg-gray-50 text-sm">
                  <span className="text-gray-500 mr-2">Total (filtré) :</span>
                  <span className="font-semibold text-gray-900">{fmtMoney(totalAmount)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* ---- MODAL ---- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-lg font-bold">
                {editExpense ? `Modifier ${editExpense.reference}` : 'Nouvelle dépense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium mb-1 block">Description *</label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Achat de draps, facture EDG mars..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Moyen de paiement</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as ExpensePaymentMethod })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Montant *</label>
                  <Input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Devise</label>
                  <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date de la dépense *</label>
                  <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fournisseur / bénéficiaire</label>
                  <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Ex: EDG, Sotelma..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">N° de facture (justificatif)</label>
                  <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="Ex: FA-2026-001" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lien du justificatif</label>
                  <Input value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Précisions éventuelles..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[70px] resize-y"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="gold" onClick={save} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
