import { useMutation, useQueryClient } from '@tanstack/react-query';
import { skipRecurringTemplateAction } from '../actions/skip-recurring-template';
import type { SkipRecurringTemplateRequest } from '../model/api/skip-recurring-template';

export const useSkipRecurringTemplate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['skip_recurring_template'],
    mutationFn: async (data: SkipRecurringTemplateRequest) => await skipRecurringTemplateAction(data),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['list_recurring_templates'] }),
      ]);
    },
  });
};
