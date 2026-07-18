import { HttpClient } from '@/network/http-client';
import type {
  Investment,
  InvestmentMovement,
  GetAllInvestmentsResponse,
  CreateInvestmentRequest,
  CreateInvestmentResponse,
  UpdateInvestmentRequest,
  UpdateInvestmentResponse,
  DeleteInvestmentRequest,
  AddInvestmentMovementRequest,
  AddInvestmentMovementResponse,
  RemoveInvestmentMovementRequest,
  RemoveInvestmentMovementResponse,
  ListInvestmentMovementsRequest,
  ListInvestmentMovementsResponse,
  InvestmentQuote,
  InvestmentTickerSearchResult,
} from '../model/api/investment';

interface InvestmentMovementApi {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}

interface InvestmentApi {
  id: string;
  name: string;
  type: string;
  ticker: string | null;
  cdiPercentage: number | null;
  institution: string | null;
  currentBalance: number;
  createdAt: string;
  movements: InvestmentMovementApi[];
}

function mapMovement(movement: InvestmentMovementApi): InvestmentMovement {
  return {
    id: movement.id,
    type: movement.type as InvestmentMovement['type'],
    amount: movement.amount,
    date: movement.date.split('T')[0],
    description: movement.description,
  };
}

function mapInvestment(investment: InvestmentApi): Investment {
  return {
    id: investment.id,
    name: investment.name,
    type: investment.type as Investment['type'],
    ticker: investment.ticker,
    cdiPercentage: investment.cdiPercentage,
    institution: investment.institution,
    currentBalance: investment.currentBalance,
    createdAt: investment.createdAt.split('T')[0],
    movements: (investment.movements ?? []).map(mapMovement),
  };
}

export const investmentsService = {
  getAll: async () => {
    const data = await HttpClient.get<InvestmentApi[], undefined>('/investments');
    return data.map(mapInvestment) as GetAllInvestmentsResponse;
  },

  create: async (params: CreateInvestmentRequest) => {
    const data = await HttpClient.post<InvestmentApi, CreateInvestmentRequest>(
      '/investments',
      params,
    );
    return mapInvestment(data) as CreateInvestmentResponse;
  },

  update: async (params: UpdateInvestmentRequest) => {
    const { id, ...rest } = params;
    const data = await HttpClient.patch<InvestmentApi, Omit<UpdateInvestmentRequest, 'id'>>(
      `/investments/${id}`,
      rest,
    );
    return mapInvestment(data) as UpdateInvestmentResponse;
  },

  delete: async (params: DeleteInvestmentRequest) => {
    return HttpClient.delete(`/investments/${params.id}`);
  },

  addMovement: async (params: AddInvestmentMovementRequest) => {
    const { investmentId, ...rest } = params;
    const data = await HttpClient.post<
      InvestmentApi,
      Omit<AddInvestmentMovementRequest, 'investmentId'>
    >(`/investments/${investmentId}/movements`, rest);
    return mapInvestment(data) as AddInvestmentMovementResponse;
  },

  removeMovement: async (params: RemoveInvestmentMovementRequest) => {
    const data = await HttpClient.delete<InvestmentApi>(
      `/investments/${params.investmentId}/movements/${params.movementId}`,
    );
    return mapInvestment(data) as RemoveInvestmentMovementResponse;
  },

  listMovements: async (params: ListInvestmentMovementsRequest) => {
    const { investmentId, page, limit } = params;
    const data = await HttpClient.get<
      {
        data: InvestmentMovementApi[];
        page: number;
        limit: number;
        total: number;
        hasMore: boolean;
      },
      { page: number; limit: number }
    >(`/investments/${investmentId}/movements`, { params: { page, limit } });

    return {
      ...data,
      data: data.data.map(mapMovement),
    } as ListInvestmentMovementsResponse;
  },

  getQuote: async (ticker: string) => {
    return HttpClient.get<InvestmentQuote, { ticker: string }>('/investments/quote', {
      params: { ticker },
    });
  },

  searchTickers: async (query: string) => {
    return HttpClient.get<InvestmentTickerSearchResult[], { q: string }>(
      '/investments/search',
      { params: { q: query } },
    );
  },
};
