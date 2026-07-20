import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unskipEntryAction } from '../actions/unskip-entry';
import type { UnskipEntryRequest } from '../model/api/unskip-entry';

export const useUnskipEntry = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['unskip_entry'],
    mutationFn: async (data: UnskipEntryRequest) => await unskipEntryAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_entries'],
        exact: false,
        type: 'all',
      });
    },
  });
};
