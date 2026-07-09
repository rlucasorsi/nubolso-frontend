'use server';

import { categoryBudgetsService } from '../service/category-budgets-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function deleteCategoryBudgetAction(id: string) {
  try {
    return await categoryBudgetsService.remove(id);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
