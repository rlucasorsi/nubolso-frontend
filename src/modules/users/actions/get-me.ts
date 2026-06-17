'use server';

import { usersService } from '../service/users-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getMeAction() {
  try {
    return await usersService.getMe();
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new Error(message);
  }
}
