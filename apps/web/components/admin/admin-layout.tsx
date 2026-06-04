'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  CreditCard,
  Users,
  Star,
  MessageSquare,
  Settings,
  LogOut,
  ConciergeBell,
  Menu,
  X,
  Bell,
  ChevronDown,
  BarChart3,
  UserCog,
  FileText,
  Wallet,
  FileBarChart,
  CalendarDays,
} from 'lucide-react';
import { api, saveAuthToken, loadAuthToken, clearAuth } from '@/lib/api';
import { useTheme } from '@/lib/theme-provider';

interface Notification {
  id: string;
  bookingReference: string;
  customerName: string;
  checkInDate: string;
  createdAt: string;
  room?: { name: string };
}

const navItems = [
  { href: '/admin/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/admin/bookings',        label: 'Réservations',    icon: CalendarCheck },
  { href: '/admin/calendar',        label: 'Calendrier',      icon: CalendarDays },
  { href: '/admin/rooms',           label: 'Chambres',        icon: BedDouble },
  { href: '/admin/payments',        label: 'Paiements',       icon: CreditCard },
  { href: '/admin/documents',       label: 'Devis & Factures',icon: FileText },
  { href: '/admin/expenses',        label: 'Dépenses',        icon: Wallet },
  { href: '/admin/reports',         label: 'Rapports',        icon: FileBarChart },
  { href: '/admin/customers',       label: 'Clients',         icon: Users },
  { href: '/admin/users',           label: 'Utilisateurs',    icon: UserCog },
  { href: '/admin/staff',           label: 'Personnel',       icon: ConciergeBell },
  { href: '/admin/services',        label: 'Services',        icon: ConciergeBell },
  { href: '/admin/reviews',         label: 'Avis',            icon: Star },
  { href: '/admin/contact-messages',label: 'Messages',        icon: MessageSquare },
  { href: '/admin/analytics',       label: 'Analytiques',     icon: BarChart3 },
  { href: '/admin/settings',        label: 'Paramètres',      icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadRef = useRef<number>(0);
  const hotelName = settings.hotel_name || 'SETIFANA';

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ pendingCount: number; recent: Notification[] }>('/admin/notifications');
      const data = res as any;
      const recent: Notification[] = data.recent || [];
      setNotifications(recent);
      // Unread = items created after last read timestamp
      const unread = recent.filter(
        (n) => new Date(n.createdAt).getTime() > lastReadRef.current,
      ).length;
      setUnreadCount(unread);
    } catch {
      // Silently ignore — notifications are non-critical
    }
  }, []);

  // Load last-read timestamp from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_notif_read_at');
    if (stored) lastReadRef.current = Number(stored);
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  function handleOpenNotifications() {
    setNotifOpen((v) => !v);
    setDropdownOpen(false);
    if (!notifOpen) {
      // Mark as read
      const now = Date.now();
      lastReadRef.current = now;
      localStorage.setItem('admin_notif_read_at', String(now));
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    try {
      const parsed = JSON.parse(userData);

      // ── Role guard — redirect non-admin/staff accounts ─────────────────
      if (parsed.role !== 'ADMIN' && parsed.role !== 'STAFF') {
        clearAuth();
        router.push('/admin/login');
        return;
      }

      // ── Restore token into api client on every mount/hydration ─────────
      const token = loadAuthToken();
      if (token) {
        saveAuthToken(token); // re-sets it on the ApiClient instance
      } else {
        // No token stored — kick back to login
        clearAuth();
        router.push('/admin/login');
        return;
      }

      setUser(parsed);
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/admin/login');
  };

  const currentPage = navItems.find(item => pathname === item.href)?.label || 'Administration';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#071B33] text-white fixed inset-y-0 left-0 z-40">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Link href="/admin/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#C8A45D] rounded-full flex items-center justify-center">
              <span className="font-serif font-bold text-sm text-white">{hotelName[0]}</span>
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-[#C8A45D]">{hotelName}</span>
              <p className="text-[10px] text-white/50 -mt-0.5">Administration</p>
            </div>
          </Link>
        </div>

        <nav aria-label="Administration" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#C8A45D] text-white shadow-md'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C8A45D] flex items-center justify-center text-xs font-bold">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.fullName || user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-white/50">
                  {user?.role === 'ADMIN' ? '🔑 Administrateur' : user?.role === 'STAFF' ? '👤 Personnel' : user?.role || 'ADMIN'}
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-white/50 hover:text-red-400 transition-colors" title="Deconnexion">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#071B33] text-white flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
              <span className="font-serif text-lg font-bold text-[#C8A45D]">{hotelName}</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#C8A45D] text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/70 hover:text-red-400">
                <LogOut className="w-4 h-4" /> Deconnexion
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button aria-label="Ouvrir le menu" className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{currentPage}</h2>
              <p className="text-xs text-gray-500 hidden md:block">Hotel {hotelName} - Back-office</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                aria-label="Notifications"
                onClick={handleOpenNotifications}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-[min(320px,calc(100vw-1rem))] bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">Réservations en attente</p>
                      <Link
                        href="/admin/bookings?status=PENDING"
                        className="text-xs text-[#C8A45D] hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        Voir tout
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-center text-gray-400">
                          Aucune réservation en attente
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href="/admin/bookings"
                            onClick={() => setNotifOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <CalendarCheck className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{n.customerName}</p>
                              <p className="text-[10px] text-gray-500">{n.room?.name} · {n.bookingReference}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(n.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-[#071B33] flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.[0] || 'A'}
                </div>
                <ChevronDown className="w-3 h-3 text-gray-500 hidden sm:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                      <Settings className="w-4 h-4" /> Parametres
                    </Link>
                    <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                      <BarChart3 className="w-4 h-4" /> Voir le site
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 w-full text-left text-red-600">
                      <LogOut className="w-4 h-4" /> Deconnexion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
