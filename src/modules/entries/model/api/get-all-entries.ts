export interface TransactionFromApi {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  tipoDespesa?: 'fixa' | 'variavel' | null;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
}

export interface GetAllEntriesResponse {
  data: TransactionFromApi[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
