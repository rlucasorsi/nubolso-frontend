import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeInvestmentMovementAction } from '../actions/remove-investment-movement';
import type { RemoveInvestmentMovementRequest } from '../model/api/investment';
import { INVESTMENTS_QUERY_KEY } from './use-get-investments';
import { investmentMovementsQueryKey } from './use-investment-movements';

export const useRemoveInvestmentMovement = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['remove_investment_movement'],
    mutationFn: async (data: RemoveInvestmentMovementRequest) => {
      const result = await removeInvestmentMovementAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível remover o movimento');
      }

      return result.data;
    },
    onSuccess: async (_data, variables) => {
      await client.refetchQueries({
        queryKey: INVESTMENTS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
      await client.refetchQueries({
        queryKey: investmentMovementsQueryKey(variables.investmentId),
        exact: false,
        type: 'all',
      });
    },
  });
};
