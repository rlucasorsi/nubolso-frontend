import { FlowType } from "@/lib/cashflow";

export interface CreateEntryRequest {
  description: string;
  amount: number;
  type: FlowType | string;
  date: string;
  categoryId?: string;
  isPaid?: boolean;
}

export interface CreateEntryResponse {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
}
