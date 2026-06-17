'use server';

import { categoriesService } from '../service/categories-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllCategoriesAction() {
  try {
    return await categoriesService.getAll();
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
