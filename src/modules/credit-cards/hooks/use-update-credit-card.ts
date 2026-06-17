import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCreditCardAction } from '../actions/update-credit-card';
import type { UpdateCreditCardRequest } from '../model/api/credit-card';
import { CREDIT_CARDS_QUERY_KEY } from './use-get-credit-cards';

export const useUpdateCreditCard = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_credit_card'],
    mutationFn: async (data: UpdateCreditCardRequest) => await updateCreditCardAction(data),
    onSuccess: async () => {
      await Promise.all([
        client.refetchQueries({ queryKey: CREDIT_CARDS_QUERY_KEY, exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: ['all_credit_card_invoices'], exact: false, type: 'all' }),
      ]);
    },
  });
};
