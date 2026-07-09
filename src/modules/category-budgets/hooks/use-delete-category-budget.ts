import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategoryBudgetAction } from '../actions/delete-category-budget';

export const useDeleteCategoryBudget = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_category_budget'],
    mutationFn: async (id: string) => await deleteCategoryBudgetAction(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['list_category_budgets'] });
    },
  });
};
