import { useQuery } from '@tanstack/react-query';
import { getCardInvoicesAction } from '../actions/get-card-invoices';

export const creditCardInvoicesQueryKey = (cardId: string) => ['credit_card_invoices', cardId];

export const useGetCardInvoices = (cardId: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: creditCardInvoicesQueryKey(cardId ?? ''),
    queryFn: async () => getCardInvoicesAction(cardId as string),
    enabled: enabled && !!cardId,
  });
};
