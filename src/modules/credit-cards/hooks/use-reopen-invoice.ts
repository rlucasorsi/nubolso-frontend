import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reopenInvoiceAction } from '../actions/reopen-invoice';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

export const useReopenInvoice = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['reopen_credit_card_invoice'],
    mutationFn: async (id: string) => {
      const result = await reopenInvoiceAction(id);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível reabrir a fatura');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        client.refetchQueries({ queryKey: ['list_entries'], exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: ['all_credit_card_invoices'], exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: creditCardInvoicesQueryKey(data.cardId), exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: creditCardInvoiceQueryKey(data.id), exact: false, type: 'all' }),
      ]);
    },
  });
};
