import { ExpenseType, FlowType } from '@/lib/cashflow';

export interface UpdateEntryRequest {
  id: string;
  description?: string;
  amount?: number;
  type?: FlowType | string;
  date?: string;
  categoryId?: string;
  isPaid?: boolean;
  tipoDespesa?: ExpenseType;
  templateId?: string | null;
}

export interface UpdateEntryResponse {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
}
