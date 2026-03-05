import { adminOrderModel } from '../admin/order.model.js';

export const userOrderModel = {
  list(userId, filters) {
    return adminOrderModel.listByUser(userId, filters);
  },

  getById(id) {
    return adminOrderModel.getById(id);
  },

  create(orderData) {
    return adminOrderModel.create(orderData);
  },
};


