import { HttpClient } from '@/network/http-client';

export interface RecurringTemplate {
  id: string;
  description: string;
  estimatedAmount: number;
  type: 'INCOME' | 'EXPENSE' | 'SPENDING';
  dayOfMonth: number;
  isActive: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  endDate?: string;
  totalOccurrences?: number;
  occurrenceCount?: number;
}

export const recurringTemplatesService = {
  getAll: async () => {
    return HttpClient.get<RecurringTemplate[], undefined>('/recurring-templates');
  },

  create: async (params: any) => {
    // Envia para o backend transformando o tipo para uppercase
    const payload = {
      ...params,
      type: params.type.toUpperCase(),
    };
    return HttpClient.post<RecurringTemplate, any>('/recurring-templates', payload);
  },

  update: async (params: any) => {
    const { id, ...rest } = params;
    const payload = {
      ...rest,
      type: rest.type?.toUpperCase(),
    };
    return HttpClient.patch<RecurringTemplate, any>(`/recurring-templates/${id}`, payload);
  },

  remove: async (params: { id: string }) => {
    return HttpClient.delete<RecurringTemplate>(`/recurring-templates/${params.id}`);
  },

  realize: async (params: { id: string; amount: number; date: string; isPaid?: boolean }) => {
    const { id, ...rest } = params;
    return HttpClient.post<any, any>(`/recurring-templates/${id}/realize`, rest);
  },

  skip: async (params: { id: string; date: string }) => {
    const { id, ...rest } = params;
    return HttpClient.post<any, any>(`/recurring-templates/${id}/skip`, rest);
  },

  realizeBatch: async (items: { id: string; amount: number; date: string }[]) => {
    return HttpClient.post<any, any>('/recurring-templates/realize-batch', { items });
  },
};
