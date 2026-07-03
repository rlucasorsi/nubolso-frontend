import { FlowType } from '@/lib/cashflow';

export interface UpdateRecurringTemplateRequest {
  id: string;
  description?: string;
  estimatedAmount?: number;
  type?: FlowType | string;
  dayOfMonth?: number;
  categoryId?: string;
  // null desvincula o cartão; undefined mantém o vínculo atual
  creditCardId?: string | null;
  isActive?: boolean;
  endDate?: string | null;
  totalOccurrences?: number | null;
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
