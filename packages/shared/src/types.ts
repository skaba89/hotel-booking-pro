export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
  DISABLED = 'DISABLED',
}

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PAY_AT_HOTEL = 'PAY_AT_HOTEL',
}

export enum BookingStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentMethodEnum {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MTN_MONEY = 'MTN_MONEY',
  WAVE = 'WAVE',
  PAY_AT_HOTEL = 'PAY_AT_HOTEL',
}

export enum TransactionStatusEnum {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ContactStatusEnum {
  NEW = 'NEW',
  READ = 'READ',
  ANSWERED = 'ANSWERED',
  ARCHIVED = 'ARCHIVED',
}

export interface RoomDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  pricePerNight: number;
  capacity: number;
  adultsCapacity: number;
  childrenCapacity: number;
  bedType: string | null;
  sizeM2: number | null;
  amenities: string[];
  status: RoomStatus;
  isFeatured: boolean;
  images: RoomImageDto[];
}

export interface RoomImageDto {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface BookingDto {
  id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  baseAmount: number;
  taxesAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatusEnum;
  bookingStatus: BookingStatusEnum;
  specialRequest: string | null;
  room: RoomDto;
}

export interface QuoteRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export interface QuoteResponse {
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  baseAmount: number;
  taxesAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CreateBookingRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  fullName: string;
  email: string;
  phone?: string;
  specialRequest?: string;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  occupancyRate: number;
  availableRooms: number;
  maintenanceRooms: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ServiceDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ReviewDto {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ContactMessageDto {
  fullName: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface SettingDto {
  key: string;
  value: string;
  type: string;
  description?: string;
}
