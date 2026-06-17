import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEntryAction } from '../actions/create-entry';
import type { CreateEntryRequest } from '../model/api/create-entry';

export const useCreateEntry = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_entry'],
    mutationFn: async (data: CreateEntryRequest) => await createEntryAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_entries'],
        exact: false,
        type: 'all',
      });
    },
  });
};
