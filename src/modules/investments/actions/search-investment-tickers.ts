'use server';

import { investmentsService } from '../service/investments-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function searchInvestmentTickersAction(query: string) {
  try {
    return await investmentsService.searchTickers(query);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
