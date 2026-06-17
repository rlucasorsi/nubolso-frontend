'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { DeleteCreditCardRequest } from '../model/api/credit-card';

export async function deleteCreditCardAction(data: DeleteCreditCardRequest) {
  try {
    await creditCardsService.remove({ id: data.id });

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
