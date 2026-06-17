import { useQuery } from '@tanstack/react-query';
import { getAllInvoicesAction } from '../actions/get-all-invoices';
import type { GetAllInvoicesFilters } from '../model/api/invoice';

export const allCreditCardInvoicesQueryKey = (filters?: GetAllInvoicesFilters) => ['all_credit_card_invoices', filters ?? {}];

export const useGetAllInvoices = (filters?: GetAllInvoicesFilters, enabled = true) => {
  return useQuery({
    queryKey: allCreditCardInvoicesQueryKey(filters),
    queryFn: async () => getAllInvoicesAction(filters),
    enabled,
  });
};
