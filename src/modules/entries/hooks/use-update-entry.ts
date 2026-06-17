import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEntryAction } from '../actions/update-entry';
import type { UpdateEntryRequest } from '../model/api/update-entry';

export const useUpdateEntry = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_entry'],
    mutationFn: async (data: UpdateEntryRequest) => await updateEntryAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_entries'],
        exact: false,
        type: 'all',
      });
    },
  });
};
