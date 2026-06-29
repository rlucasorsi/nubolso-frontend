'use server';

import { notificationsService } from '../service/notifications-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export async function getUnreadCountAction() {
  try {
    return await notificationsService.getUnreadCount();
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
