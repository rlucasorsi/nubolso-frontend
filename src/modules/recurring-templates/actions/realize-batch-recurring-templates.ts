'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export interface RealizeBatchItem {
  id: string;
  amount: number;
  date: string;
}

export async function realizeBatchRecurringTemplatesAction(items: RealizeBatchItem[]) {
  try {
    return await recurringTemplatesService.realizeBatch(items);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
