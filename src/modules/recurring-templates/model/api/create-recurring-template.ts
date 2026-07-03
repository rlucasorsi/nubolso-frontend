import { FlowType } from '@/lib/cashflow';

export interface CreateRecurringTemplateRequest {
  description: string;
  estimatedAmount: number;
  type: FlowType | string;
  dayOfMonth: number;
  categoryId?: string;
  creditCardId?: string;
  endDate?: string;
  totalOccurrences?: number;
}

export interface CreateRecurringTemplateResponse {
  id: string;
  description: string;
  estimatedAmount: number;
  type: string;
  dayOfMonth: number;
  isActive: boolean;
  categoryId?: string;
}
