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
  // Réactivation admin : un statut terminal peut être ramené à CONFIRMED pour
  // corriger une erreur (no-show alors que le client est venu, annulation
  // accidentelle, etc.). La disponibilité est re-vérifiée côté service avant
  // de réactiver (cf. requiresAvailabilityRecheck) pour éviter un double-booking.
  COMPLETED: ['CONFIRMED'],
  CANCELLED: ['CONFIRMED'],
  NO_SHOW: ['CONFIRMED'],
};

/** Indique si la transition `from -> to` est autorisée par la machine à états. */
export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from as BookingStatus] || [];
  return allowed.includes(to as BookingStatus);
}

/** États terminaux : seule une réactivation explicite (-> CONFIRMED) en sort. */
const TERMINAL_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'NO_SHOW'];

/**
 * Vrai si la transition est une réactivation depuis un état terminal vers
 * CONFIRMED. Dans ce cas, la réservation ne « réservait » plus la chambre
 * (les états terminaux ne comptent pas dans les disponibilités) : il faut
 * donc re-vérifier qu'aucune autre réservation/blocage ne chevauche les dates.
 */
export function requiresAvailabilityRecheck(from: string, to: string): boolean {
  return to === 'CONFIRMED' && TERMINAL_STATUSES.includes(from as BookingStatus);
}

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
    return `Une réservation ${fromLabel} ne peut être que réactivée (statut « confirmée »).`;
  }
  const toLabel = STATUS_LABELS_FR[to as BookingStatus] || to;
  return `Transition impossible : une réservation ${fromLabel} ne peut pas passer à « ${toLabel} ».`;
}
