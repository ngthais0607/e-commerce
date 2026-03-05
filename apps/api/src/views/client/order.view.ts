export const userOrderView = {
  list(payload) {
    // Ensure payload has the correct structure
    if (!payload) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
    }
    
    // If payload already has items, return as is
    if (payload.items !== undefined) {
      return payload;
    }
    
    // If payload is an array, wrap it
    if (Array.isArray(payload)) {
      return {
        items: payload,
        total: payload.length,
        page: 1,
        pageSize: payload.length || 10,
        totalPages: 1,
      };
    }
    
    // Default empty response
    return {
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };
  },

  detail(order) {
    return order;
  },
};


