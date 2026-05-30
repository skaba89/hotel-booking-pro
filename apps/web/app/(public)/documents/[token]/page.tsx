'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDocumentByToken, documentPdfUrl } from '@/lib/api';

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
  CANCELLED: 'bg-gray-200 text-gray-500',
};

const fmtMoney = (n: any, currency = 'GNF') =>
  `${Number(n || 0).toLocaleString('fr-FR')} ${currency}`;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '-');

export default function PublicDocumentPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocumentByToken(token)
      .then(setDoc)
      .catch((e: any) => setError(e.message || 'Document introuvable'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#C8A45D]" />
        Chargement du document…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Document introuvable</h1>
        <p className="text-gray-500">{error || 'Ce lien est invalide ou a expiré.'}</p>
      </div>
    );
  }

  const isQuote = doc.type === 'QUOTE';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* En-tête actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-sm text-gray-500">{TYPE_LABELS[doc.type]}</p>
          <h1 className="text-2xl font-bold text-[#071B33]">N° {doc.number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLOR[doc.status] || 'bg-gray-100'}`}>
            {STATUS_LABELS[doc.status] || doc.status}
          </span>
          <a href={documentPdfUrl(token)} target="_blank" rel="noopener noreferrer">
            <Button variant="gold">
              <Download className="w-4 h-4 mr-2" />Télécharger le PDF
            </Button>
          </a>
        </div>
      </div>

      {/* Carte document */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Bandeau hôtel */}
        <div className="bg-[#071B33] px-6 py-5 text-white">
          <h2 className="font-serif text-xl font-bold text-[#C8A45D]">HOTEL SETIFANA</h2>
          <p className="text-xs text-white/70">Conakry, République de Guinée · contact@setifana.com</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Méta + destinataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Informations</p>
              <p><span className="text-gray-500">Date d&apos;émission :</span> {fmtDate(doc.issueDate || doc.createdAt)}</p>
              {doc.dueDate && (
                <p><span className="text-gray-500">{isQuote ? 'Valable jusqu\'au' : 'Échéance'} :</span> {fmtDate(doc.dueDate)}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Destinataire</p>
              <p className="font-medium text-gray-900">{doc.clientName}</p>
              <p className="text-gray-600">{doc.clientEmail}</p>
              {doc.clientPhone && <p className="text-gray-600">{doc.clientPhone}</p>}
              {doc.clientAddress && <p className="text-gray-600">{doc.clientAddress}</p>}
            </div>
          </div>

          {/* Lignes */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#071B33] text-white">
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium w-16">Qté</th>
                  <th className="px-3 py-2 text-right font-medium w-32">P.U.</th>
                  <th className="px-3 py-2 text-right font-medium w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(doc.lines || []).map((l: any, i: number) => (
                  <tr key={l.id || i} className={i % 2 ? 'bg-gray-50' : ''}>
                    <td className="px-3 py-2 text-gray-800">{l.description}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{Number(l.quantity)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmtMoney(l.unitPrice, doc.currency)}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{fmtMoney(l.lineTotal, doc.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="ml-auto max-w-xs text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span>{fmtMoney(doc.subtotal, doc.currency)}</span></div>
            {Number(doc.taxRate) > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">TVA ({Number(doc.taxRate)}%)</span><span>{fmtMoney(doc.taxAmount, doc.currency)}</span></div>
            )}
            {Number(doc.discountAmount) > 0 && (
              <div className="flex justify-between"><span className="text-gray-500">Remise</span><span>-{fmtMoney(doc.discountAmount, doc.currency)}</span></div>
            )}
            <div className="flex justify-between font-bold text-[#071B33] text-base border-t pt-2 mt-1">
              <span>TOTAL</span><span>{fmtMoney(doc.total, doc.currency)}</span>
            </div>
          </div>

          {/* Notes */}
          {doc.notes && (
            <div className="border-t pt-4 text-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notes</p>
              <p className="text-gray-600 whitespace-pre-line">{doc.notes}</p>
            </div>
          )}

          {doc.status === 'PAID' && (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" /> Cette facture a été réglée. Merci de votre confiance.
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        {isQuote
          ? 'Ce devis est sans engagement. Pour l\'accepter, contactez l\'hôtel.'
          : 'Merci de votre confiance. Paiement à réception, sauf mention contraire.'}
      </p>
    </div>
  );
}
