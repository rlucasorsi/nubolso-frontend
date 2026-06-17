import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGoalAction } from '../actions/delete-goal';
import type { DeleteGoalRequest } from '../model/api/goal';
import { GOALS_QUERY_KEY } from './use-get-goals';

export const useDeleteGoal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_goal'],
    mutationFn: async (data: DeleteGoalRequest) => await deleteGoalAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: GOALS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
