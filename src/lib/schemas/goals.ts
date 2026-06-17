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

export const createGoalSchema = z.object({
  name: z.string().min(1, 'Nome da meta é obrigatório'),
  description: z.string().optional(),
  icon: z.string().min(1, 'Selecione um ícone'),
  targetAmount: positiveAmount,
  deadline: z.string().min(1, 'Prazo é obrigatório'),
});

export const addFundsSchema = z.object({
  amount: positiveAmount,
  date: z.string().min(1, 'Data é obrigatória'),
});

export type CreateGoalSchema = z.infer<typeof createGoalSchema>;
export type AddFundsSchema = z.infer<typeof addFundsSchema>;
