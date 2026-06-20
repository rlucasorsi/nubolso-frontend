import { useQuery } from '@tanstack/react-query';
import { getImportBatchAction } from '../actions/get-import-batch';

export const importBatchQueryKey = (id: string) => ['import_batch', id];

export const useGetImportBatch = (id: string | undefined) => {
  return useQuery({
    queryKey: importBatchQueryKey(id ?? ''),
    queryFn: async () => getImportBatchAction(id as string),
    enabled: !!id,
  });
};
