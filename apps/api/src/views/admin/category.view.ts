export const adminCategoryView = {
  list(result: Record<string, unknown>) {
    // Handle paginated result
    const r = result as { items?: unknown; total?: unknown; page?: unknown; pageSize?: unknown; totalPages?: unknown };
    if (r.items) {
      return {
        items: r.items,
        pagination: {
          total: r.total,
          page: r.page,
          pageSize: r.pageSize,
          totalPages: r.totalPages,
        },
      };
    }
    // Handle array result (backward compatibility)
    return result;
  },

  detail(category: Record<string, unknown>) {
    return category;
  },
};


