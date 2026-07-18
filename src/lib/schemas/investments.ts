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

export const createInvestmentSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(['CDB', 'FII', 'STOCK', 'OTHER']),
    institution: z.string().min(1, 'Banco/Corretora é obrigatório'),
    ticker: z.string().optional(),
    quantity: z.number().optional(),
    pricePerShare: z.string().optional(),
    currentBalance: z.string().optional(),
  })
  .refine((data) => (data.type === 'FII' || data.type === 'STOCK' ? !!data.ticker : true), {
    message: 'Ticker é obrigatório para FIIs e ações',
    path: ['ticker'],
  })
  .refine((data) => (data.type === 'FII' || data.type === 'STOCK' ? (data.quantity ?? 0) > 0 : true), {
    message: 'Quantidade deve ser maior do que 0',
    path: ['quantity'],
  })
  .refine(
    (data) => {
      if (data.type !== 'FII' && data.type !== 'STOCK') return true;
      const n = parseFloat((data.pricePerShare ?? '').replace(',', '.'));
      return !isNaN(n) && n > 0;
    },
    { message: 'Preço pago deve ser maior do que 0', path: ['pricePerShare'] },
  );

export const addMovementSchema = z.object({
  amount: positiveAmount,
  date: z.string().min(1, 'Data é obrigatória'),
});

export const updateInvestmentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  institution: z.string().min(1, 'Banco/Corretora é obrigatório'),
  ticker: z.string().optional(),
  cdiPercentage: z.number().optional(),
});

export type CreateInvestmentSchema = z.infer<typeof createInvestmentSchema>;
export type AddMovementSchema = z.infer<typeof addMovementSchema>;
export type UpdateInvestmentSchema = z.infer<typeof updateInvestmentSchema>;
