import {
  isValidTransition,
  transitionErrorMessage,
  requiresAvailabilityRecheck,
  VALID_TRANSITIONS,
} from './booking-status';

describe('booking status machine', () => {
  describe('allowed transitions', () => {
    it('PENDING -> CONFIRMED', () => {
      expect(isValidTransition('PENDING', 'CONFIRMED')).toBe(true);
    });

    it('PENDING -> CANCELLED', () => {
      expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true);
    });

    it('CONFIRMED -> COMPLETED', () => {
      expect(isValidTransition('CONFIRMED', 'COMPLETED')).toBe(true);
    });

    it('CONFIRMED -> NO_SHOW', () => {
      expect(isValidTransition('CONFIRMED', 'NO_SHOW')).toBe(true);
    });

    it('CONFIRMED -> CANCELLED', () => {
      expect(isValidTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    });
  });

  describe('reactivation from terminal states', () => {
    it.each(['CANCELLED', 'NO_SHOW', 'COMPLETED'])(
      'allows %s -> CONFIRMED (admin recovery)',
      (from) => {
        expect(isValidTransition(from, 'CONFIRMED')).toBe(true);
      },
    );

    it('each terminal state can only go to CONFIRMED', () => {
      for (const terminal of ['COMPLETED', 'CANCELLED', 'NO_SHOW']) {
        expect(VALID_TRANSITIONS[terminal as keyof typeof VALID_TRANSITIONS]).toEqual(['CONFIRMED']);
      }
    });

    it('flags terminal -> CONFIRMED as needing an availability re-check', () => {
      expect(requiresAvailabilityRecheck('NO_SHOW', 'CONFIRMED')).toBe(true);
      expect(requiresAvailabilityRecheck('CANCELLED', 'CONFIRMED')).toBe(true);
      expect(requiresAvailabilityRecheck('COMPLETED', 'CONFIRMED')).toBe(true);
    });

    it('does not re-check availability for the normal PENDING -> CONFIRMED path', () => {
      expect(requiresAvailabilityRecheck('PENDING', 'CONFIRMED')).toBe(false);
    });
  });

  describe('forbidden transitions', () => {
    it('rejects skipping straight from PENDING to COMPLETED', () => {
      expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false);
    });

    it('rejects a terminal state moving to another terminal state', () => {
      expect(isValidTransition('CANCELLED', 'NO_SHOW')).toBe(false);
      expect(isValidTransition('NO_SHOW', 'COMPLETED')).toBe(false);
    });

    it('rejects an unknown source status', () => {
      expect(isValidTransition('BOGUS', 'CONFIRMED')).toBe(false);
    });

    it('rejects a no-op transition to the same status', () => {
      expect(isValidTransition('PENDING', 'PENDING')).toBe(false);
    });
  });

  describe('transitionErrorMessage', () => {
    it('explains a no-op transition (already in that status)', () => {
      expect(transitionErrorMessage('CONFIRMED', 'CONFIRMED')).toBe(
        'Cette réservation est déjà confirmée.',
      );
    });

    it('explains that a terminal status can only be reactivated', () => {
      expect(transitionErrorMessage('CANCELLED', 'NO_SHOW')).toBe(
        'Une réservation annulée ne peut être que réactivée (statut « confirmée »).',
      );
    });

    it('explains a disallowed transition between active states', () => {
      expect(transitionErrorMessage('PENDING', 'COMPLETED')).toBe(
        'Transition impossible : une réservation en attente ne peut pas passer à « terminée ».',
      );
    });
  });
});
