import { useQuery } from '@tanstack/react-query';
import { getAllCategoriesAction } from '../actions/get-all-categories';

export const useGetCategories = () => {
  return useQuery({
    queryKey: ['list_categories'],
    queryFn: async () => getAllCategoriesAction(),
    staleTime: 1000 * 60 * 5, // 5 minutos (categorias mudam pouco)
  });
};
