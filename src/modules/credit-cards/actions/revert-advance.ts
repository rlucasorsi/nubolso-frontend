'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export async function revertAdvanceAction(advanceId: string) {
  try {
    await creditCardsService.revertAdvance(advanceId);
    return { success: true, message: null };
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    return { success: false, message };
  }
}
