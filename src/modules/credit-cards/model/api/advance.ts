export interface InstallmentAdvance {
  id: string;
  purchaseId: string;
  invoiceId: string;
  installmentsCount: number;
  originalAmount: number;
  paidAmount: number;
  discount: number;
  anticipatedAt: string;
  purchaseDescription?: string;
}

export interface AnticipateInstallmentsRequest {
  purchaseId: string;
  installmentsCount: number;
  paidAmount: number;
}

export interface AnticipateInstallmentsResponse {
  advance: InstallmentAdvance;
}

export interface AdvanceInstallmentsRequest {
  purchaseId: string;
  targetYear?: number;
  targetMonth?: number;
}
