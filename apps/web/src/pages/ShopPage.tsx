import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { ShoppingCart, Sparkles } from 'lucide-react'

import api from '@/services/api'
import type { Product, Category, PaginatedResponse } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
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

  const applySort = (sortBy: string, sortOrder: string) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const sortOptions = [
    { label: 'Newest', value: 'createdAt:desc' },
    { label: 'Price: Low to High', value: 'price:asc' },
    { label: 'Price: High to Low', value: 'price:desc' },
    { label: 'Best Rated', value: 'rating:desc' },
  ]

  const quickFilters = [
    { label: 'Best sellers', sortBy: 'rating', sortOrder: 'desc' },
    { label: 'Biggest discounts', sortBy: 'salePrice', sortOrder: 'asc' },
    { label: 'New arrivals', sortBy: 'createdAt', sortOrder: 'desc' },
  ]

  const renderPrice = (product: Product) =>
    product.salePrice ? (
      <div>
        <span className="text-lg font-bold text-primary">{formatPrice(product.salePrice)}</span>
        <span className="ml-2 text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
      </div>
    ) : (
      <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
    )

  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-background px-6 py-10 text-center shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
          <Badge variant="secondary" className="gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Curated collections
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Shop the latest arrivals</h1>
          <p className="text-muted-foreground">
            Discover new drops every week. Filter by category, price, or best-selling rankings and add items to your cart
            with one click.
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
              <CardDescription>Browse by collection</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={!filters.categoryId ? 'default' : 'outline'}
                onClick={() => handleFilterChange('categoryId', '')}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={filters.categoryId === String(cat.id) ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('categoryId', String(cat.id))}
                >
                  {cat.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price range</CardTitle>
              <CardDescription>Set a comfortable budget</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input
                type="number"
                placeholder="Minimum"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Maximum"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick filters</CardTitle>
              <CardDescription>Popular picks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <Badge
                  key={filter.label}
                  variant="outline"
                  className={cn(
                    'cursor-pointer',
                    filters.sortBy === filter.sortBy && filters.sortOrder === filter.sortOrder && 'border-primary text-primary'
                  )}
                  onClick={() => applySort(filter.sortBy, filter.sortOrder)}
                >
                  {filter.label}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search by product, SKU, or keyword..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="min-w-[240px] flex-1"
            />
            <Select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split(':')
                applySort(sortBy, sortOrder)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort products" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="space-y-4 p-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/4" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              {products.items.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <p className="text-lg font-medium">No products match these filters yet.</p>
                    <p className="text-muted-foreground">Try clearing filters or searching for another keyword.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {products.items.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <Link to={`/product/${product.slug}`}>
                        <img
                          src={product.images[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="h-52 w-full object-cover transition-transform duration-200 hover:scale-[1.02]"
                          loading="lazy"
                        />
                      </Link>
                      <CardContent className="space-y-3 p-5">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{product.category?.name ?? 'Featured'}</Badge>
                          {product.rating && (
                            <span className="text-sm text-muted-foreground">{Number(product.rating || 0).toFixed(1)} ★</span>
                          )}
                        </div>
                        <Link to={`/product/${product.slug}`} className="inline-block text-lg font-semibold">
                          {product.name}
                        </Link>
                        {renderPrice(product)}
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => addItem(product)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {product.stock === 0 ? 'Sold out' : 'Add to cart'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {products.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(filters.page - 1) * filters.pageSize + 1}-
                    {Math.min(filters.page * filters.pageSize, products.total)} of {products.total} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={filters.page === 1}
                      onClick={() => handleFilterChange('page', filters.page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {filters.page} / {products.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={filters.page === products.totalPages}
                      onClick={() => handleFilterChange('page', filters.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

