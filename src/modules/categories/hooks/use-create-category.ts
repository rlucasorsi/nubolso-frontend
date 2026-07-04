import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategoryAction } from '../actions/create-category';
import type { CreateCategoryRequest } from '../service/categories-service';

export const useCreateCategory = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_category'],
    mutationFn: async (data: CreateCategoryRequest) => await createCategoryAction(data),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['list_categories'] });
    },
  });
};
