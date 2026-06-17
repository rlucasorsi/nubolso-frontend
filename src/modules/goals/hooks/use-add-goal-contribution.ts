import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addGoalContributionAction } from '../actions/add-goal-contribution';
import type { AddGoalContributionRequest } from '../model/api/goal';
import { GOALS_QUERY_KEY } from './use-get-goals';
import { goalContributionsQueryKey } from './use-goal-contributions';

export const useAddGoalContribution = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['add_goal_contribution'],
    mutationFn: async (data: AddGoalContributionRequest) => {
      const result = await addGoalContributionAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível salvar o aporte');
      }

      return result.data;
    },
    onSuccess: async (_data, variables) => {
      await client.refetchQueries({
        queryKey: GOALS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
      await client.refetchQueries({
        queryKey: goalContributionsQueryKey(variables.goalId),
        exact: false,
        type: 'all',
      });
    },
  });
};
