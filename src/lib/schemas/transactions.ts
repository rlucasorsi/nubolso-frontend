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

export const entryFormSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  amount: positiveAmount,
  type: z.enum(['income', 'expense', 'investment']),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tipoDespesa: z.enum(['fixa', 'variavel']).nullish(),
});

export type EntryFormSchema = z.infer<typeof entryFormSchema>;
