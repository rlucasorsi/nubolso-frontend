import { HttpClient } from '@/network/http-client';
import type {
  CreditCard,
  GetAllCreditCardsResponse,
  CreateCreditCardRequest,
  CreateCreditCardResponse,
  UpdateCreditCardRequest,
  UpdateCreditCardResponse,
  DeleteCreditCardRequest,
} from '../model/api/credit-card';
import type {
  CreditCardPurchase,
  CreatePurchaseRequest,
  CreatePurchaseResponse,
  SimulatePurchaseRequest,
  SimulatePurchaseResponse,
  CreditCardInstallmentLite,
} from '../model/api/purchase';
import type {
  CreditCardInvoice,
  GetCardInvoicesResponse,
  GetAllInvoicesFilters,
  GetAllInvoicesResponse,
  GetInvoiceResponse,
  UpdateInvoicePaymentDateRequest,
  UpdateInvoicePaymentDateResponse,
  PayInvoiceRequest,
  PayInvoiceResponse,
  ReopenInvoiceResponse,
  InvoiceAdvancePayment,
  AdvanceInvoicePaymentRequest,
  AdvanceInvoicePaymentResponse,
} from '../model/api/invoice';
import type {
  InstallmentAdvance,
  AdvanceInstallmentsRequest,
  AnticipateInstallmentsRequest,
  AnticipateInstallmentsResponse,
} from '../model/api/advance';

interface CreditCardApi {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
  isActive: boolean;
  createdAt: string;
}

interface CreditCardPurchaseApi {
  id: string;
  description: string;
  totalAmount: number;
  installmentsCount: number;
  purchaseDate: string;
  cardId: string;
  originInvoiceId: string | null;
  templateId?: string | null;
  installments?: CreditCardInstallmentApi[];
  isCredit?: boolean;
  createdAt: string;
}

interface CreditCardInstallmentApi {
  id: string;
  number: number;
  totalCount: number;
  amount: number;
  purchaseId: string;
  invoiceId: string;
  purchase?: CreditCardPurchaseApi;
  invoice?: CreditCardInvoiceApi;
  isAnticipated?: boolean;
}

interface CreditCardAdvanceApi {
  id: string;
  purchaseId: string;
  invoiceId: string;
  installmentsCount: number;
  originalAmount: number;
  paidAmount: number;
  discount: number;
  anticipatedAt: string;
  purchase?: { description: string };
}

interface InvoiceAdvancePaymentApi {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}

interface CreditCardInvoiceApi {
  id: string;
  referenceMonth: number;
  referenceYear: number;
  closingDate: string;
  dueDate: string;
  paymentDate: string;
  paymentDateOverridden: boolean;
  cardId: string;
  isPaid: boolean;
  paidAmount: number | null;
  transactionId: string | null;
  totalAmount?: number;
  installments?: CreditCardInstallmentApi[];
  card?: CreditCardApi;
  remainderPurchases?: CreditCardPurchaseApi[];
  advances?: CreditCardAdvanceApi[];
  advancedAmount?: number;
  advancePayments?: InvoiceAdvancePaymentApi[];
}

function mapCreditCard(card: CreditCardApi): CreditCard {
  return {
    id: card.id,
    name: card.name,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    paymentDay: card.paymentDay,
    isActive: card.isActive,
    createdAt: card.createdAt.split('T')[0],
  };
}

function mapInstallment(
  installment: CreditCardInstallmentApi,
  invoiceContext?: { referenceMonth: number; referenceYear: number; paymentDate: string },
): CreditCardInstallmentLite {
  const invoice = installment.invoice ?? invoiceContext;

  return {
    id: installment.id,
    number: installment.number,
    totalCount: installment.totalCount,
    amount: installment.amount,
    invoiceId: installment.invoiceId,
    referenceMonth: invoice?.referenceMonth ?? 0,
    referenceYear: invoice?.referenceYear ?? 0,
    paymentDate: invoice?.paymentDate ? invoice.paymentDate.split('T')[0] : '',
    purchaseId: installment.purchaseId,
    purchaseDescription: installment.purchase?.description,
    purchaseDate: installment.purchase?.purchaseDate
      ? installment.purchase.purchaseDate.split('T')[0]
      : '',
    isAnticipated: installment.isAnticipated ?? false,
    isCredit: installment.purchase?.isCredit ?? false,
    purchaseCreatedAt: installment.purchase?.createdAt ?? '',
  };
}

