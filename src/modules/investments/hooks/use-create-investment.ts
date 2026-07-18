import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvestmentAction } from '../actions/create-investment';
import type { CreateInvestmentRequest } from '../model/api/investment';
import { INVESTMENTS_QUERY_KEY } from './use-get-investments';

export const useCreateInvestment = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_investment'],
    mutationFn: async (data: CreateInvestmentRequest) => {
      const result = await createInvestmentAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível criar o investimento');
      }

      return result.data;
    },
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: INVESTMENTS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
