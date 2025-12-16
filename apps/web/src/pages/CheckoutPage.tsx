import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    shippingAddress: {
      name: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      postalCode: '',
    },
    email: user?.email || '',
    notes: '',
    paymentMethod: 'COD',
    couponCode: '',
    shippingFee: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data);
      if (res.data.length > 0) {
        const defaultAddr = res.data.find((a: any) => a.isDefault) || res.data[0];
        setFormData((prev) => ({
          ...prev,
          shippingAddress: {
            name: defaultAddr.name,
            phone: defaultAddr.phone,
            address: defaultAddr.address,
            city: defaultAddr.city,
            district: defaultAddr.district,
            ward: defaultAddr.ward,
            postalCode: defaultAddr.postalCode || '',
          },
        }));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const applyCoupon = async () => {
    if (!formData.couponCode) return;
    setApplyingCoupon(true);
    setError('');
    try {
      const res = await api.post('/coupons/apply', {
        code: formData.couponCode,
        amount: getTotal(),
      });
      setDiscount(res.data.discount || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid coupon code');
      setDiscount(0);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.shippingAddress.name || !formData.shippingAddress.phone || 
          !formData.shippingAddress.address || !formData.shippingAddress.city ||
          !formData.shippingAddress.district || !formData.shippingAddress.ward) {
        setError('Please fill in all required shipping address fields');
        setLoading(false);
        return;
      }

      const orderData = {
        shippingAddress: formData.shippingAddress,
        phone: formData.shippingAddress.phone, // API requires phone separately
        email: formData.email || undefined,
        notes: formData.notes || undefined,
        paymentMethod: formData.paymentMethod,
        couponCode: discount > 0 ? formData.couponCode : undefined,
        shippingFee: formData.shippingFee,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          attributes: item.attributes || {},
        })),
      };

      const res = await api.post('/orders', orderData);
      console.log('Order created:', res.data);
      const orderId = res.data.id;

      // Handle payment for online payment methods
      if (formData.paymentMethod === 'MOMO' || formData.paymentMethod === 'ZALOPAY' || formData.paymentMethod === 'BANK') {
        try {
          const paymentRes = await api.post('/payments', {
            orderId: orderId,
            returnUrl: `${window.location.origin}/orders/${orderId}`,
          });

          console.log('Payment created:', paymentRes.data);

          if (paymentRes.data.paymentUrl) {
            // Redirect to payment gateway
            window.location.href = paymentRes.data.paymentUrl;
            return;
          } else if (formData.paymentMethod === 'BANK') {
            // Bank transfer - redirect to bank transfer page
            clearCart();
            navigate(`/payment/bank?orderId=${orderId}&amount=${res.data.total}`);
            return;
          }
        } catch (paymentError: any) {
          console.error('Payment creation error:', paymentError);
          // Continue to order page even if payment creation fails
        }
      }

      // For COD, order is already created with PENDING status
      // Payment will be collected on delivery
      clearCart();
      navigate(`/orders/${orderId}`);
    } catch (err: any) {
      console.error('Order error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0]?.message ||
                          'Failed to place order';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const total = subtotal + formData.shippingFee - discount;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Full Name"
                  value={formData.shippingAddress.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: { ...formData.shippingAddress, name: e.target.value },
                    })
                  }
                  required
                />
                <Input
                  placeholder="Phone"
                  value={formData.shippingAddress.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: { ...formData.shippingAddress, phone: e.target.value },
                    })
                  }
                  required
                />
                <Input
                  placeholder="Address"
                  value={formData.shippingAddress.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: { ...formData.shippingAddress, address: e.target.value },
                    })
                  }
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="City"
                    value={formData.shippingAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, city: e.target.value },
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="District"
                    value={formData.shippingAddress.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, district: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Ward"
                    value={formData.shippingAddress.ward}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, ward: e.target.value },
                      })
                    }
                    required
                  />
                  <Input
                    placeholder="Postal Code"
                    value={formData.shippingAddress.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shippingAddress: { ...formData.shippingAddress, postalCode: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coupon Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={formData.couponCode}
                    onChange={(e) => {
                      setFormData({ ...formData, couponCode: e.target.value });
                      setDiscount(0);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || !formData.couponCode}
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Coupon applied! Discount: {formatPrice(discount)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Cash on Delivery (COD)</div>
                    <div className="text-sm text-muted-foreground">Pay when you receive</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BANK"
                    checked={formData.paymentMethod === 'BANK'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Bank Transfer</div>
                    <div className="text-sm text-muted-foreground">Transfer to our bank account</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOMO"
                    checked={formData.paymentMethod === 'MOMO'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">MoMo Wallet</div>
                    <div className="text-sm text-muted-foreground">Pay with MoMo e-wallet</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-md cursor-pointer hover:bg-accent">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ZALOPAY"
                    checked={formData.paymentMethod === 'ZALOPAY'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">ZaloPay</div>
                    <div className="text-sm text-muted-foreground">Pay with ZaloPay e-wallet</div>
                  </div>
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-md min-h-[100px]"
                  placeholder="Any special instructions..."
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => {
                    const price = Number(item.product.salePrice || item.product.price);
                    return (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>
                          {item.product.name} x {item.quantity}
                        </span>
                        <span>{formatPrice(Number(price) * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPrice(formData.shippingFee)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

