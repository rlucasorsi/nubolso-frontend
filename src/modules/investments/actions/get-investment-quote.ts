'use server';

import { investmentsService } from '../service/investments-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getInvestmentQuoteAction(ticker: string) {
  try {
    return await investmentsService.getQuote(ticker);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
