'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { GetAllInvoicesFilters } from '../model/api/invoice';

export async function getAllInvoicesAction(filters?: GetAllInvoicesFilters) {
  try {
    return await creditCardsService.getAllInvoices(filters);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
