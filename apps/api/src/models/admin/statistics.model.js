import { query, queryOne } from '../../config/database.js';

export const adminStatisticsModel = {
  async getOverview() {
    // Total orders
    const ordersResult = await queryOne(
      `SELECT COUNT(*) as total FROM orders`
    );
    const totalOrders = ordersResult?.total || 0;

    // Total revenue (all paid orders - PAID, PROCESSING, SHIPPED, COMPLETED)
    const revenueResult = await queryOne(
      `SELECT COALESCE(SUM(total), 0) as total 
       FROM orders 
       WHERE paymentStatus = 'PAID'`
    );
    const totalRevenue = parseFloat(revenueResult?.total || 0);

    // Total users
    const usersResult = await queryOne(
      `SELECT COUNT(*) as total FROM clients`
    );
    const totalUsers = usersResult?.total || 0;

    // Total products
    const productsResult = await queryOne(
      `SELECT COUNT(*) as total FROM products WHERE isActive = 1`
    );
    const totalProducts = productsResult?.total || 0;

    // Pending orders
    const pendingResult = await queryOne(
      `SELECT COUNT(*) as total FROM orders WHERE status = 'PENDING'`
    );
    const pendingOrders = pendingResult?.total || 0;

    // Today's revenue (all paid orders today)
    const todayRevenueResult = await queryOne(
      `SELECT COALESCE(SUM(total), 0) as total 
       FROM orders 
       WHERE DATE(createdAt) = CURDATE() 
       AND paymentStatus = 'PAID'`
    );
    const todayRevenue = parseFloat(todayRevenueResult?.total || 0);

    // This month's revenue (all paid orders this month)
    const monthRevenueResult = await queryOne(
      `SELECT COALESCE(SUM(total), 0) as total 
       FROM orders 
       WHERE YEAR(createdAt) = YEAR(CURDATE()) 
       AND MONTH(createdAt) = MONTH(CURDATE())
       AND paymentStatus = 'PAID'`
    );
    const monthRevenue = parseFloat(monthRevenueResult?.total || 0);

    return {
      totalOrders,
      totalRevenue,
      totalUsers,
      totalProducts,
      pendingOrders,
      todayRevenue,
      monthRevenue,
    };
  },

  async getSalesByPeriod(period = '7d') {
    let dateFormat, dateCondition, groupBy;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        dateFormat = '%Y-%m-%d';
        dateCondition = `DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        groupBy = 'DATE(createdAt)';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        dateFormat = '%Y-%m-%d';
        dateCondition = `DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
        groupBy = 'DATE(createdAt)';
        break;
      case '12m':
        startDate.setMonth(now.getMonth() - 12);
        dateFormat = '%Y-%m';
        dateCondition = `DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)`;
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        break;
      default:
        startDate.setDate(now.getDate() - 7);
        dateFormat = '%Y-%m-%d';
        dateCondition = `DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
        groupBy = 'DATE(createdAt)';
    }

    const sales = await query(
      `SELECT 
        ${groupBy} as date,
        COUNT(*) as orders,
        COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE ${dateCondition}
       AND paymentStatus = 'PAID'
       GROUP BY ${groupBy}
       ORDER BY date ASC`
    );

    return sales.map(item => ({
      date: item.date,
      orders: parseInt(item.orders),
      revenue: parseFloat(item.revenue),
    }));
  },

  async getTopProducts(limit = 10) {
    // Ensure limit is a safe integer (prevent SQL injection)
    const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
    
    const products = await query(
      `SELECT 
        p.id,
        p.name,
        p.images,
        p.price,
        COALESCE(SUM(CASE WHEN o.paymentStatus = 'PAID' THEN oi.quantity ELSE 0 END), 0) as totalSold,
        COALESCE(SUM(CASE WHEN o.paymentStatus = 'PAID' THEN oi.quantity * oi.price ELSE 0 END), 0) as totalRevenue
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.productId
       LEFT JOIN orders o ON oi.orderId = o.id
       WHERE p.isActive = 1
       GROUP BY p.id, p.name, p.images, p.price
       ORDER BY totalSold DESC
       LIMIT ${safeLimit}`
    );

    return products.map(product => ({
      id: product.id,
      name: product.name,
      images: typeof product.images === 'string' 
        ? JSON.parse(product.images) 
        : product.images,
      price: parseFloat(product.price),
      totalSold: parseInt(product.totalSold),
      totalRevenue: parseFloat(product.totalRevenue),
    }));
  },

  async getOrdersByStatus() {
    const statuses = await query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM orders
       GROUP BY status`
    );

    return statuses.map(item => ({
      status: item.status,
      count: parseInt(item.count),
    }));
  },

  async getStaffDashboard() {
    const [counts, paymentCounts, todayPaid, recentOrders] = await Promise.all([
      queryOne(
        `SELECT
           SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pendingOrders,
           SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) AS processingOrders,
           SUM(CASE WHEN status = 'SHIPPED' THEN 1 ELSE 0 END) AS shippedOrders,
           SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelledOrders
         FROM orders`
      ),
      queryOne(
        `SELECT
           SUM(CASE WHEN paymentStatus = 'PENDING' THEN 1 ELSE 0 END) AS pendingPayments,
           SUM(CASE WHEN paymentStatus = 'FAILED' THEN 1 ELSE 0 END) AS failedPayments,
           SUM(CASE WHEN paymentStatus = 'REFUNDED' THEN 1 ELSE 0 END) AS refundedPayments,
           SUM(CASE WHEN paymentStatus = 'PAID' THEN 1 ELSE 0 END) AS paidPayments
         FROM orders`
      ),
      queryOne(
        `SELECT COALESCE(SUM(total), 0) AS todayPaidTotal
         FROM orders
         WHERE DATE(createdAt) = CURDATE() AND paymentStatus = 'PAID'`
      ),
      query(
        `SELECT id, orderNumber, status, paymentStatus, total, createdAt
         FROM orders
         ORDER BY createdAt DESC
         LIMIT 5`
      ),
    ]);

    return {
      orders: {
        pending: parseInt(counts?.pendingOrders || 0),
        processing: parseInt(counts?.processingOrders || 0),
        shipped: parseInt(counts?.shippedOrders || 0),
        cancelled: parseInt(counts?.cancelledOrders || 0),
      },
      payments: {
        pending: parseInt(paymentCounts?.pendingPayments || 0),
        failed: parseInt(paymentCounts?.failedPayments || 0),
        refunded: parseInt(paymentCounts?.refundedPayments || 0),
        paid: parseInt(paymentCounts?.paidPayments || 0),
        todayPaidTotal: parseFloat(todayPaid?.todayPaidTotal || 0),
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: parseFloat(o.total),
        createdAt: o.createdAt,
      })),
    };
  },
};

