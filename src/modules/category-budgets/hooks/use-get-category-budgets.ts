import { useQuery } from '@tanstack/react-query';
import { getCategoryBudgetsAction } from '../actions/get-category-budgets';

export const useGetCategoryBudgets = (periodStart: string) => {
  return useQuery({
    queryKey: ['list_category_budgets', periodStart],
    queryFn: async () => getCategoryBudgetsAction(periodStart),
    enabled: !!periodStart,
  });
};
