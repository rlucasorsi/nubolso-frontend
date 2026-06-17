export interface RealizeRecurringTemplateRequest {
  id: string;
  amount: number;
  date: string;
  isPaid?: boolean;
}

export interface RealizeRecurringTemplateResponse {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  isPaid: boolean;
  templateId: string;
}
