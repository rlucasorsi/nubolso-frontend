import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  realizeBatchRecurringTemplatesAction,
  RealizeBatchItem,
} from '../actions/realize-batch-recurring-templates';

export const useRealizeAllRecurringTemplates = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['realize_all_recurring_templates'],
    mutationFn: async (items: RealizeBatchItem[]) =>
      await realizeBatchRecurringTemplatesAction(items),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['list_recurring_templates'] }),
        // Templates vinculados a cartão materializam como compra na fatura
        client.invalidateQueries({ queryKey: ['all_credit_card_invoices'] }),
      ]);
    },
  });
};
