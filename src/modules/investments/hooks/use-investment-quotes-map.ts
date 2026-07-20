import { useQueries } from '@tanstack/react-query';
import { getInvestmentQuoteAction } from '../actions/get-investment-quote';

export interface InvestmentQuotesMapResult {
  pricesByTicker: Record<string, number | null>;
  // true enquanto qualquer cotação ainda não resolveu. Consumidores que
  // calculam totais/rendimentos a partir dos preços devem esperar isso virar
  // false antes de exibir o resultado — senão o número muda visivelmente à
  // medida que cada cotação chega (cai no fallback sem cotação, depois
  // recalcula com o preço de mercado).
  isLoading: boolean;
}

// Mesma queryKey usada por useInvestmentQuote, então o cache é compartilhado
// com os cards individuais — não duplica requisição pro mesmo ticker.
export function useInvestmentQuotesMap(
  tickers: (string | null | undefined)[],
): InvestmentQuotesMapResult {
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

  return { pricesByTicker, isLoading: results.some((r) => r.isLoading) };
}
