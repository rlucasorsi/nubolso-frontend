import { useMutation } from '@tanstack/react-query';
import { simulatePurchaseAction } from '../actions/simulate-purchase';
import type { SimulatePurchaseRequest } from '../model/api/purchase';

export const useSimulatePurchase = () => {
  return useMutation({
    mutationKey: ['simulate_credit_card_purchase'],
    mutationFn: async (data: SimulatePurchaseRequest) => simulatePurchaseAction(data),
  });
};
