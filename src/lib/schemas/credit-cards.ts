import { z } from 'zod';

const positiveAmount = z
  .string()
  .min(1, 'Valor é obrigatório')
  .refine(
    (v) => {
      const n = parseFloat(v.replace(',', '.'));
      return !isNaN(n) && n > 0;
    },
    { message: 'Valor deve ser maior do que 0' },
  );

export const creditCardFormSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
  paymentDay: z.number().int().min(1).max(31),
});

export const purchaseFormSchema = z.object({
  cardId: z.string().min(1, 'Selecione um cartão'),
  description: z.string().optional(),
  amount: positiveAmount,
  installmentsCount: z.number().int().min(1).max(48),
  purchaseDate: z.string().min(1, 'Data é obrigatória'),
});

export const payInvoiceFormSchema = z.object({
  amount: positiveAmount,
  remainderInstallments: z.number().int().min(1).max(12).optional(),
});

export type CreditCardFormSchema = z.infer<typeof creditCardFormSchema>;
export type PurchaseFormSchema = z.infer<typeof purchaseFormSchema>;
export type PayInvoiceFormSchema = z.infer<typeof payInvoiceFormSchema>;
