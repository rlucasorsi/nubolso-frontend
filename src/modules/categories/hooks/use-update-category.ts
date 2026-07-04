import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCategoryAction } from '../actions/update-category';
import type { UpdateCategoryRequest } from '../service/categories-service';

export const useUpdateCategory = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['update_category'],
    mutationFn: async (data: UpdateCategoryRequest) => await updateCategoryAction(data),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['list_categories'] });
    },
  });
};
