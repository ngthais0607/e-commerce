import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Review } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/slug/${slug}`);
      setProduct(res.data);
      if (res.data.reviews) {
        setReviews(res.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addItem(product, quantity);
      navigate('/checkout');
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-8">Product not found</div>;
  }

  const price = product.salePrice || product.price;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg"
          />
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {product.images.slice(1, 5).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${product.name} ${idx + 2}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="mb-6">
            {product.salePrice ? (
              <div>
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-xl text-muted-foreground line-through ml-2">
                  {formatPrice(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          {product.shortDesc && (
            <p className="text-muted-foreground mb-6">{product.shortDesc}</p>
          )}

          <div className="mb-6">
            <label className="block mb-2">Quantity</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min="1"
                max={product.stock}
              />
              <Button
                variant="outline"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground">
                {product.stock} in stock
              </span>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1"
            >
              Buy Now
            </Button>
            {isAuthenticated && (
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            )}
          </div>

          {product.description && (
            <Card className="mt-8">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{review.user?.name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && <h4 className="font-medium mb-1">{review.title}</h4>}
                  {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

