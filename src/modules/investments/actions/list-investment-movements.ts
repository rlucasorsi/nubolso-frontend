'use server';

import { investmentsService } from '../service/investments-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { ListInvestmentMovementsRequest } from '../model/api/investment';

export async function listInvestmentMovementsAction(
  data: ListInvestmentMovementsRequest,
) {
  try {
    return await investmentsService.listMovements(data);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
