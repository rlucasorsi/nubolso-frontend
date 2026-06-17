'use server';

import { goalsService } from '../service/goals-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { AddGoalContributionRequest } from '../model/api/goal';

export async function addGoalContributionAction(data: AddGoalContributionRequest) {
  try {
    const response = await goalsService.addContribution(data);

    return {
      success: true,
      data: response,
      errors: null,
      message: null,
    };
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);

    return {
      success: false,
      data: null,
      errors: null,
      message,
    };
  }
}
