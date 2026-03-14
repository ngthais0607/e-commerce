import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Ticket, ArrowLeft, Store, Menu, X, MessageSquare, Image, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const isStaff = user?.role === 'STAFF';

  const navItems = useMemo(
    () => [
      { path: '/admin', label: isStaff ? 'Staff Dashboard' : 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/products', label: 'Products', icon: Package, hidden: isStaff },
      { path: '/admin/orders', label: 'Orders & Payments', icon: ShoppingBag },
      { path: '/admin/users', label: 'Users', icon: Users, hidden: isStaff },
      { path: '/admin/addresses', label: 'Addresses', icon: MapPin },
      { path: '/admin/coupons', label: 'Coupons', icon: Ticket, hidden: isStaff },
      { path: '/admin/banners', label: 'Banners', icon: Image },
      { path: '/admin/support', label: 'Support Chat', icon: MessageSquare },
    ],
    [isStaff]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-500 to-sky-400 dark:from-sky-400 dark:to-sky-300 bg-clip-text text-transparent">
                {isStaff ? 'Staff Panel' : 'Admin Panel'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/shop">
                <Button variant="outline" size="sm" className="gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">Shop</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Modern Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 fixed md:sticky top-[73px] left-0 z-50 w-64 border-r border-border dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur md:bg-white/80 dark:md:bg-slate-900/50 h-[calc(100vh-73px)] overflow-y-auto transition-transform duration-300 md:transition-none`}
        >
          <nav className="p-4 space-y-2">
            {navItems
              .filter((item) => !item.hidden)
              .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-white shadow-md scale-[1.02] dark:shadow-sky-500/20'
                      : 'hover:bg-sky-50 dark:hover:bg-slate-800 hover:scale-[1.01] text-foreground/70 dark:text-foreground/80'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

