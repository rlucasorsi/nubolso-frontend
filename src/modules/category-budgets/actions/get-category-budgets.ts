'use server';

import { categoryBudgetsService } from '../service/category-budgets-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getCategoryBudgetsAction(periodStart: string) {
  try {
    return await categoryBudgetsService.getByPeriod(periodStart);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
