import { useQuery } from '@tanstack/react-query';
import { getAllEntriesAction, getAllEntriesUnpagedAction } from '../actions/get-all-entries';
import type { GetEntriesFilters } from '../service/entries-service';

export const useGetEntries = (filters?: GetEntriesFilters) => {
  return useQuery({
    queryKey: ['list_entries', filters ?? {}],
    queryFn: async () => getAllEntriesAction(filters),
  });
};

// Histórico completo de lançamentos (todas as páginas), usado por telas que
// precisam calcular saldo/projeções em cima de todos os registros — não apenas
// da página exibida na listagem paginada de /entries.
export const useGetAllEntries = (filters?: Omit<GetEntriesFilters, 'page' | 'limit'>) => {
  return useQuery({
    queryKey: ['list_entries', 'all', filters ?? {}],
    queryFn: async () => getAllEntriesUnpagedAction(filters),
  });
};
