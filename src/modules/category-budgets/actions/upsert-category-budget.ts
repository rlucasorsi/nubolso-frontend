'use server';

import { categoryBudgetsService } from '../service/category-budgets-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { UpsertCategoryBudgetRequest } from '../service/category-budgets-service';

export async function upsertCategoryBudgetAction(data: UpsertCategoryBudgetRequest) {
  try {
    return await categoryBudgetsService.upsert(data);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
