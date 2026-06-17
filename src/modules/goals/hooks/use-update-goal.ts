import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGoalAction } from '../actions/update-goal';
import type { UpdateGoalRequest } from '../model/api/goal';
import { GOALS_QUERY_KEY } from './use-get-goals';

export const useUpdateGoal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_goal'],
    mutationFn: async (data: UpdateGoalRequest) => await updateGoalAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: GOALS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
