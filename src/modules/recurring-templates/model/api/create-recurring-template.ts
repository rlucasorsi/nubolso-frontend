import { FlowType } from '@/lib/cashflow';

export interface CreateRecurringTemplateRequest {
  description: string;
  estimatedAmount: number;
  type: FlowType | string;
  dayOfMonth: number;
  categoryId?: string;
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
