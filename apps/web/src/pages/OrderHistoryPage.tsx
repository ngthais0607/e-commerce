import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Order, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderHistoryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PaginatedResponse<Order>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect admin and staff to admin orders panel
      if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
        navigate('/admin/orders');
        return;
      }
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.role, navigate]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for user:', user?.id, user?.email);
      const res = await api.get('/orders');
      console.log('Orders API response:', res);
      console.log('Orders data:', res.data);
      console.log('User info:', { id: user?.id, email: user?.email, isAuthenticated });
      
      // Handle both direct data and paginated response
      if (res.data) {
        if (res.data.items && Array.isArray(res.data.items)) {
          // Paginated response
          setOrders(res.data);
        } else if (Array.isArray(res.data)) {
          // Direct array response
          setOrders({
            items: res.data,
            total: res.data.length,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          });
        } else if (res.data.items === undefined && res.data.total === undefined) {
          // Empty or invalid response
          console.warn('Invalid orders response format:', res.data);
          setOrders({
            items: [],
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 0,
          });
        } else {
          setOrders(res.data);
        }
      } else {
        setOrders({
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 0,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      const err = error as { response?: { data?: { error?: string }; status?: number }; message?: string };
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load orders';
      console.error('Error details:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
      });
      setOrders({
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Please login to view your orders</p>
          <Link to="/login">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
      {user && (
        <p className="text-sm text-muted-foreground mb-4">
          Logged in as: {user.email} (ID: {user.id})
        </p>
      )}
      {orders.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No orders yet</p>
          <Link to="/shop">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Start Shopping
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.items.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link to={`/orders/${order.id}`}>
                      <h3 className="font-semibold hover:text-primary">
                        Order #{order.orderNumber}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {order.items.length} item(s)
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

