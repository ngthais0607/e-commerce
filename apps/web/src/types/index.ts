export type UserRole = 'CUSTOMER' | 'ADMIN' | 'STAFF';

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type CouponType = 'PERCENT' | 'FIXED';

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  isActive: boolean;
  parent?: Category;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  sku?: string;
  images: string[];
  attributes?: Record<string, any>;
  categoryId: number;
  category?: Category;
  brand?: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  attributes?: Record<string, any>;
  product?: Product;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user?: User;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  ward: string;
    postalCode?: string;
  };
  phone: string;
  email?: string;
  notes?: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  trackingCode?: string;
  internalNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  user?: User;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Address {
  id: number;
  userId: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: number;
  title: string;
  image: string;
  link?: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  attributes?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

