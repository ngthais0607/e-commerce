/**
 * Shared types for model filters and method parameters
 */

export interface PaginationFilters {
  page?: number;
  pageSize?: number;
}

export interface OrderListFilters extends PaginationFilters {
  status?: string;
  userId?: number;
  paymentStatus?: string;
}

export interface ProductListFilters extends PaginationFilters {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: string;
  sortOrder?: string;
  isActive?: boolean;
}

export interface CategoryListFilters extends PaginationFilters {
  search?: string;
  parentId?: number | null;
}

export interface CouponListFilters extends PaginationFilters {
  search?: string;
  isActive?: boolean;
  type?: string;
}

export interface UserListFilters extends PaginationFilters {
  role?: string;
  search?: string;
}

export interface BannerListFilters {
  position?: string;
  includeInactive?: boolean;
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
  attributes?: Record<string, unknown>;
}

export interface ShippingAddressInput {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
  postalCode?: string;
}

export interface OrderCreateData {
  userId: number;
  items: OrderItemInput[];
  shippingAddress: ShippingAddressInput;
  phone: string;
  email?: string | null;
  notes?: string | null;
  paymentMethod?: string;
  couponCode?: string | null;
  shippingFee?: number;
}

export interface ReviewListFilters extends PaginationFilters {
  productId?: number;
}

export interface ReviewCreateData {
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ReviewUpdateData {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface UserProfileUpdateData {
  name?: string;
  phone?: string;
  password?: string;
}
