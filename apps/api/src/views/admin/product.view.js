const baseShape = (product) => ({
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
  list(payload) {
    return {
      ...payload,
      items: payload.items.map((item) => ({
        ...baseShape(item),
        category: item.category,
      })),
    };
  },

  detail(product) {
    if (!product) return null;
    return {
      ...baseShape(product),
      category: product.category,
      reviews: product.reviews,
    };
  },
};


