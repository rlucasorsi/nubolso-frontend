import { useQuery } from '@tanstack/react-query';
import { getInvoiceAction } from '../actions/get-invoice';

export const creditCardInvoiceQueryKey = (id: string) => ['credit_card_invoice', id];

export const useGetInvoice = (id: string | undefined, enabled = true) => {
  return useQuery({
    queryKey: creditCardInvoiceQueryKey(id ?? ''),
    queryFn: async () => getInvoiceAction(id as string),
    enabled: enabled && !!id,
  });
};
