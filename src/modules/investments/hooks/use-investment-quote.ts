import { useQuery } from '@tanstack/react-query';
import { getInvestmentQuoteAction } from '../actions/get-investment-quote';

export const useInvestmentQuote = (ticker: string | null | undefined) => {
  return useQuery({
    queryKey: ['investment_quote', ticker],
    queryFn: async () => getInvestmentQuoteAction(ticker as string),
    enabled: !!ticker,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};
