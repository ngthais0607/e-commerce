export const userCategoryView = {
  list(result: Record<string, unknown>) {
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
    return result;
  },

  detail(category: Record<string, unknown>) {
    return category;
  },
};


