export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s-]{8,20}$/.test(phone);
}

export function isDateAfter(date1: string, date2: string): boolean {
  return new Date(date1) > new Date(date2);
}

export function isDateInFuture(date: string): boolean {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateBookingReference(prefix: string = 'STF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

export function formatCurrency(amount: number, currency: string = 'GNF'): string {
  if (currency === 'GNF') {
    return `${amount.toLocaleString('fr-GN')} GNF`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>\"'&]/g, '').trim();
}
