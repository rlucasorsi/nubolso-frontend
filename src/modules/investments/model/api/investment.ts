export type InvestmentType = 'CDB' | 'FII' | 'STOCK' | 'ETF' | 'OTHER';
export type InvestmentMovementType = 'CONTRIBUTION' | 'YIELD' | 'ADJUSTMENT';

export interface InvestmentMovement {
  id: string;
  type: InvestmentMovementType;
  amount: number;
  date: string;
  description: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  ticker: string | null;
  // Percentual do CDI que o CDB rende (ex: 110 = 110% do CDI). Só relevante
  // para type = CDB; puramente informativo.
  cdiPercentage: number | null;
  // Banco/corretora onde o investimento está alocado.
  institution: string | null;
  currentBalance: number;
  createdAt: string;
  movements: InvestmentMovement[];
}

export type GetAllInvestmentsResponse = Investment[];

export interface CreateInvestmentRequest {
  name: string;
  type: InvestmentType;
  ticker?: string;
  cdiPercentage?: number;
  institution: string;
}
export type CreateInvestmentResponse = Investment;

export interface UpdateInvestmentRequest {
  id: string;
  name?: string;
  ticker?: string;
  cdiPercentage?: number;
  institution?: string;
}
export type UpdateInvestmentResponse = Investment;

export interface DeleteInvestmentRequest {
  id: string;
}

export interface AddInvestmentMovementRequest {
  investmentId: string;
  type: InvestmentMovementType;
  amount: number;
  date?: string;
  description?: string;
}
export type AddInvestmentMovementResponse = Investment;

export interface RemoveInvestmentMovementRequest {
  investmentId: string;
  movementId: string;
}
export type RemoveInvestmentMovementResponse = Investment;

export interface ListInvestmentMovementsRequest {
  investmentId: string;
  page: number;
  limit: number;
}
export interface ListInvestmentMovementsResponse {
  data: InvestmentMovement[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface InvestmentQuote {
  ticker: string;
  price: number | null;
  previousClose: number | null;
  currency: string | null;
  asOf: string;
  available: boolean;
}

export interface InvestmentTickerSearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
}
