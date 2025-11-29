import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import type { Product, Banner } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, bannersRes] = await Promise.all([
          api.get('/products', { params: { pageSize: 8, sortBy: 'createdAt', sortOrder: 'desc' } }),
          api.get('/banners', { params: { position: 'homepage' } }),
        ]);
        setFeaturedProducts(productsRes.data.items || []);
        setBanners(bannersRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-64" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="gap-2 text-sm mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              Welcome to our store
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover Amazing Products
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Shop the latest trends and find everything you need in one place. Quality products at unbeatable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/shop">
                <Button size="lg" className="group">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/shop">
                <Button size="lg" variant="outline">
                  Browse Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banners */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.map((banner, index) => (
              <Link 
                key={banner.id} 
                to={banner.link || '#'}
                className="group"
              >
                <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                  <div className="relative overflow-hidden">
                    <img 
                      src={banner.image} 
                      alt={banner.title} 
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {banner.title && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {banner.title}
                        </h3>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant="secondary">Featured</Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Featured Products</h2>
            <p className="text-muted-foreground mt-2">Handpicked selections just for you</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <Card 
              key={product.id} 
              className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Link to={`/product/${product.slug}`} className="block relative overflow-hidden">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.images[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {product.salePrice && (
                    <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                      Sale
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
                    </div>
                  )}
                </div>
              </Link>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/product/${product.slug}`} className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                  </Link>
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{Number(product.rating || 0).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {product.salePrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-xl font-bold">{formatPrice(product.price)}</span>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full group/btn"
                  onClick={() => addItem(product)}
                  disabled={product.stock === 0}
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/shop">
            <Button size="lg" variant="outline" className="group">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

