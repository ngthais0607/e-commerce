import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Order, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isStaff = user?.role === 'STAFF';
  const [orders, setOrders] = useState<PaginatedResponse<Order>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { toast } = useToast();

  // Staff can update to PROCESSING, SHIPPED, COMPLETED, or CANCELLED
  const getAllowedStatuses = (currentStatus: string) => {
    if (!isStaff) {
      return ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    }
    
    const statusOrder = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const allowedStatuses = ['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
    
    // Filter to only show statuses that are forward in the flow (CANCELLED is always allowed)
    return allowedStatuses.filter(status => {
      if (status === 'CANCELLED') {
        // Can cancel from any status except SHIPPED/COMPLETED
        return !['SHIPPED', 'COMPLETED'].includes(currentStatus);
      }
      const statusIndex = statusOrder.indexOf(status);
      return statusIndex >= currentIndex;
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/orders', { params });
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
            pageSize: 20,
            totalPages: 1,
          });
        } else {
          // Try to extract items from response
          setOrders(res.data);
        }
      } else {
        setOrders({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to fetch orders. Please try again.',
      });
      setOrders({
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

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast({
        title: 'Success',
        description: `Order status updated to ${status}`,
      });
      fetchOrders();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to update order status. Please try again.',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      PAID: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      PROCESSING: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      SHIPPED: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
      COMPLETED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      CANCELLED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400';
  };

  if (loading && orders.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-foreground dark:text-white">Orders</h1>

      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-border dark:border-white/10 rounded-md bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {orders.items.length === 0 ? (
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground dark:text-muted-foreground/80">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.items.map((order) => (
            <Card key={order.id} className="hover:shadow-md dark:hover:shadow-indigo-500/10 transition-shadow bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-semibold text-lg text-foreground dark:text-white">Order #{order.orderNumber}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.paymentStatus)}`}>
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground/80 mb-1">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="text-sm mb-1 text-foreground dark:text-foreground/90">
                      <span className="font-medium">{order.user?.name}</span> ({order.user?.email})
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">
                      {order.items.length} item(s) • Total: {formatPrice(order.total)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="border-border dark:border-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="px-3 py-1 border border-border dark:border-white/10 rounded-md text-sm bg-background dark:bg-slate-900/50 text-foreground dark:text-white"
                    >
                      {!isStaff ? (
                        <>
                          <option value="PENDING">Pending</option>
                          <option value="PAID">Paid</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </>
                      ) : (
                        <>
                          <option value={order.status}>
                            {order.status}
                          </option>
                          {getAllowedStatuses(order.status).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {orders.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={orders.page <= 1}
            onClick={() => fetchOrders(orders.page - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {orders.page} of {orders.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={orders.page >= orders.totalPages}
            onClick={() => fetchOrders(orders.page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

