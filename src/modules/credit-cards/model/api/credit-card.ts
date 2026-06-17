export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
  isActive: boolean;
  createdAt: string;
}

export type GetAllCreditCardsResponse = CreditCard[];

export interface CreateCreditCardRequest {
  name: string;
  closingDay: number;
  dueDay: number;
  paymentDay: number;
}

export type CreateCreditCardResponse = CreditCard;

export interface UpdateCreditCardRequest {
  id: string;
  name?: string;
  closingDay?: number;
  dueDay?: number;
  paymentDay?: number;
  isActive?: boolean;
}

export type UpdateCreditCardResponse = CreditCard;

export interface DeleteCreditCardRequest {
  id: string;
}
