import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, Search, Store, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
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

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-black/5">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <Store className="relative h-6 w-6 md:h-7 md:w-7 text-indigo-500 dark:text-indigo-400 transition-all duration-300 group-hover:scale-110 group-hover:text-violet-500 dark:group-hover:text-violet-400" />
            </div>
            <span className="text-xl md:text-2xl font-display font-bold bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent group-hover:from-indigo-600 group-hover:via-violet-600 group-hover:to-fuchsia-600 transition-all duration-300 tracking-tight">
              E-Commerce
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-2">
            <Link 
              to="/" 
              className="px-4 py-2 text-sm font-semibold rounded-lg text-foreground/80 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all duration-300 relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/shop" 
              className="px-4 py-2 text-sm font-semibold rounded-lg text-foreground/80 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-all duration-300 relative group"
            >
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 text-sm font-semibold rounded-lg text-foreground/80 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 transition-all duration-300 relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-300"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
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
                <Link to="/login">
                  <Button variant="ghost" className="hidden sm:flex hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all duration-300">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="hidden sm:flex bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 text-white shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
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
                      E-Commerce
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link 
                    to="/" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition-all duration-300"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/shop" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/20 transition-all duration-300"
                  >
                    Shop
                  </Link>
                  <Link 
                    to="/contact" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-semibold rounded-lg text-foreground hover:text-fuchsia-600 dark:hover:text-fuchsia-400 hover:bg-fuchsia-500/10 dark:hover:bg-fuchsia-500/20 transition-all duration-300"
                  >
                    Contact
                  </Link>
                  {!isAuthenticated && (
                    <>
                      <div className="border-t border-border my-4"></div>
                      <Link 
                        to="/login" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-semibold rounded-lg text-center border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all duration-300"
                      >
                        Login
                      </Link>
                      <Link 
                        to="/register" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-semibold rounded-lg text-center bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 transition-all duration-300"
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

