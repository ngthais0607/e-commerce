import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, Store } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import type { Product } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SearchDialog } from '@/components/SearchDialog';
import { ROUTES } from '@/constants';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebounce(headerSearch, 250);

  const isActive = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === ROUTES.HOME;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setSearchLoading(true);
        const res = await api.get('/products', {
          params: { search: q, pageSize: 5 },
        });
        if (!cancelled) {
          setSearchResults(res.data.items || []);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5">
      <div className="w-full px-0 md:px-2">
        <div className="flex h-14 md:h-16 items-center gap-3 md:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-none">
            <Link to={ROUTES.HOME} className="flex items-center space-x-2 group relative">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-400 rounded-lg blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
                <Store className="relative h-6 w-6 md:h-7 md:w-7 text-sky-500 dark:text-sky-400 transition-all duration-300 group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-300" />
              </div>
              <span className="relative text-xl md:text-2xl font-display font-bold tracking-tight overflow-hidden">
                <span className="relative z-10 bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent group-hover:from-sky-600 group-hover:to-sky-500 transition-all duration-300">
                  Stay
                </span>
                {/* shimmering highlight */}
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700" />
              </span>
            </Link>
          </div>

          {/* Main nav - centered group */}
          <nav className="hidden md:flex flex-none items-center justify-center space-x-1.5 mx-4">
            <Link 
              to={ROUTES.HOME}
              aria-current={isActive(ROUTES.HOME) ? 'page' : undefined}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 relative group ${
                isActive(ROUTES.HOME)
                  ? 'text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/20'
                  : 'text-foreground/80 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 dark:hover:bg-sky-500/20'
              }`}
            >
              Home
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300 ${
                  isActive(ROUTES.HOME) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link 
              to={ROUTES.SHOP}
              aria-current={isActive(ROUTES.SHOP) ? 'page' : undefined}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 relative group ${
                isActive(ROUTES.SHOP)
                  ? 'text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/20'
                  : 'text-foreground/80 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 dark:hover:bg-sky-500/20'
              }`}
            >
              Shop
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300 ${
                  isActive(ROUTES.SHOP) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              ></span>
            </Link>
            <Link 
              to={ROUTES.CONTACT}
              aria-current={isActive(ROUTES.CONTACT) ? 'page' : undefined}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-300 relative group ${
                isActive(ROUTES.CONTACT)
                  ? 'text-sky-600 dark:text-sky-300 bg-sky-500/10 dark:bg-sky-500/20'
                  : 'text-foreground/80 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 dark:hover:bg-sky-500/20'
              }`}
            >
              Contact
              <span
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-300 ${
                  isActive(ROUTES.CONTACT) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              ></span>
            </Link>
          </nav>

          {/* Search - sits next to nav */}
          <div className="hidden md:flex w-full max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && headerSearch.trim()) {
                    navigate(`/shop?search=${encodeURIComponent(headerSearch.trim())}`);
                    setSearchResults([]);
                  }
                }}
                placeholder="Search for products..."
                className="pl-10 pr-10 rounded-full h-10 md:h-11 text-sm bg-background/80 border border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-300 shadow-sm"
                aria-label="Search products"
              />
              {headerSearch.trim() && (searchResults.length > 0 || searchLoading) && (
                <div className="absolute left-0 right-0 top-11 z-40 rounded-xl border bg-popover shadow-lg">
                  {searchLoading ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground">
                      Searching...
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {searchResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(`/product/${p.slug}`);
                              setHeaderSearch('');
                              setSearchResults([]);
                            }}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs hover:bg-accent"
                          >
                            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                              {p.images?.[0] && (
                                <img
                                  src={p.images[0]}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{p.name}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-none ml-auto">
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            
            <ThemeToggle variant="icon" />
            
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="relative hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-all duration-300">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white animate-pulse shadow-lg">
                        {cartCount > 99 ? '99+' : cartCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-300">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-md border border-white/10">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    {user?.role !== 'ADMIN' && (
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer hover:bg-violet-500/10 dark:hover:bg-violet-500/20 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
                          Orders
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors">
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-colors">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button
                    variant="outline"
                    className="hidden sm:flex items-center gap-2 rounded-full px-6 hover:bg-sky-500/10 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400 border-sky-200 dark:border-sky-700 transition-all duration-300"
                    aria-label="Login to your account"
                  >
                    Login
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    className="hidden sm:flex rounded-full px-7 bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/60 transition-all duration-300 whitespace-nowrap"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-300"
              onClick={() => setSearchOpen(true)}
              aria-label="Open product search"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-violet-500/10 dark:hover:bg-violet-500/20 hover:text-violet-500 dark:hover:text-violet-400 transition-all duration-300">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <Store className="h-6 w-6 text-indigo-500" />
                    <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                      Stay
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to={ROUTES.HOME}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all duration-300"
                  >
                    Home
                  </Link>
                  <Link 
                    to={ROUTES.SHOP}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-all duration-300"
                  >
                    Shop
                  </Link>
                  <Link 
                    to={ROUTES.CONTACT}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 transition-all duration-300"
                  >
                    Contact
                  </Link>
                  {!isAuthenticated && (
                    <>
                      <div className="border-t border-border my-4"></div>
                      <Link 
                        to={ROUTES.LOGIN}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-semibold rounded-full text-center border-2 border-sky-500 text-sky-600 hover:bg-sky-500 hover:text-white transition-all duration-300"
                      >
                        Login
                      </Link>
                      <Link 
                        to={ROUTES.REGISTER}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-semibold rounded-full text-center bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                  {isAuthenticated && (
                    <>
                      <div className="border-t border-border my-4"></div>
                      <Link 
                        to="/account" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all duration-300"
                      >
                        My Account
                      </Link>
                      {user?.role !== 'ADMIN' && (
                        <Link 
                          to="/orders" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-all duration-300"
                        >
                          Orders
                        </Link>
                      )}
                      {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                        <Link 
                          to="/admin" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 transition-all duration-300"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        variant="destructive"
                        className="mt-4 w-full"
                      >
                        Logout
                      </Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

