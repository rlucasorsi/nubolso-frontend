import { HttpClient } from '@/network/http-client';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  date: string;
  isPaid: boolean;
  isSkipped?: boolean;
  tipoDespesa?: 'fixa' | 'variavel' | null;
  templateId?: string | null;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface GetEntriesFilters {
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'investment';
  tipoDespesa?: 'fixa' | 'variavel' | null;
  categoryId?: string;
  isPaid?: boolean;
  view?: 'main' | 'ignored' | 'all';
  page?: number;
  limit?: number;
}

interface PaginatedTransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const entriesService = {
  getAll: async (filters?: GetEntriesFilters) => {
    const { type, ...rest } = filters ?? {};

    const params = {
      ...rest,
      type: type?.toUpperCase(),
    };

    const response = await HttpClient.get<PaginatedTransactionsResponse, typeof params>(
      '/transactions',
      { params },
    );

    return {
      data: response.data.map((t) => ({
        ...t,
        type: t.type.toLowerCase() as 'income' | 'expense' | 'investment',
      })),
      total: response.total,
      page: response.page,
      limit: response.limit,
      hasMore: response.hasMore,
    };
  },

  // O endpoint /transactions é paginado; várias telas (cashflow, saldo por dia,
  // faturas de cartão) precisam do histórico completo pra calcular corretamente,
  // então aqui percorremos todas as páginas em vez de confiar no limite padrão
  // do backend quando `limit` não é informado.
  getAllUnpaged: async (filters?: Omit<GetEntriesFilters, 'page' | 'limit'>) => {
    const limit = 200;
    let page = 1;
    let all: Array<Omit<Transaction, 'type'> & { type: 'income' | 'expense' | 'investment' }> = [];
    let total = 0;

    while (true) {
      const response = await entriesService.getAll({ ...filters, page, limit });
      all = all.concat(response.data);
      total = response.total;
      if (!response.hasMore) break;
      page += 1;
    }

    return { data: all, total, page: 1, limit: all.length, hasMore: false };
  },

  create: async (params: any) => {
    // Envia para o backend transformando o tipo para uppercase
    const payload = {
      ...params,
      type: params.type.toUpperCase(),
    };
    return HttpClient.post<any, any>('/transactions', payload);
  },

  update: async (params: any) => {
    const { id, ...rest } = params;
    const payload = {
      ...rest,
      type: rest.type?.toUpperCase(),
    };
    return HttpClient.patch<any, any>(`/transactions/${id}`, payload);
  },

  togglePaid: async (id: string) => {
    return HttpClient.patch<any, undefined>(`/transactions/${id}/toggle-paid`, undefined);
  },

  unskip: async (id: string) => {
    return HttpClient.patch<any, undefined>(`/transactions/${id}/unskip`, undefined);
  },

  delete: async (params: { id: string }) => {
    return HttpClient.delete(`/transactions/${params.id}`);
  },
};
