import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecurringTemplateAction } from '../actions/delete-recurring-template';
import type { DeleteRecurringTemplateRequest } from '../model/api/delete-recurring-template';

export const useDeleteRecurringTemplate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_recurring_template'],
    mutationFn: async (data: DeleteRecurringTemplateRequest) => await deleteRecurringTemplateAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_recurring_templates'],
        exact: false,
        type: 'all',
      });
    },
  });
};
