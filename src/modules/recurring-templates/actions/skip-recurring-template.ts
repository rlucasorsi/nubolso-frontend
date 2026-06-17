'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { SkipRecurringTemplateRequest } from '../model/api/skip-recurring-template';

export async function skipRecurringTemplateAction(data: SkipRecurringTemplateRequest) {
  try {
    const response = await recurringTemplatesService.skip(data);

    return {
      success: true,
      data: response,
      errors: null,
      message: null,
    };
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);

    return {
      success: false,
      data: null,
      errors: null,
      message,
    };
  }
}
