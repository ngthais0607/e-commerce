import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import { CreditCard, Loader2 } from 'lucide-react';
import { getSocket } from '@/lib/socket';

interface OrderMessage {
  id: number;
  orderId: number;
  clientId: number | null;
  staffId: number | null;
  senderRole: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  message: string;
  createdAt: string;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Redirect admin and staff to admin order detail page
    if ((user?.role === 'ADMIN' || user?.role === 'STAFF') && id) {
      navigate(`/admin/orders/${id}`);
      return;
    }
    
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
  }, [id, user?.role, navigate, token]);

  const fetchOrder = async () => {
    try {
      const res = await api.get<Order>(`/orders/${id}`);
      if (res.data) {
        setOrder(res.data);
      } else {
        console.error('Order data is null or undefined');
      }
    } catch (error: unknown) {
      console.error('Error fetching order:', error);
      const err = error as { response?: { data?: { error?: string }; status?: number } };
      const errorMessage = err.response?.data?.error || 'Failed to load order';
      console.error('Error message:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!id) return;
    try {
      setLoadingMessages(true);
      const res = await api.get<{ messages?: OrderMessage[] }>(`/orders/${id}/messages`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Error fetching order messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handlePayment = async () => {
    if (!order || !id) return;
    
    setProcessingPayment(true);
    try {
      // For COD, just show message
      if (order.paymentMethod === 'COD') {
        alert('Payment will be collected on delivery. Your order is being processed.');
        return;
      }

      // For online payment methods, create payment
      const paymentRes = await api.post('/payments', {
        orderId: parseInt(id, 10),
        returnUrl: `${window.location.origin}/orders/${id}`,
      });

      console.log('Payment response:', paymentRes.data);

      if (paymentRes.data.paymentUrl) {
        // Redirect to payment gateway (MoMo, ZaloPay, or Bank)
        window.location.href = paymentRes.data.paymentUrl;
        return;
      } else if (order.paymentMethod === 'BANK') {
        // Bank transfer - redirect to bank transfer page
        navigate(`/payment/bank?orderId=${id}&amount=${order.total}`);
        return;
      } else {
        // If no payment URL, show error
        throw new Error(paymentRes.data.message || 'Payment URL not generated');
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Failed to process payment';
      alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const sendMessage = async () => {
    if (!id || !newMessage.trim()) return;

    try {
      const res = await api.post<OrderMessage>(`/orders/${id}/messages`, {
        message: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || 'Failed to send message';
      alert(errorMessage);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;
  if (!order) return <div className="container mx-auto px-4 py-8">Order not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Order #{order.orderNumber}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
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
                      {item.product?.slug && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/product/${item.product!.slug}`)}
                        >
                          Write a review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.ward}, {order.shippingAddress.district},{' '}
                {order.shippingAddress.city}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order Status</label>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    order.status === 'COMPLETED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : order.status === 'CANCELLED'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      : order.status === 'SHIPPED'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                      : order.status === 'PROCESSING'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                      : order.status === 'PAID'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                  }`}
                >
                  {order.status === 'PENDING' && '⏳ Pending'}
                  {order.status === 'PAID' && '💳 Paid'}
                  {order.status === 'PROCESSING' && '⚙️ Processing'}
                  {order.status === 'SHIPPED' && '📦 Shipped'}
                  {order.status === 'COMPLETED' && '✅ Completed'}
                  {order.status === 'CANCELLED' && '❌ Cancelled'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Status</label>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : order.paymentStatus === 'FAILED'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      : order.paymentStatus === 'REFUNDED'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                  }`}
                >
                  {order.paymentStatus === 'PENDING' && '⏳ Pending'}
                  {order.paymentStatus === 'PAID' && '✅ Paid'}
                  {order.paymentStatus === 'FAILED' && '❌ Failed'}
                  {order.paymentStatus === 'REFUNDED' && '↩️ Refunded'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <p className="px-4 py-2 bg-muted rounded-lg">{order.paymentMethod}</p>
              </div>

              {order.trackingCode && (
                <div>
                  <label className="block text-sm font-medium mb-2">Tracking Code</label>
                  <p className="px-4 py-2 bg-muted rounded-lg font-mono">{order.trackingCode}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Ordered on {formatDate(order.createdAt)}
                </p>
                {order.updatedAt !== order.createdAt && (
                  <p className="text-sm text-muted-foreground">
                    Last updated: {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>
              
              {/* Payment Button for PENDING orders */}
              {order.status === 'PENDING' && order.paymentStatus === 'PENDING' && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className="w-full"
                    size="lg"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {order.paymentMethod === 'COD' 
                          ? 'Confirm Order' 
                          : `Pay ${formatPrice(order.total)}`}
                      </>
                    )}
                  </Button>
                  {order.paymentMethod === 'COD' && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Payment will be collected when you receive the order
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 overflow-y-auto border rounded-md p-3 bg-muted/40">
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No messages yet. You can send a message to our staff about this order.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id}>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                          <span className="font-medium">
                            {msg.senderRole === 'CUSTOMER'
                              ? 'You'
                              : msg.senderRole === 'STAFF'
                              ? 'Staff'
                              : 'Admin'}
                          </span>
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-md text-sm whitespace-pre-wrap ${
                            msg.senderRole === 'CUSTOMER'
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-background border'
                          }`}
                        >
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
                  placeholder="Type your message to our support staff..."
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

