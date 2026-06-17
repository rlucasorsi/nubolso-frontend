'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { RealizeRecurringTemplateRequest } from '../model/api/realize-recurring-template';

export async function realizeRecurringTemplateAction(data: RealizeRecurringTemplateRequest) {
  try {
    return await recurringTemplatesService.realize(data);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
