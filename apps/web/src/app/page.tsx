// apps/web/src/app/page.tsx
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const products = await fetchProducts();

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>

      {products.length === 0 ? (
        <p className="text-gray-500">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </main>
  );
}
