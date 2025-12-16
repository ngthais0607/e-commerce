import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function AdminCouponForm() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENT',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
  });

  useEffect(() => {
    if (code) {
      fetchCoupon();
    }
  }, [code]);

  const fetchCoupon = async () => {
    try {
      const res = await api.get(`/coupons/${code}`);
      const coupon = res.data;
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: String(coupon.value),
        minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
        validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
        isActive: coupon.isActive,
      });
    } catch (error: any) {
      console.error('Error fetching coupon:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch coupon. Please try again.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        value: parseFloat(formData.value),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : undefined,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        isActive: formData.isActive,
      };

      if (code) {
        await api.put(`/coupons/${code}`, data);
        toast({
          title: 'Success',
          description: 'Coupon updated successfully',
        });
      } else {
        await api.post('/coupons', data);
        toast({
          title: 'Success',
          description: 'Coupon created successfully',
        });
      }

      navigate('/admin/coupons');
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.error || error.response?.data?.message || 'Failed to save coupon. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{code ? 'Edit Coupon' : 'Create Coupon'}</h1>
        <Button variant="outline" onClick={() => navigate('/admin/coupons')}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coupon Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium">Coupon Code *</label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  required
                  disabled={!!code}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PERCENT' | 'FIXED' })}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                >
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Value *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Min Order Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Max Discount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Usage Limit</label>
                <Input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  placeholder="Leave empty for unlimited"
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

              <div>
                <label className="block mb-2 text-sm font-medium">Valid From *</label>
                <Input
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Valid Until *</label>
                <Input
                  type="datetime-local"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-md min-h-[100px]"
                placeholder="Coupon description..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : code ? 'Update Coupon' : 'Create Coupon'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/admin/coupons')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

