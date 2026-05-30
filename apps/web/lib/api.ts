const API_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4005')
  : '';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const res = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (!res.ok) return false;

      const data = await res.json();
      if (data.accessToken) {
        this.token = data.accessToken;
      }
      return true;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401 && !isRetry) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        this.token = null;
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erreur serveur' }));
      throw new Error(error.message || `Erreur ${res.status}`);
    }

    if (res.status === 204) return null as T;
    return res.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Public API functions
export async function getRooms(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/rooms${query}`);
}

export async function getFeaturedRooms() {
  return api.get<any[]>('/rooms/featured');
}

export async function getRoomBySlug(slug: string) {
  return api.get<any>(`/rooms/${slug}`);
}

export async function checkAvailability(roomId: string, checkIn: string, checkOut: string) {
  return api.get<{ available: boolean }>(`/availability?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`);
}

export async function getQuote(data: { roomId: string; checkIn: string; checkOut: string; adults: number; children: number }) {
  return api.post<any>('/bookings/quote', data);
}

export async function createBooking(data: any) {
  return api.post<any>('/bookings', data);
}

export async function getBookingByReference(reference: string) {
  return api.get<any>(`/bookings/${reference}`);
}

export async function lookupBooking(reference: string, email: string) {
  return api.post<any>('/bookings/lookup', { reference, email });
}

export async function cancelBooking(reference: string, email: string) {
  return api.post<any>('/bookings/cancel', { reference, email });
}

export async function createStripeSession(bookingReference: string) {
  return api.post<{ sessionId: string; url: string }>('/payments/stripe/create-session', { bookingReference });
}

export async function payAtHotel(bookingReference: string) {
  return api.post<any>('/payments/pay-at-hotel', { bookingReference });
}

export async function initiateMobileMoney(data: { bookingReference: string; provider: string; phoneNumber: string }) {
  return api.post<any>('/payments/mobile-money/initiate', data);
}

export async function getServices() {
  return api.get<any[]>('/services');
}

export async function getReviews() {
  return api.get<any[]>('/reviews');
}

export async function submitReview(data: { customerName: string; rating: number; comment?: string }) {
  return api.post<any>('/reviews', data);
}

export async function submitContact(data: { fullName: string; email: string; phone?: string; subject?: string; message: string }) {
  return api.post<any>('/contact', data);
}

export async function getPublicSettings() {
  return api.get<Record<string, string>>('/settings/public');
}

// Admin API
export async function adminLogin(email: string, password: string) {
  return api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', { email, password });
}

export async function getAdminStats() {
  return api.get<any>('/admin/dashboard/stats');
}

export async function getAdminBookings(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/bookings${query}`);
}

export async function updateBookingStatus(id: string, status: string, reason?: string) {
  return api.patch<any>(`/admin/bookings/${id}/status`, { status, reason });
}

// Admin Rooms
export async function getAdminRooms() {
  return api.get<any[]>('/admin/rooms');
}

export async function createRoom(data: any) {
  return api.post<any>('/admin/rooms', data);
}

export async function updateRoom(id: string, data: any) {
  return api.patch<any>(`/admin/rooms/${id}`, data);
}

export async function deleteRoom(id: string) {
  return api.delete<any>(`/admin/rooms/${id}`);
}

// Room Images
export async function uploadRoomImage(roomId: string, file: File, altText?: string): Promise<any> {
  const formData = new FormData();
  formData.append('image', file);
  if (altText) formData.append('altText', altText);

  const res = await fetch(`${API_URL}/api/admin/rooms/${roomId}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur upload' }));
    throw new Error(error.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function addRoomImageUrl(roomId: string, imageUrl: string, altText?: string) {
  return api.post<any>(`/admin/rooms/${roomId}/images`, { imageUrl, altText });
}

export async function deleteRoomImage(imageId: string) {
  return api.delete<any>(`/admin/room-images/${imageId}`);
}

// Admin Services
export async function getAdminServices() {
  return api.get<any[]>('/admin/services');
}

export async function createService(data: any) {
  return api.post<any>('/admin/services', data);
}

export async function updateService(id: string, data: any) {
  return api.patch<any>(`/admin/services/${id}`, data);
}

export async function deleteService(id: string) {
  return api.delete<any>(`/admin/services/${id}`);
}

// Admin Reviews
export async function getAdminReviews() {
  return api.get<any[]>('/admin/reviews');
}

export async function updateReview(id: string, data: any) {
  return api.patch<any>(`/admin/reviews/${id}`, data);
}

export async function deleteReview(id: string) {
  return api.delete<any>(`/admin/reviews/${id}`);
}

// Admin Customers
export async function getAdminCustomers(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/customers${query}`);
}

// Admin Settings
export async function getAdminSettings() {
  return api.get<any[]>('/admin/settings');
}

export async function updateSetting(key: string, value: string) {
  return api.patch<any>(`/admin/settings/${key}`, { value });
}

