const baseShape = (product: Record<string, unknown>) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  shortDesc: product.shortDesc,
  description: product.description,
  price: product.price,
  salePrice: product.salePrice,
  stock: product.stock,
  images: product.images,
  attributes: product.attributes,
  brand: product.brand,
  rating: product.rating,
  reviewCount: product.reviewCount,
});

export const userProductView = {
  list(payload: Record<string, unknown>) {
    const p = payload as { items?: Record<string, unknown>[] };
    return {
      ...payload,
      items: (p.items || []).map(baseShape),
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


