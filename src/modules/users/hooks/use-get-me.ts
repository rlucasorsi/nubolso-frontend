import { useQuery } from '@tanstack/react-query';
import { getMeAction } from '../actions/get-me';

export const ME_QUERY_KEY = ['me'];

export const useGetMe = () => {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => getMeAction(),
  });
};
