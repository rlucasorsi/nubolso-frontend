import { useMutation, useQueryClient } from '@tanstack/react-query';
import { realizeRecurringTemplateAction } from '../actions/realize-recurring-template';
import type { RealizeRecurringTemplateRequest } from '../model/api/realize-recurring-template';

export const useRealizeRecurringTemplate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['realize_recurring_template'],
    mutationFn: async (data: RealizeRecurringTemplateRequest) =>
      await realizeRecurringTemplateAction(data),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['list_recurring_templates'] }),
        // Templates vinculados a cartão materializam como compra na fatura
        client.invalidateQueries({ queryKey: ['all_credit_card_invoices'] }),
        client.invalidateQueries({ queryKey: ['credit_card_invoice'] }),
        client.invalidateQueries({ queryKey: ['credit_card_invoices'] }),
      ]);
    },
  });
};
