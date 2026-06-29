'use server';

import { notificationsService } from '../service/notifications-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { PushSubscriptionRequest } from '../model/api/notification';

export async function subscribePushAction(subscription: PushSubscriptionRequest) {
  try {
    return await notificationsService.subscribePush(subscription);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}

export async function unsubscribePushAction(endpoint: string) {
  try {
    return await notificationsService.unsubscribePush(endpoint);
  } catch (error) {
    const message = extractErrorMessage(error, ERROR_KEYS.AN_ERROR_OCCURED);
    throw new Error(message);
  }
}
