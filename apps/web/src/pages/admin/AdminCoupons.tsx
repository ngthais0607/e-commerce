import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Coupon } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

export default function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error fetching coupons:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to fetch coupons. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (code: string) => {
    setCouponToDelete(code);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return;
    
    try {
      await api.delete(`/admin/coupons/${couponToDelete}`);
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully',
      });
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
      fetchCoupons();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error deleting coupon:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to delete coupon. Please try again.',
      });
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground dark:text-white">Coupons</h1>
        <Button onClick={() => navigate('/admin/coupons/new')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground/80 mb-4">No coupons found</p>
            <Button onClick={() => navigate('/admin/coupons/new')} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600">
              <Plus className="h-4 w-4 mr-2" />
              Create First Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.code} className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-foreground dark:text-white">{coupon.name}</h3>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-2">
                      Code: <span className="font-mono font-semibold text-foreground dark:text-white">{coupon.code}</span>
                    </p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                      {coupon.type === 'PERCENT' ? `${coupon.value}%` : `$${coupon.value}`} off
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      coupon.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {coupon.description && (
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-3">{coupon.description}</p>
                )}

                <div className="space-y-1 mb-4 text-xs text-muted-foreground dark:text-muted-foreground/70">
                  {coupon.minOrderAmount && (
                    <p>Min order: ${coupon.minOrderAmount}</p>
                  )}
                  {coupon.maxDiscount && (
                    <p>Max discount: ${coupon.maxDiscount}</p>
                  )}
                  <p>
                    Valid: {new Date(coupon.validFrom).toLocaleDateString()} -{' '}
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </p>
                  <p>
                    Used: {coupon.usedCount} / {coupon.usageLimit || '∞'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/coupons/${coupon.code}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(coupon.code)}
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
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
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

