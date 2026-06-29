'use server';

import { notificationsService } from '../service/notifications-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';

export async function getNotificationsAction(page = 1, pageSize = 20) {
  try {
    return await notificationsService.getAll(page, pageSize);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
