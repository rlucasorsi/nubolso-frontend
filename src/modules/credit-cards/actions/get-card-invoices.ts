'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getCardInvoicesAction(cardId: string) {
  try {
    return await creditCardsService.getCardInvoices(cardId);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
