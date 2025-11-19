import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<PaginatedResponse<Product>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const params: any = { pageSize: 20 };
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  if (loading && products.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => navigate('/admin/products/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {products.items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Button onClick={() => navigate('/admin/products/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.items.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <img
                src={product.images?.[0] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {product.salePrice ? (
                    <>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    Stock: {product.stock}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {products.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={products.page === 1}
            onClick={() => {
              // TODO: Implement pagination
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {products.page} of {products.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={products.page === products.totalPages}
            onClick={() => {
              // TODO: Implement pagination
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

