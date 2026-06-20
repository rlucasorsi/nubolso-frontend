'use server';

import { importsService } from '../service/imports-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';
import { ERROR_KEYS } from '@/shared/constants/error-keys.constant';
import type { ConfirmImportRequest } from '../model/api/ofx-import';

export async function confirmImportAction(id: string, data: ConfirmImportRequest) {
  try {
    const response = await importsService.confirm(id, data);

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
