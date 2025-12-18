const baseShape = (product) => ({
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
  list(payload) {
    return {
      ...payload,
      items: payload.items.map(baseShape),
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


