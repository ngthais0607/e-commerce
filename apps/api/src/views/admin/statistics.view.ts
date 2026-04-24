export const adminStatisticsView = {
  overview(data: Record<string, unknown>) {
    return {
      totalOrders: (data as { totalOrders?: unknown }).totalOrders,
      totalRevenue: (data as { totalRevenue?: unknown }).totalRevenue,
      totalUsers: (data as { totalUsers?: unknown }).totalUsers,
      totalProducts: (data as { totalProducts?: unknown }).totalProducts,
      pendingOrders: (data as { pendingOrders?: unknown }).pendingOrders,
      todayRevenue: (data as { todayRevenue?: unknown }).todayRevenue,
      monthRevenue: (data as { monthRevenue?: unknown }).monthRevenue,
      newUsersToday: (data as { newUsersToday?: unknown }).newUsersToday,
      newUsersThisMonth: (data as { newUsersThisMonth?: unknown }).newUsersThisMonth,
    };
  },

  salesByPeriod(data: Record<string, unknown>[], period = '7d') {
    return {
      period: period,
      data: data.map((item: Record<string, unknown>) => ({
        date: (item as { date?: unknown }).date,
        orders: (item as { orders?: unknown }).orders,
        revenue: (item as { revenue?: unknown }).revenue,
      })),
    };
  },

  topProducts(data: Record<string, unknown>[]) {
    return {
      products: data.map((product: Record<string, unknown>) => ({
        id: product.id,
        name: product.name,
        images: product.images,
        price: product.price,
        totalSold: (product as { totalSold?: unknown }).totalSold,
        totalRevenue: (product as { totalRevenue?: unknown }).totalRevenue,
      })),
    };
  },

  ordersByStatus(data: Record<string, unknown>[]) {
    return {
      statuses: data.map((item: Record<string, unknown>) => ({
        status: item.status,
        count: item.count,
      })),
    };
  },

  full(data: Record<string, unknown>) {
    const d = data as {
      overview?: Record<string, unknown>;
      salesByPeriod?: Record<string, unknown>[];
      period?: string;
      topProducts?: Record<string, unknown>[];
      ordersByStatus?: Record<string, unknown>[];
    };
    return {
      overview: this.overview(d.overview ?? {}),
      salesByPeriod: this.salesByPeriod(d.salesByPeriod ?? [], d.period),
      topProducts: this.topProducts(d.topProducts ?? []),
      ordersByStatus: this.ordersByStatus(d.ordersByStatus ?? []),
    };
  },
};

