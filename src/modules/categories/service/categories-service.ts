import { HttpClient } from '@/network/http-client';
import { FlowType } from '@/lib/cashflow';

// Tipo como vem do backend (uppercase). O service normaliza para FlowType (lowercase).
interface CategoryFromApi {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  color?: string;
  icon?: string;
  isDefault: boolean;
  includeInBalanceBase: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: FlowType;
  color?: string;
  icon?: string;
  isDefault: boolean;
  includeInBalanceBase: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  type: FlowType;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
}

export interface UpdateCategoryRequest {
  id: string;
  name?: string;
  type?: FlowType;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const data = await HttpClient.get<CategoryFromApi[], undefined>('/categories');
    return data.map((c) => ({ ...c, type: c.type.toLowerCase() as FlowType }));
  },

  create: async (data: CreateCategoryRequest) => {
    const payload = { ...data, type: data.type.toUpperCase() };
    return HttpClient.post<Category, typeof payload>('/categories', payload);
  },

  update: async (params: UpdateCategoryRequest) => {
    const { id, type, ...rest } = params;
    const payload = { ...rest, ...(type ? { type: type.toUpperCase() } : {}) };
    return HttpClient.patch<Category, typeof payload>(`/categories/${id}`, payload);
  },

  remove: async (id: string) => {
    return HttpClient.delete(`/categories/${id}`);
  },
};
