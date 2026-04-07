import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Banner } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Truck, ShieldCheck, Clock, CreditCard, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories first to get clothing category ID
        const categoriesRes = await api.get<Array<{ id: number; slug: string; name?: string }>>('/categories');
        const categories = categoriesRes.data || [];
        const clothingCategory = categories.find((cat) =>
          cat.slug === 'clothing' ||
          cat.name?.toLowerCase().includes('clothing') ||
          cat.name?.toLowerCase().includes('fashion')
        );
        
        // Fetch fashion/clothing products only
        const productParams: Record<string, unknown> = { 
          pageSize: 8, 
          sortBy: 'createdAt', 
          sortOrder: 'desc',
          isActive: true, // Only active products
        };
        
        // If clothing category found, filter by it
        if (clothingCategory) {
          productParams.categoryId = clothingCategory.id;
        }
        
        const [productsRes, bannersRes] = await Promise.all([
          api.get('/products', { params: productParams }),
          api.get('/banners', { params: { position: 'homepage' } }),
        ]);
        
        // Filter to ensure we show only active fashion/clothing products
        let products = (productsRes.data.items || []).filter((p: Product) => p.isActive !== false);
        
        if (!clothingCategory || products.length === 0) {
          // If no clothing category or no products, try to filter by name
          products = products.filter((p: Product) => 
            p.category?.name?.toLowerCase().includes('clothing') ||
            p.category?.name?.toLowerCase().includes('fashion') ||
            p.name?.toLowerCase().includes('shirt') ||
            p.name?.toLowerCase().includes('dress') ||
            p.name?.toLowerCase().includes('jacket') ||
            p.name?.toLowerCase().includes('pants') ||
            p.name?.toLowerCase().includes('fashion')
          );
        }
        
        setFeaturedProducts(products.slice(0, 8));
        const bannersData = bannersRes.data || [];
        setBanners(bannersData);
        
        // If no banners, add a default one
        if (bannersData.length === 0) {
          setBanners([{
            id: 0,
            title: 'Fashion 2026 Collection',
            description: 'Discover the latest trends and styles for 2026. Premium quality, modern designs.',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
            link: '/shop',
            position: 'homepage',
            isActive: true,
            sortOrder: 0,
          }]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default banner on error
        setBanners([{
          id: 0,
          title: 'Fashion 2026 Collection',
          description: 'Discover the latest trends and styles for 2026. Premium quality, modern designs.',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
          link: '/shop',
          position: 'homepage',
          isActive: true,
          sortOrder: 0,
        }]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // SEO: Home page title + description
  useEffect(() => {
    document.title = 'Home | Stay Store';
    const description =
      'Discover the latest fashion 2026 collection at Stay Store. Browse featured products, exclusive deals, and fast delivery.';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const handlePrevious = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <section className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white mb-4 md:mb-6 overflow-hidden">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4 md:space-y-6">
                <Skeleton className="h-8 w-40 rounded-full bg-white/10" />
                <Skeleton className="h-10 md:h-14 w-3/4 bg-white/20" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <div className="flex gap-3 mt-4">
                  <Skeleton className="h-11 w-32 rounded-full bg-white/20" />
                  <Skeleton className="h-11 w-32 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="hidden md:block">
                <Skeleton className="h-72 w-full rounded-3xl bg-white/10" />
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1 bg-gradient-to-b from-background via-muted/20 to-background">
          <section className="container mx-auto px-4 py-10 md:py-14">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-sm bg-white">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-5">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Carousel */}
      <section className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white mb-4 md:mb-6 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        ></div>
        <div 
          ref={carouselRef}
          className="relative overflow-hidden rounded-2xl mx-4 mt-4 md:mt-6 shadow-2xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner, index) => {
              // Different fashion 2026 images for each banner
              // Limited set of distinct hero images (max 5) to avoid too many similar slides
              const fashion2026Images = [
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop', // Fashion store
                'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop', // Fashion model
                'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop', // Fashion clothing
                'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop', // Fashion accessories
                'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop', // Fashion runway
              ];
              
              // Up to 5 different titles/descriptions to pair with the images above
              const fashion2026Content = [
                {
                  title: 'Fashion 2026 Collection',
                  description: 'Discover the latest trends and styles for 2026. Premium quality, modern designs.',
                },
                {
                  title: 'New Season Arrivals',
                  description: 'Fresh styles and colors for the new season. Shop the hottest fashion trends of 2026.',
                },
                {
                  title: 'Designer Collection 2026',
                  description: 'Exclusive designer pieces curated for the modern fashionista. Limited edition items.',
                },
                {
                  title: 'Street Style 2026',
                  description: 'Urban fashion meets high style. Express yourself with our streetwear collection.',
                },
                {
                  title: 'Sustainable Fashion 2026',
                  description: 'Eco-friendly fashion for 2026. Style that cares for the planet and your wardrobe.',
                },
              ];
              
              // Match banner title with content, or use index-based fallback
              const matchedContent = fashion2026Content.find(c => 
                banner.title?.toLowerCase().includes(c.title.toLowerCase().split(' ')[0])
              ) || fashion2026Content[index % fashion2026Content.length];
              
              const defaultImage = fashion2026Images[index % fashion2026Images.length];
              const displayTitle = banner.title || matchedContent.title;
              const displayDescription = matchedContent.description;
              
              return (
                <div
                  key={banner.id || index}
                  className="relative min-w-full h-[280px] md:h-[380px] lg:h-[450px] flex-shrink-0"
                >
                  <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-indigo-900 to-gray-800">
                    <img
                      src={banner.image || defaultImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                      onError={(e) => {
                        console.error('Banner image failed to load:', banner.image);
                        (e.target as HTMLImageElement).src = defaultImage;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/50"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                  <div className="relative h-full container mx-auto px-4 md:px-8 lg:px-12 flex items-center z-10">
                    <div className="max-w-3xl animate-fade-in">
                      <div className="inline-flex items-center gap-2 mb-3 md:mb-4 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-yellow-300 animate-pulse" />
                        <span className="text-xs md:text-sm font-medium text-white/90">New Collection 2026</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-4 md:mb-6 leading-tight text-white drop-shadow-2xl bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent">
                        {displayTitle}
                      </h2>
                      <p className="text-base md:text-lg lg:text-xl text-gray-100 mb-6 md:mb-8 leading-relaxed font-light drop-shadow-lg max-w-2xl">
                        {displayDescription}
                      </p>
                      <Link to={banner.link || '/shop'}>
                        <Button
                          size="lg"
                          className="group text-sm md:text-base lg:text-lg px-6 md:px-8 lg:px-10 py-4 md:py-5 lg:py-6 bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 hover:from-sky-600 hover:via-sky-500 hover:to-cyan-500 text-white shadow-2xl hover:shadow-sky-400/60 transition-all duration-300 rounded-full font-semibold"
                        >
                          Shop Now{' '}
                          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

            {/* Navigation Arrows - Show if more than 1 banner */}
          {banners.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 md:p-4 rounded-full transition-all z-30 shadow-2xl border border-white/30 hover:scale-110 hover:border-white/50"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 md:p-4 rounded-full transition-all z-30 shadow-2xl border border-white/30 hover:scale-110 hover:border-white/50"
                aria-label="Next banner"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </>
          )}

          {/* Dots Indicator - Show if more than 1 banner */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                    index === currentBannerIndex
                      ? 'w-10 bg-white shadow-lg border border-white/50'
                      : 'w-2.5 bg-white/50 hover:bg-white/70 border border-white/30'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-b from-sky-50/80 via-sky-100/90 to-sky-100/90 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Feature 1 */}
            <div className="group flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white shadow-md hover:shadow-xl dark:bg-slate-900 rounded-2xl border border-sky-100/80 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 hover:-translate-y-1 hover:bg-white/95">
              <div className="p-2.5 md:p-3 bg-gradient-to-br from-sky-500 to-sky-400 rounded-full text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-md">
                <Truck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs md:text-sm mb-0.5 text-slate-900 dark:text-slate-50 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors leading-tight">
                  Free Shipping
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-300 leading-tight">On orders over $100</p>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="group flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white shadow-md hover:shadow-xl dark:bg-slate-900 rounded-2xl border border-sky-100/80 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 hover:-translate-y-1 hover:bg-white/95">
              <div className="p-2.5 md:p-3 bg-gradient-to-br from-sky-500 to-cyan-400 rounded-full text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-md">
                <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs md:text-sm mb-0.5 text-slate-900 dark:text-slate-50 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors leading-tight">
                  Secure Payment
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-300 leading-tight">100% protected payments</p>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="group flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white shadow-md hover:shadow-xl dark:bg-slate-900 rounded-2xl border border-sky-100/80 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 hover:-translate-y-1 hover:bg-white/95">
              <div className="p-2.5 md:p-3 bg-gradient-to-br from-sky-500 to-indigo-400 rounded-full text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-md">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs md:text-sm mb-0.5 text-slate-900 dark:text-slate-50 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors leading-tight">
                  24/7 Support
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-300 leading-tight">Dedicated support team</p>
              </div>
            </div>
            {/* Feature 4 */}
            <div className="group flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-white shadow-md hover:shadow-xl dark:bg-slate-900 rounded-2xl border border-sky-100/80 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-500 transition-all duration-300 hover:-translate-y-1 hover:bg-white/95">
              <div className="p-2.5 md:p-3 bg-gradient-to-br from-sky-500 to-blue-500 rounded-full text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0 shadow-md">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-xs md:text-sm mb-0.5 text-slate-900 dark:text-slate-50 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors leading-tight">
                  Money Back
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-300 leading-tight">30 days guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-full border border-indigo-500/20 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Featured Collection</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight bg-gradient-to-r from-foreground via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Fashion 2026 Collection
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover the latest trends and premium fashion items curated for the modern lifestyle
            </p>
          </div>
          <Link to="/shop?category=clothing">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-sky-400 text-sky-700 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all duration-300 rounded-full font-semibold"
            >
              View All Fashion <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden border-none shadow-md">
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-full mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No products available</p>
            <p className="text-sm mt-1">Check back soon for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-2 border-border/50 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-lg hover:shadow-2xl transition-all duration-500 bg-background rounded-2xl hover:-translate-y-2"
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="relative block aspect-square overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl"
                >
                  <img
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop';
                    }}
                  />
                  {product.salePrice && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 via-red-500 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-pulse">
                      SALE
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-opacity duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
                </Link>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                      {product.category?.name || 'Clothing'}
                    </p>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 min-h-[56px]">
                        {product.name}
                      </h3>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-col gap-1">
                      {product.salePrice ? (
                        <>
                          <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                            {formatPrice(product.salePrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-foreground">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="icon"
                      className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        addItem(product);
                      }}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
