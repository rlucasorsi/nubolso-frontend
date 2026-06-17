'use server';

import { entriesService } from '../service/entries-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { CreateEntryRequest } from '../model/api/create-entry';

export async function createEntryAction(data: CreateEntryRequest) {
  try {
    const response = await entriesService.create(data);

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
