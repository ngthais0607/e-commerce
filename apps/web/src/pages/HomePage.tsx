import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import type { Product, Banner } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div>
      {/* Banners */}
      {banners.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <Link key={banner.id} to={banner.link || '#'}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={banner.image} alt={banner.title} className="w-full h-48 object-cover" />
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <Link to={`/product/${product.slug}`}>
                <img
                  src={product.images[0] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <CardContent className="p-4">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-semibold mb-2 hover:text-primary">{product.name}</h3>
                </Link>
                <div className="flex items-center justify-between">
                  <div>
                    {product.salePrice ? (
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <Button
                    size="sm"
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
        <div className="text-center mt-8">
          <Link to="/shop">
            <Button>View All Products</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

