'use server';

import { entriesService, type GetEntriesFilters } from '../service/entries-service';
import { extractErrorMessage } from '@/shared/utils/extract-error-message';

export async function getAllEntriesAction(filters?: GetEntriesFilters) {
  try {
    return await entriesService.getAll(filters);
  } catch (error) {
    const message = extractErrorMessage(error);

    throw new Error(message);
  }
}
