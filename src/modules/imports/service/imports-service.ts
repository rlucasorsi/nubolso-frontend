import { HttpClient } from '@/network/http-client';
import type {
  ImportBatch,
  ImportBatchDetail,
  UploadOfxResponse,
  ConfirmImportRequest,
} from '../model/api/ofx-import';

export const importsService = {
  uploadOfx: async (formData: FormData) => {
    return HttpClient.post<UploadOfxResponse, FormData>('/imports/ofx', formData, { isMultipart: true });
  },

  getAll: async () => {
    return HttpClient.get<ImportBatch[], undefined>('/imports/ofx');
  },

  getOne: async (id: string) => {
    return HttpClient.get<ImportBatchDetail, undefined>(`/imports/ofx/${id}`);
  },

  confirm: async (id: string, data: ConfirmImportRequest) => {
    return HttpClient.post<ImportBatchDetail, ConfirmImportRequest>(`/imports/ofx/${id}/confirm`, data);
  },

  rollback: async (id: string) => {
    return HttpClient.post<ImportBatch, undefined>(`/imports/ofx/${id}/rollback`, undefined);
  },

  cancel: async (id: string) => {
    return HttpClient.delete<ImportBatch>(`/imports/ofx/${id}`);
  },
};
