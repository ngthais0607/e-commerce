import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Payment failed';
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            {orderId && (
              <Link to={`/orders/${orderId}`}>
                <Button variant="outline">Back to Order</Button>
              </Link>
            )}
            <Link to="/shop">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

