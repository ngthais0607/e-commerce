import { useState, useEffect } from 'react';
import api from '@/services/api';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ name: string; phone: string; password: string }>({
    name: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get<User>('/auth/me');
      const userData = res.data;
      setUser(userData);
      setFormData({ name: userData.name, phone: userData.phone || '', password: '' });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updateData: { name: string; phone: string; password?: string } = {
        name: formData.name,
        phone: formData.phone,
      };
      if (formData.password) updateData.password = formData.password;
      // Backend mount: app.use('/api/clients', clientProfileRoutes)
      await api.put('/clients/profile', updateData);
      await fetchUser();
      toast({
        title: 'Profile updated',
        description: 'Your account information was saved successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update your profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="flex justify-center p-8"><LoadingSpinner /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Email</label>
                <Input value={user.email} disabled />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">New Password (optional)</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

