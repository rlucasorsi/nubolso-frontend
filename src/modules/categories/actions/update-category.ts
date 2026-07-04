'use server';

import { categoriesService } from '../service/categories-service';
import type { UpdateCategoryRequest } from '../service/categories-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function updateCategoryAction(data: UpdateCategoryRequest) {
  try {
    return await categoriesService.update(data);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
