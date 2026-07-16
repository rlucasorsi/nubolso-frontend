import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advanceInvoicePaymentAction } from '../actions/advance-invoice-payment';
import type { AdvanceInvoicePaymentRequest } from '../model/api/invoice';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

export const useAdvanceInvoicePayment = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['advance_credit_card_invoice_payment'],
    mutationFn: async (data: AdvanceInvoicePaymentRequest) => {
      const result = await advanceInvoicePaymentAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar o adiantamento');
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
