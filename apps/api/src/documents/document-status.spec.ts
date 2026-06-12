import {
  isValidDocumentTransition,
  isEditable,
  canConvertToInvoice,
  transitionErrorMessage,
  VALID_TRANSITIONS,
} from './document-status';

describe('document status machine', () => {
  describe('quote transitions', () => {
    it('DRAFT -> SENT', () => {
      expect(isValidDocumentTransition('QUOTE', 'DRAFT', 'SENT')).toBe(true);
    });

    it('SENT -> ACCEPTED', () => {
      expect(isValidDocumentTransition('QUOTE', 'SENT', 'ACCEPTED')).toBe(true);
    });

    it('SENT -> REJECTED', () => {
      expect(isValidDocumentTransition('QUOTE', 'SENT', 'REJECTED')).toBe(true);
    });

    it('SENT -> back to DRAFT (reopen for edit)', () => {
      expect(isValidDocumentTransition('QUOTE', 'SENT', 'DRAFT')).toBe(true);
    });

    it('REJECTED -> DRAFT (reopen)', () => {
      expect(isValidDocumentTransition('QUOTE', 'REJECTED', 'DRAFT')).toBe(true);
    });

    it('ACCEPTED is terminal', () => {
      expect(VALID_TRANSITIONS.QUOTE.ACCEPTED).toEqual([]);
      expect(isValidDocumentTransition('QUOTE', 'ACCEPTED', 'REJECTED')).toBe(false);
    });

    it('rejects invoice-only statuses on a quote', () => {
      expect(isValidDocumentTransition('QUOTE', 'DRAFT', 'PAID')).toBe(false);
      expect(isValidDocumentTransition('QUOTE', 'SENT', 'CANCELLED')).toBe(false);
    });
  });

  describe('invoice transitions', () => {
    it('DRAFT -> SENT -> PAID', () => {
      expect(isValidDocumentTransition('INVOICE', 'DRAFT', 'SENT')).toBe(true);
      expect(isValidDocumentTransition('INVOICE', 'SENT', 'PAID')).toBe(true);
    });

    it('SENT -> CANCELLED', () => {
      expect(isValidDocumentTransition('INVOICE', 'SENT', 'CANCELLED')).toBe(true);
    });

    it('PAID is terminal', () => {
      expect(VALID_TRANSITIONS.INVOICE.PAID).toEqual([]);
      expect(isValidDocumentTransition('INVOICE', 'PAID', 'CANCELLED')).toBe(false);
    });

    it('rejects quote-only statuses on an invoice', () => {
      expect(isValidDocumentTransition('INVOICE', 'DRAFT', 'ACCEPTED')).toBe(false);
      expect(isValidDocumentTransition('INVOICE', 'SENT', 'EXPIRED')).toBe(false);
    });
  });

  describe('unknown type / no-op', () => {
    it('rejects an unknown document type', () => {
      expect(isValidDocumentTransition('BOGUS', 'DRAFT', 'SENT')).toBe(false);
    });

    it('rejects a no-op transition to the same status', () => {
      expect(isValidDocumentTransition('QUOTE', 'DRAFT', 'DRAFT')).toBe(false);
    });
  });

  describe('isEditable', () => {
    it('allows editing in DRAFT and SENT', () => {
      expect(isEditable('DRAFT')).toBe(true);
      expect(isEditable('SENT')).toBe(true);
    });

    it('locks editing once accepted / paid / cancelled', () => {
      expect(isEditable('ACCEPTED')).toBe(false);
      expect(isEditable('PAID')).toBe(false);
      expect(isEditable('CANCELLED')).toBe(false);
      expect(isEditable('REJECTED')).toBe(false);
      expect(isEditable('EXPIRED')).toBe(false);
    });
  });

  describe('canConvertToInvoice', () => {
    it('only an accepted quote can be converted', () => {
      expect(canConvertToInvoice('QUOTE', 'ACCEPTED')).toBe(true);
    });

    it('rejects conversion of a non-accepted quote or an invoice', () => {
      expect(canConvertToInvoice('QUOTE', 'SENT')).toBe(false);
      expect(canConvertToInvoice('QUOTE', 'DRAFT')).toBe(false);
      expect(canConvertToInvoice('INVOICE', 'ACCEPTED')).toBe(false);
    });
  });

  describe('transitionErrorMessage', () => {
    it('explains a no-op transition', () => {
      expect(transitionErrorMessage('QUOTE', 'DRAFT', 'DRAFT')).toBe(
        'Ce devis est déjà au statut « brouillon ».',
      );
    });

    it('explains a disallowed transition', () => {
      expect(transitionErrorMessage('INVOICE', 'PAID', 'CANCELLED')).toBe(
        'Transition impossible pour cette facture : « payée » ne peut pas passer à « annulée ».',
      );
    });

    it('flags an unknown type', () => {
      expect(transitionErrorMessage('BOGUS', 'DRAFT', 'SENT')).toBe(
        'Type de document inconnu : BOGUS.',
      );
    });
  });
});
