import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategoryAction } from '../actions/delete-category';

export const useDeleteCategory = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['delete_category'],
    mutationFn: async (id: string) => await deleteCategoryAction(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['list_categories'] });
    },
  });
};
