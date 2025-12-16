import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MockPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const transactionRef = searchParams.get('transactionRef');
  const [processing, setProcessing] = useState(false);
  
  // Determine payment method from URL path
  const paymentMethod = window.location.pathname.includes('momo') ? 'MoMo' : 
                       window.location.pathname.includes('zalopay') ? 'ZaloPay' : 
                       'Wallet';

  const handleSuccess = async () => {
    if (!orderId) return;
    
    setProcessing(true);
    try {
      // Mock payment success - update payment status
      // In production, this would be handled by payment gateway callback
      const res = await api.post(`/payments/mock-success`, { orderId: parseInt(orderId, 10) });
      
      if (res.data.success) {
        // Redirect to success page
        navigate(`/payment/success?orderId=${orderId}`);
      } else {
        throw new Error(res.data.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Payment processing failed';
      navigate(`/payment/failed?orderId=${orderId}&message=${encodeURIComponent(errorMessage)}`);
    }
  };

  const handleCancel = () => {
    navigate(`/orders/${orderId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentMethod === 'MoMo' && (
              <span className="text-2xl">💳</span>
            )}
            {paymentMethod === 'ZaloPay' && (
              <span className="text-2xl">💵</span>
            )}
            {paymentMethod} Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              This is a mock {paymentMethod} payment gateway for testing purposes.
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order ID:</p>
            <p className="font-semibold">{orderId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Amount:</p>
            <p className="font-semibold text-lg text-primary">${amount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Transaction Reference:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">{transactionRef}</p>
          </div>
          <div className="pt-4 space-y-2">
            <Button
              onClick={handleSuccess}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Complete ${paymentMethod} Payment`
              )}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full"
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-yellow-800 text-center">
              <strong>Note:</strong> In production, you would be redirected to the actual {paymentMethod} payment gateway. 
              Click the button above to simulate a successful payment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

