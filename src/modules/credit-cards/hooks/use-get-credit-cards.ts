import { useQuery } from '@tanstack/react-query';
import { getAllCreditCardsAction } from '../actions/get-all-credit-cards';

export const CREDIT_CARDS_QUERY_KEY = ['list_credit_cards'];

export const useGetCreditCards = () => {
  return useQuery({
    queryKey: CREDIT_CARDS_QUERY_KEY,
    queryFn: async () => getAllCreditCardsAction(),
    staleTime: 5 * 60 * 1000,
  });
};
