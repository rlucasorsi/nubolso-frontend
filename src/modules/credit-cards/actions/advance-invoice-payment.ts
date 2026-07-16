'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { AdvanceInvoicePaymentRequest } from '../model/api/invoice';

export async function advanceInvoicePaymentAction(data: AdvanceInvoicePaymentRequest) {
  try {
    const response = await creditCardsService.advanceInvoicePayment(data);

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