// Admin Payments
export async function getAdminPayments(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/payments${query}`);
}

// Admin Revenue
export async function getAdminRevenue() {
  return api.get<any>('/admin/dashboard/revenue');
}

// Admin Occupancy
export async function getAdminOccupancy() {
  return api.get<any>('/admin/dashboard/occupancy');
}

// Admin Latest
export async function getLatestBookings() {
  return api.get<any[]>('/admin/dashboard/latest-bookings');
}

export async function getLatestPayments() {
  return api.get<any[]>('/admin/dashboard/latest-payments');
}

// Contact Messages
export async function getContactMessages(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/contact-messages${query}`);
}

export async function markMessageRead(id: string) {
  return api.patch<any>(`/admin/contact-messages/${id}/status`, { status: 'READ' });
}

// Newsletter
export async function subscribeNewsletter(email: string) {
  return api.post<{ message: string }>('/newsletter/subscribe', { email });
}

export async function unsubscribeNewsletter(email: string) {
  return api.post<{ message: string }>('/newsletter/unsubscribe', { email });
}

export async function getNewsletterSubscribers(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/newsletter/subscribers${query}`);
}

// ===========================================
// Documents (Devis & Factures)
// ===========================================

export interface DocumentLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateDocumentInput {
  type: 'QUOTE' | 'INVOICE';
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  bookingId?: string;
  currency?: string;
  taxRate?: number;
  discountAmount?: number;
  dueDate?: string;
  notes?: string;
  lines: DocumentLine[];
}

// --- Admin ---
export async function getAdminDocuments(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/documents${query}`);
}

export async function getAdminDocument(id: string) {
  return api.get<any>(`/admin/documents/${id}`);
}

export async function createDocument(data: CreateDocumentInput) {
  return api.post<any>('/admin/documents', data);
}

export async function createDocumentFromBooking(data: { type: 'QUOTE' | 'INVOICE'; bookingId: string }) {
  return api.post<any>('/admin/documents/from-booking', data);
}

export async function updateDocument(id: string, data: Partial<CreateDocumentInput>) {
  return api.patch<any>(`/admin/documents/${id}`, data);
}

export async function updateDocumentStatus(id: string, status: string) {
  return api.patch<any>(`/admin/documents/${id}/status`, { status });
}

export async function convertDocumentToInvoice(id: string) {
  return api.post<any>(`/admin/documents/${id}/convert`);
}

export async function sendDocumentByEmail(id: string) {
  return api.post<any>(`/admin/documents/${id}/send`);
}

export async function deleteDocument(id: string) {
  return api.delete<any>(`/admin/documents/${id}`);
}

// --- Public (lien sécurisé par token) ---
export async function getDocumentByToken(token: string) {
  return api.get<any>(`/documents/${token}`);
}

/** Lien direct de téléchargement du PDF (proxifié vers l'API par Next rewrites). */
export function documentPdfUrl(token: string) {
  return `/api/documents/${token}/pdf`;
}

// ===========================================
// Dépenses (gestion financière)
// ===========================================

export type ExpenseCategory =
  | 'SUPPLIES'
  | 'SALARIES'
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'MARKETING'
  | 'FOOD_BEVERAGE'
  | 'RENT'
  | 'TAXES'
  | 'OTHER';

export type ExpensePaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'CARD'
  | 'CHECK'
  | 'OTHER';

export interface CreateExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency?: string;
  expenseDate: string;
  vendor?: string;
  invoiceNumber?: string;
  paymentMethod?: ExpensePaymentMethod;
  receiptUrl?: string;
  notes?: string;
}

export async function getAdminExpenses(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/expenses${query}`);
}

export async function getAdminExpense(id: string) {
  return api.get<any>(`/admin/expenses/${id}`);
}

export async function createExpense(data: CreateExpenseInput) {
  return api.post<any>('/admin/expenses', data);
}

export async function updateExpense(id: string, data: Partial<CreateExpenseInput>) {
  return api.patch<any>(`/admin/expenses/${id}`, data);
}

export async function deleteExpense(id: string) {
  return api.delete<any>(`/admin/expenses/${id}`);
}

/** Synthèse dépenses + bénéfice net pour le tableau de bord. */
export async function getExpensesSummary(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return api.get<any>(`/admin/dashboard/expenses-summary${query}`);
}

// ============================================================
// Rapports financiers
// ============================================================

export interface FinancialReportLine {
  date: string;
  reference: string;
  amount: number;
  currency: string;
}

export interface FinancialReportRevenue extends FinancialReportLine {
  customer: string;
  method: string;
}

export interface FinancialReportExpense extends FinancialReportLine {
  category: ExpenseCategory;
  description: string;
  vendor: string;
}

export interface FinancialReport {
  period: { from: string; to: string };
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  byCategory: { category: ExpenseCategory; amount: number; count: number }[];
  revenues: FinancialReportRevenue[];
  expenses: FinancialReportExpense[];
}

/** Rapport financier consolidé (recettes − dépenses) sur une période. */
export async function getFinancialReport(params?: { from?: string; to?: string }) {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
    : '';
  return api.get<FinancialReport>(`/admin/reports/financial${query}`);
}
