import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateRecurringTemplateAction } from '../actions/update-recurring-template';
import type { UpdateRecurringTemplateRequest } from '../model/api/update-recurring-template';

export const useUpdateRecurringTemplate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_recurring_template'],
    mutationFn: async (data: UpdateRecurringTemplateRequest) => await updateRecurringTemplateAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_recurring_templates'],
        exact: false,
        type: 'all',
      });
    },
  });
};
