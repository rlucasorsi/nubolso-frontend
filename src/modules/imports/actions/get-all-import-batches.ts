'use server';

import { importsService } from '../service/imports-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllImportBatchesAction() {
  try {
    return await importsService.getAll();
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
