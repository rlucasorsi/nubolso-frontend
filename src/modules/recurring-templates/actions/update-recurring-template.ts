'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { UpdateRecurringTemplateRequest } from '../model/api/update-recurring-template';

export async function updateRecurringTemplateAction(data: UpdateRecurringTemplateRequest) {
  try {
    return await recurringTemplatesService.update(data);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
