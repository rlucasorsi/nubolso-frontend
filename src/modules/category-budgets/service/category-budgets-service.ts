import { HttpClient } from '@/network/http-client';

export interface CategoryBudget {
  id: string;
  categoryId: string;
  periodStart: string;
  amount: number;
}

export interface UpsertCategoryBudgetRequest {
  categoryId: string;
  periodStart: string;
  amount: number;
}

export const categoryBudgetsService = {
  getByPeriod: async (periodStart: string): Promise<CategoryBudget[]> => {
    return HttpClient.get<CategoryBudget[], { periodStart: string }>('/category-budgets', {
      params: { periodStart },
    });
  },

  upsert: async (data: UpsertCategoryBudgetRequest): Promise<CategoryBudget> => {
    return HttpClient.put<CategoryBudget, UpsertCategoryBudgetRequest>(
      '/category-budgets',
      data,
    );
  },

  remove: async (id: string) => {
    return HttpClient.delete(`/category-budgets/${id}`);
  },
};
