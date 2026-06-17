'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllRecurringTemplatesAction() {
  try {
    return await recurringTemplatesService.getAll();
  } catch (error) {
    const message = extractErrorMessage(error);

    throw new Error(message);
  }
}
