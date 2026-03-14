export const userOrderView = {
  list(payload: Record<string, unknown> | unknown[] | null) {
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
    const p = payload as Record<string, unknown>;
    if (p && p.items !== undefined) {
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

  detail(order: Record<string, unknown>) {
    return order;
  },
};


