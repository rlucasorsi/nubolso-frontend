'use server';

import { HttpClient } from '@/network/http-client';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export async function deletePurchaseAction(id: string) {
  try {
    return await HttpClient.delete(`/credit-cards/purchases/${id}`);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
