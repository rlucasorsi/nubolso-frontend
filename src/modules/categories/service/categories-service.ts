import { HttpClient } from '@/network/http-client';

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  includeInBalanceBase: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
}

export interface UpdateCategoryRequest {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
}

export const categoriesService = {
  getAll: async () => {
    return HttpClient.get<Category[], undefined>('/categories');
  },

  create: async (data: CreateCategoryRequest) => {
    return HttpClient.post<Category, CreateCategoryRequest>('/categories', data);
  },

  update: async (params: UpdateCategoryRequest) => {
    const { id, ...data } = params;
    return HttpClient.patch<Category, Omit<UpdateCategoryRequest, 'id'>>(`/categories/${id}`, data);
  },

  remove: async (id: string) => {
    return HttpClient.delete(`/categories/${id}`);
  },
};
