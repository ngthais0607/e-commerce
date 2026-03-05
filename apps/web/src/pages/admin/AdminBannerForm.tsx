import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface BannerFormData {
  title: string;
  image: string;
  link: string;
  position: string;
  isActive: boolean;
  sortOrder: string;
  description: string;
}

export default function AdminBannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const { toast } = useToast();
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    image: '',
    link: '',
    position: 'homepage',
    isActive: true,
    sortOrder: '0',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchBanner();
    }
  }, [id]);

  const fetchBanner = async () => {
    try {
      setFetching(true);
      const res = await api.get(`/admin/banners/${id}`);
      const banner = res.data;
      
      if (banner) {
        setFormData({
          title: banner.title || '',
          image: banner.image || '',
          link: banner.link || '',
          position: banner.position || 'homepage',
          isActive: banner.isActive ?? true,
          sortOrder: String(banner.sortOrder || 0),
          description: banner.description || '',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Banner not found',
        });
        navigate('/admin/banners');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error fetching banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to fetch banner. Please try again.',
      });
      navigate('/admin/banners');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title and Image are required',
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        image: formData.image,
        link: formData.link || undefined,
        position: formData.position,
        isActive: formData.isActive,
        sortOrder: parseInt(formData.sortOrder, 10) || 0,
        description: formData.description || undefined,
      };

      if (id) {
        await api.put(`/admin/banners/${id}`, payload);
        toast({
          title: 'Success',
          description: 'Banner updated successfully',
        });
      } else {
        await api.post('/admin/banners', payload);
        toast({
          title: 'Success',
          description: 'Banner created successfully',
        });
      }
      
      navigate('/admin/banners');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; details?: any } } };
      console.error('Error saving banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to save banner. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/banners')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-foreground dark:text-white">
          {id ? 'Edit Banner' : 'Create Banner'}
        </h1>
      </div>

      <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
        <CardHeader>
          <CardTitle>Banner Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="image">Image URL *</Label>
              <Input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                required
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="mt-1"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="mt-1 w-full px-4 py-2 border border-border dark:border-white/10 rounded-md bg-background dark:bg-slate-900 text-foreground"
              >
                <option value="homepage">Homepage</option>
                <option value="category">Category</option>
                <option value="product">Product</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                className="mt-1"
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible on website)
              </Label>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600"
              >
                {loading ? 'Saving...' : id ? 'Update Banner' : 'Create Banner'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/banners')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

