import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function BankTransferPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accountName: 'John Doe',
    accountNumber: '9876543210',
    bankName: 'Techcombank',
    transferAmount: amount || '',
    transferNote: `Payment for order ${orderId}`,
  });

  // Mock bank account details
  const bankAccount = {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'E-COMMERCE COMPANY LIMITED',
    branch: 'Hanoi Branch',
    swiftCode: 'BFTVVNVX',
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setProcessing(true);
    try {
      // Simulate bank transfer verification
      // In production, this would verify with bank API
      // For mock, we just wait a bit to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update payment status
      const res = await api.post(`/payments/mock-success`, {
        orderId: parseInt(orderId, 10),
      });

      console.log('Payment response:', res.data);

      if (res.data && res.data.success) {
        navigate(`/payment/success?orderId=${orderId}`);
      } else {
        throw new Error(res.data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Bank transfer error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Bank transfer failed. Please try again.';
      
      navigate(
        `/payment/failed?orderId=${orderId}&message=${encodeURIComponent(errorMessage)}`
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!orderId || !amount) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Invalid payment information</p>
            <Button
              onClick={() => navigate('/orders')}
              className="mt-4"
              variant="outline"
            >
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Bank Transfer Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Bank Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-semibold">{bankAccount.bankName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(bankAccount.bankName, 'bankName')}
                  >
                    {copied === 'bankName' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Account Number
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono font-semibold text-lg">
                    {bankAccount.accountNumber}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(bankAccount.accountNumber, 'accountNumber')
                    }
                  >
                    {copied === 'accountNumber' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  Account Name
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-semibold">{bankAccount.accountName}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(bankAccount.accountName, 'accountName')
                    }
                  >
                    {copied === 'accountName' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Branch</Label>
                <p className="font-semibold">{bankAccount.branch}</p>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">
                  SWIFT Code
                </Label>
                <p className="font-mono font-semibold">{bankAccount.swiftCode}</p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">
                  Transfer Amount
                </Label>
                <p className="font-semibold text-2xl text-primary">
                  {formatPrice(parseFloat(amount))}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please include your order number (
                  <span className="font-mono">{orderId}</span>) in the transfer
                  note for faster processing and verification.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="accountName">Your Account Name</Label>
                  <Input
                    id="accountName"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber">Your Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="bankName">Your Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="e.g., Techcombank, BIDV, etc."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="transferAmount">Transfer Amount</Label>
                  <Input
                    id="transferAmount"
                    name="transferAmount"
                    type="number"
                    value={formData.transferAmount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    min={amount}
                    step="0.01"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required amount: {formatPrice(parseFloat(amount))}
                  </p>
                </div>

                <div>
                  <Label htmlFor="transferNote">Transfer Note</Label>
                  <Input
                    id="transferNote"
                    name="transferNote"
                    value={formData.transferNote}
                    onChange={handleInputChange}
                    placeholder="Transfer note"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include order number for faster processing
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Transfer...
                    </>
                  ) : (
                    'Confirm Bank Transfer'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/orders/${orderId}`)}
                  className="w-full"
                  disabled={processing}
                >
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Transfer the exact amount{' '}
                <strong>{formatPrice(parseFloat(amount))}</strong> to the bank
                account information shown above
              </li>
              <li>
                Include your order number (
                <span className="font-mono">{orderId}</span>) in the transfer
                note/message field
              </li>
              <li>
                Fill in all the required transfer information in the form on the right
              </li>
              <li>
                Click "Confirm Bank Transfer" button to submit your payment information
              </li>
              <li>
                Your order will be processed once the bank transfer is verified by our team
              </li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Processing Time:</strong> Bank transfers are usually
                processed within 1-2 business days. You will receive an email
                confirmation once your payment is verified and your order status is updated.
              </p>
            </div>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Example Transfer Note:</strong> "Payment for order {orderId}" or "Order #{orderId}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

