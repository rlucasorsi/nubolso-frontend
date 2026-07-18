'use server';

import { investmentsService } from '../service/investments-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { DeleteInvestmentRequest } from '../model/api/investment';

export async function deleteInvestmentAction(data: DeleteInvestmentRequest) {
  try {
    await investmentsService.delete(data);

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
