'use server';

import { recurringTemplatesService } from '../service/recurring-templates-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { DeleteRecurringTemplateRequest } from '../model/api/delete-recurring-template';

export async function deleteRecurringTemplateAction(data: DeleteRecurringTemplateRequest) {
  try {
    await recurringTemplatesService.remove({ id: data.id });
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
