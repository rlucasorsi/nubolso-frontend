import { useInfiniteQuery } from '@tanstack/react-query';
import { listGoalContributionsAction } from '../actions/list-goal-contributions';

export const GOAL_CONTRIBUTIONS_PAGE_SIZE = 5;

export const goalContributionsQueryKey = (goalId: string) => ['goal_contributions', goalId];

export const useGoalContributions = (goalId: string | undefined, enabled = true) => {
  return useInfiniteQuery({
    queryKey: goalContributionsQueryKey(goalId ?? ''),
    queryFn: async ({ pageParam }) =>
      listGoalContributionsAction({ goalId: goalId as string, page: pageParam, limit: GOAL_CONTRIBUTIONS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && !!goalId,
  });
};
