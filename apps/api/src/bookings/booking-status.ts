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
