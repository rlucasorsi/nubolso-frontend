'use server';

import { usersService } from '../service/users-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { UpdateUserRequest } from '../model/api/user';

export async function updateMeAction(data: UpdateUserRequest) {
  try {
    const response = await usersService.updateMe(data);

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
