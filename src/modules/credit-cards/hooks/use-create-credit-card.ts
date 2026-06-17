import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCreditCardAction } from '../actions/create-credit-card';
import type { CreateCreditCardRequest } from '../model/api/credit-card';
import { CREDIT_CARDS_QUERY_KEY } from './use-get-credit-cards';

export const useCreateCreditCard = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_credit_card'],
    mutationFn: async (data: CreateCreditCardRequest) => await createCreditCardAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: CREDIT_CARDS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
