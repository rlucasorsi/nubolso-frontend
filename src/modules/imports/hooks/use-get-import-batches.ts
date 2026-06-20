import { useQuery } from '@tanstack/react-query';
import { getAllImportBatchesAction } from '../actions/get-all-import-batches';

export const IMPORT_BATCHES_QUERY_KEY = ['list_import_batches'];

export const useGetImportBatches = (enabled = true) => {
  return useQuery({
    queryKey: IMPORT_BATCHES_QUERY_KEY,
    queryFn: async () => getAllImportBatchesAction(),
    enabled,
  });
};
