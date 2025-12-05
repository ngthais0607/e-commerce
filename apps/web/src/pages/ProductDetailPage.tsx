import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Review } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart, Star, Truck, RefreshCcw, ShieldCheck, Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
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
      console.error(error);
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-12 text-center text-xl">Product not found</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100 border relative">
              <img
                src={product.images[activeImage] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              {product.salePrice && (
                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1.5 rounded-md">
                  SALE
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <p className="text-sm text-primary font-medium mb-2">{product.category?.name || 'Product'}</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="font-semibold text-yellow-700">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-muted-foreground">{product.reviewCount} reviews</span>
                <span className="text-gray-400">|</span>
                <span className={`${product.stock > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 p-4 rounded-xl">
              {product.salePrice ? (
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-red-600">
                    {formatPrice(product.salePrice)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through mb-1">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-4xl font-bold text-gray-900">{formatPrice(product.price)}</span>
              )}
            </div>

            {product.shortDesc && (
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                {product.shortDesc}
              </p>
            )}

            <div className="border-t border-b py-6 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Quantity</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-12 text-center font-medium">{quantity}</div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <Button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0} 
                size="lg"
                className="flex-1 text-base h-12"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="secondary"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                size="lg"
                className="flex-1 text-base h-12"
              >
                Buy Now
              </Button>
              {isAuthenticated && (
                <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
                  <Heart className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" /> Free delivery over $100
              </div>
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" /> 30 Days return policy
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> 1 year warranty
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="border-b mb-8">
            <div className="flex gap-8">
              <button className="border-b-2 border-primary pb-4 font-semibold text-primary px-2">
                Description
              </button>
              <button className="text-gray-500 hover:text-gray-900 pb-4 px-2">
                Reviews ({reviews.length})
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose max-w-none text-gray-600">
                <p className="whitespace-pre-line leading-relaxed">
                  {product.description || product.shortDesc}
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <h3 className="font-bold text-xl mb-6">Customer Reviews</h3>
              {reviews.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">No reviews yet.</p>
                  <Button variant="outline">Write a Review</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                            {review.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{review.user?.name || 'Anonymous'}</p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">2 days ago</span>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}