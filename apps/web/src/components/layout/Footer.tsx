import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-sky-100/80 dark:border-sky-900/60 bg-gradient-to-b from-sky-50 via-sky-100 to-sky-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start">
          {/* Brand Section */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <Store className="h-6 w-6 text-sky-500 dark:text-sky-400 transition-all duration-300 group-hover:scale-110 group-hover:text-sky-600 dark:group-hover:text-sky-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent group-hover:from-sky-600 group-hover:to-sky-500 transition-all duration-300">
                Stay
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted online shopping destination. Quality products, unbeatable prices, and exceptional service.
            </p>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 group/item">
                <Mail className="h-4 w-4 text-indigo-500/60 dark:text-indigo-400/60 group-hover/item:text-indigo-500 dark:group-hover/item:text-indigo-400 transition-colors" />
                <span className="group-hover/item:text-indigo-500 dark:group-hover/item:text-indigo-400 transition-colors">support@ecommerce.com</span>
              </div>
              <div className="flex items-center gap-2 group/item">
                <Phone className="h-4 w-4 text-violet-500/60 dark:text-violet-400/60 group-hover/item:text-violet-500 dark:group-hover/item:text-violet-400 transition-colors" />
                <span className="group-hover/item:text-violet-500 dark:group-hover/item:text-violet-400 transition-colors">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start gap-2 group/item">
                <MapPin className="h-4 w-4 mt-0.5 text-fuchsia-500/60 dark:text-fuchsia-400/60 group-hover/item:text-fuchsia-500 dark:group-hover/item:text-fuchsia-400 transition-colors" />
                <span className="group-hover/item:text-fuchsia-500 dark:group-hover/item:text-fuchsia-400 transition-colors">123 Shopping Street, City, State 12345</span>
              </div>
            </div>
          </div>
          
          {/* Link Columns */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
              {/* Shop Section */}
              <div>
                <h4 className="font-semibold text-base mb-4">Shop</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      to="/shop" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/shop" 
                      className="text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors inline-block"
                    >
                      New Arrivals
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/shop" 
                      className="text-muted-foreground hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors inline-block"
                    >
                      Best Sellers
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/shop" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      Sale Items
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Customer Service Section */}
              <div>
                <h4 className="font-semibold text-base mb-4">Customer Service</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      to="/contact" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/faq" 
                      className="text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors inline-block"
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/orders" 
                      className="text-muted-foreground hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors inline-block"
                    >
                      Track Order
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/account" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      My Account
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal Section */}
              <div>
                <h4 className="font-semibold text-base mb-4">Legal</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      to="/privacy" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/terms" 
                      className="text-muted-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors inline-block"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/shipping" 
                      className="text-muted-foreground hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors inline-block"
                    >
                      Shipping Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/returns" 
                      className="text-muted-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-block"
                    >
                      Returns & Refunds
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} Stay. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-violet-500 dark:hover:text-violet-400 transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

