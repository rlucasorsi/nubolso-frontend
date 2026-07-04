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

export type EndType = 'none' | 'date' | 'count';
export type PaymentMode = 'debit' | 'credit';

export const recurringTemplateFormSchema = z
  .object({
    description: z.string().min(1, 'Descrição é obrigatória'),
    estimatedAmount: positiveAmount,
    type: z.enum(['income', 'expense', 'investment']),
    dayOfMonth: z.number().int().min(1).max(31),
    categoryId: z.string().nullish(),
    paymentMode: z.enum(['debit', 'credit']),
    creditCardId: z.string().nullish(),
    endType: z.enum(['none', 'date', 'count']),
    endDate: z.string().optional(),
    totalOccurrences: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endType === 'date' && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data final',
        path: ['endDate'],
      });
    }
    if (data.endType === 'count' && (!data.totalOccurrences || data.totalOccurrences < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o número de ocorrências',
        path: ['totalOccurrences'],
      });
    }
    if (data.paymentMode === 'credit' && !data.creditCardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione um cartão',
        path: ['creditCardId'],
      });
    }
  });

export type RecurringTemplateFormSchema = z.infer<typeof recurringTemplateFormSchema>;
