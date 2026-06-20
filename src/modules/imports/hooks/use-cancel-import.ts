import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelImportAction } from '../actions/cancel-import';
import { IMPORT_BATCHES_QUERY_KEY } from './use-get-import-batches';

export const useCancelImport = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['cancel_import'],
    mutationFn: async (id: string) => {
      const result = await cancelImportAction(id);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível cancelar a importação');
      }

      return result.data;
    },
    onSuccess: async () => {
      await client.refetchQueries({ queryKey: IMPORT_BATCHES_QUERY_KEY, exact: false, type: 'all' });
    },
  });
};
