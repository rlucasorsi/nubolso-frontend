'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { UpdateRecurringTemplateRequest } from '../model/api/update-recurring-template';

export async function updateRecurringTemplateAction(data: UpdateRecurringTemplateRequest) {
  try {
    const response = await recurringTemplatesService.update(data);

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
