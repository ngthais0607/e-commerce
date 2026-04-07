import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Ticket,
  ArrowLeft, Store, Menu, X, MessageSquare, Image, MapPin,
  Star, Bell, ShoppingCart, CheckCheck, Trash2, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore, type AppNotification } from '@/store/notificationStore';
import { getSocket } from '@/lib/socket';
import { formatDate } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const isStaff = user?.role === 'STAFF';
  const { notifications, addNotification, markAllRead, markRead, clear } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const socket = useMemo(() => getSocket(token ?? null), [token]);

  // Subscribe to real-time admin notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (payload: {
      type: 'new-order' | 'new-review' | 'low-stock';
      payload: Record<string, unknown>;
      createdAt: string;
    }) => {
      if (payload.type === 'new-order') {
        addNotification({
          type: 'new-order',
          title: 'New Order Placed',
          message: `Order #${payload.payload.orderNumber} · ${payload.payload.customerName}`,
          link: `/admin/orders/${payload.payload.orderId}`,
          createdAt: payload.createdAt,
        });
      } else if (payload.type === 'new-review') {
        const stars = '★'.repeat(Number(payload.payload.rating));
        addNotification({
          type: 'new-review',
          title: 'New Product Review',
          message: `${stars} by ${payload.payload.customerName}`,
          link: '/admin/reviews',
          createdAt: payload.createdAt,
        });
      } else if (payload.type === 'low-stock') {
        addNotification({
          type: 'low-stock',
          title: 'Low Stock Alert',
          message: `"${payload.payload.productName}" has only ${payload.payload.stock} items left`,
          link: '/admin/products',
          createdAt: payload.createdAt,
        });
      }
    };

    socket.on('admin:notification', handler);
    return () => { socket.off('admin:notification', handler); };
  }, [socket, addNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = useMemo(
    () => [
      { path: '/admin', label: isStaff ? 'Staff Dashboard' : 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/products', label: 'Products', icon: Package, hidden: isStaff },
      { path: '/admin/orders', label: 'Orders & Payments', icon: ShoppingBag },
      { path: '/admin/users', label: 'Users', icon: Users, hidden: isStaff },
      { path: '/admin/addresses', label: 'Addresses', icon: MapPin },
      { path: '/admin/coupons', label: 'Coupons', icon: Ticket, hidden: isStaff },
      { path: '/admin/banners', label: 'Banners', icon: Image },
      { path: '/admin/reviews', label: 'Reviews', icon: Star, hidden: isStaff },
      { path: '/admin/refunds', label: 'Refunds', icon: RotateCcw, hidden: isStaff },
      { path: '/admin/support', label: 'Support Chat', icon: MessageSquare },
    ],
    [isStaff],
  );

  const handleNotifClick = (n: AppNotification) => {
    markRead(n.id);
    setNotifOpen(false);
    navigate(n.link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-sky-100 to-sky-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
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
              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none shadow-sm">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllRead}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Mark all read"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowClearConfirm(true)}
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Clear all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[340px] overflow-y-auto divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                          <Bell className="h-8 w-8 opacity-20" />
                          <p className="text-sm font-medium">No notifications yet</p>
                          <p className="text-xs opacity-70">New orders, reviews and stock alerts will appear here</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotifClick(n)}
                            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                              !n.read ? 'bg-sky-50/70 dark:bg-sky-950/20' : ''
                            }`}
                          >
                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              n.type === 'new-order'
                                ? 'bg-emerald-100 text-emerald-600'
                                : n.type === 'low-stock'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}>
                              {n.type === 'new-order'
                                ? <ShoppingCart className="h-4 w-4" />
                                : n.type === 'low-stock'
                                ? <Package className="h-4 w-4" />
                                : <Star className="h-4 w-4" />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium leading-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDate(n.createdAt)}</p>
                            </div>
                            {!n.read && (
                              <span className="mt-2 w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

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
                const isActive =
                  location.pathname === item.path ||
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

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all {notifications.length} notification{notifications.length !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { clear(); setShowClearConfirm(false); }}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
