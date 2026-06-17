import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoalAction } from '../actions/create-goal';
import type { CreateGoalRequest } from '../model/api/goal';
import { GOALS_QUERY_KEY } from './use-get-goals';

export const useCreateGoal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_goal'],
    mutationFn: async (data: CreateGoalRequest) => await createGoalAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: GOALS_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
