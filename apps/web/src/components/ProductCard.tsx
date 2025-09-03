// apps/web/src/components/ProductCard.tsx
import type { Product } from '@/lib/api';

export default function ProductCard({ p }: { p: Product }) {
  return (
    <div className="rounded-2xl p-4 shadow-sm border">
      <h3 className="font-semibold">{p.name}</h3>
      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
      <div className="mt-3 font-bold">
        {p.price.toLocaleString()} đ
      </div>
    </div>
  );
}