function mapPurchase(purchase: CreditCardPurchaseApi): CreditCardPurchase {
  return {
    id: purchase.id,
    description: purchase.description,
    totalAmount: purchase.totalAmount,
    installmentsCount: purchase.installmentsCount,
    purchaseDate: purchase.purchaseDate.split('T')[0],
    cardId: purchase.cardId,
    originInvoiceId: purchase.originInvoiceId ?? undefined,
    installments: (purchase.installments ?? []).map((installment) => mapInstallment(installment)),
    isCredit: purchase.isCredit ?? false,
  };
}

function mapAdvancePayment(payment: InvoiceAdvancePaymentApi): InvoiceAdvancePayment {
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
    paymentDate: payment.paymentDate.split('T')[0],
    createdAt: payment.createdAt,
  };
}

function mapAdvance(advance: CreditCardAdvanceApi): InstallmentAdvance {
  return {
    id: advance.id,
    purchaseId: advance.purchaseId,
    invoiceId: advance.invoiceId,
    installmentsCount: advance.installmentsCount,
    originalAmount: advance.originalAmount,
    paidAmount: advance.paidAmount,
    discount: advance.discount,
    anticipatedAt: advance.anticipatedAt,
    purchaseDescription: advance.purchase?.description,
  };
}

function mapInvoice(invoice: CreditCardInvoiceApi): CreditCardInvoice {
  const invoiceContext = {
    referenceMonth: invoice.referenceMonth,
    referenceYear: invoice.referenceYear,
    paymentDate: invoice.paymentDate,
  };

  return {
    id: invoice.id,
    cardId: invoice.cardId,
    cardName: invoice.card?.name ?? '',
    cardIsActive: invoice.card?.isActive ?? true,
    referenceMonth: invoice.referenceMonth,
    referenceYear: invoice.referenceYear,
    closingDate: invoice.closingDate.split('T')[0],
    dueDate: invoice.dueDate.split('T')[0],
    paymentDate: invoice.paymentDate.split('T')[0],
    paymentDateOverridden: invoice.paymentDateOverridden,
    isPaid: invoice.isPaid,
    paidAmount: invoice.paidAmount ?? undefined,
    totalAmount: invoice.totalAmount ?? 0,
    transactionId: invoice.transactionId ?? undefined,
    installments: (invoice.installments ?? []).map((installment) =>
      mapInstallment(installment, invoiceContext),
    ),
    advances: (invoice.advances ?? []).map(mapAdvance),
    advancedAmount: invoice.advancedAmount ?? 0,
    advancePayments: (invoice.advancePayments ?? []).map(mapAdvancePayment),
    purchaseTemplateIds: [
      ...new Set(
        (invoice.installments ?? [])
          .map((installment) => installment.purchase?.templateId)
          .filter((templateId): templateId is string => !!templateId),
      ),
    ],
  };
}

