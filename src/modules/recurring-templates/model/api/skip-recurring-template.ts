export interface SkipRecurringTemplateRequest {
  id: string;
  date: string;
}

export interface SkipRecurringTemplateResponse {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  isPaid: boolean;
  isSkipped: boolean;
  templateId: string;
}
