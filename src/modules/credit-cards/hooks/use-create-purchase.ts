import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchaseAction } from '../actions/create-purchase';
import type { CreatePurchaseRequest } from '../model/api/purchase';
import { creditCardInvoicesQueryKey } from './use-get-card-invoices';
import { creditCardInvoiceQueryKey } from './use-get-invoice';

export const useCreatePurchase = () => {
  const client = useQueryClient();

  return useMutation({
    mutationKey: ['create_credit_card_purchase'],
    mutationFn: async (data: CreatePurchaseRequest) => {
      const result = await createPurchaseAction(data);

      if (!result.success || !result.data) {
        throw new Error(result.message ?? 'Não foi possível registrar a compra');
      }

      return result.data;
    },
    onSuccess: async (data) => {
      // Uma compra parcelada gera uma installment em cada fatura do plano —
      // invalida a query de cada uma pra não deixar um InvoiceDetailDrawer aberto
      // com o total desatualizado.
      const invoiceIds = [...new Set<string>(data.installments.map((i) => i.invoiceId))];
      await Promise.all([
        client.invalidateQueries({ queryKey: ['list_entries'] }),
        client.invalidateQueries({ queryKey: ['all_credit_card_invoices'] }),
        client.invalidateQueries({ queryKey: creditCardInvoicesQueryKey(data.cardId) }),
        ...invoiceIds.map((id) =>
          client.invalidateQueries({ queryKey: creditCardInvoiceQueryKey(id) }),
        ),
      ]);
    },
  });
};
