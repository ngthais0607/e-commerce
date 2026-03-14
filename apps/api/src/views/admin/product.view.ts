const baseShape = (product: Record<string, unknown>) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  shortDesc: product.shortDesc,
  description: product.description,
  price: product.price,
  salePrice: product.salePrice,
  stock: product.stock,
  sku: product.sku,
  images: product.images,
  attributes: product.attributes,
  categoryId: product.categoryId,
  brand: product.brand,
  rating: product.rating,
  reviewCount: product.reviewCount,
  isActive: product.isActive,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const adminProductView = {
  list(payload: Record<string, unknown>) {
    const p = payload as { items?: Record<string, unknown>[] };
    return {
      ...payload,
      items: (p.items || []).map((item: Record<string, unknown>) => ({
        ...baseShape(item),
        category: (item as { category?: unknown }).category,
      })),
    };
  },

  detail(product: Record<string, unknown> | null) {
    if (!product) return null;
    const prod = product as Record<string, unknown>;
    return {
      ...baseShape(prod),
      category: prod.category,
      reviews: prod.reviews,
    };
  },
};


