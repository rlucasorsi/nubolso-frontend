import { HttpClient } from '@/network/http-client';
import { FlowType } from '@/lib/cashflow';

// Direção do orçamento: 'limit' = estourar é ruim (Gasolina), 'goal' = atingir
// é bom (Investimento). Sempre minúsculo no frontend, igual ao FlowType.
export type BudgetDirection = 'limit' | 'goal';

// Tipo como vem do backend (uppercase). O service normaliza para FlowType (lowercase).
interface CategoryFromApi {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  color?: string;
  icon?: string;
  isDefault: boolean;
  includeInBalanceBase: boolean;
  budgetDirection: 'LIMIT' | 'GOAL';
}

export interface Category {
  id: string;
  name: string;
  type: FlowType;
  color?: string;
  icon?: string;
  isDefault: boolean;
  includeInBalanceBase: boolean;
  budgetDirection: BudgetDirection;
}

export interface CreateCategoryRequest {
  name: string;
  type: FlowType;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
  budgetDirection?: BudgetDirection;
}

export interface UpdateCategoryRequest {
  id: string;
  name?: string;
  type?: FlowType;
  color?: string;
  icon?: string;
  includeInBalanceBase?: boolean;
  budgetDirection?: BudgetDirection;
}

export const categoriesService = {
  getAll: async (): Promise<Category[]> => {
    const data = await HttpClient.get<CategoryFromApi[], undefined>('/categories');
    return data.map((c) => ({
      ...c,
      type: c.type.toLowerCase() as FlowType,
      budgetDirection: c.budgetDirection.toLowerCase() as BudgetDirection,
    }));
  },

  create: async (data: CreateCategoryRequest) => {
    const payload = {
      ...data,
      type: data.type.toUpperCase(),
      ...(data.budgetDirection ? { budgetDirection: data.budgetDirection.toUpperCase() } : {}),
    };
    return HttpClient.post<Category, typeof payload>('/categories', payload);
  },

  update: async (params: UpdateCategoryRequest) => {
    const { id, type, budgetDirection, ...rest } = params;
    const payload = {
      ...rest,
      ...(type ? { type: type.toUpperCase() } : {}),
      ...(budgetDirection ? { budgetDirection: budgetDirection.toUpperCase() } : {}),
    };
    return HttpClient.patch<Category, typeof payload>(`/categories/${id}`, payload);
  },

  remove: async (id: string) => {
    return HttpClient.delete(`/categories/${id}`);
  },
};
