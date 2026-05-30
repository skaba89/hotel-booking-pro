'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Send,
  Download,
  FileText,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import {
  getAdminDocuments,
  createDocument,
  updateDocument,
  updateDocumentStatus,
  convertDocumentToInvoice,
  sendDocumentByEmail,
  deleteDocument,
  documentPdfUrl,
  type CreateDocumentInput,
} from '@/lib/api';

// ---- Référentiels (miroir du back) ----
const TYPE_LABELS: Record<string, string> = { QUOTE: 'Devis', INVOICE: 'Facture' };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-200 text-gray-500 line-through',
};

// Transitions autorisées par type (miroir de document-status.ts)
const VALID_TRANSITIONS: Record<string, Record<string, string[]>> = {
  QUOTE: {
    DRAFT: ['SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    SENT: ['DRAFT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    ACCEPTED: [],
    REJECTED: ['DRAFT'],
    EXPIRED: ['DRAFT'],
  },
  INVOICE: {
    DRAFT: ['SENT', 'PAID', 'CANCELLED'],
    SENT: ['DRAFT', 'PAID', 'CANCELLED'],
    PAID: [],
    CANCELLED: ['DRAFT'],
  },
};

const EDITABLE_STATUSES = ['DRAFT', 'SENT'];

type LineForm = { description: string; quantity: string; unitPrice: string };

type DocForm = {
  type: 'QUOTE' | 'INVOICE';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  currency: string;
  taxRate: string;
  discountAmount: string;
  dueDate: string;
  notes: string;
  lines: LineForm[];
};

const emptyLine = (): LineForm => ({ description: '', quantity: '1', unitPrice: '' });

const emptyForm = (): DocForm => ({
  type: 'QUOTE',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  currency: 'GNF',
  taxRate: '0',
  discountAmount: '0',
  dueDate: '',
  notes: '',
  lines: [emptyLine()],
});

const fmtMoney = (n: any, currency = 'GNF') =>
  `${Number(n || 0).toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // ---- modal ----
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [form, setForm] = useState<DocForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (filterType) params.type = filterType;
    if (filterStatus) params.status = filterStatus;
    if (search.trim()) params.search = search.trim();
    getAdminDocuments(params)
      .then((res) => {
        setDocs(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
      })
      .catch((e: any) => toast(e.message || 'Erreur de chargement', 'error'))
      .finally(() => setLoading(false));
  }, [page, filterType, filterStatus, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- totals preview (modal) ----
  const preview = useMemo(() => {
    const subtotal = form.lines.reduce(
      (s, l) => s + Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)),
      0,
    );
    const taxAmount = Math.round((subtotal * (Number(form.taxRate) || 0)) / 100);
    const total = Math.max(0, subtotal + taxAmount - (Number(form.discountAmount) || 0));
    return { subtotal, taxAmount, total };
  }, [form.lines, form.taxRate, form.discountAmount]);

  // ---- modal handlers ----
  const openCreate = () => {
    setEditDoc(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (d: any) => {
    setEditDoc(d);
    setForm({
      type: d.type,
      clientName: d.clientName || '',
      clientEmail: d.clientEmail || '',
      clientPhone: d.clientPhone || '',
      clientAddress: d.clientAddress || '',
      currency: d.currency || 'GNF',
      taxRate: String(Number(d.taxRate) || 0),
      discountAmount: String(Number(d.discountAmount) || 0),
      dueDate: d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 10) : '',
      notes: d.notes || '',
      lines: (d.lines || []).length
        ? d.lines.map((l: any) => ({
            description: l.description || '',
            quantity: String(Number(l.quantity)),
            unitPrice: String(Number(l.unitPrice)),
          }))
        : [emptyLine()],
    });
    setShowModal(true);
  };

  const setLine = (idx: number, patch: Partial<LineForm>) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, emptyLine()] }));
  const removeLine = (idx: number) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.length > 1 ? f.lines.filter((_, i) => i !== idx) : f.lines,
    }));

  const save = async () => {
    if (!form.clientName.trim()) return toast('Le nom du client est requis', 'error');
    if (!form.clientEmail.trim()) return toast("L'email du client est requis", 'error');
    const lines = form.lines
      .filter((l) => l.description.trim() && Number(l.unitPrice) >= 0 && l.unitPrice !== '')
      .map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity) || 1,
        unitPrice: Number(l.unitPrice) || 0,
      }));
    if (lines.length === 0) return toast('Ajoutez au moins une ligne valide', 'error');

    const payload: CreateDocumentInput = {
      type: form.type,
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      clientPhone: form.clientPhone.trim() || undefined,
      clientAddress: form.clientAddress.trim() || undefined,
      currency: form.currency || 'GNF',
      taxRate: Number(form.taxRate) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
      lines,
    };

    setSaving(true);
    try {
      if (editDoc) {
        // type non modifiable après création
        const { type, ...rest } = payload;
        await updateDocument(editDoc.id, rest);
        toast('Document mis à jour', 'success');
      } else {
        await createDocument(payload);
        toast('Document créé', 'success');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (d: any, status: string) => {
    setBusyId(d.id);
    try {
      await updateDocumentStatus(d.id, status);
      toast(`Statut → ${STATUS_LABELS[status] || status}`, 'success');
      load();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const sendEmail = async (d: any) => {
    if (!confirm(`Envoyer ${TYPE_LABELS[d.type].toLowerCase()} ${d.number} à ${d.clientEmail} ?`)) return;
    setBusyId(d.id);
    try {
      await sendDocumentByEmail(d.id);
      toast('Document envoyé par email', 'success');
      load();
    } catch (e: any) {
      toast(e.message || "Erreur lors de l'envoi", 'error');
    } finally {
      setBusyId(null);
    }
  };

  const convert = async (d: any) => {
    if (!confirm(`Convertir le devis ${d.number} en facture ?`)) return;
    setBusyId(d.id);
    try {
      const inv = await convertDocumentToInvoice(d.id);
      toast(`Facture ${inv.number} créée`, 'success');
      load();
    } catch (e: any) {
      toast(e.message || 'Erreur de conversion', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (d: any) => {
    if (!confirm(`Supprimer définitivement ${d.number} ? (brouillon uniquement)`)) return;
    setBusyId(d.id);
    try {
      await deleteDocument(d.id);
      toast('Document supprimé', 'success');
      load();
    } catch (e: any) {
      toast(e.message || 'Erreur', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const nextStatuses = (d: any): string[] =>
    (VALID_TRANSITIONS[d.type]?.[d.status] || []).filter((s) => s !== 'DRAFT' || d.status !== 'DRAFT');

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Devis &amp; Factures</h1>
            <p className="text-sm text-gray-500">{total} document(s)</p>
          </div>
          <Button variant="gold" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />Nouveau document
          </Button>
        </div>

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
                    placeholder="N°, nom ou email client..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="QUOTE">Devis</option>
                  <option value="INVOICE">Factures</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
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
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Numéro</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {docs.map((d) => {
                    const editable = EDITABLE_STATUSES.includes(d.status);
                    const transitions = nextStatuses(d);
                    const canConvert = d.type === 'QUOTE' && d.status === 'ACCEPTED' && !d.convertedInvoice;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 align-top">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <FileText className={`w-3.5 h-3.5 ${d.type === 'QUOTE' ? 'text-[#C8A45D]' : 'text-[#071B33]'}`} />
                            {d.number}
                          </div>
                          <div className="text-xs text-gray-400">{TYPE_LABELS[d.type]}</div>
                          {d.sourceQuote && (
                            <div className="text-[10px] text-gray-400">depuis {d.sourceQuote.number}</div>
                          )}
                          {d.convertedInvoice && (
                            <div className="text-[10px] text-emerald-600">→ {d.convertedInvoice.number}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-medium">{d.clientName}</div>
                          <div className="text-xs text-gray-400">{d.clientEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          <div>Émis : {fmtDate(d.issueDate || d.createdAt)}</div>
                          {d.dueDate && <div>Éch. : {fmtDate(d.dueDate)}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {fmtMoney(d.total, d.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[d.status] || 'bg-gray-100'}`}>
                            {STATUS_LABELS[d.status] || d.status}
                          </span>
                          {transitions.length > 0 && (
                            <select
                              value=""
                              disabled={busyId === d.id}
                              onChange={(e) => e.target.value && changeStatus(d, e.target.value)}
                              className="mt-1 block w-full text-xs rounded border border-gray-200 bg-white px-1 py-1 text-gray-600"
                            >
                              <option value="">Changer…</option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {editable && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openEdit(d)} disabled={busyId === d.id}>
                                <Edit className="w-3 h-3 mr-1" />Modifier
                              </Button>
                            )}
                            <a href={documentPdfUrl(d.publicToken)} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-7 text-xs" title="Télécharger le PDF">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:bg-blue-50" onClick={() => sendEmail(d)} disabled={busyId === d.id} title="Envoyer par email">
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            {canConvert && (
                              <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => convert(d)} disabled={busyId === d.id}>
                                <ArrowRightLeft className="w-3 h-3 mr-1" />Facturer
                              </Button>
                            )}
                            {d.status === 'DRAFT' && (
                              <Button size="sm" variant="ghost" className="h-7 text-red-600 hover:bg-red-50" onClick={() => remove(d)} disabled={busyId === d.id} title="Supprimer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {loading && <div className="text-center py-8 text-gray-500">Chargement...</div>}
              {!loading && docs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Aucun document. Cliquez sur &quot;Nouveau document&quot; pour créer un devis ou une facture.
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
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <h2 className="text-lg font-bold">
                {editDoc ? `Modifier ${editDoc.number}` : 'Nouveau document'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Type */}
              {!editDoc && (
                <div className="flex gap-2">
                  {(['QUOTE', 'INVOICE'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.type === t
                          ? 'bg-[#071B33] text-white border-[#071B33]'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              )}

              {/* Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom du client *</label>
                  <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Ex: Société XYZ / M. Diallo" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })} placeholder="client@exemple.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone</label>
                  <Input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} placeholder="+224 ..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse</label>
                  <Input value={form.clientAddress} onChange={(e) => setForm({ ...form, clientAddress: e.target.value })} placeholder="Conakry, ..." />
                </div>
              </div>

              {/* Lignes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold">Lignes</label>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLine}>
                    <Plus className="w-3 h-3 mr-1" />Ajouter une ligne
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.lines.map((l, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        value={l.description}
                        onChange={(e) => setLine(i, { description: e.target.value })}
                        placeholder="Description"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.quantity}
                        onChange={(e) => setLine(i, { quantity: e.target.value })}
                        placeholder="Qté"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={l.unitPrice}
                        onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                        placeholder="P.U."
                        className="w-32"
                      />
                      <div className="w-28 text-right text-sm py-2 text-gray-600 tabular-nums">
                        {Math.round((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)).toLocaleString('fr-FR')}
                      </div>
                      <button
                        onClick={() => removeLine(i)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Retirer"
                        disabled={form.lines.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paramètres financiers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Devise</label>
                  <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">TVA (%)</label>
                  <Input type="number" min="0" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Remise</label>
                  <Input type="number" min="0" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{form.type === 'QUOTE' ? 'Valable jusqu\'au' : 'Échéance'}</label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>

              {/* Totaux preview */}
              <div className="bg-gray-50 rounded-lg p-4 ml-auto max-w-xs text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span>{fmtMoney(preview.subtotal, form.currency)}</span></div>
                {Number(form.taxRate) > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">TVA ({form.taxRate}%)</span><span>{fmtMoney(preview.taxAmount, form.currency)}</span></div>
                )}
                {Number(form.discountAmount) > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Remise</span><span>-{fmtMoney(form.discountAmount, form.currency)}</span></div>
                )}
                <div className="flex justify-between font-bold text-[#071B33] border-t pt-1 mt-1">
                  <span>Total</span><span>{fmtMoney(preview.total, form.currency)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Conditions, mentions particulières..."
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
