import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteInvestmentAction } from '../actions/delete-investment';
import type { DeleteInvestmentRequest } from '../model/api/investment';
import { INVESTMENTS_QUERY_KEY } from './use-get-investments';

export const useDeleteInvestment = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_investment'],
    mutationFn: async (data: DeleteInvestmentRequest) => await deleteInvestmentAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: INVESTMENTS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
