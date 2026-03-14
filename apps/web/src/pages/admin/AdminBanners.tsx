import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Banner } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
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
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchBanners = async () => {
    try {
      const res = await api.get('/admin/banners');
      setBanners(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error fetching banners:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to fetch banners. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/banners/${id}`, { isActive: !currentStatus });
      toast({
        title: 'Success',
        description: `Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      fetchBanners();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error updating banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to update banner. Please try again.',
      });
    }
  };

  const handleDeleteClick = (id: number) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;
    
    try {
      await api.delete(`/admin/banners/${bannerToDelete}`);
      toast({
        title: 'Success',
        description: 'Banner deleted successfully',
      });
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
      fetchBanners();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error deleting banner:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to delete banner. Please try again.',
      });
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Banners</h1>
        <Button
          onClick={() => navigate('/admin/banners/new')}
          className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-600 hover:via-sky-500 hover:to-cyan-500 text-white shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground/80 mb-4">No banners found</p>
            <Button
              onClick={() => navigate('/admin/banners/new')}
              className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-600 hover:via-sky-500 hover:to-cyan-500 text-white shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10 overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      banner.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-2 text-foreground dark:text-white">{banner.title}</h3>
                  {banner.description && (
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-2 line-clamp-2">
                      {banner.description}
                    </p>
                  )}
                  <div className="space-y-1 text-xs text-muted-foreground dark:text-muted-foreground/70">
                    <p>Position: <span className="font-semibold text-foreground dark:text-white">{banner.position}</span></p>
                    <p>Sort Order: <span className="font-semibold text-foreground dark:text-white">{banner.sortOrder}</span></p>
                    {banner.link && (
                      <p className="truncate">Link: <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{banner.link}</a></p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(banner.id, banner.isActive)}
                    className="flex-1"
                  >
                    {banner.isActive ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/banners/${banner.id}/edit`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(banner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this banner? This action cannot be undone.
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

