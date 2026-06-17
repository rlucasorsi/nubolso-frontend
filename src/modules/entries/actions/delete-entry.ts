'use server';

import { entriesService } from '../service/entries-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { DeleteEntryRequest } from '../model/api/delete-entry';

export async function deleteEntryAction(data: DeleteEntryRequest) {
  try {
    await entriesService.delete({ id: data.id });

    return {
      success: true,
      data: null,
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
