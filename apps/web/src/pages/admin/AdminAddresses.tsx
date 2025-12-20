import { useEffect, useState } from 'react';
import api from '@/services/api';
import type { Address, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Search, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
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

export default function AdminAddresses() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAddresses();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) {
      // Staff không có quyền truy cập /admin/users
      return;
    }
    try {
      const res = await api.get('/admin/users', { params: { pageSize: 1000 } });
      if (res.data && res.data.items) {
        setUsers(res.data.items);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Không hiển thị error toast vì đây là optional data
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (userIdFilter) params.userId = userIdFilter;
      
      console.log('Fetching addresses with params:', params);
      const res = await api.get('/admin/addresses', { params });
      console.log('Addresses API response:', res.data);
      
      const addressesData = Array.isArray(res.data) ? res.data : [];
      console.log(`Loaded ${addressesData.length} addresses`);
      setAddresses(addressesData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      console.error('Error fetching addresses:', error);
      console.error('Error response:', err.response?.data);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || err.response?.data?.error || 'Failed to fetch addresses. Please try again.',
      });
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchAddresses();
  };

  const handleDeleteClick = (id: number) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    
    try {
      await api.delete(`/admin/addresses/${addressToDelete}`);
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      });
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error deleting address:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to delete address. Please try again.',
      });
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };

  const getUserEmail = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : '';
  };

  const filteredAddresses = addresses.filter((address) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      address.name.toLowerCase().includes(searchLower) ||
      address.phone.includes(search) ||
      address.address.toLowerCase().includes(searchLower) ||
      address.city.toLowerCase().includes(searchLower) ||
      address.district.toLowerCase().includes(searchLower) ||
      getUserName(address.userId).toLowerCase().includes(searchLower)
    );
  });

  if (loading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <MapPin className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">Shipping Addresses</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mt-1">
            Manage customer shipping addresses
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, phone, address, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background dark:bg-slate-900/50 border-border dark:border-white/10"
          />
        </div>
        {isAdmin && (
          <select
            value={userIdFilter}
            onChange={(e) => {
              setUserIdFilter(e.target.value);
              setTimeout(() => fetchAddresses(), 100);
            }}
            className="px-4 py-2 border border-border dark:border-white/10 rounded-md bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        )}
        <Button onClick={handleSearch} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {filteredAddresses.length === 0 ? (
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground/80">No addresses found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddresses.map((address) => (
            <Card key={address.id} className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground dark:text-white mb-1">
                        {address.name}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/70">
                        📞 {address.phone}
                      </p>
                    </div>
                    {address.isDefault && (
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="mb-3 p-2 bg-muted/50 dark:bg-slate-800/30 rounded text-xs">
                      <p className="text-muted-foreground dark:text-muted-foreground/80 mb-1">
                        <strong>Customer:</strong> {getUserName(address.userId)}
                      </p>
                      <p className="text-muted-foreground dark:text-muted-foreground/70">
                        {getUserEmail(address.userId)}
                      </p>
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="mb-3 p-2 bg-muted/50 dark:bg-slate-800/30 rounded text-xs">
                      <p className="text-muted-foreground dark:text-muted-foreground/80">
                        <strong>User ID:</strong> {address.userId}
                      </p>
                    </div>
                  )}

                  <div className="mb-3 p-3 bg-muted dark:bg-slate-800/50 rounded-md border border-border dark:border-white/10">
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mb-2 font-medium">
                      SHIPPING ADDRESS:
                    </p>
                    <p className="text-sm text-foreground dark:text-white mb-1 font-medium">{address.address}</p>
                    <p className="text-sm text-foreground dark:text-white">
                      {address.ward}, {address.district}, {address.city}
                    </p>
                    {address.postalCode && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mt-1">
                        Postal Code: {address.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground/70 mb-4 pt-3 border-t border-border dark:border-white/10">
                  <span>📅 Created: {formatDate(address.createdAt)}</span>
                  {address.updatedAt !== address.createdAt && (
                    <span>Updated: {formatDate(address.updatedAt)}</span>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(address.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
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

