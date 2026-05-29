'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme-provider';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Reservations', icon: CalendarCheck },
  { href: '/admin/rooms', label: 'Chambres', icon: BedDouble },
  { href: '/admin/payments', label: 'Paiements', icon: CreditCard },
  { href: '/admin/customers', label: 'Clients', icon: Users },
  { href: '/admin/services', label: 'Services', icon: ConciergeBell },
  { href: '/admin/reviews', label: 'Avis', icon: Star },
  { href: '/admin/contact-messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytiques', icon: BarChart3 },
  { href: '/admin/settings', label: 'Parametres', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { settings } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const hotelName = settings.hotel_name || 'SETIFANA';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/admin/login');
      return;
    }
    try { setUser(JSON.parse(userData)); } catch {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('user');
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
                <p className="text-sm font-medium">{user?.firstName || user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-xs text-white/50">{user?.role || 'ADMIN'}</p>
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
            <button aria-label="Notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
