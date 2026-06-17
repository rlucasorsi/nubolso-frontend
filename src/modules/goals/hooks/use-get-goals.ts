import { useQuery } from '@tanstack/react-query';
import { getAllGoalsAction } from '../actions/get-all-goals';

export const GOALS_QUERY_KEY = ['list_goals'];

export const useGetGoals = () => {
  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: async () => getAllGoalsAction(),
    refetchOnWindowFocus: true,
  });
};
