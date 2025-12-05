import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Category, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Search, Filter, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Shop All Products</h1>
          <p className="text-muted-foreground mt-2">Find the perfect item for your needs from our collection.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 space-y-8 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center gap-2 mb-4 font-semibold text-lg">
                <Filter className="h-5 w-5" /> Filters
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-900">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-900">Categories</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleFilterChange('categoryId', '')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        !filters.categoryId 
                          ? 'bg-primary text-primary-foreground font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleFilterChange('categoryId', cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          filters.categoryId === String(cat.id)
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3 text-gray-900">Price Range</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border">
              <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
                Showing <span className="font-medium text-foreground">{products.items.length}</span> of <span className="font-medium text-foreground">{products.total}</span> results
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[160px] justify-between">
                      {filters.sortBy === 'createdAt' ? 'Newest Arrivals' : 
                       filters.sortBy === 'price' && filters.sortOrder === 'asc' ? 'Price: Low to High' :
                       filters.sortBy === 'price' && filters.sortOrder === 'desc' ? 'Price: High to Low' : 'Best Rated'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { handleFilterChange('sortBy', 'createdAt'); handleFilterChange('sortOrder', 'desc'); }}>
                      Newest Arrivals
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { handleFilterChange('sortBy', 'price'); handleFilterChange('sortOrder', 'asc'); }}>
                      Price: Low to High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { handleFilterChange('sortBy', 'price'); handleFilterChange('sortOrder', 'desc'); }}>
                      Price: High to Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { handleFilterChange('sortBy', 'rating'); handleFilterChange('sortOrder', 'desc'); }}>
                      Best Rated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : products.items.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setFilters({ ...filters, search: '', categoryId: '', minPrice: '', maxPrice: '' })}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.items.map((product) => (
                    <Card key={product.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
                      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={product.images[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.salePrice && (
                          <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold tracking-wider border-2 border-white px-4 py-1">SOLD OUT</span>
                          </div>
                        )}
                      </Link>
                      <CardContent className="p-5">
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                          {product.shortDesc || product.description?.substring(0, 60)}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex flex-col">
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
                            className="rounded-full px-4"
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
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 px-4">
                      {Array.from({ length: products.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleFilterChange('page', p)}
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
                      onClick={() => handleFilterChange('page', filters.page + 1)}
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