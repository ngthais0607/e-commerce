import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (field: 'status' | 'paymentStatus', value: string) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { [field]: value });
      await fetchOrder();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const updateTracking = async (trackingCode: string) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { trackingCode });
      await fetchOrder();
    } catch (error) {
      console.error('Error updating tracking:', error);
      alert('Failed to update tracking code');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button onClick={() => navigate('/admin/orders')}>Back to Orders</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                    <img
                      src={item.product?.images?.[0] || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <p className="font-semibold mt-2">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
                  {order.shippingAddress.city}
                </p>
                {order.shippingAddress.postalCode && (
                  <p>Postal Code: {order.shippingAddress.postalCode}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Order Status</label>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus('status', e.target.value)}
                  disabled={updating}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => updateStatus('paymentStatus', e.target.value)}
                  disabled={updating}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Payment Method</label>
                <p className="px-4 py-2 bg-muted rounded-md">{order.paymentMethod}</p>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Tracking Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={order.trackingCode || ''}
                    placeholder="Enter tracking code"
                    className="flex-1 px-4 py-2 border rounded-md"
                    onBlur={(e) => {
                      if (e.target.value !== order.trackingCode) {
                        updateTracking(e.target.value);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Created: {formatDate(order.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Updated: {formatDate(order.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{order.user?.name}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
              <p className="text-sm">{order.phone}</p>
              {order.email && <p className="text-sm">{order.email}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

