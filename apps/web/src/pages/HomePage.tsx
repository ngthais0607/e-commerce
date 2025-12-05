import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Banner } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, ArrowRight, Truck, ShieldCheck, Clock, CreditCard } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

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
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={banners[0]?.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"} 
            alt="Hero Banner" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {banners[0]?.title || "Discover Modern Living"}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Explore our latest collection of premium products designed for your lifestyle.
            </p>
            <Link to={banners[0]?.link || "/shop"}>
              <Button size="lg" className="text-lg px-8 py-6">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $100</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">100% protected payments</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">Dedicated support team</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg shadow-sm">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Money Back</h3>
                <p className="text-sm text-muted-foreground">30 days guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <Link to="/shop">
            <Button variant="ghost" className="gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
              <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.images[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {product.salePrice && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </div>
                )}
              </Link>
              <CardContent className="p-4">
                <div className="mb-2">
                  <p className="text-sm text-muted-foreground mb-1">{product.category?.name || 'General'}</p>
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-col">
                    {product.salePrice ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    className="rounded-full shadow-sm"
                    onClick={() => addItem(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {banners.length > 1 && (
        <section className="container mx-auto px-4 py-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {banners.slice(1, 3).map((banner) => (
              <Link key={banner.id} to={banner.link || '#'} className="group relative overflow-hidden rounded-2xl aspect-[2/1]">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-8 md:px-12 transition-colors group-hover:bg-black/30">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{banner.title}</h3>
                  <span className="text-white underline decoration-2 underline-offset-4 group-hover:decoration-primary">Shop Collection</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}