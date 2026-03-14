import type { Request, Response, NextFunction } from 'express';
import { statisticsQuerySchema, topProductsQuerySchema, periodQuerySchema } from '../../validators/statisticsValidator.js';
import { adminStatisticsModel } from '../../models/admin/statistics.model.js';
import { adminStatisticsView } from '../../views/admin/statistics.view.js';

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, topProductsLimit } = statisticsQuerySchema.parse({
      period: req.query.period ?? '7d',
      topProductsLimit: req.query.topProductsLimit ?? 10,
    });

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

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await adminStatisticsModel.getOverview();
    res.json(adminStatisticsView.overview(overview));
  } catch (error) {
    next(error);
  }
};

export const getSalesByPeriod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = periodQuerySchema.parse({ period: req.query.period ?? '7d' });
    const sales = await adminStatisticsModel.getSalesByPeriod(period);
    res.json(adminStatisticsView.salesByPeriod(sales, period));
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit } = topProductsQuerySchema.parse({ limit: req.query.limit ?? 10 });
    const products = await adminStatisticsModel.getTopProducts(limit);
    res.json(adminStatisticsView.topProducts(products));
  } catch (error) {
    next(error);
  }
};

export const getStaffDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await adminStatisticsModel.getStaffDashboard();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

