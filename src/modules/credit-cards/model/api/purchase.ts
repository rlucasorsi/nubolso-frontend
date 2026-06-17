export interface CreditCardInstallmentLite {
  id: string;
  purchaseId: string;
  number: number;
  totalCount: number;
  amount: number;
  invoiceId: string;
  referenceMonth: number;
  referenceYear: number;
  paymentDate: string;
  purchaseDescription?: string;
}

export interface CreditCardPurchase {
  id: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  purchaseDate: string;
  cardId: string;
  originInvoiceId?: string;
  installments: CreditCardInstallmentLite[];
}

export interface CreatePurchaseRequest {
  cardId: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  purchaseDate: string;
}

export type CreatePurchaseResponse = CreditCardPurchase;

export interface SimulatedInstallment {
  number: number;
  totalCount: number;
  amount: number;
  referenceMonth: number;
  referenceYear: number;
  paymentDate: string;
  invoiceExists: boolean;
  invoiceCurrentTotal: number;
  invoiceProjectedTotal: number;
}

export interface SimulatedImpactedInvoice {
  referenceMonth: number;
  referenceYear: number;
  paymentDate: string;
  currentTotal: number;
  projectedTotal: number;
  delta: number;
}

export interface SimulatePurchaseRequest {
  cardId: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  purchaseDate: string;
}

export interface SimulatePurchaseResponse {
  installments: SimulatedInstallment[];
  impactedInvoices: SimulatedImpactedInvoice[];
}
