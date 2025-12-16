import { adminStatisticsModel } from '../../models/admin/statistics.model.js';
import { adminStatisticsView } from '../../views/admin/statistics.view.js';

export const getStatistics = async (req, res, next) => {
  try {
    const period = req.query.period || '7d';
    const topProductsLimit = parseInt(req.query.topProductsLimit || '10', 10);

    const [overview, salesByPeriod, topProducts, ordersByStatus] = await Promise.all([
      adminStatisticsModel.getOverview(),
      adminStatisticsModel.getSalesByPeriod(period),
      adminStatisticsModel.getTopProducts(topProductsLimit),
      adminStatisticsModel.getOrdersByStatus(),
    ]);

    res.json(adminStatisticsView.full({
      overview,
      salesByPeriod,
      topProducts,
      ordersByStatus,
      period,
    }));
  } catch (error) {
    next(error);
  }
};

export const getOverview = async (req, res, next) => {
  try {
    const overview = await adminStatisticsModel.getOverview();
    res.json(adminStatisticsView.overview(overview));
  } catch (error) {
    next(error);
  }
};

export const getSalesByPeriod = async (req, res, next) => {
  try {
    const period = req.query.period || '7d';
    const sales = await adminStatisticsModel.getSalesByPeriod(period);
    res.json(adminStatisticsView.salesByPeriod(sales, period));
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const products = await adminStatisticsModel.getTopProducts(limit);
    res.json(adminStatisticsView.topProducts(products));
  } catch (error) {
    next(error);
  }
};

export const getStaffDashboard = async (req, res, next) => {
  try {
    const data = await adminStatisticsModel.getStaffDashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

