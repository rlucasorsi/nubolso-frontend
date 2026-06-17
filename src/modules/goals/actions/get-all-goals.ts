'use server';

import { goalsService } from '../service/goals-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllGoalsAction() {
  try {
    return await goalsService.getAll();
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
