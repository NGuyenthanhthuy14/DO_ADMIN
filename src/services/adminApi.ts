import type {
  AdminUser,
  ApiEnvelope,
  LoginPayload,
  LoginResult,
  Order,
  OrderListResult,
  PaginationQuery,
  Product,
  ProductListResult,
  Shop,
  Specialty,
  VendorStatus,
} from './types';
import { httpClient } from './httpClient';

export function unwrapResponse<T>(response: { data: ApiEnvelope<T> | T }): T {
  const body = response.data as ApiEnvelope<T>;

  if (body && typeof body === 'object') {
    if ('metadata' in body) {
      return body.metadata as T;
    }

    if ('data' in body) {
      return body.data as T;
    }
  }

  return response.data as T;
}

export function getRecordId(record: { _id?: string; id?: string }) {
  return record._id || record.id || '';
}

export function ensureArray<T>(payload: unknown, keys: string[] = []): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const source = payload as Record<string, unknown>;

    for (const key of keys) {
      if (Array.isArray(source[key])) {
        return source[key] as T[];
      }
    }

    for (const value of Object.values(source)) {
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }

  return [];
}

export function formatCurrency(value?: number) {
  if (typeof value !== 'number') {
    return '-';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export const authApi = {
  async login(payload: LoginPayload) {
    return unwrapResponse<LoginResult>(
      await httpClient.post('/auth/login', payload, { withCredentials: true })
    );
  },
  async refreshToken() {
    return unwrapResponse<LoginResult>(
      await httpClient.post('/auth/refresh-token', undefined, {
        withCredentials: true,
      })
    );
  },
  async logout() {
    return unwrapResponse<unknown>(
      await httpClient.post('/auth/logout', undefined, { withCredentials: true })
    );
  },
};

export const usersApi = {
  async list() {
    return unwrapResponse<AdminUser[] | Record<string, AdminUser[]>>(
      await httpClient.get('/users')
    );
  },
  async detail(id: string) {
    return unwrapResponse<AdminUser>(await httpClient.get(`/users/${id}`));
  },
  async update(id: string, payload: Partial<AdminUser>) {
    return unwrapResponse<AdminUser>(await httpClient.put(`/users/${id}`, payload));
  },
  async block(id: string, blocked_reason: string) {
    return unwrapResponse<AdminUser>(
      await httpClient.patch(`/users/${id}/block`, { blocked_reason })
    );
  },
  async unblock(id: string) {
    return unwrapResponse<AdminUser>(await httpClient.patch(`/users/${id}/unblock`));
  },
  async delete(id: string) {
    return unwrapResponse<unknown>(await httpClient.delete(`/users/${id}`));
  },
  async deleteMany(ids: string[]) {
    return unwrapResponse<unknown>(await httpClient.delete('/users', { data: ids }));
  },
};

export const vendorsApi = {
  async list(status?: VendorStatus) {
    return unwrapResponse<AdminUser[] | Record<string, AdminUser[]>>(
      await httpClient.get('/vendors', { params: status ? { status } : undefined })
    );
  },
  async detail(id: string) {
    return unwrapResponse<AdminUser>(await httpClient.get(`/vendors/${id}`));
  },
  async update(id: string, payload: Partial<AdminUser>) {
    return unwrapResponse<AdminUser>(await httpClient.put(`/vendors/${id}`, payload));
  },
  async approve(id: string) {
    return unwrapResponse<AdminUser>(await httpClient.patch(`/vendors/${id}/approve`));
  },
  async reject(id: string) {
    return unwrapResponse<AdminUser>(await httpClient.patch(`/vendors/${id}/reject`));
  },
};

export const productsApi = {
  async list(params: PaginationQuery & { sort?: string[]; filter?: string[] }) {
    return unwrapResponse<ProductListResult | Product[]>(
      await httpClient.get('/products', { params })
    );
  },
  async detail(id: string) {
    return unwrapResponse<Product>(await httpClient.get(`/products/${id}`));
  },
};

export const shopsApi = {
  async list(params?: { owner_id?: string; status?: 'active' | 'inactive' }) {
    return unwrapResponse<Shop[] | Record<string, Shop[]>>(
      await httpClient.get('/shops', { params })
    );
  },
  async detail(slug: string) {
    return unwrapResponse<Shop>(await httpClient.get(`/shops/${slug}`));
  },
  async products(id: string) {
    return unwrapResponse<Product[] | Record<string, Product[]>>(
      await httpClient.get(`/shops/${id}/products`)
    );
  },
  async block(id: string, reason: string) {
    return unwrapResponse<Shop>(await httpClient.patch(`/shops/${id}/block`, { reason }));
  },
};

export const ordersApi = {
  async list(params: PaginationQuery) {
    return unwrapResponse<OrderListResult | Order[]>(
      await httpClient.get('/orders', { params })
    );
  },
  async detail(id: string) {
    return unwrapResponse<Order>(await httpClient.get(`/orders/${id}`));
  },
};

export const specialtiesApi = {
  async list(params?: {
    approval_status?: 'pending' | 'approved' | 'rejected';
    status?: 'active' | 'inactive';
  }) {
    return unwrapResponse<Specialty[] | Record<string, Specialty[]>>(
      await httpClient.get('/specialties', { params })
    );
  },
  async detail(slug: string) {
    return unwrapResponse<Specialty>(await httpClient.get(`/specialties/${slug}`));
  },
  async create(payload: Partial<Specialty>) {
    return unwrapResponse<Specialty>(await httpClient.post('/specialties', payload));
  },
  async update(id: string, payload: Partial<Specialty>) {
    return unwrapResponse<Specialty>(await httpClient.put(`/specialties/${id}`, payload));
  },
  async approve(id: string) {
    return unwrapResponse<Specialty>(
      await httpClient.patch(`/specialties/${id}/approve`)
    );
  },
  async reject(id: string, rejected_reason: string) {
    return unwrapResponse<Specialty>(
      await httpClient.patch(`/specialties/${id}/reject`, { rejected_reason })
    );
  },
  async delete(id: string) {
    return unwrapResponse<unknown>(await httpClient.delete(`/specialties/${id}`));
  },
};
