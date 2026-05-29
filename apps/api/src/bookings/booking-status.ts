export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/**
 * Machine à états des réservations. Une clé = statut courant ; la valeur = la
 * liste des statuts vers lesquels une transition est autorisée. Les états
 * terminaux (COMPLETED, CANCELLED, NO_SHOW) n'autorisent aucune transition.
 */
export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Indique si la transition `from -> to` est autorisée par la machine à états. */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from as BookingStatus] || [];
  return allowed.includes(to as BookingStatus);
}

/** États terminaux : aucune transition sortante n'est autorisée. */
const TERMINAL_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

/** Libellés français des statuts, pour des messages d'erreur lisibles. */
export const STATUS_LABELS_FR: Record<BookingStatus, string> = {
  PENDING: 'en attente',
  CONFIRMED: 'confirmée',
  COMPLETED: 'terminée',
  CANCELLED: 'annulée',
  NO_SHOW: 'no-show',
};

/**
 * Construit un message d'erreur clair (FR) pour une transition refusée, en
 * distinguant les trois cas fréquents : statut déjà atteint, état terminal,
 * et transition non autorisée. Le statut a probablement changé entre-temps
 * (ex. réservation confirmée automatiquement après paiement).
 */
export function transitionErrorMessage(from: string, to: string): string {
  const fromLabel = STATUS_LABELS_FR[from as BookingStatus] || from;
  if (from === to) {
    return `Cette réservation est déjà ${fromLabel}.`;
  }
  if (TERMINAL_STATUSES.includes(from as BookingStatus)) {
    return `Cette réservation est ${fromLabel} : son statut ne peut plus être modifié.`;
  }
  const toLabel = STATUS_LABELS_FR[to as BookingStatus] || to;
  return `Transition impossible : une réservation ${fromLabel} ne peut pas passer à « ${toLabel} ».`;
}
