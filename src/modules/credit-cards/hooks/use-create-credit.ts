import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCreditAction } from '../actions/create-credit';
import type { CreatePurchaseRequest } from '../model/api/purchase';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';

export const useCreateCredit = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_credit_card_credit'],
    mutationFn: async (data: CreatePurchaseRequest) => {
      const result = await createCreditAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar o crédito');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['all_credit_card_invoices'] }),
        client.invalidateQueries({ queryKey: creditCardInvoicesQueryKey(data.cardId) }),
      ]);
    },
  });
};
