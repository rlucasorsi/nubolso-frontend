import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advanceInstallmentsAction } from '../actions/advance-installments';
import type { AdvanceInstallmentsRequest } from '../model/api/advance';
import { creditCardInvoiceQueryKey } from './use-get-invoice';
import { allCreditCardInvoicesQueryKey } from './use-get-all-invoices';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';

interface AdvanceInstallmentsVariables extends AdvanceInstallmentsRequest {
  invoiceId: string;
  cardId: string;
}

export const useAdvanceInstallments = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['advance_installments'],
    mutationFn: async ({ purchaseId, targetYear, targetMonth }: AdvanceInstallmentsVariables) => {
      const result = await advanceInstallmentsAction({ purchaseId, targetYear, targetMonth });

      if (!result.success) {
        throw new Error(result.message ?? 'Não foi possível mover as parcelas');
      }

      return result.data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: creditCardInvoiceQueryKey(variables.invoiceId) }),
        client.invalidateQueries({ queryKey: creditCardInvoicesQueryKey(variables.cardId) }),
        client.invalidateQueries({ queryKey: allCreditCardInvoicesQueryKey() }),
      ]);
    },
  });
};
