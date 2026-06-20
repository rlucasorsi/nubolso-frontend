import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rollbackImportAction } from '../actions/rollback-import';
import { IMPORT_BATCHES_QUERY_KEY } from './use-get-import-batches';

export const useRollbackImport = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['rollback_import'],
    mutationFn: async (id: string) => {
      const result = await rollbackImportAction(id);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível desfazer a importação');
      }

      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        client.refetchQueries({ queryKey: IMPORT_BATCHES_QUERY_KEY, exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: ['list_entries'], exact: false, type: 'all' }),
      ]);
    },
  });
};
