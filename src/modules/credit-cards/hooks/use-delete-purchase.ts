import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePurchaseAction } from '../actions/delete-purchase';
import { creditCardInvoiceQueryKey } from './use-get-invoice';
import { allCreditCardInvoicesQueryKey } from './use-get-all-invoices';

export const useDeletePurchase = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_purchase'],
    mutationFn: ({ purchaseId }: { purchaseId: string; invoiceId: string; cardId: string }) =>
      deletePurchaseAction(purchaseId),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: creditCardInvoiceQueryKey(variables.invoiceId) });
      client.invalidateQueries({ queryKey: ['credit_card_invoices', variables.cardId] });
      client.invalidateQueries({ queryKey: allCreditCardInvoicesQueryKey() });
    },
  });
};
