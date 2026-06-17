import type { CreditCardInstallmentLite } from './purchase';

export interface CreditCardInvoice {
  id: string;
  cardId: string;
  cardName: string;
  cardIsActive: boolean;
  referenceMonth: number;
  referenceYear: number;
  closingDate: string;
  dueDate: string;
  paymentDate: string;
  paymentDateOverridden: boolean;
  isPaid: boolean;
  paidAmount?: number;
  totalAmount: number;
  transactionId?: string;
  installments: CreditCardInstallmentLite[];
}

export type GetCardInvoicesResponse = CreditCardInvoice[];

export interface GetAllInvoicesFilters {
  from?: string;
  to?: string;
}

export type GetAllInvoicesResponse = CreditCardInvoice[];

export type GetInvoiceResponse = CreditCardInvoice;

export interface UpdateInvoicePaymentDateRequest {
  id: string;
  paymentDate: string;
}

export type UpdateInvoicePaymentDateResponse = CreditCardInvoice;

export interface PayInvoiceRequest {
  id: string;
  amount: number;
  paymentDate?: string;
  remainderInstallments?: number;
  interestRate?: number;
  installmentAmount?: number;
}

export type PayInvoiceResponse = CreditCardInvoice;

export type ReopenInvoiceResponse = CreditCardInvoice;
