import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  RefreshCcw,
  ShieldCheck,
  Minus,
  Plus,
} from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import type { ApiError } from '@/utils/errorHandler';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // SEO: cập nhật title & meta description theo sản phẩm
  useEffect(() => {
    const baseTitle = 'Product | Stay Store';
    if (!product) {
      document.title = baseTitle;
      return;
    }
    const title = `${product.name} | Stay Store`;
    const description =
      product.shortDesc ||
      `${product.name} - Buy this product at Stay Store with great price and fast delivery.`;

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }, [product]);

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

  const handleOpenReviewForm = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (reviewRating < 1 || reviewRating > 5) {
      toast({
        variant: 'destructive',
        title: 'Invalid rating',
        description: 'Please select a rating between 1 and 5 stars.',
      });
      return;
    }

    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment || undefined,
      });

      // Refresh product to get updated rating & reviews list
      await fetchProduct();

      toast({
        title: 'Review submitted',
        description: 'Thank you for sharing your feedback!',
      });

      setShowReviewForm(false);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      const apiError = error as ApiError;
      toast({
        variant: 'destructive',
        title: 'Could not submit review',
        description:
          apiError?.message || 'Please try again later.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            <div className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200" />
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, idx) => (
                  <Skeleton key={idx} className="aspect-square w-full rounded-lg" />
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="mb-6 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-3/4" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <div className="mb-6">
                <Skeleton className="h-10 w-40" />
              </div>

              <div className="mb-8 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-11 w-full sm:w-40 rounded-full" />
                <Skeleton className="h-11 w-full sm:w-40 rounded-full" />
              </div>

              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-xl">
        Product not found
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-200 relative shadow-lg">
              {!imgLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />}
              <img
                src={product.images?.[activeImage] || '/placeholder.jpg'}
                alt={product.name}
                className={`w-full h-full object-cover object-center transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="eager"
                onLoad={() => setImgLoaded(true)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop';
                  setImgLoaded(true);
                }}
              />
              {product.salePrice && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-4 py-2 rounded-full shadow-xl">
                  SALE
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(idx); setImgLoaded(false); }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === idx
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-gray-200'
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
              <p className="text-sm text-primary font-medium mb-2">
                {product.category?.name || 'Product'}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center bg-yellow-50 px-2 py-1 rounded-md"
                  aria-label={`Rating: ${product.rating.toFixed(1)} out of 5`}
                  role="img"
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" aria-hidden="true" />
                  <span className="font-semibold text-yellow-700">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-400" aria-hidden="true">|</span>
                <span className="text-muted-foreground">{product.reviewCount} reviews</span>
                <span className="text-gray-400">|</span>
                <span
                  className={`${
                    product.stock > 0 ? 'text-green-600' : 'text-red-600'
                  } font-medium`}
                >
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
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {product.shortDesc && (
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                {product.shortDesc}
              </p>
            )}

            <div className="border-t border-b py-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Quantity
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Choose how many items you want to add to your cart.
                  </p>
                </div>
                <div className="inline-flex items-center rounded-full bg-slate-900 text-white shadow-sm px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-9 w-9 text-white hover:bg-slate-800"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-10 text-center font-semibold text-base">
                    {quantity}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="h-9 w-9 text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {product.stock === 0 && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                This product is currently out of stock. Check back soon for availability.
              </div>
            )}
            <div className="flex gap-4 mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                size="lg"
                className="flex-1 text-base h-12"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
              <button
                className={`pb-4 px-2 font-semibold ${
                  activeTab === 'description'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                className={`pb-4 px-2 ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-primary text-primary font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {activeTab === 'description' && (
              <div className="lg:col-span-2">
                <div className="prose max-w-none text-gray-600">
                  <p className="whitespace-pre-line leading-relaxed">
                    {product.description || product.shortDesc}
                  </p>
                </div>
              </div>
            )}

            <div className={activeTab === 'reviews' ? 'lg:col-span-3' : 'lg:col-span-1'}>
              <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-xl text-gray-900 dark:text-slate-50">
                  Customer Reviews
                </h3>
                <div className="space-y-4">
                {!showReviewForm && (
                  <div className="flex flex-col gap-2">
                    {reviews.length === 0 && (
                      <p className="text-sm text-gray-700 dark:text-slate-200">
                        No reviews yet. Be the first to review this product.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full font-semibold border-slate-400 text-gray-900 hover:bg-slate-50/60 dark:border-slate-600 dark:text-slate-50 dark:hover:bg-slate-800"
                        onClick={handleOpenReviewForm}
                    >
                      Write a Review
                    </Button>
                  </div>
                )}

                {showReviewForm && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="space-y-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Your rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setReviewRating(value)}
                            className="p-0.5"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                value <= reviewRating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Great product!"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Comment</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReviewForm(false)}
                        disabled={submittingReview}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </div>
                  </form>
                )}

                {reviews.length > 0 && (
                  <div className="space-y-6 pt-2 border-t border-border/70">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                              {review.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">
                                {review.user?.name || 'Anonymous'}
                              </p>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">Verified purchase</span>
                        </div>
                        {review.title && (
                          <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                        )}
                        {review.comment && (
                          <p className="text-sm text-gray-600">{review.comment}</p>
                        )}
                        {review.adminReply && (
                          <div className="mt-3 ml-4 border-l-2 border-sky-300 pl-3 bg-sky-50 rounded-r-lg py-2 pr-2">
                            <p className="text-xs font-semibold text-sky-700 mb-0.5">Shop Reply</p>
                            <p className="text-sm text-sky-900">{review.adminReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
