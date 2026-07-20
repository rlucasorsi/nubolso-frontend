'use server';

import { entriesService } from '../service/entries-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { UnskipEntryRequest } from '../model/api/unskip-entry';

export async function unskipEntryAction(data: UnskipEntryRequest) {
  try {
    await entriesService.unskip(data.id);

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
