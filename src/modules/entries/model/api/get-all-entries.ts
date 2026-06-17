export interface TransactionFromApi {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
}

export type GetAllEntriesResponse = TransactionFromApi[];
