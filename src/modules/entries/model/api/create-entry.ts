import { ExpenseType, FlowType } from '@/lib/cashflow';

export interface CreateEntryRequest {
  description: string;
  amount: number;
  type: FlowType | string;
  date: string;
  categoryId?: string;
  isPaid?: boolean;
  tipoDespesa?: ExpenseType;
}

export interface CreateEntryResponse {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
}
