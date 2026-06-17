import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEntryAction } from '../actions/delete-entry';
import type { DeleteEntryRequest } from '../model/api/delete-entry';

export const useDeleteEntry = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_entry'],
    mutationFn: async (data: DeleteEntryRequest) => await deleteEntryAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_entries'],
        exact: false,
        type: 'all',
      });
    },
  });
};
