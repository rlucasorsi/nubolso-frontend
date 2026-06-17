import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRecurringTemplateAction } from '../actions/create-recurring-template';
import type { CreateRecurringTemplateRequest } from '../model/api/create-recurring-template';

export const useCreateRecurringTemplate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_recurring_template'],
    mutationFn: async (data: CreateRecurringTemplateRequest) => await createRecurringTemplateAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_recurring_templates'],
        exact: false,
        type: 'all',
      });
    },
  });
};
