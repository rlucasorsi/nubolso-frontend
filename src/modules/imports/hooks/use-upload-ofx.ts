import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadOfxAction } from '../actions/upload-ofx';
import { IMPORT_BATCHES_QUERY_KEY } from './use-get-import-batches';
import { importBatchQueryKey } from './use-get-import-batch';

export const useUploadOfx = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['upload_ofx'],
    mutationFn: async (formData: FormData) => {
      const result = await uploadOfxAction(formData);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível importar o arquivo OFX');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      client.setQueryData(importBatchQueryKey(data.id), data);
      await client.refetchQueries({ queryKey: IMPORT_BATCHES_QUERY_KEY, exact: false, type: 'all' });
    },
  });
};
