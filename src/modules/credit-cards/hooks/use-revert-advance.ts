import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revertAdvanceAction } from '../actions/revert-advance';
import { creditCardInvoiceQueryKey } from './use-get-invoice';
import { allCreditCardInvoicesQueryKey } from './use-get-all-invoices';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';

interface RevertAdvanceVariables {
  advanceId: string;
  invoiceId: string;
  cardId: string;
}

export const useRevertAdvance = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['revert_advance'],
    mutationFn: async ({ advanceId }: RevertAdvanceVariables) => {
      const result = await revertAdvanceAction(advanceId);
      if (!result.success) {
        throw new Error(result.message ?? 'Não foi possível reverter a antecipação');
      }
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
