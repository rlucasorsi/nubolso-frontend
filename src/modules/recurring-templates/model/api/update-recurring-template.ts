import { FlowType } from '@/lib/cashflow';

export interface UpdateRecurringTemplateRequest {
  id: string;
  description?: string;
  estimatedAmount?: number;
  type?: FlowType | string;
  dayOfMonth?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface UpdateRecurringTemplateResponse {
  id: string;
  description: string;
  estimatedAmount: number;
  type: string;
  dayOfMonth: number;
  isActive: boolean;
  categoryId?: string;
}
