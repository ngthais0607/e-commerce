import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Category, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Search, Filter, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ShopPage() {
  const [products, setProducts] = useState<PaginatedResponse<Product>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    pageSize: 12,
  });
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;

      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any, resetPage: boolean = true) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(resetPage ? { page: 1 } : {}) }));
  };

  return (
    <div className="bg-gradient-to-b from-background via-muted/20 to-background min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-full border border-indigo-500/20 mb-4">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Shop</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground via-indigo-600 to-violet-600 bg-clip-text text-transparent mb-3">
            Shop All Products
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Find the perfect item for your needs from our curated collection.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 space-y-6 flex-shrink-0">
            <div className="bg-background p-6 rounded-2xl shadow-xl border-2 border-border/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl shadow-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Filters</h2>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 uppercase tracking-wide">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-700 uppercase tracking-wide">Categories</h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => handleFilterChange('categoryId', '')}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        !filters.categoryId
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleFilterChange('categoryId', cat.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          filters.categoryId === String(cat.id)
                            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-700 uppercase tracking-wide">Price Range</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="pl-7 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg text-sm"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="pl-7 h-11 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Showing <span className="font-bold text-indigo-600">{products.items.length}</span> of{' '}
                  <span className="font-bold text-gray-900">{products.total}</span> products
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Sort by:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[180px] justify-between border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg"
                    >
                      <span className="font-medium">
                        {filters.sortBy === 'createdAt'
                          ? 'Newest Arrivals'
                          : filters.sortBy === 'price' && filters.sortOrder === 'asc'
                          ? 'Price: Low to High'
                          : filters.sortBy === 'price' && filters.sortOrder === 'desc'
                          ? 'Price: High to Low'
                          : 'Best Rated'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        handleFilterChange('sortBy', 'createdAt');
                        handleFilterChange('sortOrder', 'desc');
                      }}
                    >
                      Newest Arrivals
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handleFilterChange('sortBy', 'price');
                        handleFilterChange('sortOrder', 'asc');
                      }}
                    >
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handleFilterChange('sortBy', 'price');
                        handleFilterChange('sortOrder', 'desc');
                      }}
                    >
                      Price: High to Low
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        handleFilterChange('sortBy', 'rating');
                        handleFilterChange('sortOrder', 'desc');
                      }}
                    >
                      Best Rated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border-0 shadow-sm bg-white">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <CardContent className="p-5">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex items-center justify-between pt-2 border-t">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-9 w-9 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.items.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters or search terms.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setFilters({ ...filters, search: '', categoryId: '', minPrice: '', maxPrice: '' })
                  }
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.items.map((product) => (
                    <Card
                      key={product.id}
                      className="group overflow-hidden border-2 border-border/50 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-lg hover:shadow-2xl transition-all duration-500 bg-background rounded-2xl hover:-translate-y-2"
                    >
                      <Link
                        to={`/product/${product.slug}`}
                        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
                      >
                        <img
                          src={product.images?.[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-transparent group-hover:from-black/5 transition-opacity duration-300" />
                        {product.salePrice && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            -
                            {Math.round(
                              ((product.price - product.salePrice) / product.price) * 100,
                            )}
                            %
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold tracking-wider border-2 border-white px-4 py-1">
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </Link>
                      <CardContent className="p-5">
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                            {product.category?.name || 'Clothing'}
                          </p>
                          <Link to={`/product/${product.slug}`}>
                            <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[56px]">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex flex-col gap-1">
                            {product.salePrice ? (
                              <>
                                <span className="text-lg font-bold text-red-600">
                                  {formatPrice(product.salePrice)}
                                </span>
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatPrice(product.price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addItem(product)}
                            disabled={product.stock === 0}
                            className="rounded-full px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" /> Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {products.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1, false)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-4">
                      {Array.from({ length: products.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleFilterChange('page', p, false)}
                          className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                            filters.page === p
                              ? 'bg-primary text-primary-foreground'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      disabled={filters.page === products.totalPages}
                      onClick={() => handleFilterChange('page', filters.page + 1, false)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
