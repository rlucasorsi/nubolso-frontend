'use server';

import { categoriesService } from '../service/categories-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function deleteCategoryAction(id: string) {
  try {
    return await categoriesService.remove(id);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
