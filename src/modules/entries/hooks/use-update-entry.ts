import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateEntryAction } from '../actions/update-entry';
import type { UpdateEntryRequest } from '../model/api/update-entry';
import type { GetAllEntriesResponse } from '../model/api/get-all-entries';

export const useUpdateEntry = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_entry'],
    mutationFn: async (data: UpdateEntryRequest) => await updateEntryAction(data),
    onMutate: async (data) => {
      await client.cancelQueries({ queryKey: ['list_entries'], exact: false });

      const snapshots = client.getQueriesData<GetAllEntriesResponse>({
        queryKey: ['list_entries'],
        exact: false,
      });

      client.setQueriesData<GetAllEntriesResponse>(
        { queryKey: ['list_entries'], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((entry) =>
              entry.id === data.id
                ? {
                    ...entry,
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.amount !== undefined && { amount: data.amount }),
                    ...(data.type !== undefined && { type: data.type }),
                    ...(data.date !== undefined && { date: data.date }),
                    ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
                  }
                : entry,
            ),
          };
        },
      );

      return { snapshots };
    },
    onError: (_err, _data, context) => {
      if (context?.snapshots) {
        for (const [queryKey, data] of context.snapshots) {
          client.setQueryData(queryKey, data);
        }
      }
    },
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ['list_entries'],
        exact: false,
        type: 'all',
      });
    },
  });
};
