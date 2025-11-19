import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Category, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

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
      console.error('Error fetching categories:', error);
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
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleFilterChange('categoryId', '')}
                className={`block w-full text-left px-3 py-2 rounded ${
                  !filters.categoryId ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange('categoryId', cat.id)}
                  className={`block w-full text-left px-3 py-2 rounded ${
                    filters.categoryId === String(cat.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Price Range</h3>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <Input
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="max-w-sm"
            />
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="px-4 py-2 border rounded-md"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="rating:desc">Best Rated</option>
            </select>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.items.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <Link to={`/product/${product.slug}`}>
                      <img
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    </Link>
                    <CardContent className="p-4">
                      <Link to={`/product/${product.slug}`}>
                        <h3 className="font-semibold mb-2 hover:text-primary">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.salePrice ? (
                            <div>
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(product.salePrice)}
                              </span>
                              <span className="text-sm text-muted-foreground line-through ml-2">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addItem(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {products.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    disabled={filters.page === 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {filters.page} of {products.totalPages}
                  </span>
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
  );
}

