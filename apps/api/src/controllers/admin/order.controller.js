import { adminOrderModel } from '../../models/admin/order.model.js';
import { adminOrderView } from '../../views/admin/order.view.js';

export const getOrders = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page || '1', 10),
      pageSize: Math.min(parseInt(req.query.pageSize || '20', 10), 100),
      status: req.query.status,
      userId: req.query.userId ? parseInt(req.query.userId, 10) : undefined,
      paymentStatus: req.query.paymentStatus,
    };

    const result = await adminOrderModel.list(filters);
    res.json(adminOrderView.list(result));
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const order = await adminOrderModel.getById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(adminOrderView.detail(order));
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, paymentStatus, trackingCode } = req.body;
    const order = await adminOrderModel.updateStatus(id, { status, paymentStatus, trackingCode });
    res.json(adminOrderView.detail(order));
  } catch (error) {
    next(error);
  }
};


