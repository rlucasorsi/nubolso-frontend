'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { SimulatePurchaseRequest } from '../model/api/purchase';

export async function simulatePurchaseAction(data: SimulatePurchaseRequest) {
  try {
    return await creditCardsService.simulatePurchase(data);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
