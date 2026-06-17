import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchaseAction } from '../actions/create-purchase';
import type { CreatePurchaseRequest } from '../model/api/purchase';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';

export const useCreatePurchase = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_credit_card_purchase'],
    mutationFn: async (data: CreatePurchaseRequest) => {
      const result = await createPurchaseAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar a compra');
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
