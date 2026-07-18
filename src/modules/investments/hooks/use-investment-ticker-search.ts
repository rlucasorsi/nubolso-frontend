import { useQuery } from '@tanstack/react-query';
import { searchInvestmentTickersAction } from '../actions/search-investment-tickers';

// `query` deve já vir debounced do componente chamador.
export const useInvestmentTickerSearch = (query: string) => {
  return useQuery({
    queryKey: ['investment_ticker_search', query],
    queryFn: async () => searchInvestmentTickersAction(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
    retry: false,
  });
};
