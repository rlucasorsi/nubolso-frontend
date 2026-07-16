import type { CreditCardInstallmentLite } from './purchase';
import type { InstallmentAdvance } from './advance';

export interface InvoiceAdvancePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

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
  advances: InstallmentAdvance[];
  // Soma dos adiantamentos já debitados contra esta fatura antes do fechamento/pagamento final
  advancedAmount: number;
  advancePayments: InvoiceAdvancePayment[];
  // templateIds dos recorrentes de cartão já materializados como compra nesta fatura
  purchaseTemplateIds: string[];
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

export interface AdvanceInvoicePaymentRequest {
  id: string;
  amount: number;
  paymentDate: string;
}

export type AdvanceInvoicePaymentResponse = CreditCardInvoice;
