'use server';

import { goalsService } from '../service/goals-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import type { ListGoalContributionsRequest } from '../model/api/goal';

export async function listGoalContributionsAction(data: ListGoalContributionsRequest) {
  try {
    return await goalsService.listContributions(data);
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
