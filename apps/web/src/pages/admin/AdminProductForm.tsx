import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import type { Category } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ProductFormData {
  name: string;
  shortDesc: string;
  description: string;
  price: string;
  salePrice: string;
  stock: string;
  sku: string;
  images: string[];
  categoryId: string;
  brand: string;
  isActive: boolean;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    shortDesc: '',
    description: '',
    price: '',
    salePrice: '',
    stock: '0',
    sku: '',
    images: [''],
    categoryId: '',
    brand: '',
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error: unknown) {
      console.error('Error fetching categories:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch categories. Please try again.',
      });
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/admin/products/${id}`);
      const product = res.data;
      setFormData({
        name: product.name || '',
        shortDesc: product.shortDesc || '',
        description: product.description || '',
        price: String(product.price || ''),
        salePrice: String(product.salePrice || ''),
        stock: String(product.stock || '0'),
        sku: product.sku || '',
        images: product.images && product.images.length > 0 ? product.images : [''],
        categoryId: String(product.categoryId || ''),
        brand: product.brand || '',
        // DB có thể trả isActive = 0/1, convert sang boolean để hợp lệ với schema
        isActive:
          product.isActive !== undefined ? Boolean(product.isActive) : true,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error fetching product:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch product. Please try again.',
      });
    }
  };

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        shortDesc: formData.shortDesc || undefined,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        stock: parseInt(formData.stock, 10),
        sku: formData.sku || undefined,
        images: formData.images.filter(img => img.trim() !== ''),
        categoryId: parseInt(formData.categoryId, 10),
        brand: formData.brand || undefined,
        isActive: formData.isActive,
      };

      if (id) {
        await api.put(`/admin/products/${id}`, data);
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        await api.post('/admin/products', data);
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      navigate('/admin/products');
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string; message?: string; details?: unknown } };
      };
      console.error('Error saving product:', err.response?.data || error);

      const detailText =
        (err.response?.data as { details?: { message?: string }[] })?.details?.[0]?.message ||
        (err.response?.data?.details ? JSON.stringify(err.response.data.details) : undefined);

      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.error ||
          err.response?.data?.message ||
          detailText ||
          'Failed to save product. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{id ? 'Edit Product' : 'Create Product'}</h1>
        <Button variant="outline" onClick={() => navigate('/admin/products')}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium">Product Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Sale Price</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Stock *</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">SKU</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Brand</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Status</label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Short Description</label>
              <textarea
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                className="w-full px-4 py-2 border rounded-md min-h-[100px]"
                placeholder="Brief description..."
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-md min-h-[200px]"
                placeholder="Full product description..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Images *</label>
                <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                  Add Image
                </Button>
              </div>
              {formData.images.map((img, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    type="url"
                    value={img}
                    onChange={(e) => updateImage(index, e.target.value)}
                    placeholder="Image URL"
                    required={index === 0}
                  />
                  {formData.images.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeImage(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

