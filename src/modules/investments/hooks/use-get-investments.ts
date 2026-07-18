import { useQuery } from '@tanstack/react-query';
import { getAllInvestmentsAction } from '../actions/get-all-investments';

export const INVESTMENTS_QUERY_KEY = ['list_investments'];

export const useGetInvestments = () => {
  return useQuery({
    queryKey: INVESTMENTS_QUERY_KEY,
    queryFn: async () => getAllInvestmentsAction(),
    refetchOnWindowFocus: true,
  });
};
