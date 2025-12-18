import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Product, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Helper function to get product image or generate placeholder
const getProductImage = (product: Product): string => {
  if (product.images && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }
  // Generate placeholder image based on product ID for consistency
  return `https://picsum.photos/seed/${product.id}/400/300`;
};

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
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { pageSize: 20 };
      if (search) params.search = search;
      const res = await api.get('/admin/products', { params });
      setProducts(res.data);
    } catch (error: unknown) {
      const err = error as {
        response?: { status: number; data?: unknown };
      };
      console.error('Error fetching products:', error);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        if (err.response.status === 401 || err.response.status === 403) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You need to login with an Admin account to view products',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to fetch products. Please try again.',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => {
    setLoading(true);
    fetchProducts();
  };

  const handleDeleteClick = (id: number) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await api.delete(`/admin/products/${productToDelete}`);
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error deleting product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to delete product. Please try again.',
      });
    }
  };

  const handleImageError = (productId: number) => {
    setImageErrors((prev) => new Set(prev).add(productId));
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
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Products</h1>
        <Button onClick={() => navigate('/admin/products/new')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600">
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
          {products.items.map((product) => {
            const imageUrl = imageErrors.has(product.id)
              ? `https://picsum.photos/seed/${product.id}/400/300`
              : getProductImage(product);
            
            return (
              <Card key={product.id} className="overflow-hidden bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
                <div className="relative w-full h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(product.id)}
                  />
                </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2 text-foreground dark:text-white">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {product.salePrice ? (
                    <>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-sm text-muted-foreground dark:text-muted-foreground/70 line-through">
                        {formatPrice(product.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-foreground dark:text-white">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                    Stock: {product.stock}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
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
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

