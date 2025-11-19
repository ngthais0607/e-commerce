import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setItems(res.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(items.filter((item) => item.productId !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
          <Link to="/shop">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <Link to={`/product/${item.product.slug}`}>
                <img
                  src={item.product.images[0] || '/placeholder.jpg'}
                  alt={item.product.name}
                  className="w-full h-48 object-cover"
                />
              </Link>
              <CardContent className="p-4">
                <Link to={`/product/${item.product.slug}`}>
                  <h3 className="font-semibold mb-2 hover:text-primary">{item.product.name}</h3>
                </Link>
                <div className="flex items-center justify-between mb-2">
                  {item.product.salePrice ? (
                    <div>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(item.product.salePrice)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        {formatPrice(item.product.price)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold">{formatPrice(item.product.price)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addItem(item.product)}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

