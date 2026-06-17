'use server';

import { entriesService } from '../service/entries-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { UpdateEntryRequest } from '../model/api/update-entry';

export async function updateEntryAction(data: UpdateEntryRequest) {
  try {
    return await entriesService.update(data);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
