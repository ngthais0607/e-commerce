// apps/web/src/lib/api.ts
export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/api/products`, {
    // tránh cache cứng của Turbopack/Next 15
    next: { revalidate: 5 },
  });
  if (!res.ok) throw new Error('fetch failed');
  return res.json();
}
