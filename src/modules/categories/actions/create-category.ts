'use server';

import { categoriesService } from '../service/categories-service';
import type { CreateCategoryRequest } from '../service/categories-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function createCategoryAction(data: CreateCategoryRequest) {
  try {
    return await categoriesService.create(data);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
