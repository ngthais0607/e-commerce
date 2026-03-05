export const userCategoryView = {
  list(result) {
    // Handle paginated result
    if (result.items) {
      return {
        items: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      };
    }
    // Handle array result (backward compatibility)
    return result;
  },

  detail(category) {
    return category;
  },
};


