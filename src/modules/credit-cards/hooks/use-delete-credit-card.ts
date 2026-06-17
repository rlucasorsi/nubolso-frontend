import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCreditCardAction } from '../actions/delete-credit-card';
import type { DeleteCreditCardRequest } from '../model/api/credit-card';
import { CREDIT_CARDS_QUERY_KEY } from './use-get-credit-cards';

export const useDeleteCreditCard = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_credit_card'],
    mutationFn: async (data: DeleteCreditCardRequest) => await deleteCreditCardAction(data),
    onSuccess: async () => {
      await Promise.all([
        client.refetchQueries({ queryKey: CREDIT_CARDS_QUERY_KEY, exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: ['all_credit_card_invoices'], exact: false, type: 'all' }),
      ]);
    },
  });
};
