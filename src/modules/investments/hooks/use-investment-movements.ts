import { useInfiniteQuery } from '@tanstack/react-query';
import { listInvestmentMovementsAction } from '../actions/list-investment-movements';

export const INVESTMENT_MOVEMENTS_PAGE_SIZE = 10;

export const investmentMovementsQueryKey = (investmentId: string) => [
  'investment_movements',
  investmentId,
];

export const useInvestmentMovements = (investmentId: string | undefined, enabled = true) => {
  return useInfiniteQuery({
    queryKey: investmentMovementsQueryKey(investmentId ?? ''),
    queryFn: async ({ pageParam }) =>
      listInvestmentMovementsAction({
        investmentId: investmentId as string,
        page: pageParam,
        limit: INVESTMENT_MOVEMENTS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: enabled && !!investmentId,
  });
};