export const creditCardsService = {
  getAll: async () => {
    const data = await HttpClient.get<CreditCardApi[], undefined>('/credit-cards');
    return data.map(mapCreditCard) as GetAllCreditCardsResponse;
  },

  create: async (params: CreateCreditCardRequest) => {
    const data = await HttpClient.post<CreditCardApi, CreateCreditCardRequest>(
      '/credit-cards',
      params,
    );
    return mapCreditCard(data) as CreateCreditCardResponse;
  },

  update: async (params: UpdateCreditCardRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.patch<CreditCardApi, Omit<UpdateCreditCardRequest, 'id'>>(
      `/credit-cards/${id}`,
      rest,
    );
    return mapCreditCard(data) as UpdateCreditCardResponse;
  },

  remove: async (params: DeleteCreditCardRequest) => {
    return HttpClient.delete(`/credit-cards/${params.id}`);
  },

  createPurchase: async (params: CreatePurchaseRequest) => {
    const data = await HttpClient.post<CreditCardPurchaseApi, CreatePurchaseRequest>(
      '/credit-cards/purchases',
      params,
    );
    return mapPurchase(data) as CreatePurchaseResponse;
  },

  simulatePurchase: async (params: SimulatePurchaseRequest) => {
    return HttpClient.post<SimulatePurchaseResponse, SimulatePurchaseRequest>(
      '/credit-cards/purchases/simulate',
      params,
    );
  },

  getCardInvoices: async (cardId: string) => {
    const data = await HttpClient.get<CreditCardInvoiceApi[], undefined>(
      `/credit-cards/${cardId}/invoices`,
    );
    return data.map((invoice) => mapInvoice(invoice)) as GetCardInvoicesResponse;
  },

  getAllInvoices: async (filters?: GetAllInvoicesFilters) => {
    const data = await HttpClient.get<CreditCardInvoiceApi[], GetAllInvoicesFilters>(
      '/credit-cards/invoices',
      {
        params: filters ?? {},
      },
    );
    return data.map((invoice) => mapInvoice(invoice)) as GetAllInvoicesResponse;
  },

  getInvoice: async (id: string) => {
    const data = await HttpClient.get<CreditCardInvoiceApi, undefined>(
      `/credit-cards/invoices/${id}`,
    );
    return mapInvoice(data) as GetInvoiceResponse;
  },

  updateInvoicePaymentDate: async (params: UpdateInvoicePaymentDateRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.patch<
      CreditCardInvoiceApi,
      Omit<UpdateInvoicePaymentDateRequest, 'id'>
    >(`/credit-cards/invoices/${id}`, rest);
    return mapInvoice(data) as UpdateInvoicePaymentDateResponse;
  },

  payInvoice: async (params: PayInvoiceRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.post<CreditCardInvoiceApi, Omit<PayInvoiceRequest, 'id'>>(
      `/credit-cards/invoices/${id}/pay`,
      rest,
    );
    return mapInvoice(data) as PayInvoiceResponse;
  },

  reopenInvoice: async (id: string) => {
    const data = await HttpClient.post<CreditCardInvoiceApi, undefined>(
      `/credit-cards/invoices/${id}/reopen`,
      undefined,
    );
    return mapInvoice(data) as ReopenInvoiceResponse;
  },

  advanceInvoicePayment: async (params: AdvanceInvoicePaymentRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.post<
      CreditCardInvoiceApi,
      Omit<AdvanceInvoicePaymentRequest, 'id'>
    >(`/credit-cards/invoices/${id}/advance-payment`, rest);
    return mapInvoice(data) as AdvanceInvoicePaymentResponse;
  },

  createCredit: async (params: CreatePurchaseRequest) => {
    const data = await HttpClient.post<CreditCardPurchaseApi, CreatePurchaseRequest>(
      '/credit-cards/purchases/credit',
      params,
    );
    return mapPurchase(data) as CreatePurchaseResponse;
  },

  advanceInstallments: async (params: AdvanceInstallmentsRequest) => {
    const { purchaseId, ...rest } = params;
    return HttpClient.post<unknown, typeof rest>(
      `/credit-cards/purchases/${purchaseId}/advance-installments`,
      rest,
    );
  },

  anticipateInstallments: async (cardId: string, params: AnticipateInstallmentsRequest) => {
    return HttpClient.post<AnticipateInstallmentsResponse, AnticipateInstallmentsRequest>(
      `/credit-cards/${cardId}/invoices/current/anticipate`,
      params,
    );
  },

  revertAdvance: async (advanceId: string) => {
    return HttpClient.delete(`/credit-cards/advances/${advanceId}`);
  },
};
