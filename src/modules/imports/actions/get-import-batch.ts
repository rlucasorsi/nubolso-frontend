'use server';

import { importsService } from '../service/imports-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getImportBatchAction(id: string) {
  try {
    return await importsService.getOne(id);
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
