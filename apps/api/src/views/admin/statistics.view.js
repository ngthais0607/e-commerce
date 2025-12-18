export const adminStatisticsView = {
  overview(data) {
    return {
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      totalUsers: data.totalUsers,
      totalProducts: data.totalProducts,
      pendingOrders: data.pendingOrders,
      todayRevenue: data.todayRevenue,
      monthRevenue: data.monthRevenue,
    };
  },

  salesByPeriod(data, period = '7d') {
    return {
      period: period,
      data: data.map(item => ({
        date: item.date,
        orders: item.orders,
        revenue: item.revenue,
      })),
    };
  },

  topProducts(data) {
    return {
      products: data.map(product => ({
        id: product.id,
        name: product.name,
        images: product.images,
        price: product.price,
        totalSold: product.totalSold,
        totalRevenue: product.totalRevenue,
      })),
    };
  },

  ordersByStatus(data) {
    return {
      statuses: data.map(item => ({
        status: item.status,
        count: item.count,
      })),
    };
  },

  full(data) {
    return {
      overview: this.overview(data.overview),
      salesByPeriod: this.salesByPeriod(data.salesByPeriod, data.period),
      topProducts: this.topProducts(data.topProducts),
      ordersByStatus: this.ordersByStatus(data.ordersByStatus),
    };
  },
};

