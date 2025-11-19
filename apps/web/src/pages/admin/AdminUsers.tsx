import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { User, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

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

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params: any = { pageSize: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      await api.put(`/users/${id}`, data);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  if (loading && users.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>

      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
        </select>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {users.items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.items.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                    {user.phone && <p className="text-sm text-muted-foreground mb-1">{user.phone}</p>}
                    <p className="text-xs text-muted-foreground">
                      Joined: {formatDate(user.createdAt)}
                    </p>
                    {user._count && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Orders: {user._count.orders || 0}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value })}
                      className="px-3 py-1 border rounded-md text-sm"
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
                      className="px-3 py-1 border rounded-md text-sm"
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
    </div>
  );
}

