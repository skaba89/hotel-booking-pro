'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileBarChart,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useToast } from '@/components/ui/toast';
import { getFinancialReport, type FinancialReport } from '@/lib/api';

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

const METHOD_LABELS: Record<string, string> = {
  STRIPE: 'Carte (Stripe)',
  PAYPAL: 'PayPal',
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  WAVE: 'Wave',
  PAY_AT_HOTEL: "Paiement à l'hôtel",
};

const fmtMoney = (n: any, currency = 'GNF') =>
  `${Number(n || 0).toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');

const iso = (d: Date) => d.toISOString().slice(0, 10);

// ---- Presets de période ----
function presetRange(key: string): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case 'thisMonth':
      return { from: iso(new Date(y, m, 1)), to: iso(now) };
    case 'lastMonth':
      return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
    case 'last30':
      return { from: iso(new Date(now.getTime() - 29 * 86400000)), to: iso(now) };
    case 'thisYear':
      return { from: iso(new Date(y, 0, 1)), to: iso(now) };
    default:
      return { from: iso(new Date(y, m, 1)), to: iso(now) };
  }
}

export default function AdminReportsPage() {
  const { toast } = useToast();
  const initial = presetRange('thisMonth');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getFinancialReport({ from, to })
      .then(setReport)
      .catch((e: any) => toast(e.message || 'Erreur de chargement', 'error'))
      .finally(() => setLoading(false));
  }, [from, to, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (key: string) => {
    const r = presetRange(key);
    setFrom(r.from);
    setTo(r.to);
  };

  // ---- Export CSV ----
  const exportCsv = () => {
    if (!report) return;
    const esc = (val: any) => {
      let s = String(val ?? '').replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return `"${s}"`;
    };
    const lines: string[] = [];
    lines.push(`Rapport financier`);
    lines.push(`Période,${fmtDate(report.period.from)} au ${fmtDate(report.period.to)}`);
    lines.push('');
    lines.push('Synthèse');
    lines.push(`Recettes encaissées,${report.totalRevenue}`);
    lines.push(`Total dépenses,${report.totalExpenses}`);
    lines.push(`Bénéfice net,${report.netProfit}`);
    lines.push('');
    lines.push('RECETTES');
    lines.push(['Date', 'Référence', 'Client', 'Méthode', 'Montant', 'Devise'].map(esc).join(','));
    report.revenues.forEach((r) =>
      lines.push(
        [fmtDate(r.date), r.reference, r.customer, METHOD_LABELS[r.method] || r.method, r.amount, r.currency]
          .map(esc)
          .join(','),
      ),
    );
    lines.push('');
    lines.push('DÉPENSES');
    lines.push(['Date', 'Référence', 'Catégorie', 'Description', 'Fournisseur', 'Montant', 'Devise'].map(esc).join(','));
    report.expenses.forEach((e) =>
      lines.push(
        [fmtDate(e.date), e.reference, CATEGORY_LABELS[e.category] || e.category, e.description, e.vendor, e.amount, e.currency]
          .map(esc)
          .join(','),
      ),
    );
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-financier_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Impression / PDF (fenêtre dédiée pour un rendu propre) ----
  const printReport = () => {
    if (!report) return;
    const periodLabel = `${fmtDate(report.period.from)} au ${fmtDate(report.period.to)}`;
    const revenueRows = report.revenues
      .map(
        (r) =>
          `<tr><td>${fmtDate(r.date)}</td><td>${r.reference}</td><td>${r.customer}</td><td>${
            METHOD_LABELS[r.method] || r.method
          }</td><td class="num">${fmtMoney(r.amount, r.currency)}</td></tr>`,
      )
      .join('');
    const expenseRows = report.expenses
      .map(
        (e) =>
          `<tr><td>${fmtDate(e.date)}</td><td>${e.reference}</td><td>${
            CATEGORY_LABELS[e.category] || e.category
          }</td><td>${e.description}</td><td class="num">${fmtMoney(e.amount, e.currency)}</td></tr>`,
      )
      .join('');
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport financier ${periodLabel}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:32px;font-size:12px}
  h1{font-size:20px;margin:0 0 4px} h2{font-size:14px;margin:24px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px}
  .muted{color:#6b7280;font-size:12px;margin-bottom:16px}
  .cards{display:flex;gap:12px;margin:16px 0}
  .card{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px}
  .card .label{font-size:11px;color:#6b7280} .card .value{font-size:16px;font-weight:bold;margin-top:2px}
  .pos{color:#047857} .neg{color:#dc2626}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee} th{background:#f9fafb;font-size:11px;text-transform:uppercase;color:#6b7280}
  .num{text-align:right;white-space:nowrap} tfoot td{font-weight:bold;border-top:2px solid #d1d5db}
  .empty{color:#9ca3af;font-style:italic;padding:8px}
  @media print{body{margin:12mm}}
</style></head><body>
  <h1>Hôtel SETIFANA — Rapport financier</h1>
  <div class="muted">Période : ${periodLabel} &nbsp;•&nbsp; Édité le ${new Date().toLocaleDateString('fr-FR')}</div>
  <div class="cards">
    <div class="card"><div class="label">Recettes encaissées</div><div class="value pos">${fmtMoney(report.totalRevenue)}</div></div>
    <div class="card"><div class="label">Total dépenses</div><div class="value neg">${fmtMoney(report.totalExpenses)}</div></div>
    <div class="card"><div class="label">Bénéfice net</div><div class="value ${report.netProfit >= 0 ? 'pos' : 'neg'}">${fmtMoney(report.netProfit)}</div></div>
  </div>
  <h2>Recettes (${report.revenues.length})</h2>
  <table><thead><tr><th>Date</th><th>Référence</th><th>Client</th><th>Méthode</th><th class="num">Montant</th></tr></thead>
  <tbody>${revenueRows || '<tr><td colspan="5" class="empty">Aucune recette sur la période</td></tr>'}</tbody>
  <tfoot><tr><td colspan="4">Total recettes</td><td class="num">${fmtMoney(report.totalRevenue)}</td></tr></tfoot></table>
  <h2>Dépenses (${report.expenses.length})</h2>
  <table><thead><tr><th>Date</th><th>Référence</th><th>Catégorie</th><th>Description</th><th class="num">Montant</th></tr></thead>
  <tbody>${expenseRows || '<tr><td colspan="5" class="empty">Aucune dépense sur la période</td></tr>'}</tbody>
  <tfoot><tr><td colspan="4">Total dépenses</td><td class="num">${fmtMoney(report.totalExpenses)}</td></tr></tfoot></table>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      toast('Veuillez autoriser les fenêtres popup pour imprimer', 'error');
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-[#C8A45D]" />
            <h1 className="text-xl font-bold text-gray-900">Rapports financiers</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={!report}>
              <Download className="w-4 h-4 mr-1" />Exporter CSV
            </Button>
            <Button onClick={printReport} disabled={!report}>
              <Printer className="w-4 h-4 mr-1" />Imprimer / PDF
            </Button>
          </div>
        </div>

        {/* Sélecteur de période */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Du</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Au</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button onClick={load}>
                <RefreshCw className="w-4 h-4 mr-1" />Générer
              </Button>
              <div className="flex flex-wrap gap-1.5 ml-auto">
                {[
                  ['thisMonth', 'Ce mois'],
                  ['lastMonth', 'Mois dernier'],
                  ['last30', '30 derniers jours'],
                  ['thisYear', 'Cette année'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center text-gray-400 py-16">Chargement…</div>
        ) : report ? (
          <>
            {/* Synthèse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Recettes encaissées</p>
                    <p className="text-lg font-bold text-gray-900">{fmtMoney(report.totalRevenue)}</p>
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
                    <p className="text-lg font-bold text-gray-900">{fmtMoney(report.totalExpenses)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${report.netProfit >= 0 ? 'bg-[#C8A45D]/20 text-[#8a6d2f]' : 'bg-red-100 text-red-700'}`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bénéfice net</p>
                    <p className={`text-lg font-bold ${report.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {fmtMoney(report.netProfit)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition par catégorie */}
            {report.byCategory.length > 0 && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Dépenses par catégorie</p>
                  <div className="space-y-2">
                    {report.byCategory.map((c) => {
                      const pct = report.totalExpenses > 0 ? Math.round((c.amount / report.totalExpenses) * 100) : 0;
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

            {/* Détail recettes */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Recettes ({report.revenues.length})</p>
                  <p className="text-sm font-bold text-emerald-700">{fmtMoney(report.totalRevenue)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Date</th>
                        <th className="text-left px-4 py-2 font-medium">Référence</th>
                        <th className="text-left px-4 py-2 font-medium">Client</th>
                        <th className="text-left px-4 py-2 font-medium">Méthode</th>
                        <th className="text-right px-4 py-2 font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.revenues.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-gray-400 py-6">Aucune recette sur la période</td></tr>
                      ) : (
                        report.revenues.map((r, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">{fmtDate(r.date)}</td>
                            <td className="px-4 py-2 font-medium text-gray-700">{r.reference}</td>
                            <td className="px-4 py-2">{r.customer}</td>
                            <td className="px-4 py-2 text-gray-500">{METHOD_LABELS[r.method] || r.method}</td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtMoney(r.amount, r.currency)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Détail dépenses */}
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Dépenses ({report.expenses.length})</p>
                  <p className="text-sm font-bold text-red-600">{fmtMoney(report.totalExpenses)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Date</th>
                        <th className="text-left px-4 py-2 font-medium">Référence</th>
                        <th className="text-left px-4 py-2 font-medium">Catégorie</th>
                        <th className="text-left px-4 py-2 font-medium">Description</th>
                        <th className="text-right px-4 py-2 font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.expenses.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-gray-400 py-6">Aucune dépense sur la période</td></tr>
                      ) : (
                        report.expenses.map((e, i) => (
                          <tr key={i} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">{fmtDate(e.date)}</td>
                            <td className="px-4 py-2 font-medium text-gray-700">{e.reference}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[e.category] || 'bg-gray-100'}`}>
                                {CATEGORY_LABELS[e.category] || e.category}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{e.description}</td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtMoney(e.amount, e.currency)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center text-gray-400 py-16">Aucune donnée.</div>
        )}
      </div>
    </AdminLayout>
  );
}
