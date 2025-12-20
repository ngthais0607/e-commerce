import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShoppingBag, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface StaffDashboardData {
  orders: {
    pending: number;
    processing: number;
    shipped: number;
    cancelled: number;
  };
  payments: {
    pending: number;
    failed: number;
    refunded: number;
    paid: number;
    todayPaidTotal: number;
  };
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
  }>;
}

export default function StaffDashboard() {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/admin/staff/dashboard');
      setData(res.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        variant: 'destructive',
        title: 'Failed to load data',
        description: err?.response?.data?.error || 'Please try again.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const OrderStat = ({
    icon: Icon,
    label,
    value,
    accent,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    accent?: string;
  }) => (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${accent || ''}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">Daily operational snapshot.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OrderStat icon={ShoppingBag} label="Pending Orders" value={data.orders.pending} accent="text-amber-500" />
            <OrderStat icon={Clock} label="Processing" value={data.orders.processing} accent="text-blue-500" />
            <OrderStat icon={CheckCircle2} label="Shipped" value={data.orders.shipped} accent="text-emerald-600" />
            <OrderStat icon={XCircle} label="Cancelled" value={data.orders.cancelled} accent="text-red-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Current payment statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between"><span>Pending</span><span className="font-semibold">{data.payments.pending}</span></div>
                <div className="flex justify-between"><span>Failed</span><span className="font-semibold">{data.payments.failed}</span></div>
                <div className="flex justify-between"><span>Refunded</span><span className="font-semibold">{data.payments.refunded}</span></div>
                <div className="flex justify-between"><span>Paid</span><span className="font-semibold">{data.payments.paid}</span></div>
                <div className="flex justify-between border-t pt-2 text-emerald-600">
                  <span>Collected today</span>
                  <span className="font-semibold">{formatPrice(data.payments.todayPaidTotal)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>Latest Orders</CardTitle>
                <CardDescription>5 most recent orders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.recentOrders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet.</p>}
                {data.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-2 py-1 rounded-full bg-muted">{o.status}</span>
                      <span className="px-2 py-1 rounded-full bg-muted">{`Payment: ${o.paymentStatus}`}</span>
                      <span className="font-semibold">{formatPrice(o.total)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}


