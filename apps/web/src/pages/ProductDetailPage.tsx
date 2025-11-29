import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Review } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart, Star, Minus, Plus, Package, Truck, Shield, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="w-full h-[600px] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
      </div>
    );
  }

  const price = Number(product.salePrice || product.price);
  const discount = product.salePrice 
    ? Math.round(((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl border-2 bg-muted">
            <img
              src={product.images[selectedImage] || product.images[0] || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {product.salePrice && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-base px-3 py-1">
                -{discount}%
              </Badge>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">Out of Stock</Badge>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === idx
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <Badge variant="outline" className="mb-3">
                {product.category.name}
              </Badge>
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(Number(product.rating || 0))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount || 0} reviews)
              </span>
              {product.rating && (
                <span className="text-sm font-medium">({Number(product.rating || 0).toFixed(1)})</span>
              )}
            </div>
          </div>

          <Separator />

          <div>
            {product.salePrice ? (
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-2xl text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge variant="destructive" className="text-sm">
                  Save {formatPrice(Number(product.price) - Number(product.salePrice))}
                </Badge>
              </div>
            ) : (
              <span className="text-4xl font-bold">{formatPrice(product.price)}</span>
            )}
          </div>

          {product.shortDesc && (
            <p className="text-lg text-muted-foreground leading-relaxed">{product.shortDesc}</p>
          )}

          <Separator />

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  In Stock ({product.stock} available)
                </span>
              </>
            ) : (
              <>
                <Package className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Out of Stock</span>
              </>
            )}
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium mb-3">Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="rounded-r-none"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center border-0 rounded-none focus-visible:ring-0"
                  min="1"
                  max={product.stock}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="rounded-l-none"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleAddToCart} 
              disabled={product.stock === 0} 
              className="flex-1 h-12 text-base"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 h-12 text-base"
              size="lg"
              variant="outline"
            >
              Buy Now
            </Button>
            {isAuthenticated && (
              <Button variant="outline" size="icon" className="h-12 w-12">
                <Heart className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Features */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">On orders over $50</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-sm text-muted-foreground">30-day return policy</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-sm text-muted-foreground">100% secure checkout</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Product Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Customer Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Number(review.rating || 0)
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="font-medium text-lg">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                  {review.id !== reviews[reviews.length - 1].id && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

