import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Coupon } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${code}`);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

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
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Button onClick={() => navigate('/admin/coupons/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No coupons found</p>
            <Button onClick={() => navigate('/admin/coupons/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <Card key={coupon.code}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{coupon.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Code: <span className="font-mono font-semibold">{coupon.code}</span>
                    </p>
                    <p className="text-lg font-bold text-primary mb-2">
                      {coupon.type === 'PERCENT' ? `${coupon.value}%` : `$${coupon.value}`} off
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      coupon.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {coupon.description && (
                  <p className="text-sm text-muted-foreground mb-3">{coupon.description}</p>
                )}

                <div className="space-y-1 mb-4 text-xs text-muted-foreground">
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
                    onClick={() => handleDelete(coupon.code)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

