'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getInvoiceAction(id: string) {
  try {
    return await creditCardsService.getInvoice(id);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
