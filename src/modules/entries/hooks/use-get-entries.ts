import { useQuery } from '@tanstack/react-query';
import { getAllEntriesAction } from '../actions/get-all-entries';
import type { GetEntriesFilters } from '../service/entries-service';

export const useGetEntries = (filters?: GetEntriesFilters) => {
  return useQuery({
    queryKey: ['list_entries', filters ?? {}],
    queryFn: async () => getAllEntriesAction(filters),
  });
};
