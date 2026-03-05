import { useEffect, useState } from 'react';
import api from '@/services/api';
import type { User, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState<PaginatedResponse<User>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/admin/users', { params });
      if (res.data && res.data.items) {
        setUsers(res.data);
      } else {
        setUsers({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        });
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { status: number; data?: { error?: string } };
        message?: string;
      };
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You need to log in with an Admin account to view users',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description:
              err.response.data?.error || err.message || 'Failed to fetch users. Please try again.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: err.message || 'Failed to connect to server. Please try again.',
        });
      }
      // Set empty state on error
      setUsers({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchUsers();
  };

  const updateUser = async (id: number, data: { role?: string; isActive?: boolean }) => {
    try {
      await api.put(`/admin/users/${id}`, data);
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update user. Please try again.',
      });
    }
  };

  if (loading && users.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-foreground dark:text-white">Users</h1>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background dark:bg-slate-900/50 border-border dark:border-white/10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-border dark:border-white/10 rounded-md bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
        </select>
        <Button onClick={handleSearch} className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {users.items.length === 0 ? (
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground/80">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.items.map((user) => (
            <Card key={user.id} className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg text-foreground dark:text-white">{user.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-1">{user.email}</p>
                    {user.phone && <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-1">{user.phone}</p>}
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground/70">
                      Joined: {formatDate(user.createdAt)}
                    </p>
                    {user._count && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mt-1">
                        Orders: {user._count.orders || 0}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      className="px-3 py-1 border border-border dark:border-white/10 rounded-md text-sm bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                    </select>
                    <select
                      value={user.isActive ? 'true' : 'false'}
                      onChange={(e) =>
                        updateUser(user.id, { isActive: e.target.value === 'true' })
                      }
                      className="px-3 py-1 border border-border dark:border-white/10 rounded-md text-sm bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {users.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={users.page <= 1}
            onClick={() => fetchUsers(users.page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {users.page} of {users.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={users.page >= users.totalPages}
            onClick={() => fetchUsers(users.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

