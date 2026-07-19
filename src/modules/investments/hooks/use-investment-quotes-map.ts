import { useQueries } from '@tanstack/react-query';
import { getInvestmentQuoteAction } from '../actions/get-investment-quote';

// Mesma queryKey usada por useInvestmentQuote, então o cache é compartilhado
// com os cards individuais — não duplica requisição pro mesmo ticker.
export function useInvestmentQuotesMap(
  tickers: (string | null | undefined)[],
): Record<string, number | null> {
  const uniqueTickers = Array.from(new Set(tickers.filter((t): t is string => !!t)));

  const results = useQueries({
    queries: uniqueTickers.map((ticker) => ({
      queryKey: ['investment_quote', ticker],
      queryFn: () => getInvestmentQuoteAction(ticker),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const pricesByTicker: Record<string, number | null> = {};
  uniqueTickers.forEach((ticker, i) => {
    const data = results[i].data;
    pricesByTicker[ticker] = data?.available ? data.price : null;
  });

  return pricesByTicker;
}
