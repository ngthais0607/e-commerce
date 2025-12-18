import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatNumber } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Package,
  TrendingUp,
  Clock,
  Calendar,
} from 'lucide-react';

interface Statistics {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProducts: number;
    pendingOrders: number;
    todayRevenue: number;
    monthRevenue: number;
  };
  salesByPeriod: {
    data: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
  };
  topProducts: {
    products: Array<{
      id: number;
      name: string;
      images: string[];
      price: number;
      totalSold: number;
      totalRevenue: number;
    }>;
  };
  ordersByStatus: {
    statuses: Array<{
      status: string;
      count: number;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '12m'>('7d');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/statistics?period=${period}`);
      setStats(response.data);
    } catch (error: unknown) {
      console.error('Error fetching stats:', error);
      
      // Extract error message
      let errorMessage = 'Unable to load statistics data';
      const err = error as {
        response?: { status: number; data?: { error?: string; message?: string } };
        request?: unknown;
        message?: string;
      };

      if (err?.response) {
        // Server responded with error
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (err.response.status === 403) {
          errorMessage = 'Insufficient permissions. Admin access required.';
        } else if (err.response.status === 404) {
          errorMessage = 'Statistics endpoint not found. Please check API configuration.';
        } else if (err.response.data?.error || err.response.data?.message) {
          errorMessage = err.response.data.error || err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err?.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please ensure the API server is running on port 4000.';
      } else {
        // Error setting up request
        errorMessage = err?.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds to get latest data
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [period]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
            <div className="h-10 w-20 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats && !loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 font-medium">
                {error || 'Unable to load statistics data'}
              </p>
              {error?.includes('Cannot connect') && (
                <p className="text-sm text-muted-foreground">
                  Make sure the API server is running: <code className="bg-muted px-2 py-1 rounded">cd apps/api && npm start</code>
                </p>
              )}
              {error?.includes('Authentication') && (
                <p className="text-sm text-muted-foreground">
                  Please log in with an admin account.
                </p>
              )}
            </div>
            <Button onClick={fetchStats} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Đảm bảo stats không null trước khi destructuring (TS an toàn hơn)
  if (!stats) {
    return null;
  }

  const { overview, salesByPeriod, topProducts, ordersByStatus } = stats;

  // Format date for display
  const formatChartDate = (date: string) => {
    if (period === '12m') {
      return new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Dashboard</h1>
          <p className="text-muted-foreground dark:text-muted-foreground/80 mt-1">
            Overview of store activity
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === '7d'
                ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg'
                : 'bg-muted dark:bg-white/5 hover:bg-muted/80 dark:hover:bg-white/10 text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === '30d'
                ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg'
                : 'bg-muted dark:bg-white/5 hover:bg-muted/80 dark:hover:bg-white/10 text-foreground'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setPeriod('12m')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === '12m'
                ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg'
                : 'bg-muted dark:bg-white/5 hover:bg-muted/80 dark:hover:bg-white/10 text-foreground'
            }`}
          >
            12 Months
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400 bg-card dark:bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground dark:text-blue-400/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{formatNumber(overview.totalOrders)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-1">
              {formatNumber(overview.pendingOrders)} orders pending
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 dark:border-l-green-400 bg-card dark:bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground dark:text-green-400/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{formatPrice(overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              This month: {formatPrice(overview.monthRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 dark:border-l-violet-400 bg-card dark:bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground dark:text-violet-400/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{formatNumber(overview.totalUsers)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-1">Total customers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400 bg-card dark:bg-slate-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground dark:text-orange-400/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{formatNumber(overview.totalProducts)}</div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground/80 mt-1">Active products</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
              Today's Revenue
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">Revenue from paid orders today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(overview.todayRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Pending Orders
            </CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">Number of orders in pending status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {formatNumber(overview.pendingOrders)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Sales Chart</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">
              Revenue and order count for {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '12 months'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByPeriod.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis yAxisId="left" style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="right" orientation="right" style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') {
                      return [formatPrice(value), 'Revenue'];
                    }
                    return [value, 'Orders'];
                  }}
                  labelFormatter={(label) => `Date: ${formatChartDate(label)}`}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Order Count"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Bar Chart */}
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Revenue Chart</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByPeriod.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatPrice(value)}
                  labelFormatter={(label) => `Date: ${formatChartDate(label)}`}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="revenue" fill="#0088FE" name="Revenue" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Status Pie Chart and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Orders by Status</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus.statuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // Recharts label payload is not fully typed in the lib, so we type a safe subset here
                  label={({ status, percent }: { status: string; percent?: number }) =>
                    `${status}: ${(((percent ?? 0) as number) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {ordersByStatus.statuses.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground dark:text-white">Top Selling Products</CardTitle>
            <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">Top {topProducts.products.length} best-selling products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topProducts.products}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  style={{ fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatNumber(value)}
                  labelFormatter={(label) => `Product: ${label}`}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="totalSold" fill="#00C49F" name="Quantity Sold" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card className="bg-card dark:bg-slate-900/50 border-border dark:border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-white">Top Selling Products Details</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-muted-foreground/80">List of best-selling products with revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border dark:border-white/10">
                  <th className="text-left p-3 font-medium text-foreground dark:text-foreground">Product</th>
                  <th className="text-right p-3 font-medium text-foreground dark:text-foreground">Price</th>
                  <th className="text-right p-3 font-medium text-foreground dark:text-foreground">Sold</th>
                  <th className="text-right p-3 font-medium text-foreground dark:text-foreground">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.products.map((product) => (
                  <tr key={product.id} className="border-b border-border dark:border-white/10 hover:bg-muted/50 dark:hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="font-medium text-foreground dark:text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="text-right p-3 text-foreground dark:text-foreground">{formatPrice(product.price)}</td>
                    <td className="text-right p-3 text-foreground dark:text-foreground">{formatNumber(product.totalSold)}</td>
                    <td className="text-right p-3 font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
