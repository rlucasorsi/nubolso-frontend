import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvoicePaymentDateAction } from '../actions/update-invoice-payment-date';
import type { UpdateInvoicePaymentDateRequest } from '../model/api/invoice';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

export const useUpdateInvoicePaymentDate = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_credit_card_invoice_payment_date'],
    mutationFn: async (data: UpdateInvoicePaymentDateRequest) => {
      const result = await updateInvoicePaymentDateAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível atualizar a data de pagamento');
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
