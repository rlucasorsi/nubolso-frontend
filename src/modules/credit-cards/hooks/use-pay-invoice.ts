import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payInvoiceAction } from '../actions/pay-invoice';
import type { PayInvoiceRequest } from '../model/api/invoice';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

export const usePayInvoice = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['pay_credit_card_invoice'],
    mutationFn: async (data: PayInvoiceRequest) => {
      const result = await payInvoiceAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar o pagamento');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['all_credit_card_invoices'] }),
        client.invalidateQueries({ queryKey: creditCardInvoicesQueryKey(data.cardId) }),
        client.invalidateQueries({ queryKey: creditCardInvoiceQueryKey(data.id) }),
      ]);
    },
  });
};
