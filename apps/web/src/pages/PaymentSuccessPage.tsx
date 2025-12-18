import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    if (orderId) {
      // Clear cart when payment is successful
      clearCart();
      
      // Refresh order status
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [orderId, clearCart]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your payment has been processed successfully. Your order is being prepared for shipment.
          </p>
          {orderId && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Order ID: {orderId}
              </p>
              <div className="flex gap-4 justify-center">
                <Link to={`/orders/${orderId}`}>
                  <Button>View Order</Button>
                </Link>
                <Link to="/orders">
                  <Button variant="outline">Order History</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

