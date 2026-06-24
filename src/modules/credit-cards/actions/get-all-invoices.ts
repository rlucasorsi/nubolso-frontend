'use server';

import { creditCardsService } from '../service/credit-cards-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { GetAllInvoicesFilters } from '../model/api/invoice';

export async function getAllInvoicesAction(filters?: GetAllInvoicesFilters) {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    console.log(
      '[DEBUG] getAllInvoicesAction token:',
      token ? `${token.slice(0, 20)}...` : 'MISSING',
    );
    return await creditCardsService.getAllInvoices(filters);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
