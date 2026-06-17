import { useQuery } from '@tanstack/react-query';
import { getAllRecurringTemplatesAction } from '../actions/get-all-recurring-templates';

export const useGetRecurringTemplates = () => {
  return useQuery({
    queryKey: ['list_recurring_templates'],
    queryFn: async () => getAllRecurringTemplatesAction(),
    staleTime: 5 * 60 * 1000,
  });
};
