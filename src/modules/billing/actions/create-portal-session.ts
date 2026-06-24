'use server';

import { billingService } from '../service/billing-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export async function createPortalSessionAction() {
  try {
    const url = await billingService.createPortalSession();
    return { success: true, data: url, message: null };
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    return { success: false, data: null, message };
  }
}
