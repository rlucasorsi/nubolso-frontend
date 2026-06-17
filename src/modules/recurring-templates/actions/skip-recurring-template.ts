'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { SkipRecurringTemplateRequest } from '../model/api/skip-recurring-template';

export async function skipRecurringTemplateAction(data: SkipRecurringTemplateRequest) {
  try {
    return await recurringTemplatesService.skip(data);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
