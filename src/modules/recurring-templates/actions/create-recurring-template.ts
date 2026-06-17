'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { CreateRecurringTemplateRequest } from '../model/api/create-recurring-template';

export async function createRecurringTemplateAction(data: CreateRecurringTemplateRequest) {
  try {
    return await recurringTemplatesService.create(data);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
