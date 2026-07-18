import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addInvestmentMovementAction } from '../actions/add-investment-movement';
import type { AddInvestmentMovementRequest } from '../model/api/investment';
import { INVESTMENTS_QUERY_KEY } from './use-get-investments';
import { investmentMovementsQueryKey } from './use-investment-movements';

export const useAddInvestmentMovement = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['add_investment_movement'],
    mutationFn: async (data: AddInvestmentMovementRequest) => {
      const result = await addInvestmentMovementAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar o movimento');
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
