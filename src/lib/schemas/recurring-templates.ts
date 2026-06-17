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

export const recurringTemplateFormSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  estimatedAmount: positiveAmount,
  type: z.enum(['income', 'expense', 'spending']),
  dayOfMonth: z.number().int().min(1).max(31),
  categoryId: z.string().nullish(),
});

export type RecurringTemplateFormSchema = z.infer<typeof recurringTemplateFormSchema>;
