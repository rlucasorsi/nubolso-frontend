import { HttpClient } from '@/network/http-client';

export interface Category {
  id: string;
  name: string;
  color?: string;
  type: string;
}

export interface GetCategoriesFilters {
  type?: 'INCOME' | 'EXPENSE' | 'SPENDING';
}

export interface CreateCategoryRequest {
  name: string;
  color?: string;
  type: string;
}

export const categoriesService = {
  getAll: async (filters?: GetCategoriesFilters) => {
    return HttpClient.get<Category[], GetCategoriesFilters>('/categories', { params: filters });
  },

  create: async (data: CreateCategoryRequest) => {
    return HttpClient.post<Category, CreateCategoryRequest>('/categories', data);
  },
};
