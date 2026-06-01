export type ApiEnvelope<T> = {
  err?: number;
  mess?: string;
  data?: T;
  statusCode?: number;
  error?: string | null;
  message?: string;
  metadata?: T;
};

export type AdminUser = {
  _id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  email: string;
  phone?: string;
  role: 'user' | 'vendor' | 'admin' | string;
  vendor_status?: 'pending' | 'approved' | 'rejected' | null;
  status?: 'active' | 'blocked';
  blocked_reason?: string;
  avatar_url?: string;
  address?: string;
  address_book?: unknown[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  accessToken?: string;
  access_token?: string;
  token?: string;
  user?: AdminUser;
  admin?: AdminUser;
};

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export type Product = {
  _id: string;
  shop_id?: string | null;
  specialty_id?: string | null;
  name: string;
  slug?: string;
  image_url?: string;
  price?: number;
  description?: string;
  rating?: number;
  discount?: number;
};

export type ProductListResult = {
  products?: Product[];
  data?: Product[];
  totalProduts?: number;
  totalProducts?: number;
  currentPage?: number;
  totalPage?: number;
};

export type Shop = {
  _id: string;
  owner_id?: string;
  name: string;
  slug: string;
  description?: string;
  phone?: string;
  cover_image?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  formatted_address?: string;
  province_id?: number;
  district_id?: number;
  ward_code?: string;
  status?: 'active' | 'inactive';
  block_reason?: string;
};

export type Order = {
  _id: string;
  orderCode?: string;
  user?: AdminUser | Record<string, unknown>;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    province_id?: number;
    district?: string;
    district_id?: number;
    ward?: string;
    ward_code?: string;
    detail?: string;
  } & Record<string, unknown>;
  shopOrders?: Array<{
    _id?: string;
    shop?: {
      _id?: string;
      name?: string;
      slug?: string;
      cover_image?: string;
      address?: string;
    };
    shopName?: string;
    items?: Array<{
      product?: {
        _id?: string;
        name?: string;
        image_url?: string;
        price?: number;
      };
      name?: string;
      image?: string;
      price?: number;
      quantity?: number;
      itemTotal?: number;
    }>;
    shippingMethod?: string;
    shippingLabel?: string;
    shippingPrice?: number;
    productTotal?: number;
    shopTotal?: number;
    note?: string;
  }>;
  paymentMethod?: 'cod' | 'bank' | 'ewallet' | 'card' | 'zalopay' | string;
  paymentProvider?: 'cod' | 'zalopay' | 'bank' | 'ewallet' | 'card' | null | string;
  paymentStatus?: 'unpaid' | 'pending' | 'paid' | 'failed';
  paymentTransactionId?: string;
  paymentOrderUrl?: string;
  paymentOrderToken?: string;
  paymentQrCode?: string;
  zaloPayTransId?: string;
  subtotal?: number;
  shippingTotal?: number;
  totalPrice?: number;
  status?: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
  isPaid?: boolean;
  isDelivered?: boolean;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type OrderListResult = {
  orders?: Order[];
  data?: Order[];
  totalOrders?: number;
  currentPage?: number;
  totalPage?: number;
};

export type Specialty = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image_url?: string;
  created_by?: string | null;
  created_by_role?: 'vendor' | 'admin' | null;
  shop_id?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  status?: 'active' | 'inactive';
};

export type PaginationQuery = {
  limit?: number;
  page?: number;
};
