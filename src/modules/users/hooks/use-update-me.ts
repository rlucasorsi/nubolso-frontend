import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMeAction } from '../actions/update-me';
import type { UpdateUserRequest } from '../model/api/user';
import { ME_QUERY_KEY } from './use-get-me';

export const useUpdateMe = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_me'],
    mutationFn: async (data: UpdateUserRequest) => await updateMeAction(data),
    onSuccess: async () => {
      await client.refetchQueries({
        queryKey: ME_QUERY_KEY,
        exact: false,
        type: 'all',
      });
    },
  });
};
