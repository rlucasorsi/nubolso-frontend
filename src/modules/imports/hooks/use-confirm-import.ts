import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmImportAction } from '../actions/confirm-import';
import type { ConfirmImportRequest } from '../model/api/ofx-import';
import { IMPORT_BATCHES_QUERY_KEY } from './use-get-import-batches';
import { importBatchQueryKey } from './use-get-import-batch';

export const useConfirmImport = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['confirm_import'],
    mutationFn: async ({ id, data }: { id: string; data: ConfirmImportRequest }) => {
      const result = await confirmImportAction(id, data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível confirmar a importação');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        client.refetchQueries({ queryKey: IMPORT_BATCHES_QUERY_KEY, exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: importBatchQueryKey(data.id), exact: false, type: 'all' }),
        client.refetchQueries({ queryKey: ['list_entries'], exact: false, type: 'all' }),
      ]);
    },
  });
};
