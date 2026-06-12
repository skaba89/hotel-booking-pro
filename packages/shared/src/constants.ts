export const HOTEL = {
  name: 'Hotel SETIFANA',
  tagline: 'L\'excellence de l\'hospitalité à Conakry',
  description: 'Découvrez le luxe et le confort au cœur de Conakry. Hotel SETIFANA vous offre une expérience hôtelière inoubliable avec des chambres élégantes, une cuisine raffinée et un service exceptionnel.',
  address: 'Conakry, République de Guinée',
  phone: '+224 XXX XXX XXX',
  email: 'contact@setifana.com',
  whatsapp: '+224 XXX XXX XXX',
  currency: 'GNF',
  taxRate: 18,
  checkInTime: '14:00',
  checkOutTime: '12:00',
  cancellationHours: 48,
} as const;

export const COLORS = {
  primary: '#071B33',
  gold: '#C8A45D',
  white: '#FFFFFF',
  grayLight: '#F6F7F9',
  textDark: '#1E293B',
} as const;

export const AMENITY_ICONS: Record<string, string> = {
  wifi: 'Wifi',
  parking: 'Car',
  pool: 'Waves',
  restaurant: 'UtensilsCrossed',
  spa: 'Sparkles',
  gym: 'Dumbbell',
  bar: 'Wine',
  laundry: 'WashingMachine',
  room_service: 'ConciergeBell',
  air_conditioning: 'AirVent',
  tv: 'Tv',
  minibar: 'GlassWater',
  safe: 'Lock',
  balcony: 'Mountain',
  sea_view: 'Sunset',
  breakfast: 'Coffee',
  shuttle: 'Bus',
  conference: 'Presentation',
};

export const BOOKING_REFERENCE_PREFIX = 'STF';
export const INVOICE_PREFIX = 'INV';

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
} as const;
