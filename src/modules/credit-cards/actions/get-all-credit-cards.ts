'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllCreditCardsAction() {
  try {
    return await creditCardsService.getAll();
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
