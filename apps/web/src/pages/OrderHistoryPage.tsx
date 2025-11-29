import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { Order, PaginatedResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<PaginatedResponse<Order>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
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

