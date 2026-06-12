import { calculateNights, generateBookingReference, generateInvoiceNumber } from './utils';

describe('calculateNights', () => {
  it('computes the number of nights between two dates', () => {
    expect(calculateNights('2026-06-01', '2026-06-04')).toBe(3);
  });

  it('returns 1 for a single-night stay', () => {
    expect(calculateNights('2026-06-01', '2026-06-02')).toBe(1);
  });

  it('rounds up partial days (ceil)', () => {
    expect(calculateNights('2026-06-01T18:00:00Z', '2026-06-03T00:00:00Z')).toBe(2);
  });

  it('returns 0 when both dates are identical', () => {
    expect(calculateNights('2026-06-01', '2026-06-01')).toBe(0);
  });

  it('handles a month boundary', () => {
    expect(calculateNights('2026-01-30', '2026-02-02')).toBe(3);
  });
});

describe('generateBookingReference', () => {
  it('uses the default STF prefix', () => {
    expect(generateBookingReference()).toMatch(/^STF-[0-9A-Z]+-[0-9A-F]{8}$/);
  });

  it('honours a custom prefix', () => {
    expect(generateBookingReference('ABC')).toMatch(/^ABC-/);
  });

  it('produces unique references on successive calls', () => {
    const a = generateBookingReference();
    const b = generateBookingReference();
    expect(a).not.toBe(b);
  });
});

describe('generateInvoiceNumber', () => {
  it('embeds the current year and month with the INV prefix', () => {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    expect(generateInvoiceNumber()).toMatch(new RegExp(`^INV-${ym}-[0-9A-F]{8}$`));
  });
});
