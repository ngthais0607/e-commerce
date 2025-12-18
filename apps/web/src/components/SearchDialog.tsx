import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import api from '@/services/api';
import type { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (debouncedSearch.trim()) {
      performSearch(debouncedSearch);
    } else {
      setProducts([]);
      setHasSearched(false);
    }
  }, [debouncedSearch]);

  const performSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get('/products', {
        params: {
          search: query,
          pageSize: 8,
        },
      });
      setProducts(response.data.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    onOpenChange(false);
    navigate(`/product/${product.slug}`);
    setSearchQuery('');
    setProducts([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      onOpenChange(false);
      setSearchQuery('');
      setProducts([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Search Products</DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setProducts([]);
                  setHasSearched(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to view all results
            </p>
          )}
        </div>

        <div className="px-6 pb-6 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasSearched && products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-2 mt-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {product.shortDesc || product.description?.substring(0, 50)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm font-semibold text-red-600">
                              {formatPrice(product.salePrice)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Start typing to search for products</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

