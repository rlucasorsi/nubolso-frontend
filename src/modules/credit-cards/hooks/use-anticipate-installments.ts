import { useMutation, useQueryClient } from '@tanstack/react-query';
import { anticipateInstallmentsAction } from '../actions/anticipate-installments';
import { allCreditCardInvoicesQueryKey } from './use-get-all-invoices';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

interface AnticipateInstallmentsVariables {
  cardId: string;
  invoiceId: string;
  purchaseId: string;
  installmentsCount: number;
  paidAmount: number;
}

export const useAnticipateInstallments = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['anticipate_installments'],
    mutationFn: async ({ cardId, purchaseId, installmentsCount, paidAmount }: AnticipateInstallmentsVariables) => {
      const result = await anticipateInstallmentsAction(cardId, { purchaseId, installmentsCount, paidAmount });

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível antecipar as parcelas');
      }

      return result.data;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: creditCardInvoiceQueryKey(variables.invoiceId) }),
        client.invalidateQueries({ queryKey: allCreditCardInvoicesQueryKey() }),
        client.invalidateQueries({ queryKey: creditCardInvoicesQueryKey(variables.cardId) }),
      ]);
    },
  });
};
