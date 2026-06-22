'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { AnticipateInstallmentsRequest } from '../model/api/advance';

export async function anticipateInstallmentsAction(cardId: string, data: AnticipateInstallmentsRequest) {
  try {
    const response = await creditCardsService.anticipateInstallments(cardId, data);

    return {
      success: true,
      data: response,
      message: null,
    };
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);

    return {
      success: false,
      data: null,
      message,
    };
  }
}
