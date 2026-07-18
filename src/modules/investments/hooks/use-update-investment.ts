import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInvestmentAction } from '../actions/update-investment';
import type { UpdateInvestmentRequest } from '../model/api/investment';
import { INVESTMENTS_QUERY_KEY } from './use-get-investments';

export const useUpdateInvestment = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_investment'],
    mutationFn: async (data: UpdateInvestmentRequest) => {
      const result = await updateInvestmentAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível atualizar o investimento');
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
