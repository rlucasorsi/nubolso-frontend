'use server';

import { investmentsService } from '../service/investments-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllInvestmentsAction() {
  try {
    return await investmentsService.getAll();
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
