import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertCategoryBudgetAction } from '../actions/upsert-category-budget';
import type { UpsertCategoryBudgetRequest } from '../service/category-budgets-service';

export const useUpsertCategoryBudget = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['upsert_category_budget'],
    mutationFn: async (data: UpsertCategoryBudgetRequest) => await upsertCategoryBudgetAction(data),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['list_category_budgets'] });
    },
  });
};
