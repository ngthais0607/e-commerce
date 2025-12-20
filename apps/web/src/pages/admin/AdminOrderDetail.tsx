import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';

interface OrderMessage {
  id: number;
  orderId: number;
  clientId: number | null;
  staffId: number | null;
  senderRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  message: string;
  createdAt: string;
}

const ORDER_STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const PAYMENT_STATUS_OPTIONS = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'FAILED'],
  FAILED: ['PENDING', 'PAID'],
  PAID: ['REFUNDED'],
  REFUNDED: [],
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  const isStaff = user?.role === 'STAFF';

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchMessages();

      const socket = getSocket(token ?? null);
      if (socket) {
        socket.emit('join-order-room', Number(id));

        socket.on('order-message', (payload: { orderId: number; message: OrderMessage }) => {
          if (payload.orderId === Number(id)) {
            setMessages((prev) => [...prev, payload.message]);
          }
        });
      }

      return () => {
        if (socket) {
          socket.emit('leave-order-room', Number(id));
          socket.off('order-message');
        }
      };
    }
  }, [id, token]);

  const getAllowedPaymentStatuses = () => {
    if (!order) return PAYMENT_STATUS_OPTIONS;
    const next = PAYMENT_STATUS_TRANSITIONS[order.paymentStatus] || [];
    return Array.from(new Set([order.paymentStatus, ...next]));
  };

  const isOrderStatusOptionDisabled = (value: string) => {
    if (!order) return false;
    if (value === order.status) return false;
    
    // For both ADMIN and STAFF: Disable CANCELLED if order is already SHIPPED or COMPLETED
    if (value === 'CANCELLED') {
      const blockedStatuses = ['SHIPPED', 'COMPLETED'];
      if (blockedStatuses.includes(order.status)) {
        return true;
      }
    }
    
    // For STAFF: Allow PROCESSING, SHIPPED, COMPLETED, or CANCELLED
    if (isStaff) {
      const staffAllowedStatuses = ['PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
      if (!staffAllowedStatuses.includes(value)) {
        return true;
      }
      
      // Staff cannot change status backwards (except for CANCELLED which is allowed from any status)
      if (value !== 'CANCELLED') {
        const statusOrder = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED'];
        const currentIndex = statusOrder.indexOf(order.status);
        const newIndex = statusOrder.indexOf(value);
        if (newIndex < currentIndex) {
          return true;
        }
      }
    }
    
    return false;
  };

  const isPaymentStatusOptionDisabled = (value: string) => {
    if (!order) return false;
    const allowed = new Set(getAllowedPaymentStatuses());
    if (value === order.paymentStatus) return false;
    return !allowed.has(value);
  };

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error fetching order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch order. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/admin/orders/${id}/messages`);
      setMessages(res.data.messages || []);
    } catch (error: unknown) {
      console.error('Error fetching order messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const updateStatus = async (field: 'status' | 'paymentStatus', value: string) => {
    setUpdating(true);
    try {
      if (field === 'status') {
        await api.put(`/admin/orders/${id}/status`, { status: value });
      } else {
        await api.put(`/admin/orders/${id}/payment-status`, { status: value });
      }
      toast({
        title: 'Success',
        description: `Order ${field} updated to ${value}`,
      });
      await fetchOrder();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error updating order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update order. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const updateTracking = async (trackingCode: string) => {
    setUpdating(true);
    try {
      await api.put(`/admin/orders/${id}/status`, { trackingCode });
      toast({
        title: 'Success',
        description: 'Tracking code updated successfully',
      });
      await fetchOrder();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error updating tracking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          err.response?.data?.message || 'Failed to update tracking code. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const sendMessage = async () => {
    if (!id || !newMessage.trim()) return;
    try {
      const res = await api.post(`/admin/orders/${id}/messages`, { message: newMessage.trim() });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send message. Please try again.',
      });
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
                  {ORDER_STATUS_OPTIONS.map((value) => {
                    const isDisabled = isOrderStatusOptionDisabled(value);
                    return (
                      <option key={value} value={value} disabled={isDisabled}>
                        {value.charAt(0) + value.slice(1).toLowerCase()}
                        {isDisabled && value === 'CANCELLED' && ' (Cannot cancel shipped/completed orders)'}
                      </option>
                    );
                  })}
                </select>
                {isOrderStatusOptionDisabled('CANCELLED') && order.status !== 'CANCELLED' && !isStaff && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cannot cancel orders that are already shipped or completed
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => updateStatus('paymentStatus', e.target.value)}
                  disabled={updating || isStaff}
                  className="w-full px-4 py-2 border rounded-md"
                >
                  {getAllowedPaymentStatuses().map((value) => (
                    <option key={value} value={value} disabled={isPaymentStatusOptionDisabled(value)}>
                      {value.charAt(0) + value.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {isStaff && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Staff cannot update payment status
                  </p>
                )}
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
                    disabled={updating}
                    onBlur={(e) => {
                      if (e.target.value !== order.trackingCode) {
                        updateTracking(e.target.value);
                      }
                    }}
                  />
                </div>
                {isStaff && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Staff can update tracking code
                  </p>
                )}
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

          <Card>
            <CardHeader>
              <CardTitle>Customer Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto border rounded-md p-3 bg-muted/40">
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No messages yet.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span className="font-medium">
                            {msg.senderRole === 'CUSTOMER' ? 'Customer' : msg.senderRole === 'STAFF' ? 'Staff' : 'Admin'}
                          </span>
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                        <div className="px-3 py-2 rounded-md bg-background border text-sm whitespace-pre-wrap">
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md text-sm resize-none h-20"
                  placeholder="Type a message to the customer..."
                />
                <Button type="button" onClick={sendMessage} disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

