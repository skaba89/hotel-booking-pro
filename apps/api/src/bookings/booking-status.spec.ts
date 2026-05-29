import { isValidTransition, VALID_TRANSITIONS } from './booking-status';

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

  describe('forbidden transitions', () => {
    it('rejects skipping straight from PENDING to COMPLETED', () => {
      expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false);
    });

    it('rejects re-opening a CANCELLED booking', () => {
      expect(isValidTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    });

    it('rejects any transition out of a terminal state', () => {
      for (const terminal of ['COMPLETED', 'CANCELLED', 'NO_SHOW']) {
        expect(VALID_TRANSITIONS[terminal as keyof typeof VALID_TRANSITIONS]).toEqual([]);
      }
    });

    it('rejects an unknown source status', () => {
      expect(isValidTransition('BOGUS', 'CONFIRMED')).toBe(false);
    });

    it('rejects a no-op transition to the same status', () => {
      expect(isValidTransition('PENDING', 'PENDING')).toBe(false);
    });
  });
});
