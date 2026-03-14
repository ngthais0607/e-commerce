import type { OrderListFilters, OrderCreateData } from '../../types/models.js';
import { adminOrderModel } from '../admin/order.model.js';

export const userOrderModel = {
  list(userId: number, filters: OrderListFilters = {}) {
    return adminOrderModel.listByUser(userId, filters);
  },

  getById(id: number) {
    return adminOrderModel.getById(id);
  },

  create(orderData: OrderCreateData) {
    return adminOrderModel.create(orderData);
  },
};


