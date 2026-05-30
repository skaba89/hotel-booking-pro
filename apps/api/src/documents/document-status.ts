export type DocumentType = 'QUOTE' | 'INVOICE';

export type DocumentStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'PAID'
  | 'CANCELLED';

/**
 * Machine à états des documents commerciaux, paramétrée par type.
 *
 * Devis (QUOTE)   : DRAFT ⇄ SENT → ACCEPTED | REJECTED | EXPIRED
 *                   (un devis refusé/expiré peut être rouvert en DRAFT)
 * Facture (INVOICE): DRAFT ⇄ SENT → PAID | CANCELLED
 *                   (une facture annulée peut être rouverte en DRAFT)
 *
 * Une clé = statut courant ; la valeur = statuts d'arrivée autorisés.
 */
export const VALID_TRANSITIONS: Record<DocumentType, Partial<Record<DocumentStatus, DocumentStatus[]>>> = {
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

/** Statuts dans lesquels les lignes/montants du document restent modifiables. */
const EDITABLE_STATUSES: DocumentStatus[] = ['DRAFT', 'SENT'];

/** Libellés français des types. */
export const TYPE_LABELS_FR: Record<DocumentType, string> = {
  QUOTE: 'devis',
  INVOICE: 'facture',
};

/** Article démonstratif accordé en genre (devis = masculin, facture = féminin). */
const TYPE_ARTICLE_FR: Record<DocumentType, string> = {
  QUOTE: 'ce',
  INVOICE: 'cette',
};

/** Libellés français des statuts (selon le type pour SENT). */
export const STATUS_LABELS_FR: Record<DocumentStatus, string> = {
  DRAFT: 'brouillon',
  SENT: 'envoyé',
  ACCEPTED: 'accepté',
  REJECTED: 'refusé',
  EXPIRED: 'expiré',
  PAID: 'payée',
  CANCELLED: 'annulée',
};

/** Indique si la transition `from -> to` est autorisée pour ce type de document. */
export function isValidDocumentTransition(
  type: string,
  from: string,
  to: string,
): boolean {
  const byType = VALID_TRANSITIONS[type as DocumentType];
  if (!byType) return false;
  const allowed = byType[from as DocumentStatus] || [];
  return allowed.includes(to as DocumentStatus);
}

/** Vrai si le document peut encore être modifié (lignes, montants, client). */
export function isEditable(status: string): boolean {
  return EDITABLE_STATUSES.includes(status as DocumentStatus);
}

/**
 * Un devis ne peut être converti en facture que s'il est de type QUOTE et au
 * statut ACCEPTED (le client a validé). Garde-fou contre les conversions
 * prématurées ou répétées (la conversion lie sourceQuoteId, unique).
 */
export function canConvertToInvoice(type: string, status: string): boolean {
  return type === 'QUOTE' && status === 'ACCEPTED';
}

/** Statut considéré « payé/encaissé » pour une facture. */
export function isPaidStatus(status: string): boolean {
  return status === 'PAID';
}

/** Construit un message d'erreur clair (FR) pour une transition refusée. */
export function transitionErrorMessage(type: string, from: string, to: string): string {
  if (!VALID_TRANSITIONS[type as DocumentType]) {
    return `Type de document inconnu : ${type}.`;
  }
  const typeLabel = TYPE_LABELS_FR[type as DocumentType] || type;
  const article = TYPE_ARTICLE_FR[type as DocumentType] || 'ce';
  const articleCap = article.charAt(0).toUpperCase() + article.slice(1);
  const fromLabel = STATUS_LABELS_FR[from as DocumentStatus] || from;
  const toLabel = STATUS_LABELS_FR[to as DocumentStatus] || to;
  if (from === to) {
    return `${articleCap} ${typeLabel} est déjà au statut « ${fromLabel} ».`;
  }
  return `Transition impossible pour ${article} ${typeLabel} : « ${fromLabel} » ne peut pas passer à « ${toLabel} ».`;
}
